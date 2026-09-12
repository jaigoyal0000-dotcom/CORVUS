# 🛰️ CORVUS — THE WATCHING CROW | Technical Specification & Architecture

## 1. Executive Summary
**CORVUS** is an end-to-end, multi-modal **Satellite & Aerial Geospatial Intelligence Platform** (developed for SIH Problem Statement **SIH26167**). The system ingests high-resolution satellite imagery (optical and Synthetic Aperture Radar / SAR), computes remote sensing indices, runs computer vision deep-learning models, and connects interactive GIS telemetry with real-time agentic Vision-Language Models (VLMs) and LLMs for mission-critical environmental, urban, and disaster management operations.

---

## 2. High-Level System Architecture

The platform follows a **decoupled, microservice-ready monorepo architecture**:

```
                                  ┌───────────────────────────────┐
                                  │      Client Web Browser       │
                                  └──────────────┬────────────────┘
                                                 │ HTTPS / WSS
                                                 ▼
┌─────────────────────────────────────────────────────────────────────────────────────────────────┐
│ FRONTEND (Next.js 14 + OpenLayers 10 + Tailwind CSS + TypeScript)                              │
│ • Interactive GIS Map (Orthomosaics, Multi-Spectral Layers, Polygons, Bounding Boxes)          │
│ • Telemetry Sync (Bounding Box, Centroid, Zoom, Spectral Indices)                               │
│ • Real-time SatQuery AI Copilot / Multi-modal Chat Interface                                    │
│ • Disaster Response Dashboard (Flood, Wildfire, Cyclone, Landslide, Infrastructure Risk)        │
└────────────────────────────────────────────────┬────────────────────────────────────────────────┘
                                                 │ RESTful APIs / JSON Streams
                                                 ▼
┌─────────────────────────────────────────────────────────────────────────────────────────────────┐
│ BACKEND API GATEWAY (FastAPI + Pydantic v2 + SQLAlchemy 2.0 Async)                              │
│ • Auth & RBAC (JWT-based session authentication)                                               │
│ • GeoTIFF / Raster Ingestion & Cloud-Optimized GeoTIFF (COG) conversion                        │
│ • Real-time Multi-topic LLM Synthesizer (Google Gemini 2.0 Flash / 1.5 Pro)                     │
│ • Geospatial Validator & CRS Transformer (EPSG:4326 / EPSG:3857)                               │
│ • Disaster Risk & Evacuation Route Engine                                                       │
└──────────────┬─────────────────────────────────┬────────────────────────────────┬───────────────┘
               │                                 │                                │
               ▼                                 ▼                                ▼
┌──────────────────────────────┐  ┌──────────────────────────────┐  ┌──────────────────────────────┐
│       AI / ML ENGINE         │  │   DATABASE & CACHE LAYER     │  │     OBJECT & BLOB STORE      │
│ • VQA (GeoChat / Florence-2) │  │ • PostgreSQL 15 + PostGIS 3  │  │ • MinIO S3-Compatible Storage│
│ • Grounding (Open-Vocab)     │  │   (Spatial indexing, GiST)   │  │   (Raw GeoTIFFs, COGs,      │
│ • ChangeFormer (Bi-temporal) │  │ • Redis 7 (Alpine)           │  │    Inference Artifacts,      │
│ • Segment Anything (SAM/SAM2)│  │   (Telemetry cache, Broker)  │  │    Evacuation Maps)          │
│ • Optical-SAR Fusion Engine  │  │ • Celery (Task Worker Queue) │  │                              │
└──────────────────────────────┘  └──────────────────────────────┘  └──────────────────────────────┘
```

---

## 3. Technology Stack Breakdown

### **Frontend Tier**
* **Framework:** Next.js 14 (App Router)
* **Core Library:** React 18 & TypeScript 5
* **Mapping & WebGIS Engine:** OpenLayers 10 (`ol`), `@types/ol` (with TileLayer, VectorLayer, GeoJSON, OSM, Satellite basemaps)
* **Styling & Design System:** Tailwind CSS 3.4, PostCSS, Lucide-React icons
* **State & Network:** React Hooks, Server/Client components, Fetch/Axios API clients

### **Backend & Application Services Tier**
* **Framework:** Python 3.11+, FastAPI 0.111+
* **Data Validation & Settings:** Pydantic v2.7, Pydantic-Settings
* **ORM & Database Client:** SQLAlchemy 2.0 (Async/Await), `asyncpg`, `psycopg2-binary`
* **Task Queues & Background Workers:** Celery 5.4 with Redis broker
* **Server Runtime:** Uvicorn (ASGI) with UVLoop

### **Data & Storage Infrastructure**
* **Spatial Relational Database:** PostgreSQL 15 with **PostGIS 3.3 extension** (spatial indexing, geospatial polygon calculations)
* **Object Storage:** **MinIO** (S3-compatible distributed storage for high-resolution rasters, TIFFs, GeoJSONs, and model weights)
* **In-Memory Cache & Message Broker:** **Redis 7** (low-latency session management and task queues)

### **Containerization & DevOps**
* **Container Engine:** Docker & Docker Compose (`docker-compose.yml`)
* **Service Definitions:** `postgres` (PostGIS), `minio`, `redis`, `backend` (FastAPI), `frontend` (Next.js)

---

## 4. AI / ML & Computer Vision Pipelines

The AI subsystem (`/ai`) houses dedicated, production-grade vision-language and remote-sensing pipelines:

