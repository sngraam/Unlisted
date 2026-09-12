from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
import time
from typing import List, Dict

app = FastAPI(
    title="AI-Powered E-Commerce Listing Management Backend",
    description="FastAPI REST API powering Next.js listing manager platform",
    version="0.1.0"
)

# Enable CORS for local development and Docker frontend
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

start_time = time.time()

class SystemStatus(BaseModel):
    status: str
    service: str
    version: str
    uptime_seconds: float
    environment: str

class SkuItem(BaseModel):
    id: str
    sku_code: str
    name: str
    brand: str
    status: str
    marketplace: str

@app.get("/", tags=["Health"])
def root():
    return {
        "message": "Welcome to AI E-Commerce Listing Management API",
        "docs_url": "/docs",
        "status": "healthy"
    }

@app.get("/health", response_model=SystemStatus, tags=["Health"])
def health_check():
    return SystemStatus(
        status="online",
        service="listing-backend",
        version="0.1.0",
        uptime_seconds=round(time.time() - start_time, 2),
        environment="docker-production"
    )

@app.get("/api/v1/info", tags=["System"])
def get_info():
    return {
        "app_name": "AI Catalog & Listing Manager",
        "supported_marketplaces": ["Amazon", "Flipkart", "Shopify"],
        "ai_modules": ["Catalog Agent", "Keyword Agent", "A+ Content Agent"],
        "status": "active"
    }

@app.get("/api/v1/skus", response_model=List[SkuItem], tags=["SKUs"])
def get_skus():
    return [
        SkuItem(id="1", sku_code="SKU-NEO-001", name="Wireless Noise-Canceling Headphones", brand="AuraSound", status="Optimized", marketplace="Amazon"),
        SkuItem(id="2", sku_code="SKU-NEO-002", name="Ergonomic Mechanical Keyboard", brand="KeyCraft", status="Draft", marketplace="Flipkart"),
        SkuItem(id="3", sku_code="SKU-NEO-003", name="Ultra-HD 4K Webcam", brand="VisionStream", status="Published", marketplace="Amazon"),
    ]
