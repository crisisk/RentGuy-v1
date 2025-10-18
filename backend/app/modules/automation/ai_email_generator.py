"""
AI-powered email generator using OpenRouter API.
Generates personalized customer auto-response emails based on lead details.
"""

import logging
import os
from typing import Dict, Optional
import requests

logger = logging.getLogger(__name__)

# OpenRouter configuration
OPENROUTER_API_KEY = os.getenv("OPENROUTER_API_KEY", "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")
OPENROUTER_BASE_URL = "https://openrouter.ai/api/v1"


def generate_personalized_email(
    customer_name: str,
    event_type: str,
    event_date: str,
    package_requested: str,
    message: str,
    company_name: str = "Mister DJ",
    company_email: str = "info@mr-dj.nl",
    company_phone: str = "+31 20 123 4567"
) -> Dict[str, str]:
    """
    Generate a personalized email using OpenRouter AI.

    Args:
        customer_name: Name of the customer
        event_type: Type of event (bruiloft, verjaardag, etc.)
        event_date: Date of the event
        package_requested: Package the customer is interested in
        message: Customer's message/request
        company_name: Name of the company
        company_email: Company email
        company_phone: Company phone

    Returns:
        Dict with 'subject', 'body_text', and 'body_html' keys
    """
    try:
        # Build context-aware prompt for email generation
        prompt = f"""Je bent een professionele medewerker van {company_name}, een premium DJ en entertainmentbedrijf in Nederland.

Een klant heeft zojuist een aanvraag gedaan via de website. Schrijf een warme, professionele en gepersonaliseerde bevestigingsmail in het Nederlands.

KLANTGEGEVENS:
- Naam: {customer_name}
- Event type: {event_type}
- Event datum: {event_date}
- Gewenst pakket: {package_requested}
- Bericht van klant: {message}

BEDRIJFSGEGEVENS:
- Bedrijf: {company_name}
- Email: {company_email}
- Telefoon: {company_phone}
- USP: "100% Dansgarantie"
- Website: www.mr-dj.nl

INSTRUCTIES:
1. Begin met een warme begroeting met de naam van de klant
2. Bevestig dat je hun aanvraag hebt ontvangen
3. Toon enthousiasme over hun specifieke event type en pakketkeuze
4. Ga in op hun specifieke bericht/vraag als ze die hebben gesteld
5. Geef een timeline aan (binnen 24 uur contact)
6. Noem enkele relevante highlights/voordelen voor hun specifieke event type
7. Voeg contactinformatie toe voor dringende vragen
8. Eindig met een vriendelijke groet
9. Gebruik emoji's spaarzaam maar passend (✅ voor bevestiging, 🎵 voor muziek, 🎉 voor feest, etc.)
10. Tone: Professioneel maar toegankelijk, enthousiast maar niet overdreven

BELANGRIJK:
- Schrijf natuurlijk Nederlands (geen letterlijke vertaling van Engels)
- Maak het persoonlijk - geen generieke template
- Wees specifiek over het event type
- Gebruik de "100% Dansgarantie" USP

Genereer een email met:
1. Een pakkende subject line (max 60 karakters)
2. Een plain text versie
3. Een HTML versie met eenvoudige opmaak (<p>, <strong>, <br>, <ul>, <li>)

Formatteer je antwoord EXACT als volgt:
SUBJECT: [subject line hier]

TEXT:
[plain text email hier]

HTML:
[HTML email hier - gebruik <p>, <strong>, <br>, <ul>, <li> tags]
"""

        # Call OpenRouter API
        headers = {
            "Authorization": f"Bearer {OPENROUTER_API_KEY}",
            "Content-Type": "application/json",
            "HTTP-Referer": "https://rentguy.nl",
            "X-Title": "RentGuy CRM"
        }

        payload = {
            "model": "anthropic/claude-3.5-haiku",  # Fast and cost-effective
            "messages": [
                {
                    "role": "user",
                    "content": prompt
                }
            ],
            "temperature": 0.7,
            "max_tokens": 1500
        }

        logger.info(f"Calling OpenRouter API to generate personalized email for {customer_name}")

        response = requests.post(
            f"{OPENROUTER_BASE_URL}/chat/completions",
            headers=headers,
            json=payload,
            timeout=30
        )

        if response.status_code != 200:
            logger.error(f"OpenRouter API error: {response.status_code} - {response.text}")
            return None

        result = response.json()
        generated_content = result["choices"][0]["message"]["content"]

        # Parse the generated content
        email_parts = _parse_generated_email(generated_content)

        if email_parts:
            logger.info(f"✅ Successfully generated personalized email for {customer_name}")
            return email_parts
        else:
            logger.error("Failed to parse generated email content")
            return None

    except requests.exceptions.Timeout:
        logger.error("OpenRouter API request timed out")
        return None
    except Exception as e:
        logger.error(f"Error generating personalized email: {e}", exc_info=True)
        return None


