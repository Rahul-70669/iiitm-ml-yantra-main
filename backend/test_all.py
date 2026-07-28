import os, pickle
from app.services.report_exporter import export_pdf

files = [f for f in os.listdir('.cache/reports') if f.endswith('.pkl')]
print(f"Testing {len(files)} reports locally")
failed = 0
for f in files:
    try:
        report_id = f.replace('.pkl', '')
        with open(os.path.join('.cache/reports', f), 'rb') as fp:
            report = pickle.load(fp)
        pdf_bytes = export_pdf(report)
        print(f"SUCCESS: {report_id} ({len(pdf_bytes)} bytes)")
    except Exception as e:
        import traceback
        print(f"FAILED locally: {report_id} - {str(e)}")
        traceback.print_exc()
        failed += 1

print(f"Total failed locally: {failed}")
