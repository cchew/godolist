"""
Flask application for Go Do List backend API.
This module provides the entry point for the application.
"""

from api import create_app

app = create_app()

if __name__ == '__main__':
    app.run(debug=True)