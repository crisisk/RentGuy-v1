import socketio
from fastapi import Depends
from sqlalchemy.orm import Session
from app.core.db import get_db_session
from app.modules.crew.models import Location
from app.modules.auth.deps import get_current_user
from app.modules.auth.models import User
from geoalchemy2.elements import WKTElement
from datetime import datetime

# Assuming the sio server is stored in the app state (from app.main.py)
# We need a way to access it, typically via the request object in a FastAPI route,
# but for Socket.IO, we'll rely on the global sio object or a dependency injection pattern.

# For simplicity, we'll use the global sio object for now, assuming it's imported
# from app.main or passed in a more complex setup.

# --- Socket.IO Event Handlers ---

@socketio.on('connect')
async def connect(sid, environ):
    # Authentication check can be done here using headers/cookies from environ
    # For now, just accept the connection
    print(f"Client connected: {sid}")
    # Example: await sio.emit('status', {'message': 'Connected to RentGuy Realtime'}, room=sid)

@socketio.on('disconnect')
def disconnect(sid):
    print(f"Client disconnected: {sid}")

@socketio.on('join_project')
async def join_project(sid, data):
    project_id = data.get('project_id')
    if project_id:
        sio.enter_room(sid, f'project_{project_id}')
        print(f"Client {sid} joined room project_{project_id}")
        await sio.emit('status', {'message': f'Joined project {project_id}'}, room=sid)

@socketio.on('leave_project')
async def leave_project(sid, data):
    project_id = data.get('project_id')
    if project_id:
        sio.leave_room(sid, f'project_{project_id}')
        print(f"Client {sid} left room project_{project_id}")
        await sio.emit('status', {'message': f'Left project {project_id}'}, room=sid)

@socketio.on('update_location')
async def update_location(sid, data, db: Session = Depends(get_db_session), user: User = Depends(get_current_user)):
    """
    Handles real-time location updates from a crew member.
    Data format: {latitude: float, longitude: float, accuracy: float, project_id: int}
    """
    try:
        latitude = data['latitude']
        longitude = data['longitude']
        project_id = data.get('project_id')
        accuracy = data.get('accuracy')
        speed = data.get('speed')
        heading = data.get('heading')

        # 1. Create WKT (Well-Known Text) representation of the point
        point = WKTElement(f'POINT({longitude} {latitude})', srid=4326)

        # 2. Upsert the location data
        # Check if a location record already exists for this user
        existing_location = db.query(Location).filter(Location.user_id == user.id).first()

        if existing_location:
            # Update existing record
            existing_location.geom = point
            existing_location.timestamp = datetime.now()
            existing_location.accuracy = accuracy
            existing_location.speed = speed
            existing_location.heading = heading
            existing_location.project_id = project_id
        else:
            # Create new record
            new_location = Location(
                user_id=user.id,
                geom=point,
                accuracy=accuracy,
                speed=speed,
                heading=heading,
                project_id=project_id
            )
            db.add(new_location)

        db.commit()

        # 3. Broadcast the update to all clients in the project room
        location_data = {
            'user_id': user.id,
            'latitude': latitude,
            'longitude': longitude,
            'timestamp': datetime.now().isoformat(),
            'project_id': project_id
        }

        if project_id:
            await sio.to(f'project_{project_id}').emit('location_update', location_data)
        
        # Also broadcast to a general room for all managers
        await sio.to('managers').emit('location_update', location_data)

    except Exception as e:
        print(f"Error processing location update for user {user.id}: {e}")
        await sio.emit('error', {'message': 'Failed to process location update'}, room=sid)

# We need to ensure the dependencies (get_db_session, get_current_user) work
# within the Socket.IO context. This often requires custom middleware or wrappers
# in a real-world FastAPI/Socket.IO integration. For this implementation, we'll
# assume a simple dependency injection setup is sufficient for now.

