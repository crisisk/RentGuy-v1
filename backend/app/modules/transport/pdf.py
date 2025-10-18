from reportlab.lib import colors
from reportlab.lib.pagesizes import A4
from reportlab.pdfgen import canvas
from io import BytesIO
from datetime import datetime


def _header(c: canvas.Canvas, route, vehicle, driver) -> None:
    c.setFillColorRGB(0.09, 0.17, 0.33)
    c.rect(0, 812, 595, 30, fill=1, stroke=0)
    c.setFillColor(colors.white)
    c.setFont("Helvetica-Bold", 16)
    c.drawString(20, 822, "RentGuy Logistics – Transportbrief")
    c.setFont("Helvetica", 9)
    c.drawRightString(575, 822, datetime.utcnow().strftime("Gegenereerd op %d-%m-%Y %H:%M"))
    c.setFillColor(colors.black)

    c.setFont("Helvetica-Bold", 12)
    c.drawString(20, 790, f"Route #{route.id}")
    c.setFont("Helvetica", 10)
    c.drawString(20, 775, f"Project: {route.project_id}  | Datum: {route.date}  | Status: {route.status}")
    c.drawString(20, 760, f"Voertuig: {vehicle.name} ({vehicle.plate}) – Capaciteit {vehicle.capacity_kg} kg / {vehicle.volume_m3} m³")
    c.drawString(20, 745, f"Chauffeur: {driver.name}  | Licenties: {driver.license_types}  | Contact: {driver.phone}")


def _stops_table(c: canvas.Canvas, stops, route, vehicle, driver) -> float:
    y = 720
    c.setFont("Helvetica-Bold", 11)
    c.drawString(20, y, "Stop planning")
    y -= 12
    c.setLineWidth(0.5)
    c.line(20, y, 575, y)
    y -= 16
    c.setFont("Helvetica", 9)
    for stop in stops:
        lines = [
            f"{stop.sequence}. {stop.address}",
            f"Contact: {stop.contact_name} – {stop.contact_phone}",
            f"ETA: {stop.eta}   ETD: {stop.etd}",
        ]
        for line in lines:
            c.drawString(30, y, line)
            y -= 12
        c.setStrokeColor(colors.lightgrey)
        c.line(25, y + 6, 570, y + 6)
        c.setStrokeColor(colors.black)
        y -= 6
        if y < 140:
            c.showPage()
            _header(c, route, vehicle, driver)
            y = 720
    return y


def _signature_block(c: canvas.Canvas, y: float) -> None:
    y = max(y, 120)
    c.setFont("Helvetica-Bold", 11)
    c.drawString(20, y, "Aflevering & handtekening")
    y -= 16
    c.setFont("Helvetica", 9)
    c.drawString(25, y, "Opmerkingen:____________________________________________________________")
    y -= 14
    c.drawString(25, y, "Handtekening chauffeur: _____________________________ Datum: ____________")
    y -= 14
    c.drawString(25, y, "Handtekening klant:     _____________________________ Datum: ____________")


def build_transport_pdf(route, stops, vehicle, driver):
    buf = BytesIO()
    c = canvas.Canvas(buf, pagesize=A4)
    _header(c, route, vehicle, driver)
    y = _stops_table(c, stops, route, vehicle, driver)
    _signature_block(c, y)
    c.showPage()
    c.save()
    buf.seek(0)
    return buf.getvalue()
