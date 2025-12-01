import os
import json
from fastapi import FastAPI, Request, HTTPException, Header
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import RedirectResponse, JSONResponse, FileResponse
from fastapi.staticfiles import StaticFiles
from google_auth_oauthlib.flow import Flow
from google.oauth2.credentials import Credentials
from google.auth.transport.requests import Request as GoogleRequest
from dotenv import load_dotenv

load_dotenv()

# Allow OAuth scope to change (e.g. if user granted more scopes previously)
os.environ['OAUTHLIB_RELAX_TOKEN_SCOPE'] = '1'

app = FastAPI()

# CORS configuration
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173"],  # Frontend URL
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.get("/")
def read_root():
    return {"message": "Gemini Drive RAG Agent Backend is running. Go to http://localhost:5173 to use the app."}

# OAuth Configuration
# OAuth Configuration
# Try to load from env vars first (Railway/Production), fallback to file (Local)
CLIENT_CONFIG = None
if os.getenv("GOOGLE_CLIENT_ID") and os.getenv("GOOGLE_CLIENT_SECRET"):
    CLIENT_CONFIG = {
        "web": {
            "client_id": os.getenv("GOOGLE_CLIENT_ID"),
            "client_secret": os.getenv("GOOGLE_CLIENT_SECRET"),
            "auth_uri": "https://accounts.google.com/o/oauth2/auth",
            "token_uri": "https://oauth2.googleapis.com/token",
        }
    }
else:
    # Fallback to file
    CLIENT_SECRETS_FILE = "client_secret.json"

SCOPES = [
    "https://www.googleapis.com/auth/drive.readonly",
    "https://www.googleapis.com/auth/userinfo.profile",
    "https://www.googleapis.com/auth/userinfo.email",
    "openid"
]

# Redirect URI should also be configurable for production
REDIRECT_URI = os.getenv("REDIRECT_URI", "http://localhost:5678/rest/oauth2-credential/callback")

# In-memory storage for sessions (for demonstration purposes)
# In a production app, use a database (Redis/Postgres)
# Structure: { session_id: { "credentials": ..., "chat_session": ..., "store_name": ... } }
sessions = {}

def get_session(session_id: str):
    if session_id not in sessions:
        sessions[session_id] = {}
    return sessions[session_id]

@app.get("/api/auth/login")
def login(x_session_id: str = Header(None)):
    if not x_session_id:
        raise HTTPException(status_code=400, detail="Session ID required")
        
    if CLIENT_CONFIG:
        flow = Flow.from_client_config(CLIENT_CONFIG, scopes=SCOPES)
    else:
        flow = Flow.from_client_secrets_file(CLIENT_SECRETS_FILE, scopes=SCOPES)
        
    flow.redirect_uri = REDIRECT_URI
    # Pass session_id in state
    authorization_url, state = flow.authorization_url(
        access_type="offline",
        include_granted_scopes="true",
        state=x_session_id
    )
    return {"url": authorization_url}

@app.get("/rest/oauth2-credential/callback")
def callback(code: str, state: str = None):
    # State contains the session_id
    session_id = state
    if not session_id:
         return JSONResponse(status_code=400, content={"error": "Missing session ID in state"})

    if CLIENT_CONFIG:
        flow = Flow.from_client_config(CLIENT_CONFIG, scopes=SCOPES, state=state)
    else:
        # Note: We don't pass state here because we used it for session_id, 
        # but flow might expect it if we passed it in auth_url. 
        # Actually, flow validation checks state if provided.
        flow = Flow.from_client_secrets_file(CLIENT_SECRETS_FILE, scopes=SCOPES, state=state)
    flow.redirect_uri = REDIRECT_URI
    
    try:
        flow.fetch_token(code=code)
        credentials = flow.credentials
        
        # Store credentials in session
        session = get_session(session_id)
        session["credentials"] = {
            "token": credentials.token,
            "refresh_token": credentials.refresh_token,
            "token_uri": credentials.token_uri,
            "client_id": credentials.client_id,
            "client_secret": credentials.client_secret,
            "scopes": credentials.scopes
        }
        
        # Redirect back to frontend (configurable for prod)
        frontend_url = os.getenv("FRONTEND_URL", "http://localhost:5173")
        return RedirectResponse(f"{frontend_url}?auth=success")
    except Exception as e:
        return JSONResponse(status_code=400, content={"error": str(e)})

@app.get("/api/auth/status")
def auth_status(x_session_id: str = Header(None)):
    if not x_session_id:
        return {"authenticated": False}
    
    session = sessions.get(x_session_id)
    if session and "credentials" in session:
        return {"authenticated": True}
    return {"authenticated": False}

@app.get("/api/auth/logout")
def logout(x_session_id: str = Header(None)):
    if x_session_id and x_session_id in sessions:
        del sessions[x_session_id]
    return {"message": "Logged out"}

if __name__ == "__main__":
    import uvicorn
    port = int(os.getenv("PORT", 5678))
    uvicorn.run(app, host="0.0.0.0", port=port)

