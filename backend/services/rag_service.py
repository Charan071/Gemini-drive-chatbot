from google import genai
from google.genai import types
import os
from dotenv import load_dotenv
import tempfile
import time
import mimetypes

load_dotenv()

def get_client(api_key):
    return genai.Client(api_key=api_key)

def upload_file_to_store(client, file_content, display_name, mime_type='application/pdf', store_name=None):
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

    # Proactive fix for CSV files: Handle various CSV mime types
    # If it looks like a CSV (extension or mime), treat as text/plain to ensure Gemini accepts it
    is_csv = False
    if mime_type in ['text/csv', 'application/csv', 'text/x-csv', 'application/vnd.ms-excel']:
        is_csv = True
    elif display_name.lower().endswith('.csv'):
        is_csv = True
        
    # Check for other code/text files that might be misidentified or rejected as binary
    # Gemini File API supports text/plain for code files
    code_extensions = [
        '.json', '.xml', '.js', '.jsx', '.ts', '.tsx', '.py', '.java', '.c', '.cpp', '.h', 
        '.cs', '.php', '.rb', '.go', '.rs', '.swift', '.kt', '.scala', '.html', '.css', 
        '.scss', '.md', '.txt', '.yaml', '.yml', '.sql', '.sh', '.bat', '.ps1', '.env'
    ]
    
    is_code_or_text = False
    if any(display_name.lower().endswith(ext) for ext in code_extensions):
        is_code_or_text = True
    
    if is_csv or is_code_or_text:
        print(f"Detected text/code file: {display_name} ({mime_type}). Forcing text/plain for upload.")
        mime_type = 'text/plain'
        if not suffix:
            # Try to preserve original extension if possible, or default to .txt for safety
            _, ext = os.path.splitext(display_name)
            suffix = ext if ext else ".txt"

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

def create_chat_session(client, store_name, history=None):
    """
    Creates a chat session with the File Search tool enabled for the given store.
    """
    # Create chat
    print(f"Creating chat session with model: gemini-2.5-flash and store: {store_name}")
    try:
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
            ),
            history=history
        )
        print("Chat session created successfully.")
        return chat
    except Exception as e:
        print(f"Error creating chat session: {e}")
        raise e

def generate_response(chat_session, message):
    try:
        response = chat_session.send_message(message)
        if not response.candidates:
            return "I could not generate a response. The model might have blocked it due to safety settings."
        return response.text
    except Exception as e:
        print(f"Error generating response: {e}")
        return f"An error occurred while generating the response: {str(e)}"
