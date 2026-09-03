import urllib.request
import ssl
import csv

def create_dataset():
    ctx = ssl.create_default_context()
    ctx.check_hostname = False
    ctx.verify_mode = ssl.CERT_NONE

    dataset = []

    # 1. Download Benign URLs (with realistic paths to prevent Data Leakage)
    print("Downloading DMOZ-based benign URLs (with paths)...")
    try:
        benign_url = "https://raw.githubusercontent.com/shreyagopal/Phishing-Website-Detection-by-Machine-Learning-Techniques/master/DataFiles/1.Benign_list_big_final.csv"
        req = urllib.request.Request(benign_url, headers={'User-Agent': 'Mozilla/5.0'})
        response = urllib.request.urlopen(req, context=ctx)
        lines = response.read().decode('utf-8').splitlines()
        
        # Take 5000 as benign
        # Some lines might be empty or invalid, just take the first 5000 valid ones
        count = 0
        for line in lines:
            if "http" in line:
                dataset.append({"url": line.strip(), "label": 0})
                count += 1
                if count >= 5000:
                    break
        print(f"Added {count} benign URLs.")
    except Exception as e:
        print(f"Failed to get benign URLs: {e}")

    # 2. Download Malicious URLs (URLhaus recent)
    print("Downloading URLhaus for malicious URLs...")
    try:
        urlhaus_url = "https://urlhaus.abuse.ch/downloads/csv_recent/"
        req = urllib.request.Request(urlhaus_url, headers={'User-Agent': 'Mozilla/5.0'})
        response = urllib.request.urlopen(req, context=ctx)
        lines = response.read().decode('utf-8').splitlines()
        
        malicious_count = 0
        for line in lines:
            if line.startswith('#'): continue
            parts = line.split('","')
            if len(parts) > 2:
                url = parts[2].replace('"', '').strip()
                dataset.append({"url": url, "label": 1})
                malicious_count += 1
                if malicious_count >= 5000:
                    break
        print(f"Added {malicious_count} malicious URLs.")
    except Exception as e:
        print(f"Failed to get URLhaus: {e}")

    # 3. Save to CSV
    if len(dataset) > 0:
        with open("ml/dataset.csv", "w", newline="", encoding="utf-8") as f:
            writer = csv.DictWriter(f, fieldnames=["url", "label"])
            writer.writeheader()
            writer.writerows(dataset)
        print(f"Dataset successfully created with {len(dataset)} records at ml/dataset.csv")

if __name__ == "__main__":
    create_dataset()
