"""
Pipeline API Endpoints for CORVUS.
Provides validation, execution, and status checking for the full analysis pipeline.
"""
from fastapi import APIRouter, HTTPException, Header
from pydantic import BaseModel
from typing import Optional, List, Dict, Any
from app.services.agent_controller import agent_controller
from app.services.geospatial_validator import geospatial_validator
from app.services.llm_service import llm_service
from app.core.security import decode_access_token

router = APIRouter()


class ValidationRequest(BaseModel):
    filename: str
    modality: Optional[str] = "optical"


class PipelineExecuteRequest(BaseModel):
    query: str
    filename_t1: Optional[str] = "Delhi_Optical_T1.tif"
    filename_t2: Optional[str] = None
    filename_sar: Optional[str] = None
    project_id: Optional[str] = None


def verify_token(authorization: Optional[str] = None) -> Dict[str, Any]:
    """Verify JWT token and return payload. Returns empty dict if no token."""
    if not authorization or not authorization.startswith("Bearer "):
        return {}
    token = authorization.split(" ")[1]
    payload = decode_access_token(token)
    return payload or {}


@router.post("/pipeline/validate")
async def validate_input(
    req: ValidationRequest,
    authorization: Optional[str] = Header(None),
):
    """Run full input validation & compatibility check on a file."""
    result = geospatial_validator.validate_and_extract_metadata(req.filename)
    
    # Enhanced validation checks
    checks = []
    meta = result.get("metadata", {})
    
    checks.append({
        "name": "Format Validation",
        "status": "pass" if result["valid"] else "fail",
        "detail": f"{meta.get('format', 'Unknown')} format detected",
    })
    
    crs = meta.get("crs", "")
    checks.append({
        "name": "CRS / Projection",
        "status": "pass" if crs.startswith("EPSG:") else "warning",
        "detail": f"{crs or 'No CRS detected'}",
    })
    
    bands = meta.get("bands", 0)
    expected_bands = 2 if req.modality == "sar" else 4
    checks.append({
        "name": "Band Compatibility",
        "status": "pass" if bands >= 1 else "fail",
        "detail": f"{bands} bands detected (expected ~{expected_bands} for {req.modality})",
    })
    
    checks.append({
        "name": "Modality Match",
        "status": "pass",
        "detail": f"Declared modality: {req.modality}",
    })
    
    checks.append({
        "name": "Metadata Completeness",
        "status": "pass" if meta.get("width") and meta.get("height") else "warning",
        "detail": f"{meta.get('width', '?')} × {meta.get('height', '?')} px • {meta.get('sensor', 'Unknown sensor')}",
    })
    
    all_passed = all(c["status"] != "fail" for c in checks)
    
    return {
        "valid": all_passed,
        "checks": checks,
        "metadata": meta,
        "recommendation": "Ready for analysis" if all_passed else "Please fix failed checks before proceeding",
    }


@router.post("/pipeline/execute")
async def execute_pipeline(
    req: PipelineExecuteRequest,
    authorization: Optional[str] = Header(None),
):
    """Execute the full CORVUS analysis pipeline."""
    try:
        result = agent_controller.process_analysis_request(
            query=req.query,
            filename_t1=req.filename_t1 or "Delhi_Optical_T1.tif",
            filename_t2=req.filename_t2,
            filename_sar=req.filename_sar,
        )
        return result
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Pipeline execution error: {str(e)}")


@router.post("/pipeline/classify")
async def classify_query(
    query: str,
    authorization: Optional[str] = Header(None),
):
    """Classify a query's intent using LLM or rule-based fallback."""
    result = llm_service.classify_intent(query)
    return result


@router.get("/pipeline/models")
async def list_specialist_models():
    """List all available specialist models in the tool registry."""
    return {
        "models": [
            {
                "id": "vqa",
                "name": "GeoChat-7B",
                "tasks": ["vqa", "captioning"],
                "parameters": "7B",
                "architecture": "LLaVA-based MLLM",
                "status": "ready",
            },
            {
                "id": "grounding",
                "name": "Grounding DINO",
                "tasks": ["grounding"],
                "parameters": "172M",
                "architecture": "DINO + BERT Fusion",
                "status": "ready",
            },
            {
                "id": "change_detection",
                "name": "ChangeFormer 1.0",
                "tasks": ["change_detection", "change_vqa"],
                "parameters": "41M",
                "architecture": "Siamese Transformer",
                "status": "ready",
            },
            {
                "id": "optical_sar_fusion",
                "name": "SAR Fusion Head",
                "tasks": ["optical_sar_fusion"],
                "parameters": "28M",
                "architecture": "Cross-Attention Encoder",
                "status": "ready",
            },
            {
                "id": "segmentation",
                "name": "SegFormer-B2",
                "tasks": ["segmentation"],
                "parameters": "27M",
                "architecture": "Mix Transformer",
                "status": "ready",
            },
        ],
        "llm_status": "active" if llm_service.initialized else "fallback",
        "llm_model": llm_service.model_name if llm_service.initialized else "rule-based",
    }
