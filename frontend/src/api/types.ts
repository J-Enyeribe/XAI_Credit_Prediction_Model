/**
 * types.ts
 * ---------
 * Shared TypeScript interfaces for the XAI Credit Risk system.
 */

export interface SHAPFeature {
  feature: string;
  raw_feature: string;
  shap_value: number;
  feature_value: number | string | null;
  impact: "positive" | "negative";
}

export interface LocalExplanation {
  base_value: number;
  prediction_value: number;
  top_features: SHAPFeature[];
}

export interface PredictionResponse {
  prediction: "Good Credit" | "Bad Credit";
  probability: number;
  risk_score: number;
  threshold_used: number;
  explanation: LocalExplanation;
}

export interface WaterfallStep extends SHAPFeature {
  start: number;
  end: number;
}

export interface WaterfallResponse {
  base_value: number;
  final_value: number;
  steps: WaterfallStep[];
}

export interface CounterfactualSuggestion {
  feature: string;
  original_value: number | string;
  suggested_value: number | string;
  delta: number;
  action: string;
  impact: "high" | "medium" | "low";
}

export interface CounterfactualResponse {
  status: "success" | "already_at_target" | "max_iter_reached";
  original_probability: number;
  new_probability: number;
  probability_reduction: number;
  suggestions: CounterfactualSuggestion[];
}

export interface GlobalImportanceItem {
  feature: string;
  raw_feature: string;
  importance: number;
}

export interface GlobalImportanceResponse {
  global_importance: GlobalImportanceItem[];
}

export interface FairnessMetrics {
  disparate_impact: number;
  statistical_parity_difference: number;
  equal_opportunity_difference: number;
}

export interface FairnessThresholds {
  disparate_impact: { lower: number; upper: number };
  statistical_parity: { bound: number };
  equal_opportunity: { bound: number };
}

export interface FairnessAttributeResult {
  attribute: string;
  privileged_value: string;
  unprivileged_values: string[];
  group_sizes: { privileged: number; unprivileged: number };
  selection_rates: { privileged: number; unprivileged: number };
  true_positive_rates: { privileged: number; unprivileged: number };
  metrics: FairnessMetrics;
  thresholds: FairnessThresholds;
  status: "FAIR" | "WARNING" | "BIASED" | "CRITICAL" | "ERROR";
  recommendation: string;
}

export interface FullFairnessReport {
  overall_status: "FAIR" | "WARNING" | "BIASED" | "CRITICAL";
  results: FairnessAttributeResult[];
  summary: {
    mean_disparate_impact: number;
    min_disparate_impact: number;
    max_abs_statistical_parity: number;
    max_abs_equal_opportunity: number;
    attributes_audited: number;
    attributes_flagged: number;
  };
}

export interface ModelInfo {
  model: string;
  auc: number;
  recall: number;
  precision: number;
  f1: number;
  optimal_threshold: number;
  rationale: string;
  features: string[];
}

export type LoanApplication = {
  Age: number;
  Income: number;
  LoanAmount: number;
  CreditScore: number;
  MonthsEmployed: number;
  NumCreditLines: number;
  InterestRate: number;
  LoanTerm: number;
  DTIRatio: number;
  Education: string;
  EmploymentType: string;
  MaritalStatus: string;
  HasMortgage: string;
  HasDependents: string;
  LoanPurpose: string;
  HasCoSigner: string;
};

export interface XAIBundle {
  prediction: PredictionResponse;
  waterfall: WaterfallResponse | null;
  counterfactual: CounterfactualResponse | null;
}
