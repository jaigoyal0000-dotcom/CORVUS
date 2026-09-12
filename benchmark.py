#!/usr/bin/env python3
"""
benchmark.py
============
Comprehensive Benchmarking Suite for the SAR vs. OPTICAL ResNet-18 Satellite Classifier.

Measures:
1. Model Architecture Profile (parameter counts, model footprint on disk & RAM).
2. End-to-end Inference Latency & Throughput across batch sizes (1, 4, 16, 32).
3. Latency breakdown (Disk I/O + 3-channel transforms vs. Model Forward Pass).
4. Validation Classification Metrics (Accuracy, Precision, Recall, F1-Score, Confusion Matrix).
5. Output summary in both console visual tables and exportable JSON report.
"""

import os
import sys
import time
import json
import argparse
from typing import Dict, Any, List, Tuple
import numpy as np

import torch
import torch.nn as nn
from PIL import Image

from model import get_model, load_checkpoint, DEFAULT_CLASSES
from dataset_loader import get_data_loaders, safe_rgb_loader, get_satellite_transforms

if sys.platform == "win32":
    try:
        sys.stdout.reconfigure(encoding="utf-8")
    except Exception:
        pass


def get_model_size_mb(model: nn.Module) -> float:
    """Calculates in-memory parameter footprint in Megabytes."""
    param_size = sum(p.numel() * p.element_size() for p in model.parameters())
    buffer_size = sum(b.numel() * b.element_size() for b in model.buffers())
    return (param_size + buffer_size) / (1024 * 1024)


def benchmark_latency(
    model: nn.Module,
    device: torch.device,
    batch_sizes: List[int] = [1, 4, 16, 32],
    num_warmup: int = 10,
    num_iterations: int = 50,
) -> Dict[str, Any]:
    """
    Measures forward-pass latency and throughput (images/sec) across batch sizes.
    """
    model.eval()
    results = {}

    for bs in batch_sizes:
        dummy_input = torch.randn(bs, 3, 224, 224, device=device)

        # Warm-up runs
        with torch.no_grad():
            for _ in range(num_warmup):
                _ = model(dummy_input)

        # Synchronize device if CUDA
        if device.type == "cuda":
            torch.cuda.synchronize()

        latencies_ms = []
        for _ in range(num_iterations):
            t0 = time.perf_counter()
            with torch.no_grad():
                _ = model(dummy_input)
            if device.type == "cuda":
                torch.cuda.synchronize()
            t1 = time.perf_counter()
            latencies_ms.append((t1 - t0) * 1000.0)

        latencies_arr = np.array(latencies_ms)
        mean_lat = float(np.mean(latencies_arr))
        p50_lat = float(np.percentile(latencies_arr, 50))
        p95_lat = float(np.percentile(latencies_arr, 95))
        p99_lat = float(np.percentile(latencies_arr, 99))
        throughput_fps = float((bs * 1000.0) / mean_lat)

        results[f"batch_{bs}"] = {
            "batch_size": bs,
            "mean_latency_ms": round(mean_lat, 2),
            "p50_latency_ms": round(p50_lat, 2),
            "p95_latency_ms": round(p95_lat, 2),
            "p99_latency_ms": round(p99_lat, 2),
            "throughput_fps": round(throughput_fps, 2),
            "latency_per_sample_ms": round(mean_lat / bs, 2),
        }

    return results


def benchmark_pipeline_breakdown(
    model: nn.Module,
    sample_image_path: str,
    device: torch.device,
    iterations: int = 30,
) -> Dict[str, float]:
    """
    Measures pipeline time allocation:
    1. Disk read & 3-channel RGB conversion
    2. Tensor Transform & Normalization
    3. Model Forward Pass
    4. Softmax & Class Extraction
    """
    model.eval()
    tfs = get_satellite_transforms(img_size=224)["val"]

    io_times, transform_times, forward_times, post_times = [], [], [], []

    for _ in range(iterations):
        # 1. IO + RGB convert
        t0 = time.perf_counter()
        img = safe_rgb_loader(sample_image_path)
        t1 = time.perf_counter()

        # 2. Transform + Tensor
        tensor = tfs(img).unsqueeze(0).to(device)
        t2 = time.perf_counter()

        # 3. Model Forward
        with torch.no_grad():
            out = model(tensor)
            if device.type == "cuda":
                torch.cuda.synchronize()
        t3 = time.perf_counter()

        # 4. Softmax
        prob = torch.softmax(out, dim=1)
        _ = torch.argmax(prob, dim=1).item()
        t4 = time.perf_counter()

        io_times.append((t1 - t0) * 1000.0)
        transform_times.append((t2 - t1) * 1000.0)
        forward_times.append((t3 - t2) * 1000.0)
        post_times.append((t4 - t3) * 1000.0)

    total_mean = np.mean(io_times) + np.mean(transform_times) + np.mean(forward_times) + np.mean(post_times)

    return {
        "io_rgb_convert_ms": round(float(np.mean(io_times)), 2),
        "tensor_transform_ms": round(float(np.mean(transform_times)), 2),
        "model_forward_ms": round(float(np.mean(forward_times)), 2),
        "softmax_postprocess_ms": round(float(np.mean(post_times)), 2),
        "total_end_to_end_ms": round(float(total_mean), 2),
    }


