#!/usr/bin/env python3
"""
model.py
========
PyTorch ResNet-18 architecture modified for binary satellite image classification
(SAR vs. OPTICAL).

Design Details:
- Utilizes torchvision ResNet-18 pretrained on ImageNet for rich transfer learning.
- Supports both modern weights enum (`ResNet18_Weights.DEFAULT`) and legacy `pretrained=True`.
- Replaces the 1000-class fully-connected head with a 2-class classifier, optionally
  incorporating dropout regularization to mitigate overfitting on specialized aerial data.
- Provides backbone freezing/unfreezing for two-stage transfer learning.
"""

from typing import List, Tuple, Optional, Dict, Any
import torch
import torch.nn as nn
import torchvision.models as models


DEFAULT_CLASSES = ["OPTICAL", "SAR"]


class SAROpticalResNet18(nn.Module):
    """
    ResNet-18 architecture fine-tuned for SAR vs. OPTICAL satellite image classification.
    """

    def __init__(
        self,
        num_classes: int = 2,
        pretrained: bool = True,
        dropout_rate: float = 0.2,
        freeze_backbone: bool = False,
    ):
        """
        Initialize modified ResNet-18.

        Args:
            num_classes: Number of output classes (2 for binary SAR vs. OPTICAL).
            pretrained: Whether to load ImageNet pretrained weights.
            dropout_rate: Dropout probability before the final linear layer (0.0 to disable).
            freeze_backbone: If True, freeze all convolutional layers so only the fc head trains.
        """
        super().__init__()
        self.num_classes = num_classes
        self.dropout_rate = dropout_rate

        # Initialize base ResNet-18 with weights handling backwards/forwards compatibility
        try:
            if pretrained:
                weights = models.ResNet18_Weights.DEFAULT
                self.backbone = models.resnet18(weights=weights)
            else:
                self.backbone = models.resnet18(weights=None)
        except AttributeError:
            # Fallback for older torchvision versions (<0.13)
            self.backbone = models.resnet18(pretrained=pretrained)

        # Optional backbone freeze for feature extraction
        if freeze_backbone:
            self.freeze_backbone()

        # Replace final classification head (ResNet-18 standard in_features is 512)
        in_features = self.backbone.fc.in_features

        if dropout_rate > 0.0:
            self.backbone.fc = nn.Sequential(
                nn.Dropout(p=dropout_rate),
                nn.Linear(in_features, num_classes),
            )
        else:
            self.backbone.fc = nn.Linear(in_features, num_classes)

    def forward(self, x: torch.Tensor) -> torch.Tensor:
        """
        Forward pass.
        Args:
            x: Input tensor of shape (Batch, 3, Height, Width)
        Returns:
            Logits of shape (Batch, num_classes)
        """
        return self.backbone(x)

    def freeze_backbone(self) -> None:
        """Freeze all feature-extractor layers; only the classifier head parameters stay trainable."""
        for name, param in self.backbone.named_parameters():
            if not name.startswith("fc"):
                param.requires_grad = False

    def unfreeze_backbone(self) -> None:
        """Unfreeze all layers for full model end-to-end fine-tuning."""
        for param in self.backbone.parameters():
            param.requires_grad = True

    def get_trainable_params(self) -> List[torch.nn.Parameter]:
        """Returns list of parameters that have requires_grad=True."""
        return [p for p in self.parameters() if p.requires_grad]

    def summary(self) -> Dict[str, Any]:
        """Returns parameter count statistics."""
        total = sum(p.numel() for p in self.parameters())
        trainable = sum(p.numel() for p in self.parameters() if p.requires_grad)
        return {
            "model_name": "SAROpticalResNet18",
            "total_parameters": total,
            "trainable_parameters": trainable,
            "frozen_parameters": total - trainable,
            "num_classes": self.num_classes,
        }


def get_model(
    num_classes: int = 2,
    pretrained: bool = True,
    dropout_rate: float = 0.2,
    freeze_backbone: bool = False,
    device: Optional[torch.device] = None,
) -> SAROpticalResNet18:
    """
    Factory function to instantiate and prepare the SAR/OPTICAL ResNet-18 model.

    Args:
        num_classes: Number of target classes.
        pretrained: If True, uses pretrained weights from ImageNet.
        dropout_rate: Dropout rate for regularization.
        freeze_backbone: If True, freezes conv backbone.
        device: PyTorch device (CPU, CUDA, MPS).

    Returns:
        SAROpticalResNet18 instance.
    """
    model = SAROpticalResNet18(
        num_classes=num_classes,
        pretrained=pretrained,
        dropout_rate=dropout_rate,
        freeze_backbone=freeze_backbone,
    )
    if device is not None:
        model = model.to(device)
    return model


def save_checkpoint(
    model: nn.Module,
    filepath: str,
    classes: List[str] = DEFAULT_CLASSES,
    epoch: Optional[int] = None,
    val_acc: Optional[float] = None,
    optimizer: Optional[torch.optim.Optimizer] = None,
) -> None:
    """
    Saves model checkpoint along with metadata and class labels.
    """
    checkpoint = {
        "model_state_dict": model.state_dict(),
        "classes": classes,
        "num_classes": len(classes),
        "epoch": epoch,
        "val_acc": val_acc,
    }
    if optimizer is not None:
        checkpoint["optimizer_state_dict"] = optimizer.state_dict()

    torch.save(checkpoint, filepath)


def load_checkpoint(
    filepath: str,
    device: torch.device = torch.device("cpu"),
    dropout_rate: float = 0.2,
) -> Tuple[SAROpticalResNet18, List[str], Dict[str, Any]]:
    """
    Loads model checkpoint and reconstructs architecture.

    Returns:
        Tuple of (model, classes, metadata_dict)
    """
    checkpoint = torch.load(filepath, map_location=device, weights_only=False)

    classes = checkpoint.get("classes", DEFAULT_CLASSES)
    num_classes = checkpoint.get("num_classes", len(classes))

    model = get_model(
        num_classes=num_classes,
        pretrained=False,
        dropout_rate=dropout_rate,
        freeze_backbone=False,
        device=device,
    )

    state_dict = checkpoint.get("model_state_dict", checkpoint)
    model.load_state_dict(state_dict)
    model.eval()

    meta = {
        "epoch": checkpoint.get("epoch"),
        "val_acc": checkpoint.get("val_acc"),
    }
    return model, classes, meta


if __name__ == "__main__":
    print("=" * 60)
    print("SAR / OPTICAL ResNet-18 Model Architecture Sanity Check")
    print("=" * 60)
    test_model = get_model(num_classes=2, pretrained=False, freeze_backbone=True)
    stats = test_model.summary()
    for k, v in stats.items():
        print(f"  {k}: {v}")

    dummy_input = torch.randn(2, 3, 224, 224)
    out = test_model(dummy_input)
    print(f"\n[+] Dummy input shape: {dummy_input.shape}")
    print(f"[+] Model output logits shape: {out.shape}")
    print(f"[+] Forward pass successful!")
