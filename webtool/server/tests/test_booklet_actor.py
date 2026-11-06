# -*- coding: utf-8 -*-
"""
create_booklet_pdf must always leave a final status. Before, a first LaTeX run
without a PDF set none, so the booklet stayed "pending" and the homepage waited
for good.

pdflatex is replaced by a fake that writes (or withholds) the PDF; rendering,
the Varnish REFRESH and the connection reset are stubbed out.
"""
import os
from types import SimpleNamespace

import dramatiq
import pytest
from dramatiq.brokers.stub import StubBroker

# Before the actors are imported, or they would bind to a RabbitMQ broker.
dramatiq.set_broker(StubBroker())

from django import db  # noqa: E402

from server.actors import booklet as actor  # noqa: E402
from server.models import Booklet  # noqa: E402

pytestmark = pytest.mark.django_db


@pytest.fixture
def latex(monkeypatch, tmp_path):
    """Returns the fake's settings: which .tex files get a PDF, and the exit code."""
    fake = SimpleNamespace(produces={'content', 'booklet'}, exit=0, calls=[])

    def run(args, cwd, **kwargs):
        name = args[-1].removesuffix('.tex')
        fake.calls.append(name)
        if name in fake.produces:
            open(os.path.join(cwd, f'{name}.pdf'), 'wb').write(b'%PDF-1.5')
        else:
            open(os.path.join(cwd, f'{name}.log'), 'w').write(
                "This is pdfTeX\n! LaTeX Error: File `soul.sty' not found.\n! Emergency stop.\n"
            )
        return SimpleNamespace(returncode=fake.exit)

    out = tmp_path / 'booklets'
    out.mkdir()
    monkeypatch.setattr(actor, 'run', run)
    monkeypatch.setattr(actor, 'request', lambda *a, **k: None)
    monkeypatch.setattr(actor, 'BOOKLET_DIR', str(out))
    monkeypatch.setattr(db.connections, 'close_all', lambda: None)
    monkeypatch.setattr(Booklet, 'render_source', lambda self: 'content')
    monkeypatch.setattr(Booklet, 'render_transformer', lambda self, *a, **k: 'booklet')
    fake.out = out
    return fake


def make_booklet(fmt=Booklet.FORMAT_DESKTOP):
    return Booklet.objects.create(references=['SKA-001'], format=fmt)


def status(booklet):
    booklet.refresh_from_db()
    return booklet.status


def test_desktop_booklet_is_done(latex):
    booklet = make_booklet()
    actor.create_booklet_pdf(str(booklet.pk))
    assert status(booklet) == Booklet.STATUS_DONE
    assert (latex.out / f'{booklet.pk}.pdf').is_file()
    assert latex.calls == ['content', 'content']


def test_print_booklet_is_imposed_and_done(latex):
    booklet = make_booklet(Booklet.FORMAT_PRINT)
    actor.create_booklet_pdf(str(booklet.pk))
    assert status(booklet) == Booklet.STATUS_DONE
    assert latex.calls == ['content', 'content', 'booklet']


def test_missing_pdf_on_first_run_fails_instead_of_pending(latex, capsys):
    latex.produces = set()
    latex.exit = 1
    booklet = make_booklet()
    actor.create_booklet_pdf(str(booklet.pk))
    assert status(booklet) == Booklet.STATUS_FAILED
    assert latex.calls == ['content']
    assert "File `soul.sty' not found" in capsys.readouterr().out


def test_failed_imposition_fails(latex):
    latex.produces = {'content'}
    booklet = make_booklet(Booklet.FORMAT_PRINT)
    actor.create_booklet_pdf(str(booklet.pk))
    assert status(booklet) == Booklet.STATUS_FAILED
    assert not (latex.out / f'{booklet.pk}.pdf').exists()


def test_rendering_error_fails(latex, monkeypatch):
    def broken(self):
        raise ValueError('kaputt')

    monkeypatch.setattr(Booklet, 'render_source', broken)
    booklet = make_booklet()
    actor.create_booklet_pdf(str(booklet.pk))
    assert status(booklet) == Booklet.STATUS_FAILED
