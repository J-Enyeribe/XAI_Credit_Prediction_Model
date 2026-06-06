"""
counterfactuals.py
------------------
Generates actionable "what-if" counterfactual explanations for denied
loan applications.

Key design decisions:
  - FIXED_FEATURES: immutable attributes (age, marital status, etc.) are
    never perturbed. This is both ethically required and legally safer.
  - Works in the *original feature space* where possible to produce
    human-readable suggestions (e.g. "increase CreditScore by 45 points")
    rather than opaque scaled deltas.
  - Uses SHAP values to guide perturbation direction — we move the highest-
    impact *actionable* features first.
"""

import numpy as np
import pandas as pd
from typing import List, Dict, Any, Optional


# Features that must never be suggested as changes.
# Age: immutable. MaritalStatus / Education: protected / arguable.
# HasDependents: immutable in the context of a loan application.
FIXED_FEATURES = {
    "Age",
    "MaritalStatus",
    "HasDependents",
    "Education",
}

# Categorical features — we won't perturb these in the greedy search
# (direction of change is not meaningful for unordered categories).
CATEGORICAL_FEATURES = {
    "Education", "EmploymentType", "MaritalStatus",
    "HasMortgage", "HasDependents", "LoanPurpose", "HasCoSigner",
}

# Numerical features and their realistic step sizes (in original units)
# Used to make suggestions feel concrete rather than arbitrary.
FEATURE_STEPS = {
    "CreditScore":         5.0,
    "Income":              500.0,
    "LoanAmount":          1000.0,
    "DTIRatio":            0.01,
    "InterestRate":        0.25,
    "MonthsEmployed":      3.0,
    "NumCreditLines":      1.0,
    "LoanTerm":            6.0,
    "LoanToIncome":        0.05,
    "MonthlyPayment":      50.0,
    "PaymentToIncome":     0.01,
    "RateRiskScore":       0.1,
    "CreditUtilProxy":     0.05,
    "EmploymentStability": 0.01,
    "CreditAgeProxy":      0.1,
}

# Human-readable action templates
ACTION_TEMPLATES = {
    "CreditScore":    lambda d: f"{'Increase' if d > 0 else 'Decrease'} credit score by {abs(d):.0f} points",
    "Income":         lambda d: f"{'Increase' if d > 0 else 'Decrease'} annual income by ${abs(d):,.0f}",
    "LoanAmount":     lambda d: f"{'Increase' if d > 0 else 'Decrease'} loan amount by ${abs(d):,.0f}",
    "DTIRatio":       lambda d: f"{'Reduce' if d < 0 else 'Increase'} debt-to-income ratio by {abs(d):.2f}",
    "InterestRate":   lambda d: f"{'Negotiate' if d < 0 else 'Accept'} interest rate change of {abs(d):.2f}%",
    "MonthsEmployed": lambda d: f"Maintain employment for {abs(d):.0f} more months",
    "LoanTerm":       lambda d: f"{'Extend' if d > 0 else 'Shorten'} loan term by {abs(d):.0f} months",
}


