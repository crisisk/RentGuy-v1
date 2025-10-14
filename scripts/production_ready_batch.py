#!/usr/bin/env python3
"""
RentGuy Enterprise Platform - Production Ready Batch Execution Script
=====================================================================

This script executes all remaining tasks to make the application production-ready:
1. Routing & State Management
2. Backend Modules (6)
3. CTA Analysis for all frontend components
4. Business Logic Implementation
5. E2E Testing
6. Production Documentation

Features:
- State persistence (resume from last checkpoint)
- DeepSeek R1 via OpenRouter
- Automatic git commits
- Progress tracking
- Error recovery
"""

import os
import json
import requests
import time
import subprocess
from datetime import datetime
from typing import Dict, List, Any

# Configuration
OPENROUTER_API_KEY = "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"
OPENROUTER_URL = "https://openrouter.ai/api/v1/chat/completions"
STATE_FILE = "/home/ubuntu/production_batch_state.json"
REPO_PATH = "/home/ubuntu/RentGuy-Enterprise-Platform"

# Task Definitions
TASKS = {
    "phase1_routing": {
        "name": "Phase 1: Routing & State Management",
        "subtasks": [
            {
                "id": "1.1",
                "name": "React Router Setup",
                "description": "Install and configure React Router v6 with all routes",
                "output_files": [
                    "rentguy/frontend/src/router/index.tsx",
                    "rentguy/frontend/src/router/routes.tsx"
                ]
            },
            {
                "id": "1.2",
                "name": "Navigation Menu Component",
                "description": "Create responsive navigation menu with icons and active states",
                "output_files": [
                    "rentguy/frontend/src/components/Navigation.tsx",
                    "rentguy/frontend/src/components/Sidebar.tsx"
                ]
            },
            {
                "id": "1.3",
                "name": "Zustand State Management",
                "description": "Setup Zustand stores for auth, user, notifications, and global state",
                "output_files": [
                    "rentguy/frontend/src/store/authStore.ts",
                    "rentguy/frontend/src/store/userStore.ts",
                    "rentguy/frontend/src/store/notificationStore.ts"
                ]
            },
            {
                "id": "1.4",
                "name": "Route Guards",
                "description": "Implement authentication and authorization guards",
                "output_files": [
                    "rentguy/frontend/src/router/guards.tsx",
                    "rentguy/frontend/src/components/ProtectedRoute.tsx"
                ]
            }
        ]
    },
    "phase2_backend_modules": {
        "name": "Phase 2: Backend Modules",
        "subtasks": [
            {
                "id": "2.1",
                "name": "Customer Portal Module",
                "description": "Self-service portal for customers (invoices, orders, documents)",
                "output_files": [
                    "backend/app/modules/customer_portal/models.py",
                    "backend/app/modules/customer_portal/routes.py",
                    "backend/app/modules/customer_portal/schemas.py"
                ]
            },
            {
                "id": "2.2",
                "name": "Recurring Invoices Module",
                "description": "Automatic invoicing for leasing/long-term contracts",
                "output_files": [
                    "backend/app/modules/recurring_invoices/models.py",
                    "backend/app/modules/recurring_invoices/routes.py",
                    "backend/app/modules/recurring_invoices/scheduler.py"
                ]
            },
            {
                "id": "2.3",
                "name": "Jobboard Module",
                "description": "Crew self-service job applications",
                "output_files": [
                    "backend/app/modules/jobboard/models.py",
                    "backend/app/modules/jobboard/routes.py",
                    "backend/app/modules/jobboard/notifications.py"
                ]
            },
            {
                "id": "2.4",
                "name": "Online Booking Module",
                "description": "24/7 equipment reservation with 10 themes",
                "output_files": [
                    "backend/app/modules/booking/models.py",
                    "backend/app/modules/booking/routes.py",
                    "backend/app/modules/booking/themes.py"
                ]
            },
            {
                "id": "2.5",
                "name": "Barcode/QR Scanning Backend",
                "description": "Mobile inventory tracking API",
                "output_files": [
                    "backend/app/modules/scanning/routes.py",
                    "backend/app/modules/scanning/scanner.py"
                ]
            },
            {
                "id": "2.6",
                "name": "Sub-Renting Module",
                "description": "Partner network for capacity sharing",
                "output_files": [
                    "backend/app/modules/subrenting/models.py",
                    "backend/app/modules/subrenting/routes.py",
                    "backend/app/modules/subrenting/partner_api.py"
                ]
            }
        ]
    },
    "phase3_cta_analysis": {
        "name": "Phase 3: CTA Analysis & Business Logic",
        "subtasks": [
            {
                "id": "3.1",
                "name": "CTA Analysis - All Components",
                "description": "Analyze all CTAs/buttons in 14 frontend components",
                "output_files": [
                    "docs/cta_analysis_report.md"
                ]
            },
            {
                "id": "3.2",
                "name": "Business Logic Implementation",
                "description": "Implement all business logic for CTAs",
                "output_files": [
                    "rentguy/frontend/src/logic/projectLogic.ts",
                    "rentguy/frontend/src/logic/crewLogic.ts",
                    "rentguy/frontend/src/logic/financeLogic.ts",
                    "rentguy/frontend/src/logic/crmLogic.ts"
                ]
            }
        ]
    },
    "phase4_e2e_testing": {
        "name": "Phase 4: E2E Testing",
        "subtasks": [
            {
                "id": "4.1",
                "name": "Playwright Setup",
                "description": "Install and configure Playwright for E2E testing",
                "output_files": [
                    "tests/e2e/playwright.config.ts"
                ]
            },
            {
                "id": "4.2",
                "name": "E2E Tests - Critical Flows",
                "description": "Write E2E tests for all critical user flows",
                "output_files": [
                    "tests/e2e/auth.spec.ts",
                    "tests/e2e/projects.spec.ts",
                    "tests/e2e/crew.spec.ts",
                    "tests/e2e/finance.spec.ts"
                ]
            }
        ]
    },
    "phase5_documentation": {
        "name": "Phase 5: Production Documentation",
        "subtasks": [
            {
                "id": "5.1",
                "name": "API Documentation",
                "description": "Generate OpenAPI/Swagger docs for all endpoints",
                "output_files": [
                    "docs/api/openapi.yaml"
                ]
            },
            {
                "id": "5.2",
                "name": "Deployment Guide",
                "description": "Complete deployment and operations guide",
                "output_files": [
                    "docs/DEPLOYMENT.md",
                    "docs/OPERATIONS.md"
                ]
            },
            {
                "id": "5.3",
                "name": "User Manual",
                "description": "End-user documentation for all features",
                "output_files": [
                    "docs/USER_MANUAL.md"
                ]
            }
        ]
    }
}

