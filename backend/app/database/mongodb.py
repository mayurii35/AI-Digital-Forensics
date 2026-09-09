from pymongo import MongoClient
import os
from dotenv import load_dotenv

load_dotenv()

MONGODB_URI = os.getenv("MONGODB_URI")

client = MongoClient(MONGODB_URI)

db = client["digital_forensics"]

cases_collection = db["cases"]
evidence_collection = db["evidence"]
audit_collection = db["audit_logs"]
analysis_collection = db["analysis"]
text_tracker_collection = db["text_tracker"]
copilot_chats_collection = db["copilot_chats"]