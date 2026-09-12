# CORVUS — THE WATCHING CROW | SatQuery AI
## STAGE 01 — PROJECT FOUNDATION SETUP GUIDE

### Overview
CORVUS is a multi-modal satellite and aerial intelligence platform (SIH 2026 / SIH26167) that combines VQA, Geospatial Captioning, Open-Vocabulary Visual Grounding, Feature Segmentation, Bi-Temporal Change Detection, and Optical-SAR Sensor Fusion powered by SatQuery AI Agents.

---

### Monorepo Architecture
```
CORVUS/
├── frontend/             # Next.js 14, React 18, TypeScript, Tailwind CSS
├── backend/              # Python 3.11+, FastAPI, SQLAlchemy, AsyncPG
├── ai/                   # PyTorch & Transformers AI model pipelines
│   ├── vqa/
│   ├── captioning/
│   ├── grounding/
│   ├── segmentation/
│   ├── change_detection/
│   ├── optical_sar/
│   └── agents/
├── data/                 # Raw & Processed GeoTIFFs, COGs, Vector datasets
├── models/               # Model weights & adapter checkpoints (LoRA/PEFT)
├── scripts/              # Automated verification & deployment utilities
├── notebooks/            # Research & exploratory notebooks
├── tests/                # Automated pytest suite
├── docs/                 # Platform documentation
└── docker/               # Dockerfiles & container configs
```

---

### Prerequisites
- **Python**: 3.11 or higher
- **Node.js**: v18 or v20+
- **Docker & Docker Compose**: For local PostgreSQL/PostGIS, MinIO, and Redis services

---

### Quick Start Guide

#### 1. Environment Configuration
Copy `.env.example` to `.env`:
```bash
cp .env.example .env
```

#### 2. Run Infrastructure with Docker Compose
Start PostgreSQL + PostGIS, MinIO object storage, and Redis:
```bash
docker-compose up -d postgres minio redis
```

#### 3. Backend Setup
```bash
cd backend
python -m venv venv
# On Windows:
.\venv\Scripts\activate
# On Linux/macOS:
source venv/bin/activate

pip install -r requirements.txt
uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
```
FastAPI Swagger documentation will be available at `http://localhost:8000/docs`.

#### 4. Frontend Setup
```bash
cd frontend
npm install
npm run dev
```
Access the CORVUS UI dashboard at `http://localhost:3000`.

---

### Automated System Health & Foundation Check
Run the foundation verification script:
```bash
python scripts/verify_foundation.py
```

### Running Automated Tests
Run pytest across backend and AI test suites:
```bash
pytest tests/
```
