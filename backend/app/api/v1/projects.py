from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from typing import List, Optional, Dict, Any
import time
from app.db.mongodb import get_projects_collection, get_analyses_collection

router = APIRouter()

# In-memory fallback
PROJECTS_DB: Dict[str, Dict[str, Any]] = {
    "proj_0001": {
        "id": "proj_0001",
        "name": "Delhi Urban Expansion & Land Cover",
        "description": "Bi-temporal Sentinel-2 and Sentinel-1 SAR analysis over National Capital Region (2024 - 2026).",
        "aoi_polygon": None,
        "created_at": "2026-08-29T20:00:00Z",
        "images": ["Delhi_Optical_T1.tif", "Delhi_Optical_T2.tif", "Delhi_SAR_VH.tif"],
        "analyses": [],
        "queries_count": 14,
    },
    "proj_0002": {
        "id": "proj_0002",
        "name": "Yamuna River Flood Risk Assessment",
        "description": "Multi-modal optical and SAR flood inundation mapping and water body extent tracking.",
        "aoi_polygon": None,
        "created_at": "2026-08-28T14:30:00Z",
        "images": ["Yamuna_PreFlood.tif", "Yamuna_PostFlood.tif"],
        "analyses": [],
        "queries_count": 8,
    },
    "proj_0003": {
        "id": "proj_0003",
        "name": "Industrial Infrastructure Monitoring",
        "description": "Open-vocabulary visual grounding and building mask extraction over industrial zones.",
        "aoi_polygon": None,
        "created_at": "2026-08-25T11:15:00Z",
        "images": ["Industrial_Zone_A.tif"],
        "analyses": [],
        "queries_count": 6,
    },
}

class ProjectCreate(BaseModel):
    name: str
    description: str
    aoi_polygon: Optional[Dict[str, Any]] = None
    map_center: Optional[List[float]] = None
    map_zoom: Optional[float] = None
    location_name: Optional[str] = None

class ProjectUpdate(BaseModel):
    name: Optional[str] = None
    description: Optional[str] = None
    aoi_polygon: Optional[Dict[str, Any]] = None
    map_center: Optional[List[float]] = None
    map_zoom: Optional[float] = None
    location_name: Optional[str] = None

class AnalysisCreate(BaseModel):
    title: str
    mode: str
    query: str

@router.post("/projects")
async def create_project(project_in: ProjectCreate):
    projects_col = get_projects_collection()
    now = time.strftime("%Y-%m-%dT%H:%M:%SZ", time.gmtime())
    
    count = len(PROJECTS_DB)
    if projects_col is not None:
        try:
            count = await projects_col.count_documents({})
        except Exception:
            pass
            
    proj_id = f"proj_{count + 1:04d}"
    
    project_data = {
        "id": proj_id,
        "name": project_in.name,
        "description": project_in.description,
        "aoi_polygon": project_in.aoi_polygon,
        "map_center": project_in.map_center,
        "map_zoom": project_in.map_zoom,
        "location_name": project_in.location_name,
        "created_at": now,
        "images": [],
        "analyses": [],
        "queries_count": 0,
    }
    
    if projects_col is not None:
        try:
            await projects_col.insert_one(dict(project_data))
        except Exception:
            PROJECTS_DB[proj_id] = project_data
    else:
        PROJECTS_DB[proj_id] = project_data
        
    PROJECTS_DB[proj_id] = project_data
    return project_data

@router.get("/projects")
async def list_projects():
    projects_col = get_projects_collection()
    if projects_col is not None:
        try:
            cursor = projects_col.find({}, {"_id": 0})
            projects = await cursor.to_list(length=100)
            if projects:
                return projects
        except Exception:
            pass
    return list(PROJECTS_DB.values())

@router.get("/projects/{project_id}")
async def get_project(project_id: str):
    projects_col = get_projects_collection()
    if projects_col is not None:
        try:
            proj = await projects_col.find_one({"id": project_id}, {"_id": 0})
            if proj:
                return proj
        except Exception:
            pass
            
    if project_id not in PROJECTS_DB:
        raise HTTPException(status_code=404, detail="Project not found")
    return PROJECTS_DB[project_id]

@router.patch("/projects/{project_id}")
@router.put("/projects/{project_id}")
async def update_project(project_id: str, project_update: ProjectUpdate):
    projects_col = get_projects_collection()
    update_data = {k: v for k, v in project_update.dict().items() if v is not None}
    if not update_data:
        raise HTTPException(status_code=400, detail="No fields provided for update")

    if projects_col is not None:
        try:
            res = await projects_col.update_one({"id": project_id}, {"$set": update_data})
            if res.matched_count > 0:
                updated = await projects_col.find_one({"id": project_id}, {"_id": 0})
                if project_id in PROJECTS_DB:
                    PROJECTS_DB[project_id].update(update_data)
                return updated
        except Exception:
            pass

    if project_id not in PROJECTS_DB:
        raise HTTPException(status_code=404, detail="Project not found")
    PROJECTS_DB[project_id].update(update_data)
    return PROJECTS_DB[project_id]

@router.delete("/projects/{project_id}")
async def delete_project(project_id: str):
    projects_col = get_projects_collection()
    if projects_col is not None:
        try:
            res = await projects_col.delete_one({"id": project_id})
            if res.deleted_count > 0:
                PROJECTS_DB.pop(project_id, None)
                return {"status": "deleted", "id": project_id}
        except Exception:
            pass
            
    if project_id not in PROJECTS_DB:
        raise HTTPException(status_code=404, detail="Project not found")
    del PROJECTS_DB[project_id]
    return {"status": "deleted", "id": project_id}

@router.post("/projects/{project_id}/analyses")
async def create_analysis(project_id: str, analysis_in: AnalysisCreate):
    projects_col = get_projects_collection()
    analyses_col = get_analyses_collection()
    
    proj = None
    if projects_col is not None:
        try:
            proj = await projects_col.find_one({"id": project_id})
        except Exception:
            proj = None
            
    if not proj and project_id not in PROJECTS_DB:
        raise HTTPException(status_code=404, detail="Project not found")
        
    analyses_list = proj.get("analyses", []) if proj else PROJECTS_DB[project_id].get("analyses", [])
    analysis_id = f"anl_{len(analyses_list) + 1:03d}"
    now = time.strftime("%Y-%m-%dT%H:%M:%SZ", time.gmtime())
    
    analysis_data = {
        "id": analysis_id,
        "project_id": project_id,
        "title": analysis_in.title,
        "mode": analysis_in.mode,
        "query": analysis_in.query,
        "status": "completed",
        "created_at": now,
    }
    
    if projects_col is not None:
        try:
            await projects_col.update_one(
                {"id": project_id},
                {
                    "$push": {"analyses": analysis_data},
                    "$inc": {"queries_count": 1},
                }
            )
        except Exception:
            pass
            
    if analyses_col is not None:
        try:
            await analyses_col.insert_one(dict(analysis_data))
        except Exception:
            pass

    if project_id in PROJECTS_DB:
        PROJECTS_DB[project_id]["analyses"].append(analysis_data)
        PROJECTS_DB[project_id]["queries_count"] += 1
        
    return analysis_data
