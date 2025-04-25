"""
API package for Go Do List backend.
This package contains all the route handlers and business logic for the application.
"""

from flask import Flask
from flask_cors import CORS
from .database import init_db
from .task_routes import task_bp
from .folder_routes import folder_bp
from .file_routes import file_bp

def create_app():
    """Create and configure the Flask application."""
    app = Flask(__name__)
    
    # Configure CORS
    CORS(app, resources={
        r"/*": {
            "origins": ["http://localhost:5173"],
            "methods": ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
            "allow_headers": ["Content-Type", "Authorization"]
        }
    })
    
    # Initialize database
    init_db()
    
    # Register blueprints
    app.register_blueprint(task_bp)
    app.register_blueprint(folder_bp)
    app.register_blueprint(file_bp)
    
    return app 