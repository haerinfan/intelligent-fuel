"""Compare two VED weeks without emitting vehicle or trip identifiers.

Requires Python 3.11+ and openpyxl 3.1.x. This checks overlap and strict
five-second/ five-minute channel availability; it does not create labels.

Usage: python scripts/compare_ved_weeks.py WEEK1.csv WEEK2.csv ICE_HEV.xlsx PHEV_EV.xlsx
"""
import argparse
import csv
import json
from collections import defaultdict
from pathlib import Path

from audit_ved import number
from audit_ved_static import digest, key
from audit_ved_windows import CHANNELS, load_powertrains, segment_points

MAX_GAP_MS = 5_000
MIN_DURATION_MS = 300_000


def collect(path, powertrains):
    vehicles = defaultdict(set)
    groups = defaultdict(list)
    group_types = {}
    with path.open(encoding="utf-8-sig", newline="") as stream:
        reader = csv.DictReader(stream)
        required = {"VehId", "Trip", "Timestamp(ms)", "Fuel Rate[L/hr]",
                    "MAF[g/sec]", "Short Term Fuel Trim Bank 1[%]",
                    "Long Term Fuel Trim Bank 1[%]"}
        if not required.issubset(reader.fieldnames or []):
            raise ValueError("Required dynamic columns missing")
        for row in reader:
            vehicle = key(row["VehId"])
            trip = row.get("Trip", "").strip()
            if not trip:
                raise ValueError("Missing trip identifier; cannot compare groups")
            powertrain = powertrains.get(vehicle, "UNMATCHED")
            vehicles[powertrain].add(vehicle)
            group_key = (vehicle, trip)
            group_types[group_key] = powertrain
            rate = number(row["Fuel Rate[L/hr]"])
            maf = number(row["MAF[g/sec]"])
            short_trim = number(row["Short Term Fuel Trim Bank 1[%]"])
            long_trim = number(row["Long Term Fuel Trim Bank 1[%]"])
            groups[group_key].append((number(row["Timestamp(ms)"]), {
                "raw_rate": rate if rate is not None and rate >= 0 else None,
                "maf": maf if maf is not None and maf >= 0 else None,
                "maf_bank1_trims": maf if maf is not None and maf >= 0
                and short_trim is not None and long_trim is not None else None,
            }))

    eligible_vehicles = defaultdict(lambda: defaultdict(set))
    eligible_groups = defaultdict(lambda: defaultdict(set))
    for group_key, points in groups.items():
        powertrain = group_types[group_key]
        if any(stamp is None for stamp, _ in points):
            continue
        for channel in CHANNELS:
            segments = segment_points(points, channel, MAX_GAP_MS)
            if any(duration >= MIN_DURATION_MS and samples >= 2
                   for duration, samples, _ in segments):
                eligible_vehicles[powertrain][channel].add(group_key[0])
                eligible_groups[powertrain][channel].add(group_key)
    return {
        "vehicles": vehicles,
        "groups": set(groups),
        "group_types": group_types,
        "eligible_vehicles": eligible_vehicles,
        "eligible_groups": eligible_groups,
    }


def overlap_counts(first, second):
    return {
        "week_1": len(first),
        "week_2": len(second),
        "shared": len(first & second),
        "union": len(first | second),
    }


def compare(first_path, second_path, static_paths):
    powertrains = load_powertrains(static_paths)
    first = collect(first_path, powertrains)
    second = collect(second_path, powertrains)
    powertrain_names = sorted(
        set(first["vehicles"]) | set(second["vehicles"])
    )
    by_powertrain = {}
    for powertrain in powertrain_names:
        channels = {}
        for channel in CHANNELS:
            channels[channel] = {
                "eligible_vehicles": overlap_counts(
                    first["eligible_vehicles"][powertrain][channel],
                    second["eligible_vehicles"][powertrain][channel],
                ),
                "eligible_groups": overlap_counts(
                    first["eligible_groups"][powertrain][channel],
                    second["eligible_groups"][powertrain][channel],
                ),
            }
        by_powertrain[powertrain] = {
            "vehicles": overlap_counts(
                first["vehicles"][powertrain], second["vehicles"][powertrain]
            ),
            "eligible_at_strict_threshold": channels,
        }

    first_all_vehicles = set().union(*first["vehicles"].values())
    second_all_vehicles = set().union(*second["vehicles"].values())
    return {
        "inputs": [
            {"file": first_path.name, "sha256": digest(first_path)},
            {"file": second_path.name, "sha256": digest(second_path)},
        ],
        "static_sources": [
            {"file": path.name, "sha256": digest(path)} for path in static_paths
        ],
        "strict_threshold": {
            "maximum_gap_seconds": MAX_GAP_MS // 1000,
            "minimum_duration_seconds": MIN_DURATION_MS // 1000,
        },
        "overall_vehicles": overlap_counts(first_all_vehicles, second_all_vehicles),
        "exact_vehicle_trip_groups": overlap_counts(first["groups"], second["groups"]),
        "by_powertrain": by_powertrain,
        "claim": "Aggregate overlap and availability only; repeated vehicles are not independent evidence and no label, split, model, or Cavite validation is accepted.",
    }


if __name__ == "__main__":
    parser = argparse.ArgumentParser()
    parser.add_argument("week_1", type=Path)
    parser.add_argument("week_2", type=Path)
    parser.add_argument("static", nargs=2, type=Path)
    arguments = parser.parse_args()
    print(json.dumps(compare(arguments.week_1, arguments.week_2, arguments.static), indent=2))
