"""Synthetic-only regression checks for the optional research audit."""
import csv
import tempfile
import unittest
from pathlib import Path

from openpyxl import Workbook

from audit_ved_static import inspect


class AuditTest(unittest.TestCase):
    def setUp(self):
        self.temp = tempfile.TemporaryDirectory()
        self.addCleanup(self.temp.cleanup)
        self.root = Path(self.temp.name)
        self.static = self.root / "static.xlsx"
        book = Workbook()
        book.active.append(["VehId", "Vehicle Type", "Transmission"])
        book.active.append([1, "ICE", "NO DATA"])
        book.active.append([2, "PHEV", "Automatic"])
        book.save(self.static)
        self.dynamic = self.root / "dynamic.csv"

    def write_rows(self, rows):
        with self.dynamic.open("w", newline="", encoding="utf-8") as stream:
            writer = csv.writer(stream)
            writer.writerow(["VehId", "Trip", "Fuel Rate[L/hr]", "MAF[g/sec]",
                             "Short Term Fuel Trim Bank 1[%]", "Long Term Fuel Trim Bank 1[%]"])
            writer.writerows(rows)

    def test_missing_zero_and_unmatched_remain_distinct(self):
        self.write_rows([[1, "a", "", 2, 0, 0], [1, "a", "NaN", 3, "", 0],
                         [2, "b", 0, "", "", ""], [99, "c", -1, "", "", ""]])
        result = inspect(self.dynamic, [self.static])
        ice = result["by_powertrain"]["ICE"]
        self.assertEqual(ice["nonnegative_rate_rows"], 0)
        self.assertEqual(ice["groups_complete_maf"], 1)
        self.assertEqual(ice["groups_complete_maf_trim"], 0)
        self.assertEqual(result["by_powertrain"]["PHEV"]["zero_rate_rows"], 1)
        self.assertEqual(result["unmatched_dynamic_vehicles"], 1)
        self.assertEqual(result["static_missing_fields"]["Transmission"], 1)

    def test_duplicate_static_keys_fail_closed(self):
        self.write_rows([])
        with self.assertRaisesRegex(ValueError, "Duplicate"):
            inspect(self.dynamic, [self.static, self.static])

    def test_blank_trip_cannot_merge_unrelated_rows(self):
        self.write_rows([[1, "", 0, 0, 0, 0]])
        with self.assertRaisesRegex(ValueError, "Missing trip"):
            inspect(self.dynamic, [self.static])


if __name__ == "__main__":
    unittest.main()
