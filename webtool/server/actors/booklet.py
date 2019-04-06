# -*- coding: utf-8 -*-

import os
import uuid
import shutil
import tempfile
from subprocess import PIPE, run

from requests import request
import dramatiq


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

    content = booklet.render_source()
    transformer = booklet.render_transformer()
    result = os.path.join('/var/www/webtool/booklets/', f'{pk}.pdf')

    with tempfile.TemporaryDirectory() as tempdir:
        try:
            filename = os.path.join(tempdir, 'content.tex')
            with open(filename, 'x', encoding='utf-8') as f:
                f.write(content)
            latex_interpreter = 'pdflatex'
            latex_command = f'cd "{tempdir}" && {latex_interpreter} -interaction=batchmode {os.path.basename(filename)}'
            process = run(latex_command, shell=True, stdout=PIPE, stderr=PIPE)
            if process.returncode == 0:
                process = run(latex_command, shell=True, stdout=PIPE, stderr=PIPE)
            if process.returncode > 0:
                print(f'Not able to process {filename} with LaTex')
                booklet.status = Booklet.STATUS_FAILED
                booklet.save()
            if process.returncode == 0 and booklet.format == Booklet.FORMAT_PRINT:
                filename = os.path.join(tempdir, 'booklet.tex')
                with open(filename, 'x', encoding='utf-8') as f:
                    f.write(transformer)
                latex_command = f'cd "{tempdir}" && {latex_interpreter} -interaction=batchmode {os.path.basename(filename)}'
                process = run(latex_command, shell=True, stdout=PIPE, stderr=PIPE)
                if process.returncode > 0:
                    print(f'Not able to process {filename} with LaTex')
                    booklet.status = Booklet.STATUS_FAILED
                    booklet.save()
                else:
                    shutil.move(os.path.join(tempdir, 'booklet.pdf'), result)
                    print(f'booklet {pk} is ready for download')
                    booklet.status = Booklet.STATUS_DONE
                    booklet.save()
            elif process.returncode == 0:
                shutil.move(os.path.join(tempdir, 'content.pdf'), result)
                print(f'content {pk} is ready for download')
                booklet.status = Booklet.STATUS_DONE
                booklet.save()
        except Exception:
            print('Exception occurred!')
            booklet.status = Booklet.STATUS_FAILED
            booklet.save()

    db.connections.close_all()
    r = request('REFRESH', f'https://webtool.dav-kempten.de/api/client/booklets/{pk}/')
    r = request('REFRESH', 'https://webtool.dav-kempten.de/api/client/booklets/')
