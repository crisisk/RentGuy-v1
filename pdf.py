from reportlab.lib.pagesizes import A4
from reportlab.pdfgen import canvas
from io import BytesIO
from datetime import datetime

def build_transport_pdf(route, stops, vehicle, driver):
    buf = BytesIO()
    c = canvas.Canvas(buf, pagesize=A4)
    c.setFont("Helvetica-Bold", 14)
    c.drawString(40, 800, "Transportbrief")
    c.setFont("Helvetica", 10)
    c.drawString(40, 780, f"Route ID: {route.id}  | Project: {route.project_id}  | Datum: {route.date}")
    c.drawString(40, 765, f"Voertuig: {vehicle.name} ({vehicle.plate})  | Chauffeur: {driver.name} ({driver.phone})")
    y = 740
    c.setFont("Helvetica-Bold", 11); c.drawString(40, y, "Stops:"); y -= 16
    c.setFont("Helvetica", 10)
    for s in stops:
        c.drawString(40, y, f"{s.sequence}. {s.address}  ({s.contact_name}, {s.contact_phone})  ETA {s.eta} / ETD {s.etd}")
        y -= 14
        if y < 60:
            c.showPage(); y = 800
    c.setFont("Helvetica-Oblique", 9)
    c.drawString(40, y-10, f"Gegenereerd op {datetime.utcnow()}")
    c.showPage(); c.save()
    buf.seek(0)
    return buf.getvalue()
