import pytest
import json
from fastapi.testclient import TestClient
from unittest.mock import patch, MagicMock
from main import app

@pytest.fixture(name="client")
def client_fixture():
    return TestClient(app)

@pytest.fixture(name="auth_headers")
def auth_headers_fixture(client):
    """Create a user and return auth headers"""
    # Create user
    client.post(
        "/signup",
        data={"username": "testuser", "password": "testpass123"}
    )
    
    # Login to get token
    login_response = client.post(
        "/token",
        data={"username": "testuser", "password": "testpass123"}
    )
    token = login_response.json()["access_token"]
    
    return {"Authorization": f"Bearer {token}"}

class TestRoadmapGeneration:
    """Test roadmap generation endpoints"""
    
    @patch('main.generate_roadmap')
    def test_generate_roadmap_success(self, mock_generate, client, auth_headers):
        """Test successful roadmap generation"""
        # Mock the roadmap generation response
        mock_generate.return_value = {
            "roadmap": "Test roadmap content",
            "recommended_courses": [
                {"title": "Test Course", "description": "Test Description"}
            ]
        }
        
        response = client.post(
            "/generate_roadmap",
            headers=auth_headers,
            json={
                "skills": ["Python", "JavaScript"],
                "goal": "Become a full-stack developer"
            }
        )
        
        assert response.status_code == 200
        data = response.json()
        assert "roadmap" in data
        assert "recommended_courses" in data
        assert data["roadmap"] == "Test roadmap content"
        assert len(data["recommended_courses"]) == 1
        
        # Verify the mock was called with correct parameters
        mock_generate.assert_called_once_with(
            ["Python", "JavaScript"], 
            "Become a full-stack developer"
        )
    
    def test_generate_roadmap_invalid_skills(self, client, auth_headers):
        """Test roadmap generation with invalid skills"""
        # Empty skills list
        response = client.post(
            "/generate_roadmap",
            headers=auth_headers,
            json={
                "skills": [],
                "goal": "Become a developer"
            }
        )
        assert response.status_code == 422  # Validation error
        
        # Too many skills
        response = client.post(
            "/generate_roadmap",
            headers=auth_headers,
            json={
                "skills": ["skill"] * 25,  # More than max_items=20
                "goal": "Become a developer"
            }
        )
        assert response.status_code == 422
    
    def test_generate_roadmap_invalid_goal(self, client, auth_headers):
        """Test roadmap generation with invalid goal"""
        # Too short goal
        response = client.post(
            "/generate_roadmap",
            headers=auth_headers,
            json={
                "skills": ["Python"],
                "goal": "ab"  # Less than min_length=3
            }
        )
        assert response.status_code == 422
        
        # Too long goal
        response = client.post(
            "/generate_roadmap",
            headers=auth_headers,
            json={
                "skills": ["Python"],
                "goal": "a" * 201  # More than max_length=200
            }
        )
        assert response.status_code == 422
    
    def test_generate_roadmap_unauthorized(self, client):
        """Test roadmap generation without authentication"""
        response = client.post(
            "/generate_roadmap",
            json={
                "skills": ["Python"],
                "goal": "Become a developer"
            }
        )
        assert response.status_code == 401
    
    @patch('main.generate_roadmap')
    def test_generate_roadmap_server_error(self, mock_generate, client, auth_headers):
        """Test roadmap generation with server error"""
        # Mock an exception
        mock_generate.side_effect = Exception("OpenAI API error")
        
        response = client.post(
            "/generate_roadmap",
            headers=auth_headers,
            json={
                "skills": ["Python"],
                "goal": "Become a developer"
            }
        )
        
        assert response.status_code == 500
        assert "Failed to generate roadmap" in response.json()["detail"]

class TestResumeUpload:
    """Test resume upload endpoints"""
    
    @patch('main.extract_text_from_pdf')
    @patch('main.extract_skills')
    @patch('main.generate_roadmap')
    def test_upload_resume_success(self, mock_generate, mock_extract_skills, 
                                 mock_extract_text, client, auth_headers):
        """Test successful resume upload"""
        # Mock the PDF processing
        mock_extract_text.return_value = "Sample resume text"
        mock_extract_skills.return_value = ["Python", "JavaScript"]
        mock_generate.return_value = {
            "roadmap": "Generated roadmap",
            "recommended_courses": []
        }
        
        # Create a fake PDF file
        pdf_content = b"fake pdf content"
        
        response = client.post(
            "/upload_resume",
            headers=auth_headers,
            files={"file": ("resume.pdf", pdf_content, "application/pdf")},
            data={"goal": "Become a developer"}
        )
        
        assert response.status_code == 200
        data = response.json()
        assert "extracted_skills" in data
        assert "roadmap" in data
        assert "recommended_courses" in data
        assert data["extracted_skills"] == ["Python", "JavaScript"]
    
    def test_upload_resume_invalid_file_type(self, client, auth_headers):
        """Test resume upload with invalid file type"""
        response = client.post(
            "/upload_resume",
            headers=auth_headers,
            files={"file": ("resume.txt", b"text content", "text/plain")},
            data={"goal": "Become a developer"}
        )
        
        assert response.status_code == 400
        assert "Only PDF files are supported" in response.json()["detail"]
    
    def test_upload_resume_invalid_content_type(self, client, auth_headers):
        """Test resume upload with invalid content type"""
        response = client.post(
            "/upload_resume",
            headers=auth_headers,
            files={"file": ("resume.pdf", b"content", "text/plain")},
            data={"goal": "Become a developer"}
        )
        
        assert response.status_code == 400
        assert "Invalid content type" in response.json()["detail"]
    
    def test_upload_resume_file_too_large(self, client, auth_headers):
        """Test resume upload with file too large"""
        # Create content larger than 10MB
        large_content = b"x" * (11 * 1024 * 1024)  # 11MB
        
        response = client.post(
            "/upload_resume",
            headers=auth_headers,
            files={"file": ("resume.pdf", large_content, "application/pdf")},
            data={"goal": "Become a developer"}
        )
        
        assert response.status_code == 400
        assert "File too large" in response.json()["detail"]
    
    def test_upload_resume_empty_file(self, client, auth_headers):
        """Test resume upload with empty file"""
        response = client.post(
            "/upload_resume",
            headers=auth_headers,
            files={"file": ("resume.pdf", b"", "application/pdf")},
            data={"goal": "Become a developer"}
        )
        
        assert response.status_code == 400
        assert "File is empty" in response.json()["detail"]
    
    def test_upload_resume_invalid_goal(self, client, auth_headers):
        """Test resume upload with invalid goal"""
        pdf_content = b"fake pdf content"
        
        # Goal too short
        response = client.post(
            "/upload_resume",
            headers=auth_headers,
            files={"file": ("resume.pdf", pdf_content, "application/pdf")},
            data={"goal": "ab"}
        )
        
        assert response.status_code == 422  # Validation error
    
    def test_upload_resume_unauthorized(self, client):
        """Test resume upload without authentication"""
        pdf_content = b"fake pdf content"
        
        response = client.post(
            "/upload_resume",
            files={"file": ("resume.pdf", pdf_content, "application/pdf")},
            data={"goal": "Become a developer"}
        )
        
        assert response.status_code == 401
