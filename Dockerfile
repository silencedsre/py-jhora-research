FROM public.ecr.aws/lambda/python:3.12

WORKDIR ${LAMBDA_TASK_ROOT}

RUN mkdir -p PyJHora/src/jhora/data/ephe
COPY ephemeris_data.zip* ./
COPY scripts/extract_ephe.py ./
RUN python extract_ephe.py && rm extract_ephe.py

COPY requirements.txt .

# AL2023 uses dnf
RUN dnf install -y gcc gcc-c++ libxml2-devel libxslt-devel libffi-devel \
    zlib-devel libjpeg-devel openjpeg2-devel qpdf-devel && dnf clean all

RUN pip install --no-cache-dir -r requirements.txt

COPY . .
CMD [ "api.main.handler" ]
