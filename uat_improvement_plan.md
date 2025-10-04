# UAT Verbeterplan: RentGuy Enterprise

## 1. Inleiding

Naar aanleiding van de UAT-resultaten is dit verbeterplan opgesteld om alle geïdentificeerde problemen op te lossen. Het plan omvat technische analyses, voorgestelde oplossingen en een planning voor de implementatie en hertesten.

**Doel:** Alle 9 bugs oplossen en een succesvolle regressietest uitvoeren om een **GO** voor productie te verkrijgen.

## 2. Oplossingen per Bug

--- 

### **BUG-001: Rollback script corrumpeert de database (KRITIEK)**

- **Analyse:** Het rollback script gebruikt een `TRUNCATE` statement voordat de backup volledig is gevalideerd. Als de backup-file corrupt is, leidt dit tot dataverlies.
- **Oplossing:** Pas het script aan. Gebruik een `CREATE TABLE ... AS SELECT` strategie om een tijdelijke backup te maken. Valideer de backup. Hernoem de tabellen (`ALTER TABLE ... RENAME TO ...`). Verwijder de oude tabel pas na een succesvolle rollback en validatie.
- **Code Fix (Bash):**
  ```bash
  # OUD (onveilig)
  # mysqldump ... > backup.sql
  # mysql -e "TRUNCATE table;"
  # mysql ... < backup.sql

  # NIEUW (veilig)
  TIMESTAMP=$(date +%F_%T)
  mysql -e "CREATE TABLE ${TABLE_NAME}_backup_${TIMESTAMP} LIKE ${TABLE_NAME};"
  mysql -e "INSERT INTO ${TABLE_NAME}_backup_${TIMESTAMP} SELECT * FROM ${TABLE_NAME};"
  
  # ... (voer gevaarlijke operatie uit) ...
  
  # Rollback (indien nodig)
  mysql -e "DROP TABLE ${TABLE_NAME};"
  mysql -e "ALTER TABLE ${TABLE_NAME}_backup_${TIMESTAMP} RENAME TO ${TABLE_NAME};"
  ```

--- 

### **BUG-002: Multi-day discount berekening is incorrect (HOOG)**

- **Analyse:** De `calculateMrDjPricing` functie in `PricingService.php` bevat een logische fout in de loop die de korting berekent. De loop stopt incorrect na 5 iteraties.
- **Oplossing:** Verwijder de onjuiste `if ($i > 5)` check en pas de logica aan zodat de korting voor *alle* dagen na de eerste dag wordt toegepast.
- **Code Fix (PHP):**
  ```php
  // app/Services/PricingService.php
  public function calculateMrDjPricing($dailyRate, $rentalDays) {
      if ($rentalDays <= 1) {
          return $dailyRate;
      }
      
      // OUD (foutief)
      // $total = $dailyRate;
      // for ($i = 2; $i <= $rentalDays; $i++) {
      //     if ($i > 5) continue; // FOUT!
      //     $total += $dailyRate * 0.5;
      // }
      // return $total;

      // NIEUW (correct)
      $firstDayPrice = $dailyRate;
      $subsequentDays = $rentalDays - 1;
      $subsequentDaysPrice = $subsequentDays * ($dailyRate * 0.5);
      
      return $firstDayPrice + $subsequentDaysPrice;
  }
  ```

--- 

### **BUG-003: Geen duidelijke foutmelding bij overboeking (HOOG)**

- **Analyse:** De `checkEquipmentAvailability` functie retourneert een lege array in plaats van een `Exception` te gooien bij onvoldoende voorraad.
- **Oplossing:** Implementeer een `InsufficientStockException`. Gooi deze exception wanneer de gevraagde hoeveelheid de beschikbare hoeveelheid overschrijdt. Vang de exception in de `QuoteController` en retourneer een duidelijke 409 Conflict HTTP response.
- **Code Fix (PHP):**
  ```php
  // app/Services/AvailabilityService.php
  public function checkAvailability(array $items, $period) {
      foreach ($items as $item) {
          $available = $this->getAvailableQuantity($item["id"], $period);
          if ($item["quantity"] > $available) {
              throw new InsufficientStockException("Niet genoeg voorraad voor item: " . $item["name"]);
          }
      }
  }

  // app/Http/Controllers/QuoteController.php
  public function create(Request $request) {
      try {
          $this->availabilityService->checkAvailability(...);
          // ... create quote ...
      } catch (InsufficientStockException $e) {
          return response()->json(["error" => $e->getMessage()], 409);
      }
  }
  ```

