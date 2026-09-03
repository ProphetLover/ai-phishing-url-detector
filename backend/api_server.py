from fastapi import FastAPI, HTTPException
from pydantic import BaseModel
from fastapi.middleware.cors import CORSMiddleware
import sys
import os

# Ensure ml module is found
sys.path.append(os.path.join(os.path.dirname(__file__), "ml"))

from ml.predict import PhishingPredictor

app = FastAPI(title="Phishing URL Detector API")

allowed_origins = os.environ.get("ALLOWED_ORIGINS", "http://localhost:3000,http://127.0.0.1:3000,http://localhost:3005,http://127.0.0.1:3005").split(",")

app.add_middleware(
    CORSMiddleware,
    allow_origins=allowed_origins,
    allow_methods=["GET", "POST", "OPTIONS"],
    allow_headers=["*"],
)

try:
    predictor = PhishingPredictor(
        model_path="ml/models/phishing_model.joblib",
        schema_path="ml/models/feature_schema.json"
    )
except Exception as e:
    print(f"Warning: Could not load model. It may not be trained yet. {e}")
    predictor = None

class AnalyzeRequest(BaseModel):
    url: str

@app.post("/api/analyze")
def analyze_url(req: AnalyzeRequest):
    if not predictor:
        raise HTTPException(status_code=503, detail="Model not loaded or trained yet.")
    
    if not req.url:
        raise HTTPException(status_code=400, detail="URL cannot be empty")
        
    # Security: Limit URL length to prevent DOS
    if len(req.url) > 2000:
        raise HTTPException(status_code=400, detail="URL is too long (max 2000 chars)")
        
    try:
        result = predictor.predict(req.url)
        return result
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/api/health")
def health():
    return {"status": "healthy", "model_loaded": predictor is not None}
