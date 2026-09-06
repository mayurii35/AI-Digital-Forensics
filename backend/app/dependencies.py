import os
import firebase_admin
from firebase_admin import credentials, auth
from fastapi import Request, HTTPException, Security
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials

security = HTTPBearer()

# Path to the Firebase service account key, relative to the backend/ directory
# (i.e. backend/firebase-service-account.json).
_SERVICE_ACCOUNT_PATH = os.path.join(
    os.path.dirname(os.path.dirname(os.path.abspath(__file__))),
    "firebase-service-account.json",
)

# Initialize Firebase Admin
try:
    firebase_admin.get_app()
except ValueError:
    if not os.path.isfile(_SERVICE_ACCOUNT_PATH):
        raise RuntimeError(
            "Firebase service account file not found at "
            f"'{_SERVICE_ACCOUNT_PATH}'. Download it from Firebase Console > "
            "Project Settings > Service Accounts, and save it there."
        )
    cred = credentials.Certificate(_SERVICE_ACCOUNT_PATH)
    firebase_admin.initialize_app(cred)

async def verify_firebase_token(credentials: HTTPAuthorizationCredentials = Security(security)):
    token = credentials.credentials
    try:
        decoded_token = auth.verify_id_token(token)
        return decoded_token
    except Exception as e:
        print("FIREBASE VERIFY ERROR:", repr(e))
        raise HTTPException(status_code=401, detail="Invalid authentication credentials")