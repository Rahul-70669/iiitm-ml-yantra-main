import asyncio
from app.services.gemini_service import gemini_service

async def test():
    prompt = '''**ROLE**: You are an expert Data Report Consultant. The user has uploaded a dataset and wants to create a report. Based on their description, suggest the perfect report structure.

**DATASET CONTEXT**:
Filename: Unknown, Rows: ?, Columns: ?
Column names: 

**USER'S REQUEST**: "I want a report of feature importance graph of this dataset"

**AVAILABLE BUILDING BLOCKS**:
cover, dataset_overview, kpi_cards, data_quality_score, null_analysis, distribution_summary, correlation_analysis, outlier_analysis, cleaning_log, model_comparison, feature_importance, key_insights, recommendations, abstract, introduction, methodology, results_discussion, conclusion, references

**INSTRUCTIONS**: Return a JSON object (and nothing else, no markdown fences) with this exact structure:
{
    "title": "A professional report title based on the user's request",
    "sections": [
        {
            "name": "Section name",
            "description": "What this section should contain (1-2 sentences)",
            "icon": "one of: analytics, science, school, dashboard, model_training, summarize, insights, bar_chart, table_chart, psychology",
            "component_id": "exact name of ONE of the available building blocks listed above that best matches this section"
        }
    ],
    "tips": ["Tip 1 for making the report effective", "Tip 2", "Tip 3"],
    "tone": "academic|business|technical|casual"
}

IMPORTANT RULES:
- Suggest 4-8 sections that are DIRECTLY relevant to what the user asked for
- Make section names specific to their topic, NOT generic (e.g. "Customer Segmentation Results" not "Results")
- Each tip should be actionable and specific to their use case
- Return ONLY valid JSON, no explanations or markdown'''
    try:
        res = await gemini_service.chat(prompt)
        print("--- RESULT ---")
        print(res)
    except Exception as e:
        print("ERROR:", e)

if __name__ == '__main__':
    asyncio.run(test())
