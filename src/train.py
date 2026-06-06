import os
os.environ["LOKY_MAX_CPU_COUNT"] = "1"

# SET TO False TO RUN ALL MODELS (RandomForest, GradientBoosting, etc.)
FAST_MODE = False 

import pandas as pd
import numpy as np
import joblib
from joblib import parallel_backend
import shap
import matplotlib.pyplot as plt
from sklearn.ensemble import RandomForestClassifier, HistGradientBoostingClassifier
from sklearn.linear_model import LogisticRegression
from xgboost import XGBClassifier
from sklearn.metrics import (
    roc_auc_score, f1_score, precision_score, recall_score, 
    classification_report, confusion_matrix, precision_recall_curve, make_scorer, fbeta_score
)
from sklearn.model_selection import RandomizedSearchCV, StratifiedKFold, learning_curve
from sklearn.pipeline import Pipeline

def train_and_evaluate():
    # Load processed data
    X_train = pd.read_csv('data/processed/loan_default_X_train.csv')
    y_train = pd.read_csv('data/processed/loan_default_y_train.csv').values.ravel()
    X_test = pd.read_csv('data/processed/loan_default_X_test.csv')
    y_test = pd.read_csv('data/processed/loan_default_y_test.csv').values.ravel()
    
    print(f"Dataset loaded. Train shape: {X_train.shape}, Test shape: {X_test.shape}")

    # Calculate scale_pos_weight for XGBoost to improve recall
    num_neg = np.sum(y_train == 0)
    num_pos = np.sum(y_train == 1)
    scale_weight = num_neg / num_pos
    print(f"Calculated scale_pos_weight: {scale_weight:.2f}")

    # Define F2 Scorer (Weights recall twice as heavily as precision)
    f2_scorer = make_scorer(fbeta_score, beta=2)

    # Define models and their hyperparameter grids for RandomizedSearchCV
    model_configs = {
        'LogisticRegression': {
            'model': LogisticRegression(max_iter=1000, random_state=42, class_weight='balanced'),
            'params': {
                'C': [0.001, 0.01, 0.1, 1, 10, 100]
            }
        },
        'RandomForest': {
            'model': RandomForestClassifier(random_state=42, n_jobs=-1, class_weight='balanced'),
            'params': {
                'n_estimators': [100],
                'max_depth': [10, 20],
                'min_samples_split': [5, 10],
                'max_features': ['sqrt']
            }
        },
        'GradientBoosting': {
            'model': HistGradientBoostingClassifier(random_state=42),
            'params': {
                'max_iter': [100, 300],
                'learning_rate': [0.05, 0.1, 0.2],
                'max_depth': [3, 5, None],
                'l2_regularization': [0.0, 0.1]
            }
        },
        'XGBoost': {
            'model': XGBClassifier(
                random_state=42, 
                eval_metric='logloss', 
                n_jobs=-1, 
                scale_pos_weight=scale_weight
            ),
            'params': {
                'n_estimators': [300, 500, 800],
                'learning_rate': [0.005, 0.01, 0.05],
                'max_depth': [3, 4, 5],
                'min_child_weight': [1, 5, 10, 20],
                'subsample': [0.6, 0.8, 1.0],
                'colsample_bytree': [0.6, 0.8, 1.0],
                'gamma': [0, 0.1, 0.5, 1.0],
                'reg_alpha': [0, 0.1, 1.0],
                'reg_lambda': [1, 5, 10],
            }
        }
    }
    
    # Subset for hyperparameter tuning to speed up process

    X_tune = X_train.sample(min(5000, len(X_train)), random_state=42)
    y_tune = y_train[X_tune.index]
    
    skf = StratifiedKFold(n_splits=3, shuffle=True, random_state=42)
    best_overall_auc = -1
    best_overall_model = None
    best_overall_name = ""
    all_results = {}

    for name, config in model_configs.items():
        if FAST_MODE and name in ['RandomForest', 'GradientBoosting']:
            print(f"\n--- Skipping {name} (FAST_MODE=True) ---")
            continue
            
        print(f"\n--- Optimizing {name} ---")
        
        # Calculate actual number of combinations to avoid warnings
        import itertools
        keys, values = zip(*config['params'].items())
        param_combinations = [dict(zip(keys, v)) for v in itertools.product(*values)]
        n_iter = min(50, len(param_combinations))
        
        # Use RandomizedSearchCV on tuning subset
        search = RandomizedSearchCV(
            estimator=config['model'],
            param_distributions=config['params'],
            n_iter=n_iter,
            scoring=f2_scorer if name == 'XGBoost' else 'roc_auc',
            cv=skf,
            verbose=1,
            random_state=42,
            n_jobs=1
        )
        
        with parallel_backend('threading', n_workers=1):
            search.fit(X_tune, y_tune)
            
        best_params = search.best_params_
        
        # Fit the model with best params on full training set
        best_model = config['model'].set_params(**best_params)
        best_model.fit(X_train, y_train)
        
        # Evaluate on test set
        preds = best_model.predict(X_test)
        probs = best_model.predict_proba(X_test)[:, 1]
        
        auc = roc_auc_score(y_test, probs)
        f1 = f1_score(y_test, preds)
        prec = precision_score(y_test, preds)
        rec = recall_score(y_test, preds)
        
        all_results[name] = {
            'AUC': auc,
            'F1': f1,
            'Precision': prec,
            'Recall': rec,
            'BestParams': best_params
        }
        
        print(f"{name} Optimized Results: AUC={auc:.4f}, F1={f1:.4f}, Precision={prec:.4f}, Recall={rec:.4f}")
        print(f"Best Params: {best_params}")
        
        if auc > best_overall_auc:
            best_overall_auc = auc
            best_overall_model = best_model
            best_overall_name = name

    print(f"\n{'='*30}\nOverall Champion: {best_overall_name} (AUC={best_overall_auc:.4f})\n{'='*30}")
    
    # --- LEARNING CURVE DIAGNOSTIC (Priority 3) ---
    print("Generating learning curve to diagnose model ceiling...")
    try:
        train_sizes, train_scores, val_scores = learning_curve(
            best_overall_model, X_train, y_train,
            cv=3, scoring='roc_auc',
            train_sizes=[0.1, 0.25, 0.5, 0.75, 1.0],
            n_jobs=-1
        )
        
        plt.figure(figsize=(10, 6))
        plt.plot(train_sizes, np.mean(train_scores, axis=1), 'o-', label='Train AUC')
        plt.plot(train_sizes, np.mean(val_scores, axis=1), 'o-', label='Val AUC')
        plt.xlabel('Training Set Size')
        plt.ylabel('ROC-AUC')
        plt.title(f'Learning Curve — {best_overall_name}')
        plt.legend()
        
        os.makedirs('notebooks/plots', exist_ok=True)
        plt.savefig('notebooks/plots/learning_curve.png')
        plt.close()
        print(f"Learning curve saved to notebooks/plots/learning_curve.png")
        print(f"Final Train AUC: {np.mean(train_scores, axis=1)[-1]:.4f}")
        print(f"Final Val AUC:   {np.mean(val_scores, axis=1)[-1]:.4f}")
    except Exception as e:
        print(f"Could not generate learning curve: {e}")

    # --- OPTIMAL THRESHOLD DISCOVERY (Priority 1) ---
    print("Finding optimal threshold to maximize F2-Score...")
    probs = best_overall_model.predict_proba(X_test)[:, 1]
    precisions, recalls, thresholds = precision_recall_curve(y_test, probs)
    
    # F2 = (5 * precision * recall) / (4 * precision + recall)
    f2_scores = (5 * precisions * recalls) / (4 * precisions + recalls + 1e-8)
    optimal_idx = np.argmax(f2_scores)
    # thresholds array is 1 shorter than precisions/recalls
    optimal_threshold = thresholds[optimal_idx] if optimal_idx < len(thresholds) else 0.5
    
    print(f"Optimal Threshold for F2: {optimal_threshold:.4f}")
    joblib.dump(optimal_threshold, os.path.join('models', 'optimal_threshold.joblib'))
    
    # Save the champion model
    os.makedirs('models', exist_ok=True)
    model_filename = f'best_model_{best_overall_name.lower()}.joblib'
    joblib.dump(best_overall_model, os.path.join('models', model_filename))
    print(f"Champion model saved to models/{model_filename}")
    
    # SHAP Integration for the champion
    print("Generating SHAP explanations for the champion...")
    if best_overall_name == 'LogisticRegression':
        explainer = shap.LinearExplainer(best_overall_model, X_train)
    else:
        explainer = shap.TreeExplainer(best_overall_model)
        
    # SHAP on subset for performance
    X_test_subset = X_test.sample(min(100, len(X_test)), random_state=42)
    shap_values = explainer.shap_values(X_test_subset)
    
    # Handle SHAP output formats (binary classification)
    if isinstance(shap_values, list):
        shap_values_class1 = shap_values[1]
    elif len(shap_values.shape) == 3: 
        shap_values_class1 = shap_values[:, :, 1]
    else:
        shap_values_class1 = shap_values
        
    joblib.dump(explainer, os.path.join('models', 'shap_explainer.joblib'))
    joblib.dump(shap_values_class1, os.path.join('models', 'shap_values.joblib'))
    
    # Plot summary
    plt.figure(figsize=(12, 8))
    shap.summary_plot(shap_values_class1, X_test_subset, show=False)
    plt.title(f"Global Feature Importance - {best_overall_name}")
    plt.savefig('notebooks/plots/shap_summary.png')
    plt.close()
    
    print("SHAP explainer and summary plot updated.")
    return all_results

if __name__ == "__main__":
    results = train_and_evaluate()
    # Print final comparison table
    print("\nFinal Model Comparison:")
    print(f"{'Model':<20} | {'AUC':<8} | {'F1':<8} | {'Precision':<10} | {'Recall':<8}")
    print("-" * 60)
    for name, metrics in results.items():
        print(f"{name:<20} | {metrics['AUC']:<8.4f} | {metrics['F1']:<8.4f} | {metrics['Precision']:<10.4f} | {metrics['Recall']:<8.4f}")
