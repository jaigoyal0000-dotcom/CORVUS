import sys
import os
import unittest

root_dir = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
sys.path.insert(0, os.path.join(root_dir, "backend"))
sys.path.insert(0, root_dir)

from app.services.query_interpreter import query_interpreter
from app.services.agent_controller import agent_controller
from app.services.evidence_service import evidence_service
from app.services.execution_trace_service import execution_trace_service

class TestAgentControllerPipeline(unittest.TestCase):
    def test_query_interpreter(self):
        res1 = query_interpreter.interpret_query("What changed between these two dates?")
        self.assertEqual(res1["intent"], "CHANGE_ANALYSIS")
        self.assertEqual(res1["task"], "change_detection")

        res2 = query_interpreter.interpret_query("Use optical and SAR images together")
        self.assertEqual(res2["intent"], "CROSS_MODAL")
        self.assertEqual(res2["task"], "optical_sar_fusion")

        res3 = query_interpreter.interpret_query("Highlight the water body")
        self.assertEqual(res3["intent"], "GROUNDING")
        self.assertEqual(res3["task"], "grounding")

    def test_agent_controller_end_to_end(self):
        res = agent_controller.process_analysis_request(
            query="What changed between these two dates?",
            filename_t1="Delhi_Optical_T1.tif",
            filename_t2="Delhi_Optical_T2.tif",
        )
        self.assertIn("request_id", res)
        self.assertIn("answer", res)
        self.assertIn("confidence_display", res)
        self.assertTrue(len(res["evidence"]) > 0)
        self.assertIn("execution_trace", res)
        self.assertEqual(res["execution_trace"]["status"], "completed")

if __name__ == "__main__":
    unittest.main()
