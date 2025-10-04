# Fase 14: Geavanceerde CI/CD: Staging en Productie

## 1. Inleiding

Voortbouwend op de fundamentele CI/CD-pijplijn uit Fase 4, introduceert deze fase een meer geavanceerde en veiligere aanpak voor het releasen van software. Het doel is om een gecontroleerd pad naar productie te creëren door het opzetten van separate staging- en productieomgevingen en het implementeren van een professionele deploymentstrategie. Dit minimaliseert het risico op fouten in de live-omgeving en zorgt voor zero-downtime deployments.

## 2. Omgevingsstrategie

We definiëren een duidelijke hiërarchie van omgevingen, elk met een eigen doel:

-   **Development**: De lokale machines van de ontwikkelaars. Hier wordt de code geschreven en worden de eerste (unit) tests uitgevoerd.
-   **Staging**: Een productie-identieke omgeving. Deze wordt gebruikt voor de finale acceptatietests (UAT), end-to-end tests en performance tests. De staging-omgeving moet qua infrastructuur, data (geanonymiseerd) en configuratie een zo exact mogelijke kopie zijn van de productieomgeving.
-   **Productie**: De live-omgeving die door de eindgebruikers wordt gebruikt. Deze omgeving is heilig en mag alleen worden bijgewerkt via een gecontroleerd en getest proces.

## 3. Uitbreiding van de CI/CD Workflow

De Git-branchingstrategie (GitFlow) wordt direct gekoppeld aan de omgevingsstrategie:

-   **Merge naar `develop`**: Een merge naar de `develop`-branch triggert automatisch een deployment naar de **Staging-omgeving**. Hier kunnen testers, product owners en andere stakeholders de nieuwe features valideren.
-   **Merge naar `main`**: Een merge van een `release`-branch naar de `main`-branch triggert het deployment-proces naar de **Productie-omgeving**.

### Handmatige Goedkeuring voor Productie

Een cruciale toevoeging is een **manual gate** (handmatige goedkeuringsstap) voor de productie-deployment. In GitHub Actions kan dit worden geconfigureerd met "Environments". Een deployment naar de `production`-environment vereist dan de expliciete goedkeuring van een of meerdere aangewezen personen (bv. de lead developer of de product owner). Dit zorgt voor een laatste, bewuste controle voordat de wijzigingen live gaan.

## 4. Deploymentstrategie: Blue-Green Deployment

Om zero-downtime deployments te realiseren en het risico van een release te minimaliseren, implementeren we de **Blue-Green Deployment** strategie.

### Concept

Er worden twee identieke, parallelle productieomgevingen onderhouden:

-   **Blue Environment**: De huidige, live productieomgeving die alle gebruikerstraffic ontvangt.
-   **Green Environment**: Een identieke, maar inactieve omgeving.

### Proces

1.  **Deploy**: De nieuwe versie van de applicatie wordt gedeployed naar de inactieve **Green Environment**.
2.  **Test**: Op de Green Environment worden de laatste rooktests uitgevoerd om te verifiëren dat de deployment succesvol was en de applicatie correct functioneert.
3.  **Switch**: Zodra de Green Environment is goedgekeurd, wordt de router/load balancer omgeschakeld. Alle nieuwe traffic wordt nu naar de **Green Environment** gestuurd. De Green Environment is nu de nieuwe Blue Environment.
4.  **Stand-by/Rollback**: De oude Blue Environment (nu de nieuwe Green) wordt stand-by gehouden. Als er onverhoopt een kritiek probleem wordt ontdekt in de nieuwe versie, kan de traffic onmiddellijk worden teruggeschakeld naar de oude omgeving. Dit maakt een **instant rollback** mogelijk.

### Implementatie met Docker en Traefik

Deze strategie kan effectief worden geïmplementeerd in onze Docker-omgeving met behulp van een slimme reverse proxy zoals **Traefik**.

-   **Labels**: Traefik kan Docker-containers dynamisch configureren op basis van labels. We kunnen twee sets van containers draaien (blue en green), elk met hun eigen labels.
-   **Switch**: De "switch" wordt gerealiseerd door de labels op de Traefik-service aan te passen, zodat deze naar de nieuwe (Green) set van containers wijst. Dit kan worden geautomatiseerd in een deployment-script.

## 5. Conclusie

De introductie van staging- en productieomgevingen, gecombineerd met een Blue-Green deploymentstrategie en handmatige goedkeuring voor productie, transformeert het releaseproces van een risicovolle gebeurtenis naar een gecontroleerde, voorspelbare en veilige routine. Dit stelt het team in staat om vaker en met meer vertrouwen te releasen, wat de time-to-market voor nieuwe features aanzienlijk verkort en de stabiliteit van de productieomgeving waarborgt.
