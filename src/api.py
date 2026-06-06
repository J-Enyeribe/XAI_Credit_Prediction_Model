"""
api.py
------
FastAPI backend for the XAI Credit Risk Scoring system.

Champion model: Logistic Regression (AUC 0.7616, Recall 0.6975)
Chosen for interpretability and regulatory defensibility over marginal
AUC gains from tree ensembles.

XAI Endpoints:
  POST /predict                   — score + local SHAP explanation
  POST /predict/counterfactual    — actionable suggestions for denied apps
  GET  /explain/global            — global feature importance (mean |SHAP|)
  GET  /audit/fairness            — single-attribute fairness audit
  GET  /audit/fairness/full       — full audit across all protected attributes
  GET  /model-info                — model metadata
  GET  /health                    — liveness probe
"""

from fastapi import FastAPI, HTTPException, Query
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field
import joblib
import numpy as np
import pandas as pd
from typing import List, Dict, Any, Optional
import os
from sklearn.model_selection import train_test_split

from src.config import Config
from src.counterfactuals import CounterfactualEngine
from src.fairness import FairnessAuditor
from src.explainability.shap_manager import SHAPManager

app = FastAPI(
    title="XAI Credit Risk Scoring API",
    description="Explainable AI credit risk system — Logistic Regression champion",
    version="2.0.0",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=Config.CORS_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ------------------------------------------------------------------
# Startup — load all artefacts once
# ------------------------------------------------------------------
 
try:
    preprocessor = joblib.load(Config.get_preprocessor_path())
    
    # Load clipping bounds for OOD protection
    clipping_bounds_path = os.path.join(Config.MODEL_DIR, "clipping_bounds.joblib")
    clipping_bounds = joblib.load(clipping_bounds_path) if os.path.exists(clipping_bounds_path) else {}
 
    # Always load the Logistic Regression champion
    model_path = os.path.join(Config.MODEL_DIR, "best_model_logisticregression.joblib")
    if not os.path.exists(model_path):
        # Fallback: any available model
        model_files = sorted(
            [f for f in os.listdir(Config.MODEL_DIR) if f.startswith("best_model_")],
            key=lambda x: os.path.getmtime(os.path.join(Config.MODEL_DIR, x)),
            reverse=True,
        )
        model_path = os.path.join(Config.MODEL_DIR, model_files[0])
 
    model = joblib.load(model_path)
 
    # Load raw data for background distribution and fairness test set
    raw_data_path = os.path.join(
        Config.DATA_DIR,
        "raw/Loan Default Prediction Dataset export 2026-05-31 08-13-25.csv",
    )
 
    raw_df = pd.read_csv(raw_data_path)
    
    # --- CRITICAL: Replicate Feature Engineering for Background/Audit Data ---
    # The preprocessor expects these columns to exist in the input DataFrame
    raw_df["LoanToIncome"]        = raw_df["LoanAmount"] / (raw_df["Income"] + 1)
    raw_df["MonthlyPayment"]      = raw_df["LoanAmount"] / (raw_df["LoanTerm"] + 1)
    raw_df["PaymentToIncome"]     = raw_df["MonthlyPayment"] / (raw_df["Income"] / 12 + 1)
    raw_df["RateRiskScore"]       = raw_df["InterestRate"] * raw_df["DTIRatio"]
    raw_df["CreditUtilProxy"]     = raw_df["DTIRatio"] / (raw_df["CreditScore"] / 850 + 1e-5)
    raw_df["EmploymentStability"] = raw_df["MonthsEmployed"] / (raw_df["Age"] * 12 + 1)
    raw_df["CreditAgeProxy"]      = raw_df["NumCreditLines"] / (raw_df["Age"] - 18 + 1)
    # -------------------------------------------------------------------------
 
    X_raw = raw_df.drop(columns=["Default"])
    if "LoanID" in X_raw.columns:
        X_raw = X_raw.drop(columns=["LoanID"])
    y_raw = raw_df["Default"]
 
 
    _, X_test_raw, _, y_test_raw = train_test_split(
        X_raw, y_raw, test_size=0.2, random_state=42, stratify=y_raw
    )
 
    # SHAP Manager — 300-row background is sufficient for LinearExplainer
    background_sample = X_raw.sample(300, random_state=42)
    shap_manager = SHAPManager(model, preprocessor, background_sample)
 
    # Counterfactual Engine (SHAP-guided)
    cf_engine = CounterfactualEngine(model, preprocessor, explainer=None)
 
    # Fairness Auditor — initialised on raw test set
    fairness_auditor = FairnessAuditor(model, preprocessor, X_test_raw, y_test_raw)
 
    # Precompute global importance on a 500-row sample (cached at startup)
    global_importance_sample = X_raw.sample(500, random_state=99)
    _global_importance_cache = shap_manager.explain_global(global_importance_sample)
 
    # Protected attributes to audit in the full fairness sweep
    PROTECTED_ATTRIBUTES = [
        ("Education", "Bachelor's"),
        ("MaritalStatus", "Married"),
        ("EmploymentType", "Full-time"),
        ("HasMortgage", "Yes"),
        ("HasDependents", "Yes"),
        ("HasCoSigner", "Yes"),
    ]
 
    print(f"✓ Model loaded: {os.path.basename(model_path)}")
    print(f"✓ SHAP Manager initialised")
    print(f"✓ Fairness Auditor initialised on {len(X_test_raw)} test rows")
 
except Exception as e:
    print(f"✗ Error loading model artefacts: {e}")
    raise



# ------------------------------------------------------------------
# Request / Response schemas
# ------------------------------------------------------------------

class LoanApplication(BaseModel):
    Age: int = Field(..., ge=18, le=120)
    Income: float = Field(..., ge=0)
    LoanAmount: float = Field(..., ge=0)
    CreditScore: int = Field(..., ge=300, le=850)
    MonthsEmployed: int = Field(..., ge=0)
    NumCreditLines: int = Field(..., ge=0)
    InterestRate: float = Field(..., ge=0)
    LoanTerm: int = Field(..., ge=1)
    DTIRatio: float = Field(..., ge=0, le=10)
    Education: str
    EmploymentType: str
    MaritalStatus: str
    HasMortgage: str
    HasDependents: str
    LoanPurpose: str
    HasCoSigner: str

    def to_dataframe(self) -> pd.DataFrame:
        """Convert to raw DataFrame (before feature engineering)."""
        d = self.dict()
        df = pd.DataFrame([d])
        
        # Business Logic: Unemployed users must have 0 income
        if d.get("EmploymentType") == "Unemployed":
            df["Income"] = 0.0
            
        # Apply Clipping (Winsorization) to prevent OOD extrapolation
        if 'clipping_bounds' in globals():
            for col, bounds in clipping_bounds.items():
                if col in df.columns:
                    df[col] = df[col].clip(lower=bounds['lower'], upper=bounds['upper'])
        
        # Replicate the same feature engineering from preprocessing.py
        df["LoanToIncome"]        = df["LoanAmount"] / (df["Income"] + 1)
        df["MonthlyPayment"]      = df["LoanAmount"] / (df["LoanTerm"] + 1)
        df["PaymentToIncome"]     = df["MonthlyPayment"] / (df["Income"] / 12 + 1)
        df["RateRiskScore"]       = df["InterestRate"] * df["DTIRatio"]
        df["CreditUtilProxy"]     = df["DTIRatio"] / (df["CreditScore"] / 850 + 1e-5)
        df["EmploymentStability"] = df["MonthsEmployed"] / (df["Age"] * 12)
        df["CreditAgeProxy"]      = df["NumCreditLines"] / (df["Age"] - 18 + 1)
        return df


# ------------------------------------------------------------------
# Health & metadata
# ------------------------------------------------------------------

@app.get("/health")
def health_check():
    return {"status": "healthy", "model": os.path.basename(model_path)}


@app.get("/model-info")
def model_info():
    return {
        "model": "LogisticRegression",
        "model_path": model_path,
        "auc": 0.7616,
        "recall": 0.6975,
        "precision": 0.2280,
        "f1": 0.3436,
        "optimal_threshold": 0.4554,
        "rationale": (
            "Logistic Regression was selected as champion after a learning curve "
            "analysis revealed a dataset information ceiling at AUC ~0.76. All "
            "tree ensembles converged to the same ceiling while offering lower "
            "interpretability. The linear model provides exact SHAP values and "
            "is preferable for regulatory compliance in credit lending."
        ),
        "features": preprocessor.get_feature_names_out().tolist(),
        "status": "Deployed",
    }


# ------------------------------------------------------------------
# Core prediction + local explanation
# ------------------------------------------------------------------

@app.post("/predict")
def predict(application: LoanApplication):
    """
    Score a loan application and return a SHAP local explanation.
    
    The explanation includes the top features driving this specific decision,
    their SHAP values (contributions to log-odds), and a waterfall breakdown.
    """
    try:
        input_df = application.to_dataframe()
        processed = preprocessor.transform(input_df)

        prob = float(model.predict_proba(processed)[0][1])

        # Optimal threshold found during training (F2-maximising)
        THRESHOLD = 0.4554
        prediction = 1 if prob > THRESHOLD else 0

        # Local SHAP explanation
        local_explanation = shap_manager.explain_local(input_df, top_n=10)

        return {
            "prediction": "Bad Credit" if prediction == 1 else "Good Credit",
            "probability": round(prob, 4),
            "risk_score": round(prob * 100, 2),
            "threshold_used": THRESHOLD,
            "explanation": {
                "base_value": round(local_explanation["base_value"], 4),
                "prediction_value": round(local_explanation["prediction_value"], 4),
                "top_features": local_explanation["top_features"],
            },
        }
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))


