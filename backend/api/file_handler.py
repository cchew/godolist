"""
File handling and processing for Go Do List.
"""

from agno.knowledge.pdf import PDFKnowledgeBase, PDFReader
from agno.document.chunking.document import DocumentChunking
from .database import vector_db, db_path
import sqlite3

# Configuration
ALLOWED_EXTENSIONS = {'pdf'}

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