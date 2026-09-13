"""Aggregate-only feasibility audit; does not train a model or approve fuel labels.

Usage: python scripts/audit_ved.py /path/to/VED_171101_week.csv
Raw GPS and per-vehicle identifiers are never emitted.
"""
import argparse
import csv
import hashlib
import json
import math
from collections import defaultdict
from pathlib import Path


def number(value):
    try:
        result = float(value)
        return result if math.isfinite(result) else None
    except (TypeError, ValueError):
        return None


def audit(path):
    counts = defaultdict(int)
    groups = defaultdict(list)
    vehicles = set()
    rate_vehicles = set()
    positive_vehicles = set()
    with path.open(encoding="utf-8-sig", newline="") as stream:
        rows = csv.DictReader(stream)
        required = {"VehId", "Trip", "Timestamp(ms)", "Fuel Rate[L/hr]"}
        if not required.issubset(rows.fieldnames or []):
            raise ValueError("Required VED fields are missing")
        columns = rows.fieldnames
        for row in rows:
            counts["rows"] += 1
            vehicles.add(row["VehId"])
            stamp = number(row["Timestamp(ms)"])
            rate = number(row["Fuel Rate[L/hr]"])
            if rate is None:
                counts["missing_or_nonfinite_fuel_rate_rows"] += 1
            elif rate < 0:
                counts["negative_fuel_rate_rows"] += 1
            else:
                rate_vehicles.add(row["VehId"])
                if rate > 0:
                    positive_vehicles.add(row["VehId"])
                counts["nonnegative_fuel_rate_rows"] += 1
                counts["zero_fuel_rate_rows"] += int(rate == 0)
            groups[(row["VehId"], row["Trip"])].append((stamp, rate))
    spans = []
    for points in groups.values():
        complete = all(t is not None and r is not None and r >= 0 for t, r in points)
        counts["groups_with_any_nonnegative_fuel_rate"] += int(any(r is not None and r >= 0 for _, r in points))
        if not complete:
            continue
        counts["groups_with_complete_nonnegative_fuel_rate_and_time"] += 1
        ordered = sorted(points)
        gaps = [b[0] - a[0] for a, b in zip(ordered, ordered[1:])]
        counts["complete_groups_with_duplicate_timestamps"] += int(any(g == 0 for g in gaps))
        counts["complete_groups_with_gap_over_30_seconds"] += int(any(g > 30000 for g in gaps))
        if not gaps or any(g <= 0 or g > 30000 for g in gaps):
            continue
        counts["groups_passing_exploratory_cadence_screen"] += 1
        # Trapezoidal integration is an audit diagnostic, not an accepted label protocol.
        liters = sum((a[1] + b[1]) / 2 * (b[0] - a[0]) / 3600000
                     for a, b in zip(ordered, ordered[1:]))
        spans.append(liters)
    digest = hashlib.sha256()
    with path.open("rb") as stream:
        for block in iter(lambda: stream.read(1024 * 1024), b""):
            digest.update(block)
    return {"file": path.name, "sha256": digest.hexdigest(),
            "columns": columns, "distinct_vehicles": len(vehicles),
            "distinct_vehicle_trip_groups": len(groups), **dict(counts),
            "vehicles_with_nonnegative_fuel_rate": len(rate_vehicles),
            "vehicles_with_positive_fuel_rate": len(positive_vehicles),
            "diagnostic_integrated_liters_min": min(spans) if spans else None,
            "diagnostic_integrated_liters_max": max(spans) if spans else None,
            "screen": "complete nonnegative fuel rate, finite timestamps, >=2 samples, strictly positive sorted gaps <=30 seconds",
            "claim": "Feasibility diagnostics only; no accepted labels, split, model or Cavite validation."}


if __name__ == "__main__":
    parser = argparse.ArgumentParser()
    parser.add_argument("csv_path", type=Path)
    arguments = parser.parse_args()
    print(json.dumps(audit(arguments.csv_path), indent=2))
