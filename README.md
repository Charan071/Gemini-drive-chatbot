# Gemini Drive Chatbot 🤖📁

A powerful RAG (Retrieval Augmented Generation) chatbot that integrates with **Google Drive** and uses **Gemini 2.5 Flash** to answer questions based on your documents.

![Architecture Diagram](architecture_diagram_1764588362843.png)

## ✨ Features

*   **Google Drive Integration**: Securely authenticate and browse your Google Drive files.
*   **Smart Sync**: Select specific files or folders to sync with the chatbot.
*   **RAG Powered**: Uses Gemini's **File Search** tool to index documents and retrieve relevant context.
*   **Gemini 2.5 Flash**: Leverages the latest, fast, and accurate model from Google.
*   **Real-time Progress**: Visual feedback during file scanning, downloading, and indexing.
*   **Minimalist UI**: A clean, "classy yet minimal" interface built with React and Tailwind CSS.

## 🏗️ Architecture

The system consists of a **FastAPI** backend and a **React** frontend.

*   **Frontend**: Handles user interaction, Google Auth flow, and Chat UI.
*   **Backend**: Orchestrates OAuth, Drive API calls, and Gemini RAG interactions.
*   **Google Cloud**: Stores files and powers the LLM.

See [architecture.txt](architecture.txt) for a text-based diagram.

## 🚀 Getting Started

### Prerequisites

*   Python 3.9+
*   Node.js 16+
*   Google Cloud Project with **Drive API** and **Gemini API** enabled.
*   `client_secret.json` (OAuth 2.0 Credentials)
*   `GOOGLE_API_KEY` (Gemini API Key)

### Installation

1.  **Clone the repository**
    ```bash
    git clone https://github.com/Charan071/Gemini-drive-chatbot.git
    cd Gemini-drive-chatbot
    ```

2.  **Backend Setup**
    ```bash
    cd backend
    python -m venv venv
    # Activate venv (Windows: venv\Scripts\activate, Mac/Linux: source venv/bin/activate)
    pip install -r requirements.txt
    ```
    *   Place your `client_secret.json` in the `backend/` folder.
    *   Create a `.env` file in `backend/` with: `GOOGLE_API_KEY=your_api_key`

3.  **Frontend Setup**
    ```bash
    cd frontend
    npm install
    ```

### Running the App

1.  **Start Backend** (Port 5678)
    ```bash
    cd backend
    python -m uvicorn main:app --reload --port 5678
    ```

2.  **Start Frontend** (Port 5173)
    ```bash
    cd frontend
    npm run dev
    ```

3.  Open `http://localhost:5173` in your browser.

## 🛡️ Security Note

This project uses a local `client_secret.json` for demonstration. For production, ensure you secure your OAuth credentials and API keys properly.

## 📄 License

MIT
