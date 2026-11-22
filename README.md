# AI Digital Forensics

AI Digital Forensics is a full-stack application designed to assist in digital investigations using artificial intelligence. It features a React-based frontend and a Python (FastAPI) backend.

## Features

- **Case Management**: Create, track, and manage digital forensic cases.
- **Text Tracker**: Advanced analysis and tracking of text-based evidence.
- **Network Forensics**: Visualization and analysis of network activity and logs.
- **AI Integration**: Powered by Groq for intelligent insights.
- **Cloud Storage**: Secure evidence handling via Firebase and Google Cloud.

## Tech Stack

### Frontend
- **Framework**: React 18 with Vite
- **Routing**: React Router
- **Styling/UI**: Lucide React (Icons)
- **Visualization**: Recharts, React Force Graph

### Backend
- **Framework**: FastAPI (Python)
- **Database/Storage**: Firebase Admin, Google Cloud Firestore, Google Cloud Storage
- **AI Integration**: Groq API
- **Document Processing**: PyPDF, python-docx, FPDF2
- **Data Analysis**: Pandas, NumPy

## Getting Started

### Prerequisites
- Node.js (v16+)
- Python (3.9+)
- Firebase Service Account configuration
- Groq API Key

### Backend Setup
1. Navigate to the `backend` directory.
2. Create a virtual environment:
   ```bash
   python -m venv venv
   ```
3. Activate the virtual environment:
   - Windows: `venv\Scripts\activate`
   - Unix/macOS: `source venv/bin/activate`
4. Install dependencies:
   ```bash
   pip install -r requirements.txt
   ```
5. Ensure your `.env` and `firebase-service-account.json` files are properly configured.
6. Start the FastAPI server:
   ```bash
   uvicorn app.main:app --reload
   ```

### Frontend Setup
1. Navigate to the `frontend` directory.
2. Install dependencies:
   ```bash
   npm install
   ```
3. Start the development server:
   ```bash
   npm run dev
   ```

## License
This project is licensed under the MIT License.
