# XAI Credit Risk Scoring System

> High-fidelity Explainable AI (XAI) powered credit risk scoring with an interactive 3D "Risk Nucleus" diagnostic environment.

## 📌 Overview

This project is a full-stack prototype of an **Explainable Artificial Intelligence (XAI)** system for credit risk scoring. It transforms "black-box" machine learning predictions into an intuitive, visceral experience, combining an optimized XGBoost model with SHAP (SHapley Additive exPlanations) and a cutting-edge 3D frontend.

### 🔑 Key Features

* 📊 **Predictive Engine**: Accurate loan default prediction using an optimized XGBoost champion model.
* 🔍 **Local Interpretability**: Real-time SHAP-based explanations visualized as a 3D orbital Influence Map.
* 🌐 **3D Diagnostic UI**: A high-fidelity "Command Center" interface built with React Three Fiber.
* 🔄 **Counterfactual Analysis**: "What-if" scenarios allowing users to modify applicant data and observe real-time risk shifts.
* ⚖️ **Fairness Auditing**: Framework for analyzing demographic bias and ensuring equitable lending decisions.

---

## 🏗️ Tech Stack

### Frontend
* **React (Vite)** - Fast, modern UI framework.
* **React Three Fiber & Drei** - 3D rendering engine based on Three.js.
* **Tailwind CSS** - Utility-first styling with an "Ember Glow" theme.
* **Framer Motion** - Fluid layout animations and transitions.
* **Axios** - Type-safe API communication.

### Backend
* **FastAPI** - High-performance Python web framework.
* **Pydantic** - Strict data validation and schema definition.
* **Uvicorn** - ASGI server for production-ready deployment.

### Machine Learning
* **XGBoost** - Gradient boosting champion model.
* **SHAP (TreeExplainer)** - Model-agnostic explanation framework.
* **Scikit-learn** - Preprocessing and evaluation pipelines.
* **Imbalanced-learn (SMOTE)** - Handling class imbalance in credit data.

---

## 🧠 System Architecture

```
[ React 3D Frontend ]  →  [ FastAPI Backend ]  →  [ XGBoost Model + SHAP ]
                                     ↓
                                [ Joblib Artifacts ]
```

---

## 🎨 3D Visual Components

### 🔴 The Risk Nucleus
A pulsing, color-tiered core that serves as the visual anchor of the system.
* **Tiered Colors**: Transitions from **Green** (Low Risk) $\rightarrow$ **Yellow** (Medium) $\rightarrow$ **Ember Coral** (High Risk).
* **Precision Arc**: A semicircular gauge that fills clockwise to provide an exact probability reading.
* **Dynamic Energy**: The core's pulse and "jitter" intensity increase as the risk score rises.

### 🛰️ The Influence Map
A spatial representation of feature contributions replacing traditional bar charts.
* **Orbital Satellites**: Features are mapped as spheres orbiting the nucleus.
* **Visual Encoding**: 
    * **Size**: Orb radius $\propto$ SHAP value magnitude.
    * **Distance**: Influence strength $\propto$ distance from core.
    * **Color**: Coral for risk-increasing, Cream for risk-decreasing.
* **Billboarding**: Labels always face the user for maximum legibility.

### 🖥️ The Model HUD
A terminal-style system monitor providing a "Command Center" feel.
* **Real-time Logs**: A scrolling diagnostic feed of model operations.
* **Precision Metrics**: Displays exact default probabilities and model metadata.
* **CRT Effect**: Features a custom scanline animation for a high-tech, diagnostic aesthetic.

---

## ⚙️ Getting Started

### 1. Clone the Repository
```bash
git clone https://github.com/yourusername/xai-credit-risk.git
cd xai-credit-risk
```

### 2. Backend Setup
```bash
# Create and activate environment
python -m venv venv
source venv/bin/activate # Linux/macOS
# or venv\Scripts\activate # Windows

pip install -r requirements.txt
uvicorn src.api:app --reload --port 8000
```

### 3. Frontend Setup
```bash
cd frontend
npm install
npm run dev
```

---

## 🚀 API Endpoints

| Endpoint             | Method | Description                                |
| -------------------- | ------ | ------------------------------------------ |
| `/predict`           | POST   | Returns risk score, prediction, and SHAP values |
| `/health`            | GET    | API health check                            |
| `/model-info`        | GET    | Model metadata and versioning               |
| `/global-importance` | GET    | Aggregate feature importance across dataset |

---

## 📊 Model Performance

The system utilizes an optimized **XGBoost** model trained on the German Credit dataset.

| Metric   | Value |
| -------- | ----- |
| **AUC-ROC** | **0.7539** |
| **F1-Score** | **0.1656** |
| **Model** | XGBoost |

---

## 🗺️ Project Roadmap

- [x] Data preprocessing & SMOTE pipeline
- [x] Model training & Hyperparameter optimization
- [x] SHAP integration for local/global explanations
- [x] FastAPI backend with strict Pydantic validation
- [x] 3D "Risk Nucleus" and "Influence Map" frontend
- [x] "Ember Glow" high-fidelity UI theme
- [ ] Containerization via Docker Compose
- [ ] Deployment to Render (Backend & Static Frontend)

---

## 👨‍💻 Author

**Justin Enyeribe Ndubuisi**  
BSc Business Computing — JKUAT

---

## 📜 License

This project is for academic/research purposes.
