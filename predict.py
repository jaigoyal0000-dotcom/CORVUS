#!/usr/bin/env python3
"""
predict.py
==========
Standalone inference script for binary SAR vs. OPTICAL satellite image classification.

Usage:
------
    python predict.py path/to/satellite_image.png
    python predict.py --image path/to/satellite_image.png --model checkpoints/best_sar_optical_resnet18.pth
    python predict.py path/to/image.tif --json
"""

import os
import sys
import json
import argparse
from typing import Dict, Any, Optional, Tuple
from PIL import Image

import torch
import torchvision.transforms as transforms

from model import load_checkpoint, get_model, DEFAULT_CLASSES
from dataset_loader import safe_rgb_loader, IMAGENET_MEAN, IMAGENET_STD


def get_inference_transform(img_size: int = 224) -> transforms.Compose:
    """
    Standardized inference transform:
    1. Resize image preserving spatial fidelity
    2. Center crop to target network dimensions (224x224)
    3. Normalize via ImageNet channel statistics
    """
    return transforms.Compose([
        transforms.Resize((img_size, img_size)),
        transforms.CenterCrop(img_size),
        transforms.ToTensor(),
        transforms.Normalize(mean=IMAGENET_MEAN, std=IMAGENET_STD),
    ])


def predict_image(
    image_path: str,
    model_path: str = "checkpoints/best_sar_optical_resnet18.pth",
    device_name: str = "auto",
    img_size: int = 224,
) -> Dict[str, Any]:
    """
    Classifies a satellite image as SAR or OPTICAL.

    Args:
        image_path: Path to the target image file.
        model_path: Path to the trained checkpoint (.pth).
        device_name: 'auto', 'cuda', 'mps', or 'cpu'.
        img_size: Input spatial resolution.

    Returns:
        Dictionary containing prediction results, confidence, and class probabilities.
    """
    if not os.path.isfile(image_path):
        raise FileNotFoundError(f"Image not found at path: {image_path}")

    # Device selection
    if device_name == "auto":
        if torch.cuda.is_available():
            device = torch.device("cuda")
        elif hasattr(torch.backends, "mps") and torch.backends.mps.is_available():
            device = torch.device("mps")
        else:
            device = torch.device("cpu")
    else:
        device = torch.device(device_name)

    # 1. Load Image and Enforce 3-Channel Format
    raw_img = safe_rgb_loader(image_path)
    orig_width, orig_height = raw_img.size

    transform = get_inference_transform(img_size=img_size)
    img_tensor = transform(raw_img).unsqueeze(0).to(device)  # Shape: (1, 3, 224, 224)

    # 2. Load Model
    if os.path.isfile(model_path):
        model, classes, meta = load_checkpoint(model_path, device=device)
    else:
        # Fallback to untrained/default architecture with warning if checkpoint not yet generated
        print(f"[!] Warning: Checkpoint '{model_path}' not found. Initializing base ResNet-18.")
        classes = DEFAULT_CLASSES
        model = get_model(num_classes=len(classes), pretrained=True, device=device)
        model.eval()
        meta = {}

    # 3. Model Inference Pass
    with torch.no_grad():
        logits = model(img_tensor)
        probabilities = torch.softmax(logits, dim=1)[0]

    # 4. Extract Classification Metrics
    prob_dict = {classes[i]: float(probabilities[i].item()) for i in range(len(classes))}
    pred_idx = int(torch.argmax(probabilities).item())
    predicted_class = classes[pred_idx]
    confidence = float(probabilities[pred_idx].item())

    return {
        "image_path": os.path.abspath(image_path),
        "dimensions": f"{orig_width}x{orig_height}",
        "channels": 3,
        "predicted_class": predicted_class,
        "confidence": confidence,
        "confidence_percentage": f"{confidence * 100:.2f}%",
        "probabilities": prob_dict,
        "device": str(device),
        "checkpoint_used": os.path.abspath(model_path) if os.path.isfile(model_path) else "base_pretrained_resnet18",
    }


if sys.platform == "win32":
    try:
        sys.stdout.reconfigure(encoding="utf-8")
    except Exception:
        pass


def render_ascii_bar(fraction: float, length: int = 24) -> str:
    """Renders visual ASCII bar representation for probability visualization."""
    filled = int(round(fraction * length))
    bar = "=" * filled + "-" * (length - filled)
    return bar


def main():
    parser = argparse.ArgumentParser(
        description="Predict whether a satellite image is Synthetic Aperture Radar (SAR) or OPTICAL."
    )
    # Support both positional argument and --image flag for flexible CLI usage
    parser.add_argument(
        "image",
        nargs="?",
        default=None,
        help="Local file path to the satellite image to classify.",
    )
    parser.add_argument(
        "-i", "--image-path",
        type=str,
        default=None,
        help="Alternative flag to specify image path.",
    )
    parser.add_argument(
        "-m", "--model",
        type=str,
        default="checkpoints/best_sar_optical_resnet18.pth",
        help="Path to trained model checkpoint (default: checkpoints/best_sar_optical_resnet18.pth)",
    )
    parser.add_argument(
        "--device",
        type=str,
        default="auto",
        choices=["auto", "cuda", "mps", "cpu"],
        help="Compute device for inference (default: auto)",
    )
    parser.add_argument(
        "--json",
        action="store_true",
        help="Output classification result as raw JSON string.",
    )

    args = parser.parse_args()

    # Determine image path from positional or named parameter
    target_image = args.image or args.image_path

    if not target_image:
        parser.error("Please provide an image path: python predict.py <path_to_image> (or use --image-path)")

    try:
        result = predict_image(
            image_path=target_image,
            model_path=args.model,
            device_name=args.device,
        )

        if args.json:
            print(json.dumps(result, indent=2))
        else:
            print("\n" + "=" * 62)
            print("         SATELLITE SENSOR CLASSIFICATION REPORT")
            print("=" * 62)
            print(f" Image File:        {result['image_path']}")
            print(f" Spatial Geometry:  {result['dimensions']} pixels (3-channel normalized)")
            print(f" Checkpoint:        {result['checkpoint_used']}")
            print(f" Compute Device:    {result['device']}")
            print("-" * 62)
            print(f" PREDICTED MODALITY:  [ {result['predicted_class']} ]")
            print(f" CONFIDENCE SCORE:    {result['confidence_percentage']}")
            print("-" * 62)
            print(" Modality Probability Distribution:")
            for cls_name, prob in result["probabilities"].items():
                bar = render_ascii_bar(prob, length=20)
                marker = "*" if cls_name == result['predicted_class'] else " "
                print(f"  {marker} {cls_name:<8} : {prob * 100:6.2f}%  [{bar}]")
            print("=" * 62 + "\n")

    except Exception as err:
        print(f"\n[!] Error during prediction: {err}", file=sys.stderr)
        sys.exit(1)


if __name__ == "__main__":
    main()
