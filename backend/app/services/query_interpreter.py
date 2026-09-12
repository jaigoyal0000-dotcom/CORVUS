from typing import Dict, Any, List

class QueryInterpreter:
    """
    Phase 5: Query Interpreter.
    Converts natural language user queries into structured Task JSON representations.
    """
    
    def interpret_query(self, query_text: str, available_modalities: List[str] = None) -> Dict[str, Any]:
        q = query_text.lower().strip()
        modalities = available_modalities or ["single_optical"]
        
        # Rule & Keyword Pattern Matching Engine
        if "changed" in q or "difference" in q or "temporal" in q:
            if "increased" in q or "decreased" in q or "area" in q or "hectare" in q or "km" in q or "m²" in q or "square" in q:
                intent = "QUANTITATIVE_CHANGE"
                task = "change_vqa"
                required_inputs = ["image_t1", "image_t2"]
            else:
                intent = "CHANGE_ANALYSIS"
                task = "change_detection"
                required_inputs = ["image_t1", "image_t2"]
                
        elif "sar" in q or "radar" in q or ("optical" in q and "sar" in q):
            intent = "CROSS_MODAL"
            task = "optical_sar_fusion"
            required_inputs = ["optical", "sar"]
            
        elif "highlight" in q or "where" in q or "locate" in q or "detect bbox" in q or "show" in q:
            intent = "GROUNDING"
            task = "grounding"
            required_inputs = ["image"]
            
        elif "describe" in q or "caption" in q or "summary" in q or "overview" in q:
            intent = "DESCRIPTION"
            task = "captioning"
            required_inputs = ["image"]
            
        else:
            intent = "VQA"
            task = "vqa"
            required_inputs = ["image"]

        return {
            "query": query_text,
            "intent": intent,
            "task": task,
            "required_inputs": required_inputs,
            "output_requirements": ["description", "spatial_evidence", "confidence", "execution_trace"],
        }

query_interpreter = QueryInterpreter()
