import pytest
import os
from fastapi.testclient import TestClient
from sqlmodel import Session, SQLModel, create_engine
from sqlmodel.pool import StaticPool

# Import the main app and dependencies
from main import app, get_user_by_username, create_user, authenticate_user
from models import User
from deps import get_jwt_secret

# Test database setup
@pytest.fixture(name="session")
def session_fixture():
    engine = create_engine(
        "sqlite://", connect_args={"check_same_thread": False}, poolclass=StaticPool
    )
    SQLModel.metadata.create_all(engine)
    with Session(engine) as session:
        yield session

@pytest.fixture(name="client")
def client_fixture():
    client = TestClient(app)
    return client

class TestAuthentication:
    """Test authentication endpoints and functionality"""
    
    def test_jwt_secret_generation(self):
        """Test that JWT secret is properly generated"""
        secret = get_jwt_secret()
        assert secret is not None
        assert len(secret) > 10  # Should be a reasonable length
        assert secret != "CHANGE_ME"  # Should not be the default
    
    def test_signup_success(self, client):
        """Test successful user registration"""
        response = client.post(
            "/signup",
            data={"username": "testuser", "password": "testpass123"}
        )
        assert response.status_code == 200
        data = response.json()
        assert "message" in data
        assert "timestamp" in data
        assert data["message"] == "User created successfully"
    
    def test_signup_duplicate_username(self, client):
        """Test signup with duplicate username"""
        # Create first user
        client.post(
            "/signup",
            data={"username": "duplicate", "password": "testpass123"}
        )
        
        # Try to create second user with same username
        response = client.post(
            "/signup",
            data={"username": "duplicate", "password": "testpass456"}
        )
        assert response.status_code == 400
        assert "Username already registered" in response.json()["detail"]
    
    def test_signup_invalid_username(self, client):
        """Test signup with invalid username"""
        # Too short username
        response = client.post(
            "/signup",
            data={"username": "ab", "password": "testpass123"}
        )
        assert response.status_code == 400
        assert "at least 3 characters" in response.json()["detail"]
        
        # Too long username
        response = client.post(
            "/signup",
            data={"username": "a" * 51, "password": "testpass123"}
        )
        assert response.status_code == 400
        assert "less than 50 characters" in response.json()["detail"]
    
    def test_signup_invalid_password(self, client):
        """Test signup with invalid password"""
        response = client.post(
            "/signup",
            data={"username": "testuser", "password": "short"}
        )
        assert response.status_code == 400
        assert "at least 6 characters" in response.json()["detail"]
    
    def test_login_success(self, client):
        """Test successful login"""
        # First create a user
        client.post(
            "/signup",
            data={"username": "logintest", "password": "testpass123"}
        )
        
        # Then login
        response = client.post(
            "/token",
            data={"username": "logintest", "password": "testpass123"}
        )
        assert response.status_code == 200
        data = response.json()
        assert "access_token" in data
        assert "token_type" in data
        assert "expires_in" in data
        assert data["token_type"] == "bearer"
        assert len(data["access_token"]) > 10
    
    def test_login_invalid_credentials(self, client):
        """Test login with invalid credentials"""
        response = client.post(
            "/token",
            data={"username": "nonexistent", "password": "wrongpass"}
        )
        assert response.status_code == 401
        assert "Incorrect username or password" in response.json()["detail"]
    
    def test_login_missing_fields(self, client):
        """Test login with missing fields"""
        # Missing username
        response = client.post(
            "/token",
            data={"password": "testpass123"}
        )
        assert response.status_code == 422  # Validation error
        
        # Missing password
        response = client.post(
            "/token",
            data={"username": "testuser"}
        )
        assert response.status_code == 422  # Validation error
    
    def test_protected_endpoint_without_token(self, client):
        """Test accessing protected endpoint without token"""
        response = client.get("/")
        assert response.status_code == 401
    
    def test_protected_endpoint_with_token(self, client):
        """Test accessing protected endpoint with valid token"""
        # Create user and login
        client.post(
            "/signup",
            data={"username": "protectedtest", "password": "testpass123"}
        )
        
        login_response = client.post(
            "/token",
            data={"username": "protectedtest", "password": "testpass123"}
        )
        token = login_response.json()["access_token"]
        
        # Access protected endpoint
        response = client.get(
            "/",
            headers={"Authorization": f"Bearer {token}"}
        )
        assert response.status_code == 200
        data = response.json()
        assert "message" in data
        assert "SkillMap AI backend is running" in data["message"]
