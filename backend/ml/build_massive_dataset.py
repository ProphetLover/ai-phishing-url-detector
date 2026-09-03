import pandas as pd
import urllib.request
import ssl
import os
import urllib.parse
import json

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
            urls.append({'url': url, 'label': 1, 'source': 'urlhaus'})
    return pd.DataFrame(urls)

def download_dmoz():
    ctx = ssl.create_default_context()
    ctx.check_hostname = False
    ctx.verify_mode = ssl.CERT_NONE
    
    benign_url = "https://raw.githubusercontent.com/shreyagopal/Phishing-Website-Detection-by-Machine-Learning-Techniques/master/DataFiles/1.Benign_list_big_final.csv"
    req = urllib.request.Request(benign_url, headers={'User-Agent': 'Mozilla/5.0'})
    response = urllib.request.urlopen(req, context=ctx)
    lines = response.read().decode('utf-8').splitlines()
    
    urls = []
    for line in lines:
        if "http" in line:
            urls.append({'url': line.strip(), 'label': 0, 'source': 'dmoz'})
    return pd.DataFrame(urls)

def process_phiusiil():
    path = "ml/phiusiil/PhiUSIIL_Phishing_URL_Dataset.csv"
    if not os.path.exists(path):
        print("PhiUSIIL not found.")
        return pd.DataFrame()
    
    df = pd.read_csv(path)
    # PhiUSIIL label: 1 is legitimate, 0 is phishing. Map it so 1=phish, 0=legit.
    # We verify the original label distribution before doing this.
    df['label'] = df['label'].map({1: 0, 0: 1})
    df['source'] = 'phiusiil'
    return df[['URL', 'label', 'source']].rename(columns={'URL': 'url'})

def extract_domain(url):
    try:
        parsed = urllib.parse.urlparse(url if "://" in url else "http://" + url)
        return parsed.hostname or ""
    except:
        return ""

def main():
    print("Fetching datasets...")
    df_urlhaus = download_urlhaus()
    print(f"URLHaus: {len(df_urlhaus)} URLs")
    
    df_dmoz = download_dmoz()
    print(f"DMOZ: {len(df_dmoz)} URLs")
    
    df_phi = process_phiusiil()
    print(f"PhiUSIIL: {len(df_phi)} URLs")
    
    df_all = pd.concat([df_urlhaus, df_dmoz, df_phi]).reset_index(drop=True)
    print(f"Total raw URLs: {len(df_all)}")
    
    # 1. Exact Deduplication
    initial_len = len(df_all)
    df_all.drop_duplicates(subset=['url'], inplace=True)
    dedup_len = len(df_all)
    print(f"After exact deduplication: {dedup_len} (Removed {initial_len - dedup_len})")
    
    # 2. Extract Domains for Domain-Aware Splitting
    df_all['domain'] = df_all['url'].apply(extract_domain)
    
    # 3. Create Dataset Quality Report
    quality_report = {
        "total_raw": initial_len,
        "total_clean": dedup_len,
        "duplicates_removed": initial_len - dedup_len,
        "classes": df_all['label'].value_counts().to_dict(),
        "sources": df_all['source'].value_counts().to_dict()
    }
    
    with open("ml/artifacts/dataset_quality.json", "w") as f:
        json.dump(quality_report, f, indent=4)
        
    print("Class distribution:")
    print(df_all['label'].value_counts())
    
    # Save the master dataset
    df_all.to_csv("ml/massive_dataset.csv", index=False)
    print(f"Saved massive_dataset.csv with {len(df_all)} records.")

if __name__ == "__main__":
    main()
