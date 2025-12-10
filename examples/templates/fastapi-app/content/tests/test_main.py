import pytest
from fastapi.testclient import TestClient
from app.main import app

client = TestClient(app)


def test_root():
    response = client.get("/")
    assert response.status_code == 200
    data = response.json()
    assert "message" in data
    assert "status" in data
    assert data["status"] == "running"


def test_health_check():
    response = client.get("/health")
    assert response.status_code == 200
    data = response.json()
    assert data["status"] == "healthy"


def test_hello_endpoint():
    response = client.get("/api/v1/hello/World")
    assert response.status_code == 200
    data = response.json()
    assert "message" in data
    assert "Hello, World!" in data["message"]


def test_api_docs():
    response = client.get("/docs")
    assert response.status_code == 200
