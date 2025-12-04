from fastapi import APIRouter, Depends, HTTPException, Header
from fastapi.responses import StreamingResponse
import json
from schemas import SyncRequest
from dependencies import get_current_session
from services.drive_service import get_drive_service, list_children, list_files_in_folder, download_file
from services.rag_service import upload_file_to_store, get_client
from services.session_service import save_session_data

router = APIRouter(prefix="/api", tags=["drive"])

@router.get("/drive/list")
async def list_drive_files(folder_id: str = 'root', session: dict = Depends(get_current_session)):
    if "credentials" not in session:
        raise HTTPException(status_code=401, detail="Not authenticated")
    
    try:
        service = get_drive_service(session["credentials"])
        files = list_children(service, folder_id)
        return {"files": files}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/sync")
async def sync_drive(request: SyncRequest, x_session_id: str = Header(None), session: dict = Depends(get_current_session)):
    if "credentials" not in session:
        raise HTTPException(status_code=401, detail="Not authenticated")
    
    api_key = session.get("gemini_api_key")
    if not api_key:
        raise HTTPException(status_code=400, detail="Gemini API Key not set. Please provide it in settings.")
    
    # Instantiate client here to keep it alive
    client = get_client(api_key)

    async def generate_progress():
        try:
            service = get_drive_service(session["credentials"])
            all_files_to_process = []
            
            def send_progress(msg, detail=None, status="progress"):
                return json.dumps({"status": status, "message": msg, "detail": detail}) + "\n"

            yield send_progress("Scanning files...", status="info")
            
            for item in request.items:
                if item.mimeType == 'application/vnd.google-apps.folder':
                    yield send_progress(f"Scanning folder: {item.name}...", status="info")
                    folder_files = list_files_in_folder(service, item.id)
                    all_files_to_process.extend(folder_files)
                else:
                    all_files_to_process.append(item.dict())
            
            if not all_files_to_process:
                yield send_progress("No files found to sync.", status="error")
                return
                
            yield send_progress(f"Found {len(all_files_to_process)} files to process.", status="info")
            
            uploaded_count = 0
            current_store_name = None 
            
            for i, file_meta in enumerate(all_files_to_process):
                file_label = f"{i+1}/{len(all_files_to_process)}: {file_meta['name']}"
                yield send_progress(f"Processing {file_label}", detail="Downloading data")
                
                try:
                    content = download_file(service, file_meta['id'], file_meta['mimeType'])
                    upload_mime_type = file_meta['mimeType']
                    if upload_mime_type.startswith('application/vnd.google-apps.'):
                        upload_mime_type = 'application/pdf'

                    generator = upload_file_to_store(
                        client=client,
                        file_content=content,
                        display_name=file_meta['name'],
                        mime_type=upload_mime_type,
                        store_name=current_store_name
                    )
                    
                    while True:
                        try:
                            msg = next(generator)
                            yield send_progress(f"Processing {file_label}", detail=msg)
                        except StopIteration as e:
                            current_store_name = e.value
                            break
                    
                    uploaded_count += 1
                    yield send_progress(f"Successfully processed: {file_meta['name']}", status="success")
                    
                except Exception as e:
                    yield send_progress(f"Failed to process {file_meta['name']}: {str(e)}", status="error")
                
            if current_store_name:
                yield send_progress("Initializing Chat Session...", detail="Providing context to the LLM")
                
                session["store_name"] = current_store_name
                session["chat_history"] = [] # Reset history on new sync
                await save_session_data(x_session_id, session)
                
                yield json.dumps({"status": "complete", "message": f"Sync complete! {uploaded_count} files ready.", "files": [f['name'] for f in all_files_to_process]}) + "\n"
            else:
                 yield send_progress("Failed to sync any files.", status="error")
            
        except Exception as e:
            print(f"CRITICAL SYNC ERROR: {str(e)}")
            import traceback
            traceback.print_exc()
            yield json.dumps({"status": "error", "message": f"Critical Error: {str(e)}"}) + "\n"

    return StreamingResponse(generate_progress(), media_type="application/x-ndjson")
