import sys
import os
import unittest

root_dir = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
sys.path.insert(0, root_dir)

from ai.vqa import VQAPipeline
from ai.captioning import CaptioningPipeline
from ai.grounding import VisualGroundingPipeline
from ai.segmentation import SegmentationPipeline
from ai.change_detection import ChangeDetectionPipeline
from ai.optical_sar import OpticalSARFusionPipeline
from ai.agents import SatQueryAgent

class TestAIPipelines(unittest.TestCase):
    def test_vqa_pipeline(self):
        vqa = VQAPipeline()
        res = vqa.answer_question(None, "How many water bodies are visible?")
        self.assertIn("answer", res)

    def test_captioning_pipeline(self):
        cap = CaptioningPipeline()
        res = cap.generate_caption(None)
        self.assertIn("caption", res)

    def test_grounding_pipeline(self):
        grounding = VisualGroundingPipeline()
        res = grounding.locate_objects(None, "solar panels")
        self.assertIn("boxes", res)

    def test_segmentation_pipeline(self):
        seg = SegmentationPipeline()
        res = seg.segment_scene(None)
        self.assertEqual(res["status"], "success")

    def test_change_detection_pipeline(self):
        cd = ChangeDetectionPipeline()
        res = cd.detect_changes(None, None)
        self.assertIn("changed_pixels_percentage", res)

    def test_optical_sar_pipeline(self):
        opt_sar = OpticalSARFusionPipeline()
        res = opt_sar.fuse_and_analyze(None, None)
        self.assertEqual(res["status"], "fusion_complete")

    def test_satquery_agent(self):
        agent = SatQueryAgent()
        res = agent.execute_user_query("Analyze urban expansion")
        self.assertIn("reasoning_steps", res)

if __name__ == "__main__":
    unittest.main()
