#!/usr/bin/env python3
"""
Simple RentGuy Demo Backend
Provides mock API endpoints for onboarding demo
"""
from flask import Flask, request, jsonify
from flask_cors import CORS
import jwt
import datetime
import json

app = Flask(__name__)
CORS(app)  # Enable CORS for all routes

# Mock data
JWT_SECRET = "demo_secret_key"
USERS = {
    "bart@rentguy.demo": {
        "email": "bart@rentguy.demo",
        "password": "mr-dj",
        "role": "admin"
    },
    "rentguy@demo.local": {
        "email": "rentguy@demo.local", 
        "password": "rentguy",
        "role": "admin"
    }
}

ONBOARDING_STEPS = [
    {"id": 1, "code": "welcome", "title": "Welkom bij RentGuy", "description": "Leer de basis van het systeem kennen"},
    {"id": 2, "code": "profile", "title": "Profiel instellen", "description": "Vul je bedrijfsgegevens in"},
    {"id": 3, "code": "inventory", "title": "Inventaris toevoegen", "description": "Voeg je eerste verhuuritems toe"},
    {"id": 4, "code": "calendar", "title": "Planning bekijken", "description": "Leer werken met de planningskalender"},
    {"id": 5, "code": "booking", "title": "Eerste boeking", "description": "Maak je eerste verhuurreservering"},
    {"id": 6, "code": "reports", "title": "Rapporten inzien", "description": "Bekijk je verhuurstatistieken"},
    {"id": 7, "code": "complete", "title": "Onboarding voltooid", "description": "Je bent klaar om te starten!"}
]

ONBOARDING_TIPS = [
    {"module": "projects", "title": "Planning Tip", "content": "Sleep projecten om ze te herplannen. Het systeem controleert automatisch op voorraadconflicten."},
    {"module": "inventory", "title": "Inventaris Tip", "content": "Gebruik categorieën om je items georganiseerd te houden."},
    {"module": "dashboard", "title": "Dashboard Tip", "content": "Het dashboard toont je belangrijkste KPI's in één overzicht."}
]

# Mock progress storage (in memory for demo)
user_progress = {}

@app.route('/api/v1/auth/login', methods=['POST'])
def login():
    """Mock login endpoint"""
    try:
        email = request.form.get('email')
        password = request.form.get('password')
        
        if email in USERS and USERS[email]['password'] == password:
            # Generate JWT token
            payload = {
                'sub': email,
                'exp': datetime.datetime.utcnow() + datetime.timedelta(hours=24)
            }
            token = jwt.encode(payload, JWT_SECRET, algorithm='HS256')
            
            return jsonify({
                'access_token': token,
                'token_type': 'bearer',
                'user': USERS[email]
            })
        else:
            return jsonify({'detail': 'Invalid credentials'}), 401
            
    except Exception as e:
        return jsonify({'detail': 'Login failed'}), 400

@app.route('/api/v1/auth/me', methods=['GET'])
def get_current_user():
    """Get current user info"""
    auth_header = request.headers.get('Authorization')
    if not auth_header or not auth_header.startswith('Bearer '):
        return jsonify({'detail': 'Missing token'}), 401
    
    token = auth_header.split(' ')[1]
    try:
        payload = jwt.decode(token, JWT_SECRET, algorithms=['HS256'])
        email = payload.get('sub')
        if email in USERS:
            return jsonify(USERS[email])
    except:
        pass
    
    return jsonify({'detail': 'Invalid token'}), 401

@app.route('/api/v1/onboarding/steps', methods=['GET'])
def get_onboarding_steps():
    """Get all onboarding steps"""
    return jsonify(ONBOARDING_STEPS)

@app.route('/api/v1/onboarding/progress/<email>', methods=['GET'])
def get_progress(email):
    """Get user's onboarding progress"""
    progress = user_progress.get(email, [])
    return jsonify(progress)

@app.route('/api/v1/onboarding/complete', methods=['POST'])
def complete_step():
    """Mark a step as complete"""
    data = request.get_json()
    email = data.get('email')
    step_code = data.get('step_code')
    
    if email not in user_progress:
        user_progress[email] = []
    
    # Check if already completed
    existing = next((p for p in user_progress[email] if p['step_code'] == step_code), None)
    if not existing:
        user_progress[email].append({
            'step_code': step_code,
            'status': 'complete',
            'completed_at': datetime.datetime.utcnow().isoformat()
        })
    
    return jsonify({'message': 'Step completed'})

@app.route('/api/v1/onboarding/tips/<module>', methods=['GET'])
def get_tips(module):
    """Get contextual tips for a module"""
    tips = [tip for tip in ONBOARDING_TIPS if tip['module'] == module]
    return jsonify(tips)

@app.route('/api/v1/onboarding/send-welcome', methods=['POST'])
def send_welcome_email():
    """Mock welcome email endpoint"""
    return jsonify({'message': 'Welcome email sent (demo mode)'})

@app.route('/api/v1/projects', methods=['GET'])
def get_projects():
    """Mock projects endpoint"""
    mock_projects = [
        {
            "id": 1,
            "name": "Bruiloft Jan & Marie",
            "client_name": "Jan Janssen",
            "start_date": "2025-10-15",
            "end_date": "2025-10-16",
            "notes": "Grote tent + 50 stoelen"
        },
        {
            "id": 2,
            "name": "Bedrijfsfeest TechCorp",
            "client_name": "TechCorp BV",
            "start_date": "2025-10-20",
            "end_date": "2025-10-21",
            "notes": "Geluidssysteem + belichting"
        }
    ]
    return jsonify(mock_projects)

@app.route('/api/v1/projects/<int:project_id>/dates', methods=['PUT'])
def update_project_dates(project_id):
    """Mock project date update"""
    return jsonify({'message': 'Project dates updated'})

@app.route('/health', methods=['GET'])
def health_check():
    """Health check endpoint"""
    return jsonify({
        'status': 'healthy',
        'service': 'RentGuy Demo Backend',
        'version': '1.0.0',
        'timestamp': datetime.datetime.utcnow().isoformat()
    })

@app.route('/', methods=['GET'])
def root():
    """Root endpoint"""
    return jsonify({
        'message': 'RentGuy Demo Backend API',
        'version': '1.0.0',
        'endpoints': {
            'auth': '/api/v1/auth/login',
            'onboarding': '/api/v1/onboarding/steps',
            'health': '/health'
        }
    })

if __name__ == '__main__':
    print("🚀 Starting RentGuy Demo Backend...")
    print("📍 Available at: http://localhost:5000")
    print("🔗 Health check: http://localhost:5000/health")
    print("📚 API docs: http://localhost:5000")
    app.run(host='0.0.0.0', port=5000, debug=True)
