from __future__ import annotations

from resolution.metrics import model_resolution_rate, overall_rate


def test_model_rate_counts_only_grail_brands():
    rows = [
        ("rick owens", "Ramones"),
        ("rick owens", None),
        ("maison margiela", "GAT"),
        ("acne studios", "Face"),  # not a grail brand -> ignored
        ("balenciaga", None),
    ]
    per = model_resolution_rate(rows)
    assert per["rick owens"] == (1, 2)
    assert per["maison margiela"] == (1, 1)
    assert per["balenciaga"] == (0, 1)
    assert "acne studios" not in per


def test_overall_rate_sums():
    per = {"rick owens": (1, 2), "maison margiela": (1, 1)}
    assert overall_rate(per) == (2, 3)


def test_empty_inputs():
    assert model_resolution_rate([]) == {}
    assert overall_rate({}) == (0, 0)
