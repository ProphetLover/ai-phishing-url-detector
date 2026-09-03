import pandas as pd
import numpy as np
import os
import sys

sys.path.append(os.path.join(os.path.dirname(__file__), ".."))
from ml.feature_extractor import extract_features

def main():
    if not os.path.exists("ml/massive_dataset.csv"):
        print("Dataset not found.")
        return
        
    df = pd.read_csv("ml/massive_dataset.csv")
    print(f"Total shape: {df.shape}")
    
    print("\nSources distribution:")
    print(df['source'].value_counts())
    
    for source in df['source'].unique():
        sample = df[df['source'] == source].sample(min(1000, len(df[df['source'] == source])), random_state=42)
        ip_count = sum(sample['url'].apply(lambda x: extract_features(x)['has_ip_address']))
        https_count = sum(sample['url'].apply(lambda x: extract_features(x)['is_https']))
        print(f"Source {source} - IP prevalence: {ip_count / len(sample):.4f}, HTTPS prevalence: {https_count / len(sample):.4f}")

if __name__ == "__main__":
    main()
