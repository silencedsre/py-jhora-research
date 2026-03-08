FROM public.ecr.aws/lambda/python:3.11

# Set the working directory to the Lambda task root
WORKDIR ${LAMBDA_TASK_ROOT}

# The ephemeris data is downloaded in the GitHub Action runner and copied in.
# We unzip it into the expected directory using a dedicated Python script.
RUN mkdir -p PyJHora/src/jhora/data/ephe
COPY ephemeris_data.zip* ./
COPY scripts/extract_ephe.py ./
RUN python extract_ephe.py && rm extract_ephe.py

# Copy the requirements file into the container
COPY requirements.txt .

# Install system dependencies required for some Python packages (like lxml, numpy)
RUN yum install -y libxml2-devel libxslt-devel gcc gcc-c++ python3-devel && yum clean all

# Install the dependencies
RUN pip install --no-cache-dir -r requirements.txt

# Copy the application code into the container
# This copies everything in the current directory (like PyJHora, api, Data, etc.)
COPY . .

# Set the CMD to your handler (could also be done as a parameter override outside of the Dockerfile)
CMD [ "api.main.handler" ]