--- 

### **BUG-004: Foto-upload mislukt op iOS 17 (HOOG)**

- **Analyse:** iOS 17 Safari gebruikt het HEIC-beeldformaat, dat niet standaard wordt ondersteund door de `gd` library in PHP. De server-side image processing faalt.
- **Oplossing:** Gebruik een client-side JavaScript library (zoals `heic2any`) om de afbeelding naar JPEG te converteren *voordat* deze wordt geüpload. Update de frontend code van de schademelding.
- **Code Fix (JavaScript):**
  ```javascript
  // public/js/damage-report.js
  import heic2any from "heic2any";

  const fileInput = document.getElementById("photo-upload");

  fileInput.addEventListener("change", async (event) => {
      const file = event.target.files[0];
      if (file.type === "image/heic") {
          const convertedBlob = await heic2any({ blob: file, toType: "image/jpeg" });
          // ... upload de convertedBlob ...
      } else {
          // ... upload de originele file ...
      }
  });
  ```

--- 

### **BUG-005: Rapportage is te traag (MEDIUM)**

- **Analyse:** De `Revenue per Package` query gebruikt een subquery die niet goed geïndexeerd is, wat leidt tot een full table scan.
- **Oplossing:** De-normaliseer de data door een `package_id` toe te voegen aan de `invoices` tabel. Update dit veld bij het aanmaken van de factuur. Hierdoor kan de query een simpele `GROUP BY` met een index gebruiken.
- **Code Fix (SQL & PHP):**
  ```sql
  -- Migration
  ALTER TABLE invoices ADD COLUMN package_id BIGINT UNSIGNED NULL;
  CREATE INDEX idx_invoice_package ON invoices (package_id);
  ```
  ```php
  // InvoiceService.php
  public function createInvoiceFromQuote($quote) {
      // ...
      $invoice->package_id = $quote->package_id;
      $invoice->save();
      // ...
  }

  // ReportRepository.php
  public function getRevenuePerPackage() {
      // OUD (traag)
      // SELECT p.name, SUM(i.total) FROM packages p JOIN ...

      // NIEUW (snel)
      return DB::table("invoices as i")
          ->join("packages as p", "i.package_id", "=", "p.id")
          ->select("p.name", DB::raw("SUM(i.total) as revenue"))
          ->groupBy("p.name")
          ->get();
  }
  ```

--- 

### **BUG-006 & BUG-007: API Documentatie & Webhook Payload (MEDIUM)**

- **Analyse:** De OpenAPI/Swagger documentatie is niet bijgewerkt na de laatste code-wijzigingen. De webhook payload mist een essentieel veld.
- **Oplossing:** Genereer de API-documentatie opnieuw met `php artisan l5-swagger:generate`. Voeg het `status` veld toe aan de `InvoicePaidWebhook` resource.
- **Code Fix (PHP):**
  ```php
  // app/Http/Resources/InvoicePaidWebhook.php
  public function toArray($request) {
      return [
          "invoice_id" => $this->id,
          "amount" => $this->amount,
          "paid_at" => $this->paid_at,
          "status" => $this->status, // TOEGEVOEGD
      ];
  }
  ```

--- 

### **BUG-008 & BUG-009: Wisselkoersen & Herinneringstemplate (LAAG)**

- **Analyse:** Deze features zijn hardcoded.
- **Oplossing:** Maak de wisselkoers-API configureerbaar (bijv. via een `ExchangeRateProvider` interface). Maak de herinneringstekst een bewerkbaar veld in de tenant-instellingen.
- **Code Fix (PHP):**
  ```php
  // app/Services/ReminderService.php
  public function sendReminder($invoice) {
      $tenant = $invoice->tenant;
      $template = $tenant->settings["reminder_template"] ?? "Default template...";
      // ... send email met de custom template ...
  }
  ```

## 3. Planning voor Implementatie en Hertesten

- **Sprint 1 (3 dagen):**
  - Oplossen van alle 9 bugs volgens dit plan.
  - Unit tests schrijven voor elke fix.
- **Sprint 2 (2 dagen):**
  - Deployment naar de UAT-omgeving.
  - Uitvoeren van een volledige regressietest met alle 20 originele test cases.
- **Finale Review (1 dag):**
  - Analyse van de regressietestresultaten.
  - Finale go/no-go beslissing.

**Totaal geschatte tijd:** 6 werkdagen.

