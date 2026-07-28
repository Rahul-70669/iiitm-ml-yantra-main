import pytest
from fastapi.testclient import TestClient
import pandas as pd
import numpy as np
import io
import json
from main import app
from app.services.dataset_manager import dataset_manager

client = TestClient(app)

def create_csv_upload_file(df, filename="test.csv"):
    stream = io.StringIO()
    df.to_csv(stream, index=False)
    stream.seek(0)
    return {"file": (filename, stream.getvalue(), "text/csv")}

def test_validate_features_missing_columns():
    df = pd.DataFrame({"f1": [1, 2, 3], "target": [0, 1, 0]})
    files = create_csv_upload_file(df)
    sess_id = client.post("/upload", files=files).json()["session_id"]
    
    payload = {
        "features": ["f1", "non_existent"],
        "target": "target",
        "problemType": "classification"
    }
    
    res = client.post(f"/train/validate-features/{sess_id}", json=payload)
    data = res.json()
    assert data["valid"] == False
    assert any("non_existent" in error["message"] for error in data["errors"])

def test_validate_features_categorical_columns():
    df = pd.DataFrame({"f1": [1, 2, 3], "f2": ["A", "B", "C"], "target": [0, 1, 0]})
    files = create_csv_upload_file(df)
    sess_id = client.post("/upload", files=files).json()["session_id"]
    
    payload = {
        "features": ["f1", "f2"],
        "target": "target",
        "problemType": "classification"
    }
    
    res = client.post(f"/train/validate-features/{sess_id}", json=payload)
    data = res.json()
    assert any("f2" in error["message"] for error in data["errors"])

def test_full_training_pipeline_and_predict():
    # 1. Create a dummy numeric dataset for regression
    df = pd.DataFrame({
        "feature_1": np.random.rand(100),
        "feature_2": np.random.rand(100),
        "target_col": np.random.rand(100) * 10
    })
    files = create_csv_upload_file(df)
    sess_id = client.post("/upload", files=files).json()["session_id"]
    
    # 2. Start Training
    train_payload = {
        "features": ["feature_1", "feature_2"],
        "target": "target_col",
        "problemType": "regression",
        "algorithms": ["linear_regression"],
        "trainTestSplit": 0.8,
        "scaling": True
    }
    train_res = client.post(f"/train/start/{sess_id}", json=train_payload)
    assert train_res.status_code == 200
    
    train_data = train_res.json()
    assert "trainingId" in train_data
    assert len(train_data["models"]) == 1
    
    training_id = train_data["trainingId"]
    model_id = train_data["models"][0]["modelId"]
    
    # 3. Retrieve Results from Disk Cache
    res_fetch = client.get(f"/train/results/{training_id}")
    assert res_fetch.status_code == 200
    assert res_fetch.json()["trainingId"] == training_id
    
    # 4. Export JSON config
    config_fetch = client.get(f"/train/export-config/{training_id}")
    assert config_fetch.status_code == 200
    config = config_fetch.json()
    assert config["features"] == ["feature_1", "feature_2"]
    
    # 5. Make a prediction using the disk cached model
    pred_payload = {"feature_1": 0.5, "feature_2": 0.5}
    pred_res = client.post(f"/train/predict/{training_id}/{model_id}", json=pred_payload)
    assert pred_res.status_code == 200
    assert "prediction" in pred_res.json()
