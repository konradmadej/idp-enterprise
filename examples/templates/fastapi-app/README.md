# FastAPI Application Template

This template creates a complete FastAPI application with:

- ✅ FastAPI boilerplate with basic endpoints
- ✅ Dockerfile optimized for Python applications
- ✅ Kubernetes manifests (Namespace, Deployment, Service)
- ✅ GitHub Actions workflows for CI/CD
- ✅ Automated tests with pytest
- ✅ Health check endpoints
- ✅ Auto-generated API documentation
- ✅ Backstage catalog integration

## Template Parameters

- **Application Information**: Name, description, owner, and system
- **Repository Configuration**: GitHub repository location
- **Kubernetes Configuration**: Namespace, environment, and replica count

## What Gets Created

1. **GitHub Repository** with complete FastAPI application structure
2. **Kubernetes Namespace** created via GitHub Actions
3. **CI/CD Pipeline** that builds, tests, and deploys the application
4. **Backstage Component** registered in the catalog

## Prerequisites

For the template to work fully, you need:

1. GitHub repository access
2. Kubernetes cluster access
3. GitHub Actions secrets configured:
   - `KUBECONFIG`: Base64-encoded kubeconfig file

## Usage

1. Fill in the application details
2. Select repository location
3. Configure Kubernetes settings
4. Click "Create" to generate the application

The template will:
1. Create the repository with all files
2. Trigger infrastructure creation (namespace)
3. Deploy the application to Kubernetes
4. Register the component in Backstage
