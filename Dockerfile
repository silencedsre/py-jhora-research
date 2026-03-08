FROM public.ecr.aws/lambda/python:3.11

# Set the working directory to the Lambda task root
WORKDIR ${LAMBDA_TASK_ROOT}

# GitHub Actions will not have the local .gitignore'd PyJHora ephemeris data.
# We accept the GITHUB_TOKEN so this works even on private repositories.
ARG GITHUB_TOKEN

# Copy the download script and run it
COPY scripts/download_ephe.py scripts/download_ephe.py
RUN python scripts/download_ephe.py && rm -rf scripts/

# Copy the requirements file into the container
COPY requirements.txt .

# Install the dependencies
RUN pip install --no-cache-dir -r requirements.txt

# Copy the application code into the container
# This copies everything in the current directory (like PyJHora, api, Data, etc.)
COPY . .

# Set the CMD to your handler (could also be done as a parameter override outside of the Dockerfile)
CMD [ "api.main.handler" ]
