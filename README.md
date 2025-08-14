# SkillMap AI - Personalized Learning Roadmaps

A full-stack career development platform that generates personalized learning roadmaps based on user skills and career goals using AI-powered recommendations.

## Features

- Resume upload and automatic skill extraction from PDF files
- AI-powered roadmap generation using OpenAI
- Progress tracking for roadmap completion
- Course recommendations based on learning goals
- Secure JWT-based user authentication
- Modern React interface with Tailwind CSS

## Architecture

### Backend (Python/FastAPI)
- FastAPI for REST API endpoints
- SQLModel with SQLite for data persistence
- OpenAI API integration for roadmap generation
- JWT authentication with secure token handling
- PyMuPDF for PDF text extraction
- Pydantic for data validation and serialization

### Frontend (React/Vite)
- React with modern hooks and context
- Vite for fast development and building
- Tailwind CSS for responsive styling
- Axios for API communication
- React Router for navigation
- React Hot Toast for user notifications

## Prerequisites

- Python 3.8+
- Node.js 16+
- OpenAI API Key

## Installation

### Backend Setup

1. Navigate to the backend directory:
```bash
cd backend
pip install -r requirements.txt
```

2. Create environment file:
```bash
# Create .env file with required variables
JWT_SECRET=your_secure_jwt_secret_here
OPENAI_API_KEY=your_openai_api_key_here
PROGRESS_DB_URL=sqlite:///progress.db
CORS_ORIGINS=http://localhost:3000,http://localhost:5173
```

3. Start the server:
```bash
python main.py
```

### Frontend Setup

1. Navigate to the frontend directory:
```bash
cd frontend
npm install
```

2. Create environment file:
```bash
# Create .env file with backend URL
VITE_API_BASE_URL=http://localhost:8000
```

3. Start development server:
```bash
npm run dev
```

## Usage

The application runs on:
- Backend: http://localhost:8000
- Frontend: http://localhost:5173

## API Endpoints

### Authentication
- `POST /signup` - User registration
- `POST /token` - User login

### Roadmap Generation
- `POST /generate_roadmap` - Create roadmap from skills and goal
- `POST /upload_resume` - Upload resume and generate roadmap

### Progress Management
- `GET /progress/` - Get user progress
- `POST /progress/` - Save progress
- `GET /progress/all/` - Get all progress entries
- `DELETE /progress/{id}/` - Delete progress entry
- `PATCH /progress/{id}/` - Update progress entry
- `PATCH /progress/{id}/step/` - Toggle step completion

## Development

### Backend
- Database migrations handled by Alembic
- Environment variables loaded via python-dotenv
- CORS configured for frontend communication

### Frontend
- Environment configuration centralized in `src/config/environment.js`
- API calls handled through axios interceptors
- Error boundaries and error handling implemented

## Troubleshooting

- Ensure all environment variables are set correctly
- Check CORS origins match your frontend URL
- Verify OpenAI API key is valid and has credits
- Ensure uploaded files are PDF format and under 10MB limit

## API Documentation

Interactive API docs available at http://localhost:8000/docs when the backend is running.
