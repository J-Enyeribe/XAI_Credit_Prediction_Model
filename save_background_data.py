"""
save_background_data.py
-----------------------
Run this ONCE locally before deploying to Render.
It saves the feature-engineered data slices the API needs at startup,
so production never has to touch the raw CSV.

Usage:
    python save_background_data.py
"""

import pandas as pd
import numpy as np
import joblib
import os
from sklearn.model_selection import train_test_split

RAW_CSV = "data/raw/Loan Default Prediction Dataset export 2026-05-31 08-13-25.csv"
MODEL_DIR = "models"

print("Loading raw data...")
raw_df = pd.read_csv(RAW_CSV)

# Replicate the same feature engineering as preprocessing.py / api.py
print("Engineering features...")
raw_df["LoanToIncome"]        = raw_df["LoanAmount"] / (raw_df["Income"] + 1)
raw_df["MonthlyPayment"]      = raw_df["LoanAmount"] / (raw_df["LoanTerm"] + 1)
raw_df["PaymentToIncome"]     = raw_df["MonthlyPayment"] / (raw_df["Income"] / 12 + 1)
raw_df["RateRiskScore"]       = raw_df["InterestRate"] * raw_df["DTIRatio"]
raw_df["CreditUtilProxy"]     = raw_df["DTIRatio"] / (raw_df["CreditScore"] / 850 + 1e-5)
raw_df["EmploymentStability"] = raw_df["MonthsEmployed"] / (raw_df["Age"] * 12 + 1)
raw_df["CreditAgeProxy"]      = raw_df["NumCreditLines"] / (raw_df["Age"] - 18 + 1)

X_raw = raw_df.drop(columns=["Default"])
if "LoanID" in X_raw.columns:
    X_raw = X_raw.drop(columns=["LoanID"])
y_raw = raw_df["Default"]

_, X_test_raw, _, y_test_raw = train_test_split(
    X_raw, y_raw, test_size=0.2, random_state=42, stratify=y_raw
)

os.makedirs(MODEL_DIR, exist_ok=True)
joblib.dump(X_raw,      os.path.join(MODEL_DIR, "X_raw.joblib"))
joblib.dump(X_test_raw, os.path.join(MODEL_DIR, "X_test.joblib"))
joblib.dump(y_test_raw, os.path.join(MODEL_DIR, "y_test.joblib"))

print(f"Saved X_raw.joblib        ({len(X_raw)} rows)")
print(f"Saved X_test.joblib       ({len(X_test_raw)} rows)")
print(f"Saved y_test.joblib       ({len(y_test_raw)} rows)")
print("\nDone. Now commit the models/ folder and push to GitHub.")
