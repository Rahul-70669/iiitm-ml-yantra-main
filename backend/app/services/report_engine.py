"""
Report Engine
Core engine for generating structured analytical reports from dataset sessions.
Supports 6 templates, rule-based + AI-enhanced content, matplotlib charts.
"""

import numpy as np
import pandas as pd
import uuid
import io
import base64
import time
from typing import Dict, List, Any, Optional
from datetime import datetime

import matplotlib
matplotlib.use('Agg')  # Non-interactive backend
import matplotlib.pyplot as plt
import matplotlib.ticker as mticker

from app.services.dataset_manager import dataset_manager

# ═══════════════════════ CONSTANTS ═══════════════════════

BRAND_COLOR = '#ab3505'
BRAND_SECONDARY = '#d4583b'
BRAND_ACCENT = '#9f3a60'
CHART_PALETTE = ['#ab3505', '#d4583b', '#e87c5f', '#f0a58e', '#9f3a60', '#c75b85', '#3b82f6', '#10b981']

TEMPLATES = {
    'executive_summary': {
        'name': 'Executive Summary',
        'description': 'A concise 1-page business overview with KPIs, data quality score, and top insights.',
        'icon': 'summarize',
        'sections': ['cover', 'dataset_overview', 'data_quality_score', 'key_insights', 'recommendations'],
        'use_case': 'Stakeholder presentations, quick management briefs',
    },
    'data_science': {
        'name': 'Data Science Report',
        'description': 'Comprehensive DS report with EDA findings, cleaning log, model comparison, and recommendations.',
        'icon': 'science',
        'sections': ['cover', 'dataset_overview', 'null_analysis', 'distribution_summary',
                     'correlation_analysis', 'outlier_analysis', 'cleaning_log',
                     'model_comparison', 'feature_importance', 'key_insights', 'recommendations'],
        'use_case': 'Data science teams, technical documentation',
    },
    'academic_pbl': {
        'name': 'Academic / PBL Report',
        'description': 'Formal academic report with Title, Abstract, Methodology, Results, and Conclusion.',
        'icon': 'school',
        'sections': ['cover', 'abstract', 'introduction', 'methodology',
                     'dataset_overview', 'distribution_summary', 'correlation_analysis',
                     'model_comparison', 'results_discussion', 'conclusion', 'references'],
        'use_case': 'College projects, PBL submissions, research papers',
    },
    'power_bi': {
        'name': 'Power BI Style Dashboard',
        'description': 'Dashboard-style report with metric cards, chart grids, and trend analysis.',
        'icon': 'dashboard',
        'sections': ['cover', 'kpi_cards', 'dataset_overview', 'distribution_summary',
                     'correlation_analysis', 'outlier_analysis', 'model_comparison',
                     'feature_importance', 'key_insights'],
        'use_case': 'Business intelligence, executive dashboards',
    },
    'eda_focused': {
        'name': 'EDA Focused Report',
        'description': 'Pure exploratory data analysis — distributions, correlations, outliers, patterns.',
        'icon': 'analytics',
        'sections': ['cover', 'dataset_overview', 'data_quality_score', 'null_analysis',
                     'distribution_summary', 'correlation_analysis', 'outlier_analysis',
                     'key_insights', 'recommendations'],
        'use_case': 'Initial data exploration, audit reports',
    },
    'model_evaluation': {
        'name': 'Model Evaluation Report',
        'description': 'Model-centric report with training config, metrics tables, confusion matrices, and feature importance.',
        'icon': 'model_training',
        'sections': ['cover', 'dataset_overview', 'model_comparison',
                     'feature_importance', 'results_discussion', 'recommendations'],
        'use_case': 'ML model audits, performance benchmarking',
    },
}


# ═══════════════════════ CHART GENERATOR ═══════════════════════

