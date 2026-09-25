import { readFile } from "node:fs/promises";
import { fileURLToPath } from "node:url";
import { Decimal } from "decimal.js";
import { z } from "zod";

const date = z.iso.date();
const timestamp = z.iso.datetime({ offset: true });
const decimal = z.string().regex(/^\d+(?:\.\d+)?$/);

const recordSchema = z
  .strictObject({
    sourceName: z.string().min(1),
    sourceUrl: z.url(),
    sourceFileSha256: z.string().regex(/^[a-f0-9]{64}$/),
    sourcePage: z.number().int().positive(),
    reportPeriodStart: date,
    reportPeriodEnd: date,
    monitoredFromDate: date,
    monitoredThroughDate: date,
    retrievedAt: timestamp,
    province: z.string().min(1),
    cityMunicipality: z.string().min(1),
    brandId: z.string().min(1).nullable(),
    fuelType: z.enum(["gasoline", "diesel"]),
    gradeId: z.string().min(1),
    lowerPhpPerLiter: decimal.nullable(),
    upperPhpPerLiter: decimal.nullable(),
    commonPhpPerLiter: decimal.nullable(),
    sourceMarker: z.enum(["blank", "zero_range", "none", "no_lfro"]).nullable(),
    reviewStatus: z.enum(["pending", "visually_verified", "rejected"]),
    reviewedBy: z.string().min(1).nullable(),
    reviewedAt: timestamp.nullable(),
  })
  .superRefine((record, context) => {
    const addIssue = (message: string) =>
      context.addIssue({ code: "custom", message });
    const hasRange =
      record.lowerPhpPerLiter !== null && record.upperPhpPerLiter !== null;

    if (record.sourceMarker === null && !hasRange) {
      addIssue("Usable records require both range endpoints.");
    }
    if (
      record.sourceMarker !== null &&
      (hasRange || record.commonPhpPerLiter !== null)
    ) {
      addIssue("Unavailable markers cannot carry numeric prices.");
    }
    if (hasRange) {
      const lower = new Decimal(record.lowerPhpPerLiter ?? "0");
      const upper = new Decimal(record.upperPhpPerLiter ?? "0");
      if (!lower.isPositive() || lower.greaterThan(upper)) {
        addIssue("Price range must be positive and ordered.");
      }
    }
    if (
      record.commonPhpPerLiter !== null &&
      !new Decimal(record.commonPhpPerLiter).isPositive()
    ) {
      addIssue("Common price must be positive when present.");
    }
    if (record.reportPeriodStart > record.reportPeriodEnd) {
      addIssue("Report period is reversed.");
    }
    if (
      record.monitoredFromDate > record.monitoredThroughDate ||
      record.monitoredFromDate < record.reportPeriodStart ||
      record.monitoredThroughDate > record.reportPeriodEnd
    ) {
      addIssue("Monitoring dates must be ordered inside the report period.");
    }
    const reviewed = record.reviewStatus !== "pending";
    if (
      reviewed !== (record.reviewedBy !== null && record.reviewedAt !== null)
    ) {
      addIssue("Reviewer metadata must match the review status.");
    }
  });

const datasetSchema = z.strictObject({
  schemaVersion: z.literal("source-price-record/0.1"),
  datasetNotice: z.string().min(1),
  records: z.array(recordSchema).min(1),
});

const path = fileURLToPath(
  new URL("../data/staging/doe-imus-ron95-2026-09.json", import.meta.url),
);
const dataset = datasetSchema.parse(JSON.parse(await readFile(path, "utf8")));
const keys = new Set<string>();
for (const record of dataset.records) {
  const key = [
    record.sourceFileSha256,
    record.sourcePage,
    record.cityMunicipality,
    record.brandId ?? "general",
    record.fuelType,
    record.gradeId,
  ].join("|");
  if (keys.has(key)) throw new Error(`Duplicate staging record: ${key}`);
  keys.add(key);
}

const usable = dataset.records.filter((record) => record.sourceMarker === null);
const unavailable = dataset.records.length - usable.length;
const verified = dataset.records.filter(
  (record) => record.reviewStatus === "visually_verified",
).length;
console.log(
  `DOE staging: ${dataset.records.length} records; ${usable.length} usable ranges; ${unavailable} unavailable markers; ${verified} visually verified. Runtime normalization remains blocked by D13.`,
);
