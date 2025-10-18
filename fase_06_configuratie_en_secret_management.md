# Fase 6: Configuratie- en Secret Management (VPS-based)

## 1. Inleiding

Een veilige en flexibele omgang met configuratie en secrets is een absolute voorwaarde voor een enterprise-grade applicatie. Het hardcoden van wachtwoorden, API-keys of andere gevoelige data in de code of in platte-tekst configuratiebestanden is een groot veiligheidsrisico. Deze fase beschrijft een strategie voor het veilig beheren van secrets op de Virtual Private Server (VPS), zoals gevraagd in de opdracht.

## 2. Probleemstelling

De huidige aanpak met `.env`-bestanden is geschikt voor lokale ontwikkeling, maar schiet tekort in een productieomgeving:

-   **Veiligheid**: Secrets worden in platte tekst op de server opgeslagen, wat ze kwetsbaar maakt bij ongeautoriseerde toegang tot het bestandssysteem.
-   **Beheer**: Het beheren van verschillende `.env`-bestanden voor verschillende omgevingen (ontwikkeling, staging, productie) is foutgevoelig en lastig te automatiseren.
-   **Auditability**: Het is moeilijk te traceren wie wanneer een secret heeft gewijzigd.

## 3. Gekozen Oplossing: Ansible Vault

Om de secrets veilig op de VPS op te slaan, kiezen we voor **Ansible Vault**. Ansible is een populair en krachtig automation-tool dat vaak al wordt gebruikt voor het configureren van servers (zie Fase 8: Infrastructure as Code). Ansible Vault is een feature binnen Ansible die het mogelijk maakt om bestanden of variabelen te versleutelen.

**Waarom Ansible Vault?**

-   **Integratie**: Het integreert naadloos met Ansible, waardoor het beheer van secrets een onderdeel wordt van het geautomatiseerde deployment-proces.
-   **Sterke Encryptie**: Het maakt gebruik van AES256-encryptie, een industriestandaard.
-   **Eenvoud in Gebruik**: Het versleutelen en ontsleutelen van bestanden is eenvoudig en kan worden geïntegreerd in scripts.

## 4. Implementatiestrategie

1.  **Structuur**: Er wordt een aparte directory `ops/secrets` aangemaakt. Voor elke omgeving (bv. `dev`, `staging`, `prod`) komt er een versleuteld `secrets.yml`-bestand.

2.  **Versleutelen**: De secrets worden opgeslagen in een YAML-bestand en vervolgens versleuteld met `ansible-vault encrypt`:

    ```bash
    ansible-vault encrypt ops/secrets/prod/secrets.yml
    ```

    De vault-wachtwoorden worden veilig bewaard in een password manager en zijn alleen toegankelijk voor geautoriseerd personeel.

3.  **Deployment**: Tijdens het deployment-proces (uitgevoerd met Ansible) wordt het juiste `secrets.yml`-bestand naar de VPS gekopieerd. Ansible ontsleutelt het bestand *in-memory* en genereert een `.env`-bestand op de server, direct in de applicatie-directory. Dit `.env`-bestand wordt nooit in versiebeheer opgenomen.

4.  **Applicatie**: De applicatie zelf hoeft niet te worden aangepast. De FastAPI-backend en de React-frontend blijven de configuratie en secrets lezen uit de environment variables, die door Docker Compose uit het `.env`-bestand worden geladen.

5.  **File Permissions**: Het gegenereerde `.env`-bestand op de server krijgt zeer strikte file permissions (bv. `400`), zodat alleen de gebruiker die de applicatie draait het bestand kan lezen.

## 5. Workflow

-   **Ontwikkelaar**: Een ontwikkelaar die een secret wil toevoegen of wijzigen, ontsleutelt het lokale `secrets.yml`-bestand, past het aan, en versleutelt het weer. De wijziging wordt gecommit naar de Git-repository (het versleutelde bestand is veilig om te committen).
-   **CI/CD Pijplijn**: De CI/CD-pijplijn krijgt toegang tot het vault-wachtwoord (bv. via een GitHub Secret) en gebruikt Ansible om de secrets veilig te deployen naar de juiste omgeving.

## 6. Conclusie

Deze aanpak biedt een robuuste en veilige oplossing voor secret management op de VPS. Het combineert de kracht van Ansible Vault voor encryptie met de eenvoud van `.env`-bestanden voor de applicatie. Dit verhoogt de veiligheid aanzienlijk, terwijl de impact op de bestaande codebase minimaal is. Het proces is bovendien goed te automatiseren en te integreren in de CI/CD-pijplijn.
