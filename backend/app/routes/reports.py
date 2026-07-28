"""
Report Studio API Routes
Generate, preview, refine, and download analytical reports.
"""

import pickle
import os
import json
from fastapi import APIRouter, HTTPException
from fastapi.responses import Response
from pydantic import BaseModel
from typing import Optional, Dict, Any

from app.services.report_engine import report_engine
from app.services.report_exporter import export_pdf, export_markdown, export_pptx
from app.services.gemini_service import gemini_service
from app.services.context_builder import context_builder
from app.services.dataset_manager import dataset_manager

router = APIRouter()

# ─── Cache for generated reports ───
CACHE_DIR = os.path.join(os.path.dirname(os.path.dirname(os.path.dirname(__file__))), '.cache', 'reports')
os.makedirs(CACHE_DIR, exist_ok=True)

_report_cache: Dict[str, Dict] = {}


def _save_report(report_id: str, report: Dict):
    _report_cache[report_id] = report
    try:
        cache_path = os.path.join(CACHE_DIR, f'{report_id}.pkl')
        with open(cache_path, 'wb') as f:
            pickle.dump(report, f)
    except Exception as e:
        print(f"[Reports] Cache save error: {e}")


def _load_report(report_id: str) -> Optional[Dict]:
    if report_id in _report_cache:
        return _report_cache[report_id]
    try:
        cache_path = os.path.join(CACHE_DIR, f'{report_id}.pkl')
        if os.path.exists(cache_path):
            with open(cache_path, 'rb') as f:
                report = pickle.load(f)
                _report_cache[report_id] = report
                return report
    except Exception:
        pass
    return None


# ─── Schemas ───

class GenerateReportRequest(BaseModel):
    session_id: str
    template_id: str
    custom_title: Optional[str] = None
    use_ai: bool = False
    autopilot_id: Optional[str] = None


class CustomReportRequest(BaseModel):
    session_id: str
    description: str
    use_ai: bool = True
    blueprint: Optional[Dict[str, Any]] = None


class RefineReportRequest(BaseModel):
    report_id: str
    feedback: str


class SuggestReportRequest(BaseModel):
    session_id: str
    description: str


# ─── Endpoints ───

@router.get("/templates")
async def list_templates():
    """List all available report templates."""
    templates = report_engine.get_templates()
    return {"templates": templates}


@router.post("/generate")
async def generate_report(request: GenerateReportRequest):
    """Generate a report from a template and session data."""
    try:
        # Load AutoPilot data if available
        autopilot_data = None
        if request.autopilot_id:
            try:
                ap_cache_dir = os.path.join(os.path.dirname(CACHE_DIR), 'autopilot')
                ap_path = os.path.join(ap_cache_dir, f'{request.autopilot_id}.pkl')
                if os.path.exists(ap_path):
                    with open(ap_path, 'rb') as f:
                        autopilot_data = pickle.load(f)
            except Exception:
                pass

        # Optionally get AI-generated insights
        ai_insights = None
        if request.use_ai:
            try:
                dataset_info = context_builder.build_dataset_context(request.session_id)
                training_info = None
                if autopilot_data:
                    training_info = {
                        'best_model_name': autopilot_data.get('best_model_name'),
                        'best_metrics': autopilot_data.get('best_metrics'),
                        'models': autopilot_data.get('training_results', {}).get('models', []),
                    }
                ai_insights = await gemini_service.generate_report_insights(
                    dataset_info, request.template_id, training_info
                )
            except Exception as e:
                print(f"[Reports] AI insights error (continuing without): {e}")

        # Generate the report
        report = report_engine.generate(
            session_id=request.session_id,
            template_id=request.template_id,
            autopilot_data=autopilot_data,
            custom_title=request.custom_title,
            ai_insights=ai_insights,
        )

        # Cache it
        _save_report(report['report_id'], report)

        return report

    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Report generation failed: {str(e)}")


