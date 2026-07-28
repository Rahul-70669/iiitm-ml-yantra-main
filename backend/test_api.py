import os, requests
files = os.listdir('.cache/reports')
if not files:
    exit()
report_id = files[-1].replace('.pkl', '')
url = f'http://localhost:8000/reports/download/{report_id}/pdf'
r = requests.get(url)
print("HTTP GET Status:", r.status_code)
if r.status_code == 500:
    print(r.text[:300])
