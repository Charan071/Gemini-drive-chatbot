from fastapi import APIRouter, HTTPException, Depends, Header
from fastapi.responses import RedirectResponse, JSONResponse
from google_auth_oauthlib.flow import Flow
from googleapiclient.discovery import build
from config import GOOGLE_CLIENT_ID, GOOGLE_CLIENT_SECRET, REDIRECT_URI, SCOPES, FRONTEND_URL
from services.session_service import get_session_data, save_session_data, delete_session_data, get_current_session, get_optional_session
from pydantic import BaseModel
import logging

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

router = APIRouter(prefix="/api/auth", tags=["auth"])
callback_router = APIRouter(tags=["auth"])

class ApiKeyRequest(BaseModel):
    api_key: str

@router.get("/login")
async def login(x_session_id: str = Header(None)):
    if not x_session_id:
        raise HTTPException(status_code=400, detail="Session ID header is required")
    
    try:
        flow = Flow.from_client_config(
            {
                "web": {
                    "client_id": GOOGLE_CLIENT_ID,
                    "client_secret": GOOGLE_CLIENT_SECRET,
                    "auth_uri": "https://accounts.google.com/o/oauth2/auth",
                    "token_uri": "https://oauth2.googleapis.com/token",
                }
            },
            scopes=SCOPES,
            redirect_uri=REDIRECT_URI
        )
        
        # Pass session_id as state
        authorization_url, state = flow.authorization_url(
            access_type='offline',
            include_granted_scopes='true',
            state=x_session_id
        )
        
        return {"url": authorization_url}
        
    except Exception as e:
        logger.error(f"Login error: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))

@callback_router.get("/rest/oauth2-credential/callback")
async def callback(code: str, state: str = None):
    try:
        if not state:
            raise HTTPException(status_code=400, detail="State (Session ID) is missing")

        session_id = state

        flow = Flow.from_client_config(
            {
                "web": {
                    "client_id": GOOGLE_CLIENT_ID,
                    "client_secret": GOOGLE_CLIENT_SECRET,
                    "auth_uri": "https://accounts.google.com/o/oauth2/auth",
                    "token_uri": "https://oauth2.googleapis.com/token",
                }
            },
            scopes=SCOPES,
            redirect_uri=REDIRECT_URI,
            state=state
        )
        
        flow.fetch_token(code=code)
        credentials = flow.credentials
        
        # Fetch User Info
        try:
            service = build('oauth2', 'v2', credentials=credentials)
            user_info = service.userinfo().get().execute()
        except Exception as e:
            logger.error(f"Failed to fetch user info: {e}")
            user_info = {}

        creds_data = {
            "token": credentials.token,
            "refresh_token": credentials.refresh_token,
            "token_uri": credentials.token_uri,
            "client_id": credentials.client_id,
            "client_secret": credentials.client_secret,
            "scopes": credentials.scopes
        }
        
        # Update session in DB
        session_data = await get_session_data(session_id) or {}
        session_data["credentials"] = creds_data
        session_data["user"] = {
            "name": user_info.get("name"),
            "email": user_info.get("email"),
            "picture": user_info.get("picture")
        }
        await save_session_data(session_id, session_data)
        
        return RedirectResponse(f"{FRONTEND_URL}?auth=success")
    except Exception as e:
        logger.error(f"Callback error: {e}")
        return JSONResponse(status_code=400, content={"error": str(e)})

# Redefining callback to be safe for now, assuming we might need to fix the session issue separately.
# But wait, the user just wants the NameError fixed.
# I will restore the code as best as I can, but I'll add the missing definitions.

@router.get("/status")
async def auth_status(session: dict = Depends(get_optional_session)):
    if session and "credentials" in session:
        return {
            "authenticated": True, 
            "isApiKeySet": "gemini_api_key" in session,
            "user": session.get("user")
        }
    return {"authenticated": False}

@router.post("/apikey")
async def save_api_key(request: ApiKeyRequest, x_session_id: str = Header(None), session: dict = Depends(get_current_session)):
    session["gemini_api_key"] = request.api_key
    await save_session_data(x_session_id, session)
    return {"message": "API Key saved"}

@router.get("/logout")
async def logout(x_session_id: str = Header(None)):
    if x_session_id:
        await delete_session_data(x_session_id)
    return {"message": "Logged out"}
