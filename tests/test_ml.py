from __future__ import annotations

import numpy as np

from ml.metrics import average, error_metrics


def test_perfect_prediction_is_zero_error():
    y = np.array([100.0, 200.0, 300.0])
    m = error_metrics(y, y)
    assert m["mae"] == 0.0
    assert m["rmse"] == 0.0
    assert m["mdape"] == 0.0


def test_known_error():
    y = np.array([100.0, 200.0])
    p = np.array([150.0, 150.0])
    m = error_metrics(y, p)
    assert abs(m["mae"] - 50.0) < 1e-9
    assert abs(m["rmse"] - 50.0) < 1e-9


def test_average():
    avg = average([{"mae": 2.0}, {"mae": 4.0}])
    assert avg["mae"] == 3.0
