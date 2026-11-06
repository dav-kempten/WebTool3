# -*- coding: utf-8 -*-
"""
pdflatex for the PDF programme (server/actors) and the trainer printouts
(server/printouts.py).
"""
import os
from subprocess import DEVNULL, run

GRAPHICS_PATH = os.path.abspath(os.path.join(os.path.dirname(__file__), 'models', 'assets', 'graphics'))
TEMPLATE_PATH = os.path.abspath(os.path.join(os.path.dirname(__file__), 'models', 'assets', 'templates'))


def template(name):
    with open(os.path.join(TEMPLATE_PATH, name), encoding='utf-8') as f:
        return f.read()


def compile_latex(tempdir, name, source, runs, check_exit):
    """
    Compiles ``name.tex`` from ``source`` in ``tempdir`` and returns the path of
    the PDF, or None. Every run has to leave a PDF; with ``check_exit`` the last
    run must also exit cleanly. A failed run is reported with the error lines
    from the LaTeX log, since batch mode prints nothing.
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
            for line in latex_errors(os.path.join(tempdir, f'{name}.log')):
                print(f'  {line}', flush=True)
            return None
    return pdf


def latex_errors(log, limit=10):
    """The "! ..." lines of a LaTeX log, e.g. "! LaTeX Error: File `soul.sty' not found."."""
    try:
        with open(log, encoding='utf-8', errors='replace') as f:
            return [line.rstrip() for line in f if line.startswith('!')][:limit]
    except OSError:
        return ['(no log written)']
