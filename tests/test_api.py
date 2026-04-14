from fastapi.testclient import TestClient
from src.api import app
import pytest

client = TestClient(app)

def test_health_endpoint():
    response = client.get("/health")
    assert response.status_code == 200
    assert response.json() == {"status": "healthy"}

def test_model_info_endpoint():
    response = client.get("/model-info")
    assert response.status_code == 200
    assert "features" in response.json()
    assert "status" in response.json()

def test_predict_valid_input():
    payload = {
        "Age": 30,
        "Income": 50000,
        "LoanAmount": 10000,
        "CreditScore": 700,
        "MonthsEmployed": 60,
        "NumCreditLines": 3,
        "InterestRate": 5.0,
        "LoanTerm": 36,
        "DTIRatio": 0.3,
        "Education": "Bachelor's",
        "EmploymentType": "Full-time",
        "MaritalStatus": "Married",
        "HasMortgage": "No",
        "HasDependents": "No",
        "LoanPurpose": "Home Improvement",
        "HasCoSigner": "No"
    }
    response = client.post("/predict", json=payload)
    assert response.status_code == 200
    data = response.json()
    assert "prediction" in data
    assert "risk_score" in data
    assert "explanation" in data

def test_predict_invalid_input():
    # Age out of bounds
    payload = {
        "Age": 10,
        "Income": 50000,
        "LoanAmount": 10000,
        "CreditScore": 700,
        "MonthsEmployed": 60,
        "NumCreditLines": 3,
        "InterestRate": 5.0,
        "LoanTerm": 36,
        "DTIRatio": 0.3,
        "Education": "Bachelor's",
        "EmploymentType": "Full-time",
        "MaritalStatus": "Married",
        "HasMortgage": "No",
        "HasDependents": "No",
        "LoanPurpose": "Home Improvement",
        "HasCoSigner": "No"
    }
    response = client.post("/predict", json=payload)
    assert response.status_code == 422 # Pydantic validation error

def test_global_importance_endpoint():
    response = client.get("/global-importance")
    assert response.status_code == 200
    data = response.json()
    assert "global_importance" in data
    assert isinstance(data["global_importance"], list)
