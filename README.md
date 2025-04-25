# Go Do List
From TODO to DONE - capture and complete your tasks with AI assistance.

This application uses AI agents to help you manage and complete your to-do items. 

It was created for the Microsoft [AI Agents Hackathon 2025](https://microsoft.github.io/AI_Agents_Hackathon/).

## Solution Overview

Go Do List is an intelligent task management system that combines traditional to-do list functionality with AI-powered task processing. The system uses AI agents to:

- Process and analyse documents attached to tasks
- Provide intelligent insights and summaries
- Help break down complex tasks into manageable steps
- Offer suggestions and recommendations based on task content

### Key Features

- **Task Management**: Create, organise, and track tasks in folders
- **AI agents to complete your tasks**: Use out-of-the-box or 3rd party AI agents to complete your tasks.
- **Responsive UI**: Modern, user-friendly interface

## Demo

[Demo video or screenshots later]

## Prerequisites

- Python 3.12 or later
- Node.js 18+ and npm
- OpenAI API key
- Qdrant Cloud account and API key

## Configuration

### Environment Setup

1. Clone the repository:
   ```bash
   git clone https://github.com/cchew/godolist.git
   cd godolist
   ```

2. Create a `.env` file in the root directory with the following variables:
   ```
   OPENAI_API_KEY=your-openai-api-key
   QDRANT_URL=https://your-cluster.qdrant.tech
   QDRANT_API_KEY=your-qdrant-api-key
   ```

### OpenAI Setup

1. Create an account at [OpenAI](https://platform.openai.com/)
2. Click your profile icon (top right) and select "API keys" from the dropdown.
3. Click “Create new secret key.”
4. Note down your API key
4. Add these to your `.env` file

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

## Architecture

The application consists of three main components:

1. **Frontend**: Vue 3 JavaScript user interface
2. **Backend**: Flask Python API server, with Agno AI agents

## Contributing

[Contribution guidelines later]

## License

[License information later]

## Disclaimer

This has only been tested on MacOS so might not work on all platforms without changes.

The code in this repository was generated using GitHub Copilot and Cursor.