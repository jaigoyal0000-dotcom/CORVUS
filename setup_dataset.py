#!/usr/bin/env python3
"""
setup_dataset.py
================
Builds the standard dataset folder scaffolding for binary SAR vs. OPTICAL satellite
image classification using Python's standard `os` library.

Directory Hierarchy:
dataset/
├── train/
│   ├── SAR/
│   └── OPTICAL/
└── val/
    ├── SAR/
    └── OPTICAL/
"""

import os
import sys
import argparse
import numpy as np
from PIL import Image

# Class definitions
CLASSES = ["SAR", "OPTICAL"]
SPLITS = ["train", "val"]


def create_scaffolding(base_dir: str = "dataset", verbose: bool = True) -> dict:
    """
    Creates the dataset folder scaffolding using Python's os module.

    Args:
        base_dir: The root dataset directory path.
        verbose: If True, prints status for each created directory.

    Returns:
        dict mapping split and class to their absolute folder paths.
    """
    scaffolding_paths = {}

    for split in SPLITS:
        scaffolding_paths[split] = {}
        for class_name in CLASSES:
            dir_path = os.path.join(base_dir, split, class_name)
            os.makedirs(dir_path, exist_ok=True)
            scaffolding_paths[split][class_name] = os.path.abspath(dir_path)
            if verbose:
                print(f"[+] Created/Verified directory: {os.path.relpath(dir_path)}")

    return scaffolding_paths


def generate_synthetic_samples(base_dir: str = "dataset", samples_per_class: int = 10, verbose: bool = True):
    """
    Generates synthetic benchmark satellite images for testing the training and
    inference pipelines immediately without external downloads.

    - SAR samples: High-contrast radar backscatter texture with multiplicative
      Rayleigh/speckle noise, simulated bright dihedral/double-bounce reflectors,
      and dark specular water absorptions (converted to 3-channel format).
    - OPTICAL samples: Multispectral RGB color variations (vegetation NIR/green,
      soil brown, urban gray, water blue) with natural continuous tonal gradients.
    """
    if verbose:
        print(f"\n[*] Generating {samples_per_class} synthetic sample images per class for validation...")

    for split in SPLITS:
        count = samples_per_class if split == "train" else max(2, samples_per_class // 3)

        # 1. Generate SAR samples
        sar_dir = os.path.join(base_dir, split, "SAR")
        for i in range(count):
            # Simulate radar backscatter with Rayleigh speckle noise
            base_noise = np.random.exponential(scale=35.0, size=(256, 256)).astype(np.float32)
            # Add synthetic terrain/edge structure
            x = np.linspace(0, 4 * np.pi, 256)
            y = np.linspace(0, 4 * np.pi, 256)
            xx, yy = np.meshgrid(x, y)
            structural_pattern = 40.0 * np.sin(xx + (i * 0.5)) * np.cos(yy)

            sar_intensity = np.clip(base_noise + structural_pattern + 60.0, 0, 255).astype(np.uint8)
            # Inject bright double-bounce point targets (characteristic of SAR built structures)
            num_points = np.random.randint(5, 20)
            for _ in range(num_points):
                px, py = np.random.randint(10, 246, size=2)
                sar_intensity[px:px+4, py:py+4] = 255

            # Save as 3-channel RGB image to conform with dataset 3-channel contract
            sar_img = Image.fromarray(sar_intensity, mode='L').convert('RGB')
            file_name = f"sar_sample_{split}_{i+1:03d}.png"
            sar_img.save(os.path.join(sar_dir, file_name))

        # 2. Generate OPTICAL samples
        optical_dir = os.path.join(base_dir, split, "OPTICAL")
        for i in range(count):
            # Smooth landscape color fields: vegetation green, soil ochre/brown, water blue
            r_plane = np.random.randint(30, 100, size=(256, 256), dtype=np.uint8)
            g_plane = np.random.randint(80, 180, size=(256, 256), dtype=np.uint8)
            b_plane = np.random.randint(30, 90, size=(256, 256), dtype=np.uint8)

            # Add optical cloud/texture gradients
            grad = np.tile(np.linspace(0, 40, 256, dtype=np.uint8), (256, 1))
            r_plane = np.clip(r_plane.astype(np.int16) + grad, 0, 255).astype(np.uint8)
            g_plane = np.clip(g_plane.astype(np.int16) + grad, 0, 255).astype(np.uint8)
            b_plane = np.clip(b_plane.astype(np.int16) + (grad // 2), 0, 255).astype(np.uint8)

            optical_array = np.stack([r_plane, g_plane, b_plane], axis=-1)
            optical_img = Image.fromarray(optical_array, mode='RGB')
            file_name = f"optical_sample_{split}_{i+1:03d}.png"
            optical_img.save(os.path.join(optical_dir, file_name))

    if verbose:
        print("[+] Synthetic dataset population complete!")


if sys.platform == "win32":
    try:
        sys.stdout.reconfigure(encoding="utf-8")
    except Exception:
        pass


def main():
    parser = argparse.ArgumentParser(description="Create standard dataset scaffolding for SAR vs. OPTICAL classification.")
    parser.add_argument("--base-dir", type=str, default="dataset", help="Target base directory for datasets (default: dataset)")
    parser.add_argument("--generate-samples", action="store_true", help="Generate synthetic sample images for pipeline testing")
    parser.add_argument("--samples-per-class", type=int, default=12, help="Number of samples per class for training (default: 12)")
    args = parser.parse_args()

    print("=" * 60)
    print("SATELLITE DATASET SCAFFOLDING GENERATOR")
    print(f"Target Base Directory: {os.path.abspath(args.base_dir)}")
    print("=" * 60)

    create_scaffolding(base_dir=args.base_dir, verbose=True)

    if args.generate_samples:
        generate_synthetic_samples(base_dir=args.base_dir, samples_per_class=args.samples_per_class, verbose=True)

    print("\nDataset structure ready:")
    for split in SPLITS:
        for cls_name in CLASSES:
            p = os.path.join(args.base_dir, split, cls_name)
            count = len(os.listdir(p)) if os.path.exists(p) else 0
            print(f"  |-- {p} ({count} images)")


if __name__ == "__main__":
    main()
