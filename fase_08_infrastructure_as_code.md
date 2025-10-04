# Fase 8: Infrastructure as Code (IaC) voor Kerninfrastructuur

## 1. Inleiding

Infrastructure as Code (IaC) is een fundamentele praktijk in modern DevOps en SRE (Site Reliability Engineering). Het houdt in dat de infrastructuur (servers, netwerken, databases, etc.) wordt beheerd en geprovisioneerd via code, net zoals applicatiesoftware. Dit maakt het proces automatiseerbaar, reproduceerbaar en versie-gecontroleerd. Deze fase beschrijft de implementatie van IaC voor de Rentguy-infrastructuur.

## 2. Probleemstelling: Manueel Beheer

Het handmatig opzetten en configureren van servers is:

-   **Foutgevoelig**: Een kleine menselijke fout kan leiden tot een verkeerd geconfigureerde of onveilige omgeving.
-   **Tijdrovend**: Het kost veel tijd om een server handmatig op te zetten en te onderhouden.
-   **Niet Schaalbaar**: Het is onmogelijk om snel tientallen identieke servers op te zetten.
-   **Niet Reproduceerbaar**: Het is moeilijk om te garanderen dat een nieuwe server exact hetzelfde is als de vorige, wat leidt tot het "works on my machine"-probleem voor servers.

## 3. Gekozen Tooling

We kiezen voor een combinatie van twee toonaangevende IaC-tools:

-   **Terraform**: Voor **provisioning** van de infrastructuur. Terraform is een tool van HashiCorp die het mogelijk maakt om cloud- en on-premise infrastructuur declaratief te definiëren. We gebruiken het om de VPS zelf, de netwerkinstellingen, DNS-records en firewall-regels aan te maken.
-   **Ansible**: Voor **configuratie** van de infrastructuur. Zodra de server door Terraform is aangemaakt, gebruiken we Ansible om de software te installeren en te configureren. Ansible is agentless (vereist alleen SSH-toegang) en gebruikt eenvoudige YAML-bestanden (playbooks) om taken te beschrijven.

## 4. Implementatiestrategie

### Directory Structuur

In de `ops/` directory wordt een nieuwe `iac/` map aangemaakt met de volgende structuur:

```
ops/
└── iac/
    ├── ansible/
    │   ├── playbooks/
    │   ├── roles/
    │   └── inventory/
    └── terraform/
        └── environments/
            ├── staging/
            └── production/
```

### Terraform: Provisioning

-   In de `terraform/environments/` directory wordt voor elke omgeving (staging, productie) een aparte configuratie gemaakt.
-   De configuratie beschrijft de provider (bv. DigitalOcean, AWS, Hetzner) en de resources die moeten worden aangemaakt, zoals de VPS-instance, een domeinnaam, en firewall-regels.
-   De output van Terraform (bv. het IP-adres van de nieuwe server) wordt automatisch gebruikt als input voor de Ansible-inventory.

### Ansible: Configuratie

-   **Inventory**: Een bestand dat de servers definieert die Ansible moet beheren. Dit kan statisch zijn of dynamisch worden gegenereerd door Terraform.
-   **Roles**: Herbruikbare blokken van configuratie voor een specifieke taak. We definiëren rollen voor:
    -   `common`: Basisconfiguratie voor elke server (bv. security updates, user management).
    -   `docker`: Installatie en configuratie van Docker en Docker Compose.
    -   `rentguy_app`: Deployment van de Rentguy-applicatie (kopiëren van `docker-compose.yml`, secrets, en het starten van de services).
-   **Playbooks**: YAML-bestanden die de rollen aanroepen en toepassen op de servers in de inventory.

## 5. Integratie in de CI/CD Pijplijn

De IaC-scripts worden geïntegreerd in de CI/CD-pijplijn. Dit maakt het mogelijk om:

1.  **Een volledige omgeving (bv. voor testing) automatisch op te zetten**: `terraform apply` gevolgd door `ansible-playbook`.
2.  **Updates naar de infrastructuur gecontroleerd uit te rollen**: Een wijziging in een Ansible-rol of Terraform-configuratie wordt via een pull request gereviewed en vervolgens automatisch toegepast.

## 6. Conclusie

De implementatie van Infrastructure as Code met Terraform en Ansible is een cruciale stap naar een volwassen en professionele beheeromgeving. Het elimineert manuele, foutgevoelige processen en vervangt ze door een geautomatiseerde, versie-gecontroleerde en reproduceerbare workflow. Dit verhoogt niet alleen de betrouwbaarheid en veiligheid, maar maakt ook snelle disaster recovery mogelijk: een volledig nieuwe, productieklare omgeving kan binnen enkele minuten vanuit het niets worden opgebouwd.
