import pytest
from fastapi.testclient import TestClient
from main import app

client = TestClient(app)

def test_ai_analyze_missing_session():
    res = client.post("/ai/analyze-dataset", json={"session_id": "invalid_session_id_123"})
    assert res.status_code == 200
    assert "response" in res.json()

def test_ai_recommend_cleaning_missing_session():
    res = client.post("/ai/recommend-cleaning", json={"session_id": "invalid_1"})
    assert res.status_code == 200

def test_ai_chat_missing_authOrToken():
    # Test simple chat endpoint without context
    res = client.post("/ai/chat", json={
        "message": "Hello AI",
        "session_id": ""
    })
    
    assert res.status_code == 200
    assert "response" in res.json()
