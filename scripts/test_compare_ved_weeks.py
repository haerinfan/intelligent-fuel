"""Synthetic regression checks for cross-week aggregate comparison."""
import csv
import tempfile
import unittest
from pathlib import Path

from compare_ved_weeks import compare
from openpyxl import Workbook


class WeekComparisonTest(unittest.TestCase):
    def write_week(self, path, rows):
        headers = ["VehId", "Trip", "Timestamp(ms)", "Fuel Rate[L/hr]", "MAF[g/sec]",
                   "Short Term Fuel Trim Bank 1[%]", "Long Term Fuel Trim Bank 1[%]"]
        with path.open("w", newline="", encoding="utf-8") as stream:
            writer = csv.writer(stream)
            writer.writerow(headers)
            writer.writerows(rows)

    def test_reports_overlap_without_identifiers(self):
        with tempfile.TemporaryDirectory() as directory:
            root = Path(directory)
            static = root / "static.xlsx"
            book = Workbook()
            book.active.append(["VehId", "Vehicle Type"])
            book.active.append([111111, "ICE"])
            book.active.append([222222, "HEV"])
            book.save(static)

            stamps = range(0, 301_000, 5_000)
            first_rows = [[111111, "private-a", stamp, "", 2, 0, 0] for stamp in stamps]
            second_rows = [[111111, "private-b", stamp, "", 2, 0, 0] for stamp in stamps]
            second_rows.extend([[222222, "private-c", stamp, "", 2, 0, 0]
                                for stamp in stamps])
            first_path = root / "week1.csv"
            second_path = root / "week2.csv"
            self.write_week(first_path, first_rows)
            self.write_week(second_path, second_rows)

            result = compare(first_path, second_path, [static])
            self.assertEqual(result["overall_vehicles"], {
                "week_1": 1, "week_2": 2, "shared": 1, "union": 2,
            })
            self.assertEqual(result["exact_vehicle_trip_groups"]["shared"], 0)
            eligible = result["by_powertrain"]["ICE"]["eligible_at_strict_threshold"]
            self.assertEqual(eligible["maf_bank1_trims"]["eligible_vehicles"]["shared"], 1)
            encoded = str(result)
            self.assertNotIn("111111", encoded)
            self.assertNotIn("private-a", encoded)
            self.assertEqual(len(result["inputs"][0]["sha256"]), 64)


if __name__ == "__main__":
    unittest.main()
