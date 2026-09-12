from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from typing import Optional, List, Dict, Any
import time
from app.services.agent_controller import agent_controller
from app.db.mongodb import get_analyses_collection, get_projects_collection

router = APIRouter()

class AnalysisRunRequest(BaseModel):
    query: str
    filename_t1: Optional[str] = None
    filename_t2: Optional[str] = None
    filename_sar: Optional[str] = None
    image_base64_a: Optional[str] = None
    image_base64_b: Optional[str] = None
    mode: Optional[str] = "auto"
    project_id: Optional[str] = None
    chat_history: Optional[List[Dict[str, Any]]] = None
    map_context: Optional[Dict[str, Any]] = None
    api_key: Optional[str] = None

@router.post("/analysis/run")
async def run_analysis(req: AnalysisRunRequest):
    try:
        import asyncio
        result = await asyncio.to_thread(
            agent_controller.process_analysis_request,
            query=req.query,
            filename_t1=req.filename_t1,
            filename_t2=req.filename_t2,
            filename_sar=req.filename_sar,
            image_base64_a=req.image_base64_a,
            image_base64_b=req.image_base64_b,
            mode=req.mode,
            chat_history=req.chat_history,
            map_context=req.map_context,
            api_key=req.api_key,
        )

        # Persist analysis result to MongoDB
        analyses_col = get_analyses_collection()
        if analyses_col is not None and isinstance(result, dict):
            try:
                record = {
                    "request_id": result.get("request_id"),
                    "project_id": req.project_id or "default",
                    "query": req.query,
                    "intent": result.get("intent"),
                    "task": result.get("task"),
                    "confidence": result.get("confidence"),
                    "confidence_display": result.get("confidence_display"),
                    "answer": result.get("answer"),
                    "evidence_count": len(result.get("evidence", [])),
                    "created_at": time.strftime("%Y-%m-%dT%H:%M:%SZ", time.gmtime()),
                }
                await analyses_col.insert_one(record)
            except Exception:
                pass

        # If project_id provided, increment project counter in MongoDB
        if req.project_id:
            projects_col = get_projects_collection()
            if projects_col is not None:
                try:
                    await projects_col.update_one(
                        {"id": req.project_id},
                        {"$inc": {"queries_count": 1}}
                    )
                except Exception:
                    pass

        return result
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Analysis pipeline error: {str(e)}")

@router.get("/analysis/history")
async def get_analysis_history(project_id: Optional[str] = None, limit: int = 20):
    analyses_col = get_analyses_collection()
    if analyses_col is not None:
        try:
            query = {"project_id": project_id} if project_id else {}
            cursor = analyses_col.find(query, {"_id": 0}).sort("created_at", -1).limit(limit)
            return await cursor.to_list(length=limit)
        except Exception as e:
            return []
    return []
