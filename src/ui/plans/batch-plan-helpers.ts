import type { BatchPlanPreviewItem } from "../app-types.js";

const TASK_LINE_PATTERN = /^\s*(\d+)\s*[.、,，:：)）]\s*(.+?)\s*$/;

export function parseBatchPlanInput(rawText: string): BatchPlanPreviewItem[] {
  const lines = rawText.split(/\r?\n/);
  const plans: BatchPlanPreviewItem[] = [];
  let currentCategory = "";

  lines.forEach((line, index) => {
    const trimmed = line.trim();
    if (!trimmed) {
      return;
    }

    const taskMatch = TASK_LINE_PATTERN.exec(trimmed);
    if (taskMatch) {
      const title = taskMatch[2].trim();
      if (!title) {
        return;
      }

      plans.push({
        id: `batch-plan-${index}-${plans.length}`,
        category: currentCategory || "未分类",
        title,
        lineNumber: index + 1,
      });
      return;
    }

    currentCategory = trimmed.replace(/[：:]$/, "");
  });

  return plans;
}

export function resolveBatchDurationMinutes(value: string): number | null {
  const minutes = Math.round(Number(value));
  return Number.isFinite(minutes) && minutes > 0 ? minutes : null;
}

export function resolveBatchCustomStars(value: string): number | null {
  const stars = Math.round(Number(value));
  return Number.isInteger(stars) && stars > 0 ? stars : null;
}

export function estimatePlanStars(minutes: number): number {
  return Math.max(1, Math.round(minutes / 10));
}
