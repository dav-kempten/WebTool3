# -*- coding: utf-8 -*-

import os
import shutil
import tempfile
from subprocess import PIPE, run

import dramatiq

@dramatiq.actor
def create_booklet_pdf(booklet_id):

    graphics_path = os.path.abspath(os.path.join(os.path.dirname(__file__), '../actors/booklets/graphics'))

    content = os.path.abspath(os.path.join(os.path.dirname(__file__), '../actors/booklets/templates/content.tex'))
    with open(content, 'r', encoding='utf-8') as f:
        source = f.read()
    source = source.replace(
        '%%GraphicsPath%%', f'{graphics_path}/'
    ).replace(
      '%%Header%%', 'Ortsgruppe Obergünzburg'
    ).replace(
        '%%SubHeader%%', 'der Sektion Allgäu-Kempten des Deustchen Alpenvereins e.V.'
    ).replace(
        '%%MainHeader%%', 'Programmheft 2019'
    ).replace(
        '%%Content%%', (
            r'\davCategory{Alpenverein Obergünzburg}\par'
            r'\textbf{Leitung:}\\\relax '
            r'Marianne Lorenz, Aurikelweg 7, 87634 Obergünzburg, Tel. 08372/7653\par '
            r'\textbf{2. Leitung:}\\\relax '
            r'Siegfried Kronschnabl, Obergünzburg\\\relax '
            r'Peter Wertek, Ronsberg\par'
            r'\textbf{Kassier:}\\\relax '
            r'Christian Altthaler, Eglofs\par '
            r'\textbf{Schriftführer:}\\\relax '
            r'Andrea Guggemos, Untrasried\par '
            r'\vfill '
            r'Alle Informationen zur Ortsgruppe\\\relax '
            r'und unseren Veranstaltungen finden sich auch auf unserer Website:\\\relax '
            r'dav-kempten.de/ortsgruppe-oberguenzburg'
        )
    )

    transform = os.path.abspath(os.path.join(os.path.dirname(__file__), '../actors/booklets/templates/booklet.tex'))
    with open(transform, 'r', encoding='utf-8') as f:
        booklet = f.read()
    booklet = booklet.replace(
        '%%Author%%', 'WebTool3'
    ).replace(
        '%%Title%%', 'Programmheft 2019'
    ).replace(
        '%%Subject%%', 'DAV Kempten'
    )

    result = os.path.join('/var/www/webtool/booklets/', 'booklet.pdf')

    with tempfile.TemporaryDirectory() as tempdir:
        filename = os.path.join(tempdir, 'content.tex')
        with open(filename, 'x', encoding='utf-8') as f:
            f.write(source)
        latex_interpreter = 'pdflatex'
        latex_command = f'cd "{tempdir}" && {latex_interpreter} -interaction=batchmode {os.path.basename(filename)}'
        process = run(latex_command, shell=True, stdout=PIPE, stderr=PIPE)
        if process.returncode == 0:
            process = run(latex_command, shell=True, stdout=PIPE, stderr=PIPE)
        try:
            if process.returncode == 1:
                # with open(os.path.join(tempdir, 'content.log'), 'rb') as f:
                #    log = f.read()
                # raise TexError(log=log, source=source)
                return
            if transform:
                filename = os.path.join(tempdir, 'booklet.tex')
                with open(filename, 'x', encoding='utf-8') as f:
                    f.write(booklet)
                latex_command = f'cd "{tempdir}" && {latex_interpreter} -interaction=batchmode {os.path.basename(filename)}'
                process = run(latex_command, shell=True, stdout=PIPE, stderr=PIPE)
                if process.returncode == 1:
                    # with open(os.path.join(tempdir, 'booklet.log'), 'rb') as f:
                    #     log = f.read()
                    # raise TexError(log=log, source=source)
                    return
                shutil.move(os.path.join(tempdir, 'booklet.pdf'), result)
            else:
                shutil.move(os.path.join(tempdir, 'content.pdf'), result)
        except FileNotFoundError:
            # if process.stderr:
            #     raise Exception(process.stderr.decode('utf-8'))
            # raise
            return
