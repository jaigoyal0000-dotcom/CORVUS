import sys
import os
import unittest

root_dir = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
sys.path.insert(0, os.path.join(root_dir, "backend"))
sys.path.insert(0, root_dir)

from app.core.config import settings
from app.services.minio_service import minio_service
from app.services.geospatial_validator import geospatial_validator
from app.services.optical_preprocessor import optical_preprocessor
from app.services.sar_preprocessor import sar_preprocessor
from app.services.spatial_aligner import spatial_aligner
from app.services.gis_engine import gis_engine
from app.core.security import hash_password, verify_password, create_access_token, decode_access_token

class TestBackendEndpoints(unittest.TestCase):
    def test_settings_loaded(self):
        self.assertIn("CORVUS", settings.PROJECT_NAME)
        self.assertEqual(settings.VERSION, "0.1.0")

    def test_minio_service_initialized(self):
        health = minio_service.check_health()
        self.assertIn("status", health)

    def test_security_hashing_and_jwt(self):
        pwd = "SecretPassword123!"
        hashed = hash_password(pwd)
        self.assertTrue(verify_password(pwd, hashed))
        self.assertFalse(verify_password("WrongPassword", hashed))

        token = create_access_token({"sub": "usr_0001", "email": "analyst@corvus.ai", "role": "analyst"})
        payload = decode_access_token(token)
        self.assertIsNotNone(payload)
        self.assertEqual(payload["email"], "analyst@corvus.ai")

    def test_geospatial_validation(self):
        res = geospatial_validator.validate_and_extract_metadata("Delhi_Optical_T1.tif")
        self.assertTrue(res["valid"])
        self.assertEqual(res["format"], "GeoTIFF")
        self.assertEqual(res["sensor"], "Sentinel-2 MSI")

    def test_optical_and_sar_preprocessing(self):
        opt_res = optical_preprocessor.preprocess({"sensor": "Sentinel-2 MSI", "resolution_m": 10.0})
        self.assertEqual(opt_res["modality"], "optical")
        self.assertTrue(opt_res["normalized"])

        sar_res = sar_preprocessor.preprocess({"sensor": "Sentinel-1 SAR", "polarization": "VV+VH"})
        self.assertEqual(sar_res["modality"], "sar")
        self.assertTrue(sar_res["db_scaling"])

    def test_spatial_aligner_and_gis_engine(self):
        meta_a = {"bounding_box": [77.10, 28.70, 77.25, 28.81], "crs": "EPSG:4326"}
        meta_b = {"bounding_box": [77.12, 28.71, 77.24, 28.80], "crs": "EPSG:4326"}
        aligned = spatial_aligner.align_pair(meta_a, meta_b)
        self.assertEqual(aligned["status"], "aligned")

        stats = gis_engine.calculate_change_statistics(None, None, None, pixel_resolution_m=10.0)
        self.assertIn("percentage_increase", stats)
        self.assertEqual(stats["percentage_increase"], 26.49)

if __name__ == "__main__":
    unittest.main()
