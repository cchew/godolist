# Go Do List
From TODO to DONE - capture and complete your tasks with AI assistance.

This application uses AI agents to help you manage and complete your to-do items. It was created for the Microsoft [AI Agents Hackathon 2025](https://microsoft.github.io/AI_Agents_Hackathon/).

## Solution Overview

Go Do List is an intelligent task management system that combines traditional to-do list functionality with AI-powered task processing. The system uses AI agents to:

- Process and analyze documents attached to tasks
- Provide intelligent insights and summaries
- Help break down complex tasks into manageable steps
- Offer suggestions and recommendations based on task content

### Key Features

- **Task Management**: Create, organize, and track tasks in folders
- **Document Processing**: Upload and process PDF documents
- **AI-Powered Analysis**: Get intelligent insights and summaries of your documents
- **Vector Search**: Efficient document retrieval using Qdrant vector database
- **Responsive UI**: Modern, user-friendly interface

## Demo

[Add demo video or screenshots here]

## Prerequisites

- Python 3.12 or later
- Node.js 18+ and npm
- OpenAI API key
- Qdrant Cloud account

## Configuration

### Environment Setup

1. Clone the repository:
   ```bash
   git clone [repository-url]
   cd godolist
   ```

2. Create a `.env` file in the root directory with the following variables:
   ```
   OPENAI_API_KEY=your-openai-api-key
   QDRANT_URL=https://your-cluster.qdrant.tech
   QDRANT_API_KEY=your-qdrant-api-key
   ```

### Qdrant Cloud Setup

1. Create an account at [Qdrant Cloud](https://cloud.qdrant.io/)
2. Create a new cluster
3. Note down your cluster URL and API key
4. Add these to your `.env` file

## Installation

### Backend Setup

1. Navigate to the backend directory:
   ```bash
   cd backend
   ```

2. Create and activate a virtual environment:
   ```bash
   python3 -m venv venv
   source venv/bin/activate  # On Windows: venv\Scripts\activate
   ```

3. Install dependencies:
   ```bash
   pip install -r requirements.txt
   ```

4. Initialize the database:
   ```bash
   python main.py
   ```

### Frontend Setup

1. Navigate to the frontend directory:
   ```bash
   cd frontend
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

## Usage

### Starting the Application

1. Start the backend server:
   ```bash
   cd backend
   python main.py
   ```

2. Start the frontend development server:
   ```bash
   cd frontend
   npm run dev
   ```

3. Open your browser and navigate to the provided local development URL (typically http://localhost:5173)

### Using the Application

1. **Create Tasks**:
   - Click "Add Task" to create a new task
   - Add a title, description, and priority level
   - Organize tasks into folders

2. **Process Documents**:
   - Upload PDF documents to tasks
   - The AI agent will process and analyze the content
   - View insights and summaries in the task details

3. **Get AI Assistance**:
   - Use the "Review" feature to get AI-powered analysis
   - Request summaries and key insights
   - Get recommendations for task completion

## Architecture

The application consists of three main components:

1. **Frontend**: React-based user interface
2. **Backend**: Flask API server
3. **AI Agent**: Document processing and analysis system

### Data Flow

1. User uploads a document to a task
2. Backend processes the document using the AI agent
3. Document is stored in Qdrant vector database
4. AI agent analyzes the content and provides insights
5. Results are displayed in the user interface

## Contributing

[Add contribution guidelines here]

## License

[Add license information here]