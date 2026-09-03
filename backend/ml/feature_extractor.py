import urllib.parse
import re
import math

# Keywords often found in phishing URLs
SUSPICIOUS_KEYWORDS = [
    'login', 'secure', 'account', 'update', 'verify', 'bank', 'signin', 
    'auth', 'confirm', 'service', 'support', 'security', 'billing', 'recover',
    'admin', 'password', 'credential', 'webscr', 'wallet', 'crypto'
]

def entropy(s):
    if not s:
        return 0
    p, lns = {}, float(len(s))
    for c in s: p[c] = p.get(c, 0) + 1
    return -sum(count/lns * math.log2(count/lns) for count in p.values())

def extract_features(url: str) -> dict:
    """
    Extracts lexical and structural features from a URL string 
    WITHOUT making any network requests.
    """
    # Fallback/normalization for parsing if missing scheme
    parsed_url = url if "://" in url else "http://" + url
    parsed = urllib.parse.urlparse(parsed_url)
    
    hostname = parsed.hostname or ""
    path = parsed.path or ""
    query = parsed.query or ""
    fragment = parsed.fragment or ""
    
    # Basic Lengths
    features = {}
    features['url_length'] = len(url)
    features['hostname_length'] = len(hostname)
    features['path_length'] = len(path)
    features['query_length'] = len(query)
    
    # Character counts in the full URL
    features['count_dots'] = url.count('.')
    features['count_hyphens'] = url.count('-')
    features['count_underscores'] = url.count('_')
    features['count_question_marks'] = url.count('?')
    features['count_equals'] = url.count('=')
    features['count_ampersands'] = url.count('&')
    features['count_percentages'] = url.count('%')
    
    features['count_digits'] = sum(c.isdigit() for c in url)
    features['count_special_chars'] = sum(not c.isalnum() for c in url)
    
    # Structural features
    # A standard domain has 1 dot (e.g. example.com). More might mean subdomains.
    features['count_subdomains'] = hostname.count('.') if hostname.count('.') > 1 else 0
    
    features['has_at_symbol'] = 1 if '@' in url else 0
    
    # IP address in hostname
    # Regex to match IPv4
    ipv4_pattern = re.compile(r"^(?:[0-9]{1,3}\.){3}[0-9]{1,3}$")
    features['has_ip_address'] = 1 if ipv4_pattern.search(hostname) else 0
    
    features['is_https'] = 1 if parsed.scheme == 'https' else 0
    
    # Suspicious keywords
    url_lower = url.lower()
    features['suspicious_keyword_count'] = sum(1 for kw in SUSPICIOUS_KEYWORDS if kw in url_lower)
    
    # Entropy of hostname (phishing domains sometimes look random like d3jka8.com)
    features['hostname_entropy'] = entropy(hostname)
    
    return features

if __name__ == "__main__":
    test_urls = [
        "https://www.google.com",
        "http://192.168.1.1/login.php",
        "https://secure-update-account.bank.com.xyz/verify?id=123",
        "http://login.yahoo.com.uk-verify-auth.xyz/home"
    ]
    for t in test_urls:
        print(f"URL: {t}")
        print(extract_features(t))
        print("-" * 40)
