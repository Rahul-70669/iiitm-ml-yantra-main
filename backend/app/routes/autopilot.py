"""
AutoPilot API Routes
Endpoints for the intelligent end-to-end ML pipeline.
"""

from fastapi import APIRouter, HTTPException
from fastapi.responses import StreamingResponse
from app.schemas import AutoPilotRunRequest, AutoPilotAnalyzeResponse, AutoPilotRunResponse
from app.services.dataset_manager import dataset_manager
from app.services.autopilot_engine import AutoPilotEngine
from app.services.notebook_generator import generate_notebook
import pickle
import json
import io
import os

router = APIRouter()

# Disk cache for autopilot results
CACHE_DIR = os.path.join(os.path.dirname(os.path.abspath(__file__)), '..', '..', '.cache')
AUTOPILOT_DIR = os.path.join(CACHE_DIR, 'autopilot')
os.makedirs(AUTOPILOT_DIR, exist_ok=True)


def _save_autopilot(autopilot_id: str, data: dict):
    with open(os.path.join(AUTOPILOT_DIR, f"{autopilot_id}.pkl"), "wb") as f:
        pickle.dump(data, f)


def _load_autopilot(autopilot_id: str) -> dict:
    path = os.path.join(AUTOPILOT_DIR, f"{autopilot_id}.pkl")
    if not os.path.exists(path):
        return None
    with open(path, "rb") as f:
        return pickle.load(f)


@router.post("/analyze/{session_id}")
async def analyze_dataset(session_id: str):
    """
    Analyze a dataset and return smart target suggestions + dataset profile.
    This is the first step of the AutoPilot flow.
    """
    try:
        df = dataset_manager.get_dataset(session_id)
        engine = AutoPilotEngine()
        analysis = engine.analyze(df)

        return {
            'session_id': session_id,
            **analysis
        }

    except ValueError as e:
        raise HTTPException(status_code=404, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error analyzing dataset: {str(e)}")


@router.post("/run/{session_id}")
async def run_autopilot(session_id: str, request: AutoPilotRunRequest):
    """
    Run the full AutoPilot pipeline: auto-clean → auto-EDA → auto-train.
    Returns complete results including pipeline log, EDA charts, and trained models.
    """
    try:
        df = dataset_manager.get_dataset(session_id)

        if request.target not in df.columns:
            raise HTTPException(
                status_code=400,
                detail=f"Target column '{request.target}' not found in dataset"
            )

        # Run the full pipeline
        engine = AutoPilotEngine()
        result = engine.run(df, request.target, request.problem_type)

        autopilot_id = result['autopilot_id']

        # Get original filename from session metadata
        filename = dataset_manager.get_filename(session_id)

        # Generate the Colab notebook
        notebook = generate_notebook(
            filename=filename,
            pipeline_log=result['pipeline_log'],
            before_summary=result['before_summary'],
            after_summary=result['after_summary'],
            problem_type=result['problem_type'],
            target=request.target,
            features_used=result['features_used'],
            encoding_map=result['encoding_map'],
            training_results=result['training_results'],
            best_model_name=result['best_model_name'],
            best_metrics=result['best_metrics'],
        )

        # Save everything to disk cache
        _save_autopilot(autopilot_id, {
            'session_id': session_id,
            'filename': filename,
            'result': {
                'autopilot_id': autopilot_id,
                'problem_type': result['problem_type'],
                'pipeline_log': result['pipeline_log'],
                'before_summary': result['before_summary'],
                'after_summary': result['after_summary'],
                'eda_charts': result['eda_charts'],
                'training_results': result['training_results'],
                'best_model_name': result['best_model_name'],
                'best_model_id': result['best_model_id'],
                'best_metrics': result['best_metrics'],
                'feature_importance': result.get('feature_importance'),
            },
            'notebook': notebook,
            'trained_models': result['trained_models'],
            'cleaned_df': result['cleaned_df'],
        })

        # Build the response (exclude non-serializable data)
        return {
            'autopilot_id': autopilot_id,
            'session_id': session_id,
            'problem_type': result['problem_type'],
            'pipeline_log': result['pipeline_log'],
            'before_summary': result['before_summary'],
            'after_summary': result['after_summary'],
            'eda_charts': result['eda_charts'],
            'training_results': result['training_results'],
            'best_model_name': result['best_model_name'],
            'best_model_id': result['best_model_id'],
            'best_metrics': result['best_metrics'],
            'feature_importance': result.get('feature_importance'),
        }

    except HTTPException:
        raise
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        import traceback
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=f"AutoPilot error: {str(e)}")


@router.get("/download-notebook/{autopilot_id}")
async def download_notebook(autopilot_id: str):
    """Download the generated Colab notebook (.ipynb)"""
    try:
        data = _load_autopilot(autopilot_id)
        if not data:
            raise HTTPException(status_code=404, detail="AutoPilot session not found")

        notebook = data['notebook']
        notebook_json = json.dumps(notebook, indent=2, ensure_ascii=False)

        filename = data.get('filename', 'dataset').rsplit('.', 1)[0]

        return StreamingResponse(
            iter([notebook_json.encode('utf-8')]),
            media_type="application/json",
            headers={
                "Content-Disposition": f"attachment; filename=ML_Yantra_AutoPilot_{filename}.ipynb"
            }
        )

    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error downloading notebook: {str(e)}")


@router.get("/download-cleaned/{autopilot_id}")
async def download_cleaned_dataset(autopilot_id: str):
    """Download the cleaned dataset as CSV"""
    try:
        data = _load_autopilot(autopilot_id)
        if not data:
            raise HTTPException(status_code=404, detail="AutoPilot session not found")

        df = data['cleaned_df']
        stream = io.StringIO()
        df.to_csv(stream, index=False)
        stream.seek(0)

        filename = data.get('filename', 'dataset').rsplit('.', 1)[0]

        return StreamingResponse(
            iter([stream.getvalue()]),
            media_type="text/csv",
            headers={
                "Content-Disposition": f"attachment; filename={filename}_autopilot_cleaned.csv"
            }
        )

    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error downloading cleaned data: {str(e)}")


@router.get("/download-model/{autopilot_id}")
async def download_best_model(autopilot_id: str):
    """Download the best trained model as a pickle file"""
    try:
        data = _load_autopilot(autopilot_id)
        if not data:
            raise HTTPException(status_code=404, detail="AutoPilot session not found")

        best_model_id = data['result']['best_model_id']
        trained_models = data.get('trained_models', {})

        if best_model_id not in trained_models:
            raise HTTPException(status_code=404, detail="Best model not found")

        model_data = trained_models[best_model_id]

        buffer = io.BytesIO()
        pickle.dump(model_data, buffer)
        buffer.seek(0)

        model_name = data['result']['best_model_name'].replace(' ', '_').lower()

        return StreamingResponse(
            iter([buffer.getvalue()]),
            media_type="application/octet-stream",
            headers={
                "Content-Disposition": f"attachment; filename=autopilot_best_{model_name}.pkl"
            }
        )

    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error downloading model: {str(e)}")
