"""
Database initialization and setup for Go Do List.
"""

import sqlite3
import os
from dotenv import load_dotenv
from agno.vectordb.qdrant import Qdrant
from agno.embedder.openai import OpenAIEmbedder

# Load environment variables
load_dotenv()

# Database and file storage setup
db_path = 'godolist.db'
UPLOAD_FOLDER = 'uploads'
os.makedirs(UPLOAD_FOLDER, exist_ok=True)

# Configuration
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