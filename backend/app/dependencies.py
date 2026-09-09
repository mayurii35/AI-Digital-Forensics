import os
import json
import firebase_admin
from firebase_admin import credentials, auth
from fastapi import Request, HTTPException, Security
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials

security = HTTPBearer()

# Initialize Firebase Admin
try:
    firebase_admin.get_app()
except ValueError:
    # Try to load from environment variable first (for production deployment)
    firebase_creds_json = os.getenv("FIREBASE_SERVICE_ACCOUNT_JSON")
    
    if firebase_creds_json:
        # Production: Load from environment variable
        try:
            service_account_info = json.loads(firebase_creds_json)
            cred = credentials.Certificate(service_account_info)
            firebase_admin.initialize_app(cred)
        except json.JSONDecodeError as e:
            raise RuntimeError(f"Invalid FIREBASE_SERVICE_ACCOUNT_JSON format: {e}")
    else:
        # Development: Load from file
        _SERVICE_ACCOUNT_PATH = os.path.join(
            os.path.dirname(os.path.dirname(os.path.abspath(__file__))),
            "firebase-service-account.json",
        )
        
        if not os.path.isfile(_SERVICE_ACCOUNT_PATH):
            raise RuntimeError(
                "Firebase service account not configured. Either:\n"
                f"1. Set FIREBASE_SERVICE_ACCOUNT_JSON environment variable, OR\n"
                f"2. Place firebase-service-account.json at '{_SERVICE_ACCOUNT_PATH}'"
            )
        
        cred = credentials.Certificate(_SERVICE_ACCOUNT_PATH)
        firebase_admin.initialize_app(cred)

async def verify_firebase_token(credentials: HTTPAuthorizationCredentials = Security(security)):
    token = credentials.credentials
    try:
        decoded_token = auth.verify_id_token(token, clock_skew_seconds=60)
        return decoded_token
    except Exception as e:
        print("FIREBASE VERIFY ERROR:", repr(e))
        raise HTTPException(status_code=401, detail="Invalid authentication credentials")