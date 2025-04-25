"""
Folder management routes for Go Do List.
"""

from flask import Blueprint, request, jsonify
from .database import db_path
import sqlite3

folder_bp = Blueprint('folders', __name__)

@folder_bp.route('/folders', methods=['GET', 'POST'])
def manage_folders():
    """
    Manage folders (GET: list all folders, POST: create new folder).
    
    Returns:
        Response: JSON response with folder data
    """
    if request.method == 'GET':
        with sqlite3.connect(db_path) as conn:
            cursor = conn.cursor()
            cursor.execute('SELECT id, name FROM folders')
            folders = [{'id': row[0], 'name': row[1]} for row in cursor.fetchall()]
            return jsonify(folders)

    if request.method == 'POST':
        data = request.json
        with sqlite3.connect(db_path) as conn:
            cursor = conn.cursor()
            cursor.execute('INSERT INTO folders (name) VALUES (?)', (data['name'],))
            folder_id = cursor.lastrowid
            conn.commit()
            return jsonify({'id': folder_id, 'name': data['name']}), 201 