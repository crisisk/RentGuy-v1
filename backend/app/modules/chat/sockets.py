import socketio
from fastapi import Depends
from sqlalchemy.orm import Session
from app.core.db import get_db_session
from app.modules.auth.deps import get_current_user
from app.modules.auth.models import User
from app.modules.chat.repo import ChatRepo
from app.modules.chat.schemas import MessageOut

# Assuming the sio server is imported from app.realtime
from app.realtime import sio

@socketio.on('send_message')
async def send_message(sid, data, db: Session = Depends(get_db_session), user: User = Depends(get_current_user)):
    """
    Handles incoming chat messages and broadcasts them to the project room.
    Data format: {project_id: int, content: str}
    """
    try:
        project_id = data.get('project_id')
        content = data.get('content')

        if not project_id or not content:
            await sio.emit('error', {'message': 'Missing project_id or content'}, room=sid)
            return

        # 1. Save the message to the database
        repo = ChatRepo(db)
        message_model = repo.create_message(
            project_id=project_id,
            user_id=user.id,
            content=content
        )

        # 2. Prepare the message for broadcast
        message_out = MessageOut.model_validate(message_model).model_dump_json()

        # 3. Broadcast the message to all clients in the project room
        await sio.to(f'project_{project_id}').emit('new_message', message_out)

    except Exception as e:
        print(f"Error processing chat message for user {user.id}: {e}")
        await sio.emit('error', {'message': 'Failed to process chat message'}, room=sid)

