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
    """Initialize SQLite database"""
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
    return '.' in filename and filename.rsplit('.', 1)[1].lower() in ALLOWED_EXTENSIONS

def process_file(file_path, task_id):
    """Process PDF file using Agno's PDFKnowledgeBase"""
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
    if request.method == 'GET':
        folder_id = request.args.get('folder_id')
        with sqlite3.connect(db_path) as conn:
            conn.row_factory = sqlite3.Row
            cursor = conn.cursor()
            if folder_id:
                cursor.execute('''
                    SELECT id, folder_id, title, completed, is_important, notes 
                    FROM tasks WHERE folder_id = ?
                ''', (folder_id,))
            else:
                cursor.execute('SELECT id, folder_id, title, completed, is_important, notes FROM tasks')
            
            tasks = []
            for row in cursor.fetchall():
                tasks.append({
                    'id': row['id'],
                    'folder_id': row['folder_id'],
                    'title': row['title'],
                    'completed': bool(row['completed']),
                    'isImportant': bool(row['is_important']),
                    'notes': row['notes']
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
                    '''INSERT INTO tasks (folder_id, title, completed, is_important, notes) 
                       VALUES (?, ?, ?, ?, ?)''',
                    (
                        folder_id,  # Will be NULL in database if None
                        data['title'],
                        data.get('completed', False),
                        data.get('isImportant', False),
                        data.get('notes', '')
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
                    'notes': data.get('notes', '')
                }), 201
        except sqlite3.Error as e:
            return jsonify({'error': f'Database error: {str(e)}'}), 500
        except Exception as e:
            return jsonify({'error': f'Unexpected error: {str(e)}'}), 500

    if request.method == 'DELETE':
        task_id = request.args.get('id')
        if not task_id:
            return jsonify({'error': 'Task ID is required'}), 400

        try:
            with sqlite3.connect(db_path) as conn:
                cursor = conn.cursor()
                
                # First delete associated files
                cursor.execute('DELETE FROM task_files WHERE task_id = ?', (task_id,))
                
                # Then delete the task
                cursor.execute('DELETE FROM tasks WHERE id = ?', (task_id,))
                
                if cursor.rowcount == 0:
                    return jsonify({'error': 'Task not found'}), 404
                
                conn.commit()
                return jsonify({'message': 'Task deleted successfully'}), 200
        except sqlite3.Error as e:
            return jsonify({'error': f'Database error: {str(e)}'}), 500
        except Exception as e:
            return jsonify({'error': f'Unexpected error: {str(e)}'}), 500

    if request.method == 'PATCH':
        task_id = request.args.get('id')
        if not task_id:
            return jsonify({'error': 'Task ID is required'}), 400
        
        data = request.json
        update_fields = []
        values = []
        
        if 'title' in data:
            update_fields.append('title = ?')
            values.append(data['title'])
        if 'completed' in data:
            update_fields.append('completed = ?')
            values.append(data['completed'])
        if 'isImportant' in data:
            update_fields.append('is_important = ?')
            values.append(data['isImportant'])
        if 'notes' in data:
            update_fields.append('notes = ?')
            values.append(data['notes'])
        if 'folder_id' in data:
            # Convert empty string or 'unassigned' to None for folder_id
            folder_id = data['folder_id']
            if folder_id == '' or folder_id == 'unassigned':
                folder_id = None
            update_fields.append('folder_id = ?')
            values.append(folder_id)
        
        if not update_fields:
            return jsonify({'error': 'No fields to update'}), 400
        
        values.append(task_id)
        try:
            with sqlite3.connect(db_path) as conn:
                cursor = conn.cursor()
                cursor.execute(
                    f'UPDATE tasks SET {", ".join(update_fields)} WHERE id = ?',
                    values
                )
                conn.commit()
                
                # Fetch the updated task
                cursor.execute('''
                    SELECT id, folder_id, title, completed, is_important, notes 
                    FROM tasks WHERE id = ?
                ''', (task_id,))
                row = cursor.fetchone()
                
                if row:
                    updated_task = {
                        'id': row[0],
                        'folder_id': row[1],
                        'title': row[2],
                        'completed': bool(row[3]),
                        'isImportant': bool(row[4]),
                        'notes': row[5]
                    }
                    return jsonify(updated_task), 200
                else:
                    return jsonify({'error': 'Task not found'}), 404
                    
        except sqlite3.Error as e:
            return jsonify({'error': f'Database error: {str(e)}'}), 500

@app.route('/tasks/<int:task_id>/files', methods=['POST'])
def upload_file(task_id):
    if 'file' not in request.files:
        return jsonify({'error': 'No file part'}), 400
    
    file = request.files['file']
    if file.filename == '':
        return jsonify({'error': 'No selected file'}), 400
    
    if not allowed_file(file.filename):
        return jsonify({'error': 'File type not allowed'}), 400
    
    try:
        filename = secure_filename(file.filename)
        file_path = os.path.join(UPLOAD_FOLDER, filename)
        file.save(file_path)
        
        # Process file and store embeddings using Agno
        try:
            embedding_id = process_file(file_path, task_id)
        except Exception as e:
            os.remove(file_path)  # Clean up file if processing fails
            return jsonify({'error': f'Error processing file: {str(e)}'}), 500
        
        with sqlite3.connect(db_path) as conn:
            cursor = conn.cursor()
            cursor.execute('''
                INSERT INTO task_files (task_id, filename, file_path, embedding_id)
                VALUES (?, ?, ?, ?)
            ''', (task_id, filename, file_path, embedding_id))
            file_id = cursor.lastrowid
            conn.commit()
            
            return jsonify({
                'id': file_id,
                'task_id': task_id,
                'filename': filename,
                'embedding_id': embedding_id
            })
            
    except Exception as e:
        # Clean up file if database operation fails
        if 'file_path' in locals():
            try:
                os.remove(file_path)
            except:
                pass
        return jsonify({'error': f'Error uploading file: {str(e)}'}), 500

@app.route('/tasks/<int:task_id>/files', methods=['GET'])
def get_task_files(task_id):
    with sqlite3.connect(db_path) as conn:
        cursor = conn.cursor()
        cursor.execute('SELECT id, filename FROM task_files WHERE task_id = ?', (task_id,))
        files = [{'id': row[0], 'filename': row[1]} for row in cursor.fetchall()]
        return jsonify(files)

@app.route('/files/<int:file_id>', methods=['GET'])
def download_file(file_id):
    with sqlite3.connect(db_path) as conn:
        cursor = conn.cursor()
        cursor.execute('SELECT file_path, filename FROM task_files WHERE id = ?', (file_id,))
        result = cursor.fetchone()
        if result:
            file_path, filename = result
            return send_file(file_path, as_attachment=True, download_name=filename)
        return jsonify({'error': 'File not found'}), 404

@app.route('/process-task', methods=['POST'])
def process_task():
    try:
        data = request.json
        task_id = data['task_id']
        task_title = data['task_title']
        task_type = data['task_type']
        files = data['files']
        agent_config = {
            'openai_api_key': os.getenv('OPENAI_API_KEY'),
            'qdrant_url': os.getenv('QDRANT_URL'),
            'qdrant_api_key': os.getenv('QDRANT_API_KEY')
        }

        # Initialize the General Agent
        agent = GeneralAgent(
            openai_api_key=agent_config['openai_api_key'],
            qdrant_url=agent_config['qdrant_url'],
            qdrant_api_key=agent_config['qdrant_api_key']
        )

        # If there are files, process them and set up the knowledge base
        if files:
            file_paths = [os.path.join(UPLOAD_FOLDER, file['filename']) for file in files]
            for file_path in file_paths:
                agent.process_document(file_path)
            agent.initialize_agent(task_type, task_title)
        else:
            raise Exception("No files attached to the task")

        # Process the task and handle the Message object
        response = agent.process_task(task_title)
        
        # Extract the content from the response
        if hasattr(response, 'content'):
            response_content = response.content
        elif hasattr(response, 'text'):
            response_content = response.text
        else:
            response_content = str(response)

        # Ensure the response is a string and not an object
        if not isinstance(response_content, str):
            response_content = str(response_content)

        return jsonify({
            'success': True,
            'response': response_content
        })

    except Exception as e:
        print(f"Error processing task: {str(e)}")  # Add logging
        return jsonify({
            'success': False,
            'error': str(e)
        }), 500

if __name__ == '__main__':
    app.run(debug=True)