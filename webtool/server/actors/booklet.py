# -*- coding: utf-8 -*-

import os
import uuid
import shutil
import tempfile
from requests import request
import dramatiq

from server.latex import compile_latex

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
            pdf = compile_latex(tempdir, 'content', content, runs=2, check_exit=True)
            if pdf and booklet.format == Booklet.FORMAT_PRINT:
                pdf = compile_latex(tempdir, 'booklet', transformer, runs=1, check_exit=False)
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

