import pandas as pd
import numpy as np
import time
import json
import os
import sys
from sklearn.model_selection import train_test_split, GroupShuffleSplit
from sklearn.linear_model import LogisticRegression
from sklearn.tree import DecisionTreeClassifier
from sklearn.ensemble import RandomForestClassifier
from sklearn.metrics import accuracy_score, precision_score, recall_score, f1_score, roc_auc_score, confusion_matrix
import joblib

sys.path.append(os.path.join(os.path.dirname(__file__), ".."))
from ml.feature_extractor import extract_features

def evaluate_model(model, X_test, y_test, name, split_type=""):
    preds = model.predict(X_test)
    probs = model.predict_proba(X_test)[:, 1] if hasattr(model, 'predict_proba') else preds
    
    acc = accuracy_score(y_test, preds)
    prec = precision_score(y_test, preds, zero_division=0)
    rec = recall_score(y_test, preds, zero_division=0)
    f1 = f1_score(y_test, preds, zero_division=0)
    roc = roc_auc_score(y_test, probs)
    cm = confusion_matrix(y_test, preds).tolist()
    
    tn, fp, fn, tp = cm[0][0], cm[0][1], cm[1][0], cm[1][1]
    fpr = fp / (fp + tn) if (fp + tn) > 0 else 0
    fnr = fn / (fn + tp) if (fn + tp) > 0 else 0
    
    print(f"[{split_type}] {name} - F1: {f1:.4f} | ROC: {roc:.4f} | FPR: {fpr:.4f} | FNR: {fnr:.4f}")
    return {
        "accuracy": acc, "precision": prec, "recall": rec, "f1": f1, "roc_auc": roc,
        "confusion_matrix": cm, "fpr": fpr, "fnr": fnr
    }

def main():
    df = pd.read_csv("ml/massive_dataset.csv")
    print(f"Loaded dataset: {len(df)} URLs")
    
    # Fast feature extraction
    start_time = time.time()
    features_list = df['url'].apply(extract_features).tolist()
    df_features = pd.DataFrame(features_list)
    print(f"Feature extraction took {time.time() - start_time:.2f} seconds.")
    
    X = df_features
    y = df['label']
    domains = df['domain']
    
    # --- Feature Correlation Audit ---
    print("\n--- Feature Correlation with Label ---")
    correlations = X.apply(lambda col: col.corr(y)).sort_values(ascending=False)
    print(correlations)
    
    report = {"splits": {}}
    
    # --- EVALUATION A: Random Split ---
    X_train_r, X_test_r, y_train_r, y_test_r = train_test_split(X, y, test_size=0.2, random_state=42, stratify=y)
    rf_random = RandomForestClassifier(n_estimators=50, random_state=42, n_jobs=-1)
    rf_random.fit(X_train_r, y_train_r)
    report["splits"]["Random"] = evaluate_model(rf_random, X_test_r, y_test_r, "RandomForest", "Random")
    
    # --- EVALUATION B: Domain-Aware Split ---
    gss = GroupShuffleSplit(n_splits=1, test_size=0.2, random_state=42)
    train_idx, test_idx = next(gss.split(X, y, groups=domains))
    
    X_train_d, X_test_d = X.iloc[train_idx], X.iloc[test_idx]
    y_train_d, y_test_d = y.iloc[train_idx], y.iloc[test_idx]
    
    rf_domain = RandomForestClassifier(n_estimators=50, random_state=42, n_jobs=-1)
    rf_domain.fit(X_train_d, y_train_d)
    report["splits"]["Domain-Aware"] = evaluate_model(rf_domain, X_test_d, y_test_d, "RandomForest", "Domain")
    
    # --- EVALUATION C: True Holdout ---
    print("\n--- FINAL HOLDOUT & MODEL COMPARISON ---")
    gss_holdout = GroupShuffleSplit(n_splits=1, test_size=0.1, random_state=99)
    train_val_idx, holdout_idx = next(gss_holdout.split(X, y, groups=domains))
    
    X_train_val = X.iloc[train_val_idx]
    y_train_val = y.iloc[train_val_idx]
    domains_train_val = domains.iloc[train_val_idx]
    
    X_holdout = X.iloc[holdout_idx]
    y_holdout = y.iloc[holdout_idx]
    
    # Split train_val into train and val (domain aware)
    gss_val = GroupShuffleSplit(n_splits=1, test_size=0.2, random_state=99)
    train_idx2, val_idx2 = next(gss_val.split(X_train_val, y_train_val, groups=domains_train_val))
    
    X_final_train = X_train_val.iloc[train_idx2]
    y_final_train = y_train_val.iloc[train_idx2]
    
    rf_model = RandomForestClassifier(n_estimators=100, random_state=42, n_jobs=-1)
    rf_model.fit(X_final_train, y_final_train)
    
    results = {"RandomForest": evaluate_model(rf_model, X_holdout, y_holdout, "RandomForest", "Holdout")}
    report["models"] = results
    
    # Random Forest is far more robust against single-feature overfitting (like the Google search query bug)
    selected_model = rf_model
    selected_name = "RandomForest"
    best_results = results["RandomForest"]
    
    print(f"\nSelected Model: {selected_name}")
    
    if hasattr(selected_model, 'feature_importances_'):
        importances = selected_model.feature_importances_
        feature_names = X.columns
        feat_imp = sorted(zip(feature_names, importances), key=lambda x: x[1], reverse=True)
        with open("ml/artifacts/feature_importance.json", "w") as f:
            json.dump({k: float(v) for k, v in feat_imp}, f, indent=4)
            
    os.makedirs("ml/models", exist_ok=True)
    joblib.dump(selected_model, "ml/models/phishing_model.joblib")
    with open("ml/models/feature_schema.json", "w") as f:
        json.dump(list(X.columns), f)
        
    with open("ml/artifacts/final_evaluation.json", "w") as f:
        json.dump(report, f, indent=4)

if __name__ == "__main__":
    main()
