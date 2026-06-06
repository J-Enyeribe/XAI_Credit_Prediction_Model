import os
from dotenv import load_dotenv

load_dotenv()

class Config:
    # Environment
    ENVIRONMENT = os.getenv("ENVIRONMENT", "development")
    
    # Paths
    BASE_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
    MODEL_DIR = os.path.join(BASE_DIR, os.getenv("MODEL_DIR", "models"))
    DATA_DIR = os.path.join(BASE_DIR, os.getenv("DATA_DIR", "data"))
    
    # Model Artifacts
    # We use a generic name for the champion model to avoid updating API when model type changes
    # The train.py saves as best_model_{name}.joblib, so we might need to resolve this.
    # For now, we'll look for any best_model_*.joblib
    MODEL_FILENAME = os.getenv("MODEL_FILENAME", "best_model_xgboost.joblib")
    PREPROCESSOR_FILENAME = "preprocessor.joblib"
    SHAP_EXPLAINER_FILENAME = "shap_explainer.joblib"
    
    # API Security
    CORS_ORIGINS = os.getenv("CORS_ORIGINS", "http://localhost:5173,http://127.0.0.1:5173").split(",")
    
    @classmethod
    def get_model_path(cls):
        return os.path.join(cls.MODEL_DIR, cls.MODEL_FILENAME)
    
    @classmethod
    def get_preprocessor_path(cls):
        return os.path.join(cls.MODEL_DIR, cls.PREPROCESSOR_FILENAME)
    
    @classmethod
    def get_shap_explainer_path(cls):
        return os.path.join(cls.MODEL_DIR, cls.SHAP_EXPLAINER_FILENAME)