# --- New Imports ---
from pydantic import BaseModel
from services.drive_service import get_drive_service, list_files_in_folder, download_file, list_children
from services.rag_service import upload_file_to_store, create_chat_session, generate_response

# --- Data Models ---
class DriveItem(BaseModel):
    id: str
    name: str
    mimeType: str

class SyncRequest(BaseModel):
    items: list[DriveItem]

class ChatRequest(BaseModel):
    message: str

# --- Global State (Removed) ---
# chat_session = None
# current_store_name = None

@app.get("/api/drive/list")
def list_drive_files(folder_id: str = 'root', x_session_id: str = Header(None)):
    if not x_session_id:
        raise HTTPException(status_code=400, detail="Session ID required")
        
    session = sessions.get(x_session_id)
    if not session or "credentials" not in session:
        raise HTTPException(status_code=401, detail="Not authenticated")
    
    try:
        service = get_drive_service(session["credentials"])
        files = list_children(service, folder_id)
        return {"files": files}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

# --- New Imports ---
from fastapi.responses import StreamingResponse
import json
import asyncio

@app.post("/api/sync")
async def sync_drive(request: SyncRequest, x_session_id: str = Header(None)):
    if not x_session_id:
        raise HTTPException(status_code=400, detail="Session ID required")

    # Use env var (server key)
    # api_key = os.getenv("GOOGLE_API_KEY") # No longer needed to pass explicitly to service
    
    session = sessions.get(x_session_id)
    if not session or "credentials" not in session:
        raise HTTPException(status_code=401, detail="Not authenticated")
    
    async def generate_progress():
        try:
            service = get_drive_service(session["credentials"])
            
            all_files_to_process = []
            
            def send_progress(msg, detail=None, status="progress"):
                return json.dumps({"status": status, "message": msg, "detail": detail}) + "\n"

            yield send_progress("Scanning files...", status="info")
            
            # 1. Collect all files (expand folders)
            for item in request.items:
                if item.mimeType == 'application/vnd.google-apps.folder':
                    yield send_progress(f"Scanning folder: {item.name}...", status="info")
                    # Recursive list
                    folder_files = list_files_in_folder(service, item.id)
                    all_files_to_process.extend(folder_files)
                else:
                    # Single file
                    all_files_to_process.append(item.dict())
            
            if not all_files_to_process:
                yield send_progress("No files found to sync.", status="error")
                return
                
            yield send_progress(f"Found {len(all_files_to_process)} files to process.", status="info")
            
            uploaded_count = 0
            current_store_name = None 
            
            # 2. Download and Upload
            for i, file_meta in enumerate(all_files_to_process):
                file_label = f"{i+1}/{len(all_files_to_process)}: {file_meta['name']}"
                print(f"Processing: {file_meta['name']}")
                
                # Stage 1: Downloading
                yield send_progress(f"Processing {file_label}", detail="Downloading data")
                
                try:
                    content = download_file(service, file_meta['id'], file_meta['mimeType'])
                    
                    # Determine correct mime type for upload
                    upload_mime_type = file_meta['mimeType']
                    if upload_mime_type.startswith('application/vnd.google-apps.'):
                        upload_mime_type = 'application/pdf'

                    # Stage 2 & 3: Sending and Indexing (Yielded from service)
                    generator = upload_file_to_store(
                        file_content=content,
                        display_name=file_meta['name'],
                        mime_type=upload_mime_type,
                        store_name=current_store_name
                    )
                    
                    while True:
                        try:
                            msg = next(generator)
                            # Map service messages to frontend detail
                            yield send_progress(f"Processing {file_label}", detail=msg)
                        except StopIteration as e:
                            current_store_name = e.value
                            break
                    
                    uploaded_count += 1
                    yield send_progress(f"Successfully processed: {file_meta['name']}", status="success")
                    
                except Exception as e:
                    print(f"Failed to process {file_meta['name']}: {e}")
                    yield send_progress(f"Failed to process {file_meta['name']}: {str(e)}", status="error")
                
            # 3. Create Chat Session
            if current_store_name:
                # Stage 4: Providing context
                yield send_progress("Initializing Chat Session...", detail="Providing context to the LLM")
                # Store chat session in user session
                session["chat_session"] = create_chat_session(current_store_name)
                yield json.dumps({"status": "complete", "message": f"Sync complete! {uploaded_count} files ready.", "files": [f['name'] for f in all_files_to_process]}) + "\n"
            else:
                 yield send_progress("Failed to sync any files.", status="error")
            
        except Exception as e:
            print(f"Sync Error: {e}")
            yield json.dumps({"status": "error", "message": f"Critical Error: {str(e)}"}) + "\n"

    return StreamingResponse(generate_progress(), media_type="application/x-ndjson")

@app.post("/api/chat")
def chat(request: ChatRequest, x_session_id: str = Header(None)):
    if not x_session_id:
        raise HTTPException(status_code=400, detail="Session ID required")
        
    session = sessions.get(x_session_id)
    if not session or "chat_session" not in session:
        raise HTTPException(status_code=400, detail="Chat session not initialized. Please sync a folder first.")
        
    try:
        response = generate_response(session["chat_session"], request.message)
        return {"response": response}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


