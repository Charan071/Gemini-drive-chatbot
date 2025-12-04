from fastapi import APIRouter, Depends, HTTPException, Header
from schemas import ChatRequest
from dependencies import get_current_session
from services.rag_service import create_chat_session, generate_response, get_client
from services.session_service import save_session_data

router = APIRouter(prefix="/api", tags=["chat"])

@router.post("/chat")
async def chat(request: ChatRequest, x_session_id: str = Header(None), session: dict = Depends(get_current_session)):
    if "store_name" not in session:
        raise HTTPException(status_code=400, detail="Chat session not initialized. Please sync a folder first.")
    
    api_key = session.get("gemini_api_key")
    if not api_key:
        raise HTTPException(status_code=400, detail="Gemini API Key not set.")

    try:
        # Rehydrate chat session
        history = session.get("chat_history", [])
        
        # Instantiate client here to keep it alive
        client = get_client(api_key)
        
        chat_session = create_chat_session(client, session["store_name"], history=history)
        response_text = generate_response(chat_session, request.message)
        
        # Update history manually
        new_history = history or []
        new_history.append({"role": "user", "parts": [{"text": request.message}]})
        new_history.append({"role": "model", "parts": [{"text": response_text}]})
            
        session["chat_history"] = new_history
        await save_session_data(x_session_id, session)
        
        return {"response": response_text}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
