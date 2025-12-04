from pydantic import BaseModel
from typing import List, Optional

class DriveItem(BaseModel):
    id: str
    name: str
    mimeType: str

class SyncRequest(BaseModel):
    items: List[DriveItem]

class ChatRequest(BaseModel):
    message: str

class ApiKeyRequest(BaseModel):
    api_key: str
