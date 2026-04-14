from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field
import joblib
import numpy as np
import pandas as pd
import shap
from typing import List, Dict, Any, Optional
import os

app = FastAPI(title="XAI Credit Risk Scoring API")

# Enable CORS for React frontend
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Load artifacts
try:
    preprocessor = joblib.load('models/preprocessor.joblib')
    # Dynamically load the latest champion model if possible, else fallback
    model_files = [f for f in os.listdir('models') if f.startswith('best_model_') and f.endswith('.joblib')]
    # Sort by modification time to get the most recent
    model_files.sort(key=lambda x: os.path.getmtime(os.path.join('models', x)), reverse=True)
    model_path = os.path.join('models', model_files[0]) if model_files else 'models/best_model_gradientboosting.joblib'
    model = joblib.load(model_path)
    explainer = joblib.load('models/shap_explainer.joblib')
    global_shap_values = joblib.load('models/shap_values.joblib')
except Exception as e:
    print(f"Error loading model artifacts: {e}")

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

    def to_dict(self):
        return self.dict()

@app.get("/health")
def health_check():
    return {"status": "healthy"}

@app.get("/model-info")
def model_info():
    return {
        "model_path": model_path,
        "features": preprocessor.get_feature_names_out().tolist() if hasattr(preprocessor, 'get_feature_names_out') else "Unknown",
        "status": "Deployed"
    }

@app.get("/global-importance")
def global_importance():
    try:
        feature_names = preprocessor.get_feature_names_out()
        # Calculate mean absolute SHAP values for global importance
        # global_shap_values is usually the SHAP values for a test subset
        import numpy as np
        importance = np.abs(global_shap_values).mean(axis=0)
        importance_dict = dict(zip(feature_names, importance.tolist()))
        # Sort by importance
        sorted_importance = sorted(importance_dict.items(), key=lambda x: x[1], reverse=True)
        return {"global_importance": sorted_importance}
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error calculating global importance: {str(e)}")

@app.post("/predict")
def predict(application: LoanApplication):
    try:
        # Convert input to DataFrame
        input_df = pd.DataFrame([application.to_dict()])
        
        # Preprocess input
        processed_input = preprocessor.transform(input_df)
        
        # Predict
        prob = model.predict_proba(processed_input)[0][1]
        prediction = 1 if prob > 0.5 else 0
        
        # SHAP local explanation
        shap_val = explainer.shap_values(processed_input)
        
        # Handle SHAP output for binary classification
        if isinstance(shap_val, list):
            shap_val_class1 = shap_val[1]
        elif len(shap_val.shape) == 3:
            shap_val_class1 = shap_val[:, :, 1]
        else:
            shap_val_class1 = shap_val
            
        # Match SHAP values to feature names
        feature_names = preprocessor.get_feature_names_out()
        shap_dict = {name: float(val) for name, val in zip(feature_names, shap_val_class1[0])}
        
        return {
            "prediction": "Bad Credit" if prediction == 1 else "Good Credit",
            "probability": float(prob),
            "risk_score": float(prob * 100),
            "explanation": shap_dict
        }
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)

