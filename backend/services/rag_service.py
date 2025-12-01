from google import genai
from google.genai import types
import os
from dotenv import load_dotenv
import tempfile
import time

import mimetypes

load_dotenv()

# Initialize Client
client = genai.Client(api_key=os.getenv("GOOGLE_API_KEY"))

def upload_file_to_store(file_content, display_name, mime_type='application/pdf', store_name=None):
    """
    Uploads a file to a Gemini File Search Store.
    Yields progress messages. Returns store_name.
    """
    
    # Determine suffix based on mime_type or display_name
    suffix = mimetypes.guess_extension(mime_type)
    
    # Fallback to display_name extension if mime_type guess fails or is generic
    if not suffix or suffix == '.bin':
        _, ext = os.path.splitext(display_name)
        if ext:
            suffix = ext
    
    # Default if still unknown
    if not suffix:
        suffix = ".bin"

    # Proactive fix for CSV files: Gemini requires text/plain for CSV content uploaded via File API sometimes
    # or at least complains about text/csv.
    if mime_type == 'text/csv':
        mime_type = 'text/plain'

    # Create a temporary file to write content
    with tempfile.NamedTemporaryFile(delete=False, suffix=suffix) as tmp:
        tmp.write(file_content)
        tmp_path = tmp.name
    
    print(f"Temp file created at: {tmp_path} with suffix: {suffix}, size: {len(file_content)} bytes")

    try:
        # 1. Create or Get Store
        if not store_name:
            file_search_store = client.file_search_stores.create(
                config={'display_name': f'Drive_RAG_Store_{int(time.time())}'}
            )
            store_name = file_search_store.name
            print(f"Created new store: {store_name}")
        
        # 2. Upload and Import File
        yield "Sending file to File Search"
            
        print(f"Uploading {display_name} ({mime_type}) to {store_name}...")
        
        try:
            operation = client.file_search_stores.upload_to_file_search_store(
                file=tmp_path,
                file_search_store_name=store_name,
                config={
                    'display_name': display_name,
                    'mime_type': mime_type
                }
            )
        except Exception as e:
            # Fallback retry
            print(f"Upload failed with {mime_type}, retrying as text/plain... Error: {e}")
            yield "Retrying upload as text/plain..."
            operation = client.file_search_stores.upload_to_file_search_store(
                file=tmp_path,
                file_search_store_name=store_name,
                config={
                    'display_name': display_name,
                    'mime_type': 'text/plain'
                }
            )
        
        # Wait for operation to complete
        yield "Indexing and chunking"
            
        while not operation.done:
            time.sleep(1)
            operation = client.operations.get(operation)
            
        print(f"Upload complete for {display_name}")
        return store_name
        
    finally:
        # Clean up temp file
        if os.path.exists(tmp_path):
            try:
                os.remove(tmp_path)
            except:
                pass

def create_chat_session(store_name):
    """
    Creates a chat session with the File Search tool enabled for the given store.
    """
    # Create chat
    chat = client.chats.create(
        model="gemini-2.5-flash", 
        config=types.GenerateContentConfig(
            system_instruction="""You are a helpful, professional AI assistant. 
            When answering questions based on the provided documents:
            1. Use Markdown formatting (bolding, headers, bullet points) to make your answers easy to read.
            2. Be concise and direct. Avoid walls of text.
            3. Use tables if comparing data.
            4. If the answer is not in the documents, state that clearly.""",
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
