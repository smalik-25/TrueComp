"""Pure error metrics, kept free of heavy ML imports so they stay easy to test."""
from __future__ import annotations

import numpy as np


def error_metrics(y_true: np.ndarray, y_pred: np.ndarray) -> dict[str, float]:
    err = np.abs(y_true - y_pred)
    return {
        "mae": float(err.mean()),
        "rmse": float(np.sqrt(((y_true - y_pred) ** 2).mean())),
        "mdape": float(np.median(err / np.maximum(y_true, 1.0))),
    }


def average(scores: list[dict[str, float]]) -> dict[str, float]:
    return {k: float(np.mean([s[k] for s in scores])) for k in scores[0]}
