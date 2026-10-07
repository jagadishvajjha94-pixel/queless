from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from pydantic import BaseModel
from typing import List, Optional
import os
import uvicorn

# Import local modules
from utils.qr_generator import generate_qr_code
from utils.pdf_generator import generate_token_pdf
from utils.analytics import analyze_queue_data
from algorithms.queue_engine import estimate_wait_time

app = FastAPI(title="QueueLess Queue Engine Microservice", version="1.0.0")

# Setup CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Ensure static directories exist
os.makedirs("static/qrcodes", exist_ok=True)
os.makedirs("static/pdf", exist_ok=True)

# Mount static files to serve QR codes and PDFs
app.mount("/static", StaticFiles(directory="static"), name="static")

# --- Schemas ---

class EstimateRequest(BaseModel):
    service_duration: int
    waiting_count: int

class QRRequest(BaseModel):
    token_code: str
    business_id: str
    token_id: str

class PDFRequest(BaseModel):
    token_code: str
    business_name: str
    service_name: str
    token_number: int
    joined_at: str
    estimated_wait_time: int
    qr_code_url: Optional[str] = ""

class TokenLog(BaseModel):
    joined_at: Optional[str] = None
    called_at: Optional[str] = None
    completed_at: Optional[str] = None
    service_name: str
    status: str

class AnalyticsRequest(BaseModel):
    tokens: List[TokenLog]

# --- Endpoints ---

@app.get("/")
def read_root():
    return {"message": "QueueLess Python Queue Engine microservice is running."}

@app.post("/api/estimate")
def estimate_queue_wait(req: EstimateRequest):
    try:
        wait_time = estimate_wait_time(req.service_duration, req.waiting_count)
        return {"estimated_wait_time": wait_time}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/api/qr")
def generate_token_qr(req: QRRequest):
    try:
        # Generate the local file path and web URL
        filename = f"{req.token_code}.png"
        filepath = os.path.join("static", "qrcodes", filename)
        
        # In a real setup, this URL points to the customer-facing details view of this token
        content = f"https://queueless.app/tokens/{req.token_code}"
        
        generate_qr_code(content, filepath)
        
        # Return web accessible path (relative to FastAPI port)
        port = int(os.getenv("PORT", 8001))
        qr_code_url = f"http://127.0.0.1:{port}/static/qrcodes/{filename}"
        return {
            "qr_code_path": filepath,
            "qr_code_url": qr_code_url
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/api/pdf")
def generate_token_pdf_doc(req: PDFRequest):
    try:
        filename = f"{req.token_code}.pdf"
        filepath = os.path.join("static", "pdf", filename)
        
        # Generate PDF locally
        generate_token_pdf(
            filepath=filepath,
            token_code=req.token_code,
            business_name=req.business_name,
            service_name=req.service_name,
            token_number=req.token_number,
            joined_at=req.joined_at,
            estimated_wait_time=req.estimated_wait_time,
            qr_code_url=req.qr_code_url
        )
        
        port = int(os.getenv("PORT", 8001))
        pdf_url = f"http://127.0.0.1:{port}/static/pdf/{filename}"
        return {
            "pdf_path": filepath,
            "pdf_url": pdf_url
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/api/analytics")
def process_analytics(req: AnalyticsRequest):
    try:
        result = analyze_queue_data([token.model_dump() for token in req.tokens])
        return result
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

if __name__ == "__main__":
    port = int(os.getenv("PORT", 8001))
    uvicorn.run("main:app", host="127.0.0.1", port=port, reload=True)