@router.post("/generate-custom")
async def generate_custom_report(request: CustomReportRequest):
    """AI-powered custom report from user's natural language description."""
    try:
        # Get AI template suggestion
        dataset_info = None
        try:
            dataset_info = context_builder.build_dataset_context(request.session_id)
        except Exception:
            pass

        custom_sections = []
        custom_title = None
        suggestion = None

        if request.blueprint:
            fallback_blocks = ['dataset_overview', 'data_quality_score', 'null_analysis', 'distribution_summary', 'correlation_analysis', 'outlier_analysis', 'kpi_cards']
            bp_sections = request.blueprint.get('sections', [])
            for i, s in enumerate(bp_sections):
                if not s.get('component_id'):
                    s['component_id'] = fallback_blocks[i % len(fallback_blocks)]
                custom_sections.append(s['component_id'])
            custom_title = request.blueprint.get('title')
            suggestion = json.dumps(request.blueprint)
        else:
            suggestion = await gemini_service.suggest_template(
                request.description, dataset_info
            )
            # Parse the suggestion to extract blueprint
            for line in suggestion.split('\n'):
                line = line.strip()
                if line.startswith('SECTIONS:'):
                    sections_raw = line.replace('SECTIONS:', '').strip()
                    custom_sections = [s.strip().lower() for s in sections_raw.split(',') if s.strip()]
                elif line.startswith('CUSTOM_TITLE:'):
                    custom_title = line.replace('CUSTOM_TITLE:', '').strip()

        # Fallback if AI fails to return proper sections
        template_id = 'custom' if custom_sections else 'data_science'

        # Generate report with suggested blueprint
        ai_insights = None
        if request.use_ai and dataset_info:
            try:
                ai_insights = await gemini_service.generate_report_insights(
                    dataset_info, template_id
                )
            except Exception:
                pass

        kwargs = {
            'session_id': request.session_id,
            'template_id': template_id,
            'custom_title': custom_title,
            'ai_insights': ai_insights,
        }
        if template_id == 'custom':
            kwargs['custom_sections'] = custom_sections

        report = report_engine.generate(**kwargs)

        # If we have a structured blueprint, assign the user-approved UI names to the generated sections directly!
        if request.blueprint and report.get('sections'):
            bp_sections = request.blueprint.get('sections', [])
            report_sections = report.get('sections', [])
            # Some sections might fail to generate if there's no data, so we map component by component
            bp_map = {}
            for bps in bp_sections:
                cid = bps.get('component_id')
                if cid:
                    bp_map.setdefault(cid, []).append(bps)
            
            for rs in report_sections:
                sid = rs.get('id')
                if sid in bp_map and len(bp_map[sid]) > 0:
                    bp_match = bp_map[sid].pop(0)
                    if bp_match.get('name'):
                        rs['title'] = bp_match['name']
                    if bp_match.get('description') and 'description' not in rs:
                        rs['description'] = bp_match['description']

        _save_report(report['report_id'], report)

        return {
            **report,
            'ai_suggestion': suggestion,
        }

    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Custom report failed: {str(e)}")


@router.post("/refine")
async def refine_report(request: RefineReportRequest):
    """Get AI suggestions for refining a report."""
    report = _load_report(request.report_id)
    if not report:
        raise HTTPException(status_code=404, detail="Report not found")

    try:
        # Build summary of current report
        section_names = [s.get('title', '') for s in report.get('sections', [])]
        summary = (
            f"Template: {report.get('template_name', 'Unknown')}\n"
            f"Sections: {', '.join(section_names)}\n"
            f"Dataset: {report.get('filename', 'Unknown')}"
        )

        suggestions = await gemini_service.refine_report(summary, request.feedback)
        return {"suggestions": suggestions, "report_id": request.report_id}

    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Refinement failed: {str(e)}")


