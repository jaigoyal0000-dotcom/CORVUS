# Binary Satellite Image Classification: SAR vs. OPTICAL

A modular, production-ready PyTorch pipeline designed to classify satellite imagery as either **SAR** (Synthetic Aperture Radar) or **OPTICAL** (Multispectral/Visible).

---

## 1. Modality Architecture & 3-Channel Strategy

### Why Standardize Grayscale SAR into 3-Channel RGB?
In satellite remote sensing:
- **Synthetic Aperture Radar (SAR)** (e.g., Sentinel-1, RISAT) sends active microwave signals and measures backscatter intensity. This is natively single-polarization (grayscale amplitude) or dual-pol (VV/VH). SAR imagery is distinguished by structural textures: high-frequency Rayleigh speckle noise, bright double-bounce dihedral reflections from geometric structures, and specular absorption (dark returns) from calm water.
- **Optical Imagery** (e.g., Sentinel-2, Landsat) passively captures multispectral solar reflectance in visible red, green, and blue bands.

By converting and preserving all images as **3-channel RGB `[I, I, I]` or `[R, G, B]`**:
1. Grayscale SAR intensity is replicated across 3 channels without altering spatial gradients or speckle statistics.
2. The model can be initialized directly with **ResNet-18** pretrained on ImageNet (which requires 3-channel input) without destroying pretrained filter weights in the initial convolution layer `conv1`.
3. The network effectively learns to distinguish between uniform cross-channel intensity correlation (SAR speckle structure) and diverse chromatic hue distributions (Optical vegetation, soil, water).

---

## 2. Project Structure

```
.
├── dataset/
│   ├── train/
│   │   ├── SAR/          # Training SAR imagery
│   │   └── OPTICAL/      # Training Optical imagery
│   └── val/
│       ├── SAR/          # Validation SAR imagery
│       └── OPTICAL/      # Validation Optical imagery
│
├── setup_dataset.py      # Scaffolding generator using Python's os module
├── model.py              # Modified ResNet-18 (2-class output, dropout, freeze options)
├── dataset_loader.py     # 3-channel dataset loader & satellite-tailored augmentations
├── train.py              # Full training & validation loop with checkpointing
├── predict.py            # Standalone image inference CLI script
└── checkpoints/          # Saved model weights (.pth)
```

---

## 3. Quickstart Guide

### Step 1: Initialize Dataset Scaffolding
Create the `dataset/train` and `dataset/val` folder structure using Python's standard `os` library:
```bash
# Create the standard folders
python setup_dataset.py

# Or scaffold and generate sample satellite benchmark images for testing:
python setup_dataset.py --generate-samples
```

### Step 2: Test Dataset Loader & Model Architecture
Verify that the model and data loader instantiate properly:
```bash
python model.py
python dataset_loader.py
```

### Step 3: Train the Classifier
Run training with full validation evaluation and automatic best-model checkpointing:
```bash
# Basic training
python train.py --epochs 10 --batch-size 16 --lr 0.0001

# Transfer learning with frozen backbone (only train classifier head)
python train.py --epochs 10 --freeze-backbone

# Custom output checkpoint name
python train.py --epochs 15 --model-name best_sar_optical_resnet18.pth
```

### Step 4: Run Inference on a Single Image
Classify any local image using the standalone `predict.py` script:
```bash
# Standard prediction
python predict.py path/to/image.png

# Alternative flag syntax
python predict.py --image-path dataset/val/SAR/sar_sample_val_001.png

# JSON output for API/microservice integration
python predict.py dataset/val/OPTICAL/optical_sample_val_001.png --json
```
