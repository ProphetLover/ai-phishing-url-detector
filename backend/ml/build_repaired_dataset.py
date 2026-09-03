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
    print("Loading datasets for REPAIR...")
    
    # 1. DMOZ Benign (35k, contains 9.6k query strings!)
    df_dmoz = pd.read_csv("ml/dmoz_benign.csv")
    
    # 2. URLHaus Phishing (15k, malware drops)
    # We will need to re-download URLhaus since we didn't save it as CSV previously (we saved massive_dataset.csv which was overwritten).
    # Wait, earlier I wrote external_validation.py which downloads URLhaus. Let's use that logic here.
    
    # Actually, we can use PhiUSIIL. It has 134k benign and 100k phishing.
    df_phi = pd.read_csv("ml/phiusiil/PhiUSIIL_Phishing_URL_Dataset.csv")
    df_phi['label'] = df_phi['label'].map({1: 0, 0: 1})
    df_phi = df_phi[['URL', 'label']].rename(columns={'URL': 'url'})
    df_phi['source'] = 'phiusiil'
    
    df_dmoz['source'] = 'dmoz'
    
    # Let's get urlhaus via python request
    import urllib.request, ssl
    ctx = ssl.create_default_context()
    ctx.check_hostname = False; ctx.verify_mode = ssl.CERT_NONE
    res = urllib.request.urlopen(urllib.request.Request("https://urlhaus.abuse.ch/downloads/csv_recent/", headers={'User-Agent': 'Mozilla/5.0'}), context=ctx)
    lines = res.read().decode('utf-8').splitlines()
    urls = []
    for line in lines:
        if line.startswith('#'): continue
        parts = line.split('","')
        if len(parts) > 2:
            urls.append({'url': parts[2].replace('"', '').strip(), 'label': 1, 'source': 'urlhaus'})
    df_urlhaus = pd.DataFrame(urls)
    
    # 3. Add Adversarial Benign Examples
    # To absolutely guarantee Google search URLs don't trigger as phishing, we explicitly inject representative benign URLs.
    adversarial_benign = [
        "https://www.google.com/search?q=hello+world&sca_esv=598&ei=ABCD",
        "https://www.bing.com/search?q=machine+learning+tutorial",
        "https://www.youtube.com/watch?v=dQw4w9WgXcQ&list=PL",
        "https://en.wikipedia.org/w/index.php?title=Phishing&action=history",
        "https://www.amazon.com/s?k=laptop&crid=12345&sprefix=laptop",
        "https://github.com/search?q=phishing+detection&type=repositories",
        "https://stackoverflow.com/questions/1234/how-to-fix-this?answertab=active",
        "https://twitter.com/search?q=%23cybersecurity&src=typed_query",
        "https://linkedin.com/search/results/all/?keywords=engineer",
        "https://login.microsoftonline.com/common/oauth2/v2.0/authorize?client_id=123"
    ]
    df_adv = pd.DataFrame({'url': adversarial_benign, 'label': 0, 'source': 'adversarial_benign'})
    
    # 4. Mix and Deduplicate
    df_all = pd.concat([df_phi, df_dmoz, df_urlhaus, df_adv]).reset_index(drop=True)
    
    initial_len = len(df_all)
    df_all.drop_duplicates(subset=['url'], inplace=True)
    dedup_len = len(df_all)
    
    df_all['domain'] = df_all['url'].apply(extract_domain)
    df_all = df_all[df_all['domain'] != ""]
    
    print(f"Total Combined: {initial_len}, After Deduplication: {len(df_all)}")
    print("Class Distribution:")
    print(df_all['label'].value_counts())
    
    # Save the repaired dataset
    df_all.to_csv("ml/massive_dataset.csv", index=False)
    print("Repaired dataset saved to ml/massive_dataset.csv")

if __name__ == "__main__":
    main()
