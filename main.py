from flask import Flask, render_template, request
from flask_socketio import SocketIO, emit, join_room, leave_room
import uuid
from datetime import datetime
import hashlib
import secrets

app = Flask(__name__)
app.config['SECRET_KEY'] = 'your-secret-key-change-in-production'
socketio = SocketIO(app, cors_allowed_origins="*")

# Store active drawing data and users
drawing_data = []
active_users = {}
rooms = {}
private_rooms = {}  # Store private room configurations


def hash_password(password):
    """Hash a password for storing"""
    return hashlib.sha256(password.encode()).hexdigest()


def verify_password(password, hashed):
    """Verify a password against its hash"""
    return hashlib.sha256(password.encode()).hexdigest() == hashed


@app.route('/')
def index():
    """Main whiteboard page"""
    return render_template('index.html')


@app.route('/room/<room_id>')
def room(room_id):
    """Join a specific room"""
    return render_template('index.html', room_id=room_id)


@socketio.on('connect')
def on_connect():
    """Handle user connection"""
    user_id = str(uuid.uuid4())
    active_users[request.sid] = {
        'user_id': user_id,
        'username': f'User_{user_id[:8]}',
        'room': None,
        'cursor_position': {'x': 0, 'y': 0},
        'color': '#000000'
    }
    emit('user_connected', {'user_id': user_id})
    print(f"User {user_id} connected")


@socketio.on('disconnect')
def on_disconnect():
    """Handle user disconnection"""
    if request.sid in active_users:
        user = active_users[request.sid]
        if user['room']:
            leave_room(user['room'])
            # Notify other users in the room
            emit('user_left', {
                'user_id': user['user_id'],
                'username': user['username']
            }, room=user['room'])
        del active_users[request.sid]
        print(f"User {user['user_id']} disconnected")


@socketio.on('create_private_room')
def on_create_private_room(data):
    """Handle private room creation"""
    room_name = data.get('room_name', '').strip()
    password = data.get('password', '').strip()
    max_users = data.get('max_users', 10)
    
    if not room_name or not password:
        emit('room_creation_error', {'message': 'Room name and password are required'})
        return
    
    if len(room_name) < 3:
        emit('room_creation_error', {'message': 'Room name must be at least 3 characters'})
        return
    
    if len(password) < 4:
        emit('room_creation_error', {'message': 'Password must be at least 4 characters'})
        return
    
    # Generate unique room ID
    room_id = f"private_{secrets.token_urlsafe(8)}"
    
    # Store private room configuration
    private_rooms[room_id] = {
        'name': room_name,
        'password_hash': hash_password(password),
        'max_users': max_users,
        'created_at': datetime.now().isoformat(),
        'creator': active_users[request.sid]['user_id']
    }
    
    # Initialize room
    rooms[room_id] = {
        'drawing_data': [],
        'users': {},
        'is_private': True,
        'name': room_name
    }
    
    emit('private_room_created', {
        'room_id': room_id,
        'room_name': room_name,
        'max_users': max_users
    })


@socketio.on('join_room')
def on_join_room(data):
    """Handle user joining a room"""
    room_id = data.get('room_id', 'default')
    username = data.get('username', f'User_{str(uuid.uuid4())[:8]}')
    password = data.get('password', '')
    
    # Check if it's a private room
    if room_id in private_rooms:
        if not password:
            emit('room_join_error', {'message': 'Password required for private room'})
            return
        
        if not verify_password(password, private_rooms[room_id]['password_hash']):
            emit('room_join_error', {'message': 'Incorrect password'})
            return
        
        # Check max users limit
        current_users = len(rooms.get(room_id, {}).get('users', {}))
        if current_users >= private_rooms[room_id]['max_users']:
            emit('room_join_error', {'message': 'Room is full'})
            return
    
    if request.sid in active_users:
        user = active_users[request.sid]
        
        # Leave previous room if any
        if user['room']:
            leave_room(user['room'])
            if user['room'] in rooms and request.sid in rooms[user['room']]['users']:
                del rooms[user['room']]['users'][request.sid]
        
        # Join new room
        join_room(room_id)
        user['room'] = room_id
        user['username'] = username
        
        # Initialize room if it doesn't exist
        if room_id not in rooms:
            rooms[room_id] = {
                'drawing_data': [],
                'users': {},
                'is_private': False,
                'name': room_id
            }
        
        rooms[room_id]['users'][request.sid] = user
        
        # Send current drawing data to the new user
        emit('drawing_data', {'data': rooms[room_id]['drawing_data']})
        
        # Send room info
        room_info = {
            'room_id': room_id,
            'room_name': rooms[room_id]['name'],
            'is_private': rooms[room_id]['is_private'],
            'user_count': len(rooms[room_id]['users'])
        }
        emit('room_joined', room_info)
        
        # Notify other users in the room
        emit('user_joined', {
            'user_id': user['user_id'],
            'username': username
        }, room=room_id, include_self=False)
        
        # Send current users list
        users_list = [u for u in rooms[room_id]['users'].values()]
        emit('users_update', {'users': users_list}, room=room_id)


@socketio.on('draw')
def on_draw(data):
    """Handle drawing events"""
    if request.sid in active_users:
        user = active_users[request.sid]
        room_id = user['room']
        
        if room_id and room_id in rooms:
            # Add drawing data to room
            drawing_event = {
                'type': 'draw',
                'data': data,
                'user_id': user['user_id'],
                'timestamp': datetime.now().isoformat()
            }
            rooms[room_id]['drawing_data'].append(drawing_event)
            
            # Broadcast to all users in the room except sender
            emit('draw', data, room=room_id, include_self=False)


@socketio.on('erase')
def on_erase(data):
    """Handle eraser events"""
    if request.sid in active_users:
        user = active_users[request.sid]
        room_id = user['room']
        
        if room_id and room_id in rooms:
            # Add erase data to room
            erase_event = {
                'type': 'erase',
                'data': data,
                'user_id': user['user_id'],
                'timestamp': datetime.now().isoformat()
            }
            rooms[room_id]['drawing_data'].append(erase_event)
            
            # Broadcast to all users in the room except sender
            emit('erase', data, room=room_id, include_self=False)


@socketio.on('clear_canvas')
def on_clear_canvas():
    """Handle canvas clearing"""
    if request.sid in active_users:
        user = active_users[request.sid]
        room_id = user['room']
        
        if room_id and room_id in rooms:
            # Clear room drawing data
            rooms[room_id]['drawing_data'] = []
            
            # Broadcast to all users in the room
            emit('clear_canvas', room=room_id)


@socketio.on('cursor_move')
def on_cursor_move(data):
    """Handle cursor movement for collaborative awareness"""
    if request.sid in active_users:
        user = active_users[request.sid]
        room_id = user['room']
        
        if room_id:
            user['cursor_position'] = {'x': data['x'], 'y': data['y']}
            
            # Broadcast cursor position to other users in the room
            emit('cursor_move', {
                'user_id': user['user_id'],
                'username': user['username'],
                'x': data['x'],
                'y': data['y']
            }, room=room_id, include_self=False)


@socketio.on('change_tool')
def on_change_tool(data):
    """Handle tool changes (brush size, color, etc.)"""
    if request.sid in active_users:
        user = active_users[request.sid]
        room_id = user['room']
        
        if 'color' in data:
            user['color'] = data['color']
        
        if room_id:
            # Broadcast tool change to other users
            emit('user_tool_change', {
                'user_id': user['user_id'],
                'username': user['username'],
                'tool_data': data
            }, room=room_id, include_self=False)


if __name__ == '__main__':
    socketio.run(app, debug=True, host='0.0.0.0', port=5000)