class ChartGenerator:
    """Generates matplotlib charts as base64 PNG strings for embedding in reports."""

    @staticmethod
    def _fig_to_base64(fig) -> str:
        buf = io.BytesIO()
        fig.savefig(buf, format='png', dpi=150, bbox_inches='tight',
                    facecolor='white', edgecolor='none')
        plt.close(fig)
        buf.seek(0)
        return base64.b64encode(buf.read()).decode('utf-8')

    @staticmethod
    def histogram(series: pd.Series, title: str) -> str:
        fig, ax = plt.subplots(figsize=(6, 3.5))
        clean = series.dropna()
        n_bins = min(30, max(10, len(clean.unique())))
        ax.hist(clean, bins=n_bins, color=BRAND_COLOR, alpha=0.85, edgecolor='white', linewidth=0.5)
        ax.axvline(clean.mean(), color=BRAND_ACCENT, linestyle='--', linewidth=1.2, label=f'Mean: {clean.mean():.2f}')
        ax.axvline(clean.median(), color='#3b82f6', linestyle='--', linewidth=1.2, label=f'Median: {clean.median():.2f}')
        ax.set_title(title, fontsize=11, fontweight='bold', pad=8)
        ax.legend(fontsize=7)
        ax.spines[['top', 'right']].set_visible(False)
        ax.tick_params(labelsize=8)
        return ChartGenerator._fig_to_base64(fig)

    @staticmethod
    def correlation_heatmap(df: pd.DataFrame) -> str:
        numeric = df.select_dtypes(include=[np.number])
        if numeric.shape[1] < 2:
            return ''
        corr = numeric.corr()
        n = len(corr)
        fig_size = max(5, min(10, n * 0.6))
        fig, ax = plt.subplots(figsize=(fig_size, fig_size * 0.85))
        im = ax.imshow(corr.values, cmap='RdBu_r', vmin=-1, vmax=1, aspect='auto')
        ax.set_xticks(range(n))
        ax.set_yticks(range(n))
        labels = [c[:12] for c in corr.columns]
        ax.set_xticklabels(labels, rotation=45, ha='right', fontsize=7)
        ax.set_yticklabels(labels, fontsize=7)
        if n <= 12:
            for i in range(n):
                for j in range(n):
                    val = corr.values[i, j]
                    color = 'white' if abs(val) > 0.5 else 'black'
                    ax.text(j, i, f'{val:.2f}', ha='center', va='center', fontsize=6, color=color)
        fig.colorbar(im, ax=ax, fraction=0.046, pad=0.04)
        ax.set_title('Correlation Heatmap', fontsize=11, fontweight='bold', pad=10)
        return ChartGenerator._fig_to_base64(fig)

    @staticmethod
    def box_plot(df: pd.DataFrame, columns: List[str], title: str = 'Box Plots') -> str:
        cols = [c for c in columns if c in df.columns][:8]
        if not cols:
            return ''
        fig, ax = plt.subplots(figsize=(max(5, len(cols) * 1.2), 4))
        bp = ax.boxplot([df[c].dropna() for c in cols], labels=[c[:12] for c in cols],
                        patch_artist=True, showfliers=True)
        for i, patch in enumerate(bp['boxes']):
            patch.set_facecolor(CHART_PALETTE[i % len(CHART_PALETTE)])
            patch.set_alpha(0.7)
        ax.set_title(title, fontsize=11, fontweight='bold', pad=8)
        ax.tick_params(axis='x', rotation=30, labelsize=8)
        ax.tick_params(axis='y', labelsize=8)
        ax.spines[['top', 'right']].set_visible(False)
        return ChartGenerator._fig_to_base64(fig)

    @staticmethod
    def bar_chart(labels: List[str], values: List[float], title: str,
                  xlabel: str = '', ylabel: str = '', horizontal: bool = False) -> str:
        fig, ax = plt.subplots(figsize=(6, max(3.5, len(labels) * 0.35) if horizontal else 3.5))
        colors = [CHART_PALETTE[i % len(CHART_PALETTE)] for i in range(len(labels))]
        if horizontal:
            ax.barh(labels, values, color=colors, edgecolor='white', linewidth=0.5)
            if xlabel:
                ax.set_xlabel(xlabel, fontsize=9)
        else:
            ax.bar(labels, values, color=colors, edgecolor='white', linewidth=0.5)
            if ylabel:
                ax.set_ylabel(ylabel, fontsize=9)
            ax.tick_params(axis='x', rotation=30, labelsize=8)
        ax.set_title(title, fontsize=11, fontweight='bold', pad=8)
        ax.spines[['top', 'right']].set_visible(False)
        ax.tick_params(labelsize=8)
        return ChartGenerator._fig_to_base64(fig)

    @staticmethod
    def scatter_plot(x: pd.Series, y: pd.Series, title: str) -> str:
        fig, ax = plt.subplots(figsize=(5, 4))
        sample = min(500, len(x))
        idx = np.random.choice(len(x), sample, replace=False) if len(x) > sample else range(len(x))
        ax.scatter(x.iloc[idx], y.iloc[idx], c=BRAND_COLOR, alpha=0.5, s=15, edgecolors='none')
        ax.set_xlabel(x.name, fontsize=9)
        ax.set_ylabel(y.name, fontsize=9)
        ax.set_title(title, fontsize=11, fontweight='bold', pad=8)
        ax.spines[['top', 'right']].set_visible(False)
        ax.tick_params(labelsize=8)
        return ChartGenerator._fig_to_base64(fig)

    @staticmethod
    def model_comparison(models: List[Dict], metric_key: str, metric_label: str) -> str:
        names = [m['name'][:15] for m in models]
        values = [m['metrics'].get(metric_key, 0) or 0 for m in models]
        best_idx = values.index(max(values))
        colors = [BRAND_COLOR if i == best_idx else '#cbd5e1' for i in range(len(names))]
        fig, ax = plt.subplots(figsize=(6, 3.5))
        bars = ax.bar(names, values, color=colors, edgecolor='white', linewidth=0.5)
        for bar, val in zip(bars, values):
            ax.text(bar.get_x() + bar.get_width()/2, bar.get_height() + 0.005,
                    f'{val:.4f}', ha='center', va='bottom', fontsize=7, fontweight='bold')
        ax.set_ylabel(metric_label, fontsize=9)
        ax.set_title(f'Model Comparison — {metric_label}', fontsize=11, fontweight='bold', pad=8)
        ax.spines[['top', 'right']].set_visible(False)
        ax.tick_params(axis='x', rotation=20, labelsize=8)
        ax.tick_params(axis='y', labelsize=8)
        return ChartGenerator._fig_to_base64(fig)

    @staticmethod
    def null_heatmap(null_counts: Dict[str, int], total_rows: int) -> str:
        cols_with_nulls = {k: v for k, v in null_counts.items() if v > 0}
        if not cols_with_nulls:
            return ''
        sorted_items = sorted(cols_with_nulls.items(), key=lambda x: x[1], reverse=True)[:15]
        labels = [k[:15] for k, v in sorted_items]
        pcts = [v / total_rows * 100 for k, v in sorted_items]
        fig, ax = plt.subplots(figsize=(6, max(3, len(labels) * 0.35)))
        bars = ax.barh(labels[::-1], pcts[::-1], color=BRAND_COLOR, alpha=0.8, edgecolor='white')
        for bar, pct in zip(bars, pcts[::-1]):
            ax.text(bar.get_width() + 0.5, bar.get_y() + bar.get_height()/2,
                    f'{pct:.1f}%', va='center', fontsize=7)
        ax.set_xlabel('Null %', fontsize=9)
        ax.set_title('Null Value Distribution', fontsize=11, fontweight='bold', pad=8)
        ax.spines[['top', 'right']].set_visible(False)
        ax.tick_params(labelsize=8)
        return ChartGenerator._fig_to_base64(fig)


