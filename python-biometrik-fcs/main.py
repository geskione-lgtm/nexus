from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import Optional, Dict, List
import uvicorn
from logic import calculate_morph_weights

app = FastAPI(title="Biometrik FCS Intelligence Service")

# Enable CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"], # In production, replace with specific domains
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

class WeightsRequest(BaseModel):
    clinic_id: Optional[str] = None
    patient_id: Optional[str] = None
    session_id: Optional[str] = None
    ga_weeks: float
    bpd_mm: Optional[float] = None
    hc_mm: Optional[float] = None
    nb_mm: Optional[float] = None
    chin_mm: Optional[float] = None
    jaw_mm: Optional[float] = None
    seed: Optional[int] = None
    template: str = "default"

class WeightsResponse(BaseModel):
    weights: Dict[str, float]
    warnings: List[str]
    meta: Dict[str, any]

@app.post("/biometrik-fcs/weights", response_model=WeightsResponse)
async def get_weights(request: WeightsRequest):
    try:
        weights = calculate_morph_weights(
            ga_weeks=request.ga_weeks,
            bpd_mm=request.bpd_mm,
            hc_mm=request.hc_mm,
            nb_mm=request.nb_mm,
            chin_mm=request.chin_mm,
            jaw_mm=request.jaw_mm,
            seed=request.seed
        )
        
        return WeightsResponse(
            weights=weights,
            warnings=[],
            meta={
                "ga_weeks": request.ga_weeks,
                "seed": request.seed
            }
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

if __name__ == "__main__":
    uvicorn.run(app, host="0.0.0.0", port=8001)
