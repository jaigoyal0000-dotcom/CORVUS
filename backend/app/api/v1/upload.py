import os
import uuid
import time
import logging
from typing import Optional, Dict, Any
from fastapi import APIRouter, HTTPException, UploadFile, File, Form
from pydantic import BaseModel
from PIL import Image
import io

from app.services.minio_service import minio_service
from app.services.geospatial_validator import geospatial_validator
from app.core.config import settings

logger = logging.getLogger(__name__)

router = APIRouter()

UPLOADS_DB: Dict[str, Dict[str, Any]] = {}
UPLOADS_STORAGE_DIR = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", "..", "..", "..", "data", "uploads"))
os.makedirs(UPLOADS_STORAGE_DIR, exist_ok=True)

class UploadInitRequest(BaseModel):
    filename: str
    file_size_bytes: int
    modality: str # 'optical', 'sar', 't1_optical', 't2_optical'
    project_id: Optional[str] = None

class UploadInitResponse(BaseModel):
    upload_id: str
    filename: str
    presigned_url: str
    object_key: str
    bucket: str

class UploadCompleteRequest(BaseModel):
    upload_id: str
    object_key: str

@router.post("/upload/init", response_model=UploadInitResponse)
async def init_upload(req: UploadInitRequest):
    upload_id = f"upl_{uuid.uuid4().hex[:12]}"
    object_key = f"rasters/{upload_id}/{req.filename}"
    
    presigned_url = f"http://{settings.MINIO_ENDPOINT}/{settings.MINIO_BUCKET_NAME}/{object_key}"
    
    upload_record = {
        "upload_id": upload_id,
        "filename": req.filename,
        "file_size": req.file_size_bytes,
        "modality": req.modality,
        "project_id": req.project_id,
        "object_key": object_key,
        "status": "initiated",
        "created_at": time.strftime("%Y-%m-%dT%H:%M:%SZ", time.gmtime()),
    }
    UPLOADS_DB[upload_id] = upload_record
    
    return {
        "upload_id": upload_id,
        "filename": req.filename,
        "presigned_url": presigned_url,
        "object_key": object_key,
        "bucket": settings.MINIO_BUCKET_NAME,
    }

@router.post("/upload/complete")
async def complete_upload(req: UploadCompleteRequest):
    if req.upload_id not in UPLOADS_DB:
        raise HTTPException(status_code=404, detail="Upload session not found")
        
    record = UPLOADS_DB[req.upload_id]
    record["status"] = "uploaded"
    
    validation_result = geospatial_validator.validate_and_extract_metadata(record["filename"])
    record["metadata"] = validation_result
    record["status"] = "validated" if validation_result["valid"] else "validation_failed"
    
    return {
        "upload_id": req.upload_id,
        "status": record["status"],
        "filename": record["filename"],
        "object_key": req.object_key,
        "geospatial_metadata": validation_result,
    }

