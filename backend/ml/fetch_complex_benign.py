import urllib.request
import urllib.parse
import json
import pandas as pd

urls = []

print("Fetching Wikipedia...")
rccontinue = ""
for i in range(10): # 5000 urls
    try:
        api_url = f"https://en.wikipedia.org/w/api.php?action=query&list=recentchanges&rcprop=title&rclimit=500&format=json"
        if rccontinue:
            api_url += f"&rccontinue={rccontinue}"
        req = urllib.request.Request(api_url, headers={'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)'})
        res = urllib.request.urlopen(req).read()
        data = json.loads(res)
        for item in data['query']['recentchanges']:
            title = urllib.parse.quote(item['title'])
            urls.append(f"https://en.wikipedia.org/w/index.php?title={title}&action=history")
            urls.append(f"https://en.wikipedia.org/w/index.php?title={title}&diff=prev&oldid=123456")
            urls.append(f"https://en.wikipedia.org/wiki/Special:Search?search={title}&fulltext=1")
        if 'continue' in data:
            rccontinue = data['continue']['rccontinue']
        else:
            break
    except Exception as e:
        print(e)
        pass

# Add a bunch of Google queries based on Wikipedia titles to simulate Google searches authentically
print("Generating Google Search URLs...")
try:
    for u in urls[:5000]:
        # Extract title from Wikipedia URL for search term
        if "title=" in u:
            term = u.split("title=")[1].split("&")[0]
            urls.append(f"https://www.google.com/search?q={term}&sourceid=chrome&ie=UTF-8")
            urls.append(f"https://www.google.com/search?q={term}&tbm=isch")
            urls.append(f"https://www.bing.com/search?q={term}&form=QBLH")
            urls.append(f"https://www.youtube.com/results?search_query={term}")
except:
    pass

print(f"Generated {len(urls)} real complex query URLs.")
df = pd.DataFrame({'url': list(set(urls)), 'label': 0, 'source': 'complex_benign_api'})
df.to_csv("ml/complex_benign.csv", index=False)
print("Saved to ml/complex_benign.csv")
