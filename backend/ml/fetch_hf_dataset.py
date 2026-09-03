import urllib.request
import ssl
import json
import pandas as pd
import io

def bypass_ssl_fetch(url):
    ctx = ssl.create_default_context()
    ctx.check_hostname = False
    ctx.verify_mode = ssl.CERT_NONE
    req = urllib.request.Request(url, headers={'User-Agent': 'Mozilla/5.0'})
    return urllib.request.urlopen(req, context=ctx).read()

parquet_url = "https://huggingface.co/datasets/ealvaradob/phishing-dataset/resolve/main/data/train-00000-of-00001-c88f4bfeb5d7da01.parquet"

print("Trying ealvaradob/phishing-dataset...")
try:
    data = bypass_ssl_fetch(parquet_url)
    df = pd.read_parquet(io.BytesIO(data))
    print(df.head())
    print(df.columns)
    if 'status' in df.columns:
        print(df['status'].value_counts())
    elif 'label' in df.columns:
        print(df['label'].value_counts())
except Exception as e:
    print("Failed to fetch ealvaradob:", e)
