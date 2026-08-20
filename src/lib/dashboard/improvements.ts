export type DashboardImprovementDiscipline = "swim" | "run" | "bike";

export type DashboardImprovementAnalysisRow = {
  discipline: DashboardImprovementDiscipline;
  result: unknown;
  created_at: string;
};

export type DashboardMetricDelta = {
  direction: "improved" | "declined" | "unchanged";
  latestValue: number;
  comparisonValue: number;
  valueDelta: number;
  improvementValue: number;
  percentDelta: number;
  latestDate: string;
  comparisonDate: string;
  lowerIsBetter: boolean;
};

export type DashboardMetricImprovement = {
  testCount: number;
  latestVsPrevious: DashboardMetricDelta;
  latestVsFirst: DashboardMetricDelta;
};

export type DashboardImprovements = {
  swimCss: DashboardMetricImprovement | null;
  runCs: DashboardMetricImprovement | null;
  bikeFtp: DashboardMetricImprovement | null;
};

type ExtractedMetric = {
  value: number;
  createdAt: string;
};

export function buildDashboardImprovements(rows: DashboardImprovementAnalysisRow[]): DashboardImprovements {
  return {
    swimCss: buildMetricImprovement(extractMetrics(rows, "swim", "cssPace"), true),
    runCs: buildMetricImprovement(extractMetrics(rows, "run", "csPaceSecPerKm"), true),
    bikeFtp: buildMetricImprovement(extractMetrics(rows, "bike", "ftpWatt"), false),
  };
}

export function computeLowerIsBetterDelta(
  latest: ExtractedMetric,
  comparison: ExtractedMetric,
): DashboardMetricDelta {
  return computeDelta(latest, comparison, true);
}

export function computeHigherIsBetterDelta(
  latest: ExtractedMetric,
  comparison: ExtractedMetric,
): DashboardMetricDelta {
  return computeDelta(latest, comparison, false);
}

function buildMetricImprovement(metrics: ExtractedMetric[], lowerIsBetter: boolean): DashboardMetricImprovement | null {
  const sorted = metrics.toSorted((left, right) => new Date(left.createdAt).getTime() - new Date(right.createdAt).getTime());
  if (sorted.length < 2) return null;

  const first = sorted[0];
  const previous = sorted[sorted.length - 2];
  const latest = sorted[sorted.length - 1];
  if (!first || !previous || !latest) return null;

  return {
    testCount: sorted.length,
    latestVsPrevious: computeDelta(latest, previous, lowerIsBetter),
    latestVsFirst: computeDelta(latest, first, lowerIsBetter),
  };
}

function computeDelta(
  latest: ExtractedMetric,
  comparison: ExtractedMetric,
  lowerIsBetter: boolean,
): DashboardMetricDelta {
  const valueDelta = latest.value - comparison.value;
  const improvementValue = lowerIsBetter ? comparison.value - latest.value : valueDelta;
  const percentDelta = comparison.value === 0 ? 0 : (improvementValue / comparison.value) * 100;

  return {
    direction: improvementValue > 0 ? "improved" : improvementValue < 0 ? "declined" : "unchanged",
    latestValue: latest.value,
    comparisonValue: comparison.value,
    valueDelta,
    improvementValue,
    percentDelta,
    latestDate: latest.createdAt,
    comparisonDate: comparison.createdAt,
    lowerIsBetter,
  };
}

function extractMetrics(
  rows: DashboardImprovementAnalysisRow[],
  discipline: DashboardImprovementDiscipline,
  key: "cssPace" | "csPaceSecPerKm" | "ftpWatt",
) {
  return rows
    .filter((row) => row.discipline === discipline)
    .map((row) => ({ value: readNumericResultField(row.result, key), createdAt: row.created_at }))
    .filter((metric): metric is ExtractedMetric => metric.value !== null);
}

function readNumericResultField(result: unknown, key: "cssPace" | "csPaceSecPerKm" | "ftpWatt") {
  if (!result || typeof result !== "object") return null;
  const value = (result as Record<string, unknown>)[key];
  if (typeof value !== "number") return null;
  return Number.isFinite(value) && value > 0 ? value : null;
}