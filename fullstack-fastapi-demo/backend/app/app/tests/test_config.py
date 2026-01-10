"""Test configuration settings, specifically the EMAILS_FROM_NAME validator fix."""
import os
from unittest.mock import patch

import pytest
from pydantic import ValidationError

from app.core.config import Settings


def test_emails_from_name_uses_project_name_when_not_provided():
    """Test that EMAILS_FROM_NAME defaults to PROJECT_NAME when not provided.
    
    This test verifies the fix for the KeyError bug where accessing
    info.data["PROJECT_NAME"] would fail if PROJECT_NAME wasn't in the data yet.
    """
    # Set required environment variables
    env_vars = {
        "SERVER_NAME": "test-server",
        "SERVER_HOST": "http://localhost",
        "PROJECT_NAME": "Test Project",
        "MONGO_DATABASE": "test_db",
        "MONGO_DATABASE_URI": "mongodb://localhost:27017",
        "FIRST_SUPERUSER": "admin@test.com",
        "FIRST_SUPERUSER_PASSWORD": "testpassword123",
    }
    
    with patch.dict(os.environ, env_vars, clear=False):
        settings = Settings()
        # EMAILS_FROM_NAME should default to PROJECT_NAME when not provided
        assert settings.EMAILS_FROM_NAME == "Test Project"
        assert settings.PROJECT_NAME == "Test Project"


def test_emails_from_name_uses_provided_value():
    """Test that EMAILS_FROM_NAME uses the provided value when set."""
    env_vars = {
        "SERVER_NAME": "test-server",
        "SERVER_HOST": "http://localhost",
        "PROJECT_NAME": "Test Project",
        "MONGO_DATABASE": "test_db",
        "MONGO_DATABASE_URI": "mongodb://localhost:27017",
        "FIRST_SUPERUSER": "admin@test.com",
        "FIRST_SUPERUSER_PASSWORD": "testpassword123",
        "EMAILS_FROM_NAME": "Custom Name",
    }
    
    with patch.dict(os.environ, env_vars, clear=False):
        settings = Settings()
        # EMAILS_FROM_NAME should use the provided value
        assert settings.EMAILS_FROM_NAME == "Custom Name"
        assert settings.PROJECT_NAME == "Test Project"


def test_emails_from_name_without_project_name_raises_error():
    """Test that Settings validation fails when PROJECT_NAME is missing.
    
    This ensures that the model_validator doesn't mask the missing PROJECT_NAME error.
    """
    env_vars = {
        "SERVER_NAME": "test-server",
        "SERVER_HOST": "http://localhost",
        # PROJECT_NAME is intentionally missing
        "MONGO_DATABASE": "test_db",
        "MONGO_DATABASE_URI": "mongodb://localhost:27017",
        "FIRST_SUPERUSER": "admin@test.com",
        "FIRST_SUPERUSER_PASSWORD": "testpassword123",
    }
    
    with patch.dict(os.environ, env_vars, clear=False):
        with pytest.raises(ValidationError) as exc_info:
            Settings()
        # Should fail because PROJECT_NAME is required
        assert "PROJECT_NAME" in str(exc_info.value)
