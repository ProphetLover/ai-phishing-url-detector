import urllib.request
import ssl
import json
import pandas as pd
import io
import os

def bypass_ssl_fetch(url):
    ctx = ssl.create_default_context()
    ctx.check_hostname = False
    ctx.verify_mode = ssl.CERT_NONE
    req = urllib.request.Request(url, headers={'User-Agent': 'Mozilla/5.0'})
    return urllib.request.urlopen(req, context=ctx).read()

print("Downloading Shreya Gopal's Benign Dataset...")
benign_url = "https://raw.githubusercontent.com/shreyagopal/Phishing-Website-Detection-by-Machine-Learning-Techniques/master/DataFiles/1.Benign_list_big_final.csv"
data = bypass_ssl_fetch(benign_url)
lines = data.decode('utf-8').splitlines()

urls = []
for line in lines:
    if "http" in line:
        urls.append(line.strip())

df_benign = pd.DataFrame({'url': urls, 'label': 0, 'source': 'dmoz'})
print(f"Loaded {len(df_benign)} benign URLs.")
print(f"Queries in benign: {sum('?' in url for url in df_benign['url'])}")
df_benign.to_csv("ml/dmoz_benign.csv", index=False)
