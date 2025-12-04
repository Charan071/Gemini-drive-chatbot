import os
from dotenv import load_dotenv

load_dotenv()

# Database
MONGO_URI = os.getenv("MONGO_URI")
DB_NAME = "gemini_drive_chat"

# Google OAuth
GOOGLE_CLIENT_ID = os.getenv("GOOGLE_CLIENT_ID")
GOOGLE_CLIENT_SECRET = os.getenv("GOOGLE_CLIENT_SECRET")
REDIRECT_URI = os.getenv("REDIRECT_URI", "http://localhost:5678/rest/oauth2-credential/callback")
FRONTEND_URL = os.getenv("FRONTEND_URL", "http://localhost:5173")

CLIENT_CONFIG = None
CLIENT_SECRETS_FILE = None

if GOOGLE_CLIENT_ID and GOOGLE_CLIENT_SECRET:
    # Strip whitespace from credentials
    GOOGLE_CLIENT_ID = GOOGLE_CLIENT_ID.strip()
    GOOGLE_CLIENT_SECRET = GOOGLE_CLIENT_SECRET.strip()
    
    CLIENT_CONFIG = {
        "web": {
            "client_id": GOOGLE_CLIENT_ID,
            "client_secret": GOOGLE_CLIENT_SECRET,
            "auth_uri": "https://accounts.google.com/o/oauth2/auth",
            "token_uri": "https://oauth2.googleapis.com/token",
        }
    }
else:
    # Fallback to file if env vars not set (legacy support)
    CLIENT_SECRETS_FILE = "client_secret.json"

SCOPES = [
    "https://www.googleapis.com/auth/drive.readonly",
    "https://www.googleapis.com/auth/userinfo.profile",
    "https://www.googleapis.com/auth/userinfo.email",
    "openid"
]

# Allow OAuth scope to change (dev only)
os.environ['OAUTHLIB_RELAX_TOKEN_SCOPE'] = '1'

# Server
PORT = int(os.getenv("PORT", 5678))
