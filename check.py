import urllib.request
import re
html = urllib.request.urlopen('https://jogja-court.vercel.app/assets/index-CuZ3a32j.js').read().decode('utf-8')
print('API_URL in JS:', re.findall(r'http://127\.0\.0\.1:8000|jogjacourtapi', html))
