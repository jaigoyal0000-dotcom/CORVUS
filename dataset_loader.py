#!/usr/bin/env python3
"""
dataset_loader.py
=================
Data loader and preprocessing pipeline for binary SAR vs. OPTICAL satellite
image classification.

Key Design Choice - 3-Channel Representation:
---------------------------------------------
In remote sensing, Synthetic Aperture Radar (SAR) sensors emit microwave pulses and
record backscatter intensity/amplitude, which is natively single-polarization (grayscale)
or dual-pol (VV/VH). Optical sensors record multispectral solar reflectance across RGB bands.

By strictly standardizing all images into a 3-channel RGB format:
1. Grayscale SAR intensity values are replicated across 3 channels [I, I, I]. This preserves
   fine-grained radar backscatter characteristics—such as multiplicative speckle noise,
   extreme-contrast dihedral reflections from man-made structures, and total specular
   absorption over water bodies—without loss of spatial gradients.
2. Optical images retain their native chromatic distribution [R, G, B].
3. The resulting tensors seamlessly align with the ResNet-18 architecture and ImageNet
   transfer learning statistics (mean & std).
"""

import os
import sys
from typing import Dict, Tuple, List, Optional
from PIL import Image
import torch
from torch.utils.data import DataLoader, Dataset
import torchvision.transforms as transforms
from torchvision.datasets import ImageFolder


# Supported image file extensions for satellite imagery
VALID_EXTENSIONS = (".png", ".jpg", ".jpeg", ".tif", ".tiff", ".bmp", ".webp")

# Standard ImageNet normalization coefficients
IMAGENET_MEAN = [0.485, 0.456, 0.406]
IMAGENET_STD = [0.229, 0.224, 0.225]


def safe_rgb_loader(path: str) -> Image.Image:
    """
    Safely opens an image file and guarantees conversion to 3-channel RGB.

    - Grayscale SAR images: Replicates intensity channel into [I, I, I],
      maintaining structural intensity contrast and speckle distributions.
    - Multispectral / RGBA images: Strips alpha channels and maps to [R, G, B].

    Args:
        path: Absolute or relative file path to the image.

    Returns:
        PIL.Image.Image in 'RGB' mode.
    """
    try:
        with open(path, "rb") as f:
            with Image.open(f) as img:
                return img.convert("RGB")
    except Exception as e:
        raise IOError(f"Error loading image at {path}: {e}") from e


def get_satellite_transforms(img_size: int = 224) -> Dict[str, transforms.Compose]:
    """
    Generates PyTorch data transformations tailored for overhead satellite imagery.

    Augmentations include:
    - Random horizontal & vertical flips (satellite passes are orientation-invariant).
    - Random 90-degree rotations (orthogonal satellite flight tracks).
    - Aspect-ratio preserving crops.
    - ImageNet channel normalization.

    Args:
        img_size: Spatial target dimension (default: 224 for ResNet-18).

    Returns:
        Dictionary with 'train' and 'val' transforms.
    """
    train_transform = transforms.Compose([
        transforms.Resize((img_size + 32, img_size + 32)),
        transforms.RandomResizedCrop(img_size, scale=(0.8, 1.0), ratio=(0.9, 1.1)),
        transforms.RandomHorizontalFlip(p=0.5),
        transforms.RandomVerticalFlip(p=0.5),
        transforms.RandomRotation(degrees=(-180, 180)),
        transforms.ToTensor(),
        transforms.Normalize(mean=IMAGENET_MEAN, std=IMAGENET_STD),
    ])

    val_transform = transforms.Compose([
        transforms.Resize((img_size, img_size)),
        transforms.CenterCrop(img_size),
        transforms.ToTensor(),
        transforms.Normalize(mean=IMAGENET_MEAN, std=IMAGENET_STD),
    ])

    return {
        "train": train_transform,
        "val": val_transform,
    }


def ensure_scaffolding(base_dir: str = "dataset") -> None:
    """
    Ensures standard folder scaffolding exists using Python's os module.
    """
    for split in ["train", "val"]:
        for cls_name in ["SAR", "OPTICAL"]:
            os.makedirs(os.path.join(base_dir, split, cls_name), exist_ok=True)


class SatelliteDataset(ImageFolder):
    """
    Custom ImageFolder dataset using safe_rgb_loader to enforce 3-channel
    representation for both SAR and Optical modalities.
    """

    def __init__(self, root: str, transform=None):
        super().__init__(
            root=root,
            transform=transform,
            loader=safe_rgb_loader,
            is_valid_file=lambda path: path.lower().endswith(VALID_EXTENSIONS),
        )


def get_data_loaders(
    data_dir: str = "dataset",
    batch_size: int = 32,
    num_workers: int = 0,
    img_size: int = 224,
    pin_memory: bool = True,
) -> Tuple[Dict[str, DataLoader], List[str], Dict[str, int]]:
    """
    Builds and returns training and validation PyTorch DataLoaders.

    Args:
        data_dir: Root dataset directory containing 'train' and 'val' subfolders.
        batch_size: Mini-batch size.
        num_workers: Number of subprocess workers for data loading.
        img_size: Spatial resolution for input images (default: 224).
        pin_memory: If True, copies tensors into CUDA pinned memory.

    Returns:
        dataloaders: Dict mapping 'train' and 'val' to torch DataLoader.
        classes: List of class names (e.g. ['OPTICAL', 'SAR']).
        dataset_sizes: Dict mapping split name to sample counts.
    """
    ensure_scaffolding(data_dir)

    train_path = os.path.join(data_dir, "train")
    val_path = os.path.join(data_dir, "val")

    if not os.path.isdir(train_path) or not os.path.isdir(val_path):
        raise FileNotFoundError(
            f"Dataset splits not found. Expected '{train_path}' and '{val_path}'."
        )

    tfs = get_satellite_transforms(img_size=img_size)

    train_dataset = SatelliteDataset(root=train_path, transform=tfs["train"])
    val_dataset = SatelliteDataset(root=val_path, transform=tfs["val"])

    classes = train_dataset.classes
    dataset_sizes = {
        "train": len(train_dataset),
        "val": len(val_dataset),
    }

    # Pin memory only when CUDA is available
    use_pin = pin_memory and torch.cuda.is_available()

    dataloaders = {
        "train": DataLoader(
            train_dataset,
            batch_size=batch_size,
            shuffle=True,
            num_workers=num_workers,
            pin_memory=use_pin,
            drop_last=False,
        ),
        "val": DataLoader(
            val_dataset,
            batch_size=batch_size,
            shuffle=False,
            num_workers=num_workers,
            pin_memory=use_pin,
            drop_last=False,
        ),
    }

    return dataloaders, classes, dataset_sizes


if __name__ == "__main__":
    print("=" * 60)
    print("Testing Satellite Data Loader Scaffolding & 3-Channel Pipeline")
    print("=" * 60)
    ensure_scaffolding("dataset")
    print("[+] Scaffolding confirmed in ./dataset")
    try:
        loaders, classes, sizes = get_data_loaders("dataset", batch_size=4)
        print(f"[+] Detected classes: {classes}")
        print(f"[+] Dataset sizes: {sizes}")
    except Exception as exc:
        print(f"[!] Info: {exc}")
