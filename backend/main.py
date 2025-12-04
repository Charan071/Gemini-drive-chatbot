from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from database import db
from config import MONGO_URI, FRONTEND_URL, PORT
from routers import auth, drive, chat
from datetime import datetime
import os

app = FastAPI()

# CORS configuration
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:5173",
        "http://127.0.0.1:5173",
        "http://localhost:5174",
        "https://gemini-drive-chatbot.vercel.app",
        FRONTEND_URL
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.on_event("startup")
async def startup_db_client():
    db.connect()

@app.on_event("shutdown")
async def shutdown_db_client():
    db.close()

@app.get("/")
def read_root():
    return {"message": "Gemini Drive RAG Agent Backend is running."}

@app.get("/health")
def health_check():
    """Health check endpoint for monitoring and deployment verification"""
    db_status = "connected" if db.client else "disconnected"
    return {
        "status": "healthy",
        "timestamp": datetime.now().isoformat(),
        "database": db_status,
        "mongo_configured": bool(MONGO_URI)
    }

# Include Routers
app.include_router(auth.router)
app.include_router(auth.callback_router)
app.include_router(drive.router)
app.include_router(chat.router)

if __name__ == "__main__":
    import uvicorn
    is_prod = os.getenv("ENVIRONMENT") == "production"
    uvicorn.run(
        app, 
        host="0.0.0.0", 
        port=PORT,
        reload=not is_prod
    )
