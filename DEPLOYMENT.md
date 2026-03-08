# PyJHora Deployment Guide

This document outlines how to deploy the **PyJHora** application, which consists of a Python FastAPI backend and a Next.js frontend.

## Architecture & Hosting Options
- **Backend:** AWS Lambda (Containers)
- **Frontend:** Netlify or Vercel (Recommended due to ease and $0 cost for hobbyists)

Because the project is large (~1GB backend dependencies), we avoid deploying the AWS Lambda via `.zip` and instead use **Docker (AWS ECR)**. We also use a `.dockerignore` to make sure the Heavy frontend is skipped when AWS builds the backend.

---

## 1. Backend Deployment (AWS Lambda + ECR)

The backend runs as a FastAPI application converted to an AWS Lambda handler using `Mangum`.

### Prerequisites
- Install **Docker** and the **AWS CLI**.
- Ensure you have an AWS Account and proper IAM permissions.

### Deployment Steps
1. **Create an ECR Repository** in the AWS Console (e.g., `pyjhora-api`).
2. **Authenticate Docker to AWS ECR**:
   ```bash
   # Replace the region and AWS account ID below
   aws ecr get-login-password --region <your-region> | docker login --username AWS --password-stdin <aws-account-id>.dkr.ecr.<your-region>.amazonaws.com
   ```
3. **Build the Docker Image**:
   ```bash
   docker build --platform linux/amd64 -t pyjhora-api .
   ```
4. **Push the Image to ECR**:
   ```bash
   docker tag pyjhora-api:latest <aws-account-id>.dkr.ecr.<your-region>.amazonaws.com/pyjhora-api:latest
   docker push <aws-account-id>.dkr.ecr.<your-region>.amazonaws.com/pyjhora-api:latest
   ```
5. **Create the Lambda Function**:
   - Go to AWS Lambda -> Create Function.
   - Choose **Container Image** and select the image you just pushed.
   - **Important Configuration:** Increase the **Timeout** (e.g., 30s) and **Memory** (e.g., 1024MB or 2048MB) due to the heavy calculation payloads.
6. **Create an API Gateway**:
   - Go to AWS API Gateway -> Build HTTP API.
   - Add an Integration targeting your new Lambda Function.
   - Deploy the API. You will receive an **API Endpoint URL**.

---

## 2. Frontend Deployment (Netlify or Vercel)

The frontend is a standard Next.js application located in the `frontend/` directory.

### Option A: Netlify (Recommended)
You already have the `@netlify/plugin-nextjs` and a `netlify.toml` file configured in the `frontend/` directory.

1. Connect your GitHub/GitLab repository to [Netlify](https://www.netlify.com/).
2. When importing the project, set the **Base directory (or Root Directory)** to `frontend`.
3. Add a new Environment Variable:
   - **Key:** `NEXT_PUBLIC_API_URL`
   - **Value:** The AWS API Gateway URL you obtained from the backend deployment.
4. Click **Deploy**. Netlify will use your existing `.toml` file to build and serve the app.

### Option B: Vercel (Alternative)
Vercel is the creator of Next.js and provides excellent native support.

1. Connect your repository to [Vercel](https://vercel.com/).
2. When importing the project, edit the **Framework Preset** and ensure the **Root Directory** is set to `frontend`.
3. Add a new Environment Variable:
   - **Name:** `NEXT_PUBLIC_API_URL`
   - **Value:** The AWS API Gateway URL you obtained from the backend deployment.
4. Click **Deploy**. Vercel will auto-configure and launch your application.

---

## Estimated Costs
- **Backend (AWS):** ECR charges $0.10 per GB/month (so around **$0.10/month**). Lambda and API Gateway have massive free tiers (1 million free requests per month), so unless you go viral, compute is **Free**.
- **Frontend:** Both Netlify and Vercel are **100% Free** for personal / hobby projects.