@router.post("/suggest")
async def suggest_report_sections(request: SuggestReportRequest):
    """AI-powered report suggestions based on natural language description."""
    try:
        # Get dataset context
        dataset_info = None
        try:
            dataset_info = context_builder.build_dataset_context(request.session_id)
        except Exception:
            pass

        prompt = f"""**ROLE**: You are an expert Data Report Consultant. The user has uploaded a dataset and wants to create a report. Based on their description, suggest the perfect report structure.

**DATASET CONTEXT**:
{f"Filename: {dataset_info.get('filename', 'Unknown')}, Rows: {dataset_info.get('rows', '?')}, Columns: {dataset_info.get('columns', '?')}" if dataset_info else "No dataset info available."}
{f"Column names: {', '.join(dataset_info.get('column_names', [])[:20])}" if dataset_info and dataset_info.get('column_names') else ""}

**USER'S REQUEST**: "{request.description}"

**AVAILABLE BUILDING BLOCKS**:
cover, dataset_overview, kpi_cards, data_quality_score, null_analysis, distribution_summary, correlation_analysis, outlier_analysis, cleaning_log, model_comparison, feature_importance, key_insights, recommendations, abstract, introduction, methodology, results_discussion, conclusion, references

**INSTRUCTIONS**: Return a JSON object (and nothing else, no markdown fences) with this exact structure:
{{
    "agent_reply": "A friendly, conversational response summarizing what you have decided to build based on their request (e.g. 'I will put together a feature importance report focusing on your requirements.')",
    "title": "A professional report title based on the user's request",
    "sections": [
        {{
            "name": "Section name",
            "description": "What this section should contain (1-2 sentences)",
            "icon": "one of: analytics, science, school, dashboard, model_training, summarize, insights, bar_chart, table_chart, psychology",
            "component_id": "exact name of ONE of the available building blocks listed above that best matches this section"
        }}
    ],
    "tips": ["Tip 1 for making the report effective", "Tip 2", "Tip 3"],
    "tone": "academic|business|technical|casual"
}}

IMPORTANT RULES:
- Suggest 4-8 sections that are DIRECTLY relevant to what the user asked for
- Make section names specific to their topic, NOT generic (e.g. "Customer Segmentation Results" not "Results")
- Each tip should be actionable and specific to their use case
- If they mention PBL/college/academic, include abstract, methodology, results, conclusion
- If they mention business, include executive summary, KPIs, recommendations
- Return ONLY valid JSON, no explanations or markdown"""

        suggestion_text = await gemini_service.chat(prompt)

        # Try to parse as JSON
        import json
        try:
            # Clean potential markdown fences
            cleaned = suggestion_text.strip()
            if cleaned.startswith('```'):
                cleaned = cleaned.split('\n', 1)[1] if '\n' in cleaned else cleaned[3:]
            if cleaned.endswith('```'):
                cleaned = cleaned[:-3]
            cleaned = cleaned.strip()
            if cleaned.startswith('json'):
                cleaned = cleaned[4:].strip()

            suggestion = json.loads(cleaned)
        except json.JSONDecodeError:
            # Fallback structure
            suggestion = {
                "agent_reply": "I couldn't generate a highly customized report right now, but I have prepared a standard Data Science report layout for you instead.",
                "title": "Analysis Report",
                "sections": [
                    {"name": "Introduction", "description": "Overview of the analysis objectives", "icon": "summarize"},
                    {"name": "Data Overview", "description": "Summary of the dataset characteristics", "icon": "table_chart"},
                    {"name": "Key Findings", "description": "Main insights from the analysis", "icon": "insights"},
                    {"name": "Conclusion", "description": "Summary and recommendations", "icon": "psychology"},
                ],
                "tips": [
                    "Include visualizations to support your findings",
                    "Add context about data collection methodology",
                    "Summarize actionable next steps"
                ],
                "tone": "technical",
                "raw": suggestion_text,
            }

        return suggestion

    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Suggestion failed: {str(e)}")


@router.get("/download/{report_id}/{format}")
async def download_report(report_id: str, format: str):
    """Download a generated report in the specified format (pdf, md, pptx)."""
    report = _load_report(report_id)
    if not report:
        raise HTTPException(status_code=404, detail="Report not found. Generate it first.")

    filename_base = report.get('filename', 'report').replace('.csv', '').replace('.xlsx', '')
    title_slug = report.get('template_name', 'Report').replace(' ', '_')

    try:
        if format == 'pdf':
            content = export_pdf(report)
            return Response(
                content=bytes(content),
                media_type='application/pdf',
                headers={'Content-Disposition': f'attachment; filename="{filename_base}_{title_slug}.pdf"'}
            )
        elif format == 'md':
            content = export_markdown(report)
            return Response(
                content=content.encode('utf-8'),
                media_type='text/markdown',
                headers={'Content-Disposition': f'attachment; filename="{filename_base}_{title_slug}.md"'}
            )
        elif format == 'pptx':
            content = export_pptx(report)
            return Response(
                content=content,
                media_type='application/vnd.openxmlformats-officedocument.presentationml.presentation',
                headers={'Content-Disposition': f'attachment; filename="{filename_base}_{title_slug}.pptx"'}
            )
        else:
            raise HTTPException(status_code=400, detail="Invalid format")

    except Exception as e:
        import traceback
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=f"Export failed: {str(e)}")
