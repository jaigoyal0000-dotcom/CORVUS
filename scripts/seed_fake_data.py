#!/usr/bin/env python3
"""
CORVUS Synthetic Data Seeder
Populates MongoDB (corvus_db) with realistic users, multi-mission satellite projects,
geospatial analyses, and disaster risk telemetry.
"""

import sys
import os
import time

if hasattr(sys.stdout, "reconfigure"):
    sys.stdout.reconfigure(encoding="utf-8")

from pymongo import MongoClient

# Ensure root & backend are on sys.path
root_dir = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
sys.path.insert(0, root_dir)
sys.path.insert(0, os.path.join(root_dir, "backend"))

from app.core.security import hash_password
from app.core.config import settings

def seed_database():
    print("==================================================")
    print("   🛰️ CORVUS Geospatial Intelligence Data Seeder   ")
    print("   Target: MongoDB @ localhost:27017 / corvus_db   ")
    print("==================================================")

    client = MongoClient(settings.MONGODB_URL, serverSelectionTimeoutMS=3000)
    db = client[settings.MONGODB_DB_NAME]

    # 1. SEED USERS
    print("\n[1/4] Seeding Users collection...")
    users_col = db["users"]
    users = [
        {
            "id": "usr_0001",
            "email": "admin@corvus.ai",
            "full_name": "Corvus Mission Director",
            "hashed_password": hash_password("AdminPassword123!"),
            "role": "admin",
            "organization": "National Remote Sensing Agency",
            "badge": "CORVUS-HQ-COMMAND",
            "created_at": "2026-01-10T08:00:00Z",
        },
        {
            "id": "usr_0002",
            "email": "analyst@corvus.ai",
            "full_name": "Jay Goyal (Lead Geospatial Analyst)",
            "hashed_password": hash_password("AnalystPassword123!"),
            "role": "analyst",
            "organization": "SatQuery AI Intelligence Lab",
            "badge": "LEAD-AI-RESEARCHER",
            "created_at": "2026-01-15T09:30:00Z",
        },
        {
            "id": "usr_0003",
            "email": "demo@corvus.ai",
            "full_name": "Field Response Operator",
            "hashed_password": hash_password("DemoPassword123!"),
            "role": "operator",
            "organization": "NDRF Tactical Emergency Unit",
            "badge": "DISASTER-RAPID-OPS",
            "created_at": "2026-02-01T11:00:00Z",
        },
        {
            "id": "usr_0004",
            "email": "priya.sharma@isro.res.in",
            "full_name": "Dr. Priya Sharma",
            "hashed_password": hash_password("PriyaPassword123!"),
            "role": "researcher",
            "organization": "ISRO Space Applications Centre (SAC)",
            "badge": "OPTICAL-SAR-LEAD",
            "created_at": "2026-02-12T14:20:00Z",
        },
        {
            "id": "usr_0005",
            "email": "aarav.mehta@ndrf.gov.in",
            "full_name": "Cmdr. Aarav Mehta",
            "hashed_password": hash_password("AaravPassword123!"),
            "role": "operator",
            "organization": "National Disaster Response Force (NDRF)",
            "badge": "INCIDENT-COMMANDER",
            "created_at": "2026-03-01T10:15:00Z",
        },
        {
            "id": "usr_0006",
            "email": "sarah.chen@esa.int",
            "full_name": "Sarah Chen",
            "hashed_password": hash_password("SarahPassword123!"),
            "role": "researcher",
            "organization": "European Space Agency (Copernicus)",
            "badge": "SENTINEL-PIPELINE",
            "created_at": "2026-03-10T16:45:00Z",
        },
        {
            "id": "usr_0007",
            "email": "vikram.singh@imd.gov.in",
            "full_name": "Vikram Singh",
            "hashed_password": hash_password("VikramPassword123!"),
            "role": "analyst",
            "organization": "India Meteorological Department (IMD)",
            "badge": "MET-CYCLONE-DESK",
            "created_at": "2026-03-18T07:30:00Z",
        }
    ]

    for u in users:
        existing = users_col.find_one({"email": u["email"]})
        if existing:
            u["id"] = existing["id"]
        else:
            # find an unused ID
            while users_col.find_one({"id": u["id"]}):
                curr_num = int(u["id"].split("_")[-1])
                u["id"] = f"usr_{curr_num + 1:04d}"
        users_col.update_one({"email": u["email"]}, {"$set": u}, upsert=True)
    print(f"  [OK] Seeded {len(users)} users with roles: admin, analyst, operator, researcher.")

    # 2. SEED PROJECTS
    print("\n[2/4] Seeding Projects collection...")
    projects_col = db["projects"]
    projects = [
        {
            "id": "proj_0001",
            "name": "Delhi Urban Expansion & Land Cover",
            "description": "Bi-temporal Sentinel-2 (Optical) and Sentinel-1 (C-band SAR) analysis over National Capital Region (2024 - 2026). Tracks concrete densification and heat island hotspots.",
            "aoi_polygon": {
                "type": "Polygon",
                "coordinates": [[[77.10, 28.55], [77.30, 28.55], [77.30, 28.75], [77.10, 28.75], [77.10, 28.55]]]
            },
            "map_center": [77.2000, 28.6500],
            "map_zoom": 13.0,
            "location_name": "Delhi NCR Urban Expansion & Heat Island",
            "created_at": "2026-08-29T20:00:00Z",
            "images": ["Delhi_Optical_T1_2024.tif", "Delhi_Optical_T2_2026.tif", "Delhi_Sentinel1_SAR_VH.tif"],
            "queries_count": 22,
            "analyses": [
                {
                    "id": "anl_001",
                    "title": "Built-up Index (NDBI) Growth Vector",
                    "mode": "bi_temporal",
                    "query": "Quantify newly converted urban parcels between T1 and T2",
                    "status": "completed",
                    "created_at": "2026-08-30T10:12:00Z",
                },
                {
                    "id": "anl_002",
                    "title": "Ridge Forest Canopy Vegetation Health (NDVI)",
                    "mode": "single_optical",
                    "query": "Assess vegetation vigor drop in Northern Ridge Forest",
                    "status": "completed",
                    "created_at": "2026-08-31T14:40:00Z",
                }
            ],
            "tags": ["Urban", "Change Detection", "Sentinel-2", "SAR Fusion"],
            "status": "active",
        },
        {
            "id": "proj_0002",
            "name": "Yamuna River Flood Inundation & Embankment Stress",
            "description": "Multi-modal optical and all-weather SAR flood water delineation along Okhla Barrage and Wazirabad floodplains. Computes water depth anomalies and submerged residential clusters.",
            "aoi_polygon": {
                "type": "Polygon",
                "coordinates": [[[77.20, 28.60], [77.35, 28.60], [77.35, 28.72], [77.20, 28.72], [77.20, 28.60]]]
            },
            "map_center": [77.2750, 28.6600],
            "map_zoom": 13.5,
            "location_name": "Yamuna River Floodplain Basin, Delhi",
            "created_at": "2026-08-28T14:30:00Z",
            "images": ["Yamuna_PreFlood_Jul2026.tif", "Yamuna_PostFlood_Aug2026.tif", "Yamuna_SAR_CoPol_VV.tif"],
            "queries_count": 17,
            "analyses": [
                {
                    "id": "anl_003",
                    "title": "Normalized Difference Water Index (NDWI) Delineation",
                    "mode": "optical_sar",
                    "query": "Identify high-moisture silt deposits and active standing floodwater",
                    "status": "completed",
                    "created_at": "2026-08-29T11:05:00Z",
                }
            ],
            "tags": ["Flood", "Disaster", "SAR Radar", "Emergency"],
            "status": "active",
        },
        {
            "id": "proj_0003",
            "name": "Bhadla Solar Park & Renewable Transmission Corridor",
            "description": "High-resolution open-vocabulary visual grounding for photovoltaic solar panel arrays, inverter stations, dust accumulation degradation, and 765kV transmission tower corridors in Thar Desert.",
            "aoi_polygon": {
                "type": "Polygon",
                "coordinates": [[[71.85, 27.45], [72.10, 27.45], [72.10, 27.65], [71.85, 27.65], [71.85, 27.45]]]
            },
            "map_center": [71.9750, 27.5500],
            "map_zoom": 13.0,
            "location_name": "Bhadla Solar Park, Rajasthan",
            "created_at": "2026-08-25T11:15:00Z",
            "images": ["Bhadla_Solar_Orthomosaic_RGB.tif", "Bhadla_ShortWave_Infrared_SWIR.tif"],
            "queries_count": 12,
            "analyses": [
                {
                    "id": "anl_004",
                    "title": "Grounding DINO Photovoltaic Module Array Counter",
                    "mode": "single_optical",
                    "query": "Detect all utility-scale solar panel arrays and sub-stations",
                    "status": "completed",
                    "created_at": "2026-08-26T09:20:00Z",
                }
            ],
            "tags": ["Renewable", "Visual Grounding", "Infrastructure", "Clean Energy"],
            "status": "active",
        },
        {
            "id": "proj_0004",
            "name": "Sundarbans Mangrove Canopy Deforestation & Tidal Retreat",
            "description": "Multi-temporal bio-reserve tracking. Measures saline water intrusion, coastal mudbank erosion, and mangrove canopy loss across the Indian and Bangladeshi delta perimeter.",
            "aoi_polygon": {
                "type": "Polygon",
                "coordinates": [[[88.50, 21.60], [89.10, 21.60], [89.10, 22.20], [88.50, 22.20], [88.50, 21.60]]]
            },
            "map_center": [88.8000, 21.9000],
            "map_zoom": 11.5,
            "location_name": "Sundarbans Mangrove Biosphere, India",
            "created_at": "2026-08-20T08:00:00Z",
            "images": ["Sundarbans_T1_2023.tif", "Sundarbans_T2_2026.tif", "Sundarbans_SAR_Interferometry.tif"],
            "queries_count": 19,
            "analyses": [
                {
                    "id": "anl_005",
                    "title": "Bi-Temporal Mangrove Dieback & Tidal Inundation",
                    "mode": "bi_temporal",
                    "query": "Highlight deforested delta mangrove parcels between 2023 and 2026",
                    "status": "completed",
                    "created_at": "2026-08-21T15:10:00Z",
                }
            ],
            "tags": ["Ecology", "Mangrove", "Biodiversity", "Sentinel-2"],
            "status": "active",
        },
        {
            "id": "proj_0005",
            "name": "Joshimath Slope Stability & Land Subsidence Sentinel",
            "description": "Interferometric Synthetic Aperture Radar (InSAR) surface displacement mapping along the Main Central Thrust (MCT) zone. Flags building structural crack risks and unstable scree slopes.",
            "aoi_polygon": {
                "type": "Polygon",
                "coordinates": [[[79.52, 30.52], [79.62, 30.52], [79.62, 30.60], [79.52, 30.60], [79.52, 30.52]]]
            },
            "map_center": [79.5700, 30.5600],
            "map_zoom": 14.0,
            "location_name": "Joshimath MCT Subsidence Zone, Uttarakhand",
            "created_at": "2026-08-15T13:40:00Z",
            "images": ["Joshimath_Ascending_InSAR.tif", "Joshimath_Descending_InSAR.tif", "Joshimath_ALOS_PALSAR.tif"],
            "queries_count": 14,
            "analyses": [
                {
                    "id": "anl_006",
                    "title": "Line-of-Sight (LOS) Surface Displacement Vector",
                    "mode": "single_sar",
                    "query": "Identify high subsidence velocity zones exceeding 50mm/year",
                    "status": "completed",
                    "created_at": "2026-08-16T12:00:00Z",
                }
            ],
            "tags": ["Landslide", "InSAR", "Geohazard", "Himalayas"],
            "status": "active",
        },
        {
            "id": "proj_0006",
            "name": "Mumbai Coastal Road Reclamation & Coastal Plume Dynamics",
            "description": "Monitors offshore land reclamation along the Arabian Sea coast from Marine Drive to Worli. Evaluates suspended sediment plumes, mangrove proximity, and tidal wave breakers.",
            "aoi_polygon": {
                "type": "Polygon",
                "coordinates": [[[72.78, 18.90], [72.86, 18.90], [72.86, 19.05], [72.78, 19.05], [72.78, 18.90]]]
            },
            "map_center": [72.8200, 18.9750],
            "map_zoom": 13.5,
            "location_name": "Mumbai Coastal Road & Land Reclamation, Maharashtra",
            "created_at": "2026-08-10T16:20:00Z",
            "images": ["Mumbai_Coast_PreReclaim.tif", "Mumbai_Coast_PostReclaim.tif"],
            "queries_count": 9,
            "analyses": [
                {
                    "id": "anl_007",
                    "title": "Coastal Boundary Reclaimed Acreage Calculator",
                    "mode": "bi_temporal",
                    "query": "Measure exact reclaimed coastline area in hectares",
                    "status": "completed",
                    "created_at": "2026-08-11T17:35:00Z",
                }
            ],
            "tags": ["Urban Coastal", "Reclamation", "Coastal Engineering", "Water Plume"],
            "status": "active",
        },
        {
            "id": "proj_0007",
            "name": "Wayanad Highland Landslide Scar & Debris Runout Zone",
            "description": "Post-event optical and elevation model analysis of Meppadi and Chooralmala slope failures. Maps initiation points, debris flow velocity pathways, and safe rehabilitation perimeters.",
            "aoi_polygon": {
                "type": "Polygon",
                "coordinates": [[[76.10, 11.50], [76.25, 11.50], [76.25, 11.65], [76.10, 11.65], [76.10, 11.50]]]
            },
            "map_center": [76.1750, 11.5750],
            "map_zoom": 14.0,
            "location_name": "Wayanad Chooralmala Slope Failure, Kerala",
            "created_at": "2026-08-05T09:10:00Z",
            "images": ["Wayanad_DEM_SlopeMap.tif", "Wayanad_PostLandslide_Optical.tif", "Wayanad_Sentinel1_VH.tif"],
            "queries_count": 16,
            "analyses": [
                {
                    "id": "anl_008",
                    "title": "Segment Anything SAM-2 Mudflow Runout Extent",
                    "mode": "single_optical",
                    "query": "Segment total landslide scar perimeter and deposited boulder field",
                    "status": "completed",
                    "created_at": "2026-08-06T11:25:00Z",
                }
            ],
            "tags": ["Landslide", "Emergency Response", "SAM-2", "Disaster AI"],
            "status": "active",
        },
        {
            "id": "proj_0008",
            "name": "Ladakh High-Altitude Glacial Lake Outburst (GLOF) Early Warning",
            "description": "Monitoring moraine-dammed glacial lakes across the Karakoram and Zanskar ranges. Employs thermal infrared and SAR backscatter to measure permafrost thaw and expansion rates.",
            "aoi_polygon": {
                "type": "Polygon",
                "coordinates": [[[77.30, 34.00], [78.20, 34.00], [78.20, 34.70], [77.30, 34.70], [77.30, 34.00]]]
            },
            "map_center": [77.7500, 34.3500],
            "map_zoom": 11.0,
            "location_name": "Ladakh Karakoram High-Altitude Cryosphere",
            "created_at": "2026-08-01T07:45:00Z",
            "images": ["Ladakh_Glacier_TIR_Thermal.tif", "Ladakh_GlacialLake_Pangong.tif"],
            "queries_count": 11,
            "analyses": [
                {
                    "id": "anl_009",
                    "title": "Cryospheric Lake Volume Expansion Rate",
                    "mode": "single_optical",
                    "query": "Detect proglacial lake surface area expansion over past 3 years",
                    "status": "completed",
                    "created_at": "2026-08-02T13:15:00Z",
                }
            ],
            "tags": ["Cryosphere", "GLOF", "High Altitude", "Climate Vulnerability"],
            "status": "active",
        }
    ]

    for p in projects:
        projects_col.update_one({"id": p["id"]}, {"$set": p}, upsert=True)
    print(f"  [OK] Seeded {len(projects)} realistic geospatial projects.")

    # 3. SEED ANALYSES RECORDS
    print("\n[3/4] Seeding Analyses collection...")
    analyses_col = db["analyses"]
    analyses = [
        {
            "request_id": "REQ-DLH-8921",
            "project_id": "proj_0001",
            "query": "Calculate urban footprint increase and concrete density along Dwarka Expressway corridor",
            "intent": "CHANGE_ANALYSIS",
            "task": "change_detection",
            "confidence": 0.948,
            "confidence_display": "94.8%",
            "answer": "Bi-temporal ChangeFormer diffs show a net increase of 1,280 hectares of concrete and asphalt along the expressway corridor between 2024 and 2026. Mean NDBI increased by +0.34, while vegetation canopy decreased by 18.2%. Ground Sampling Distance (GSD) calibrated at 10m/px.",
            "evidence_count": 4,
            "created_at": "2026-08-30T10:12:00Z",
        },
        {
            "request_id": "REQ-YMN-4412",
            "project_id": "proj_0002",
            "query": "Detect flooded residential areas and critical road blockages in Yamuna floodplain",
            "intent": "FLOOD_DELINEATION",
            "task": "optical_sar_fusion",
            "confidence": 0.962,
            "confidence_display": "96.2%",
            "answer": "Optical-SAR fusion successfully pierced cloud deck over the Yamuna floodplain. 412 hectares of low-lying settlements in Yamuna Bazar and Mayur Vihar Phase-1 are inundated with estimated standing water depths of 1.2m to 2.4m. Ring Road underpass confirmed submerged.",
            "evidence_count": 5,
            "created_at": "2026-08-29T11:05:00Z",
        },
        {
            "request_id": "REQ-BHD-3301",
            "project_id": "proj_0003",
            "query": "Detect all utility-scale solar panel arrays and sub-stations",
            "intent": "OBJECT_GROUNDING",
            "task": "visual_grounding",
            "confidence": 0.935,
            "confidence_display": "93.5%",
            "answer": "GroundingDINO detected 8 distinct utility-scale solar module clusters containing approximately 14,200 individual photovoltaic strings. Two 400kV pooling sub-stations were localized with normalized bounding box confidence of 0.96. Zero thermal hotspots detected.",
            "evidence_count": 6,
            "created_at": "2026-08-26T09:20:00Z",
        },
        {
            "request_id": "REQ-SND-1049",
            "project_id": "proj_0004",
            "query": "Highlight deforested delta mangrove parcels between 2023 and 2026",
            "intent": "CHANGE_ANALYSIS",
            "task": "change_detection",
            "confidence": 0.912,
            "confidence_display": "91.2%",
            "answer": "Remote sensing NDVI diff analysis reveals 384 hectares of mangrove canopy degradation in the outer tidal buffer zone, attributed to saline storm surge scouring. Core tiger sanctuary reserve interior remains 97.4% stable with healthy canopy vigor.",
            "evidence_count": 4,
            "created_at": "2026-08-21T15:10:00Z",
        },
        {
            "request_id": "REQ-JSH-7720",
            "project_id": "proj_0005",
            "query": "Identify high subsidence velocity zones exceeding 50mm/year",
            "intent": "RADAR_INTERFEROMETRY",
            "task": "sar_processing",
            "confidence": 0.957,
            "confidence_display": "95.7%",
            "answer": "D-InSAR phase unwrapping confirms persistent differential slope subsidence ranging from -42mm/yr to -68mm/yr centered along the Sunil and Manohar Bagh wards. Ground moisture saturation index at 78% increases immediate shear failure risk during peak rainfall.",
            "evidence_count": 5,
            "created_at": "2026-08-16T12:00:00Z",
        },
        {
            "request_id": "REQ-WYN-9981",
            "project_id": "proj_0007",
            "query": "Segment total landslide scar perimeter and deposited boulder field",
            "intent": "FEATURE_SEGMENTATION",
            "task": "sam2_segmentation",
            "confidence": 0.971,
            "confidence_display": "97.1%",
            "answer": "Segment Anything (SAM-2) polygon mask extracted a continuous debris runout track measuring 6.8 km in length. Total displaced mass volume estimated at 3.2 million cubic meters. Recommended safe buffer zone extended to 800m on both lateral banks.",
            "evidence_count": 7,
            "created_at": "2026-08-06T11:25:00Z",
        }
    ]

    for a in analyses:
        analyses_col.update_one({"request_id": a["request_id"]}, {"$set": a}, upsert=True)
    print(f"  [OK] Seeded {len(analyses)} verified AI analyses with confidence scores & evidence.")

    # 4. SEED DISASTER ASSESSMENTS
    print("\n[4/4] Seeding Disaster Assessments collection...")
    disasters_col = db["disaster_assessments"]
    disasters = [
        {
            "location_name": "Assam Brahmaputra Basin",
            "hazard_type": "flood",
            "severity": "CRITICAL",
            "centroid": [92.7900, 26.6500],
            "hazard_score": 8.9,
            "population_affected": 248000,
            "inundated_area_sqkm": 342.5,
            "status": "active_monitoring",
            "safe_assembly_zones": [
                {"name": "Tezpur University Elevated Ground", "coordinates": [92.8300, 26.7000], "capacity": 15000},
                {"name": "Kaliabor Relief Base", "coordinates": [93.0200, 26.5800], "capacity": 12000}
            ],
            "evacuation_corridor": "NH-715 Northbound bypass - unobstructed above 42m MSL",
            "updated_at": "2026-09-10T18:00:00Z",
        },
        {
            "location_name": "Chamoli Glacial Surge Zone, Uttarakhand",
            "hazard_type": "flash_flood",
            "severity": "HIGH",
            "centroid": [79.5600, 30.5500],
            "hazard_score": 7.8,
            "population_affected": 18500,
            "inundated_area_sqkm": 42.1,
            "status": "alert",
            "safe_assembly_zones": [
                {"name": "Joshimath Military Camp High Ridge", "coordinates": [79.5800, 30.5700], "capacity": 5000}
            ],
            "evacuation_corridor": "Badrinath Highway Link bypass ridge route",
            "updated_at": "2026-09-08T12:30:00Z",
        },
        {
            "location_name": "Similipal Biosphere Reserve, Odisha",
            "hazard_type": "wildfire",
            "severity": "HIGH",
            "centroid": [86.3500, 21.8500],
            "hazard_score": 7.4,
            "population_affected": 4200,
            "inundated_area_sqkm": 88.0,
            "status": "contained",
            "safe_assembly_zones": [
                {"name": "Baripada Forest Division HQ", "coordinates": [86.7200, 21.9300], "capacity": 3000}
            ],
            "evacuation_corridor": "Southwest firebreak fireline corridor #4",
            "updated_at": "2026-09-05T09:00:00Z",
        },
        {
            "location_name": "Wayanad Chooralmala, Kerala",
            "hazard_type": "landslide",
            "severity": "CRITICAL",
            "centroid": [76.1800, 11.5500],
            "hazard_score": 9.2,
            "population_affected": 8200,
            "inundated_area_sqkm": 14.8,
            "status": "rehabilitation",
            "safe_assembly_zones": [
                {"name": "Meppadi St. Joseph School Shelter", "coordinates": [76.1200, 11.5500], "capacity": 2500}
            ],
            "evacuation_corridor": "Chundale - Meppadi link road (heavy vehicle restricted)",
            "updated_at": "2026-09-02T14:15:00Z",
        }
    ]

    for d in disasters:
        disasters_col.update_one({"location_name": d["location_name"]}, {"$set": d}, upsert=True)
    print(f"  [OK] Seeded {len(disasters)} multi-hazard disaster intelligence reports.")

    print("\n==================================================")
    print("SUCCESS: MongoDB database 'corvus_db' seeded successfully!")
    print("Summary of collections:")
    for col_name in ["users", "projects", "analyses", "disaster_assessments"]:
        count = db[col_name].count_documents({})
        print(f"  • {col_name}: {count} records")
    print("==================================================")

if __name__ == "__main__":
    seed_database()