| Pipeline | Model / Architecture | Functionality |
| :--- | :--- | :--- |
| **1. Visual Question Answering (VQA)** | GeoChat-7B / Multi-modal VLM | Answers questions on land-cover, water bodies, urban density, vegetation health, and infrastructure from aerial imagery. |
| **2. Remote Sensing Captioning** | ViT-GPT2 / RS-Captioner | Generates descriptive sentences, spatial density summaries, and land-use reports for any selected AOI (Area of Interest). |
| **3. Open-Vocabulary Visual Grounding** | GroundingDINO / OWL-ViT | Accepts free-text queries (e.g., *"solar panels"*, *"damaged bridge"*, *"aircraft"*) and predicts precise normalized bounding boxes `[x1, y1, x2, y2]`. |
| **4. Feature Segmentation** | Segment Anything (SAM / SAM-2) + DeepLabV3+ | Computes pixel-wise segmentation masks for roads, water bodies, agricultural parcels, building footprints, and burn scars. |
| **5. Bi-Temporal Change Detection** | ChangeFormer / BIT-CD | Compares *Pre-Event (T1)* vs. *Post-Event (T2)* optical rasters to highlight newly built areas, flood inundation, deforestation, or disaster destruction. |
| **6. Optical-SAR Fusion** | Dual-Branch CNN / Cross-Attention ViT | Merges Optical RGB/NIR spectral channels with Sentinel-1 Synthetic Aperture Radar (VV/VH polarizations) to achieve all-weather, cloud-penetrating vision. |
| **7. SatQuery Agent Orchestrator** | Multi-Agent LLM Controller | Analyzes user queries, selects appropriate AI pipelines, executes tools sequentially, and synthesizes geospatial telemetry into actionable reports. |

---

## 5. Remote Sensing & GIS Processing Capabilities

* **Multi-Spectral Spectral Indices:**
  * **NDVI** (*Normalized Difference Vegetation Index*): $\frac{NIR - Red}{NIR + Red}$ for canopy health and biomass.
  * **NDWI** (*Normalized Difference Water Index*): $\frac{Green - NIR}{Green + NIR}$ for surface water delineation and flood tracking.
  * **NDBI** (*Normalized Difference Built-up Index*): $\frac{SWIR - NIR}{SWIR + NIR}$ for urban growth and concrete density.
* **Geospatial Coordinate Validation:**
  * Built-in `GeospatialValidator` converting and validating between **WGS84 (EPSG:4326)** and **Web Mercator (EPSG:3857)**.
  * Automatic boundary calculation, centroid extraction, raster dimension matching, and GSD (Ground Sampling Distance) computation.
* **Supported Geospatial Formats:** GeoTIFF (.tif), Cloud Optimized GeoTIFF (COG), GeoJSON, Shapefile (.shp), KML, and STAC item metadata.

---

## 6. Real-Time LLM & Telemetry Synthesis

* **Engine:** Google Gemini 2.0 Flash / Gemini 1.5 Pro integration (`google-genai` / `google-generativeai`) with custom fallback logic.
* **Telemetry Context Injection:** Live map coordinates, active bounding box polygon, current zoom level, detected features, and calculated spectral indices are dynamically injected into the LLM system context.
* **Output Format:** Clean Markdown responses containing technical tables, coordinate matrices, confidence scores, and tactical intelligence recommendations.

---

## 7. Disaster Management & Emergency Response Engine

* **Disaster Modes Supported:** Flooding, Wildfires, Earthquakes, Cyclones, Industrial Hazards, and Landslides.
* **Automated Risk Assessment:** Calculates vulnerability matrices combining population density, critical infrastructure proximity, and hazard severity.
* **Evacuation & Resource Routing:** Computes safe perimeter buffers, unobstructed egress routes, and nearest safe assembly zones outside the high-risk hazard zone.

---

## 8. Directory & Monorepo Structure

```
CORVUS/
├── frontend/             # Next.js 14 WebGIS Client application
│   ├── src/app/          # App router pages (workspace, disaster, auth, projects, dashboard)
│   └── public/           # Static assets, icons, sample rasters
├── backend/              # FastAPI server & business logic
│   ├── app/
│   │   ├── api/v1/       # REST endpoints (analysis, pipeline, disaster, reports, upload, auth)
│   │   ├── core/         # Security, configs, CORS, JWT
│   │   ├── db/           # Database sessions, models, and migrations
│   │   └── services/     # LLM service, GIS engine, Disaster engine, MinIO service
├── ai/                   # AI/ML Pipelines & Models
│   ├── vqa/              # Visual Question Answering
│   ├── captioning/       # Remote sensing caption generator
│   ├── grounding/        # Open-vocabulary object grounding
│   ├── segmentation/     # SAM & semantic segmentation
│   ├── change_detection/ # Bi-temporal ChangeFormer diffs
│   ├── optical_sar/      # Optical + SAR fusion
│   └── agents/           # SatQuery autonomous tool-calling agents
├── docker/               # Dockerfiles for frontend, backend, and workers
├── docker-compose.yml    # Full-stack container orchestration
├── scripts/              # Validation, verification & data seeding scripts
└── tests/                # Automated pytest unit & integration test suite
```

---

## 9. Security, Reliability & Performance
* **Authentication:** JWT tokens with hashed credentials and role-based access control.
* **Data Security:** Strict CORS policies, environment variable isolation, and encrypted MinIO bucket policies.
* **Fault Tolerance:** Graceful degradation if external AI APIs are offline (automatic fallback to local vision engines).
* **Asynchronous Execution:** Heavy raster analytics run via Celery async tasks without blocking the main event loop.
