import pandas as pd
import urllib.parse
import json

def extract_domain(url):
    try:
        parsed = urllib.parse.urlparse(url if "://" in url else "http://" + url)
        return parsed.hostname or ""
    except:
        return ""

def main():
    print("Loading PhiUSIIL dataset...")
    df = pd.read_csv("ml/phiusiil/PhiUSIIL_Phishing_URL_Dataset.csv")
    
    # In PhiUSIIL, 1 = Legitimate, 0 = Phishing
    # We want 0 = Legitimate, 1 = Phishing
    df['label'] = df['label'].map({1: 0, 0: 1})
    df = df[['URL', 'label']].rename(columns={'URL': 'url'})
    
    initial_len = len(df)
    print(f"Total raw URLs in PhiUSIIL: {initial_len}")
    
    # 1. Exact Deduplication
    df.drop_duplicates(subset=['url'], inplace=True)
    dedup_len = len(df)
    print(f"After exact deduplication: {dedup_len} (Removed {initial_len - dedup_len})")
    
    # 2. Extract Domains for Domain-Aware Splitting
    df['domain'] = df['url'].apply(extract_domain)
    
    # Drop rows without domain
    df = df[df['domain'] != ""]
    final_len = len(df)
    
    # Save the master dataset
    df.to_csv("ml/massive_dataset.csv", index=False)
    print(f"Saved massive_dataset.csv with {final_len} records.")
    
    print("Class distribution:")
    print(df['label'].value_counts())

if __name__ == "__main__":
    main()
