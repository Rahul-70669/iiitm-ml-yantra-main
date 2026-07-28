from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from contextlib import asynccontextmanager
import asyncio

from app.routes.data import router as data_router
from app.routes.train import router as train_router
from app.routes.ai_assistant import router as ai_router
from app.routes.autopilot import router as autopilot_router
from app.routes.reports import router as reports_router
from app.services.dataset_manager import dataset_manager

async def cache_cleanup_task():
    """Background task to wipe dead session cache once every hour"""
    while True:
        try:
            dataset_manager.cleanup_old_sessions(max_age_hours=24)
        except Exception as e:
            print(f"Cache Cleanup Loop Error: {str(e)}")
        await asyncio.sleep(3600) # Execute every 1 hour

@asynccontextmanager
async def lifespan(app: FastAPI):
    # Startup sequence: boot background cleaner
    cleaner = asyncio.create_task(cache_cleanup_task())
    yield
    # Shutdown sequence: terminate background cleaner
    cleaner.cancel()

app = FastAPI(
    title="ML Yantra API",
    description="No-code ML platform API for data cleaning and model training automatically defended against RCE and cache DoS.",
    version="1.0.1",
    lifespan=lifespan
)

# Configure CORS - Use specific origin for better compatibility
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173", "http://127.0.0.1:5173","https://iiitm-ml-yantra.onrender.com"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
    expose_headers=["*"]
)

# Include routers
app.include_router(data_router, tags=["Data Operations"])
app.include_router(train_router, prefix="/train", tags=["Model Training"])
app.include_router(ai_router, prefix="/ai", tags=["AI Assistant"])
app.include_router(autopilot_router, prefix="/autopilot", tags=["AutoPilot"])
app.include_router(reports_router, prefix="/reports", tags=["Report Studio"])

@app.get("/")
async def root():
    return {
        "message": "ML Yantra API is running",
        "version": "1.0.0",
        "docs": "/docs"
    }

@app.get("/health")
async def health_check():
    return {"status": "healthy"}

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000, reload=True)
    # Trigger hot-reload
