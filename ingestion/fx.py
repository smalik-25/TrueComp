"""FX rates as usd_per_unit (DQ rule 5).

Phase 1 fixtures are USD-only, so USD is the single identity rate. When Yahoo
Japan lands in Phase 2 this gains JPY (and a real rate fetch), and fact rows in
other currencies stop rejecting at the adapter boundary.
"""
from __future__ import annotations

DEFAULT_FX: dict[str, float] = {
    "USD": 1.0,
}
