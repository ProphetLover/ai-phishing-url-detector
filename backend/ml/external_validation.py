import pandas as pd
import numpy as np
import urllib.request
import urllib.parse
import ssl
import json
import joblib
from sklearn.metrics import accuracy_score, precision_score, recall_score, f1_score, roc_auc_score, confusion_matrix
import sys
import os

sys.path.append(os.path.join(os.path.dirname(__file__), ".."))
from ml.feature_extractor import extract_features

def download_urlhaus():
    ctx = ssl.create_default_context()
    ctx.check_hostname = False
    ctx.verify_mode = ssl.CERT_NONE
    
    urlhaus_url = "https://urlhaus.abuse.ch/downloads/csv_recent/"
    req = urllib.request.Request(urlhaus_url, headers={'User-Agent': 'Mozilla/5.0'})
    response = urllib.request.urlopen(req, context=ctx)
    lines = response.read().decode('utf-8').splitlines()
    
    urls = []
    for line in lines:
        if line.startswith('#'): continue
        parts = line.split('","')
        if len(parts) > 2:
            url = parts[2].replace('"', '').strip()
            urls.append({'url': url, 'label': 1})
            if len(urls) >= 5000:
                break
    return pd.DataFrame(urls)

def extract_domain(url):
    try:
        parsed = urllib.parse.urlparse(url if "://" in url else "http://" + url)
        return parsed.hostname or ""
    except:
        return ""

def main():
    print("Loading Frozen Model...")
    model = joblib.load("ml/models/phishing_model.joblib")
    with open("ml/models/feature_schema.json", "r") as f:
        schema = json.load(f)
        
    print("Downloading external dataset (URLHaus)...")
    df_ext = download_urlhaus()
    print(f"External URLs: {len(df_ext)}")
    
    print("Extracting features...")
    features_list = df_ext['url'].apply(extract_features).tolist()
    X_ext = pd.DataFrame(features_list)[schema] # Ensure order matches schema
    y_ext = df_ext['label']
    
    print("Evaluating External Set...")
    preds = model.predict(X_ext)
    
    acc = accuracy_score(y_ext, preds)
    print(f"External Recall (Accuracy on 100% Malicious): {acc:.4f}")
    
    results = {
        "external_validation": {
            "source": "URLHaus",
            "type": "Malware/Phishing",
            "size": len(df_ext),
            "recall": acc
        },
        "temporal_validation": "Not possible (PhiUSIIL dataset lacks chronological timestamps per URL)"
    }
    
    with open("ml/artifacts/external_validation.json", "w") as f:
        json.dump(results, f, indent=4)
        
    print("External validation complete.")

if __name__ == "__main__":
    main()
