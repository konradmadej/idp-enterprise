from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

app = FastAPI(
    title="${{ values.name }}",
    description="${{ values.description }}",
    version="0.1.0",
)

# CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.get("/")
async def root():
    """Root endpoint"""
    return {
        "message": "Welcome to ${{ values.name }}",
        "status": "running",
        "version": "0.1.0"
    }


@app.get("/health")
async def health_check():
    """Health check endpoint"""
    return {
        "status": "healthy",
        "service": "${{ values.name }}"
    }


@app.get("/api/v1/hello/{name}")
async def hello(name: str):
    """Example endpoint"""
    return {
        "message": f"Hello, {name}!",
        "service": "${{ values.name }}"
    }