def evaluate_dataset_metrics(
    model: nn.Module,
    dataloader: torch.utils.data.DataLoader,
    classes: List[str],
    device: torch.device,
) -> Dict[str, Any]:
    """
    Evaluates comprehensive classification metrics on validation data.
    """
    model.eval()
    all_preds = []
    all_targets = []

    with torch.no_grad():
        for inputs, targets in dataloader:
            inputs = inputs.to(device)
            outputs = model(inputs)
            preds = torch.argmax(outputs, dim=1).cpu().numpy()
            all_preds.extend(preds)
            all_targets.extend(targets.numpy())

    all_preds = np.array(all_preds)
    all_targets = np.array(all_targets)

    total_samples = len(all_targets)
    if total_samples == 0:
        return {"samples": 0}

    accuracy = float(np.mean(all_preds == all_targets))

    # Confusion matrix (for 2 classes: 0 = classes[0], 1 = classes[1])
    # [ [TN, FP], [FN, TP] ] where 1 is SAR
    cm = np.zeros((len(classes), len(classes)), dtype=int)
    for t, p in zip(all_targets, all_preds):
        cm[t, p] += 1

    per_class_metrics = {}
    for i, cls_name in enumerate(classes):
        tp = cm[i, i]
        fp = np.sum(cm[:, i]) - tp
        fn = np.sum(cm[i, :]) - tp
        precision = tp / (tp + fp) if (tp + fp) > 0 else 0.0
        recall = tp / (tp + fn) if (tp + fn) > 0 else 0.0
        f1 = (2 * precision * recall) / (precision + recall) if (precision + recall) > 0 else 0.0

        per_class_metrics[cls_name] = {
            "precision": round(float(precision), 4),
            "recall": round(float(recall), 4),
            "f1_score": round(float(f1), 4),
            "support": int(np.sum(cm[i, :])),
        }

    return {
        "total_samples": total_samples,
        "accuracy": round(accuracy, 4),
        "accuracy_pct": f"{accuracy * 100:.2f}%",
        "confusion_matrix": cm.tolist(),
        "classes": classes,
        "per_class": per_class_metrics,
    }


