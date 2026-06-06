"""
shap_manager.py
---------------
Dedicated SHAP engine for the Logistic Regression champion model.

Uses shap.LinearExplainer which produces *exact* Shapley values for linear
models — no approximation, no sampling. This is a key regulatory advantage
over TreeExplainer: the same feature change always produces the same SHAP
delta, making explanations auditable and consistent.
"""

import numpy as np
import pandas as pd
import shap
import joblib
import os
from typing import Dict, List, Any, Tuple


# Features that must never appear in counterfactual suggestions.
# These are either immutable (Age) or legally protected attributes
# that must not be flagged as "things to change" in a credit decision.
NON_ACTIONABLE_FEATURES = {
    "Age",
    "MaritalStatus",
    "Education",          # Arguable but included for regulatory safety
}


class SHAPManager:
    """
    Wraps shap.LinearExplainer to provide global and local explanations
    for the Logistic Regression credit risk model.
    """

    def __init__(self, model, preprocessor, X_background: pd.DataFrame):
        """
        Args:
            model:        Fitted LogisticRegression instance.
            preprocessor: Fitted ColumnTransformer (sklearn pipeline).
            X_background: Raw (unprocessed) training data used to build
                          the SHAP background distribution. A sample of
                          200–500 rows is sufficient and recommended.
        """
        self.model = model
        self.preprocessor = preprocessor
        self.feature_names: List[str] = list(
            preprocessor.get_feature_names_out()
        )

        # Process background data once and store
        X_bg_processed = preprocessor.transform(X_background)
        # LinearExplainer uses the mean of background as the reference point
        self.explainer = shap.LinearExplainer(
            model, X_bg_processed, feature_perturbation="interventional"
        )
        self._base_value: float = float(self.explainer.expected_value)

    # ------------------------------------------------------------------
    # Public API
    # ------------------------------------------------------------------

    def explain_local(
        self, input_df: pd.DataFrame, top_n: int = 10
    ) -> Dict[str, Any]:
        """
        Generate a local (per-prediction) SHAP explanation.

        Args:
            input_df: Single-row raw DataFrame matching the training schema.
            top_n:    Number of top features to return (by |SHAP value|).

        Returns:
            {
                "base_value": float,          # E[f(x)] — average model output
                "prediction_value": float,    # f(x) — this prediction's output
                "top_features": [
                    {
                        "feature": str,
                        "raw_feature": str,   # original column name (pre-OHE)
                        "shap_value": float,  # contribution to log-odds
                        "feature_value": any, # original input value
                        "impact": "positive" | "negative"
                    }, ...
                ]
            }
        """
        processed = self.preprocessor.transform(input_df)
        shap_values = self.explainer.shap_values(processed)[0]  # shape: (n_features,)

        prediction_value = float(
            self.model.predict_proba(processed)[0][1]
        )

        # Build feature-value lookup from original input
        raw_values = input_df.iloc[0].to_dict()

        # Map processed feature names back to raw column names
        features = []
        for idx, (fname, sval) in enumerate(
            zip(self.feature_names, shap_values)
        ):
            raw_name = self._raw_feature_name(fname)
            raw_val = raw_values.get(raw_name, None)
            features.append(
                {
                    "feature": fname,
                    "raw_feature": raw_name,
                    "shap_value": float(sval),
                    "feature_value": raw_val,
                    "impact": "positive" if sval > 0 else "negative",
                }
            )

        # Sort by absolute SHAP value descending
        features.sort(key=lambda x: abs(x["shap_value"]), reverse=True)

        return {
            "base_value": self._base_value,
            "prediction_value": prediction_value,
            "top_features": features[:top_n],
        }

    def explain_global(
        self, X_sample: pd.DataFrame, top_n: int = 15
    ) -> List[Dict[str, Any]]:
        """
        Compute global feature importance as mean |SHAP| over a sample.

        Args:
            X_sample: Raw DataFrame sample (100–500 rows recommended).
            top_n:    Number of top features to return.

        Returns:
            List of {"feature": str, "raw_feature": str, "importance": float}
            sorted descending by importance.
        """
        processed = self.preprocessor.transform(X_sample)
        shap_values = self.explainer.shap_values(processed)  # shape: (n_rows, n_features)

        mean_abs = np.abs(shap_values).mean(axis=0)

        importance = [
            {
                "feature": fname,
                "raw_feature": self._raw_feature_name(fname),
                "importance": float(val),
            }
            for fname, val in zip(self.feature_names, mean_abs)
        ]
        importance.sort(key=lambda x: x["importance"], reverse=True)
        return importance[:top_n]

    def waterfall_data(self, input_df: pd.DataFrame) -> Dict[str, Any]:
        """
        Returns all data needed to render a SHAP waterfall chart.
        Includes cumulative values for step-by-step rendering.
        """
        explanation = self.explain_local(input_df, top_n=len(self.feature_names))
        features = explanation["top_features"]
        base = explanation["base_value"]

        # Build cumulative waterfall steps
        steps = []
        running = base
        for f in features:
            start = running
            running += f["shap_value"]
            steps.append(
                {
                    **f,
                    "start": float(start),
                    "end": float(running),
                }
            )

        return {
            "base_value": base,
            "final_value": explanation["prediction_value"],
            "steps": steps,
        }

    # ------------------------------------------------------------------
    # Helpers
    # ------------------------------------------------------------------

    def _raw_feature_name(self, processed_name: str) -> str:
        """
        Maps a processed feature name back to the original column name.
        e.g. "cat__EmploymentType_Full-time" -> "EmploymentType"
             "num__CreditScore"              -> "CreditScore"
        """
        # Strip sklearn ColumnTransformer prefix
        if "__" in processed_name:
            without_prefix = processed_name.split("__", 1)[1]
        else:
            without_prefix = processed_name

        # Strip OneHotEncoder suffix (e.g. "_Full-time")
        # The raw column name is everything before the first underscore
        # that is followed by a known category value.
        # Simple heuristic: return the part that matches a known raw column.
        parts = without_prefix.split("_")
        for i in range(len(parts), 0, -1):
            candidate = "_".join(parts[:i])
            if candidate in {
                "Age", "Income", "LoanAmount", "CreditScore",
                "MonthsEmployed", "NumCreditLines", "InterestRate",
                "LoanTerm", "DTIRatio", "LoanToIncome", "MonthlyPayment",
                "PaymentToIncome", "RateRiskScore", "CreditUtilProxy",
                "EmploymentStability", "CreditAgeProxy",
                "Education", "EmploymentType", "MaritalStatus",
                "HasMortgage", "HasDependents", "LoanPurpose", "HasCoSigner",
            }:
                return candidate
        return without_prefix


def load_shap_manager(model_dir: str, raw_data_path: str) -> SHAPManager:
    """
    Convenience factory: loads saved model + preprocessor and builds
    a SHAPManager using a sample of the raw dataset as background.
    """
    model = joblib.load(os.path.join(model_dir, "best_model_logisticregression.joblib"))
    preprocessor = joblib.load(os.path.join(model_dir, "preprocessor.joblib"))

    raw_df = pd.read_csv(raw_data_path)
    X_raw = raw_df.drop(columns=["Default"])
    if "LoanID" in X_raw.columns:
        X_raw = X_raw.drop(columns=["LoanID"])

    # 300-row background sample is sufficient for LinearExplainer
    background = X_raw.sample(300, random_state=42)
    return SHAPManager(model, preprocessor, background)
