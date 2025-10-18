"""
Email Templates for RentGuy CRM
HTML email templates for various workflows
"""

EMAIL_TEMPLATES = {
    'lead_welcome': {
        'subject': 'Bedankt voor je interesse in Mr. DJ! 🎵',
        'html': '''
<!DOCTYPE html>
<html>
<head>
    <meta charset="UTF-8">
    <style>
        body { font-family: 'Helvetica Neue', Arial, sans-serif; line-height: 1.6; color: #333; }
        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
        .content { background: #ffffff; padding: 30px; border: 1px solid #e0e0e0; }
        .footer { background: #f5f5f5; padding: 20px; text-align: center; font-size: 12px; color: #666; border-radius: 0 0 10px 10px; }
        .button { display: inline-block; padding: 12px 30px; background: #667eea; color: white; text-decoration: none; border-radius: 5px; margin: 20px 0; }
        .highlight { background: #f0f4ff; padding: 15px; border-left: 4px solid #667eea; margin: 20px 0; }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1>🎵 Welkom bij Mr. DJ!</h1>
        </div>
        <div class="content">
            <p>Hallo {{first_name}},</p>

            <p>Super dat je interesse hebt in Mr. DJ! We hebben je aanvraag ontvangen en nemen <strong>binnen 24 uur</strong> contact met je op.</p>

            <div class="highlight">
                <strong>Wat kun je van ons verwachten?</strong>
                <ul>
                    <li>✨ Persoonlijk intakegesprek binnen 24 uur</li>
                    <li>🎯 Offerte op maat voor jouw event</li>
                    <li>🎵 100% dansgarantie - volle dansvloer gegarandeerd!</li>
                    <li>⭐ 9.8/10 gemiddelde score op basis van 450+ reviews</li>
                </ul>
            </div>

            <p>In de tussentijd kun je alvast:</p>
            <ul>
                <li>📱 Ons <a href="https://mr-dj.sevensa.nl/portfolio">portfolio bekijken</a></li>
                <li>💬 <a href="https://mr-dj.sevensa.nl/reviews">Reviews van eerdere klanten lezen</a></li>
                <li>📞 Direct bellen: <strong>+31 40 842 2594</strong></li>
            </ul>

            <center>
                <a href="https://mr-dj.sevensa.nl/beschikbaarheid" class="button">Check Beschikbaarheid</a>
            </center>

            <p>Tot snel!</p>
            <p><strong>Het Mr. DJ Team</strong><br>
            <small>Dé feestspecialist van het Zuiden</small></p>
        </div>
        <div class="footer">
            <p>Mr. DJ | Kapteijnlaan 17, 5505 AV Veldhoven | info@mr-dj.nl</p>
            <p><a href="https://mr-dj.sevensa.nl/privacy">Privacy</a> | <a href="https://mr-dj.sevensa.nl/voorwaarden">Voorwaarden</a></p>
        </div>
    </div>
</body>
</html>
        ''',
        'text': '''
Hallo {{first_name}},

Super dat je interesse hebt in Mr. DJ! We hebben je aanvraag ontvangen en nemen binnen 24 uur contact met je op.

Wat kun je van ons verwachten?
- Persoonlijk intakegesprek binnen 24 uur
- Offerte op maat voor jouw event
- 100% dansgarantie - volle dansvloer gegarandeerd!
- 9.8/10 gemiddelde score op basis van 450+ reviews

In de tussentijd kun je alvast:
- Ons portfolio bekijken: https://mr-dj.sevensa.nl/portfolio
- Reviews van eerdere klanten lezen: https://mr-dj.sevensa.nl/reviews
- Direct bellen: +31 40 842 2594

Tot snel!
Het Mr. DJ Team
Dé feestspecialist van het Zuiden

Mr. DJ | Kapteijnlaan 17, 5505 AV Veldhoven | info@mr-dj.nl
        '''
    },

    'proposal_followup': {
        'subject': 'Je persoonlijke offerte van Mr. DJ 📄',
        'html': '''
<!DOCTYPE html>
<html>
<head>
    <meta charset="UTF-8">
    <style>
        body { font-family: 'Helvetica Neue', Arial, sans-serif; line-height: 1.6; color: #333; }
        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
        .content { background: #ffffff; padding: 30px; border: 1px solid #e0e0e0; }
        .footer { background: #f5f5f5; padding: 20px; text-align: center; font-size: 12px; color: #666; border-radius: 0 0 10px 10px; }
        .button { display: inline-block; padding: 12px 30px; background: #667eea; color: white; text-decoration: none; border-radius: 5px; margin: 20px 0; }
        .price-box { background: #f0f4ff; padding: 20px; text-align: center; border-radius: 10px; margin: 20px 0; }
        .price { font-size: 32px; font-weight: bold; color: #667eea; }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1>📄 Je Persoonlijke Offerte</h1>
        </div>
        <div class="content">
            <p>Hallo {{first_name}},</p>

            <p>Bedankt voor je geduld! Hierbij je persoonlijke offerte voor <strong>{{deal_title}}</strong>.</p>

            <div class="price-box">
                <div class="price">{{deal_value}}</div>
                <p style="margin: 5px 0; color: #666;">Alles inclusief - geen verrassingen!</p>
            </div>

            <p><strong>Deze offerte bevat:</strong></p>
            <ul>
                <li>🎵 Volledige DJ service met professionele apparatuur</li>
                <li>🎤 Live saxofonist (optioneel)</li>
                <li>💡 Spectaculaire lichtshow</li>
                <li>🎧 Persoonlijk intakegesprek en muziekvoorkeur</li>
                <li>✅ 100% dansgarantie</li>
            </ul>

            <p><strong>Heb je vragen of wil je iets aanpassen?</strong><br>
            Bel ons direct op <strong>+31 40 842 2594</strong> of reply op deze email.</p>

            <center>
                <a href="https://mr-dj.sevensa.nl/offerte/{{tenant_id}}/{{deal_title|urlencode}}" class="button">Bekijk Volledige Offerte</a>
            </center>

            <p style="background: #fff3cd; padding: 15px; border-left: 4px solid #ffc107;">
                <strong>💡 Tip:</strong> Populaire data gaan snel! Reserveer binnen 7 dagen en krijg <strong>5% early bird korting</strong>.
            </p>

            <p>We kijken uit naar je reactie!</p>
            <p><strong>Het Mr. DJ Team</strong></p>
        </div>
        <div class="footer">
            <p>Mr. DJ | Kapteijnlaan 17, 5505 AV Veldhoven | info@mr-dj.nl</p>
        </div>
    </div>
</body>
</html>
        '''
    },

    'post_event_care': {
        'subject': 'Bedankt voor het vertrouwen in Mr. DJ! 🎉',
        'html': '''
<!DOCTYPE html>
<html>
<head>
    <meta charset="UTF-8">
    <style>
        body { font-family: 'Helvetica Neue', Arial, sans-serif; line-height: 1.6; color: #333; }
        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
        .content { background: #ffffff; padding: 30px; border: 1px solid #e0e0e0; }
        .footer { background: #f5f5f5; padding: 20px; text-align: center; font-size: 12px; color: #666; border-radius: 0 0 10px 10px; }
        .button { display: inline-block; padding: 12px 30px; background: #667eea; color: white; text-decoration: none; border-radius: 5px; margin: 20px 0; }
        .stars { font-size: 24px; color: #ffc107; }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1>🎉 Bedankt!</h1>
        </div>
        <div class="content">
            <p>Hallo {{first_name}},</p>

            <p>Wat een geweldig feest was dat! Het was een eer om onderdeel te zijn van <strong>{{deal_title}}</strong>.</p>

            <p>We hopen dat jullie hebben genoten en dat de dansvloer vol heeft gestaan! 🕺💃</p>

            <p><strong>Zou je ons willen helpen?</strong><br>
            Jouw feedback is super waardevol voor toekomstige klanten. Deel je ervaring met Mr. DJ:</p>

            <center>
                <div class="stars">⭐⭐⭐⭐⭐</div>
                <a href="{{review_link}}" class="button">Deel Je Review</a>
            </center>

            <p style="background: #e8f5e9; padding: 15px; border-left: 4px solid #4caf50;">
                <strong>🎁 Dank je wel!</strong><br>
                Als dank voor je review krijg je <strong>10% korting</strong> op je volgende boeking (of doorsturen naar vrienden/familie).
            </p>

            <p><strong>Plannen jullie nog een feest?</strong><br>
            Of ken je iemand die op zoek is naar een DJ? Stuur ze door naar ons - we zorgen goed voor ze!</p>

            <p>Nogmaals bedankt voor het vertrouwen,</p>
            <p><strong>Het Mr. DJ Team</strong></p>
        </div>
        <div class="footer">
            <p>Mr. DJ | Kapteijnlaan 17, 5505 AV Veldhoven | info@mr-dj.nl</p>
            <p>Volg ons: <a href="https://instagram.com/misterdj">Instagram</a> | <a href="https://facebook.com/misterdj">Facebook</a></p>
        </div>
    </div>
</body>
</html>
        '''
    },

    'followup_reminder': {
        'subject': 'Nog vragen over je offerte? 🤔',
        'html': '''
<!DOCTYPE html>
<html>
<head>
    <meta charset="UTF-8">
    <style>
        body { font-family: 'Helvetica Neue', Arial, sans-serif; line-height: 1.6; color: #333; }
        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
        .content { background: #ffffff; padding: 30px; border: 1px solid #e0e0e0; }
        .footer { background: #f5f5f5; padding: 20px; text-align: center; font-size: 12px; color: #666; border-radius: 0 0 10px 10px; }
        .button { display: inline-block; padding: 12px 30px; background: #667eea; color: white; text-decoration: none; border-radius: 5px; margin: 20px 0; }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1>👋 Hoi {{first_name}}!</h1>
        </div>
        <div class="content">
            <p>We stuurden je een paar dagen geleden een offerte voor <strong>{{deal_title}}</strong>.</p>

            <p>Hebben jullie er al naar kunnen kijken? We snappen dat het kiezen van de perfecte DJ een belangrijke beslissing is!</p>

            <p><strong>Hebben jullie nog vragen?</strong></p>
            <ul>
                <li>📞 Bel ons direct: <strong>+31 40 842 2594</strong></li>
                <li>📧 Reply op deze email</li>
                <li>💬 WhatsApp: <strong>+31 6 1234 5678</strong></li>
            </ul>

            <p>We helpen je graag verder met:</p>
            <ul>
                <li>✨ Pakket aanpassingen</li>
                <li>🎵 Muziekvoorkeur bespreken</li>
                <li>📅 Beschikbaarheid checken</li>
                <li>💰 Prijsafspraken maken</li>
            </ul>

            <center>
                <a href="https://mr-dj.sevensa.nl/contact" class="button">Plan een Belafspraak</a>
            </center>

            <p>Tot snel!</p>
            <p><strong>Het Mr. DJ Team</strong></p>
        </div>
        <div class="footer">
            <p>Mr. DJ | Kapteijnlaan 17, 5505 AV Veldhoven | info@mr-dj.nl</p>
        </div>
    </div>
</body>
</html>
        '''
    }
}
