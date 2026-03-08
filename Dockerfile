FROM public.ecr.aws/lambda/python:3.11

# Set the working directory to the Lambda task root
WORKDIR ${LAMBDA_TASK_ROOT}

# GitHub Actions will not have the local .gitignore'd PyJHora ephemeris data.
# Download the archived ephemeris data from the GitHub release using Python (OS agnostic).
# We accept the GITHUB_TOKEN so this works even on private repositories.
ARG GITHUB_TOKEN

RUN python -c "import urllib.request, zipfile, io, os; \
os.makedirs('PyJHora/src/jhora/data/ephe', exist_ok=True); \
req = urllib.request.Request('https://github.com/silencedsre/py-jhora-research/releases/download/v1.0.0/ephemeris_data.zip'); \
if os.environ.get('GITHUB_TOKEN'): req.add_header('Authorization', f\"Bearer {os.environ.get('GITHUB_TOKEN')}\"); \
req.add_header('Accept', 'application/octet-stream'); \
resp = urllib.request.urlopen(req); \
zipfile.ZipFile(io.BytesIO(resp.read())).extractall('PyJHora/src/jhora/data/ephe')"

# Copy the requirements file into the container
COPY requirements.txt .

# Install the dependencies
RUN pip install --no-cache-dir -r requirements.txt

# Copy the application code into the container
# This copies everything in the current directory (like PyJHora, api, Data, etc.)
COPY . .

# Set the CMD to your handler (could also be done as a parameter override outside of the Dockerfile)
CMD [ "api.main.handler" ]
