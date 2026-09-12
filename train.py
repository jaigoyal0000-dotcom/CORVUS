#!/usr/bin/env python3
"""
train.py
========
Complete training and validation loop for binary SAR vs. OPTICAL satellite image
classification using a modified ResNet-18.

Features:
- Comprehensive validation loop evaluated after every epoch.
- Automatic device detection (CUDA, Apple Silicon MPS, or CPU).
- Tracks training and validation loss and accuracy.
- Model checkpointing: automatically tracks and saves the best model state dictionary,
  optimizer state, and target class mappings based on validation accuracy.
- Learning rate scheduling with Cosine Annealing.
"""

import os
import sys
import time
import argparse
import random
from typing import Dict, Tuple, List
import numpy as np
import torch
import torch.nn as nn
import torch.optim as optim
from torch.optim.lr_scheduler import CosineAnnealingLR

from model import get_model, save_checkpoint
from dataset_loader import get_data_loaders, ensure_scaffolding

if sys.platform == "win32":
    try:
        sys.stdout.reconfigure(encoding="utf-8")
    except Exception:
        pass


def set_seed(seed: int = 42) -> None:
    """Sets random seeds for reproducibility."""
    random.seed(seed)
    np.random.seed(seed)
    torch.manual_seed(seed)
    if torch.cuda.is_available():
        torch.cuda.manual_seed_all(seed)


def select_device(preferred: str = "auto") -> torch.device:
    """
    Selects the best available compute device.
    """
    if preferred == "cuda" and torch.cuda.is_available():
        return torch.device("cuda")
    if preferred == "mps" and hasattr(torch.backends, "mps") and torch.backends.mps.is_available():
        return torch.device("mps")
    if preferred == "cpu":
        return torch.device("cpu")

    # Auto-detection
    if torch.cuda.is_available():
        device = torch.device("cuda")
        print(f"[+] Hardware acceleration: NVIDIA GPU ({torch.cuda.get_device_name(0)})")
    elif hasattr(torch.backends, "mps") and torch.backends.mps.is_available():
        device = torch.device("mps")
        print("[+] Hardware acceleration: Apple Silicon (MPS)")
    else:
        device = torch.device("cpu")
        print("[+] Hardware acceleration: CPU")
    return device


def train_one_epoch(
    model: nn.Module,
    dataloader: torch.utils.data.DataLoader,
    criterion: nn.Module,
    optimizer: optim.Optimizer,
    device: torch.device,
) -> Tuple[float, float]:
    """
    Runs a single training epoch.
    Returns: (epoch_loss, epoch_accuracy)
    """
    model.train()
    running_loss = 0.0
    running_corrects = 0
    total_samples = 0

    for inputs, labels in dataloader:
        inputs = inputs.to(device)
        labels = labels.to(device)

        optimizer.zero_grad()

        outputs = model(inputs)
        loss = criterion(outputs, labels)
        _, preds = torch.max(outputs, 1)

        loss.backward()
        optimizer.step()

        running_loss += loss.item() * inputs.size(0)
        running_corrects += torch.sum(preds == labels.data).item()
        total_samples += inputs.size(0)

    epoch_loss = running_loss / max(1, total_samples)
    epoch_acc = running_corrects / max(1, total_samples)
    return epoch_loss, epoch_acc


def validate_one_epoch(
    model: nn.Module,
    dataloader: torch.utils.data.DataLoader,
    criterion: nn.Module,
    device: torch.device,
) -> Tuple[float, float]:
    """
    Runs a single validation epoch.
    Returns: (val_loss, val_accuracy)
    """
    model.eval()
    running_loss = 0.0
    running_corrects = 0
    total_samples = 0

    with torch.no_grad():
        for inputs, labels in dataloader:
            inputs = inputs.to(device)
            labels = labels.to(device)

            outputs = model(inputs)
            loss = criterion(outputs, labels)
            _, preds = torch.max(outputs, 1)

            running_loss += loss.item() * inputs.size(0)
            running_corrects += torch.sum(preds == labels.data).item()
            total_samples += inputs.size(0)

    val_loss = running_loss / max(1, total_samples)
    val_acc = running_corrects / max(1, total_samples)
    return val_loss, val_acc


