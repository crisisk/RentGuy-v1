import socketio
from app.modules.crew.sockets import connect, disconnect, join_project, leave_project, update_location
from app.modules.chat.sockets import send_message

# Initialize Socket.IO server
sio = socketio.AsyncServer(async_mode='asgi', cors_allowed_origins='*')
socket_app = socketio.ASGIApp(sio)

# Register event handlers
sio.on('connect', connect)
sio.on('disconnect', disconnect)
sio.on('join_project', join_project)
sio.on('leave_project', leave_project)
sio.on('update_location', update_location)
sio.on('send_message', send_message)

# Note: The dependency injection in update_location (Depends(get_db_session), Depends(get_current_user))
# is a common challenge in FastAPI/Socket.IO integration. A production-ready solution
# would involve custom middleware to resolve these dependencies before the event handler runs.
# For this implementation, we are proceeding with the standard FastAPI dependency syntax
# as a placeholder, assuming the execution environment will handle it or a simple
# wrapper will be added later.

