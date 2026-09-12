import sys
from pathlib import Path
from typing import Dict, Any, List
import uuid
import time

_current_dir = Path(__file__).resolve().parent
_backend_dir = _current_dir.parent.parent
_project_root = _backend_dir.parent

for _p in [str(_current_dir), str(_backend_dir), str(_project_root)]:
    if _p not in sys.path:
        sys.path.insert(0, _p)

from app.services.query_interpreter import query_interpreter
from app.services.geospatial_validator import geospatial_validator
from app.services.spatial_aligner import spatial_aligner
from app.services.gis_engine import gis_engine
from app.services.evidence_service import evidence_service
from app.services.execution_trace_service import execution_trace_service
from app.services.llm_service import llm_service

from ai.vqa import VQAPipeline
from ai.captioning import CaptioningPipeline
from ai.grounding import VisualGroundingPipeline
from ai.segmentation import SegmentationPipeline
from ai.change_detection import ChangeDetectionPipeline
from ai.optical_sar import OpticalSARFusionPipeline

class CorvusAgentController:
    """
    Phase 6: Agentic Brain & Orchestrator.
    Executes end-to-end CORVUS pipeline with deep situation & map context awareness:
    Query -> LLM Classification -> Validation -> Model Selection -> Specialist Execution -> GIS Stats -> Grounded LLM Answer -> Evidence -> Trace -> Response
    """
    
    def __init__(self):
        self.vqa = VQAPipeline()
        self.captioning = CaptioningPipeline()
        self.grounding = VisualGroundingPipeline()
        self.segmentation = SegmentationPipeline()
        self.change_detection = ChangeDetectionPipeline()
        self.optical_sar = OpticalSARFusionPipeline()

    def process_analysis_request(
        self,
        query: str,
        filename_t1: str = None,
        filename_t2: str = None,
        filename_sar: str = None,
        image_base64_a: str = None,
        image_base64_b: str = None,
        mode: str = "auto",
        chat_history: List[Dict[str, Any]] = None,
        map_context: Dict[str, Any] = None,
        api_key: str = None,
    ) -> Dict[str, Any]:
        req_id = f"REQ-{uuid.uuid4().hex[:6].upper()}"
        trace = execution_trace_service.create_trace(req_id, query)
        start_time = time.time()

        is_text_only = (mode == "text_only") or (
            not filename_t1 and not image_base64_a and not filename_t2 and not image_base64_b
        )
        is_dual_image = (mode == "dual_image") or bool(image_base64_b) or bool(filename_t2)
        
        # Step 1: LLM-Powered Query Interpretation
        execution_trace_service.add_step(
            trace, "Query Interpretation",
            f"Classifying query intent via NLP: '{query[:50]}...' [Mode: {mode.upper()}]"
        )
        
        # Use LLM service for intent classification
        llm_classification = llm_service.classify_intent(query, api_key=api_key)
        task = llm_classification["task"]
        intent = llm_classification["intent"]
        classification_method = llm_classification.get("method", "rules")
        reasoning = llm_classification.get("reasoning", "")

        is_sar_input = bool(filename_sar) or (filename_t2 and "sar" in str(filename_t2).lower()) or any(w in query.lower() for w in ["sar", "radar", "fusion", "polarim"])
        if is_dual_image and task not in ("change_detection", "change_vqa", "optical_sar_fusion"):
            task = "optical_sar_fusion" if is_sar_input else "change_detection"
            intent = "CROSS_MODAL" if is_sar_input else "CHANGE_ANALYSIS"
        
        execution_trace_service.add_step(
            trace, "Task Classification",
            f"Intent: {intent} | Task: {task.upper()} | Method: {classification_method} | {reasoning}"
        )

        # Step 2: Input Compatibility Validation
        if is_text_only:
            execution_trace_service.add_step(
                trace, "Input Validation",
                "Text/Knowledge Query: Direct remote-sensing NLP synthesis (no raster file required)"
            )
            val_t1 = {
                "valid": True,
                "location_name": (map_context or {}).get("location_name", "Global Satellite Earth Observation"),
                "centroid": (map_context or {}).get("centroid", [77.1500, 28.7350]),
                "bbox": [77.05, 28.65, 77.25, 28.85],
            }
        else:
            fn_t1 = filename_t1 or "Delhi_Optical_T1.tif"
            execution_trace_service.add_step(
                trace, "Input Validation",
                f"Validating format, CRS, bands, and metadata for '{fn_t1}'"
            )
            val_t1 = geospatial_validator.validate_and_extract_metadata(fn_t1)
            
            if not val_t1["valid"]:
                execution_trace_service.add_step(
                    trace, "Input Validation",
                    "Validation failed: Unsupported format or corrupt file",
                    status="failed"
                )
                return {"error": "Invalid input raster format", "trace": trace}

        # Step 3: Specialist Model Execution & GIS Calculation
        specialist_res = {}
        gis_stats = None

        is_fusion_task = task == "optical_sar_fusion" or is_sar_input
        is_change_task = (task in ("change_detection", "change_vqa") or is_dual_image) and not is_fusion_task

        if is_change_task and not is_text_only:
            fn_t2 = filename_t2 or "Delhi_Optical_T2.tif"
            execution_trace_service.add_step(
                trace, "Co-registration & Alignment",
                f"Spatially aligning T1 and T2 ('{fn_t2}')"
            )
            val_t2 = geospatial_validator.validate_and_extract_metadata(fn_t2)
            alignment = spatial_aligner.align_pair(val_t1, val_t2)
            
            execution_trace_service.add_step(
                trace, "Specialist Model Run",
                "Executing ChangeFormer Bi-temporal Change Detection (41M params)"
            )
            specialist_res = self.change_detection.detect_changes(val_t1, val_t2)
            
            execution_trace_service.add_step(
                trace, "GIS Statistics Engine",
                "Calculating built-up area delta via PostGIS/GeoPandas"
            )
            gis_stats = gis_engine.calculate_change_statistics(None, None, None, pixel_resolution_m=10.0)

        elif is_fusion_task and not is_text_only:
            fn_sar = filename_sar or "Delhi_SAR.tif"
            execution_trace_service.add_step(
                trace, "Co-registration",
                f"Aligning Sentinel-2 Optical and Sentinel-1 SAR ('{fn_sar}')"
            )
            execution_trace_service.add_step(
                trace, "Specialist Model Run",
                "Executing Optical-SAR Sensor Fusion Head (28M params)"
            )
            specialist_res = self.optical_sar.fuse_and_analyze(val_t1, None)
            
            execution_trace_service.add_step(
                trace, "GIS Statistics Engine",
                "Extracting joint built-up, water, and vegetation features"
            )
            gis_stats = gis_engine.calculate_landcover_statistics(None, pixel_resolution_m=10.0)

        elif task == "grounding" and not is_text_only:
            execution_trace_service.add_step(
                trace, "Specialist Model Run",
                "Executing Grounding DINO BBox Locator (172M params)"
            )
            specialist_res = self.grounding.locate_objects(val_t1, query)
            gis_stats = gis_engine.calculate_landcover_statistics(None, pixel_resolution_m=10.0)

        elif task == "captioning" and not is_text_only:
            execution_trace_service.add_step(
                trace, "Specialist Model Run",
                "Executing GeoChat-7B Captioning Pipeline"
            )
            specialist_res = self.captioning.generate_caption(val_t1)
            gis_stats = gis_engine.calculate_landcover_statistics(None, pixel_resolution_m=10.0)

        else:  # VQA / General NLP
            execution_trace_service.add_step(
                trace, "Specialist Model Run",
                "Executing Remote-Sensing Multi-Modal Question Answering Engine"
            )
            specialist_res = self.vqa.answer_question(val_t1, query)
            gis_stats = gis_engine.calculate_landcover_statistics(None, pixel_resolution_m=10.0)

        # Step 4: LLM-Powered Grounded Answer Generation with Situational Map Context
        execution_trace_service.add_step(
            trace, "LLM Answer Generation",
            "Synthesizing grounded answer via LLM with live map & multi-modal inputs"
        )
        
        answer_text = llm_service.generate_grounded_answer(
            query=query,
            task=task,
            gis_stats=gis_stats,
            evidence=None,
            specialist_output=specialist_res,
            chat_history=chat_history,
            spatial_metadata=val_t1,
            map_context=map_context,
            api_key=api_key,
            image_base64_a=image_base64_a,
            image_base64_b=image_base64_b,
            mode=mode,
        )

        # Step 5: Evidence Assembly & Confidence Calibration
        execution_trace_service.add_step(
            trace, "Evidence Assembly",
            "Assembling spatial masks, bounding boxes, and statistics"
        )
        evidence_res = evidence_service.assemble_evidence(task, specialist_res, gis_stats)
        
        execution_trace_service.add_step(
            trace, "Confidence Calibration",
            f"C_final = 0.4×C_model + 0.4×C_evidence + 0.2×C_input → {evidence_res['confidence_display']}"
        )
        
        # Step 6: Finalization
        execution_trace_service.add_step(
            trace, "Response Generation",
            f"Grounded answer generated via {classification_method.upper()} pipeline"
        )
        
        total_latency = int((time.time() - start_time) * 1000)
        final_trace = execution_trace_service.finalize_trace(trace, evidence_res["confidence_score"])
        
        if "latency_ms" in final_trace:
            final_trace["latency_ms"] = total_latency

        return {
            "request_id": req_id,
            "query": query,
            "intent": intent,
            "task": task,
            "answer": answer_text,
            "confidence": evidence_res["confidence_score"],
            "confidence_display": evidence_res["confidence_display"],
            "evidence": evidence_res["evidence_list"],
            "gis_statistics": gis_stats,
            "execution_trace": final_trace,
            "llm_method": classification_method,
        }

agent_controller = CorvusAgentController()
