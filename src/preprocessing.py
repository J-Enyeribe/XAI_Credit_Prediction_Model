import pandas as pd
import numpy as np
from sklearn.model_selection import train_test_split
from sklearn.preprocessing import RobustScaler, OneHotEncoder
from sklearn.compose import ColumnTransformer
from sklearn.pipeline import Pipeline
import joblib
import os

def preprocess_data(raw_path, processed_path, model_dir):
    print(f"Preprocessing data from {raw_path}...")
    df = pd.read_csv(raw_path)
    
    # Handle target variable 'Default'
    # Ensure it's binary 0/1
    if 'Default' in df.columns:
        y = df['Default'].values
    else:
        raise KeyError("Target column 'Default' not found in dataset")
    
    # Drop target and identifiers
    X = df.drop(columns=['Default'])
    if 'LoanID' in X.columns:
        X = X.drop(columns=['LoanID'])
    
    # Identify numerical and categorical columns
    num_cols = X.select_dtypes(include=['int64', 'float64']).columns.tolist()
    cat_cols = X.select_dtypes(include=['object']).columns.tolist()
    
    # --- DOMAIN FEATURE ENGINEERING (Priority 4) ---
    print("Engineering domain-specific features...")
    # Affordability signals
    X['LoanToIncome'] = X['LoanAmount'] / (X['Income'] + 1)
    X['MonthlyPayment'] = X['LoanAmount'] / (X['LoanTerm'] + 1)
    X['PaymentToIncome'] = X['MonthlyPayment'] / (X['Income'] / 12 + 1)
    
    # Risk concentration
    X['RateRiskScore'] = X['InterestRate'] * X['DTIRatio']
    X['CreditUtilProxy'] = X['DTIRatio'] / (X['CreditScore'] / 850 + 1e-5)
    
    # Stability signals
    X['EmploymentStability'] = X['MonthsEmployed'] / (X['Age'] * 12 + 1)
    X['CreditAgeProxy'] = X['NumCreditLines'] / (X['Age'] - 18 + 1)
    
    # Update numerical columns list to include new features
    num_cols = X.select_dtypes(include=['int64', 'float64']).columns.tolist()
    
    # --- OUTLIER HANDLING: Clipping (Winsorization) ---
    print("Applying clipping to numerical features...")
    clipping_bounds = {}
    for col in num_cols:
        lower = np.percentile(X[col], 1)
        upper = np.percentile(X[col], 99)
        X[col] = np.clip(X[col], lower, upper)
        clipping_bounds[col] = {'lower': lower, 'upper': upper}
    
    # Save clipping bounds for API use
    os.makedirs(model_dir, exist_ok=True)
    joblib.dump(clipping_bounds, os.path.join(model_dir, 'clipping_bounds.joblib'))
    
    print(f"Numerical columns: {num_cols}")
    print(f"Categorical columns: {cat_cols}")
    
    # Define preprocessing pipelines
    num_transformer = Pipeline(steps=[
        ('scaler', RobustScaler())
    ])
    
    cat_transformer = Pipeline(steps=[
        ('onehot', OneHotEncoder(handle_unknown='ignore', sparse_output=False))
    ])
    
    preprocessor = ColumnTransformer(
        transformers=[
            ('num', num_transformer, num_cols),
            ('cat', cat_transformer, cat_cols)
        ]
    )
    
    # Split data first to avoid leakage
    X_train_raw, X_test_raw, y_train, y_test = train_test_split(
        X, y, test_size=0.2, random_state=42, stratify=y
    )
    
    # Fit preprocessor on train set and transform both
    X_train = preprocessor.fit_transform(X_train_raw)
    X_test = preprocessor.transform(X_test_raw)
    
    # Get feature names after one-hot encoding
    cat_features = preprocessor.named_transformers_['cat'].get_feature_names_out(cat_cols)
    all_features = num_cols + list(cat_features)
    
    # Convert to DataFrames for easier saving
    X_train_df = pd.DataFrame(X_train, columns=all_features)
    y_train_df = pd.Series(y_train, name='Default')
    X_test_df = pd.DataFrame(X_test, columns=all_features)
    y_test_df = pd.Series(y_test, name='Default')
    
    # Save processed datasets
    os.makedirs(os.path.dirname(processed_path), exist_ok=True)
    X_train_df.to_csv(f"{processed_path}_X_train.csv", index=False)
    y_train_df.to_csv(f"{processed_path}_y_train.csv", index=False)
    X_test_df.to_csv(f"{processed_path}_X_test.csv", index=False)
    y_test_df.to_csv(f"{processed_path}_y_test.csv", index=False)
    
    # Save the preprocessor for later use in API
    os.makedirs(model_dir, exist_ok=True)
    joblib.dump(preprocessor, os.path.join(model_dir, 'preprocessor.joblib'))
    
    print(f"Preprocessing complete. Processed data saved to {processed_path}")
    print(f"Preprocessor saved to {model_dir}/preprocessor.joblib")
    print(f"Training set size: {X_train_df.shape}")
    print(f"Test set size: {X_test_df.shape}")


if __name__ == "__main__":
    # Use the new dataset path
    raw_path = 'data/raw/Loan Default Prediction Dataset export 2026-05-31 08-13-25.csv'
    processed_path = 'data/processed/loan_default'
    model_dir = 'models'
    preprocess_data(raw_path, processed_path, model_dir)
