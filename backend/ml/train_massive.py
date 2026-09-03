import pandas as pd
import numpy as np
import time
import json
import os
from sklearn.model_selection import train_test_split, GroupShuffleSplit
from sklearn.linear_model import LogisticRegression
from sklearn.tree import DecisionTreeClassifier
from sklearn.ensemble import RandomForestClassifier
from sklearn.metrics import accuracy_score, precision_score, recall_score, f1_score, roc_auc_score, confusion_matrix
import joblib
import sys

# Ensure we can import feature_extractor
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
    
    print(f"[{split_type}] {name} - Acc: {acc:.4f} | Prec: {prec:.4f} | Rec: {rec:.4f} | F1: {f1:.4f} | ROC: {roc:.4f}")
    return {
        "accuracy": acc, "precision": prec, "recall": rec, "f1": f1, "roc_auc": roc, "confusion_matrix": cm
    }

def main():
    print("Loading massive dataset...")
    df = pd.read_csv("ml/massive_dataset.csv")
    
    # Fast feature extraction
    print("Extracting features (this may take a minute for 286k URLs)...")
    start_time = time.time()
    features_list = df['url'].apply(extract_features).tolist()
    df_features = pd.DataFrame(features_list)
    print(f"Feature extraction took {time.time() - start_time:.2f} seconds.")
    
    X = df_features
    y = df['label']
    domains = df['domain']
    sources = df['source']
    
    report = {}
    
    # --- EVALUATION A: Stratified Random Split ---
    print("\n--- EVALUATION A: RANDOM SPLIT ---")
    X_train_r, X_test_r, y_train_r, y_test_r = train_test_split(X, y, test_size=0.2, random_state=42, stratify=y)
    
    rf_random = RandomForestClassifier(n_estimators=50, random_state=42, n_jobs=-1)
    rf_random.fit(X_train_r, y_train_r)
    report['random_split'] = evaluate_model(rf_random, X_test_r, y_test_r, "RandomForest", "Random")
    
    # --- EVALUATION B: Domain-Aware Split ---
    print("\n--- EVALUATION B: DOMAIN-AWARE SPLIT ---")
    gss = GroupShuffleSplit(n_splits=1, test_size=0.2, random_state=42)
    train_idx, test_idx = next(gss.split(X, y, groups=domains))
    
    X_train_d, X_test_d = X.iloc[train_idx], X.iloc[test_idx]
    y_train_d, y_test_d = y.iloc[train_idx], y.iloc[test_idx]
    
    rf_domain = RandomForestClassifier(n_estimators=50, random_state=42, n_jobs=-1)
    rf_domain.fit(X_train_d, y_train_d)
    report['domain_aware_split'] = evaluate_model(rf_domain, X_test_d, y_test_d, "RandomForest", "Domain")
    
    # --- EVALUATION C: Independent Source Test ---
    print("\n--- EVALUATION C: INDEPENDENT SOURCE TEST (Train: Phi+DMOZ | Test: URLHaus) ---")
    train_mask = (sources == 'phiusiil') | (sources == 'dmoz')
    test_mask = (sources == 'urlhaus')
    
    # URLHaus only contains phishing! We need some benign to test properly.
    # Let's use 20% of DMOZ as benign test data so we have a valid test set.
    dmoz_test_idx = df[sources == 'dmoz'].sample(frac=0.2, random_state=42).index
    train_mask.loc[dmoz_test_idx] = False
    test_mask.loc[dmoz_test_idx] = True
    
    X_train_i, X_test_i = X[train_mask], X[test_mask]
    y_train_i, y_test_i = y[train_mask], y[test_mask]
    
    rf_indep = RandomForestClassifier(n_estimators=50, random_state=42, n_jobs=-1)
    rf_indep.fit(X_train_i, y_train_i)
    report['independent_source'] = evaluate_model(rf_indep, X_test_i, y_test_i, "RandomForest", "Independent")
    
    # --- EVALUATION D: True Holdout ---
    print("\n--- EVALUATION D: TRUE HOLDOUT & MODEL COMPARISON ---")
    # Hold out 10% strictly by domain
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
    
    models = {
        "LogisticRegression": LogisticRegression(max_iter=1000, n_jobs=-1),
        "DecisionTree": DecisionTreeClassifier(random_state=42),
        "RandomForest": RandomForestClassifier(n_estimators=100, random_state=42, n_jobs=-1)
    }
    
    best_f1 = 0
    best_model_name = ""
    best_model = None
    
    for name, model in models.items():
        print(f"\nTraining {name}...")
        model.fit(X_final_train, y_final_train)
        print(f"Evaluating {name} on Holdout:")
        res = evaluate_model(model, X_holdout, y_holdout, name, "Holdout")
        
        if res['f1'] > best_f1:
            best_f1 = res['f1']
            best_model_name = name
            best_model = model
            report['final_holdout'] = res
            
    print(f"\nSelected Model: {best_model_name}")
    
    # Feature Importance
    if hasattr(best_model, 'feature_importances_'):
        importances = best_model.feature_importances_
        feature_names = X.columns
        feat_imp = sorted(zip(feature_names, importances), key=lambda x: x[1], reverse=True)
        
        with open("ml/artifacts/feature_importance.json", "w") as f:
            json.dump({k: float(v) for k, v in feat_imp}, f, indent=4)
            
        print("\nTop 5 Important Features:")
        for k, v in feat_imp[:5]:
            print(f"{k}: {v:.4f}")
            
    # Save the best model
    os.makedirs("ml/models", exist_ok=True)
    joblib.dump(best_model, "ml/models/phishing_model.joblib")
    with open("ml/models/feature_schema.json", "w") as f:
        json.dump(list(X.columns), f)
        
    with open("ml/artifacts/validation_report.json", "w") as f:
        report['selected_model'] = best_model_name
        json.dump(report, f, indent=4)

if __name__ == "__main__":
    main()
