import requests
import time

url = "http://3.34.180.38:32165"
count = 100
v1 = v2 = 0

for i in range(count):
    try:
        r = requests.get(url, timeout=3)
        text = r.text.strip()
        if "v1" in text:
            v1 += 1
        elif "v2" in text:
            v2 += 1
    except requests.RequestException:
        pass
    time.sleep(0.1)

total = v1 + v2
print(f"v1: {v1}, v2: {v2}")
if total > 0:
    print(f"v1: {v1*100/total:.1f}% / v2: {v2*100/total:.1f}%")
else:
    print("No valid responses.")
