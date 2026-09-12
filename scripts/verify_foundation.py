#!/usr/bin/env python3
"""
CORVUS System Foundation & Master Architecture Verifier
Checks Python environment, corvus_ai package imports, backend modules, query interpreter, agent controller, and 15 monorepo directories.
"""

import sys
import os

if hasattr(sys.stdout, "reconfigure"):
    sys.stdout.reconfigure(encoding="utf-8")

root_dir = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
sys.path.insert(0, root_dir)
sys.path.insert(0, os.path.join(root_dir, "backend"))

def check_ai_packages():
    print("[1/4] Testing AI Package imports (`corvus_ai` / `ai`)...")
    try:
        import ai
        from ai.vqa import VQAPipeline
        from ai.captioning import CaptioningPipeline
        from ai.grounding import VisualGroundingPipeline
        from ai.segmentation import SegmentationPipeline
        from ai.change_detection import ChangeDetectionPipeline
        from ai.optical_sar import OpticalSARFusionPipeline
        from ai.agents import SatQueryAgent

        print("  [OK] `ai.vqa` (VQAPipeline)")
        print("  [OK] `ai.captioning` (CaptioningPipeline)")
        print("  [OK] `ai.grounding` (VisualGroundingPipeline)")
        print("  [OK] `ai.segmentation` (SegmentationPipeline)")
        print("  [OK] `ai.change_detection` (ChangeDetectionPipeline)")
        print("  [OK] `ai.optical_sar` (OpticalSARFusionPipeline)")
        print("  [OK] `ai.agents` (SatQueryAgent)")

        agent = SatQueryAgent()
        res = agent.execute_user_query("Detect flooded regions in AOI")
        print(f"  [OK] Agent dry-run successful: {res['agent']} response received.")
        return True
    except Exception as e:
        print(f"  [FAIL] Error importing AI package: {e}")
        return False

def check_backend_and_agent_services():
    print("\n[2/4] Testing FastAPI Backend & Agent Controller...")
    try:
        from app.core.config import settings
        from app.main import app
        from app.services.query_interpreter import query_interpreter
        from app.services.agent_controller import agent_controller
        from app.services.evidence_service import evidence_service

        q_res = query_interpreter.interpret_query("What changed between these two dates?")
        print(f"  [OK] Query Interpreter Intent: {q_res['intent']} (Task: {q_res['task']})")

        agent_res = agent_controller.process_analysis_request("What changed between these two dates?")
        print(f"  [OK] Agent Controller Run -> Request ID: {agent_res['request_id']} | Confidence: {agent_res['confidence_display']}")
        print(f"  [OK] Evidence Assembled: {len(agent_res['evidence'])} items")
        print(f"  [OK] Execution Trace Steps: {len(agent_res['execution_trace']['steps'])} audit stages completed")
        return True
    except Exception as e:
        print(f"  [FAIL] Error in backend/agent controller: {e}")
        return False

def check_model_registry():
    print("\n[3/4] Testing Central Model Registry...")
    registry_file = os.path.join(root_dir, "model_registry", "registry.yaml")
    if os.path.isfile(registry_file):
        print(f"  [OK] Model Registry active at: model_registry/registry.yaml")
        return True
    else:
        print(f"  [FAIL] Missing registry file at: {registry_file}")
        return False

def check_monorepo_folders():
    print("\n[4/4] Checking Monorepo Directory Layout (15 Directories)...")
    required_folders = [
        "frontend", "backend", "ai", "data", "models", 
        "scripts", "notebooks", "tests", "docs", "docker",
        "preprocessing", "datasets", "model_registry", "evidence", "reports"
    ]
    all_ok = True
    for folder in required_folders:
        path = os.path.join(root_dir, folder)
        if os.path.isdir(path):
            print(f"  [OK] Directory exists: {folder}/")
        else:
            print(f"  [FAIL] Directory missing: {folder}/")
            all_ok = False
    return all_ok

def main():
    print("==================================================")
    print("   CORVUS -- THE WATCHING CROW (SatQuery AI)      ")
    print("   Master Architecture Verification Suite          ")
    print("==================================================")
    
    ok1 = check_ai_packages()
    ok2 = check_backend_and_agent_services()
    ok3 = check_model_registry()
    ok4 = check_monorepo_folders()
    
    if ok1 and ok2 and ok3 and ok4:
        print("\nSUCCESS: All CORVUS Master Architecture components verified!")
        sys.exit(0)
    else:
        print("\nFAILURE: One or more architecture checks failed.")
        sys.exit(1)

if __name__ == "__main__":
    main()
