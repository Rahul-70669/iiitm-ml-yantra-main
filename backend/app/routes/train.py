from fastapi import APIRouter, HTTPException
from app.schemas import TrainingRequest, TrainingResponse, MessageResponse, FeatureValidationRequest, FeatureValidationResponse, ValidationIssue
from app.services.dataset_manager import dataset_manager
from app.services.model_trainer import model_trainer
import pickle
import io
import os
import json
import numpy as np
import pandas as pd
from fastapi.responses import StreamingResponse

router = APIRouter()

# Setup Disk Cache Storage for True Persistence
CACHE_DIR = os.path.join(os.path.dirname(os.path.abspath(__file__)), '..', '..', '.cache')
RESULTS_DIR = os.path.join(CACHE_DIR, 'results')
MODELS_DIR = os.path.join(CACHE_DIR, 'models')

os.makedirs(RESULTS_DIR, exist_ok=True)
os.makedirs(MODELS_DIR, exist_ok=True)

def save_training_results(training_id: str, data: dict):
    with open(os.path.join(RESULTS_DIR, f"{training_id}.pkl"), "wb") as f:
        pickle.dump(data, f)

def get_training_results(training_id: str) -> dict:
    path = os.path.join(RESULTS_DIR, f"{training_id}.pkl")
    if not os.path.exists(path):
        return None
    with open(path, "rb") as f:
        return pickle.load(f)

def save_trained_models(training_id: str, models_data: dict):
    with open(os.path.join(MODELS_DIR, f"{training_id}_models.pkl"), "wb") as f:
        pickle.dump(models_data, f)

def get_trained_models(training_id: str) -> dict:
    path = os.path.join(MODELS_DIR, f"{training_id}_models.pkl")
    if not os.path.exists(path):
        return None
    with open(path, "rb") as f:
        return pickle.load(f)

