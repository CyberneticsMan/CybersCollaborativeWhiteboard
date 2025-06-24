class CollaborativeWhiteboard {
    constructor() {
        this.canvas = document.getElementById('whiteboard');
        this.ctx = this.canvas.getContext('2d');
        this.socket = io();
        
        // Drawing state
        this.isDrawing = false;
        this.currentTool = 'pen';
        this.currentColor = '#000000';
        this.currentSize = 5;
        this.lastX = 0;
        this.lastY = 0;
        
        // User state
        this.currentUser = null;
        this.currentRoom = 'default';
        this.users = new Map();
        this.userCursors = new Map();
        
        this.initializeCanvas();
        this.setupEventListeners();
        this.setupSocketEvents();
        this.initializeRoom();
    }

    initializeCanvas() {
        // Set up canvas properties
        this.ctx.lineCap = 'round';
        this.ctx.lineJoin = 'round';
        this.ctx.globalCompositeOperation = 'source-over';
        
        // Handle high DPI displays
        const rect = this.canvas.getBoundingClientRect();
        const dpr = window.devicePixelRatio || 1;
        
        this.canvas.width = rect.width * dpr;
        this.canvas.height = rect.height * dpr;
        this.ctx.scale(dpr, dpr);
        
        this.canvas.style.width = rect.width + 'px';
        this.canvas.style.height = rect.height + 'px';
    }

    setupEventListeners() {
        // Canvas drawing events
        this.canvas.addEventListener('mousedown', this.startDrawing.bind(this));
        this.canvas.addEventListener('mousemove', this.draw.bind(this));
        this.canvas.addEventListener('mouseup', this.stopDrawing.bind(this));
        this.canvas.addEventListener('mouseout', this.stopDrawing.bind(this));
        
        // Touch events for mobile
        this.canvas.addEventListener('touchstart', this.handleTouch.bind(this));
        this.canvas.addEventListener('touchmove', this.handleTouch.bind(this));
        this.canvas.addEventListener('touchend', this.stopDrawing.bind(this));
        
        // Cursor tracking
        this.canvas.addEventListener('mousemove', this.trackCursor.bind(this));
        
        // Tool controls
        this.setupToolControls();
        this.setupRoomControls();
        this.setupActionControls();
        
        // Prevent scrolling when touching the canvas
        document.body.addEventListener('touchstart', (e) => {
            if (e.target === this.canvas) {
                e.preventDefault();
            }
        }, { passive: false });
        
        document.body.addEventListener('touchend', (e) => {
            if (e.target === this.canvas) {
                e.preventDefault();
            }
        }, { passive: false });
        
        document.body.addEventListener('touchmove', (e) => {
            if (e.target === this.canvas) {
                e.preventDefault();
            }
        }, { passive: false });
    }

    setupToolControls() {
        // Tool selection
        document.querySelectorAll('.tool-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const tool = e.target.dataset.tool;
                this.setTool(tool);
            });
        });
        
        // Color picker
        const colorPicker = document.getElementById('color-picker');
        colorPicker.addEventListener('change', (e) => {
            this.setColor(e.target.value);
        });
        
        // Preset colors
        document.querySelectorAll('.color-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const color = e.target.dataset.color;
                this.setColor(color);
                colorPicker.value = color;
            });
        });
        
        // Brush size
        const brushSize = document.getElementById('brush-size');
        const brushSizeDisplay = document.getElementById('brush-size-display');
        
        brushSize.addEventListener('input', (e) => {
            const size = parseInt(e.target.value);
            this.setSize(size);
            brushSizeDisplay.textContent = `${size}px`;
        });
    }

    setupRoomControls() {
        const joinRoomBtn = document.getElementById('join-room-btn');
        const roomInput = document.getElementById('room-input');
        const usernameInput = document.getElementById('username-input');
        
        joinRoomBtn.addEventListener('click', () => {
            const roomId = roomInput.value.trim() || 'default';
            const username = usernameInput.value.trim() || null;
            this.joinRoom(roomId, username);
        });
        
        // Allow Enter key to join room
        roomInput.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') {
                joinRoomBtn.click();
            }
        });
        
        usernameInput.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') {
                joinRoomBtn.click();
            }
        });
    }

    setupActionControls() {
        // Clear canvas
        document.getElementById('clear-btn').addEventListener('click', () => {
            if (confirm('Are you sure you want to clear the entire canvas? This action cannot be undone.')) {
                this.clearCanvas();
            }
        });
        
        // Save canvas
        document.getElementById('save-btn').addEventListener('click', () => {
            this.saveCanvas();
        });
    }

    setupSocketEvents() {
        this.socket.on('connect', () => {
            this.updateConnectionStatus(true);
            console.log('Connected to server');
        });
        
        this.socket.on('disconnect', () => {
            this.updateConnectionStatus(false);
            console.log('Disconnected from server');
        });
        
        this.socket.on('user_connected', (data) => {
            this.currentUser = data.user_id;
        });
        
        this.socket.on('drawing_data', (data) => {
            this.loadDrawingData(data.data);
        });
        
        this.socket.on('draw', (data) => {
            this.drawFromRemote(data);
        });
        
        this.socket.on('erase', (data) => {
            this.eraseFromRemote(data);
        });
        
        this.socket.on('clear_canvas', () => {
            this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
        });
        
        this.socket.on('user_joined', (data) => {
            this.showNotification(`${data.username} joined the room`, 'info');
        });
        
        this.socket.on('user_left', (data) => {
            this.showNotification(`${data.username} left the room`, 'info');
            this.removeUserCursor(data.user_id);
        });
        
        this.socket.on('users_update', (data) => {
            this.updateUsersList(data.users);
        });
        
        this.socket.on('cursor_move', (data) => {
            this.updateUserCursor(data);
        });
        
        this.socket.on('user_tool_change', (data) => {
            // Could be used to show what tool other users are using
            console.log(`${data.username} changed tool:`, data.tool_data);
        });
    }

    initializeRoom() {
        // Check if room ID is provided in URL
        const roomId = window.initialRoomId || 'default';
        const roomInput = document.getElementById('room-input');
        roomInput.value = roomId;
        
        // Auto-join the room
        setTimeout(() => {
            this.joinRoom(roomId);
        }, 100);
    }

    // Drawing methods
    startDrawing(e) {
        this.isDrawing = true;
        const coords = this.getMousePos(e);
        this.lastX = coords.x;
        this.lastY = coords.y;
    }

    draw(e) {
        if (!this.isDrawing) return;
        
        const coords = this.getMousePos(e);
        const drawData = {
            x0: this.lastX,
            y0: this.lastY,
            x1: coords.x,
            y1: coords.y,
            color: this.currentColor,
            size: this.currentSize,
            tool: this.currentTool
        };
        
        if (this.currentTool === 'pen') {
            this.drawLine(drawData);
            this.socket.emit('draw', drawData);
        } else if (this.currentTool === 'eraser') {
            this.eraseLine(drawData);
            this.socket.emit('erase', drawData);
        }
        
        this.lastX = coords.x;
        this.lastY = coords.y;
    }

    stopDrawing() {
        this.isDrawing = false;
    }

    drawLine(data) {
        this.ctx.globalCompositeOperation = 'source-over';
        this.ctx.strokeStyle = data.color;
        this.ctx.lineWidth = data.size;
        
        this.ctx.beginPath();
        this.ctx.moveTo(data.x0, data.y0);
        this.ctx.lineTo(data.x1, data.y1);
        this.ctx.stroke();
    }

    eraseLine(data) {
        this.ctx.globalCompositeOperation = 'destination-out';
        this.ctx.lineWidth = data.size;
        
        this.ctx.beginPath();
        this.ctx.moveTo(data.x0, data.y0);
        this.ctx.lineTo(data.x1, data.y1);
        this.ctx.stroke();
    }

    drawFromRemote(data) {
        this.drawLine(data);
    }

    eraseFromRemote(data) {
        this.eraseLine(data);
    }

    // Touch event handling
    handleTouch(e) {
        e.preventDefault();
        const touch = e.touches[0];
        const mouseEvent = new MouseEvent(e.type === 'touchstart' ? 'mousedown' : 'mousemove', {
            clientX: touch.clientX,
            clientY: touch.clientY
        });
        this.canvas.dispatchEvent(mouseEvent);
    }

    // Utility methods
    getMousePos(e) {
        const rect = this.canvas.getBoundingClientRect();
        return {
            x: e.clientX - rect.left,
            y: e.clientY - rect.top
        };
    }

    trackCursor(e) {
        const coords = this.getMousePos(e);
        
        // Update coordinates display
        document.getElementById('mouse-coords').textContent = 
            `📍 x: ${Math.round(coords.x)}, y: ${Math.round(coords.y)}`;
        
        // Emit cursor position to other users
        this.socket.emit('cursor_move', coords);
    }

    // Tool management
    setTool(tool) {
        this.currentTool = tool;
        
        // Update UI
        document.querySelectorAll('.tool-btn').forEach(btn => {
            btn.classList.remove('active');
        });
        document.querySelector(`[data-tool="${tool}"]`).classList.add('active');
        
        // Update cursor style
        if (tool === 'eraser') {
            this.canvas.classList.add('eraser');
        } else {
            this.canvas.classList.remove('eraser');
        }
        
        // Notify other users
        this.socket.emit('change_tool', { tool: tool });
    }

    setColor(color) {
        this.currentColor = color;
        this.socket.emit('change_tool', { color: color });
    }

    setSize(size) {
        this.currentSize = size;
        this.socket.emit('change_tool', { size: size });
    }

    // Room management
    joinRoom(roomId, username) {
        this.currentRoom = roomId;
        this.socket.emit('join_room', {
            room_id: roomId,
            username: username
        });
        
        // Update UI
        document.getElementById('room-name').textContent = `Room: ${roomId}`;
    }

    // Canvas actions
    clearCanvas() {
        this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
        this.socket.emit('clear_canvas');
    }

    saveCanvas() {
        const link = document.createElement('a');
        link.download = `whiteboard-${this.currentRoom}-${new Date().toISOString().slice(0, 19)}.png`;
        link.href = this.canvas.toDataURL();
        link.click();
    }

    loadDrawingData(data) {
        this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
        
        data.forEach(event => {
            if (event.type === 'draw') {
                this.drawLine(event.data);
            } else if (event.type === 'erase') {
                this.eraseLine(event.data);
            }
        });
    }

    // User management
    updateUsersList(users) {
        const usersList = document.getElementById('users-list');
        usersList.innerHTML = '';
        
        const userCount = users.length;
        document.getElementById('user-count').textContent = `Users: ${userCount}`;
        
        users.forEach(user => {
            const userItem = document.createElement('div');
            userItem.className = 'user-item';
            if (user.user_id === this.currentUser) {
                userItem.classList.add('you');
            }
            
            userItem.innerHTML = `
                <div class="user-color" style="background: ${user.color || '#000000'}"></div>
                <span>${user.username}${user.user_id === this.currentUser ? ' (You)' : ''}</span>
            `;
            
            usersList.appendChild(userItem);
        });
    }

    updateUserCursor(data) {
        const cursorsContainer = document.getElementById('cursors-container');
        let cursor = this.userCursors.get(data.user_id);
        
        if (!cursor) {
            cursor = document.createElement('div');
            cursor.className = 'user-cursor';
            cursor.innerHTML = `
                <div class="cursor-pointer"></div>
                <div class="cursor-label">${data.username}</div>
            `;
            
            // Assign a color based on user ID
            const colors = ['#ff6b6b', '#4ecdc4', '#45b7d1', '#96ceb4', '#feca57', '#ff9ff3', '#54a0ff'];
            const color = colors[data.user_id.length % colors.length];
            cursor.style.color = color;
            
            cursorsContainer.appendChild(cursor);
            this.userCursors.set(data.user_id, cursor);
        }
        
        cursor.style.left = `${data.x}px`;
        cursor.style.top = `${data.y}px`;
    }

    removeUserCursor(userId) {
        const cursor = this.userCursors.get(userId);
        if (cursor) {
            cursor.remove();
            this.userCursors.delete(userId);
        }
    }

    // UI helpers
    updateConnectionStatus(connected) {
        const status = document.getElementById('connection-status');
        if (connected) {
            status.textContent = '🟢 Connected';
            status.className = 'connected';
        } else {
            status.textContent = '🔴 Disconnected';
            status.className = 'disconnected';
        }
    }

    showNotification(message, type = 'info') {
        // Simple notification system (could be enhanced)
        console.log(`[${type.toUpperCase()}] ${message}`);
        
        // You could implement a toast notification system here
        const notification = document.createElement('div');
        notification.textContent = message;
        notification.style.cssText = `
            position: fixed;
            top: 20px;
            right: 20px;
            background: ${type === 'info' ? '#17a2b8' : '#28a745'};
            color: white;
            padding: 10px 15px;
            border-radius: 4px;
            z-index: 1000;
            font-size: 0.9rem;
            box-shadow: 0 2px 10px rgba(0,0,0,0.1);
        `;
        
        document.body.appendChild(notification);
        
        setTimeout(() => {
            notification.remove();
        }, 3000);
    }
}

// Initialize the whiteboard when the page loads
document.addEventListener('DOMContentLoaded', () => {
    new CollaborativeWhiteboard();
});