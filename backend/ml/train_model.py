import pandas as pd
import numpy as np
import json
import joblib
import os
from sklearn.model_selection import train_test_split
from sklearn.ensemble import RandomForestClassifier
from sklearn.tree import DecisionTreeClassifier
from sklearn.linear_model import LogisticRegression
from sklearn.metrics import accuracy_score, precision_score, recall_score, f1_score, confusion_matrix, roc_auc_score
from feature_extractor import extract_features

def evaluate_model(model, X_test, y_test, name):
    y_pred = model.predict(X_test)
    y_prob = model.predict_proba(X_test)[:, 1] if hasattr(model, "predict_proba") else None
    
    metrics = {
        "accuracy": accuracy_score(y_test, y_pred),
        "precision": precision_score(y_test, y_pred, zero_division=0),
        "recall": recall_score(y_test, y_pred, zero_division=0),
        "f1": f1_score(y_test, y_pred, zero_division=0),
        "confusion_matrix": confusion_matrix(y_test, y_pred).tolist()
    }
    
    if y_prob is not None:
        try:
            metrics["roc_auc"] = roc_auc_score(y_test, y_prob)
        except:
            metrics["roc_auc"] = None
            
    print(f"[{name}] Accuracy: {metrics['accuracy']:.4f} | F1: {metrics['f1']:.4f}")
    return metrics

def train_pipeline():
    print("Loading dataset...")
    df = pd.read_csv("ml/dataset.csv")
    
    # Drop NAs
    df.dropna(subset=['url', 'label'], inplace=True)
    df['label'] = df['label'].astype(int)
    
    print(f"Dataset shape: {df.shape}")
    print(f"Class distribution:\n{df['label'].value_counts()}")
    
    print("Extracting features from URLs...")
    # This might take a bit for 10k rows
    features_list = df['url'].apply(extract_features).tolist()
    X = pd.DataFrame(features_list)
    y = df['label']
    
    print("Splitting dataset...")
    X_train, X_test, y_train, y_test = train_test_split(
        X, y, test_size=0.2, random_state=42, stratify=y
    )
    
    models = {
        "LogisticRegression": LogisticRegression(max_iter=1000, random_state=42),
        "DecisionTree": DecisionTreeClassifier(random_state=42),
        "RandomForest": RandomForestClassifier(n_estimators=100, random_state=42)
    }
    
    results = {}
    best_f1 = 0
    best_model_name = ""
    best_model = None
    
    print("Training models...")
    for name, model in models.items():
        model.fit(X_train, y_train)
        metrics = evaluate_model(model, X_test, y_test, name)
        results[name] = metrics
        
        if metrics["f1"] > best_f1:
            best_f1 = metrics["f1"]
            best_model_name = name
            best_model = model
            
    print(f"\nBest Model: {best_model_name} with F1: {best_f1:.4f}")
    
    # Save artifacts
    os.makedirs("ml/artifacts", exist_ok=True)
    os.makedirs("ml/models", exist_ok=True)
    
    with open("ml/artifacts/metrics.json", "w") as f:
        json.dump(results[best_model_name], f, indent=4)
        
    with open("ml/artifacts/model_comparison.json", "w") as f:
        json.dump(results, f, indent=4)
        
    # Save best model
    joblib.dump(best_model, "ml/models/phishing_model.joblib")
    
    # Save feature schema
    feature_columns = X.columns.tolist()
    with open("ml/models/feature_schema.json", "w") as f:
        json.dump({"features": feature_columns, "model_version": "1.0"}, f, indent=4)
        
    print("Training complete. Artifacts saved.")

if __name__ == "__main__":
    train_pipeline()
