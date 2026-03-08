FROM public.ecr.aws/lambda/python:3.11

# Set the working directory to the Lambda task root
WORKDIR ${LAMBDA_TASK_ROOT}

# GitHub Actions will not have the local .gitignore'd PyJHora ephemeris data.
# Download the archived ephemeris data from the GitHub release.
RUN apt-get update && apt-get install -y wget unzip && rm -rf /var/lib/apt/lists/*
RUN mkdir -p PyJHora/src/jhora/data/ephe && cd PyJHora/src/jhora/data/ephe && \
    wget -qO ephemeris_data.zip https://github.com/silencedsre/py-jhora-research/releases/download/v1.0.0/ephemeris_data.zip && \
    unzip -q ephemeris_data.zip && \
    rm ephemeris_data.zip

# Copy the requirements file into the container
COPY requirements.txt .

# Install the dependencies
RUN pip install --no-cache-dir -r requirements.txt

# Copy the application code into the container
# This copies everything in the current directory (like PyJHora, api, Data, etc.)
COPY . .

# Set the CMD to your handler (could also be done as a parameter override outside of the Dockerfile)
CMD [ "api.main.handler" ]
