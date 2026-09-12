#!/usr/bin/env python3
"""
import_uploads.py
=================
Utility to automatically ingest and organize uploaded satellite images from
custom upload folders (e.g. data/uploads/) into the standard PyTorch
dataset scaffolding (dataset/train and dataset/val).

Usage:
------
    python import_uploads.py --source data/uploads --split-ratio 0.8
"""

import os
import shutil
import argparse
import random
from typing import List, Tuple

from dataset_loader import ensure_scaffolding, VALID_EXTENSIONS


def classify_modality_by_name_or_heuristics(filename: str) -> str:
    """
    Infers whether an image is SAR or OPTICAL based on naming keywords.
    Defaults to OPTICAL if not explicitly tagged as SAR/radar.
    """
    fn_lower = filename.lower()
    if any(k in fn_lower for k in ["sar", "sentinel1", "s1", "risat", "radar", "vv", "vh"]):
        return "SAR"
    return "OPTICAL"


def ingest_uploaded_images(
    source_dir: str = "data/uploads",
    target_dir: str = "dataset",
    train_split: float = 0.8,
    seed: int = 42,
) -> dict:
    """
    Scans source directory recursively, identifies image files, and distributes
    them into dataset/train and dataset/val based on modality.
    """
    ensure_scaffolding(target_dir)
    random.seed(seed)

    # 1. Discover all image files
    all_images = []
    for root, _, files in os.walk(source_dir):
        for f in files:
            if f.lower().endswith(VALID_EXTENSIONS):
                all_images.append(os.path.join(root, f))

    if not all_images:
        print(f"[!] No valid image files found in '{source_dir}'")
        return {"imported": 0}

    print(f"[*] Found {len(all_images)} uploaded images in '{source_dir}'")

    # 2. Group by modality
    sar_images = []
    optical_images = []

    for path in all_images:
        modality = classify_modality_by_name_or_heuristics(os.path.basename(path))
        if modality == "SAR":
            sar_images.append(path)
        else:
            optical_images.append(path)

    print(f"  • Detected SAR Candidates:     {len(sar_images)}")
    print(f"  • Detected OPTICAL Candidates: {len(optical_images)}")

    counts = {"train": {"SAR": 0, "OPTICAL": 0}, "val": {"SAR": 0, "OPTICAL": 0}}

    # 3. Copy with train/val splitting
    for modality, img_list in [("SAR", sar_images), ("OPTICAL", optical_images)]:
        random.shuffle(img_list)
        split_idx = max(1, int(len(img_list) * train_split)) if len(img_list) > 1 else len(img_list)

        train_files = img_list[:split_idx]
        val_files = img_list[split_idx:] if len(img_list) > 1 else img_list[:1]

        for p in train_files:
            dst = os.path.join(target_dir, "train", modality, os.path.basename(p))
            # Avoid name collisions
            if os.path.exists(dst):
                base, ext = os.path.splitext(os.path.basename(p))
                dst = os.path.join(target_dir, "train", modality, f"{base}_{os.path.basename(os.path.dirname(p))}{ext}")
            shutil.copy2(p, dst)
            counts["train"][modality] += 1

        for p in val_files:
            dst = os.path.join(target_dir, "val", modality, os.path.basename(p))
            if os.path.exists(dst):
                base, ext = os.path.splitext(os.path.basename(p))
                dst = os.path.join(target_dir, "val", modality, f"{base}_{os.path.basename(os.path.dirname(p))}{ext}")
            shutil.copy2(p, dst)
            counts["val"][modality] += 1

    print("\n[+] Ingestion Complete! Current Dataset Summary:")
    for split in ["train", "val"]:
        for mod in ["SAR", "OPTICAL"]:
            p = os.path.join(target_dir, split, mod)
            total = len(os.listdir(p)) if os.path.exists(p) else 0
            print(f"  • {p}: {total} images")

    return counts


def main():
    parser = argparse.ArgumentParser(description="Ingest uploaded images into training dataset.")
    parser.add_argument("--source", type=str, default="data/uploads", help="Source folder of uploads")
    parser.add_argument("--target", type=str, default="dataset", help="Target dataset root folder")
    parser.add_argument("--split", type=float, default=0.8, help="Train split fraction (default: 0.8)")
    args = parser.parse_args()

    ingest_uploaded_images(source_dir=args.source, target_dir=args.target, train_split=args.split)


if __name__ == "__main__":
    main()
