FROM python:3.12-slim

ENV PYTHONDONTWRITEBYTECODE=1
ENV PYTHONUNBUFFERED=1

COPY --from=ghcr.io/astral-sh/uv:latest /uv /uvx /bin/

ENV UV_SYSTEM_PYTHON=1

WORKDIR /WebTool3

COPY pyproject.toml uv.lock ./

# Exact versions from uv.lock, so local development runs what production runs
# (installing straight from pyproject.toml pulled whatever was newest). The dev
# group adds pytest and pytest-django; this image is only used locally.
RUN uv export --frozen --no-hashes --no-emit-project --group dev -o /tmp/requirements.txt \
    && uv pip install -r /tmp/requirements.txt

COPY . ./