FROM public.ecr.aws/lambda/python:3.11

# Set the working directory to the Lambda task root
WORKDIR ${LAMBDA_TASK_ROOT}

# The ephemeris data is downloaded in the GitHub Action runner and copied in.
# We unzip it into the expected directory using Python (OS agnostic).
RUN mkdir -p PyJHora/src/jhora/data/ephe
COPY ephemeris_data.zip* ./
RUN python -c "import zipfile, os; \
    if os.path.exists('ephemeris_data.zip'): \
        with zipfile.ZipFile('ephemeris_data.zip', 'r') as zip_ref: \
            zip_ref.extractall('PyJHora/src/jhora/data/ephe'); \
        os.remove('ephemeris_data.zip')"

# Copy the requirements file into the container
COPY requirements.txt .

# Install the dependencies
RUN pip install --no-cache-dir -r requirements.txt

# Copy the application code into the container
# This copies everything in the current directory (like PyJHora, api, Data, etc.)
COPY . .

# Set the CMD to your handler (could also be done as a parameter override outside of the Dockerfile)
CMD [ "api.main.handler" ]
