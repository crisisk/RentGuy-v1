# RentGuy Gebruikershandleiding

Deze handleiding begeleidt nieuwe gebruikers stap voor stap door de RentGuy webapplicatie. Volg de hoofdstukken in volgorde om de volledige functionaliteit te ontdekken.

---

## 1. Eerste toegang
1. Navigeer naar `https://app.your-domain.com` in een moderne browser (Chrome, Edge of Firefox).
2. Log in met het account dat je van RentGuy hebt ontvangen. Demo-accounts:
   - **E-mail:** `rentguy@demo.local`
   - **Wachtwoord:** `rentguy`
3. Bij de eerste login verschijnt de **OnboardingOverlay** automatisch. Klik op **"Start onboarding"** om de begeleide tour te starten.

> **Tip:** Als je de overlay tijdelijk wilt overslaan klik je op **"Sluiten"**. Je kunt de onboarding later opnieuw openen via **Menu → Help → Onboarding opnieuw starten**.

---

## 2. Onboardingstappen
De overlay toont zeven stappen die je door de belangrijkste onderdelen van RentGuy leiden:
1. **Welkom bij RentGuy** – Introductie en uitleg over de navigatie.
2. **Project aanmaken** – Start je eerste event of klus.
3. **Crew toevoegen** – Voeg teamleden toe en ken rollen toe.
4. **Boeking plannen** – Plan crewleden in op projecten.
5. **Magazijnscan** – Gebruik de scanner om materiaal te registreren.
6. **Transport plannen** – Maak vrachtbrieven en routes aan.
7. **Factureren** – Genereer facturen en download exportbestanden.

Markeer een stap als voltooid via de knop **"Markeer gereed"**. De voortgangsbalk bovenaan laat direct zien hoeveel procent van de onboarding je afgerond hebt.

---

## 3. Navigatie door de planner
- **Dashboard:** Overzicht van belangrijke taken en waarschuwingen.
- **Projecten:** Maak nieuwe projecten aan, koppel materiaal en crew, en bekijk de tijdlijn.
- **Crew:** Beheer medewerkers, contracttypes en beschikbaarheid.
- **Transport:** Plan ritten, wijs chauffeurs toe en genereer PDF-transportdocumenten.
- **Magazijn:** Start de barcode scanner (werkt ook op mobiel via PWA) om items in- en uit te boeken.
- **Facturatie:** Controleer conceptfacturen, exporteer CSV/UBL en verstuur e-mailfacturen.

Gebruik het zijmenu om tussen modules te wisselen. Contextuele tips verschijnen automatisch via de **TipBanner** bovenaan elke module.

---

## 4. Scanner modus
1. Open `https://app.your-domain.com?mode=scanner` of stel `VITE_APP_MODE=scanner` in je `.env` voor een dedicated scanner-installatie.
2. Sta cameratoegang toe wanneer de browser hierom vraagt.
3. Richt de camera op een RentGuy barcode. De scanresultaten verschijnen direct en worden naar de backend gestuurd.
4. Gebruik de knoppen **"Handmatig boeken"** en **"Zoek item"** voor uitzonderingen.

---

## 5. Communicatie en e-mail
- Welkomstmails worden automatisch verstuurd wanneer een onboardingstap dat vereist. Controleer je inbox (en spam) na het afronden van de onboarding.
- Gebruik **Instellingen → E-mail** om je afzenderadres te personaliseren of alternatieve SMTP-gegevens in te voeren (adminrechten nodig).

---

## 6. Veelgestelde vragen
| Vraag | Antwoord |
|-------|----------|
| Hoe wijzig ik mijn wachtwoord? | Ga naar **Profiel → Beveiliging** en kies **Wachtwoord resetten**. |
| Waar kan ik statusrapporten downloaden? | Open **Rapportages** in het hoofdmenu en kies het gewenste exportformaat. |
| Hoe zet ik de onboarding opnieuw aan? | Ga naar **Menu → Help → Onboarding opnieuw starten**. |
| Werkt de scanner offline? | Ja, beperkte offline-modus is beschikbaar; sync vindt plaats zodra er weer verbinding is. |

---

## 7. Support
- **E-mail:** support@rentguy.com
- **Documentatie:** bekijk `docs/DEPLOYMENT.md` voor technische details en `docs/UAT/` voor testscenario’s.
- **Incident melden:** gebruik het ticketportaal of neem telefonisch contact op met het operations-team.

Welkom bij RentGuy en veel succes met je verhuurprojecten!
