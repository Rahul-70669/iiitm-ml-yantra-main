import pytest
from fastapi.testclient import TestClient
import pandas as pd
import numpy as np
import io
import json
from main import app
from app.services.dataset_manager import dataset_manager

client = TestClient(app)

# Helper function to mock file uploads
def create_csv_upload_file(df, filename="test.csv"):
    stream = io.StringIO()
    df.to_csv(stream, index=False)
    stream.seek(0)
    return {"file": (filename, stream.getvalue(), "text/csv")}

def test_upload_normal_numeric_csv():
    df = pd.DataFrame({"age": [25, 30, 35], "salary": [50000, 60000, 70000]})
    files = create_csv_upload_file(df, "clean.csv")
    response = client.post("/upload", files=files)
    assert response.status_code == 200
    data = response.json()
    assert data["filename"] == "clean.csv"
    assert data["rows"] == 3
    assert data["columns"] == 2
    assert "session_id" in data

def test_upload_malformed_text_csv():
    # Dataset with mixed types and nulls
    df = pd.DataFrame({
        "ID": [1, 2, 3, 4],
        "City": ["New York", "London", np.nan, "Paris"],
        "Is_Active": [True, False, True, np.nan]
    })
    files = create_csv_upload_file(df, "messy.csv")
    response = client.post("/upload", files=files)
    assert response.status_code == 200
    data = response.json()
    assert data["rows"] == 4
    
    # Check stats for null identification
    session_id = data["session_id"]
    stats_response = client.get(f"/statistics/{session_id}")
    stats = stats_response.json()
    assert stats["null_counts"]["City"] == 1
    assert stats["null_counts"]["Is_Active"] == 1

def test_upload_unsupported_file():
    files = {"file": ("image.png", b"fake image bytes", "image/png")}
    response = client.post("/upload", files=files)
    assert response.status_code == 400
    assert "Only CSV and Excel" in response.json()["detail"]

def test_handle_nulls_drop():
    df = pd.DataFrame({"A": [1, np.nan, 3], "B": ["x", "y", np.nan]})
    files = create_csv_upload_file(df)
    res = client.post("/upload", files=files)
    sess_id = res.json()["session_id"]
    
    # Drop rows with nulls
    payload = {"strategy": "drop", "columns": ["A", "B"]}
    clean_res = client.post(f"/clean/nulls/{sess_id}", json=payload)
    assert clean_res.status_code == 200
    
    # Preview should have only 1 row
    preview_res = client.get(f"/preview/{sess_id}?num_rows=10")
    assert preview_res.json()["total_rows"] == 1

def test_handle_nulls_fill_mean():
    df = pd.DataFrame({"A": [10, np.nan, 30]})
    files = create_csv_upload_file(df)
    sess_id = client.post("/upload", files=files).json()["session_id"]
    
    payload = {"strategy": "fill_mean", "columns": ["A"]}
    client.post(f"/clean/nulls/{sess_id}", json=payload)
    
    preview = client.get(f"/preview/{sess_id}?num_rows=10").json()
    assert preview["data"][1]["A"] == 20.0  # (10+30)/2

def test_encode_categorical():
    df = pd.DataFrame({"City": ["NY", "LA", "NY", "CHI"]})
    files = create_csv_upload_file(df)
    sess_id = client.post("/upload", files=files).json()["session_id"]
    
    payload = {"column": "City", "method": "label"}
    res = client.post(f"/clean/encode/{sess_id}", json=payload)
    assert res.status_code == 200
    
    preview = client.get(f"/preview/{sess_id}?num_rows=10").json()
    assert isinstance(preview["data"][0]["City"], int)

def test_history_undo_redo():
    df = pd.DataFrame({"A": [1, 2, 3]})
    files = create_csv_upload_file(df)
    sess_id = client.post("/upload", files=files).json()["session_id"]
    
    # Rename column A to B
    payload = {"action": "rename", "columns": ["A"], "new_names": {"A": "B"}}
    client.post(f"/clean/columns/{sess_id}", json=payload)
    
    preview = client.get(f"/preview/{sess_id}?num_rows=1").json()
    assert "B" in preview["data"][0]
    
    # Undo it
    client.post(f"/history/undo/{sess_id}")
    preview2 = client.get(f"/preview/{sess_id}?num_rows=1").json()
    assert "A" in preview2["data"][0]
    assert "B" not in preview2["data"][0]
    
    # Redo it
    client.post(f"/history/redo/{sess_id}")
    preview3 = client.get(f"/preview/{sess_id}?num_rows=1").json()
    assert "B" in preview3["data"][0]
