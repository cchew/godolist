"""
Flask application for Go Do List backend API.
This module provides endpoints for managing tasks, folders, and file uploads.
"""

from flask import Flask, request, jsonify, send_file
from flask_cors import CORS
import sqlite3
import os
from werkzeug.utils import secure_filename
from dotenv import load_dotenv
from agno.vectordb.qdrant import Qdrant
from agno.knowledge.pdf import PDFKnowledgeBase, PDFReader
from agno.embedder.openai import OpenAIEmbedder
from agno.document.chunking.document import DocumentChunking
from agno.agent import Agent
from agno.models.openai import OpenAIChat
from agents.general_agent import GeneralAgent
from datetime import datetime

# Load environment variables
load_dotenv()

app = Flask(__name__)
# Configure CORS to allow requests from the Vue.js frontend
CORS(app, resources={
    r"/*": {
        "origins": ["http://localhost:5173"],
        "methods": ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
        "allow_headers": ["Content-Type", "Authorization"]
    }
})

# Database and file storage setup
db_path = 'godolist.db'
UPLOAD_FOLDER = 'uploads'
os.makedirs(UPLOAD_FOLDER, exist_ok=True)

# Configuration
ALLOWED_EXTENSIONS = {'pdf'}
COLLECTION_NAME = "godolist"

# Initialize Qdrant with OpenAI embedder
vector_db = Qdrant(
    collection=COLLECTION_NAME,
    url=os.getenv('QDRANT_URL', 'http://localhost:6333'),
    api_key=os.getenv('QDRANT_API_KEY'),
    embedder=OpenAIEmbedder(
        id="text-embedding-3-small", 
        api_key=os.getenv('OPENAI_API_KEY')
    )
)

def init_db():
    """Initialize SQLite database with required tables."""
    with sqlite3.connect(db_path) as conn:
        cursor = conn.cursor()
        cursor.execute('''
            CREATE TABLE IF NOT EXISTS folders (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                name TEXT NOT NULL
            )
        ''')
        cursor.execute('''
            CREATE TABLE IF NOT EXISTS tasks (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                folder_id INTEGER,
                title TEXT NOT NULL,
                completed BOOLEAN NOT NULL DEFAULT 0,
                is_important BOOLEAN NOT NULL DEFAULT 0,
                notes TEXT,
                due_date TEXT,
                created_at TEXT NOT NULL DEFAULT '2025-04-14T13:00:00',
                FOREIGN KEY (folder_id) REFERENCES folders (id)
            )
        ''')
        cursor.execute('''
            CREATE TABLE IF NOT EXISTS task_files (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                task_id INTEGER NOT NULL,
                filename TEXT NOT NULL,
                file_path TEXT NOT NULL,
                embedding_id TEXT,
                FOREIGN KEY (task_id) REFERENCES tasks (id)
            )
        ''')
        conn.commit()

def allowed_file(filename):
    """
    Check if the file extension is allowed.
    
    Args:
        filename (str): Name of the file to check
        
    Returns:
        bool: True if file extension is allowed, False otherwise
    """
    return '.' in filename and filename.rsplit('.', 1)[1].lower() in ALLOWED_EXTENSIONS

def process_file(file_path, task_id):
    """
    Process PDF file using Agno's PDFKnowledgeBase.
    
    Args:
        file_path (str): Path to the PDF file
        task_id (int): ID of the associated task
        
    Returns:
        str: Embedding ID for the processed file
        
    Raises:
        Exception: If file processing fails
    """
    try:
        # Check if the file has already been processed
        with sqlite3.connect(db_path) as conn:
            cursor = conn.cursor()
            cursor.execute('''
                SELECT embedding_id FROM task_files 
                WHERE file_path = ? AND embedding_id IS NOT NULL
            ''', (file_path,))
            result = cursor.fetchone()
            
            if result:
                # File has already been processed, return existing embedding_id
                return result[0]

        # Create a knowledge base for the file
        knowledge_base = PDFKnowledgeBase(
            path=file_path,
            vector_db=vector_db,
            reader=PDFReader(),
            chunking_strategy=DocumentChunking(
                chunk_size=1000,
                overlap=200
            )
        )
        
        # Load the document into the knowledge base without recreating the collection
        knowledge_base.load(recreate=False, upsert=True)
        
        # Return the task_id as embedding_id for consistency
        return str(task_id)
        
    except Exception as e:
        print(f"Error processing file: {str(e)}")
        raise

# Initialize database
init_db()

# Routes
@app.route('/folders', methods=['GET', 'POST'])
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

@app.route('/tasks', methods=['GET', 'POST', 'PATCH', 'DELETE'])
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

@app.route('/tasks/<int:task_id>/files', methods=['POST'])
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
        filename = secure_filename(file.filename)
        file_path = os.path.join(UPLOAD_FOLDER, filename)
        file.save(file_path)
        
        with sqlite3.connect(db_path) as conn:
            cursor = conn.cursor()
            cursor.execute(
                '''INSERT INTO task_files (task_id, filename, file_path) 
                   VALUES (?, ?, ?)''',
                (task_id, filename, file_path)
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
                'filename': filename,
                'file_path': file_path,
                'embedding_id': embedding_id
            }), 201
            
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@app.route('/tasks/<int:task_id>/files', methods=['GET'])
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

@app.route('/files/<int:file_id>', methods=['GET'])
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

@app.route('/files/<int:file_id>', methods=['DELETE'])
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

@app.route('/process-task', methods=['POST'])
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
            agent = GeneralAgent(vector_db)
            result = agent.process_task(task, files)
            
            return jsonify(result)
            
    except Exception as e:
        return jsonify({'error': str(e)}), 500

if __name__ == '__main__':
    app.run(debug=True)