# ═══════════════════════ REPORT ENGINE ═══════════════════════

class ReportEngine:
    """Generates structured report data from dataset sessions."""

    def __init__(self):
        self.charts = ChartGenerator()

    def get_templates(self) -> List[Dict]:
        return [{'id': k, **v} for k, v in TEMPLATES.items()]

    def generate(self, session_id: str, template_id: str,
                 autopilot_data: Optional[Dict] = None,
                 custom_title: Optional[str] = None,
                 ai_insights: Optional[str] = None,
                 custom_sections: Optional[List[str]] = None) -> Dict[str, Any]:
        """Generate a complete report."""
        if template_id == 'custom':
            if not custom_sections:
                raise ValueError("custom_sections must be provided when using custom template.")
            template = {
                'name': 'Custom Report',
                'description': 'AI-generated custom layout tailored to the user request.',
                'sections': custom_sections
            }
        else:
            template = TEMPLATES.get(template_id)
            if not template:
                raise ValueError(f"Unknown template: {template_id}")

        # Load dataset
        df = dataset_manager.get_dataset(session_id)
        stats = dataset_manager.get_statistics(session_id)
        filename = dataset_manager.get_filename(session_id)

        # Build context
        context = {
            'df': df,
            'stats': stats,
            'filename': filename,
            'template': template,
            'template_id': template_id,
            'autopilot': autopilot_data,
            'ai_insights': ai_insights,
            'generated_at': datetime.now().isoformat(),
        }

        # Generate sections
        sections = []
        for section_id in template['sections']:
            generator = getattr(self, f'_section_{section_id}', None)
            if generator:
                try:
                    section = generator(context)
                    if section:
                        sections.append(section)
                except Exception as e:
                    print(f"[ReportEngine] Error generating section '{section_id}': {e}")

        report_id = str(uuid.uuid4())
        title = custom_title or f"{template['name']} — {filename}"

        return {
            'report_id': report_id,
            'title': title,
            'template_id': template_id,
            'template_name': template['name'],
            'filename': filename,
            'generated_at': context['generated_at'],
            'sections': sections,
        }

    # ═══════════════ SECTION GENERATORS ═══════════════

    def _section_cover(self, ctx: Dict) -> Dict:
        return {
            'id': 'cover',
            'type': 'cover',
            'title': ctx.get('custom_title') or f"{ctx['template']['name']}",
            'subtitle': f"Dataset: {ctx['filename']}",
            'meta': f"Generated by ML Yantra · {datetime.now().strftime('%B %d, %Y at %I:%M %p')}",
        }

    def _section_dataset_overview(self, ctx: Dict) -> Dict:
        df = ctx['df']
        stats = ctx['stats']
        numeric_cols = df.select_dtypes(include=[np.number]).columns.tolist()
        cat_cols = df.select_dtypes(include=['object', 'category']).columns.tolist()
        total_nulls = int(df.isnull().sum().sum())
        total_cells = df.shape[0] * df.shape[1]
        completeness = round((1 - total_nulls / total_cells) * 100, 1) if total_cells > 0 else 100

        return {
            'id': 'dataset_overview',
            'type': 'stats_grid',
            'title': 'Dataset Overview',
            'metrics': [
                {'label': 'Rows', 'value': f"{df.shape[0]:,}"},
                {'label': 'Columns', 'value': str(df.shape[1])},
                {'label': 'Numeric', 'value': str(len(numeric_cols))},
                {'label': 'Categorical', 'value': str(len(cat_cols))},
                {'label': 'Total Nulls', 'value': f"{total_nulls:,}"},
                {'label': 'Duplicates', 'value': f"{stats.get('duplicate_rows', 0):,}"},
                {'label': 'Completeness', 'value': f"{completeness}%"},
                {'label': 'Memory', 'value': f"{df.memory_usage(deep=True).sum() / 1024 / 1024:.1f} MB"},
            ],
            'columns_table': [
                {'name': col, 'dtype': str(df[col].dtype),
                 'nulls': int(df[col].isnull().sum()),
                 'unique': int(df[col].nunique())}
                for col in df.columns[:30]
            ],
        }

    def _section_data_quality_score(self, ctx: Dict) -> Dict:
        df = ctx['df']
        total_cells = df.shape[0] * df.shape[1]
        null_pct = df.isnull().sum().sum() / total_cells if total_cells > 0 else 0
        dup_pct = df.duplicated().sum() / len(df) if len(df) > 0 else 0
        # Score: 100 - penalties
        score = max(0, round(100 - (null_pct * 50) - (dup_pct * 30), 1))
        grade = 'A' if score >= 90 else 'B' if score >= 75 else 'C' if score >= 60 else 'D' if score >= 40 else 'F'
        return {
            'id': 'data_quality_score',
            'type': 'quality_score',
            'title': 'Data Quality Score',
            'score': score,
            'grade': grade,
            'breakdown': [
                {'label': 'Completeness', 'value': round((1 - null_pct) * 100, 1), 'max': 100},
                {'label': 'Uniqueness', 'value': round((1 - dup_pct) * 100, 1), 'max': 100},
            ]
        }

    def _section_null_analysis(self, ctx: Dict) -> Dict:
        df = ctx['df']
        null_counts = {col: int(df[col].isnull().sum()) for col in df.columns}
        total_nulls = sum(null_counts.values())
        chart = self.charts.null_heatmap(null_counts, len(df))
        cols_with_nulls = {k: v for k, v in null_counts.items() if v > 0}
        return {
            'id': 'null_analysis',
            'type': 'analysis',
            'title': 'Null Value Analysis',
            'text': f"The dataset has **{total_nulls:,}** null values across **{len(cols_with_nulls)}** columns."
                    if total_nulls > 0 else "The dataset has no missing values — excellent data quality!",
            'chart': chart,
            'table': [{'column': k, 'nulls': v, 'pct': f"{v/len(df)*100:.1f}%"}
                      for k, v in sorted(cols_with_nulls.items(), key=lambda x: x[1], reverse=True)[:15]]
        }

    def _section_distribution_summary(self, ctx: Dict) -> Dict:
        df = ctx['df']
        numeric_cols = df.select_dtypes(include=[np.number]).columns.tolist()[:6]
        charts = []
        stats_table = []
        for col in numeric_cols:
            chart = self.charts.histogram(df[col], f'Distribution of {col}')
            charts.append({'title': col, 'chart': chart})
            s = df[col].dropna()
            if len(s) > 0:
                stats_table.append({
                    'column': col,
                    'mean': f"{s.mean():.4f}",
                    'median': f"{s.median():.4f}",
                    'std': f"{s.std():.4f}" if len(s) > 1 else "N/A",
                    'skewness': f"{s.skew():.2f}" if len(s) > 2 else "N/A",
                    'min': f"{s.min():.4f}",
                    'max': f"{s.max():.4f}",
                })
        return {
            'id': 'distribution_summary',
            'type': 'charts_grid',
            'title': 'Distribution Analysis',
            'charts': charts,
            'stats_table': stats_table,
        }

    def _section_correlation_analysis(self, ctx: Dict) -> Dict:
        df = ctx['df']
        numeric = df.select_dtypes(include=[np.number])
        if numeric.shape[1] < 2:
            return None
        chart = self.charts.correlation_heatmap(df)
        # Find top correlations
        corr = numeric.corr()
        pairs = []
        for i in range(len(corr.columns)):
            for j in range(i+1, len(corr.columns)):
                pairs.append({
                    'col1': corr.columns[i],
                    'col2': corr.columns[j],
                    'value': round(float(corr.iloc[i, j]), 4)
                })
        pairs.sort(key=lambda x: abs(x['value']), reverse=True)
        return {
            'id': 'correlation_analysis',
            'type': 'analysis',
            'title': 'Correlation Analysis',
            'chart': chart,
            'text': f"Analyzed correlations across {numeric.shape[1]} numeric features.",
            'top_correlations': pairs[:10],
        }

    def _section_outlier_analysis(self, ctx: Dict) -> Dict:
        df = ctx['df']
        numeric_cols = df.select_dtypes(include=[np.number]).columns.tolist()[:8]
        if not numeric_cols:
            return None
        chart = self.charts.box_plot(df, numeric_cols)
        outlier_summary = []
        for col in numeric_cols:
            s = df[col].dropna()
            if len(s) < 10:
                continue
            q1, q3 = s.quantile(0.25), s.quantile(0.75)
            iqr = q3 - q1
            if iqr == 0:
                continue
            lower, upper = q1 - 1.5 * iqr, q3 + 1.5 * iqr
            n_outliers = int(((s < lower) | (s > upper)).sum())
            if n_outliers > 0:
                outlier_summary.append({
                    'column': col, 'outliers': n_outliers,
                    'pct': f"{n_outliers/len(s)*100:.1f}%",
                    'range': f"[{lower:.2f}, {upper:.2f}]"
                })
        return {
            'id': 'outlier_analysis',
            'type': 'analysis',
            'title': 'Outlier Analysis',
            'chart': chart,
            'text': f"Detected outliers in {len(outlier_summary)} columns using IQR method (1.5× IQR).",
            'table': outlier_summary,
        }

    def _section_cleaning_log(self, ctx: Dict) -> Dict:
        ap = ctx.get('autopilot')
        if not ap:
            return None
        log = ap.get('pipeline_log', [])
        clean_steps = [s for s in log if s.get('category') in ('clean', 'encode')]
        if not clean_steps:
            return None
        return {
            'id': 'cleaning_log',
            'type': 'log',
            'title': 'Data Cleaning Log',
            'text': f"AutoPilot performed **{len(clean_steps)}** cleaning operations.",
            'steps': [{'step': s['description'], 'category': s['category'],
                       'duration': s.get('duration_ms', 0)} for s in clean_steps],
        }

    def _section_model_comparison(self, ctx: Dict) -> Dict:
        ap = ctx.get('autopilot')
        if not ap or 'training_results' not in ap:
            return None
        tr = ap['training_results']
        models = tr.get('models', [])
        if not models:
            return None
        problem_type = tr.get('problemType', 'classification')
        if problem_type == 'classification':
            metric_key, metric_label = 'accuracy', 'Accuracy'
        else:
            metric_key, metric_label = 'r2Score', 'R² Score'
        chart = self.charts.model_comparison(models, metric_key, metric_label)
        return {
            'id': 'model_comparison',
            'type': 'model_table',
            'title': 'Model Comparison',
            'chart': chart,
            'problem_type': problem_type,
            'best_model': ap.get('best_model_name', 'N/A'),
            'models': [{
                'name': m['name'],
                'metrics': m['metrics'],
                'training_time': m.get('trainingTime', 0),
                'is_best': m.get('isBest', False),
            } for m in models],
        }

    def _section_feature_importance(self, ctx: Dict) -> Dict:
        ap = ctx.get('autopilot')
        if not ap:
            return None
        fi = ap.get('feature_importance')
        if not fi:
            return None
        sorted_fi = sorted(fi.items(), key=lambda x: x[1], reverse=True)[:15]
        labels = [k[:20] for k, v in sorted_fi]
        values = [round(v * 100, 2) for k, v in sorted_fi]
        chart = self.charts.bar_chart(labels, values, 'Feature Importance (%)',
                                      xlabel='Importance %', horizontal=True)
        return {
            'id': 'feature_importance',
            'type': 'analysis',
            'title': 'Feature Importance',
            'chart': chart,
            'text': f"Top feature: **{labels[0]}** ({values[0]:.1f}%)" if labels else "",
            'table': [{'feature': k, 'importance': f"{v:.2f}%"} for k, v in zip(labels, values)],
        }

    def _section_key_insights(self, ctx: Dict) -> Dict:
        df = ctx['df']
        ai_text = ctx.get('ai_insights')
        insights = []
        # Rule-based insights
        total_nulls = int(df.isnull().sum().sum())
        total_cells = df.shape[0] * df.shape[1]
        if total_nulls > 0:
            pct = total_nulls / total_cells * 100
            insights.append(f"Dataset has {total_nulls:,} missing values ({pct:.1f}% of all cells).")
        else:
            insights.append("Dataset has zero missing values — excellent data completeness.")
        dups = int(df.duplicated().sum())
        if dups > 0:
            insights.append(f"{dups:,} duplicate rows detected ({dups/len(df)*100:.1f}%).")
        numeric = df.select_dtypes(include=[np.number])
        if numeric.shape[1] >= 2:
            corr = numeric.corr()
            max_corr = 0
            pair = ('', '')
            for i in range(len(corr.columns)):
                for j in range(i+1, len(corr.columns)):
                    if abs(corr.iloc[i, j]) > abs(max_corr):
                        max_corr = corr.iloc[i, j]
                        pair = (corr.columns[i], corr.columns[j])
            if abs(max_corr) > 0.5:
                insights.append(f"Strongest correlation: **{pair[0]}** ↔ **{pair[1]}** (r={max_corr:.3f}).")
        # AutoPilot insights
        ap = ctx.get('autopilot')
        if ap:
            best = ap.get('best_model_name', '')
            best_metrics = ap.get('best_metrics', {})
            if best:
                primary = best_metrics.get('accuracy') or best_metrics.get('r2Score')
                if primary is not None:
                    insights.append(f"Best performing model: **{best}** with {'accuracy' if 'accuracy' in best_metrics else 'R²'} of **{primary:.4f}**.")
        return {
            'id': 'key_insights',
            'type': 'insights',
            'title': 'Key Insights',
            'insights': insights,
            'ai_insights': ai_text,
        }

    def _section_recommendations(self, ctx: Dict) -> Dict:
        df = ctx['df']
        recs = []
        total_nulls = int(df.isnull().sum().sum())
        if total_nulls > 0:
            recs.append("Handle missing values using imputation (median for skewed, mean for normal distributions) or removal.")
        if df.duplicated().sum() > 0:
            recs.append("Remove duplicate rows to prevent data leakage and model bias.")
        cat_cols = df.select_dtypes(include=['object']).columns
        high_card = [c for c in cat_cols if df[c].nunique() > 50]
        if high_card:
            recs.append(f"Consider dropping or encoding high-cardinality columns: {', '.join(high_card[:3])}.")
        numeric = df.select_dtypes(include=[np.number]).columns
        if len(numeric) > 15:
            recs.append("Consider dimensionality reduction (PCA) or feature selection for the large feature space.")
        if len(df) < 100:
            recs.append("Dataset is small. Consider data augmentation or simpler models to avoid overfitting.")
        if not recs:
            recs.append("Dataset looks good. Proceed with model training and evaluation.")
        return {
            'id': 'recommendations',
            'type': 'list',
            'title': 'Recommendations',
            'items': recs,
        }

    # ─── Academic template sections ───

    def _section_abstract(self, ctx: Dict) -> Dict:
        df = ctx['df']
        ai = ctx.get('ai_insights')
        text = ai if ai else (
            f"This report presents an analytical study of the dataset '{ctx['filename']}' "
            f"comprising {len(df):,} observations across {len(df.columns)} features. "
            f"The analysis includes exploratory data analysis, data quality assessment, "
            f"and machine learning model evaluation to derive actionable insights."
        )
        return {'id': 'abstract', 'type': 'text', 'title': 'Abstract', 'text': text}

    def _section_introduction(self, ctx: Dict) -> Dict:
        df = ctx['df']
        return {
            'id': 'introduction', 'type': 'text', 'title': 'Introduction',
            'text': (
                f"The objective of this study is to analyze the dataset '{ctx['filename']}' "
                f"and build predictive models. The dataset contains {len(df):,} samples with "
                f"{len(df.columns)} attributes, including "
                f"{len(df.select_dtypes(include=[np.number]).columns)} numeric and "
                f"{len(df.select_dtypes(include=['object']).columns)} categorical features. "
                f"This report follows a structured methodology: data exploration, preprocessing, "
                f"model training, and results evaluation."
            )
        }

    def _section_methodology(self, ctx: Dict) -> Dict:
        steps = [
            "**Data Collection**: Dataset loaded and inspected for structure and quality.",
            "**Data Preprocessing**: Handling of missing values, duplicate removal, outlier treatment, and categorical encoding.",
            "**Exploratory Data Analysis**: Statistical analysis, distribution plots, correlation analysis, and outlier detection.",
            "**Feature Engineering**: Feature selection and transformation for model readiness.",
        ]
        ap = ctx.get('autopilot')
        if ap:
            steps.append("**Model Training**: Multiple algorithms trained with heuristic-tuned hyperparameters.")
            steps.append("**Model Evaluation**: Models compared on standard metrics; best model selected.")
        return {
            'id': 'methodology', 'type': 'ordered_list',
            'title': 'Methodology', 'items': steps,
        }

    def _section_results_discussion(self, ctx: Dict) -> Dict:
        ap = ctx.get('autopilot')
        if not ap:
            return {
                'id': 'results_discussion', 'type': 'text',
                'title': 'Results & Discussion',
                'text': "No model training results available. Run AutoPilot to generate training data for this section."
            }
        best = ap.get('best_model_name', 'N/A')
        metrics = ap.get('best_metrics', {})
        lines = [f"The best performing model was **{best}**."]
        for k, v in metrics.items():
            if v is not None:
                lines.append(f"- **{k}**: {v:.4f}")
        return {
            'id': 'results_discussion', 'type': 'text',
            'title': 'Results & Discussion',
            'text': '\n'.join(lines),
        }

    def _section_conclusion(self, ctx: Dict) -> Dict:
        return {
            'id': 'conclusion', 'type': 'text',
            'title': 'Conclusion',
            'text': (
                f"This study analyzed the '{ctx['filename']}' dataset through comprehensive EDA "
                f"and machine learning modeling. The findings provide actionable insights for further "
                f"research and practical applications. Future work could include deeper feature engineering, "
                f"hyperparameter optimization via grid/random search, and ensemble methods."
            )
        }

    def _section_references(self, ctx: Dict) -> Dict:
        return {
            'id': 'references', 'type': 'list',
            'title': 'References',
            'items': [
                "Scikit-learn: Machine Learning in Python, Pedregosa et al., JMLR 12 (2011).",
                "Pandas: Data Structures for Statistical Computing in Python, McKinney, SciPy 2010.",
                "XGBoost: A Scalable Tree Boosting System, Chen & Guestrin, KDD 2016.",
                "ML Yantra — Automated Machine Learning Platform, 2026.",
            ]
        }

    def _section_kpi_cards(self, ctx: Dict) -> Dict:
        df = ctx['df']
        ap = ctx.get('autopilot')
        cards = [
            {'label': 'Total Records', 'value': f"{len(df):,}", 'icon': 'database'},
            {'label': 'Features', 'value': str(len(df.columns)), 'icon': 'view_column'},
            {'label': 'Data Quality', 'value': f"{max(0, round(100 - df.isnull().sum().sum()/(df.shape[0]*df.shape[1])*100, 1))}%", 'icon': 'verified'},
        ]
        if ap:
            cards.append({'label': 'Best Model', 'value': ap.get('best_model_name', 'N/A')[:15], 'icon': 'emoji_events'})
            primary = ap.get('best_metrics', {}).get('accuracy') or ap.get('best_metrics', {}).get('r2Score')
            if primary is not None:
                cards.append({'label': 'Score', 'value': f"{primary:.4f}", 'icon': 'trending_up'})
        return {
            'id': 'kpi_cards', 'type': 'kpi_cards', 'title': 'Key Performance Indicators', 'cards': cards,
        }


# Global instance
report_engine = ReportEngine()
