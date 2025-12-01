from googleapiclient.discovery import build
from googleapiclient.http import MediaIoBaseDownload
from google.oauth2.credentials import Credentials
import io
import os

def get_drive_service(credentials_data):
    creds = Credentials(
        token=credentials_data["token"],
        refresh_token=credentials_data["refresh_token"],
        token_uri=credentials_data["token_uri"],
        client_id=credentials_data["client_id"],
        client_secret=credentials_data["client_secret"],
        scopes=credentials_data["scopes"]
    )
    return build('drive', 'v3', credentials=creds)

def list_files_in_folder(service, folder_id):
    """
    Recursively list all files in a folder.
    Returns a list of file objects with id, name, mimeType.
    """
    files = []
    page_token = None
    
    query = f"'{folder_id}' in parents and trashed = false"
    
    while True:
        results = service.files().list(
            q=query,
            pageSize=100,
            fields="nextPageToken, files(id, name, mimeType)",
            pageToken=page_token
        ).execute()
        
        items = results.get('files', [])
        
        for item in items:
            if item['mimeType'] == 'application/vnd.google-apps.folder':
                # Recursively list subfolder
                files.extend(list_files_in_folder(service, item['id']))
            else:
                files.append(item)
        
        page_token = results.get('nextPageToken')
        if not page_token:
            break
            
    return files

def list_children(service, folder_id):
    """
    List direct children of a folder (non-recursive).
    """
    results = service.files().list(
        q=f"'{folder_id}' in parents and trashed = false",
        pageSize=100,
        fields="nextPageToken, files(id, name, mimeType, iconLink)",
        orderBy="folder,name"
    ).execute()
    
    return results.get('files', [])

def download_file(service, file_id, mime_type):
    """
    Download a file. If it's a Google Doc, export as PDF.
    Returns the file content as bytes.
    """
    if mime_type.startswith('application/vnd.google-apps.'):
        # Export Google Docs/Sheets/Slides as PDF
        request = service.files().export_media(fileId=file_id, mimeType='application/pdf')
    else:
        # Download binary files
        request = service.files().get_media(fileId=file_id)
        
    fh = io.BytesIO()
    downloader = MediaIoBaseDownload(fh, request)
    done = False
    while done is False:
        status, done = downloader.next_chunk()
        
    return fh.getvalue()
