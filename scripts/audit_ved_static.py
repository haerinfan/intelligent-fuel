"""Join VED static workbooks to one telemetry CSV; emit aggregate diagnostics only.

Requires Python 3.11+ and openpyxl 3.1.x. No labels or models are produced.
Usage: python scripts/audit_ved_static.py WEEK.csv ICE_HEV.xlsx PHEV_EV.xlsx
"""
import argparse
import csv
import hashlib
import json
from collections import Counter, defaultdict
from pathlib import Path

from openpyxl import load_workbook

from audit_ved import number


def digest(path):
    with path.open("rb") as stream:
        return hashlib.file_digest(stream, "sha256").hexdigest()


def key(value):
    numeric = number(value)
    if numeric is None or not numeric.is_integer():
        raise ValueError("Missing or invalid vehicle identifier")
    return str(int(numeric))


def inspect(dynamic, static_paths):
    records = {}
    sources = []
    missing = Counter()
    for path in static_paths:
        # These small reference tables fit in memory; avoid a streaming file handle
        # remaining open on Windows when a duplicate/schema error interrupts the join.
        workbook = load_workbook(path, read_only=False, data_only=True)
        rows = iter(workbook.active.values)
        headers = next(rows)
        count = 0
        for values in rows:
            if all(v is None for v in values):
                continue
            record = dict(zip(headers, values))
            vehicle = key(record["VehId"])
            if vehicle in records:
                raise ValueError("Duplicate static vehicle identifier; ambiguous join")
            powertrain = record.get("Vehicle Type") or record.get("EngineType")
            if powertrain not in {"ICE", "HEV", "PHEV", "EV"}:
                raise ValueError("Unexpected powertrain; review source mapping")
            records[vehicle] = (powertrain, record)
            for field, value in record.items():
                if value is None or str(value).strip().upper() in {"", "NO DATA", "NAN"}:
                    missing[field] += 1
            count += 1
        workbook.close()
        sources.append({"file": path.name, "sha256": digest(path), "records": count})
    by_type = defaultdict(Counter)
    vehicles = defaultdict(set)
    groups = defaultdict(lambda: Counter(rows=0, rate=0, maf=0, maf_trim=0))
    unmatched = set()
    with dynamic.open(encoding="utf-8-sig", newline="") as stream:
        reader = csv.DictReader(stream)
        required = {"VehId", "Trip", "Fuel Rate[L/hr]", "MAF[g/sec]",
                    "Short Term Fuel Trim Bank 1[%]", "Long Term Fuel Trim Bank 1[%]"}
        if not required.issubset(reader.fieldnames or []):
            raise ValueError("Required dynamic columns missing")
        for row in reader:
            vehicle = key(row["VehId"])
            if not row.get("Trip", "").strip():
                raise ValueError("Missing trip identifier; cannot form independent groups")
            powertrain = records[vehicle][0] if vehicle in records else "UNMATCHED"
            if powertrain == "UNMATCHED":
                unmatched.add(vehicle)
            counts = by_type[powertrain]
            vehicles[powertrain].add(vehicle)
            counts["rows"] += 1
            rate = number(row["Fuel Rate[L/hr]"])
            maf = number(row["MAF[g/sec]"])
            st = number(row["Short Term Fuel Trim Bank 1[%]"])
            lt = number(row["Long Term Fuel Trim Bank 1[%]"])
            valid_rate = rate is not None and rate >= 0
            valid_maf = maf is not None and maf >= 0
            # Availability only. No trim assumptions, conversion, or fuel derivation.
            maf_trim = valid_maf and st is not None and lt is not None
            counts["nonnegative_rate_rows"] += int(valid_rate)
            counts["positive_rate_rows"] += int(valid_rate and rate > 0)
            counts["zero_rate_rows"] += int(valid_rate and rate == 0)
            counts["nonnegative_maf_rows"] += int(valid_maf)
            counts["maf_with_both_bank1_trims_rows"] += int(maf_trim)
            counts["rate_and_maf_with_both_bank1_trims_rows"] += int(valid_rate and maf_trim)
            group = groups[(powertrain, vehicle, row["Trip"])]
            group.update(rows=1, rate=int(valid_rate), maf=int(valid_maf), maf_trim=int(maf_trim))
    for (powertrain, _, _), group in groups.items():
        counts = by_type[powertrain]
        counts["vehicle_trip_groups"] += 1
        for channel in ("rate", "maf", "maf_trim"):
            counts["groups_complete_" + channel] += int(group[channel] == group["rows"])
    result = {}
    for powertrain, counts in sorted(by_type.items()):
        result[powertrain] = {"vehicles": len(vehicles[powertrain]), **dict(counts)}
    return {"dynamic_file": dynamic.name, "dynamic_sha256": digest(dynamic),
            "static_sources": sources, "static_unique_vehicles": len(records),
            "static_powertrain_counts": dict(Counter(v[0] for v in records.values())),
            "static_missing_fields": dict(missing), "unmatched_dynamic_vehicles": len(unmatched),
            "by_powertrain": result,
            "claim": "Availability only; complete channels do not establish valid labels, cadence or full trips."}


if __name__ == "__main__":
    parser = argparse.ArgumentParser()
    parser.add_argument("dynamic", type=Path)
    parser.add_argument("static", nargs=2, type=Path)
    args = parser.parse_args()
    print(json.dumps(inspect(args.dynamic, args.static), indent=2))
