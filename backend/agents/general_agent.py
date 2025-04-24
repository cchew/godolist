"""
General Agent for document processing and task analysis.

This module provides a GeneralAgent class that handles document processing,
knowledge base management, and task analysis using AI agents.
"""

from agno.agent import Agent
from agno.knowledge.pdf import PDFKnowledgeBase, PDFReader
from agno.vectordb.qdrant import Qdrant
from agno.models.openai import OpenAIChat
from agno.embedder.openai import OpenAIEmbedder
from agno.document.chunking.document import DocumentChunking
import tempfile
import os

# Collection name for the Qdrant vector database
COLLECTION_NAME = "godolist"

class GeneralAgent:
    """
    A general-purpose agent for processing documents and performing task analysis.
    
    This agent handles document processing, knowledge base management, and task analysis
    using AI capabilities. It integrates with Qdrant for vector storage and OpenAI for
    document analysis.
    
    Attributes:
        openai_api_key (str): API key for OpenAI services
        qdrant_url (str): URL for the Qdrant vector database
        qdrant_api_key (str): API key for Qdrant services
        vector_db (Qdrant): Instance of Qdrant vector database
        knowledge_base (PDFKnowledgeBase): Current knowledge base instance
        agent (Agent): Current AI agent instance
        current_file_path (str): Path of the currently processed document
    """
    
    def __init__(self, openai_api_key: str, qdrant_url: str, qdrant_api_key: str):
        """
        Initialize the GeneralAgent with required API keys and URLs.
        
        Args:
            openai_api_key (str): API key for OpenAI services
            qdrant_url (str): URL for the Qdrant vector database
            qdrant_api_key (str): API key for Qdrant services
        """
        self.openai_api_key = openai_api_key
        self.qdrant_url = qdrant_url
        self.qdrant_api_key = qdrant_api_key
        self.vector_db = self._init_qdrant()
        self.knowledge_base = None
        self.agent = None
        self.current_file_path = None

    def _init_qdrant(self) -> Qdrant:
        """
        Initialize Qdrant client with configured settings.
        
        Returns:
            Qdrant: Initialized Qdrant vector database instance
            
        Raises:
            Exception: If Qdrant connection fails
        """
        try:
            vector_db = Qdrant(
                collection=COLLECTION_NAME,
                url=self.qdrant_url,
                api_key=self.qdrant_api_key,
                embedder=OpenAIEmbedder(
                    id="text-embedding-3-small",
                    api_key=self.openai_api_key
                )
            )
            return vector_db
        except Exception as e:
            raise Exception(f"Qdrant connection failed: {str(e)}")

    def process_document(self, file_path: str) -> bool:
        """
        Process a document and create/update the knowledge base.
        
        Args:
            file_path (str): Path to the document to process
            
        Returns:
            bool: True if processing was successful
            
        Raises:
            Exception: If document processing fails
        """
        try:
            # Store the current file path
            self.current_file_path = file_path
            
            # Check if the file has already been processed
            if self.knowledge_base and self.knowledge_base.path == file_path:
                # File already processed, just use existing knowledge base
                return True
            
            # Initialize knowledge base with the vector database
            self.knowledge_base = PDFKnowledgeBase(
                path=file_path,
                vector_db=self.vector_db,
                reader=PDFReader(),
                chunking_strategy=DocumentChunking(
                    chunk_size=1000,
                    overlap=200
                )
            )
            
            # Load the documents into the knowledge base without recreating
            self.knowledge_base.load(recreate=False, upsert=True)
            
            return True
        except Exception as e:
            raise Exception(f"Error processing document: {str(e)}")

    def _get_task_instructions(self, task_type: str) -> list[str]:
        """
        Get specific instructions based on task type.
        
        Args:
            task_type (str): Type of task (e.g., 'review', 'analyze', 'summarize')
            
        Returns:
            list[str]: List of instructions for the specified task type
        """
        instructions = {
            "review": [
                "Thoroughly analyze the document content",
                "Provide a comprehensive summary",
                "Identify key points and main themes",
                "Extract important concepts and their relationships",
                "Create linkages to related topics or concepts",
                "Suggest practical applications or implications",
                "Reference specific sections from the document"
            ],
            "analyze": [
                "Perform detailed analysis of the content",
                "Break down complex concepts into understandable parts",
                "Identify patterns and relationships",
                "Provide evidence-based insights",
                "Reference specific parts of the document"
            ],
            "summarize": [
                "Create a concise overview of the main points",
                "Highlight key findings and conclusions",
                "Maintain the essential message while condensing content",
                "Structure the summary logically"
            ],
        }
        return instructions.get(task_type.lower(), instructions["review"])

    def initialize_agent(self, task_type: str, task_description: str) -> None:
        """
        Initialize the agent with task-specific configuration.
        
        Args:
            task_type (str): Type of task to perform
            task_description (str): Description of the task
            
        Raises:
            Exception: If knowledge base is not initialized
        """
        if not self.knowledge_base:
            raise Exception("Knowledge base not initialized. Process a document first.")

        instructions = self._get_task_instructions(task_type)
        instructions.append(f"Task Description: {task_description}")
        instructions.append(f"Document to review: {self.current_file_path}")

        self.agent = Agent(
            name="General Task Agent",
            role="Task analysis and processing specialist",
            model=OpenAIChat(
                id="gpt-4",
                api_key=self.openai_api_key
            ),
            tools=[],  # No tools for now
            knowledge=self.knowledge_base,
            search_knowledge=True,
            instructions=instructions,
            show_tool_calls=True,
            markdown=True
        )

    def process_task(self, query: str) -> str:
        """
        Process a specific task query using the initialized agent.
        
        Args:
            query (str): The query to process
            
        Returns:
            str: The agent's response to the query
            
        Raises:
            Exception: If agent is not initialized
        """
        if not self.agent:
            raise Exception("Agent not initialized. Call initialize_agent first.")

        try:
            response = self.agent.run(query)
            return response
        except Exception as e:
            raise Exception(f"Error processing task: {str(e)}")

# Usage example:
"""
# Initialize the agent
agent = GeneralAgent(openai_api_key, qdrant_url, qdrant_api_key)

# Process a document
agent.process_document("path/to/document.pdf")

# Initialize for a specific task
agent.initialize_agent("review", "Review the eBook and provide comprehensive analysis")

# Run the task
response = agent.process_task("Analyze the main themes and provide key insights from the document")
""" 