def run_benchmark(
    checkpoint_path: str = "checkpoints/best_sar_optical_resnet18.pth",
    data_dir: str = "dataset",
    output_report: str = "benchmark_report.json",
) -> Dict[str, Any]:
    """
    Executes full benchmarking suite.
    """
    device = torch.device("cuda" if torch.cuda.is_available() else "cpu")
    print("=" * 68)
    print("     SAR VS. OPTICAL RESNET-18 SATELLITE CLASSIFIER BENCHMARK")
    print("=" * 68)
    print(f"[*] Execution Device: {device} ({'GPU Acceleration' if device.type == 'cuda' else 'CPU'})")

    # 1. Model Loading
    if os.path.isfile(checkpoint_path):
        model, classes, meta = load_checkpoint(checkpoint_path, device=device)
        print(f"[+] Loaded Checkpoint: {checkpoint_path}")
    else:
        print(f"[!] Checkpoint not found at {checkpoint_path}. Benchmarking standard architecture.")
        classes = DEFAULT_CLASSES
        model = get_model(num_classes=2, pretrained=True, device=device)
        model.eval()

    # 2. Architecture & Footprint Benchmark
    summary = model.summary()
    mem_size_mb = get_model_size_mb(model)
    file_size_mb = os.path.getsize(checkpoint_path) / (1024 * 1024) if os.path.isfile(checkpoint_path) else mem_size_mb

    # Theoretical FLOPs for ResNet-18 (224x224 input is ~1.82 GFLOPs / 1.82e9 FLOPs)
    gflops_approx = 1.82

    arch_profile = {
        "architecture": "ResNet-18 (Modified 2-Class)",
        "total_parameters": summary["total_parameters"],
        "trainable_parameters": summary["trainable_parameters"],
        "model_ram_footprint_mb": round(mem_size_mb, 2),
        "disk_checkpoint_size_mb": round(file_size_mb, 2),
        "floating_point_operations_gflops": gflops_approx,
    }

    print("\n--- Model Architecture & Footprint ---")
    print(f"  • Architecture:          {arch_profile['architecture']}")
    print(f"  • Total Parameters:      {arch_profile['total_parameters']:,}")
    print(f"  • Trainable Parameters:  {arch_profile['trainable_parameters']:,}")
    print(f"  • Compute Complexity:    ~{gflops_approx} GFLOPs (per 224x224 sample)")
    print(f"  • In-Memory RAM Size:    {arch_profile['model_ram_footprint_mb']} MB")
    print(f"  • Disk Checkpoint Size:  {arch_profile['disk_checkpoint_size_mb']} MB")

    # 3. Latency & Throughput Benchmark
    print("\n--- Latency & Throughput Benchmark (Across Batch Sizes) ---")
    latency_results = benchmark_latency(model, device=device)

    print(f"{'Batch Size':^12} | {'Mean Latency':^14} | {'P95 Latency':^13} | {'Per-Item':^12} | {'Throughput':^14}")
    print("-" * 72)
    for k, v in latency_results.items():
        print(
            f"{v['batch_size']:^12d} | "
            f"{v['mean_latency_ms']:^11.2f} ms | "
            f"{v['p95_latency_ms']:^10.2f} ms | "
            f"{v['latency_per_sample_ms']:^9.2f} ms | "
            f"{v['throughput_fps']:^9.1f} FPS"
        )

    # 4. Pipeline Breakdown Benchmark
    sample_img = None
    for split in ["val", "train"]:
        for cls in ["SAR", "OPTICAL"]:
            p = os.path.join(data_dir, split, cls)
            if os.path.exists(p):
                files = [f for f in os.listdir(p) if f.lower().endswith((".png", ".jpg", ".tif"))]
                if files:
                    sample_img = os.path.join(p, files[0])
                    break
        if sample_img:
            break

    breakdown_results = {}
    if sample_img:
        print("\n--- Single-Image End-to-End Pipeline Breakdown ---")
        breakdown_results = benchmark_pipeline_breakdown(model, sample_img, device=device)
        print(f"  • Disk I/O & RGB Standardize:  {breakdown_results['io_rgb_convert_ms']:6.2f} ms")
        print(f"  • Tensor Preprocessing:        {breakdown_results['tensor_transform_ms']:6.2f} ms")
        print(f"  • Neural Forward Pass:         {breakdown_results['model_forward_ms']:6.2f} ms")
        print(f"  • Softmax & Output Extraction: {breakdown_results['softmax_postprocess_ms']:6.2f} ms")
        print(f"  -----------------------------------------------")
        print(f"  • Total End-to-End Latency:    {breakdown_results['total_end_to_end_ms']:6.2f} ms")

    # 5. Validation Accuracy & Quality Metrics
    val_metrics = {}
    try:
        loaders, cls_names, sizes = get_data_loaders(data_dir, batch_size=8)
        if sizes["val"] > 0:
            val_metrics = evaluate_dataset_metrics(model, loaders["val"], cls_names, device)
            print("\n--- Validation Quality Metrics ---")
            print(f"  • Validation Set Size:   {val_metrics['total_samples']} images")
            print(f"  • Overall Accuracy:      {val_metrics['accuracy_pct']}")
            print("\n  Per-Class Detailed Metrics:")
            print(f"    {'Class':<10} | {'Precision':^10} | {'Recall':^10} | {'F1-Score':^10} | {'Support':^8}")
            print("    " + "-" * 56)
            for c_name, m in val_metrics["per_class"].items():
                print(f"    {c_name:<10} | {m['precision']:^10.4f} | {m['recall']:^10.4f} | {m['f1_score']:^10.4f} | {m['support']:^8d}")

            print(f"\n  Confusion Matrix (Rows: Ground Truth, Cols: Predicted):")
            print(f"                 Pred {cls_names[0]:<7} Pred {cls_names[1]:<7}")
            cm = val_metrics["confusion_matrix"]
            print(f"    True {cls_names[0]:<7} {cm[0][0]:^11d} {cm[0][1]:^11d}")
            print(f"    True {cls_names[1]:<7} {cm[1][0]:^11d} {cm[1][1]:^11d}")
    except Exception as e:
        print(f"[!] Validation metrics evaluation skipped: {e}")

    report = {
        "timestamp": time.strftime("%Y-%m-%d %H:%M:%S"),
        "device": str(device),
        "architecture_profile": arch_profile,
        "latency_throughput": latency_results,
        "single_image_pipeline_breakdown": breakdown_results,
        "validation_quality_metrics": val_metrics,
    }

    with open(output_report, "w") as f:
        json.dump(report, f, indent=2)

    print("\n" + "=" * 68)
    print(f"[+] Benchmark report saved successfully to: {os.path.abspath(output_report)}")
    print("=" * 68)
    return report


def main():
    parser = argparse.ArgumentParser(description="Run benchmark suite for SAR vs. OPTICAL satellite classifier.")
    parser.add_argument("--checkpoint", type=str, default="checkpoints/best_sar_optical_resnet18.pth")
    parser.add_argument("--data-dir", type=str, default="dataset")
    parser.add_argument("--output", type=str, default="benchmark_report.json")
    args = parser.parse_args()

    run_benchmark(
        checkpoint_path=args.checkpoint,
        data_dir=args.data_dir,
        output_report=args.output,
    )


if __name__ == "__main__":
    main()