def train_model(
    data_dir: str = "dataset",
    num_epochs: int = 10,
    batch_size: int = 16,
    learning_rate: float = 1e-4,
    weight_decay: float = 1e-4,
    freeze_backbone: bool = False,
    dropout_rate: float = 0.2,
    output_dir: str = "checkpoints",
    model_name: str = "best_sar_optical_resnet18.pth",
    device_name: str = "auto",
    seed: int = 42,
) -> Dict[str, any]:
    """
    Executes complete training and validation cycle with checkpointing.
    """
    set_seed(seed)
    device = select_device(device_name)
    os.makedirs(output_dir, exist_ok=True)
    best_model_path = os.path.join(output_dir, model_name)

    print("=" * 65)
    print("      SAR VS. OPTICAL SATELLITE CLASSIFIER - TRAINING PIPELINE")
    print("=" * 65)
    print(f"[*] Dataset directory:  {os.path.abspath(data_dir)}")
    print(f"[*] Output directory:   {os.path.abspath(output_dir)}")
    print(f"[*] Epochs:             {num_epochs}")
    print(f"[*] Batch size:         {batch_size}")
    print(f"[*] Learning rate:      {learning_rate}")
    print(f"[*] Freeze Backbone:    {freeze_backbone}")
    print(f"[*] Target Device:      {device}")
    print("-" * 65)

    # 1. Load Data
    dataloaders, classes, dataset_sizes = get_data_loaders(
        data_dir=data_dir,
        batch_size=batch_size,
        num_workers=0,  # Safe cross-platform default for Windows
        img_size=224,
    )

    print(f"[+] Loaded classes:     {classes}")
    print(f"[+] Train dataset size: {dataset_sizes['train']} images")
    print(f"[+] Val dataset size:   {dataset_sizes['val']} images")

    if dataset_sizes['train'] == 0 or dataset_sizes['val'] == 0:
        raise ValueError(
            f"Insufficient images found in '{data_dir}'.\n"
            f"Please populate images into {data_dir}/train and {data_dir}/val, or run:\n"
            f"python setup_dataset.py --generate-samples"
        )

    # 2. Build Model
    model = get_model(
        num_classes=len(classes),
        pretrained=True,
        dropout_rate=dropout_rate,
        freeze_backbone=freeze_backbone,
        device=device,
    )

    summary = model.summary()
    print(f"[+] Trainable params:   {summary['trainable_parameters']:,} / {summary['total_parameters']:,}")
    print("-" * 65)

    # 3. Loss, Optimizer, and Scheduler
    criterion = nn.CrossEntropyLoss()
    optimizer = optim.AdamW(
        model.get_trainable_params(),
        lr=learning_rate,
        weight_decay=weight_decay,
    )
    scheduler = CosineAnnealingLR(optimizer, T_max=max(1, num_epochs), eta_min=1e-6)

    # 4. Training Loop
    start_time = time.time()
    best_val_acc = -1.0
    best_val_loss = float("inf")
    best_epoch = 0

    history = {
        "train_loss": [], "train_acc": [],
        "val_loss": [], "val_acc": []
    }

    print("\nStarting Training & Validation Loop:")
    print(f"{'Epoch':^7} | {'Train Loss':^11} | {'Train Acc':^11} | {'Val Loss':^11} | {'Val Acc':^11} | {'Status':^8}")
    print("-" * 68)

    for epoch in range(1, num_epochs + 1):
        epoch_start = time.time()

        # Training phase
        train_loss, train_acc = train_one_epoch(
            model=model,
            dataloader=dataloaders["train"],
            criterion=criterion,
            optimizer=optimizer,
            device=device,
        )

        # Validation phase
        val_loss, val_acc = validate_one_epoch(
            model=model,
            dataloader=dataloaders["val"],
            criterion=criterion,
            device=device,
        )

        scheduler.step()

        history["train_loss"].append(train_loss)
        history["train_acc"].append(train_acc)
        history["val_loss"].append(val_loss)
        history["val_acc"].append(val_acc)

        # Check if this epoch is the new best model
        is_best = (val_acc > best_val_acc) or (val_acc == best_val_acc and val_loss < best_val_loss)
        status_tag = ""
        if is_best:
            best_val_acc = val_acc
            best_val_loss = val_loss
            best_epoch = epoch
            status_tag = "* BEST"

            save_checkpoint(
                model=model,
                filepath=best_model_path,
                classes=classes,
                epoch=epoch,
                val_acc=val_acc,
                optimizer=optimizer,
            )

        print(
            f"{epoch:^7d} | {train_loss:^11.4f} | {train_acc * 100:^10.2f}% | "
            f"{val_loss:^11.4f} | {val_acc * 100:^10.2f}% | {status_tag:<8}"
        )

    total_duration = time.time() - start_time
    print("=" * 68)
    print(f"[+] Training completed in {total_duration:.2f} seconds.")
    print(f"[+] Best Validation Accuracy: {best_val_acc * 100:.2f}% (Epoch {best_epoch})")
    print(f"[+] Saved Best Model to:      {best_model_path}")

    return {
        "best_epoch": best_epoch,
        "best_val_acc": best_val_acc,
        "best_val_loss": best_val_loss,
        "checkpoint_path": best_model_path,
        "history": history,
    }


def main():
    parser = argparse.ArgumentParser(description="Train ResNet-18 for SAR vs. OPTICAL satellite classification.")
    parser.add_argument("--data-dir", type=str, default="dataset", help="Path to dataset directory (default: dataset)")
    parser.add_argument("--epochs", type=int, default=10, help="Number of epochs to train (default: 10)")
    parser.add_argument("--batch-size", type=int, default=16, help="Batch size for training (default: 16)")
    parser.add_argument("--lr", type=float, default=1e-4, help="Learning rate (default: 0.0001)")
    parser.add_argument("--weight-decay", type=float, default=1e-4, help="Weight decay for regularization (default: 0.0001)")
    parser.add_argument("--freeze-backbone", action="store_true", help="Freeze ResNet-18 backbone and only train classifier")
    parser.add_argument("--dropout", type=float, default=0.2, help="Dropout rate before classifier (default: 0.2)")
    parser.add_argument("--output-dir", type=str, default="checkpoints", help="Directory to save checkpoints (default: checkpoints)")
    parser.add_argument("--model-name", type=str, default="best_sar_optical_resnet18.pth", help="Saved checkpoint filename")
    parser.add_argument("--device", type=str, default="auto", choices=["auto", "cuda", "mps", "cpu"], help="Device to use")
    parser.add_argument("--seed", type=int, default=42, help="Random seed (default: 42)")

    args = parser.parse_args()

    train_model(
        data_dir=args.data_dir,
        num_epochs=args.epochs,
        batch_size=args.batch_size,
        learning_rate=args.lr,
        weight_decay=args.weight_decay,
        freeze_backbone=args.freeze_backbone,
        dropout_rate=args.dropout,
        output_dir=args.output_dir,
        model_name=args.model_name,
        device_name=args.device,
        seed=args.seed,
    )


if __name__ == "__main__":
    main()
