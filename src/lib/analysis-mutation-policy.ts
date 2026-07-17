export function shouldRefreshLatestAnalysis({
  analysisId,
  latestAnalysisId,
}: {
  analysisId?: string;
  latestAnalysisId?: string | null;
}) {
  return !analysisId || analysisId === latestAnalysisId;
}
