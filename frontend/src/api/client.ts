/**
 * client.ts
 * ---------
 * Typed API client for the XAI Credit Risk backend.
 * All XAI data is fetched asynchronously after the initial prediction
 * to avoid blocking the main UI.
 */

import * as Types from './types';

const BASE_URL = import.meta.env.VITE_API_URL ?? "http://localhost:8000";

// Re-export types for backward compatibility
export * from './types';

// ------------------------------------------------------------------
// Internal fetch helper
// ------------------------------------------------------------------

async function apiFetch<T>(
  path: string,
  options?: RequestInit
): Promise<T> {
  const res = await fetch(`${BASE_URL}${path}`, {
    headers: { "Content-Type": "application/json" },
    ...options,
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({ detail: res.statusText }));
    throw new Error(err.detail ?? `API error ${res.status}`);
  }
  return res.json() as Promise<T>;
}

// ------------------------------------------------------------------
// Public API methods
// ------------------------------------------------------------------

/**
 * Score a loan application and get a local SHAP explanation.
 */
export async function predict(
  application: Types.LoanApplication
): Promise<Types.PredictionResponse> {
  return apiFetch<Types.PredictionResponse>("/predict", {
    method: "POST",
    body: JSON.stringify(application),
  });
}

/**
 * Fetch waterfall chart data for a prediction.
 */
export async function getWaterfall(
  application: Types.LoanApplication
): Promise<Types.WaterfallResponse> {
  return apiFetch<Types.WaterfallResponse>("/predict/waterfall", {
    method: "POST",
    body: JSON.stringify(application),
  });
}

/**
 * Fetch actionable counterfactual suggestions for a denied application.
 */
export async function getCounterfactual(
  application: Types.LoanApplication
): Promise<Types.CounterfactualResponse> {
  return apiFetch<Types.CounterfactualResponse>("/predict/counterfactual", {
    method: "POST",
    body: JSON.stringify(application),
  });
}

/**
 * Fetch pre-computed global feature importance.
 */
export async function getGlobalImportance(): Promise<Types.GlobalImportanceResponse> {
  return apiFetch<Types.GlobalImportanceResponse>("/explain/global");
}

/**
 * Single-attribute fairness audit.
 */
export async function auditFairness(
  attribute: string,
  privilegedValue: string
): Promise<Types.FairnessAttributeResult> {
  const params = new URLSearchParams({
    attribute,
    privileged_value: privilegedValue,
  });
  return apiFetch<Types.FairnessAttributeResult>(`/audit/fairness?${params}`);
}

/**
 * Full fairness audit across all protected attributes.
 */
export async function getFullFairnessReport(): Promise<Types.FullFairnessReport> {
  return apiFetch<Types.FullFairnessReport>("/audit/fairness/full");
}

/**
 * Model metadata — useful for the "About this model" section.
 */
export async function getModelInfo(): Promise<Types.ModelInfo> {
  return apiFetch<Types.ModelInfo>("/model-info");
}

// ------------------------------------------------------------------
// Composite helper — fetch all XAI data for a denied application
// ------------------------------------------------------------------

export async function predictWithXAI(
  application: Types.LoanApplication
): Promise<Types.XAIBundle> {
  const prediction = await predict(application);
  const isDenied = prediction.prediction === "Bad Credit";

  const [waterfall, counterfactual] = await Promise.allSettled([
    getWaterfall(application),
    isDenied ? getCounterfactual(application) : Promise.resolve(null),
  ]);

  return {
    prediction,
    waterfall: waterfall.status === "fulfilled" ? waterfall.value : null,
    counterfactual: counterfactual.status === "fulfilled" ? counterfactual.value : null,
  };
}