def _parse_generated_email(content: str) -> Optional[Dict[str, str]]:
    """
    Parse the generated email content into structured parts.

    Args:
        content: Raw generated content from AI

    Returns:
        Dict with subject, body_text, and body_html or None if parsing fails
    """
    try:
        # Split content by sections
        lines = content.strip().split('\n')

        subject = ""
        text_content = []
        html_content = []

        current_section = None

        for line in lines:
            line_stripped = line.strip()

            if line_stripped.startswith("SUBJECT:"):
                subject = line_stripped.replace("SUBJECT:", "").strip()
            elif line_stripped == "TEXT:":
                current_section = "text"
            elif line_stripped == "HTML:":
                current_section = "html"
            elif current_section == "text" and line_stripped:
                text_content.append(line)
            elif current_section == "html" and line_stripped:
                html_content.append(line)

        # Fallback: if no sections found, try to extract from content
        if not subject or not text_content:
            # Look for subject anywhere in first 3 lines
            for line in lines[:3]:
                if "SUBJECT:" in line.upper():
                    subject = line.split(":", 1)[1].strip()
                    break

            # If still no subject, extract from content
            if not subject:
                first_line = content.split('\n')[0][:50]
                subject = f"Bedankt voor je aanvraag - {first_line}"

        # Build final text version
        body_text = '\n'.join(text_content).strip()
        if not body_text:
            body_text = content.strip()

        # Build final HTML version
        body_html = '\n'.join(html_content).strip()
        if not body_html:
            # Convert text to simple HTML
            body_html = body_text.replace('\n\n', '</p><p>').replace('\n', '<br>')
            body_html = f"<p>{body_html}</p>"

        return {
            "subject": subject,
            "body_text": body_text,
            "body_html": body_html
        }

    except Exception as e:
        logger.error(f"Error parsing generated email: {e}", exc_info=True)
        return None


def wrap_html_email(body_html: str, company_name: str = "Mister DJ") -> str:
    """
    Wrap generated HTML content in professional email template with branding.

    Args:
        body_html: Generated HTML content
        company_name: Company name

    Returns:
        Full HTML email with styling
    """
    return f"""<!DOCTYPE html>
<html lang="nl">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Bevestiging - {company_name}</title>
    <style>
        body {{
            margin: 0;
            padding: 0;
            font-family: Arial, Helvetica, sans-serif;
            background-color: #f4f4f4;
        }}
        .email-wrapper {{
            max-width: 600px;
            margin: 0 auto;
            background-color: #ffffff;
        }}
        .email-header {{
            background-color: #005098;
            padding: 30px 20px;
            text-align: center;
        }}
        .logo {{
            max-width: 180px;
            height: auto;
            margin-bottom: 15px;
        }}
        .header-title {{
            color: #ffffff;
            font-size: 24px;
            font-weight: bold;
            margin: 10px 0;
            letter-spacing: 0.5px;
        }}
        .email-content {{
            padding: 35px 30px;
            line-height: 1.7;
            color: #333;
        }}
        .email-content p {{
            margin: 15px 0;
        }}
        .email-content strong {{
            color: #005098;
        }}
        .email-content ul {{
            margin: 15px 0;
            padding-left: 20px;
        }}
        .email-content li {{
            margin: 8px 0;
        }}
        .contact-box {{
            background-color: #728799;
            color: #ffffff;
            padding: 20px;
            text-align: center;
            margin: 25px 0;
            border-radius: 4px;
        }}
        .contact-box a {{
            color: #ffffff;
            text-decoration: none;
            font-weight: bold;
        }}
        .email-footer {{
            background-color: #000000;
            color: #ffffff;
            padding: 25px 30px;
            text-align: center;
            font-size: 13px;
        }}
        .footer-brand {{
            font-size: 16px;
            font-weight: bold;
            margin-bottom: 10px;
        }}
        .footer-tagline {{
            font-size: 14px;
            margin: 5px 0;
            font-style: italic;
        }}
        @media only screen and (max-width: 600px) {{
            .email-content {{
                padding: 25px 20px;
            }}
        }}
    </style>
</head>
<body>
    <div class="email-wrapper">
        <div class="email-header">
            <img src="https://i1.wp.com/www.mr-dj.nl/wp-content/uploads/2018/01/450-01.png" alt="{company_name}" class="logo">
            <div class="header-title">✅ Aanvraag Ontvangen!</div>
        </div>
        <div class="email-content">
            {body_html}
        </div>
        <div class="email-footer">
            <div class="footer-brand">MISTER DJ</div>
            <div class="footer-tagline">🎉 100% Dansgarantie</div>
            <p style="margin: 10px 0 0 0; font-size: 12px; opacity: 0.7;">
                © 2025 Mister DJ • www.mr-dj.nl
            </p>
        </div>
    </div>
</body>
</html>
"""
