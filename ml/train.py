"""Train and honestly evaluate a LightGBM sold-price model.

The corpus is small and footwear-heavy, so this is a proof of the modelling
pipeline, not a production price oracle. Two choices keep the evaluation honest:

- GroupKFold by piece, so the model is always scored on pieces it never saw.
  Plain row-wise CV would let it memorize a piece's price and look far better
  than it is.
- Every metric is printed next to a naive brand+archetype median baseline, so
  any real skill is visible rather than assumed. On thin data the model often
  barely beats, or loses to, that baseline, and that is the honest result.
"""
from __future__ import annotations

import lightgbm as lgb
import numpy as np
from sklearn.model_selection import GroupKFold

from .features import CATEGORICAL, TARGET, load_frame
from .metrics import average as _avg
from .metrics import error_metrics as _metrics

_PARAMS = dict(
    objective="regression_l1",
    num_leaves=15,
    min_data_in_leaf=5,
    learning_rate=0.05,
    n_estimators=150,
    verbose=-1,
    seed=42,
)


def _baseline(train, test) -> np.ndarray:
    # brand+archetype median from the training fold, global median as fallback
    key_tr = train["brand_norm"].astype(str) + "|" + train["archetype"].astype(str)
    med = train.groupby(key_tr)[TARGET].median()
    gmed = train[TARGET].median()
    key_te = test["brand_norm"].astype(str) + "|" + test["archetype"].astype(str)
    return key_te.map(med).fillna(gmed).to_numpy()


def evaluate(df, n_splits: int = 5):
    x = df[CATEGORICAL]
    y = df[TARGET].to_numpy()
    ylog = np.log1p(y)
    groups = df["piece_id"].to_numpy()
    model_scores, base_scores = [], []
    gkf = GroupKFold(n_splits=n_splits)
    for tr, te in gkf.split(x, ylog, groups):
        dtrain = lgb.Dataset(
            x.iloc[tr], label=ylog[tr], categorical_feature=CATEGORICAL, free_raw_data=False
        )
        model = lgb.train(_PARAMS, dtrain)
        pred = np.expm1(model.predict(x.iloc[te]))
        model_scores.append(_metrics(y[te], pred))
        base_scores.append(_metrics(y[te], _baseline(df.iloc[tr], df.iloc[te])))
    return model_scores, base_scores


def main() -> int:
    df = load_frame()
    n_pieces = df["piece_id"].nunique()
    print(f"resolved sold rows: {len(df)} across {n_pieces} pieces")

    model_scores, base_scores = evaluate(df)
    m, b = _avg(model_scores), _avg(base_scores)

    print("\n=== held-out error (GroupKFold by piece), USD ===")
    print(f"{'':16}{'MAE':>9}{'RMSE':>9}{'MdAPE':>9}")
    print(f"{'baseline':16}{b['mae']:>9.0f}{b['rmse']:>9.0f}{b['mdape'] * 100:>8.1f}%")
    print(f"{'lightgbm':16}{m['mae']:>9.0f}{m['rmse']:>9.0f}{m['mdape'] * 100:>8.1f}%")
    lift = (b["mae"] - m["mae"]) / b["mae"] * 100 if b["mae"] else 0.0
    print(f"\nMAE lift over baseline: {lift:+.1f}%")

    # feature importance from a model on all rows (gain-based)
    dall = lgb.Dataset(
        df[CATEGORICAL], label=np.log1p(df[TARGET].to_numpy()),
        categorical_feature=CATEGORICAL, free_raw_data=False,
    )
    full = lgb.train(_PARAMS, dall)
    imp = sorted(
        zip(CATEGORICAL, full.feature_importance(importance_type="gain")),
        key=lambda kv: kv[1], reverse=True,
    )
    print("\nfeature importance (gain):")
    for name, gain in imp:
        print(f"  {name:18} {gain:.0f}")

    print(
        "\nHonest read: a few hundred resolved sales, footwear-heavy, most pieces "
        "with one or two comps. Error bands are wide and per-piece predictions on "
        "thin archetypes are not trustworthy. The point here is the pipeline; the "
        "model earns its keep only once the corpus is broadened and deepened."
    )
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
