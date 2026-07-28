import traceback, pickle, os
from fpdf import FPDF
from app.services.report_exporter import export_pdf

files = os.listdir('.cache/reports')
report_id = files[-1].replace('.pkl', '')
with open(os.path.join('.cache/reports', f'{report_id}.pkl'), 'rb') as f:
    report = pickle.load(f)

try:
    pdf_bytes = export_pdf(report)
    print("SUCCESS")
except Exception as e:
    traceback.print_exc()