@app.post("/predict/waterfall")
def predict_waterfall(application: LoanApplication):
    """
    Returns full waterfall chart data for a prediction.
    Used by the WaterfallExplanation frontend component.
    """
    try:
        input_df = application.to_dataframe()
        waterfall = shap_manager.waterfall_data(input_df)
        return waterfall
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))


# ------------------------------------------------------------------
# Counterfactual explanations
# ------------------------------------------------------------------

@app.post("/predict/counterfactual")
def predict_counterfactual(application: LoanApplication):
    """
    For a denied application, returns the minimal actionable changes
    needed to flip the decision to Approved (Good Credit).
    
    Immutable features (Age, MaritalStatus, HasDependents, Education)
    are never included in suggestions.
    """
    try:
        input_df = application.to_dataframe()
        result = cf_engine.generate_counterfactual(
            input_df, target_class=0, max_iter=200, n_suggestions=5
        )
        return result
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))


# ------------------------------------------------------------------
# Global explanations
# ------------------------------------------------------------------

@app.get("/explain/global")
def global_importance():
    """
    Returns pre-computed global feature importance (mean |SHAP| over test sample).
    Used by SHAPBarForest and InfluenceMap frontend components.
    """
    return {"global_importance": _global_importance_cache}


# ------------------------------------------------------------------
# Fairness audit
# ------------------------------------------------------------------

@app.get("/audit/fairness")
def audit_fairness(
    attribute: str = Query(..., description="Protected attribute column name"),
    privileged_value: str = Query(..., description="Value of the privileged group"),
):
    """
    Single-attribute fairness audit.
    
    Returns Disparate Impact, Statistical Parity Difference,
    and Equal Opportunity Difference with status (FAIR / WARNING / BIASED / CRITICAL).
    """
    if fairness_auditor is None:
        raise HTTPException(status_code=503, detail="Fairness auditor not initialised")
    try:
        result = fairness_auditor.audit_attribute(attribute, privileged_value)
        return result
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@app.get("/audit/fairness/full")
def full_fairness_audit():
    """
    Runs a complete fairness audit across all protected attributes
    defined in PROTECTED_ATTRIBUTES.
    
    Returns overall status and per-attribute breakdown.
    """
    if fairness_auditor is None:
        raise HTTPException(status_code=503, detail="Fairness auditor not initialised")
    try:
        result = fairness_auditor.run_full_audit(PROTECTED_ATTRIBUTES)
        return result
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
