import urllib.request
import ssl
import json
import os

def download_dataset():
    # Kaggle dataset mirrored on Github by various authors
    # Let's try to get one of them
    urls = [
        "https://raw.githubusercontent.com/sayakpaul/Phishing-Websites-Detection/master/Phishing.csv",
        "https://raw.githubusercontent.com/chamanthmvs/Phishing-Website-Detection/master/extracted_csv_files/phishing-urls.csv"
    ]
    
    ctx = ssl.create_default_context()
    ctx.check_hostname = False
    ctx.verify_mode = ssl.CERT_NONE

    for url in urls:
        print(f"Trying {url}...")
        try:
            req = urllib.request.Request(url)
            with urllib.request.urlopen(req, context=ctx) as response:
                content = response.read().decode('utf-8')
                with open("ml/raw_dataset.csv", "w", encoding="utf-8") as f:
                    f.write(content)
                print("Download successful!")
                return
        except Exception as e:
            print(f"Failed: {e}")

if __name__ == "__main__":
    download_dataset()