class ProductionBatchExecutor:
    def __init__(self):
        self.state = self.load_state()
        self.start_time = datetime.now()
        
    def load_state(self) -> Dict[str, Any]:
        """Load execution state from file"""
        if os.path.exists(STATE_FILE):
            with open(STATE_FILE, 'r') as f:
                return json.load(f)
        return {
            "current_phase": "phase1_routing",
            "current_subtask_index": 0,
            "completed_tasks": [],
            "failed_tasks": [],
            "last_checkpoint": None
        }
    
    def save_state(self):
        """Save execution state to file"""
        self.state["last_checkpoint"] = datetime.now().isoformat()
        with open(STATE_FILE, 'w') as f:
            json.dump(self.state, f, indent=2)
        print(f"💾 State saved to {STATE_FILE}")
    
    def call_deepseek(self, prompt: str, max_tokens: int = 4000) -> str:
        """Call DeepSeek R1 via OpenRouter"""
        headers = {
            "Authorization": f"Bearer {OPENROUTER_API_KEY}",
            "Content-Type": "application/json",
            "HTTP-Referer": "https://rentguy.nl",
            "X-Title": "RentGuy Production Batch"
        }
        
        payload = {
            "model": "deepseek/deepseek-r1",
            "messages": [{"role": "user", "content": prompt}],
            "temperature": 0.7,
            "max_tokens": max_tokens
        }
        
        response = requests.post(OPENROUTER_URL, headers=headers, json=payload)
        response.raise_for_status()
        
        result = response.json()
        return result['choices'][0]['message']['content']
    
    def git_commit_push(self, message: str):
        """Commit and push changes to repository"""
        os.chdir(REPO_PATH)
        subprocess.run(["git", "add", "."], check=True)
        subprocess.run(["git", "commit", "-m", message], check=False)
        subprocess.run(["git", "push"], check=True)
        print(f"✅ Git: {message}")
    
    def execute_subtask(self, phase_key: str, subtask: Dict[str, Any]) -> bool:
        """Execute a single subtask"""
        print(f"\n{'='*60}")
        print(f"📋 Executing: {subtask['id']} - {subtask['name']}")
        print(f"{'='*60}")
        
        try:
            # Generate prompt based on subtask type
            if phase_key == "phase1_routing":
                result = self.execute_routing_task(subtask)
            elif phase_key == "phase2_backend_modules":
                result = self.execute_backend_module_task(subtask)
            elif phase_key == "phase3_cta_analysis":
                result = self.execute_cta_analysis_task(subtask)
            elif phase_key == "phase4_e2e_testing":
                result = self.execute_e2e_testing_task(subtask)
            elif phase_key == "phase5_documentation":
                result = self.execute_documentation_task(subtask)
            else:
                raise ValueError(f"Unknown phase: {phase_key}")
            
            # Save state after successful execution
            self.state["completed_tasks"].append(subtask['id'])
            self.save_state()
            
            # Commit to git
            self.git_commit_push(f"feat: {subtask['name']}")
            
            print(f"✅ Completed: {subtask['id']}")
            return True
            
        except Exception as e:
            print(f"❌ Error in {subtask['id']}: {str(e)}")
            self.state["failed_tasks"].append({
                "id": subtask['id'],
                "error": str(e),
                "timestamp": datetime.now().isoformat()
            })
            self.save_state()
            return False
    
    def execute_routing_task(self, subtask: Dict[str, Any]) -> bool:
        """Execute routing & state management tasks"""
        prompt = f"""Je bent een expert React/TypeScript developer die {subtask['name']} implementeert voor RentGuy Enterprise Platform.

TAAK: {subtask['description']}

OUTPUT FILES: {', '.join(subtask['output_files'])}

VEREISTEN:
1. TypeScript met proper types
2. React Router v6 best practices
3. RentGuy Enterprise styling
4. Nederlandse taal voor UI
5. Error handling en loading states

Genereer de VOLLEDIGE code voor alle output files. Geef voor elk file:
FILE: <filename>
```typescript
<code>
```

Start nu."""

        response = self.call_deepseek(prompt, max_tokens=6000)
        return self.parse_and_save_files(response, subtask['output_files'])
    
    def execute_backend_module_task(self, subtask: Dict[str, Any]) -> bool:
        """Execute backend module tasks"""
        prompt = f"""Je bent een expert Python/FastAPI developer die {subtask['name']} implementeert voor RentGuy Enterprise Platform.

TAAK: {subtask['description']}

OUTPUT FILES: {', '.join(subtask['output_files'])}

VEREISTEN:
1. FastAPI met Pydantic schemas
2. SQLAlchemy models
3. Proper error handling
4. API documentation (docstrings)
5. Type hints

BESTAANDE STRUCTUUR:
- Database: PostgreSQL met PostGIS
- ORM: SQLAlchemy
- API: FastAPI
- Auth: JWT tokens

Genereer de VOLLEDIGE code voor alle output files. Geef voor elk file:
FILE: <filename>
```python
<code>
```

Start nu."""

        response = self.call_deepseek(prompt, max_tokens=8000)
        return self.parse_and_save_files(response, subtask['output_files'])
    
    def execute_cta_analysis_task(self, subtask: Dict[str, Any]) -> bool:
        """Execute CTA analysis tasks"""
        if subtask['id'] == "3.1":
            # CTA Analysis
            components = [
                "ProjectOverview", "VisualPlanner", "CrewManagement", "TimeApproval",
                "EquipmentInventory", "FinanceDashboard", "InvoiceOverview", "QuoteManagement",
                "CRMDashboard", "CustomerDetails", "UserManagement", "SystemSettings",
                "ReportsAnalytics", "MollieAdminDashboard"
            ]
            
            prompt = f"""Je bent een UX/Business Analyst die een complete CTA (Call-to-Action) analyse uitvoert voor RentGuy Enterprise Platform.

COMPONENTEN: {', '.join(components)}

TAAK:
Voor ELKE component, analyseer:
1. Alle buttons/CTAs (tekst, functie, verwachte actie)
2. Alle form submissions
3. Alle interacties (clicks, hovers, drags)
4. Benodigde API calls
5. Benodigde state updates
6. Error scenarios
7. Success scenarios
8. Loading states

OUTPUT FORMAT:
# CTA Analysis Report - RentGuy Enterprise Platform

## Component: [Name]

### CTAs/Buttons
| Button Text | Function | API Call | State Update | Error Handling | Success Action |
|-------------|----------|----------|--------------|----------------|----------------|
| ... | ... | ... | ... | ... | ... |

### Form Submissions
...

### Business Logic Requirements
...

Genereer een COMPLETE analyse voor alle 14 componenten."""

            response = self.call_deepseek(prompt, max_tokens=16000)
            
            # Save report
            os.makedirs(f"{REPO_PATH}/docs", exist_ok=True)
            with open(f"{REPO_PATH}/docs/cta_analysis_report.md", 'w') as f:
                f.write(response)
            
            return True
        
        elif subtask['id'] == "3.2":
            # Business Logic Implementation
            # First, read the CTA analysis
            with open(f"{REPO_PATH}/docs/cta_analysis_report.md", 'r') as f:
                cta_analysis = f.read()
            
            prompt = f"""Je bent een expert TypeScript developer die business logic implementeert op basis van CTA analyse.

CTA ANALYSIS:
{cta_analysis[:8000]}  # First 8000 chars

TAAK:
Implementeer alle business logic functions voor de geanalyseerde CTAs.

OUTPUT FILES: {', '.join(subtask['output_files'])}

VEREISTEN:
1. TypeScript met proper types
2. Error handling
3. API integration
4. State management (Zustand)
5. Validation logic
6. Success/error callbacks

Genereer de VOLLEDIGE code voor alle logic files."""

            response = self.call_deepseek(prompt, max_tokens=8000)
            return self.parse_and_save_files(response, subtask['output_files'])
    
    def execute_e2e_testing_task(self, subtask: Dict[str, Any]) -> bool:
        """Execute E2E testing tasks"""
        prompt = f"""Je bent een expert Test Engineer die E2E tests schrijft met Playwright voor RentGuy Enterprise Platform.

TAAK: {subtask['description']}

OUTPUT FILES: {', '.join(subtask['output_files'])}

VEREISTEN:
1. Playwright best practices
2. Page Object Model pattern
3. Test alle critical user flows
4. Error scenarios
5. Happy paths
6. Edge cases

Genereer de VOLLEDIGE code voor alle test files."""

        response = self.call_deepseek(prompt, max_tokens=8000)
        return self.parse_and_save_files(response, subtask['output_files'])
    
    def execute_documentation_task(self, subtask: Dict[str, Any]) -> bool:
        """Execute documentation tasks"""
        prompt = f"""Je bent een Technical Writer die {subtask['name']} schrijft voor RentGuy Enterprise Platform.

TAAK: {subtask['description']}

OUTPUT FILES: {', '.join(subtask['output_files'])}

VEREISTEN:
1. Duidelijke structuur
2. Code examples
3. Screenshots/diagrams (beschrijvingen)
4. Troubleshooting sectie
5. Best practices

Genereer de VOLLEDIGE documentatie."""

        response = self.call_deepseek(prompt, max_tokens=8000)
        return self.parse_and_save_files(response, subtask['output_files'])
    
    def parse_and_save_files(self, response: str, expected_files: List[str]) -> bool:
        """Parse DeepSeek response and save files"""
        # Simple parser: look for FILE: markers
        files_content = {}
        current_file = None
        current_code = []
        in_code_block = False
        
        for line in response.split('\n'):
            if line.startswith('FILE:'):
                if current_file and current_code:
                    files_content[current_file] = '\n'.join(current_code)
                current_file = line.replace('FILE:', '').strip()
                current_code = []
                in_code_block = False
            elif '```' in line:
                in_code_block = not in_code_block
                if not in_code_block and current_file:
                    # End of code block
                    files_content[current_file] = '\n'.join(current_code)
                    current_code = []
            elif in_code_block and current_file:
                current_code.append(line)
        
        # Save last file
        if current_file and current_code:
            files_content[current_file] = '\n'.join(current_code)
        
        # Save all files
        for filename, content in files_content.items():
            filepath = os.path.join(REPO_PATH, filename)
            os.makedirs(os.path.dirname(filepath), exist_ok=True)
            with open(filepath, 'w') as f:
                f.write(content)
            print(f"   ✅ Saved: {filename}")
        
        return len(files_content) > 0
    
    def execute(self):
        """Main execution loop"""
        print("🚀 Starting Production Ready Batch Execution")
        print(f"📁 Repository: {REPO_PATH}")
        print(f"💾 State file: {STATE_FILE}")
        print(f"⏰ Start time: {self.start_time}\n")
        
        # Get current phase and subtask index
        current_phase = self.state["current_phase"]
        current_subtask_index = self.state["current_subtask_index"]
        
        # Execute all phases
        for phase_key, phase_data in TASKS.items():
            # Skip if we're past this phase
            if list(TASKS.keys()).index(phase_key) < list(TASKS.keys()).index(current_phase):
                continue
            
            print(f"\n{'#'*60}")
            print(f"# {phase_data['name']}")
            print(f"{'#'*60}\n")
            
            # Execute subtasks
            for i, subtask in enumerate(phase_data['subtasks']):
                # Skip if we're past this subtask
                if phase_key == current_phase and i < current_subtask_index:
                    continue
                
                # Execute subtask
                success = self.execute_subtask(phase_key, subtask)
                
                if not success:
                    print(f"\n⚠️  Subtask {subtask['id']} failed, but continuing...")
                
                # Update state
                self.state["current_phase"] = phase_key
                self.state["current_subtask_index"] = i + 1
                self.save_state()
                
                # Rate limiting
                time.sleep(3)
            
            # Move to next phase
            next_phase_index = list(TASKS.keys()).index(phase_key) + 1
            if next_phase_index < len(TASKS):
                self.state["current_phase"] = list(TASKS.keys())[next_phase_index]
                self.state["current_subtask_index"] = 0
                self.save_state()
        
        # Final summary
        self.print_summary()
    
    def print_summary(self):
        """Print execution summary"""
        end_time = datetime.now()
        duration = end_time - self.start_time
        
        print(f"\n{'='*60}")
        print("📊 EXECUTION SUMMARY")
        print(f"{'='*60}")
        print(f"⏰ Start: {self.start_time}")
        print(f"⏰ End: {end_time}")
        print(f"⏱️  Duration: {duration}")
        print(f"✅ Completed: {len(self.state['completed_tasks'])} tasks")
        print(f"❌ Failed: {len(self.state['failed_tasks'])} tasks")
        
        if self.state['failed_tasks']:
            print("\nFailed tasks:")
            for task in self.state['failed_tasks']:
                print(f"  - {task['id']}: {task['error']}")
        
        print(f"\n💾 State saved to: {STATE_FILE}")
        print(f"📁 Repository: {REPO_PATH}")

if __name__ == "__main__":
    executor = ProductionBatchExecutor()
    executor.execute()

