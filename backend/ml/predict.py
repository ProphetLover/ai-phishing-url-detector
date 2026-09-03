import joblib
import json
import pandas as pd
from feature_extractor import extract_features

class PhishingPredictor:
    def __init__(self, model_path="ml/models/phishing_model.joblib", schema_path="ml/models/feature_schema.json"):
        self.model = joblib.load(model_path)
        with open(schema_path, "r") as f:
            schema = json.load(f)
            if isinstance(schema, list):
                self.feature_columns = schema
                self.model_version = "2.0-massive"
            else:
                self.feature_columns = schema["features"]
                self.model_version = schema.get("model_version", "1.0")
            
    def predict(self, url: str) -> dict:
        # Extract features
        features = extract_features(url)
        
        # Ensure correct order for model input
        feature_vector = []
        important_features = []
        for col in self.feature_columns:
            val = features.get(col, 0)
            feature_vector.append(val)
            
            # Simple heuristic to flag important characteristics for explanation
            if col == 'url_length' and val > 75:
                important_features.append(f"Unusually long URL ({val} chars)")
            elif col == 'count_subdomains' and val > 2:
                important_features.append(f"Excessive subdomains ({val})")
            elif col == 'has_ip_address' and val == 1:
                important_features.append("IP address used as hostname")
            elif col == 'suspicious_keyword_count' and val > 0:
                important_features.append(f"Contains {val} suspicious keywords")
            elif col == 'count_special_chars' and val > 15:
                important_features.append("High number of special characters")
                
        df_input = pd.DataFrame([feature_vector], columns=self.feature_columns)
        
        prediction = self.model.predict(df_input)[0]
        
        confidence = 0.0
        if hasattr(self.model, "predict_proba"):
            probs = self.model.predict_proba(df_input)[0]
            confidence = float(probs[prediction])
        
        result = {
            "prediction": "Phishing" if prediction == 1 else "Legitimate",
            "estimated_risk_score": float(confidence * 100) if prediction == 1 else float((1 - confidence) * 100),
            "model_confidence": float(confidence),
            "model_version": self.model_version,
            "important_features": important_features,
            "raw_features": features
        }
        
        return result

if __name__ == "__main__":
    predictor = PhishingPredictor()
    print(predictor.predict("http://192.168.1.1/login-secure.php"))
