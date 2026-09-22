"""Audit continuous VED channel windows without creating training labels.

Requires Python 3.11+ and openpyxl 3.1.x. Output is aggregate-only.
Usage: python scripts/audit_ved_windows.py WEEK.csv ICE_HEV.xlsx PHEV_EV.xlsx
"""
import argparse
import csv
import json
from collections import Counter, defaultdict
from pathlib import Path

from audit_ved import number
from audit_ved_static import digest, key
from openpyxl import load_workbook

GAP_SECONDS = (5, 10, 30)
DURATION_SECONDS = (60, 300, 600)
CHANNELS = ("raw_rate", "maf", "maf_bank1_trims")


def load_powertrains(paths):
    records = {}
    for path in paths:
        workbook = load_workbook(path, read_only=False, data_only=True)
        rows = iter(workbook.active.values)
        headers = next(rows)
        for values in rows:
            if all(value is None for value in values):
                continue
            record = dict(zip(headers, values))
            vehicle = key(record["VehId"])
            if vehicle in records:
                raise ValueError("Duplicate static vehicle identifier; ambiguous join")
            powertrain = record.get("Vehicle Type") or record.get("EngineType")
            if powertrain not in {"ICE", "HEV", "PHEV", "EV"}:
                raise ValueError("Unexpected powertrain; review source mapping")
            records[vehicle] = powertrain
        workbook.close()
    return records


def segment_points(points, channel, max_gap_ms):
    """Return (duration_ms, samples, all_zero) for valid continuous segments."""
    segments = []
    current = []

    def finish():
        if current:
            segments.append((current[-1][0] - current[0][0], len(current),
                             channel == "raw_rate" and all(value == 0 for _, value in current)))
            current.clear()

    for stamp, values in sorted(points, key=lambda item: (item[0] is None, item[0] or 0)):
        value = values[channel]
        if stamp is None or value is None or value < 0:
            finish()
            continue
        if current:
            gap = stamp - current[-1][0]
            if gap <= 0 or gap > max_gap_ms:
                finish()
        current.append((stamp, value))
    finish()
    return segments


def audit(dynamic, static_paths):
    powertrains = load_powertrains(static_paths)
    groups = defaultdict(list)
    group_types = {}
    unmatched = set()
    with dynamic.open(encoding="utf-8-sig", newline="") as stream:
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
                raise ValueError("Missing trip identifier; cannot form independent groups")
            powertrain = powertrains.get(vehicle, "UNMATCHED")
            if powertrain == "UNMATCHED":
                unmatched.add(vehicle)
            group_key = (vehicle, trip)
            group_types[group_key] = powertrain
            stamp = number(row["Timestamp(ms)"])
            rate = number(row["Fuel Rate[L/hr]"])
            maf = number(row["MAF[g/sec]"])
            short_trim = number(row["Short Term Fuel Trim Bank 1[%]"])
            long_trim = number(row["Long Term Fuel Trim Bank 1[%]"])
            groups[group_key].append((stamp, {
                "raw_rate": rate if rate is not None and rate >= 0 else None,
                "maf": maf if maf is not None and maf >= 0 else None,
                # Availability only: this does not apply trim corrections or derive fuel.
                "maf_bank1_trims": maf if maf is not None and maf >= 0
                and short_trim is not None and long_trim is not None else None,
            }))

    results = defaultdict(lambda: defaultdict(lambda: defaultdict(Counter)))
    quality = defaultdict(Counter)
    vehicles = defaultdict(lambda: defaultdict(lambda: defaultdict(lambda: defaultdict(set))))
    eligible_groups = defaultdict(lambda: defaultdict(lambda: defaultdict(lambda: defaultdict(set))))
    for group_key, points in groups.items():
        powertrain = group_types[group_key]
        stamps = [stamp for stamp, _ in points if stamp is not None]
        has_missing_timestamp = len(stamps) != len(points)
        quality[powertrain]["groups"] += 1
        quality[powertrain]["groups_with_missing_timestamp"] += int(has_missing_timestamp)
        quality[powertrain]["groups_with_duplicate_timestamp"] += int(len(stamps) != len(set(stamps)))
        quality[powertrain]["groups_with_source_order_reversal"] += int(
            any(later < earlier for earlier, later in zip(stamps, stamps[1:])))
        ordered = sorted(set(stamps))
        gaps = [b - a for a, b in zip(ordered, ordered[1:])]
        for seconds in GAP_SECONDS:
            quality[powertrain][f"groups_with_gap_over_{seconds}s"] += int(
                any(gap > seconds * 1000 for gap in gaps))
        for channel in CHANNELS:
            for gap_seconds in GAP_SECONDS:
                counts = results[powertrain][channel][str(gap_seconds)]
                # An undated row cannot be placed safely inside the sequence. Exclude
                # the entire group rather than silently joining observations around it.
                segments = [] if has_missing_timestamp else segment_points(
                    points, channel, gap_seconds * 1000)
                counts["segments"] += len(segments)
                counts["segments_with_2plus_samples"] += sum(samples >= 2 for _, samples, _ in segments)
                if channel == "raw_rate":
                    counts["all_zero_segments"] += sum(all_zero for _, _, all_zero in segments)
                for duration_seconds in DURATION_SECONDS:
                    qualifying = [segment for segment in segments
                                  if segment[0] >= duration_seconds * 1000 and segment[1] >= 2]
                    key_name = f"segments_at_least_{duration_seconds}s"
                    counts[key_name] += len(qualifying)
                    if channel == "raw_rate":
                        counts[f"all_zero_{key_name}"] += sum(
                            all_zero for _, _, all_zero in qualifying)
                    if qualifying:
                        vehicles[powertrain][channel][str(gap_seconds)][key_name].add(group_key[0])
                        eligible_groups[powertrain][channel][str(gap_seconds)][key_name].add(group_key)

    output = {}
    for powertrain in sorted(set(group_types.values())):
        channels = {}
        for channel in CHANNELS:
            gaps = {}
            for gap_seconds in GAP_SECONDS:
                counts = dict(results[powertrain][channel][str(gap_seconds)])
                for duration_seconds in DURATION_SECONDS:
                    name = f"segments_at_least_{duration_seconds}s"
                    counts[f"vehicles_with_{name}"] = len(
                        vehicles[powertrain][channel][str(gap_seconds)][name])
                    counts[f"groups_with_{name}"] = len(
                        eligible_groups[powertrain][channel][str(gap_seconds)][name])
                gaps[f"max_gap_{gap_seconds}s"] = counts
            channels[channel] = gaps
        output[powertrain] = {"quality": dict(quality[powertrain]), "channels": channels}
    return {
        "dynamic_file": dynamic.name,
        "dynamic_sha256": digest(dynamic),
        "static_sources": [
            {"file": path.name, "sha256": digest(path)} for path in static_paths
        ],
        "unmatched_dynamic_vehicles": len(unmatched),
        "thresholds": {"max_gap_seconds": GAP_SECONDS, "minimum_duration_seconds": DURATION_SECONDS},
        "by_powertrain": output,
        "claim": "Continuity and availability diagnostics only; no accepted labels, independent samples, model, or Cavite validation.",
    }


if __name__ == "__main__":
    parser = argparse.ArgumentParser()
    parser.add_argument("dynamic", type=Path)
    parser.add_argument("static", nargs=2, type=Path)
    args = parser.parse_args()
    print(json.dumps(audit(args.dynamic, args.static), indent=2))
