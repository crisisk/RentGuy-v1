# Fase 19: Implementatie en A/B Testing van het LLM Ensemble

## 1. Inleiding

Na het ontwerpen van de Multi-LLM Ensemble Architectuur in Fase 18, volgt nu de concrete implementatie. Deze fase beschrijft de technische realisatie van de LLM Router-service, de integratie met de bestaande Rentguy-backend, en de opzet van een A/B testing-framework om de effectiviteit van verschillende modellen en strategieën te meten. Het doel is om een werkend, productie-klaar systeem te creëren dat de kracht van meerdere LLMs benut.

## 2. Technische Implementatie van de LLM Router

De LLM Router wordt geïmplementeerd als een aparte FastAPI-service die naast de hoofdapplicatie draait. Deze service is verantwoordelijk voor het routeren, uitvoeren en monitoren van alle LLM-requests.

### Core Componenten

1.  **Request Handler**: Een FastAPI-endpoint (`/llm/complete`) dat generieke LLM-requests ontvangt. De request bevat:
    -   `task_type`: Het type taak (bv. `summarize`, `translate`, `code_review`).
    -   `prompt`: De daadwerkelijke prompt voor het LLM.
    -   `priority`: De gewenste balans tussen kosten en kwaliteit (`low`, `medium`, `high`).
    -   `user_id`: Voor het tracken van gebruik per gebruiker.

2.  **Routing Engine**: Een configureerbare engine die bepaalt welk LLM moet worden gebruikt. De routering is gebaseerd op:
    -   Een YAML-configuratiebestand dat de regels definieert.
    -   Real-time metrics zoals API-latency en beschikbaarheid van de verschillende providers.

3.  **Provider Adapters**: Aparte klassen voor elke LLM-provider (OpenAI, Anthropic, Google, etc.). Elke adapter implementeert een gemeenschappelijke interface en vertaalt de generieke request naar het specifieke API-formaat van de provider.

4.  **Response Normalizer**: Normaliseert de responses van verschillende providers naar een consistent formaat, zodat de client-applicatie geen verschil merkt tussen de verschillende LLMs.

### Implementatiedetails

```python
# Voorbeeld van de core routing logic
class LLMRouter:
    def __init__(self, config_path: str):
        self.config = load_yaml(config_path)
        self.adapters = {
            'openai': OpenAIAdapter(),
            'anthropic': AnthropicAdapter(),
            'google': GoogleAdapter()
        }
    
    async def route_request(self, request: LLMRequest) -> LLMResponse:
        # Bepaal het beste model op basis van task_type en priority
        selected_model = self._select_model(request.task_type, request.priority)
        
        # Probeer de request uit te voeren
        try:
            adapter = self.adapters[selected_model.provider]
            response = await adapter.complete(selected_model.model, request.prompt)
            return self._normalize_response(response)
        except Exception as e:
            # Fallback naar een secundair model
            fallback_model = self._get_fallback_model(selected_model)
            if fallback_model:
                adapter = self.adapters[fallback_model.provider]
                response = await adapter.complete(fallback_model.model, request.prompt)
                return self._normalize_response(response)
            else:
                raise e
```

## 3. Integratie met de Rentguy Backend

De bestaande Rentguy-backend wordt aangepast om gebruik te maken van de nieuwe LLM Router-service in plaats van directe API-calls naar LLM-providers.

1.  **LLM Client**: Een nieuwe `LLMClient`-klasse wordt toegevoegd aan de backend. Deze klasse communiceert met de LLM Router-service via HTTP.
2.  **Feature Integration**: Bestaande features die LLMs gebruiken (bv. automatische project-samenvattingen, intelligente taakprioritering) worden aangepast om de nieuwe client te gebruiken.
3.  **Graceful Degradation**: Als de LLM Router-service niet beschikbaar is, schakelt de applicatie over naar een fallback-modus waarin de LLM-features worden uitgeschakeld, maar de core-functionaliteit van de applicatie behouden blijft.

## 4. A/B Testing Framework

Om de effectiviteit van verschillende LLM-strategieën te meten, wordt een A/B testing-framework geïmplementeerd.

### Experimentopzet

1.  **Experiment Configuration**: Experimenten worden gedefinieerd in een configuratiebestand. Een experiment kan bijvoorbeeld zijn: "50% van de gebruikers krijgt samenvattingen van GPT-4, 50% krijgt samenvattingen van Claude-3".
2.  **User Bucketing**: Gebruikers worden consistent toegewezen aan een experiment-groep op basis van hun `user_id` (met behulp van een hash-functie).
3.  **Metrics Collection**: Voor elk experiment worden relevante metrics verzameld:
    -   **Performance**: Responstijd, success rate.
    -   **Quality**: Gebruikerstevredenheid (via feedback-buttons), task completion rate.
    -   **Cost**: Kosten per request, kosten per gebruiker.

### Implementatie

```python
class ABTestManager:
    def __init__(self, experiments_config: dict):
        self.experiments = experiments_config
    
    def get_model_for_user(self, user_id: str, task_type: str) -> str:
        # Hash de user_id om een consistente groepstoewijzing te krijgen
        bucket = hash(f"{user_id}_{task_type}") % 100
        
        # Zoek het juiste experiment voor deze task_type
        experiment = self.experiments.get(task_type)
        if not experiment:
            return self._get_default_model(task_type)
        
        # Bepaal in welke groep de gebruiker valt
        cumulative_percentage = 0
        for group in experiment['groups']:
            cumulative_percentage += group['percentage']
            if bucket < cumulative_percentage:
                return group['model']
        
        return self._get_default_model(task_type)
```

## 5. Monitoring en Analytics

Een uitgebreid monitoring-dashboard wordt opgezet om de performance van het LLM Ensemble te volgen:

-   **Real-time Metrics**: Request volume, latency, error rates per provider.
-   **Cost Tracking**: Dagelijkse en maandelijkse kosten per provider en per feature.
-   **Quality Metrics**: Gebruikerstevredenheid, A/B test-resultaten.
-   **Alerts**: Automatische waarschuwingen bij hoge error rates of onverwachte kostenstijgingen.

## 6. Conclusie

De implementatie van het Multi-LLM Ensemble transformeert de Rentguy-applicatie van een eenvoudige LLM-consumer naar een intelligente orchestrator van AI-mogelijkheden. Het A/B testing-framework stelt ons in staat om data-gedreven beslissingen te nemen over welke modellen en strategieën het beste werken voor onze specifieke use cases. Dit resulteert in een kostenefficiënt, betrouwbaar en continu verbeterend AI-systeem dat de gebruikerservaring aanzienlijk kan verbeteren.
