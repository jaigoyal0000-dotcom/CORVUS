"""
CORVUS AI Engine Package (`corvus_ai`)
SatQuery AI — Multi-Modal Geospatial Intelligence
"""

__version__ = "0.1.0"

from .vqa.pipeline import VQAPipeline
from .captioning.pipeline import CaptioningPipeline
from .grounding.pipeline import VisualGroundingPipeline
from .segmentation.pipeline import SegmentationPipeline
from .change_detection.pipeline import ChangeDetectionPipeline
from .optical_sar.pipeline import OpticalSARFusionPipeline
from .agents.satquery_agent import SatQueryAgent

__all__ = [
    "VQAPipeline",
    "CaptioningPipeline",
    "VisualGroundingPipeline",
    "SegmentationPipeline",
    "ChangeDetectionPipeline",
    "OpticalSARFusionPipeline",
    "SatQueryAgent",
]
