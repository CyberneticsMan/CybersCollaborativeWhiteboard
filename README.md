# 🎨 Collaborative Whiteboard

A real-time collaborative whiteboard web application built with Python Flask and Socket.IO. Perfect for online meetings, brainstorming sessions, teaching, and creative collaboration.

![License](https://img.shields.io/badge/license-MIT-blue.svg)
![Python](https://img.shields.io/badge/python-3.8+-blue.svg)
![Flask](https://img.shields.io/badge/flask-2.3+-green.svg)

## ✨ Features

- **Real-time Collaboration**: Multiple users can draw simultaneously with live synchronization
- **Multiple Rooms**: Create and join different rooms for separate sessions
- **Drawing Tools**: Pen and eraser with customizable colors and brush sizes
- **User Awareness**: See other users' cursors in real-time with their names
- **Persistent Sessions**: Room state is maintained as users join and leave
- **Mobile Support**: Touch-friendly interface that works on tablets and phones
- **Export Functionality**: Save your whiteboard as PNG images
- **Clean UI**: Modern, responsive design with intuitive controls

## 🚀 Quick Start

### Prerequisites

- Python 3.8 or higher
- pip (Python package manager)

### Installation

1. **Clone the repository**
   ```bash
   git clone https://github.com/yourusername/collaborative-whiteboard.git
   cd collaborative-whiteboard
   ```

2. **Create a virtual environment**
   ```bash
   python -m venv .venv
   source .venv/bin/activate  # On Windows: .venv\Scripts\activate
   ```

3. **Install dependencies**
   ```bash
   pip install -r requirements.txt
   ```

4. **Run the application**
   ```bash
   python main.py
   ```

5. **Open your browser**
   Navigate to `http://localhost:5000`

## 🎯 Usage

### Basic Usage

1. **Enter your name** in the username field (optional)
2. **Join a room** by entering a room ID or use the default room
3. **Start drawing** using the pen tool
4. **Switch tools** between pen and eraser
5. **Customize** your brush color and size
6. **Collaborate** with others in real-time!

### Room Management

- **Default Room**: All users start in the "default" room
- **Custom Rooms**: Create private sessions by entering a unique room ID
- **Direct Links**: Share URLs like `http://localhost:5000/room/my-room-name` for easy access
- **Persistent State**: Drawings remain in the room even when users leave

### Drawing Features

- **Pen Tool**: Draw with customizable colors and sizes (1-50px)
- **Eraser Tool**: Remove parts of your drawing
- **Color Picker**: Choose any color or use preset colors
- **Clear Canvas**: Remove all drawings (requires confirmation)
- **Save Image**: Download the current canvas as a PNG file

## 🏗️ Architecture

### Backend (Python/Flask)

- **Flask**: Web framework for serving the application
- **Flask-SocketIO**: Real-time bidirectional communication
- **Room Management**: Isolated drawing sessions
- **Event Handling**: Draw, erase, user management events

### Frontend (HTML/CSS/JavaScript)

- **Canvas API**: High-performance drawing with HTML5 Canvas
- **Socket.IO Client**: Real-time communication with the server
- **Responsive Design**: Works on desktop, tablet, and mobile
- **ES6 Classes**: Clean, modular JavaScript architecture

### Key Components

```
main.py                 # Flask application and Socket.IO handlers
templates/index.html    # Main HTML template
static/css/style.css    # Responsive styles and animations
static/js/whiteboard.js # Client-side drawing and collaboration logic
```

## 🔧 Configuration

### Environment Variables

You can customize the application using environment variables:

```bash
export FLASK_SECRET_KEY="your-secret-key"
export FLASK_HOST="0.0.0.0"
export FLASK_PORT="5000"
export FLASK_DEBUG="False"
```

### Production Deployment

For production deployment, consider:

1. **Use a production WSGI server** (gunicorn is included):
   ```bash
   gunicorn --worker-class eventlet -w 1 main:app
   ```

2. **Set a secure secret key** in production
3. **Use a reverse proxy** (nginx) for better performance
4. **Enable HTTPS** for secure connections

## 🤝 Contributing

We welcome contributions! Here's how you can help:

1. **Fork** the repository
2. **Create** a feature branch (`git checkout -b feature/amazing-feature`)
3. **Commit** your changes (`git commit -m 'Add amazing feature'`)
4. **Push** to the branch (`git push origin feature/amazing-feature`)
5. **Open** a Pull Request

### Development Setup

1. Follow the installation steps above
2. Enable debug mode by setting `debug=True` in `main.py`
3. The application will auto-reload on code changes

### Code Style

- Follow PEP 8 for Python code
- Use meaningful variable and function names
- Add comments for complex logic
- Keep functions small and focused

## 📝 API Documentation

### Socket.IO Events

#### Client to Server

- `join_room`: Join a specific room
- `draw`: Send drawing data
- `erase`: Send eraser data
- `clear_canvas`: Clear the entire canvas
- `cursor_move`: Update cursor position
- `change_tool`: Notify tool changes

#### Server to Client

- `user_connected`: User connection confirmation
- `drawing_data`: Initial room drawing data
- `draw`: Receive drawing data from others
- `erase`: Receive eraser data from others
- `clear_canvas`: Canvas cleared by another user
- `user_joined`: User joined notification
- `user_left`: User left notification
- `users_update`: Updated users list
- `cursor_move`: Other users' cursor positions

## 🐛 Troubleshooting

### Common Issues

1. **Canvas not responding**: Check if JavaScript is enabled
2. **Connection issues**: Verify the server is running on the correct port
3. **Mobile drawing problems**: Ensure touch events are supported
4. **Performance issues**: Reduce brush size or refresh the page

### Debug Mode

Enable debug mode in `main.py`:
```python
socketio.run(app, debug=True, host='0.0.0.0', port=5000)
```

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🙏 Acknowledgments

- Built with [Flask](https://flask.palletsprojects.com/) and [Socket.IO](https://socket.io/)
- Canvas drawing techniques inspired by modern web standards
- UI design follows modern web design principles

## 🔮 Future Enhancements

- [ ] Shape tools (rectangles, circles, lines)
- [ ] Text tool with customizable fonts
- [ ] Layers support
- [ ] Undo/Redo functionality
- [ ] User authentication and room permissions
- [ ] Drawing history and version control
- [ ] Integration with cloud storage
- [ ] Voice/video chat integration
- [ ] Mobile app versions

---

**Made with ❤️ for collaborative creativity**