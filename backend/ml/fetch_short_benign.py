import pandas as pd
import random
import urllib.parse

# 1000 common short words
words = ["cat", "dog", "car", "a", "it", "ok", "hi", "hey", "yo", "no", "yes", "up", "go", "do", "be", "me", "we", "he", "is", "in", "on", "at", "to", "as", "by", "or", "of", "an", "if", "so", "run", "eat", "sit", "box", "fun", "sun", "hot", "cold", "new", "old", "big", "small", "red", "blue", "green", "black", "white", "fast", "slow", "good", "bad", "happy", "sad"]

urls = []
for w in words:
    urls.append(f"https://www.google.com/search?q={w}")
    urls.append(f"https://www.bing.com/search?q={w}")
    urls.append(f"https://www.youtube.com/results?search_query={w}")
    urls.append(f"https://amazon.com/s?k={w}")
    urls.append(f"https://twitter.com/search?q={w}")
    urls.append(f"https://en.wikipedia.org/wiki/Special:Search?search={w}")

df = pd.DataFrame({'url': list(set(urls)), 'label': 0, 'source': 'short_benign', 'domain': [urllib.parse.urlparse(u).hostname for u in list(set(urls))]})
df.to_csv("ml/short_benign.csv", index=False)
