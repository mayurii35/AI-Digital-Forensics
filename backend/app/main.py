from fastapi import FastAPI, Depends
from fastapi.middleware.cors import CORSMiddleware

from app.routes.cases import router as cases_router
from app.routes.evidence import router as evidence_router
from app.routes.audit import router as audit_router
from app.routes.evidence_upload import router as evidence_upload_router
from app.routes.ai_analysis import router as ai_analysis_router
from app.routes.reports import router as reports_router
from app.routes.copilot import router as copilot_router
from app.routes.text_tracker import router as text_tracker_router
from app.routes.network_forensics import router as network_forensics_router
from app.dependencies import verify_firebase_token

app = FastAPI(
    title="AI Digital Forensics Assistant",
    description="AI-powered cybercrime investigation and digital evidence analysis system",
    version="1.0.0"
)

# Allow the Vite dev server (and any other trusted frontend origins) to call
# this API directly, without relying on Vite's dev-only proxy.
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:3000",
        "http://127.0.0.1:3000",
        "http://localhost:5173",
        "http://127.0.0.1:5173",
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Secure all these routes
app.include_router(cases_router, dependencies=[Depends(verify_firebase_token)])
app.include_router(evidence_router, dependencies=[Depends(verify_firebase_token)])
app.include_router(audit_router, dependencies=[Depends(verify_firebase_token)])
app.include_router(evidence_upload_router, dependencies=[Depends(verify_firebase_token)])
app.include_router(ai_analysis_router, dependencies=[Depends(verify_firebase_token)])
app.include_router(reports_router, dependencies=[Depends(verify_firebase_token)])
app.include_router(copilot_router, dependencies=[Depends(verify_firebase_token)])
app.include_router(text_tracker_router, dependencies=[Depends(verify_firebase_token)])
app.include_router(network_forensics_router, dependencies=[Depends(verify_firebase_token)])


@app.get("/")
def root():
    return {
        "message": "AI Digital Forensics Assistant Backend is running",
        "status": "success"
    }


@app.get("/health")
def health():
    return {
        "status": "healthy"
    }