# Gemini Drive Chatbot 🤖📁

A powerful RAG (Retrieval Augmented Generation) chatbot that integrates with **Google Drive** and uses **Gemini 2.5 Flash** to answer questions based on your documents.

![Architecture Diagram](architecture_diagram_1764588362843.png)

## ✨ Features

*   **Google Drive Integration**: Securely authenticate and browse your Google Drive files.
*   **Smart Sync**: Select specific files or folders to sync with the chatbot.
*   **RAG Powered**: Uses Gemini's **File Search** tool to index documents and retrieve relevant context.
*   **Gemini 2.5 Flash**: Leverages the latest, fast, and accurate model from Google.
*   **Real-time Progress**: Visual feedback during file scanning, downloading, and indexing.
*   **Real-time Progress**: Visual feedback during file scanning, downloading, and indexing.
*   **Modern Dark UI**: A premium, always-dark interface inspired by n8n, featuring a custom Red/Pink primary color (`#ea4b4b`) and deep grey backgrounds (`#292727`).
*   **ChatGPT-Style Chat**: A clean, icon-free chat layout with a minimal "thinking" indicator and unified design.

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

## 🚀 Deployment (Railway)

This project is ready for single-container deployment on [Railway](https://railway.app/).

1.  **Fork/Push** this repository to your GitHub.
2.  **New Project on Railway**: Select "Deploy from GitHub repo".
3.  **Variables**: Add the following Environment Variables in Railway:
    *   `GOOGLE_CLIENT_ID`: Your OAuth Client ID.
    *   `GOOGLE_CLIENT_SECRET`: Your OAuth Client Secret.
    *   `REDIRECT_URI`: `https://<your-railway-app-url>/rest/oauth2-credential/callback`
    *   `FRONTEND_URL`: `https://<your-railway-app-url>`
    *   `PORT`: `8000`
4.  **Google Cloud Console**:
    *   Add your Railway URL (`https://<your-railway-app-url>`) to **Authorized JavaScript origins**.
    *   Add the `REDIRECT_URI` to **Authorized redirect URIs**.

## 🚀 Deployment (Render)

You can also deploy on [Render](https://render.com/).

1.  **New Web Service**: Connect your GitHub repository.
2.  **Runtime**: Select **Docker**.
3.  **Environment Variables**: Add the same variables as above:
    *   `GOOGLE_CLIENT_ID`
    *   `GOOGLE_CLIENT_SECRET`
    *   `REDIRECT_URI` (`https://<your-render-app-url>/rest/oauth2-credential/callback`)
    *   `FRONTEND_URL` (`https://<your-render-app-url>`)
    *   `PORT`: `8000`
4.  **Deploy**: Render will build the Docker image and start the service.

## 🛡️ Security Note

*   **OAuth**: Credentials are now loaded from Environment Variables for production security.
*   **API Key**: Users can enter their own Gemini API Key in the frontend settings, which is stored locally in their browser.

## 🔐 OAuth Verification (Important)

When you deploy this app and try to log in with Google, you might see a "Google hasn't verified this app" warning. This is normal for personal projects.

1.  **Click "Advanced"** on the warning screen.
2.  **Click "Go to [Your App Name] (unsafe)"** to proceed.

To remove this warning, you would need to submit your app for [Google Verification](https://support.google.com/cloud/answer/13463073), which is required for public-facing apps accessing sensitive scopes like Drive.

## 📄 License

MIT
