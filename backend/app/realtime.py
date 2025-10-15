import socketio

from app.modules.chat import sockets as chat_sockets
from app.modules.crew import sockets as crew_sockets

sio = socketio.AsyncServer(async_mode="asgi", cors_allowed_origins="*")
socket_app = socketio.ASGIApp(sio)

crew_sockets.register_socket_server(sio)
chat_sockets.register_socket_server(sio)

sio.on("connect", crew_sockets.connect)
sio.on("disconnect", crew_sockets.disconnect)
sio.on("join_project", crew_sockets.join_project)
sio.on("leave_project", crew_sockets.leave_project)
sio.on("update_location", crew_sockets.update_location)
sio.on("send_message", chat_sockets.send_message)

