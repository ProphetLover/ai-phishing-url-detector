import urllib.request
import ssl
import json
import csv

def find_working_dataset():
    urls = [
        "https://raw.githubusercontent.com/chamanthmvs/Phishing-Website-Detection/master/extracted_csv_files/phishing-urls.csv",
        "https://raw.githubusercontent.com/chamanthmvs/Phishing-Website-Detection/master/extracted_csv_files/legitimate-urls.csv",
        "https://raw.githubusercontent.com/ebubekirbbr/phishing_url_detection/master/dataset.csv",
        "https://raw.githubusercontent.com/shreyagopal/Phishing-Website-Detection-by-Machine-Learning-Techniques/master/DataFiles/1.Benign_list_big_final.csv",
        "https://raw.githubusercontent.com/shreyagopal/Phishing-Website-Detection-by-Machine-Learning-Techniques/master/DataFiles/2.phishing.csv",
        "https://raw.githubusercontent.com/rohitksingh/Phishing-Website-Detection/master/data/phishing.csv",
        "https://raw.githubusercontent.com/mitchellkrogza/Phishing.Database/master/phishing-domains-ACTIVE.txt",
        "https://raw.githubusercontent.com/picatz/phishing-domains/master/phishing-domains.txt",
        "https://raw.githubusercontent.com/ALHassans/Phishing-Website-Detection/master/dataset.csv",
        "https://raw.githubusercontent.com/GregaVrbancic/Phishing-Dataset/master/dataset_A.csv"
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
                lines = content.splitlines()
                if len(lines) > 50:
                    print(f"Found good data at {url} ({len(lines)} lines)")
                    with open(f"ml/found_{url.split('/')[-1]}", "w", encoding="utf-8") as f:
                        f.write(content)
        except Exception as e:
            print(f"Failed: {e}")

if __name__ == "__main__":
    find_working_dataset()