@router.post("/upload/direct")
async def direct_upload(
    file: UploadFile = File(...),
    modality: str = Form("optical"),
    project_id: Optional[str] = Form(None),
    location_name: Optional[str] = Form(None),
    centroid_lon: Optional[float] = Form(None),
    centroid_lat: Optional[float] = Form(None),
):
    upload_id = f"upl_{uuid.uuid4().hex[:12]}"
    filename = file.filename or "raster.tif"
    content = await file.read()
    
    # Save file to static uploads directory
    target_dir = os.path.join(UPLOADS_STORAGE_DIR, upload_id)
    os.makedirs(target_dir, exist_ok=True)
    saved_path = os.path.join(target_dir, filename)
    with open(saved_path, "wb") as f:
        f.write(content)
        
    # Generate web-friendly PNG preview if it's an image
    preview_filename = filename
    try:
        img = Image.open(io.BytesIO(content))
        if filename.lower().endswith((".tif", ".tiff")):
            preview_filename = f"{os.path.splitext(filename)[0]}.png"
            preview_path = os.path.join(target_dir, preview_filename)
            img.convert("RGB").save(preview_path, "PNG")
    except Exception:
        pass
        
    preview_url = f"http://localhost:8000/uploads/{upload_id}/{preview_filename}"
    object_key = f"rasters/{upload_id}/{filename}"
    
    # Check MongoDB or parameters for project location hint
    project_hint = None
    if centroid_lon is not None and centroid_lat is not None:
        project_hint = {
            "name": location_name or f"Specified Location ({centroid_lat:.4f}°N, {centroid_lon:.4f}°E)",
            "centroid": [centroid_lon, centroid_lat],
            "bbox": [
                round(centroid_lon - 0.04, 4),
                round(centroid_lat - 0.04, 4),
                round(centroid_lon + 0.04, 4),
                round(centroid_lat + 0.04, 4),
            ],
            "source": "Client Specified",
        }
    elif project_id:
        try:
            from app.db.mongodb import get_sync_mongodb
            db = get_sync_mongodb()
            if db is not None:
                query = {"id": project_id} if project_id != "current" else {}
                p = db["projects"].find_one(query)
                if p and p.get("map_center"):
                    project_hint = {
                        "name": p.get("location_name") or p.get("name"),
                        "centroid": p.get("map_center"),
                        "bbox": [
                            round(p["map_center"][0] - 0.04, 4),
                            round(p["map_center"][1] - 0.04, 4),
                            round(p["map_center"][0] + 0.04, 4),
                            round(p["map_center"][1] + 0.04, 4),
                        ],
                        "source": "Project Mission AOI",
                    }
        except Exception:
            pass

    validation_result = geospatial_validator.validate_and_extract_metadata(filename, content, project_location_hint=project_hint)
    validation_result["preview_url"] = preview_url
    validation_result["saved_path"] = saved_path
    
    # If project exists, attach image and anchor location if not already set or fresh
    if project_id and project_id != "current":
        try:
            from app.db.mongodb import get_sync_mongodb
            db = get_sync_mongodb()
            if db is not None:
                p = db["projects"].find_one({"id": project_id})
                update_fields = {"images": filename}
                # If project has no coordinates yet, anchor to this uploaded image!
                if not p or not p.get("map_center"):
                    coords = validation_result["centroid"]
                    bbox = validation_result["bounding_box"]
                    db.projects.update_one(
                        {"id": project_id},
                        {
                            "$set": {
                                "map_center": coords,
                                "map_zoom": 14.0,
                                "location_name": validation_result["location_name"],
                                "aoi_polygon": {
                                    "type": "Polygon",
                                    "coordinates": [[
                                        [bbox[0], bbox[1]],
                                        [bbox[2], bbox[1]],
                                        [bbox[2], bbox[3]],
                                        [bbox[0], bbox[3]],
                                        [bbox[0], bbox[1]],
                                    ]]
                                }
                            },
                            "$addToSet": {"images": filename}
                        }
                    )
                else:
                    db.projects.update_one(
                        {"id": project_id},
                        {"$addToSet": {"images": filename}}
                    )
        except Exception as e:
            logger.error(f"Failed to update project with image upload: {e}")

    record = {
        "upload_id": upload_id,
        "filename": filename,
        "file_size": len(content),
        "modality": modality,
        "project_id": project_id,
        "object_key": object_key,
        "status": "validated" if validation_result["valid"] else "validation_failed",
        "metadata": validation_result,
        "preview_url": preview_url,
        "created_at": time.strftime("%Y-%m-%dT%H:%M:%SZ", time.gmtime()),
    }
    UPLOADS_DB[upload_id] = record
    
    return {
        "upload_id": upload_id,
        "status": record["status"],
        "filename": filename,
        "modality": modality,
        "preview_url": preview_url,
        "geospatial_metadata": validation_result,
        "centroid": validation_result.get("centroid"),
        "bounding_box": validation_result.get("bounding_box"),
        "location_name": validation_result.get("location_name"),
    }

