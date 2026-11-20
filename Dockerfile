FROM python:3.12-slim

ENV PYTHONDONTWRITEBYTECODE=1
ENV PYTHONUNBUFFERED=1

COPY --from=ghcr.io/astral-sh/uv:latest /uv /uvx /bin/

ENV UV_SYSTEM_PYTHON=1

WORKDIR /WebTool3

# pdflatex for the trainer printout, the claim ("Abrechnung") and the PDF
# programme, as on the server: Source Serif/Sans come with fonts-extra, soul
# with plain-generic, babel ngerman with lang-german. poppler-utils (pdftotext,
# pdftoppm) serves the PDF tests and server/tests/render_printouts.sh. Before
# the Python packages so a dependency change does not reinstall TeX Live.
RUN apt-get update \
    && apt-get install -y --no-install-recommends \
       texlive-latex-base texlive-latex-recommended texlive-latex-extra \
       texlive-fonts-recommended texlive-fonts-extra texlive-lang-german \
       texlive-plain-generic poppler-utils \
    && rm -rf /var/lib/apt/lists/*

COPY pyproject.toml uv.lock ./

# Exact versions from uv.lock, so local development runs what production runs
# (installing straight from pyproject.toml pulled whatever was newest). The dev
# group adds pytest and pytest-django; this image is only used locally.
RUN uv export --frozen --no-hashes --no-emit-project --group dev -o /tmp/requirements.txt \
    && uv pip install -r /tmp/requirements.txt

COPY . ./