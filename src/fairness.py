"""
fairness.py
-----------
Fairness audit module for the XAI Credit Risk system.

Implements three standard fairness metrics:
  1. Disparate Impact (DI)          — ratio of selection rates
  2. Statistical Parity Difference  — difference in selection rates  
  3. Equal Opportunity Difference   — difference in true positive rates

Regulatory context:
  - DI < 0.8 triggers the "80% rule" (US EEOC / CFPB guideline).
  - DI > 1.25 indicates reverse discrimination.
  - Equal Opportunity Difference > ±0.1 is the common academic threshold.
"""

import pandas as pd
import numpy as np
from typing import Dict, Any, List, Tuple, Optional


# Fairness thresholds (industry standard)
DI_LOWER = 0.80       # Below this: biased against unprivileged group
DI_UPPER = 1.25       # Above this: biased against privileged group
EOD_THRESHOLD = 0.10  # |Equal Opportunity Difference| above this = warning
SPD_THRESHOLD = 0.10  # |Statistical Parity Difference| above this = warning


class FairnessAuditor:
    """
    Audits a credit risk model for discrimination across protected attributes.

    Initialised with the raw (unprocessed) test set so that protected
    attribute values are human-readable (e.g. "Married", "Male") rather
    than one-hot-encoded columns.
    """

    def __init__(self, model, preprocessor, X_test: pd.DataFrame, y_test: pd.Series):
        """
        Args:
            model:        Fitted model with predict() and predict_proba().
            preprocessor: Fitted ColumnTransformer.
            X_test:       Raw (unprocessed) test features.
            y_test:       True labels (1 = Default / Bad Credit).
        """
        self.model = model
        self.preprocessor = preprocessor
        self.X_test = X_test.reset_index(drop=True)
        self.y_test = y_test.reset_index(drop=True)

        # Generate predictions once — reused across all audit calls
        processed = preprocessor.transform(X_test)
        self._predictions = self.model.predict(processed)
        self._probabilities = self.model.predict_proba(processed)[:, 1]

        # Positive outcome = "Good Credit" (label 0, i.e. no default)
        self._positive_outcome = 0

    # ------------------------------------------------------------------
    # Public API
    # ------------------------------------------------------------------

    def audit_attribute(
        self, attribute_name: str, privileged_value: Any
    ) -> Dict[str, Any]:
        """
        Full fairness audit for a single protected attribute.

        Args:
            attribute_name:   Column name in X_test (e.g. "MaritalStatus").
            privileged_value: Value considered the privileged group (e.g. "Married").

        Returns:
            Structured fairness report dict (matches FairnessReport interface).
        """
        if attribute_name not in self.X_test.columns:
            raise ValueError(
                f"Attribute '{attribute_name}' not found. "
                f"Available: {self.X_test.columns.tolist()}"
            )

        priv_mask = self.X_test[attribute_name] == privileged_value
        unpriv_mask = ~priv_mask

        if priv_mask.sum() == 0:
            raise ValueError(f"No rows found with {attribute_name} == {privileged_value}")
        if unpriv_mask.sum() == 0:
            raise ValueError(f"No rows found with {attribute_name} != {privileged_value}")

        # Selection rates (proportion receiving positive outcome = Good Credit)
        pr_priv = self._selection_rate(priv_mask)
        pr_unpriv = self._selection_rate(unpriv_mask)

        # True Positive Rates (for Equal Opportunity)
        tpr_priv = self._true_positive_rate(priv_mask)
        tpr_unpriv = self._true_positive_rate(unpriv_mask)

        # Metrics
        disparate_impact = pr_unpriv / pr_priv if pr_priv > 0 else 0.0
        statistical_parity = pr_unpriv - pr_priv
        equal_opportunity_diff = tpr_unpriv - tpr_priv

        # Overall status (worst of any metric)
        status = self._determine_status(
            disparate_impact, statistical_parity, equal_opportunity_diff
        )

        # Group-level breakdown
        unprivileged_values = self.X_test.loc[
            unpriv_mask, attribute_name
        ].unique().tolist()

        return {
            "attribute": attribute_name,
            "privileged_value": privileged_value,
            "unprivileged_values": unprivileged_values,
            "group_sizes": {
                "privileged": int(priv_mask.sum()),
                "unprivileged": int(unpriv_mask.sum()),
            },
            "selection_rates": {
                "privileged": round(float(pr_priv), 4),
                "unprivileged": round(float(pr_unpriv), 4),
            },
            "true_positive_rates": {
                "privileged": round(float(tpr_priv), 4),
                "unprivileged": round(float(tpr_unpriv), 4),
            },
            "metrics": {
                "disparate_impact": round(float(disparate_impact), 4),
                "statistical_parity_difference": round(float(statistical_parity), 4),
                "equal_opportunity_difference": round(float(equal_opportunity_diff), 4),
            },
            "thresholds": {
                "disparate_impact": {"lower": DI_LOWER, "upper": DI_UPPER},
                "statistical_parity": {"bound": SPD_THRESHOLD},
                "equal_opportunity": {"bound": EOD_THRESHOLD},
            },
            "status": status,
            "recommendation": self._recommendation(status, attribute_name),
        }

    def run_full_audit(
        self, attributes: List[Tuple[str, Any]]
    ) -> Dict[str, Any]:
        """
        Run audit across multiple protected attributes and return a summary.

        Args:
            attributes: List of (attribute_name, privileged_value) tuples.
                        Example: [("MaritalStatus", "Married"),
                                  ("Education", "Bachelor's")]

        Returns:
            {
                "overall_status": "FAIR" | "WARNING" | "BIASED" | "CRITICAL",
                "results": [per-attribute audit dicts],
                "summary": {metric aggregates}
            }
        """
        results = []
        for attr, priv_val in attributes:
            try:
                results.append(self.audit_attribute(attr, priv_val))
            except Exception as e:
                results.append({
                    "attribute": attr,
                    "error": str(e),
                    "status": "ERROR"
                })

        statuses = [r.get("status", "ERROR") for r in results]
        priority = ["CRITICAL", "BIASED", "WARNING", "FAIR", "ERROR"]
        overall = next(
            (s for s in priority if s in statuses), "FAIR"
        )

        return {
            "overall_status": overall,
            "results": results,
            "summary": self._aggregate_summary(results),
        }

    # ------------------------------------------------------------------
    # Private helpers
    # ------------------------------------------------------------------

    def _selection_rate(self, mask: pd.Series) -> float:
        """Proportion of group receiving positive outcome (Good Credit)."""
        group_preds = self._predictions[mask]
        return float(np.mean(group_preds == self._positive_outcome))

    def _true_positive_rate(self, mask: pd.Series) -> float:
        """
        TPR = P(predicted Good Credit | actually Good Credit) for the group.
        'Actually Good Credit' = y_test == 0 (no default).
        """
        group_true = self.y_test[mask]
        group_pred = self._predictions[mask]

        # Among those who truly have good credit (label 0)
        truly_good = group_true == 0
        if truly_good.sum() == 0:
            return 0.0
        correctly_predicted = (group_pred[truly_good] == 0)
        return float(correctly_predicted.mean())

    def _determine_status(
        self,
        disparate_impact: float,
        statistical_parity: float,
        equal_opportunity_diff: float,
    ) -> str:
        if disparate_impact < 0.5:
            return "CRITICAL"
        if disparate_impact < DI_LOWER or disparate_impact > DI_UPPER:
            return "BIASED"
        if abs(statistical_parity) > SPD_THRESHOLD or \
           abs(equal_opportunity_diff) > EOD_THRESHOLD:
            return "WARNING"
        return "FAIR"

    def _recommendation(self, status: str, attribute: str) -> str:
        recommendations = {
            "CRITICAL": (
                f"URGENT: The model shows severe discrimination against the unprivileged "
                f"'{attribute}' group. Immediate review and retraining with fairness "
                f"constraints (e.g. reweighing, adversarial debiasing) is required "
                f"before deployment."
            ),
            "BIASED": (
                f"The model fails the 80% rule for '{attribute}'. Consider applying "
                f"pre-processing mitigation (reweighing training samples) or "
                f"post-processing threshold adjustment per group."
            ),
            "WARNING": (
                f"Mild disparity detected for '{attribute}'. Monitor in production. "
                f"Consider collecting more representative training data for the "
                f"unprivileged group."
            ),
            "FAIR": (
                f"No significant bias detected for '{attribute}'. "
                f"Continue monitoring as the data distribution may shift over time."
            ),
        }
        return recommendations.get(status, "Review required.")

    def _aggregate_summary(self, results: List[Dict]) -> Dict[str, Any]:
        valid = [r for r in results if "error" not in r]
        if not valid:
            return {}
        di_values = [r["metrics"]["disparate_impact"] for r in valid]
        spd_values = [r["metrics"]["statistical_parity_difference"] for r in valid]
        eod_values = [r["metrics"]["equal_opportunity_difference"] for r in valid]
        return {
            "mean_disparate_impact": round(float(np.mean(di_values)), 4),
            "min_disparate_impact": round(float(np.min(di_values)), 4),
            "max_abs_statistical_parity": round(float(np.max(np.abs(spd_values))), 4),
            "max_abs_equal_opportunity": round(float(np.max(np.abs(eod_values))), 4),
            "attributes_audited": len(valid),
            "attributes_flagged": sum(
                1 for r in valid if r["status"] in ("BIASED", "CRITICAL", "WARNING")
            ),
        }
