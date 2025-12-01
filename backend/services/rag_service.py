from google import genai
from google.genai import types
import os
from dotenv import load_dotenv
import tempfile
import time

load_dotenv()

# Initialize Client
client = genai.Client(api_key=os.getenv("GOOGLE_API_KEY"))

def upload_file_to_store(file_content, display_name, mime_type='application/pdf', store_name=None):
    """
    Uploads a file to a Gemini File Search Store.
    If store_name is provided, it uploads to that store.
    Otherwise, it creates a new store (or you might want to manage stores differently).
    For this implementation, we'll assume we want to add to a specific store or create one if needed.
    """
    
    # Create a temporary file to write content
    with tempfile.NamedTemporaryFile(delete=False, suffix=".pdf") as tmp:
        tmp.write(file_content)
        tmp_path = tmp.name
    
    try:
        # 1. Create or Get Store (Simplified: Create a new one for each sync or reuse a global one?)
        # For a proper RAG agent, we usually want one store per "Knowledge Base".
        # Let's create a store if one isn't passed, or use the passed one.
        
        if not store_name:
            # Create a new store
            file_search_store = client.file_search_stores.create(
                config={'display_name': f'Drive_RAG_Store_{int(time.time())}'}
            )
            store_name = file_search_store.name
            print(f"Created new store: {store_name}")
        
        # 2. Upload and Import File
        print(f"Uploading {display_name} to {store_name}...")
        operation = client.file_search_stores.upload_to_file_search_store(
            file=tmp_path,
            file_search_store_name=store_name,
            config={
                'display_name': display_name,
            }
        )
        
        # Wait for operation to complete
        while not operation.done:
            time.sleep(2)
            operation = client.operations.get(operation)
            
        print(f"Upload complete for {display_name}")
        return store_name
        
    finally:
        # Clean up temp file
        if os.path.exists(tmp_path):
            os.remove(tmp_path)

def create_chat_session(store_name):
    """
    Creates a chat session with the File Search tool enabled for the given store.
    """
    # Create chat
    chat = client.chats.create(
        model="gemini-2.5-flash", 
        config=types.GenerateContentConfig(
            tools=[types.Tool(
                file_search=types.FileSearch(
                    file_search_store_names=[store_name]
                )
            )]
        )
    )
    return chat

def generate_response(chat_session, message):
    try:
        response = chat_session.send_message(message)
        if not response.candidates:
            return "I could not generate a response. The model might have blocked it due to safety settings."
        return response.text
    except Exception as e:
        print(f"Error generating response: {e}")
        return f"An error occurred while generating the response: {str(e)}"