class CounterfactualEngine:
    def __init__(self, model, preprocessor, explainer=None):
        self.model = model
        self.preprocessor = preprocessor
        self.explainer = explainer  # Optional: used for SHAP-guided search

    def generate_counterfactual(
        self,
        input_df: pd.DataFrame,
        target_class: int = 0,
        max_iter: int = 200,
        n_suggestions: int = 5,
    ) -> Dict[str, Any]:
        """
        Generate actionable suggestions to flip a denied application to approved.

        Args:
            input_df:      Single-row raw DataFrame (original feature space).
            target_class:  0 = Good Credit (the desired outcome for denied apps).
            max_iter:      Max greedy perturbation steps.
            n_suggestions: Number of actionable changes to return.

        Returns:
            {
                "status": "success" | "already_at_target" | "max_iter_reached",
                "original_probability": float,
                "new_probability": float,
                "probability_reduction": float,
                "suggestions": [
                    {
                        "feature": str,
                        "original_value": float | str,
                        "suggested_value": float | str,
                        "delta": float,
                        "action": str,        # human-readable instruction
                        "impact": "high" | "medium" | "low"
                    }, ...
                ]
            }
        """
        processed = self.preprocessor.transform(input_df)
        original_prob = float(self.model.predict_proba(processed)[0][1])

        threshold = 0.5  # Standard decision boundary

        if (target_class == 0 and original_prob < threshold) or \
           (target_class == 1 and original_prob >= threshold):
            return {
                "status": "already_at_target",
                "original_probability": original_prob,
                "new_probability": original_prob,
                "probability_reduction": 0.0,
                "suggestions": [],
            }

        # Work in original (raw) feature space for interpretability
        cf_raw = input_df.copy()
        feature_names = list(preprocessor_feature_names(self.preprocessor))
        actionable_features = self._get_actionable_numerical_features(input_df)

        # Track what we've changed
        changes: Dict[str, float] = {}

        # Get SHAP-guided feature order if explainer is available
        feature_order = self._get_feature_order(
            processed, actionable_features, target_class
        )

        current_prob = original_prob
        for iteration in range(max_iter):
            if (target_class == 0 and current_prob < threshold) or \
               (target_class == 1 and current_prob >= threshold):
                break

            # Cycle through actionable features
            feat = feature_order[iteration % len(feature_order)]
            if feat not in cf_raw.columns:
                continue

            step = FEATURE_STEPS.get(feat, 0.1)
            direction = self._get_direction(feat, target_class)

            original_val = float(cf_raw[feat].iloc[0])
            new_val = original_val + direction * step
            cf_raw[feat] = new_val

            # Recalculate engineered features that depend on this one
            cf_raw = self._recalculate_derived_features(cf_raw)

            cf_processed = self.preprocessor.transform(cf_raw)
            current_prob = float(self.model.predict_proba(cf_processed)[0][1])

            delta = new_val - original_val if feat not in changes else \
                    new_val - float(input_df[feat].iloc[0])
            changes[feat] = float(cf_raw[feat].iloc[0]) - float(input_df[feat].iloc[0])

        # Build suggestions from accumulated changes
        suggestions = self._build_suggestions(input_df, cf_raw, changes)

        success = (target_class == 0 and current_prob < threshold) or \
                  (target_class == 1 and current_prob >= threshold)

        return {
            "status": "success" if success else "max_iter_reached",
            "original_probability": original_prob,
            "new_probability": current_prob,
            "probability_reduction": original_prob - current_prob,
            "suggestions": suggestions[:n_suggestions],
        }

    # ------------------------------------------------------------------
    # Private helpers
    # ------------------------------------------------------------------

    def _get_actionable_numerical_features(self, input_df: pd.DataFrame) -> List[str]:
        """Returns numerical features that are not fixed."""
        num_cols = input_df.select_dtypes(include=["int64", "float64"]).columns
        return [
            c for c in num_cols
            if c not in FIXED_FEATURES and c not in CATEGORICAL_FEATURES
        ]

    def _get_feature_order(
        self,
        processed_input: np.ndarray,
        actionable_features: List[str],
        target_class: int,
    ) -> List[str]:
        """
        If a SHAP explainer is available, order features by |SHAP value|
        (highest impact first). Otherwise fall back to the default list.
        """
        if self.explainer is None:
            return actionable_features

        try:
            shap_values = self.explainer.shap_values(processed_input)
            if isinstance(shap_values, list):
                sv = shap_values[1][0]
            elif len(shap_values.shape) == 3:
                sv = shap_values[0, :, 1]
            else:
                sv = shap_values[0]

            feature_names = self.preprocessor.get_feature_names_out()
            # Map SHAP values back to raw feature names and filter actionable
            shap_by_raw: Dict[str, float] = {}
            for fname, sval in zip(feature_names, sv):
                raw = _raw_feature_name(fname)
                if raw in actionable_features:
                    shap_by_raw[raw] = shap_by_raw.get(raw, 0) + abs(float(sval))

            ordered = sorted(shap_by_raw, key=shap_by_raw.get, reverse=True)
            # Append any actionable features not in SHAP output
            for f in actionable_features:
                if f not in ordered:
                    ordered.append(f)
            return ordered
        except Exception:
            return actionable_features

    def _get_direction(self, feature: str, target_class: int) -> float:
        """
        Returns +1 or -1 indicating which direction to perturb this feature
        to move toward target_class == 0 (Good Credit / lower default prob).
        
        Credit-domain knowledge:
          - Higher CreditScore → lower default risk → direction -1 for prob
          - Higher DTIRatio    → higher default risk → direction +1 pushes prob up
        So to *reduce* default probability (target 0):
          - CreditScore: increase (+1)
          - DTIRatio: decrease (-1)
          - Income: increase (+1)
          - LoanAmount: decrease (-1)
        """
        # Features where increasing reduces default probability
        increase_to_approve = {
            "CreditScore", "Income", "MonthsEmployed",
            "EmploymentStability", "CreditAgeProxy",
        }
        # Features where decreasing reduces default probability
        decrease_to_approve = {
            "DTIRatio", "LoanAmount", "InterestRate",
            "RateRiskScore", "CreditUtilProxy",
            "LoanToIncome", "PaymentToIncome", "MonthlyPayment",
        }

        if target_class == 0:  # Want to reduce default probability
            if feature in increase_to_approve:
                return 1.0
            elif feature in decrease_to_approve:
                return -1.0
            else:
                return 1.0  # Safe default
        else:
            if feature in increase_to_approve:
                return -1.0
            elif feature in decrease_to_approve:
                return 1.0
            else:
                return -1.0

    def _recalculate_derived_features(self, df: pd.DataFrame) -> pd.DataFrame:
        """Keeps engineered features consistent after perturbation."""
        df = df.copy()
        if "LoanAmount" in df.columns and "Income" in df.columns:
            df["LoanToIncome"] = df["LoanAmount"] / (df["Income"] + 1)
        if "LoanAmount" in df.columns and "LoanTerm" in df.columns:
            df["MonthlyPayment"] = df["LoanAmount"] / (df["LoanTerm"] + 1)
        if "MonthlyPayment" in df.columns and "Income" in df.columns:
            df["PaymentToIncome"] = df["MonthlyPayment"] / (df["Income"] / 12 + 1)
        if "InterestRate" in df.columns and "DTIRatio" in df.columns:
            df["RateRiskScore"] = df["InterestRate"] * df["DTIRatio"]
        if "DTIRatio" in df.columns and "CreditScore" in df.columns:
            df["CreditUtilProxy"] = df["DTIRatio"] / (df["CreditScore"] / 850 + 1e-5)
        if "MonthsEmployed" in df.columns and "Age" in df.columns:
            df["EmploymentStability"] = df["MonthsEmployed"] / (df["Age"] * 12)
        if "NumCreditLines" in df.columns and "Age" in df.columns:
            df["CreditAgeProxy"] = df["NumCreditLines"] / (df["Age"] - 18 + 1)
        return df

    def _build_suggestions(
        self,
        original_df: pd.DataFrame,
        cf_df: pd.DataFrame,
        changes: Dict[str, float],
    ) -> List[Dict[str, Any]]:
        """Converts raw changes dict to human-readable suggestion objects."""
        suggestions = []
        for feat, delta in sorted(changes.items(), key=lambda x: abs(x[1]), reverse=True):
            if abs(delta) < 1e-6:
                continue

            original_val = float(original_df[feat].iloc[0])
            suggested_val = float(cf_df[feat].iloc[0])

            # Human-readable action
            template = ACTION_TEMPLATES.get(feat)
            action = template(delta) if template else \
                     f"{'Increase' if delta > 0 else 'Decrease'} {feat} by {abs(delta):.2f}"

            # Impact tier by |delta| relative to step size
            step = FEATURE_STEPS.get(feat, 1.0)
            n_steps = abs(delta) / step
            impact = "high" if n_steps >= 10 else "medium" if n_steps >= 3 else "low"

            suggestions.append({
                "feature": feat,
                "original_value": round(original_val, 4),
                "suggested_value": round(suggested_val, 4),
                "delta": round(delta, 4),
                "action": action,
                "impact": impact,
            })

        return suggestions


# ------------------------------------------------------------------
# Module-level helpers
# ------------------------------------------------------------------

def preprocessor_feature_names(preprocessor) -> List[str]:
    """Safe wrapper around get_feature_names_out."""
    return list(preprocessor.get_feature_names_out())


def _raw_feature_name(processed_name: str) -> str:
    """Strip sklearn prefix and OHE suffix to get raw column name."""
    known = {
        "Age", "Income", "LoanAmount", "CreditScore", "MonthsEmployed",
        "NumCreditLines", "InterestRate", "LoanTerm", "DTIRatio",
        "LoanToIncome", "MonthlyPayment", "PaymentToIncome", "RateRiskScore",
        "CreditUtilProxy", "EmploymentStability", "CreditAgeProxy",
        "Education", "EmploymentType", "MaritalStatus",
        "HasMortgage", "HasDependents", "LoanPurpose", "HasCoSigner",
    }
    without_prefix = processed_name.split("__", 1)[-1]
    parts = without_prefix.split("_")
    for i in range(len(parts), 0, -1):
        candidate = "_".join(parts[:i])
        if candidate in known:
            return candidate
    return without_prefix
