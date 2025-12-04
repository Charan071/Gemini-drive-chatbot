from fastapi import Header, HTTPException
from services.session_service import get_session_data

async def get_current_session(x_session_id: str = Header(None)):
    """
    Dependency to retrieve the current session based on the x-session-id header.
    Raises 400 if header is missing.
    Raises 401 if session is not found or invalid.
    """
    if not x_session_id:
        raise HTTPException(status_code=400, detail="Session ID required")
    
    session = await get_session_data(x_session_id)
    if not session:
        # For login endpoint, we might not have a session yet, but for protected routes we need it.
        # This dependency is strict. For optional session, use a different one.
        raise HTTPException(status_code=401, detail="Session not found or expired")
        
    return session

async def get_optional_session(x_session_id: str = Header(None)):
    """
    Dependency to retrieve session if it exists, but doesn't enforce it.
    """
    if not x_session_id:
        return None
    return await get_session_data(x_session_id)
