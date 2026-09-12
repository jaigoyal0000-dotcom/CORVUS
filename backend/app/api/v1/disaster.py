from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from typing import Optional, List, Dict, Any
from app.services.disaster_engine import disaster_engine, fetch_live_geocoding

router = APIRouter()

class DisasterAssessRequest(BaseModel):
    location_name: str
    centroid: Optional[List[float]] = None
    zoom: Optional[int] = 13
    hazard_type: Optional[str] = "auto"
    api_key: Optional[str] = None

@router.post("/disaster/assess")
async def assess_disaster_risk(req: DisasterAssessRequest):
    """
    Assess disaster likelihood (Flood, Wildfire, Storm, etc.) by comparing
    previous baseline conditions with real-time current conditions using LIVE satellite & weather data.
    """
    try:
        result = disaster_engine.assess_location(
            location_name=req.location_name,
            centroid=req.centroid,
            zoom=req.zoom or 13,
            hazard_type=req.hazard_type or "auto",
            api_key=req.api_key,
        )
        return result
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Disaster assessment error: {str(e)}")

@router.get("/disaster/search-places")
async def search_places(q: Optional[str] = ""):
    """
    Live global place search powered by OpenStreetMap Nominatim.
    """
    query = (q or "").strip()
    if not query:
        return {"query": q, "results": []}
        
    geo = fetch_live_geocoding(query)
    results = [geo] if geo else []
    return {"query": q, "results": results}
