import nbformat as nbf
import os

def create_lifecycle_notebook():
    nb = nbf.v4.new_notebook()
    
    cells = [
        nbf.v4.new_markdown_cell("# 🛡️ XAI Credit Risk Scoring: Model Lifecycle\n\nThis notebook documents the end-to-end journey from raw data to a deployable, explainable ML model."),
        
        nbf.v4.new_markdown_cell("## 1. Exploratory Data Analysis (EDA)\n\nIn this section, we visualize the distributions and correlations of the Loan Default dataset."),
        nbf.v4.new_code_cell(
            "import pandas as pd\n"
            "import matplotlib.pyplot as plt\n"
            "import seaborn as sns\n"
            "import os\n\n"
            "df_raw = pd.read_csv('data/raw/Loan Default Prediction Dataset export 2026-04-13 19-55-23.csv')\n\n"
            "print('Dataset Shape:', df_raw.shape)\n"
            "df_raw.head()"
        ),
        nbf.v4.new_markdown_cell("### Numerical Feature Distributions\n\nVisualizing the distributions of core risk factors."),
        nbf.v4.new_code_cell(
            "num_cols = ['Age', 'Income', 'LoanAmount', 'CreditScore']\n"
            "col_names = ['Age', 'Annual Income', 'Loan Amount', 'Credit Score']\n\n"
            "fig, axes = plt.subplots(2, 2, figsize=(15, 10))\n"
            "axes = axes.flatten()\n"
            "for i, col in enumerate(num_cols):\n"
            "    sns.histplot(df_raw[col], kde=True, ax=axes[i], color='skyblue')\n"
            "    axes[i].set_title(col_names[i])\n"
            "plt.tight_layout()\n"
            "plt.show()"
        ),
        nbf.v4.new_markdown_cell("### Target Distribution\n\nAnalyzing the prevalence of loan defaults in the dataset."),
        nbf.v4.new_code_cell(
            "plt.figure(figsize=(6, 4))\n"
            "sns.countplot(x='Default', data=df_raw, hue='Default', palette='viridis', legend=False)\n"
            "plt.title('Target Class Distribution (Raw)')\n"
            "plt.xlabel('Default (0: No, 1: Yes)')\n"
            "plt.show()"
        ),
        nbf.v4.new_markdown_cell("### Correlation Heatmap\n\nVisualizing relationships between numerical features and the default status."),
        nbf.v4.new_code_cell(
            "plt.figure(figsize=(12, 8))\n"
            "numeric_df = df_raw.select_dtypes(include=['int64', 'float64'])\n"
            "sns.heatmap(numeric_df.corr(), annot=True, cmap='coolwarm', fmt='.2f')\n"
            "plt.title('Feature Correlation Matrix')\n"
            "plt.show()"
        ),
        
        nbf.v4.new_markdown_cell("## 2. The Data Journey\n\nFrom raw data to balanced training sets using One-Hot Encoding and SMOTE."),
        nbf.v4.new_code_cell(
            "# Load processed data\n"
            "X_train = pd.read_csv('data/processed/loan_default_X_train.csv')\n"
            "y_train = pd.read_csv('data/processed/loan_default_y_train.csv').iloc[:, 0]\n"
            "X_test = pd.read_csv('data/processed/loan_default_X_test.csv')\n"
            "y_test = pd.read_csv('data/processed/loan_default_y_test.csv').iloc[:, 0]\n\n"
            "print(f'Training set shape (Balanced): {X_train.shape}')\n"
            "print(f'Test set shape: {X_test.shape}')"
        ),
        nbf.v4.new_markdown_cell("### Class Distribution (Post-SMOTE)\n\nEnsuring a 50/50 split between Good and Bad credit cases to avoid model bias."),
        nbf.v4.new_code_cell(
            "plt.figure(figsize=(6, 4))\n"
            "sns.countplot(x=y_train, hue=y_train, palette='viridis', legend=False)\n"
            "plt.title('Balanced Target Distribution (After SMOTE)')\n"
            "plt.xlabel('Default (0: No, 1: Yes)')\n"
            "plt.ylabel('Count')\n"
            "plt.show()"
        ),
        
        nbf.v4.new_markdown_cell("## 3. The Model Showdown\n\nComparing Logistic Regression, Random Forest, Gradient Boosting, and XGBoost."),
        nbf.v4.new_code_cell(
            "import joblib\n"
            "from sklearn.metrics import roc_auc_score, f1_score, classification_report\n\n"
            "model = joblib.load('models/best_model_logisticregression.joblib')\n"
            "preds = model.predict(X_test)\n"
            "probs = model.predict_proba(X_test)[:, 1]\n\n"
            "print('--- Winning Model: Logistic Regression ---')\n"
            "print(f'AUC-ROC: {roc_auc_score(y_test, probs):.4f}')\n"
            "print(f'F1-Score: {f1_score(y_test, preds):.4f}')\n"
            "print('\\nClassification Report:\\n', classification_report(y_test, preds))"
        ),
        
        nbf.v4.new_markdown_cell("## 4. Global XAI: The 'Forest' View\n\nWhich features most influence the probability of default?"),
        nbf.v4.new_code_cell(
            "import shap\n"
            "explainer = joblib.load('models/shap_explainer.joblib')\n"
            "shap_values = explainer.shap_values(X_test)\n\n"
            "if isinstance(shap_values, list): shap_values = shap_values[1]\n\n"
            "plt.figure(figsize=(10, 6))\n"
            "shap.summary_plot(shap_values, X_test, plot_type='bar', show=False)\n"
            "plt.title('Global Feature Importance (SHAP)')\n"
            "plt.show()"
        ),
        nbf.v4.new_markdown_cell("### SHAP Beeswarm Plot\n\nVisualizing the impact of specific feature values on risk."),
        nbf.v4.new_code_cell(
            "plt.figure(figsize=(10, 6))\n"
            "shap.summary_plot(shap_values, X_test, show=False)\n"
            "plt.title('SHAP Feature Impact')\n"
            "plt.show()"
        ),
        
        nbf.v4.new_markdown_cell("## 5. Local XAI: The 'Person' View\n\nExplaining the decision for a single applicant."),
        nbf.v4.new_code_cell(
            "sample_idx = 0\n"
            "person_data = X_test.iloc[sample_idx]\n"
            "actual_class = y_test.iloc[sample_idx]\n"
            "prob = model.predict_proba(person_data.to_frame().T)[0][1]\n\n"
            "print(f'Actual Default: {actual_class}')\n"
            "print(f'Predicted Default Probability: {prob:.2%}')\n\n"
            "plt.figure(figsize=(10, 6))\n"
            "shap.plots.waterfall(explainer(X_test.iloc[sample_idx:sample_idx+1])[0])\n"
            "plt.show()"
        ),
        
        nbf.v4.new_markdown_cell("## 6. Export & Persistence\n\nVerification of the deployable artifacts."),
        nbf.v4.new_code_cell(
            "import joblib\n\n"
            "loaded_preprocessor = joblib.load('models/preprocessor.joblib')\n"
            "loaded_model = joblib.load('models/best_model_logisticregression.joblib')\n\n"
            "print('✅ Artifacts loaded successfully.')\n"
            "print(f'Preprocessor type: {type(loaded_preprocessor)}')\n"
            "print(f'Model type: {type(loaded_model)}')\n\n"
            "print('\\nSystem ready for FastAPI deployment.')"
        )
    ]
    
    nb['cells'] = cells
    
    os.makedirs('notebooks', exist_ok=True)
    with open('notebooks/Model_Lifecycle.ipynb', 'w') as f:
        nbf.write(nb, f)
    print("Notebook created successfully: notebooks/Model_Lifecycle.ipynb")

if __name__ == "__main__":
    create_lifecycle_notebook()
