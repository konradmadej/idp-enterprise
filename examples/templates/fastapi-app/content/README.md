# ${{ values.name }}

${{ values.description }}

## Overview

This is a FastAPI application created using the Backstage template.

## Environment

- **Environment**: ${{ values.environment }}
- **Namespace**: ${{ values.namespace }}
- **Replicas**: ${{ values.replicas }}

## API Documentation

Once deployed, the API documentation will be available at:
- Swagger UI: `http://<service-url>/docs`
- ReDoc: `http://<service-url>/redoc`

## Local Development

### Prerequisites
- Python 3.11+
- pip

### Setup

```bash
# Create virtual environment
python -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate

# Install dependencies
pip install -r requirements.txt

# Run the application
uvicorn app.main:app --reload
```

The API will be available at `http://localhost:8000`

## Deployment

The application is automatically deployed to Kubernetes using GitHub Actions:
- Push to `main` branch triggers a deployment to ${{ values.environment }}

## Project Structure

```
.
├── app/
│   ├── __init__.py
│   ├── main.py          # FastAPI application
│   └── routers/         # API routers
├── k8s/                 # Kubernetes manifests
├── tests/               # Test files
├── Dockerfile
├── requirements.txt
└── catalog-info.yaml    # Backstage catalog definition
```

## Owner

**Team**: ${{ values.owner }}
**System**: ${{ values.system }}
