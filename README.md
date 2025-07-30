# SkillMap AI - Personalized Learning Roadmaps

A full-stack career development platform that helps users create personalized learning roadmaps based on their skills and career goals using AI-powered recommendations.

## 🚀 Features

- **Resume Upload & Analysis**: Upload PDF resumes for automatic skill extraction
- **AI-Powered Roadmaps**: Generate personalized learning paths using OpenAI
- **Progress Tracking**: Track completion of roadmap steps
- **Course Recommendations**: Get relevant course suggestions
- **User Authentication**: Secure JWT-based authentication
- **Modern UI**: Clean, responsive interface built with React and Tailwind CSS

## 📸 Screenshots

### Login Page
![Login Page](https://github.com/user-attachments/assets/login-page.png)
*Clean and modern authentication interface with SkillMap AI branding*

### Dashboard
![Dashboard](https://github.com/user-attachments/assets/dashboard.png)
*Personalized dashboard showing user progress, active goals, and completion statistics*

### Goals Management
![Goals Page](https://github.com/user-attachments/assets/goals-page.png)
*Goal creation interface with AI-powered resume upload feature and progress tracking*

## 🏗️ Architecture

### Backend (Python/FastAPI)
- **FastAPI** for REST API
- **SQLAlchemy** with SQLite for data persistence
- **OpenAI API** for roadmap generation
- **JWT** authentication
- **PyMuPDF** for PDF processing
- **Pydantic** for data validation

### Frontend (React/Vite)
- **React 19** with modern hooks
- **Vite** for fast development
- **Tailwind CSS** for styling
- **Axios** for API communication
- **React Router** for navigation
- **React Hot Toast** for notifications

## 📋 Prerequisites

- **Python 3.8+**
- **Node.js 16+**
- **OpenAI API Key** (get from [OpenAI Platform](https://platform.openai.com/api-keys))

## 🛠️ Installation & Setup

### 1. Clone the Repository
```bash
git clone <repository-url>
cd pet2
```

### 2. Backend Setup

#### Install Dependencies
```bash
cd backend
pip install -r requirements.txt
```

#### Environment Configuration
```bash
# Copy the example environment file
cp .env.example .env

# Edit .env with your actual values
nano .env
```

**Required Environment Variables:**
```bash
# Generate a secure JWT secret (run this command to generate one):
# python -c "import secrets; print(secrets.token_urlsafe(32))"
JWT_SECRET=your_secure_jwt_secret_here

# Get your OpenAI API key from https://platform.openai.com/api-keys
OPENAI_API_KEY=your_openai_api_key_here

# Database URL (SQLite by default)
PROGRESS_DB_URL=sqlite:///progress.db

# CORS Origins (frontend URLs)
CORS_ORIGINS=http://localhost:3000,http://localhost:5173
```

#### Initialize Database
```bash
# The database will be created automatically when you first run the server
python main.py
```

### 3. Frontend Setup

#### Install Dependencies
```bash
cd frontend
npm install
```

#### Environment Configuration
```bash
# Copy the example environment file
cp .env.example .env

# Edit .env with your backend URL (default should work for local development)
nano .env
```

**Frontend Environment Variables:**
```bash
# Backend API URL
VITE_API_BASE_URL=http://localhost:8000

# Optional: Customize other settings
VITE_APP_NAME=SkillMap AI
VITE_ENABLE_DEBUG=true
```

## 🚀 Running the Application

### Development Mode

#### Start Backend Server
```bash
cd backend
python main.py
```
Backend will be available at: http://localhost:8000

#### Start Frontend Development Server
```bash
cd frontend
npm run dev
```
Frontend will be available at: http://localhost:5173

### Production Deployment

#### Backend Production
```bash
cd backend
# Install production dependencies
pip install -r requirements.txt

# Set production environment variables
export JWT_SECRET="your-production-jwt-secret"
export OPENAI_API_KEY="your-openai-api-key"
export CORS_ORIGINS="https://yourdomain.com"

# Run with production server
uvicorn main:app --host 0.0.0.0 --port 8000
```

#### Frontend Production
```bash
cd frontend
# Build for production
npm run build

# Serve the built files with your preferred web server
# Example with a simple HTTP server:
npx serve -s dist -l 3000
```

## 🔧 Configuration

### Security Settings

1. **JWT Secret**: Always use a cryptographically secure random string in production
2. **CORS Origins**: Restrict to your actual frontend domains in production
3. **File Upload**: Default 10MB limit for PDF files

### API Endpoints

#### Authentication
- `POST /signup` - Create new user account
- `POST /token` - Login and get access token

#### Roadmap Generation
- `POST /generate_roadmap` - Generate roadmap from skills and goal
- `POST /upload_resume` - Upload resume and generate roadmap

#### Progress Management
- `GET /progress/` - Get user's latest progress
- `POST /progress/` - Save/update progress
- `GET /progress/all/` - Get all user progress entries
- `DELETE /progress/{id}/` - Delete progress entry
- `PATCH /progress/{id}/` - Rename progress entry
- `PATCH /progress/{id}/step/` - Toggle step completion

## 🧪 Testing

### Backend Testing
```bash
cd backend
# Run the server and test endpoints
python main.py

# Test with curl
curl -X GET http://localhost:8000/
```

### Frontend Testing
```bash
cd frontend
# Run linting
npm run lint

# Build test
npm run build
```

## 🐛 Troubleshooting

### Common Issues

1. **"JWT_SECRET not set" warning**
   - Solution: Set `JWT_SECRET` in your `.env` file

2. **CORS errors**
   - Solution: Check `CORS_ORIGINS` in backend `.env` matches your frontend URL

3. **OpenAI API errors**
   - Solution: Verify your `OPENAI_API_KEY` is valid and has sufficient credits

4. **File upload errors**
   - Solution: Ensure uploaded files are PDF format and under 10MB

### Development Tips

- Enable debug mode in frontend: `VITE_ENABLE_DEBUG=true`
- Check browser console for detailed error messages
- Backend logs are printed to console when running `python main.py`

## 📚 API Documentation

When running the backend server, visit http://localhost:8000/docs for interactive API documentation powered by FastAPI's automatic OpenAPI generation.

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test thoroughly
5. Submit a pull request

## 📄 License

[Add your license information here]

## 🆘 Support

For issues and questions:
1. Check the troubleshooting section above
2. Review the API documentation at `/docs`
3. Open an issue in the repository