@router.post("/validate-features/{session_id}", response_model=FeatureValidationResponse)
async def validate_features(session_id: str, request: FeatureValidationRequest):
    """Validate features and target before training to ensure maximum accuracy"""
    try:
        df = dataset_manager.get_dataset(session_id)
        
        warnings = []
        errors = []
        
        all_cols = request.features + [request.target]
        
        # Check if columns exist
        missing_cols = [col for col in all_cols if col not in df.columns]
        if missing_cols:
            errors.append(ValidationIssue(
                level="error",
                message=f"Columns not found in dataset: {', '.join(missing_cols)}"
            ))
            return FeatureValidationResponse(valid=False, warnings=warnings, errors=errors)
        
        # 1. Check for null values in features and target
        for col in all_cols:
            null_count = int(df[col].isnull().sum())
            if null_count > 0:
                pct = round(null_count / len(df) * 100, 1)
                warnings.append(ValidationIssue(
                    level="warning",
                    column=col,
                    message=f"'{col}' has {null_count} null values ({pct}%). Rows with nulls will be dropped during training."
                ))
        
        # 2. Check for non-numeric features
        for col in request.features:
            if not pd.api.types.is_numeric_dtype(df[col]):
                errors.append(ValidationIssue(
                    level="error",
                    column=col,
                    message=f"Feature '{col}' is non-numeric (type: {df[col].dtype}). Please encode categorical features before training."
                ))
        
        # 3. Target column type validation
        target_is_numeric = pd.api.types.is_numeric_dtype(df[request.target])
        if request.problemType == 'regression' and not target_is_numeric:
            errors.append(ValidationIssue(
                level="error",
                column=request.target,
                message=f"Target '{request.target}' is non-numeric but Regression was selected. Use Classification or encode the target."
            ))
        
        if request.problemType == 'classification' and target_is_numeric:
            unique_count = df[request.target].nunique()
            if unique_count > 50:
                warnings.append(ValidationIssue(
                    level="warning",
                    column=request.target,
                    message=f"Target '{request.target}' has {unique_count} unique values. Are you sure this is a Classification problem? Consider Regression instead."
                ))
        
        # 4. Low variance features
        for col in request.features:
            if np.issubdtype(df[col].dtype, np.number):
                variance = df[col].var()
                if variance is not None and variance < 1e-10:
                    warnings.append(ValidationIssue(
                        level="warning",
                        column=col,
                        message=f"Feature '{col}' has near-zero variance ({variance:.2e}). It may not contribute to model performance."
                    ))
        
        # 5. High cardinality check for classification target
        if request.problemType == 'classification':
            unique_vals = df[request.target].nunique()
            total_rows = len(df)
            if unique_vals > 0.5 * total_rows and total_rows > 20:
                warnings.append(ValidationIssue(
                    level="warning",
                    column=request.target,
                    message=f"Target has {unique_vals} unique values out of {total_rows} rows — looks like a continuous variable. Consider switching to Regression."
                ))
        
        # 6. Check if too few samples
        non_null_count = df[all_cols].dropna().shape[0]
        if non_null_count < 10:
            errors.append(ValidationIssue(
                level="error",
                message=f"Only {non_null_count} valid (non-null) rows available for training. Need at least 10."
            ))
        elif non_null_count < 50:
            warnings.append(ValidationIssue(
                level="warning",
                message=f"Only {non_null_count} valid rows for training. Results may be unreliable with so few samples."
            ))
        
        # 7. CLASS IMBALANCE DETECTION (critical for fraud, medical, anomaly datasets)
        if request.problemType == 'classification':
            value_counts = df[request.target].value_counts()
            total = len(df)
            majority_count = value_counts.iloc[0]
            minority_count = value_counts.iloc[-1]
            imbalance_ratio = round(majority_count / minority_count, 1) if minority_count > 0 else float('inf')
            
            if imbalance_ratio > 10:
                # Severely imbalanced (e.g., credit card fraud)
                dist_str = ', '.join([f"Class {cls}: {count} ({round(count/total*100, 2)}%)" for cls, count in value_counts.items()])
                warnings.append(ValidationIssue(
                    level="warning",
                    column=request.target,
                    message=f"⚠️ SEVERELY IMBALANCED DATASET DETECTED (Ratio: {imbalance_ratio}:1). Distribution: {dist_str}. Accuracy is misleading for this data — F1 Score, Precision, and Recall are more meaningful. SMOTE oversampling will be auto-applied during training to balance the minority class."
                ))
            elif imbalance_ratio > 3:
                dist_str = ', '.join([f"Class {cls}: {count} ({round(count/total*100, 2)}%)" for cls, count in value_counts.items()])
                warnings.append(ValidationIssue(
                    level="warning",
                    column=request.target,
                    message=f"Imbalanced dataset detected (Ratio: {imbalance_ratio}:1). Distribution: {dist_str}. SMOTE oversampling will be auto-applied. Models will be ranked by F1 Score instead of Accuracy."
                ))
        
        valid = len(errors) == 0
        return FeatureValidationResponse(valid=valid, warnings=warnings, errors=errors)
        
    except ValueError as e:
        raise HTTPException(status_code=404, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error validating features: {str(e)}")


@router.post("/start/{session_id}", response_model=TrainingResponse)
async def start_training(session_id: str, request: TrainingRequest):
    """Start ML model training"""
    try:
        # Get dataset
        df = dataset_manager.get_dataset(session_id)
        
        # Validate features and target exist
        missing_cols = [col for col in request.features + [request.target] if col not in df.columns]
        if missing_cols:
            raise HTTPException(
                status_code=400,
                detail=f"Columns not found in dataset: {', '.join(missing_cols)}"
            )
        
        # Train models
        results = model_trainer.train_models(
            df=df,
            features=request.features,
            target=request.target,
            problem_type=request.problemType,
            algorithms=request.algorithms,
            train_test_split_ratio=request.trainTestSplit,
            validation_split=request.validationSplit,
            scaling=request.scaling
        )
        
        training_id = results['trainingId']
        
        # Store results, models, and configuration
        results_data = {
            'session_id': session_id,
            'problemType': results['problemType'],
            'models': results['models'],
            'bestModel': results['bestModel'],
            'config': {
                'features': request.features,
                'target': request.target,
                'problemType': request.problemType,
                'algorithms': request.algorithms,
                'trainTestSplit': request.trainTestSplit,
                'scaling': request.scaling
            }
        }
        
        save_training_results(training_id, results_data)
        save_trained_models(training_id, results['trained_models'])
        
        return TrainingResponse(
            trainingId=training_id,
            session_id=session_id,
            problemType=results['problemType'],
            models=results['models'],
            bestModel=results['bestModel'],
            message=f"Successfully trained {len(results['models'])} model(s)",
            classDistribution=results.get('classDistribution'),
            imbalanceRatio=results.get('imbalanceRatio'),
            smoteApplied=results.get('smoteApplied'),
            validationMetrics=results.get('validationMetrics')
        )
        
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error training models: {str(e)}")


@router.get("/results/{training_id}", response_model=TrainingResponse)
async def get_training_results_api(training_id: str):
    """Get training results by training ID"""
    try:
        results = get_training_results(training_id)
        if not results:
            raise HTTPException(status_code=404, detail="Training results not found")
        
        return TrainingResponse(
            trainingId=training_id,
            session_id=results['session_id'],
            problemType=results['problemType'],
            models=results['models'],
            bestModel=results['bestModel'],
            message="Training results retrieved successfully"
        )
        
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error retrieving results: {str(e)}")


@router.get("/download-model/{training_id}/{model_id}")
async def download_model(training_id: str, model_id: str):
    """Download trained model as pickle file"""
    try:
        models = get_trained_models(training_id)
        if not models:
            raise HTTPException(status_code=404, detail="Training not found")
        
        if model_id not in models:
            raise HTTPException(status_code=404, detail="Model not found")
        
        model_data = models[model_id]
        
        # Serialize model to pickle
        buffer = io.BytesIO()
        pickle.dump(model_data, buffer)
        buffer.seek(0)
        
        return StreamingResponse(
            iter([buffer.getvalue()]),
            media_type="application/octet-stream",
            headers={
                "Content-Disposition": f"attachment; filename=model_{model_id[:8]}.pkl"
            }
        )
        
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error downloading model: {str(e)}")


@router.post("/predict/{training_id}/{model_id}")
async def predict_api(training_id: str, model_id: str, data: dict):
    """Make predictions using a trained model"""
    try:
        models = get_trained_models(training_id)
        if not models:
            raise HTTPException(status_code=404, detail="Training not found")
        
        if model_id not in models:
            raise HTTPException(status_code=404, detail="Model not found")
        
        model_data = models[model_id]
        model = model_data['model']
        scaler = model_data['scaler']
        features = model_data['features']
        
        # Prepare input data
        import pandas as pd
        input_df = pd.DataFrame([data])
        
        # Check if all features are present
        missing_features = [f for f in features if f not in input_df.columns]
        if missing_features:
            raise HTTPException(
                status_code=400,
                detail=f"Missing features: {', '.join(missing_features)}"
            )
        
        X = input_df[features]
        
        # Apply scaling if model was trained with scaling
        if scaler is not None:
            X = pd.DataFrame(
                scaler.transform(X),
                columns=X.columns
            )
        
        # Make prediction
        prediction = model.predict(X)
        
        # Get prediction probabilities for classification
        probabilities = None
        if hasattr(model, 'predict_proba'):
            probabilities = model.predict_proba(X).tolist()
        
        return {
            "prediction": prediction.tolist(),
            "probabilities": probabilities
        }
        
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error making prediction: {str(e)}")


@router.get("/export-config/{training_id}")
async def export_config(training_id: str):
    """Export training configuration as JSON"""
    try:
        results = get_training_results(training_id)
        if not results:
            raise HTTPException(status_code=404, detail="Training not found")
        
        config = results.get('config', {})
        
        config_json = json.dumps(config, indent=2)
        
        return StreamingResponse(
            iter([config_json.encode()]),
            media_type="application/json",
            headers={
                "Content-Disposition": f"attachment; filename=training_config_{training_id[:8]}.json"
            }
        )
        
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error exporting config: {str(e)}")


from fastapi import File, UploadFile, Form

@router.post("/validate-unseen/{training_id}/{model_id}")
async def validate_on_unseen_data(
    training_id: str,
    model_id: str,
    file: UploadFile = File(...)
):
    """
    Validate a trained model on completely unseen data.
    Accepts a CSV file with the same features + target column.
    Returns predictions and metrics computed against the actual target values.
    """
    try:
        models = get_trained_models(training_id)
        if not models:
            raise HTTPException(status_code=404, detail="Training not found")
        
        if model_id not in models:
            raise HTTPException(status_code=404, detail="Model not found")
        
        results_data = get_training_results(training_id)
        if not results_data:
            raise HTTPException(status_code=404, detail="Training results not found")
        
        model_data = models[model_id]
        model = model_data['model']
        scaler = model_data['scaler']
        features = model_data['features']
        target = model_data['target']
        problem_type = results_data['problemType']
        
        # Read uploaded CSV
        contents = await file.read()
        df = pd.read_csv(io.BytesIO(contents))
        
        # Check features exist
        missing_features = [f for f in features if f not in df.columns]
        if missing_features:
            raise HTTPException(
                status_code=400,
                detail=f"Missing feature columns in uploaded file: {', '.join(missing_features)}"
            )
        
        has_target = target in df.columns
        
        X_val = df[features].copy()
        
        # Drop rows with NaN in features
        valid_mask = X_val.notna().all(axis=1)
        if has_target:
            valid_mask = valid_mask & df[target].notna()
        X_val = X_val[valid_mask]
        
        if X_val.empty:
            raise HTTPException(status_code=400, detail="No valid rows in uploaded file after removing nulls")
        
        # Apply scaling
        if scaler is not None:
            X_val = pd.DataFrame(
                scaler.transform(X_val),
                columns=X_val.columns,
                index=X_val.index
            )
        
        # Make predictions
        y_pred = model.predict(X_val)
        
        # Calculate metrics if target column is present
        validation_metrics = None
        confusion_mat = None
        if has_target:
            y_true = df[target][valid_mask]
            
            from app.services.model_trainer import model_trainer
            validation_metrics = model_trainer._calculate_metrics(
                y_true.values, y_pred, problem_type, model, X_val, len(features)
            )
            
            if problem_type == 'classification':
                from sklearn.metrics import confusion_matrix as cm
                confusion_mat = cm(y_true, y_pred).tolist()
        
        # Get probabilities if available
        probabilities = None
        if hasattr(model, 'predict_proba'):
            probabilities = model.predict_proba(X_val).tolist()
        
        return {
            "totalRows": len(df),
            "validRows": int(valid_mask.sum()),
            "predictions": y_pred.tolist(),
            "probabilities": probabilities,
            "hasTarget": has_target,
            "metrics": validation_metrics,
            "confusionMatrix": confusion_mat
        }
        
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error validating on unseen data: {str(e)}")


@router.post("/predict-manual/{training_id}/{model_id}")
async def predict_manual(training_id: str, model_id: str, data: dict):
    """Make a single prediction from manually entered feature values"""
    try:
        models = get_trained_models(training_id)
        if not models:
            raise HTTPException(status_code=404, detail="Training not found")
        
        if model_id not in models:
            raise HTTPException(status_code=404, detail="Model not found")
        
        model_data = models[model_id]
        model = model_data['model']
        scaler = model_data['scaler']
        features = model_data['features']
        
        input_values = data.get('values', {})
        
        # Build input dataframe
        input_df = pd.DataFrame([{f: float(input_values.get(f, 0)) for f in features}])
        
        # Apply scaling
        if scaler is not None:
            input_df = pd.DataFrame(
                scaler.transform(input_df),
                columns=input_df.columns
            )
        
        prediction = model.predict(input_df)
        
        probabilities = None
        if hasattr(model, 'predict_proba'):
            probabilities = model.predict_proba(input_df).tolist()
        
        return {
            "prediction": prediction.tolist()[0] if len(prediction) > 0 else None,
            "probabilities": probabilities[0] if probabilities else None
        }
        
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error making prediction: {str(e)}")
