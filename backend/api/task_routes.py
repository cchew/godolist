"""
Task management routes for Go Do List.
"""

from flask import Blueprint, request, jsonify
from .database import db_path
from datetime import datetime
import sqlite3

task_bp = Blueprint('tasks', __name__)

@task_bp.route('/tasks', methods=['GET', 'POST', 'PATCH', 'DELETE'])
def manage_tasks():
    """
    Manage tasks (GET: list tasks, POST: create task, PATCH: update task, DELETE: delete task).
    
    Returns:
        Response: JSON response with task data
    """
    if request.method == 'GET':
        folder_id = request.args.get('folder_id')
        with sqlite3.connect(db_path) as conn:
            conn.row_factory = sqlite3.Row
            cursor = conn.cursor()
            if folder_id:
                cursor.execute('''
                    SELECT id, folder_id, title, completed, is_important, notes, due_date, created_at 
                    FROM tasks WHERE folder_id = ?
                ''', (folder_id,))
            else:
                cursor.execute('SELECT id, folder_id, title, completed, is_important, notes, due_date, created_at FROM tasks')
            
            tasks = []
            for row in cursor.fetchall():
                tasks.append({
                    'id': row['id'],
                    'folder_id': row['folder_id'],
                    'title': row['title'],
                    'completed': bool(row['completed']),
                    'isImportant': bool(row['is_important']),
                    'notes': row['notes'],
                    'dueDate': row['due_date'],
                    'createdAt': row['created_at']
                })
            return jsonify(tasks)

    if request.method == 'POST':
        data = request.json
        if not data or 'title' not in data:
            return jsonify({'error': 'Title is required'}), 400
            
        try:
            with sqlite3.connect(db_path) as conn:
                cursor = conn.cursor()
                # Convert empty string or 'unassigned' to None for folder_id
                folder_id = data.get('folder_id')
                if folder_id == '' or folder_id == 'unassigned':
                    folder_id = None
                
                cursor.execute(
                    '''INSERT INTO tasks (folder_id, title, completed, is_important, notes, due_date, created_at) 
                       VALUES (?, ?, ?, ?, ?, ?, ?)''',
                    (
                        folder_id,  # Will be NULL in database if None
                        data['title'],
                        data.get('completed', False),
                        data.get('isImportant', False),
                        data.get('notes', ''),
                        data.get('dueDate'),
                        datetime.now().isoformat()
                    )
                )
                task_id = cursor.lastrowid
                conn.commit()
                
                # Return the created task with consistent field names
                return jsonify({
                    'id': task_id,
                    'folder_id': folder_id,  # Will be null in response if None
                    'title': data['title'],
                    'completed': data.get('completed', False),
                    'isImportant': data.get('isImportant', False),
                    'notes': data.get('notes', ''),
                    'dueDate': data.get('dueDate'),
                    'createdAt': datetime.now().isoformat()
                }), 201
                
        except Exception as e:
            return jsonify({'error': str(e)}), 500

    if request.method == 'PATCH':
        task_id = request.args.get('id')
        if not task_id:
            return jsonify({'error': 'Task ID is required'}), 400
            
        data = request.json
        if not data:
            return jsonify({'error': 'No update data provided'}), 400
            
        try:
            with sqlite3.connect(db_path) as conn:
                cursor = conn.cursor()
                
                # Build update query dynamically based on provided fields
                update_fields = []
                params = []
                
                if 'title' in data:
                    update_fields.append('title = ?')
                    params.append(data['title'])
                    
                if 'completed' in data:
                    update_fields.append('completed = ?')
                    params.append(data['completed'])
                    
                if 'isImportant' in data:
                    update_fields.append('is_important = ?')
                    params.append(data['isImportant'])
                    
                if 'notes' in data:
                    update_fields.append('notes = ?')
                    params.append(data['notes'])
                    
                if 'folder_id' in data:
                    folder_id = data['folder_id']
                    if folder_id == '' or folder_id == 'unassigned':
                        folder_id = None
                    update_fields.append('folder_id = ?')
                    params.append(folder_id)
                
                if 'dueDate' in data:
                    update_fields.append('due_date = ?')
                    params.append(data['dueDate'])
                
                if not update_fields:
                    return jsonify({'error': 'No valid fields to update'}), 400
                
                # Add task_id to params
                params.append(task_id)
                
                # Execute update
                cursor.execute(
                    f'''UPDATE tasks 
                        SET {', '.join(update_fields)}
                        WHERE id = ?''',
                    params
                )
                conn.commit()
                
                # Return updated task
                cursor.execute('''
                    SELECT id, folder_id, title, completed, is_important, notes, due_date, created_at 
                    FROM tasks WHERE id = ?
                ''', (task_id,))
                row = cursor.fetchone()
                
                if row:
                    return jsonify({
                        'id': row[0],
                        'folder_id': row[1],
                        'title': row[2],
                        'completed': bool(row[3]),
                        'isImportant': bool(row[4]),
                        'notes': row[5],
                        'dueDate': row[6],
                        'createdAt': row[7]
                    })
                else:
                    return jsonify({'error': 'Task not found'}), 404
                    
        except Exception as e:
            return jsonify({'error': str(e)}), 500

    if request.method == 'DELETE':
        task_id = request.args.get('id')
        if not task_id:
            return jsonify({'error': 'Task ID is required'}), 400
            
        try:
            with sqlite3.connect(db_path) as conn:
                cursor = conn.cursor()
                cursor.execute('DELETE FROM tasks WHERE id = ?', (task_id,))
                conn.commit()
                return '', 204
        except Exception as e:
            return jsonify({'error': str(e)}), 500

@task_bp.route('/process-task', methods=['POST'])
def process_task():
    """
    Process a task using the general agent.
    
    Returns:
        Response: JSON response with processing results
    """
    data = request.json
    if not data or 'task_id' not in data:
        return jsonify({'error': 'Task ID is required'}), 400
        
    try:
        # Get task details
        with sqlite3.connect(db_path) as conn:
            cursor = conn.cursor()
            cursor.execute('''
                SELECT id, title, notes 
                FROM tasks WHERE id = ?
            ''', (data['task_id'],))
            row = cursor.fetchone()
            
            if not row:
                return jsonify({'error': 'Task not found'}), 404
                
            task = {
                'id': row[0],
                'title': row[1],
                'notes': row[2]
            }
            
            # Get associated files
            cursor.execute('''
                SELECT file_path, embedding_id 
                FROM task_files 
                WHERE task_id = ? AND embedding_id IS NOT NULL
            ''', (data['task_id'],))
            files = cursor.fetchall()
            
            # Process task with general agent
            from agents.general_agent import GeneralAgent
            from .database import vector_db
            agent = GeneralAgent(vector_db)
            result = agent.process_task(task, files)
            
            return jsonify(result)
            
    except Exception as e:
        return jsonify({'error': str(e)}), 500 