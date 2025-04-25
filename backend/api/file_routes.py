"""
File upload and download routes for Go Do List.
"""

import sqlite3
import os
from flask import Blueprint, request, jsonify, send_file
from werkzeug.utils import secure_filename
from .database import db_path, UPLOAD_FOLDER
from .file_handler import allowed_file, process_file

file_bp = Blueprint('files', __name__)

@file_bp.route('/tasks/<int:task_id>/files', methods=['POST'])
def upload_file(task_id):
    """
    Upload a file for a task.
    
    Args:
        task_id (int): ID of the task to attach file to
        
    Returns:
        Response: JSON response with file data
    """
    if 'file' not in request.files:
        return jsonify({'error': 'No file provided'}), 400
        
    file = request.files['file']
    if file.filename == '':
        return jsonify({'error': 'No file selected'}), 400
        
    if not allowed_file(file.filename):
        return jsonify({'error': 'File type not allowed'}), 400
        
    try:
        # Verify task exists
        with sqlite3.connect(db_path) as conn:
            cursor = conn.cursor()
            cursor.execute('SELECT id FROM tasks WHERE id = ?', (task_id,))
            if not cursor.fetchone():
                return jsonify({'error': 'Task not found'}), 404

            # Generate unique filename to prevent conflicts
            base_filename = secure_filename(file.filename)
            filename = f"{task_id}_{base_filename}"
            file_path = os.path.join(UPLOAD_FOLDER, filename)
            
            # Check if file already exists for this task
            cursor.execute(
                'SELECT id FROM task_files WHERE task_id = ? AND filename = ?',
                (task_id, base_filename)
            )
            if cursor.fetchone():
                return jsonify({'error': 'File already exists for this task'}), 400

            file.save(file_path)
            
            cursor.execute(
                '''INSERT INTO task_files (task_id, filename, file_path) 
                   VALUES (?, ?, ?)''',
                (task_id, base_filename, file_path)
            )
            file_id = cursor.lastrowid
            conn.commit()
            
            # Process the file
            embedding_id = process_file(file_path, task_id)
            
            # Update the file record with the embedding_id
            cursor.execute(
                'UPDATE task_files SET embedding_id = ? WHERE id = ?',
                (embedding_id, file_id)
            )
            conn.commit()
            
            return jsonify({
                'id': file_id,
                'task_id': task_id,
                'filename': base_filename,
                'file_path': file_path,
                'embedding_id': embedding_id
            }), 201
            
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@file_bp.route('/tasks/<int:task_id>/files', methods=['GET'])
def get_task_files(task_id):
    """
    Get all files attached to a task.
    
    Args:
        task_id (int): ID of the task
        
    Returns:
        Response: JSON response with file data
    """
    with sqlite3.connect(db_path) as conn:
        cursor = conn.cursor()
        cursor.execute(
            'SELECT id, filename, file_path, embedding_id FROM task_files WHERE task_id = ?',
            (task_id,)
        )
        files = [
            {
                'id': row[0],
                'filename': row[1],
                'file_path': row[2],
                'embedding_id': row[3]
            }
            for row in cursor.fetchall()
        ]
        return jsonify(files)

@file_bp.route('/files/<int:file_id>', methods=['GET'])
def download_file(file_id):
    """
    Download a file.
    
    Args:
        file_id (int): ID of the file to download
        
    Returns:
        Response: File download response
    """
    with sqlite3.connect(db_path) as conn:
        cursor = conn.cursor()
        cursor.execute('SELECT filename, file_path FROM task_files WHERE id = ?', (file_id,))
        row = cursor.fetchone()
        
        if row:
            return send_file(row[1], as_attachment=True, download_name=row[0])
        else:
            return jsonify({'error': 'File not found'}), 404

@file_bp.route('/files/<int:file_id>', methods=['DELETE'])
def delete_file(file_id):
    """
    Delete a file.
    
    Args:
        file_id (int): ID of the file to delete
        
    Returns:
        Response: Empty response with 204 status code
    """
    try:
        with sqlite3.connect(db_path) as conn:
            cursor = conn.cursor()
            # Get file path before deleting
            cursor.execute('SELECT file_path FROM task_files WHERE id = ?', (file_id,))
            row = cursor.fetchone()
            
            if not row:
                return jsonify({'error': 'File not found'}), 404
                
            file_path = row[0]
            
            # Delete from database
            cursor.execute('DELETE FROM task_files WHERE id = ?', (file_id,))
            conn.commit()
            
            # Delete physical file
            if os.path.exists(file_path):
                os.remove(file_path)
                
            return '', 204
            
    except Exception as e:
        return jsonify({'error': str(e)}), 500 