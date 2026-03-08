# Stage 1: Build wheels on a modern image (Debian/GCC 12)
# This bypasses the old GCC 7 on the final Lambda image
FROM python:3.11-slim AS builder

WORKDIR /build

# Build dependencies for lxml, numpy, pandas, cffi, pillow, pikepdf, etc.
RUN apt-get update && apt-get install -y \
    build-essential \
    pkg-config \
    gcc \
    g++ \
    libxml2-dev \
    libxslt1-dev \
    libffi-dev \
    zlib1g-dev \
    libjpeg-dev \
    libopenjp2-7-dev \
    libqpdf-dev \
    && rm -rf /var/lib/apt/lists/*

COPY requirements.txt .
# Pre-build wheels into a local folder
RUN pip wheel --no-cache-dir -r requirements.txt -w /wheels

# Stage 2: Final Lambda Image
FROM public.ecr.aws/lambda/python:3.11.2026.02.28.00

WORKDIR ${LAMBDA_TASK_ROOT}

# 1. Handle ephemeris data (copied from GitHub runner build context)
RUN mkdir -p PyJHora/src/jhora/data/ephe
COPY ephemeris_data.zip* ./
COPY scripts/extract_ephe.py ./
RUN python extract_ephe.py && rm extract_ephe.py

# 2. Copy and install pre-built wheels from builder stage
COPY --from=builder /wheels /wheels
RUN pip install --no-cache-dir --no-index --find-links=/wheels /wheels/*.whl && rm -rf /wheels

# 3. Copy application code
COPY . .

# Set the CMD to your handler
CMD [ "api.main.handler" ]
