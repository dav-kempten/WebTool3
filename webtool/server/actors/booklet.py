# -*- coding: utf-8 -*-

import os
import uuid
import shutil
import tempfile
from subprocess import DEVNULL, run

from requests import request
import dramatiq

BOOKLET_URL = 'https://webtool.dav-kempten.de/api/client/booklets/'
BOOKLET_DIR = '/var/www/webtool/booklets/'


@dramatiq.actor
def update_booklet_list(pk):
    import django
    django.setup()

    from django import db
    from server.models import Booklet

    try:
        uuid.UUID(str(pk))
    except ValueError:
        print(f'Booklet {pk} not available')
        return

    try:
        booklet = Booklet.objects.get(pk=str(pk))
    except Booklet.DoesNotExist:
        print(f'Booklet {pk} not available')
        return

    db.connections.close_all()
    request('REFRESH', f'{BOOKLET_URL}{pk}/')
    request('REFRESH', BOOKLET_URL)


@dramatiq.actor
def create_booklet_pdf(pk):

    import django
    django.setup()

    from django import db
    from server.models import Booklet

    try:
        uuid.UUID(str(pk))
    except ValueError:
        print(f'Booklet {pk} not available')
        return

    try:
        booklet = Booklet.objects.get(pk=str(pk))
    except Booklet.DoesNotExist:
        print(f'Booklet {pk} not available')
        return

    # Every path below ends in "done" or "failed". Before, a first LaTeX run
    # without a PDF set no status at all, so the booklet stayed "pending" and
    # the homepage waited for good (that is how a missing soul.sty hid).
    status = Booklet.STATUS_FAILED
    try:
        content = booklet.render_source()
        transformer = booklet.render_transformer()
        with tempfile.TemporaryDirectory() as tempdir:
            # Twice, so the references resolve on the second run.
            pdf = _latex(tempdir, 'content', content, runs=2, check_exit=True)
            if pdf and booklet.format == Booklet.FORMAT_PRINT:
                pdf = _latex(tempdir, 'booklet', transformer, runs=1, check_exit=False)
            if pdf:
                shutil.move(pdf, os.path.join(BOOKLET_DIR, f'{pk}.pdf'))
                status = Booklet.STATUS_DONE
                print(f'{booklet.format} booklet {pk} is ready for download', flush=True)
    except Exception as e:
        print(f'Booklet {pk} failed: {e!r}', flush=True)

    booklet.status = status
    booklet.save()

    db.connections.close_all()
    request('REFRESH', f'{BOOKLET_URL}{pk}/')


def _latex(tempdir, name, source, runs, check_exit):
    """
    Compiles ``name.tex`` from ``source`` in ``tempdir`` and returns the path of
    the PDF, or None. Every run has to leave a PDF; with ``check_exit`` the last
    run must also exit cleanly (as before: the content is strict, the print
    imposition only needs its PDF). A failed run is reported with the error
    lines from the LaTeX log, since batch mode prints nothing.
    """
    with open(os.path.join(tempdir, f'{name}.tex'), 'x', encoding='utf-8') as f:
        f.write(source)
    pdf = os.path.join(tempdir, f'{name}.pdf')
    for i in range(runs):
        process = run(
            ['pdflatex', '-interaction=batchmode', f'{name}.tex'],
            cwd=tempdir, stdout=DEVNULL, stderr=DEVNULL,
        )
        last = i == runs - 1
        if not os.path.isfile(pdf) or (check_exit and last and process.returncode != 0):
            print(f'LaTeX failed on {name}.tex (exit {process.returncode}):', flush=True)
            for line in _latex_errors(os.path.join(tempdir, f'{name}.log')):
                print(f'  {line}', flush=True)
            return None
    return pdf


def _latex_errors(log, limit=10):
    """The "! ..." lines of a LaTeX log, e.g. "! LaTeX Error: File `soul.sty' not found."."""
    try:
        with open(log, encoding='utf-8', errors='replace') as f:
            return [line.rstrip() for line in f if line.startswith('!')][:limit]
    except OSError:
        return ['(no log written)']
