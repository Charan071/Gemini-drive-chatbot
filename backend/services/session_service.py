from database import db
from fastapi import Header, HTTPException

async def get_session_data(session_id: str):
    database = db.get_db()
    return await database.sessions.find_one({"session_id": session_id})

async def save_session_data(session_id: str, data: dict):
    database = db.get_db()
    await database.sessions.update_one(
        {"session_id": session_id},
        {"$set": data},
        upsert=True
    )

async def delete_session_data(session_id: str):
    database = db.get_db()
    await database.sessions.delete_one({"session_id": session_id})

async def get_current_session(x_session_id: str = Header(None)):
    if not x_session_id:
        raise HTTPException(status_code=400, detail="Session ID header is required")
    
    session = await get_session_data(x_session_id)
    if not session:
        # Create a new session if it doesn't exist? 
        # Or just return empty dict?
        # For now, let's return an empty dict so we can populate it.
        return {}
    return session

async def get_optional_session(x_session_id: str = Header(None)):
    if not x_session_id:
        return {}
    
    session = await get_session_data(x_session_id)
    return session or {}
