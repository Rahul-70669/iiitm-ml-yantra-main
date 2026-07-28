"""
AutoPilot Engine
The brain of ML Yantra's AutoPilot — handles smart dataset analysis,
automated cleaning with justifications, EDA generation, and intelligent
model training with heuristic-based hyperparameter tuning.
"""

import numpy as np
import pandas as pd
import time
import uuid
import re
from typing import Dict, List, Tuple, Any, Optional

from sklearn.model_selection import train_test_split
from sklearn.preprocessing import StandardScaler, LabelEncoder
from sklearn.linear_model import LogisticRegression, LinearRegression
from sklearn.ensemble import RandomForestClassifier, RandomForestRegressor
from sklearn.tree import DecisionTreeClassifier, DecisionTreeRegressor
from sklearn.svm import SVC, SVR
from xgboost import XGBClassifier, XGBRegressor
from sklearn.metrics import (
    accuracy_score, precision_recall_fscore_support, confusion_matrix,
    r2_score, mean_absolute_error, mean_squared_error,
    mean_absolute_percentage_error, log_loss, roc_auc_score
)


# ═══════════════════════ Target Name Heuristics ═══════════════════════

TARGET_NAME_PATTERNS = {
    'classification': [
        r'target', r'label', r'class', r'category', r'survived', r'churn',
        r'fraud', r'spam', r'diagnosis', r'outcome', r'result', r'species',
        r'type', r'grade', r'status', r'approved', r'default',
        r'is_', r'has_', r'flag', r'sentiment', r'rating',
    ],
    'regression': [
        r'price', r'cost', r'salary', r'revenue', r'amount', r'value',
        r'score', r'count', r'quantity', r'weight', r'height', r'age',
        r'income', r'sales', r'profit', r'loss', r'rate', r'distance',
        r'duration', r'time', r'area', r'size', r'temperature',
        r'mileage', r'kms?_driven', r'km', r'odometer',
    ]
}


class AutoPilotEngine:
    """Intelligent end-to-end ML pipeline engine"""

    def __init__(self):
        self.pipeline_log: List[Dict[str, Any]] = []

    def _log(self, step: str, category: str, description: str,
             details: Optional[Dict] = None, duration_ms: int = 0):
        """Add a step to the pipeline log"""
        self.pipeline_log.append({
            'step': step,
            'category': category,
            'description': description,
            'details': details,
            'duration_ms': duration_ms
        })

    # ════════════════════════════════════════════════════
    #  PHASE 1: ANALYZE
    # ════════════════════════════════════════════════════

    def analyze(self, df: pd.DataFrame) -> Dict[str, Any]:
        """Analyze dataset and suggest target column with confidence scoring"""
        rows, cols = df.shape
        column_types = {col: str(df[col].dtype) for col in df.columns}
        null_summary = {col: int(df[col].isnull().sum()) for col in df.columns}
        duplicate_rows = int(df.duplicated().sum())

        numeric_cols = df.select_dtypes(include=[np.number]).columns.tolist()
        categorical_cols = df.select_dtypes(include=['object', 'category', 'string']).columns.tolist()

        # Score each column as a potential target
        target_suggestions = self._score_target_columns(df, numeric_cols, categorical_cols)

        return {
            'rows': rows,
            'columns': cols,
            'column_names': df.columns.tolist(),
            'column_types': column_types,
            'null_summary': null_summary,
            'duplicate_rows': duplicate_rows,
            'numeric_columns': numeric_cols,
            'categorical_columns': categorical_cols,
            'target_suggestions': target_suggestions
        }

    def _score_target_columns(self, df: pd.DataFrame,
                               numeric_cols: List[str],
                               categorical_cols: List[str]) -> List[Dict]:
        """Score each column as a potential target using name heuristics + data characteristics"""
        suggestions = []

        for col in df.columns:
            score = 0.0
            problem_type = 'classification'
            reasons = []

            col_lower = col.lower().strip()
            n_unique = df[col].nunique()
            null_pct = df[col].isnull().sum() / len(df)
            is_numeric = pd.api.types.is_numeric_dtype(df[col])

            # Check if object column is actually numeric (e.g., "9,44,999", "$1,234")
            is_coercible_numeric = False
            if not is_numeric and df[col].dtype == 'object':
                sample = df[col].dropna().head(50).astype(str)
                if len(sample) > 0:
                    parsed_count = sum(1 for v in sample if self._try_parse_number(v) is not None)
                    if parsed_count / len(sample) >= 0.70:
                        is_coercible_numeric = True

            # Skip if too many nulls (>50%)
            if null_pct > 0.5:
                continue

            # Skip ID-like columns
            if self._is_id_column(col, df[col]):
                continue

            # ── Name-based scoring (pick strongest match, don't double-count) ──
            cls_match = None
            reg_match = None
            for pattern in TARGET_NAME_PATTERNS['classification']:
                if re.search(pattern, col_lower):
                    cls_match = pattern
                    break
            for pattern in TARGET_NAME_PATTERNS['regression']:
                if re.search(pattern, col_lower):
                    reg_match = pattern
                    break

            if cls_match and reg_match:
                # Both matched — pick regression if data looks numeric/continuous
                if is_numeric or is_coercible_numeric:
                    score += 0.4
                    problem_type = 'regression'
                    reasons.append(f"Name matches regression pattern '{reg_match}'")
                else:
                    score += 0.4
                    problem_type = 'classification'
                    reasons.append(f"Name matches classification pattern '{cls_match}'")
            elif reg_match:
                score += 0.4
                problem_type = 'regression'
                reasons.append(f"Name matches regression pattern '{reg_match}'")
            elif cls_match:
                score += 0.4
                problem_type = 'classification'
                reasons.append(f"Name matches classification pattern '{cls_match}'")

            # ── Data characteristic scoring ──
            effective_numeric = is_numeric or is_coercible_numeric
            if effective_numeric:
                if is_coercible_numeric:
                    reasons.append("Detected as coercible numeric (string-formatted numbers)")
                if n_unique <= 15 and not is_coercible_numeric:
                    score += 0.3
                    problem_type = 'classification'
                    reasons.append(f"Low cardinality ({n_unique} unique) — classification")
                elif n_unique <= 30 and n_unique / len(df) < 0.05 and not is_coercible_numeric:
                    score += 0.2
                    problem_type = 'classification'
                    reasons.append(f"Moderate cardinality ({n_unique} unique) — likely classification")
                else:
                    score += 0.2
                    if problem_type != 'classification' or reg_match:
                        problem_type = 'regression'
                    reasons.append(f"Continuous numeric ({n_unique} unique) — regression")
            else:
                # Categorical target
                if 2 <= n_unique <= 20:
                    score += 0.35
                    problem_type = 'classification'
                    reasons.append(f"Categorical with {n_unique} classes — classification")
                elif n_unique > 20:
                    score += 0.05  # Too many categories, unlikely target
                    reasons.append(f"High cardinality categorical ({n_unique}) — unlikely target")

            # ── Position bonus (last column is often the target) ──
            if col == df.columns[-1]:
                score += 0.15
                reasons.append("Last column position (common target placement)")

            # ── Low null bonus ──
            if null_pct == 0:
                score += 0.1
                reasons.append("No missing values")

            if score > 0.1:
                suggestions.append({
                    'column': col,
                    'confidence': round(min(score, 1.0), 2),
                    'problem_type': problem_type,
                    'reason': '; '.join(reasons)
                })

        # Sort by confidence descending
        suggestions.sort(key=lambda x: x['confidence'], reverse=True)
        return suggestions[:5]  # Top 5

    def _is_id_column(self, col_name: str, series: pd.Series) -> bool:
        """Detect if a column is an ID/index column"""
        col_lower = col_name.lower().strip()
        # Name heuristics
        if any(p in col_lower for p in ['_id', 'index', 'unnamed', 'serial', 'row_num']):
            return True
        if col_lower in ['id', 'idx', 'sno', 's.no', 'sr', 'serial']:
            return True
        # Data heuristic: all unique values
        if series.nunique() == len(series) and len(series) > 20:
            if pd.api.types.is_numeric_dtype(series):
                # Check if it's sequential
                sorted_vals = series.dropna().sort_values()
                if len(sorted_vals) > 0:
                    diffs = sorted_vals.diff().dropna()
                    if (diffs == 1).mean() > 0.9:
                        return True
        return False

    @staticmethod
    def _try_parse_number(val: str) -> Optional[float]:
        """
        Attempt to parse a string as a number. Handles every common edge case:
        - Indian formatting: '9,44,999' → 944999
        - Western formatting: '1,234,567.89' → 1234567.89
        - Currency: '₹9,44,999', '$1,234', '€500', '£200', '¥1000'
        - Percentage: '45%', '12.5%' → 45.0, 12.5
        - Parenthetical negatives: '(500)' → -500
        - Plus/minus: '+123', '-456'
        - Scientific notation: '1.5e3', '2E-4'
        - Whitespace/non-breaking spaces
        - Lakh/Crore suffixes: '5L', '2.5Cr'
        - K/M/B suffixes: '1.5K', '2M', '3.5B'
        Returns float if parseable, None if not a number.
        """
        if not isinstance(val, str):
            try:
                return float(val)
            except (ValueError, TypeError):
                return None

        original = val
        val = val.strip()

        # Skip empty strings
        if not val or val.lower() in ('nan', 'null', 'none', 'na', 'n/a', '-', '--', ''):
            return None

        # Handle parenthetical negatives: (500) → -500
        is_negative = False
        if val.startswith('(') and val.endswith(')'):
            val = val[1:-1].strip()
            is_negative = True

        # Remove currency symbols and whitespace
        currency_chars = '₹$€£¥₨﹩＄₩₪₦₱₫₴฿₸₼₡₢₣₤₥₧₨₩'
        for ch in currency_chars:
            val = val.replace(ch, '')
        # Also remove "Rs", "Rs.", "INR", "USD", etc.
        val = re.sub(r'^(Rs\.?|INR|USD|EUR|GBP|JPY)\s*', '', val, flags=re.IGNORECASE)
        val = val.strip()

        # Remove trailing unit suffixes (kms, km, miles, mi, kg, lbs, lb, g, m, ft, etc.)
        val = re.sub(r'\s*(kms|km|miles|mi|meters|metre|kg|kgs|lbs|lb|grams|gm|g|ft|feet|inches|inch|in|cm|mm|hrs|hr|hours|mins|min|seconds|sec|cc|bhp|hp|ps|nm|rpm|mpg|kmpl|ltr|litres|liters|units|pcs|nos|yrs|years|months|days)\s*$', '', val, flags=re.IGNORECASE)
        val = val.strip()

        if not val:
            return None

        # Handle percentage
        is_percentage = False
        if val.endswith('%'):
            val = val[:-1].strip()
            is_percentage = True

        # Handle suffix multipliers (K, M, B, L, Cr)
        multiplier = 1
        val_upper = val.upper().strip()
        if val_upper.endswith('CR') or val_upper.endswith('CRORE') or val_upper.endswith('CRORES'):
            val = re.sub(r'\s*(CR|CRORE|CRORES)\s*$', '', val, flags=re.IGNORECASE).strip()
            multiplier = 10_000_000
        elif val_upper.endswith('L') or val_upper.endswith('LAKH') or val_upper.endswith('LAKHS') or val_upper.endswith('LAC'):
            val = re.sub(r'\s*(L|LAKH|LAKHS|LAC)\s*$', '', val, flags=re.IGNORECASE).strip()
            multiplier = 100_000
        elif val_upper.endswith('B') or val_upper.endswith('BN') or val_upper.endswith('BILLION'):
            val = re.sub(r'\s*(B|BN|BILLION)\s*$', '', val, flags=re.IGNORECASE).strip()
            multiplier = 1_000_000_000
        elif val_upper.endswith('M') or val_upper.endswith('MN') or val_upper.endswith('MILLION'):
            val = re.sub(r'\s*(M|MN|MILLION)\s*$', '', val, flags=re.IGNORECASE).strip()
            multiplier = 1_000_000
        elif val_upper.endswith('K') or val_upper.endswith('THOUSAND'):
            val = re.sub(r'\s*(K|THOUSAND)\s*$', '', val, flags=re.IGNORECASE).strip()
            multiplier = 1_000

        # Handle +/- signs
        if val.startswith('+'):
            val = val[1:]
        elif val.startswith('-'):
            val = val[1:]
            is_negative = True

        # Remove non-breaking spaces and regular spaces inside numbers
        val = val.replace('\u00a0', '').replace(' ', '')

        if not val:
            return None

        # Now handle comma formatting
        # Detect if commas are thousands separators or decimal separators
        has_comma = ',' in val
        has_dot = '.' in val

        if has_comma and has_dot:
            # Determine which is decimal: last separator wins
            last_comma = val.rfind(',')
            last_dot = val.rfind('.')
            if last_dot > last_comma:
                # e.g., "1,234,567.89" → dot is decimal
                val = val.replace(',', '')
            else:
                # e.g., "1.234.567,89" → European format, comma is decimal
                val = val.replace('.', '').replace(',', '.')
        elif has_comma:
            # Could be: "1,234" (thousands) or "1,5" (European decimal)
            # Heuristic: if ALL comma groups (except maybe the first) are 3 digits → thousands
            # Also handles Indian: "9,44,999" → groups of 2 after first group of 3 from right
            parts = val.split(',')
            if len(parts) >= 2:
                # Check if it's a valid thousands-separated number
                # Last group should be 3 digits for Western, or 3 digits for Indian rightmost
                last_part = parts[-1]
                if len(last_part) == 3 and all(p.isdigit() for p in parts):
                    # All groups are digits, last group is 3 → thousands separator
                    val = val.replace(',', '')
                elif len(last_part) == 2 and all(p.isdigit() for p in parts):
                    # Indian format: last group (from right) is 3, next groups are 2
                    val = val.replace(',', '')
                elif len(parts) == 2 and len(parts[1]) <= 2 and parts[1].isdigit():
                    # Looks like "1,5" or "12,50" → European decimal
                    val = val.replace(',', '.')
                else:
                    # Default: treat commas as thousands separators
                    val = val.replace(',', '')
            else:
                val = val.replace(',', '')

        # Try parsing as float
        try:
            result = float(val)
            if is_negative:
                result = -result
            result *= multiplier
            if is_percentage:
                # Keep as percentage value, not divided by 100
                pass  # Return raw percentage value (45% → 45.0)
            return result
        except (ValueError, OverflowError):
            return None

    # ════════════════════════════════════════════════════
    #  PHASE 2: RUN FULL PIPELINE
    # ════════════════════════════════════════════════════

    def run(self, df: pd.DataFrame, target: str, problem_type: str) -> Dict[str, Any]:
        """Execute the full AutoPilot pipeline: clean → EDA → train"""
        self.pipeline_log = []
        autopilot_id = str(uuid.uuid4())

        # ── Before snapshot ──
        before_summary = {
            'rows': len(df),
            'columns': len(df.columns),
            'nulls': int(df.isnull().sum().sum()),
            'duplicates': int(df.duplicated().sum()),
            'column_names': df.columns.tolist()
        }

        # Preserve original data for EDA (pre-cleaning categorical snapshots)
        df_original = df.copy()

        # ════ STEP 1: AUTO-CLEAN ════
        df_clean, encoding_map = self._auto_clean(df, target, problem_type)

        # ── After snapshot ──
        after_summary = {
            'rows': len(df_clean),
            'columns': len(df_clean.columns),
            'nulls': int(df_clean.isnull().sum().sum()),
            'duplicates': int(df_clean.duplicated().sum()),
            'column_names': df_clean.columns.tolist()
        }

        # ════ STEP 2: AUTO-EDA ════
        eda_charts = self._auto_eda(df_original, df_clean, target, problem_type)

        # ════ STEP 3: AUTO-TRAIN ════
        training_result = self._auto_train(df_clean, target, problem_type)

        # Add feature importance to EDA if available
        if training_result.get('feature_importance'):
            eda_charts.append({
                'chart_type': 'feature_importance',
                'title': 'Feature Importance (Best Model)',
                'data': training_result['feature_importance']
            })

        return {
            'autopilot_id': autopilot_id,
            'problem_type': problem_type,
            'pipeline_log': self.pipeline_log,
            'before_summary': before_summary,
            'after_summary': after_summary,
            'eda_charts': eda_charts,
            'training_results': training_result['results'],
            'best_model_name': training_result['best_model_name'],
            'best_model_id': training_result['best_model_id'],
            'best_metrics': training_result['best_metrics'],
            'feature_importance': training_result.get('feature_importance'),
            'trained_models': training_result['trained_models'],
            'cleaned_df': df_clean,
            'encoding_map': encoding_map,
            'features_used': training_result['features_used'],
        }

    # ════════════════════════════════════════════════════
    #  AUTO-CLEAN
    # ════════════════════════════════════════════════════

    def _auto_clean(self, df: pd.DataFrame, target: str,
                     problem_type: str) -> Tuple[pd.DataFrame, Dict]:
        """Intelligent automated data cleaning with justifications"""
        df_clean = df.copy()
        encoding_map = {}

        # ── 1. Remove duplicates ──
        t0 = time.time()
        dup_count = int(df_clean.duplicated().sum())
        if dup_count > 0:
            df_clean = df_clean.drop_duplicates().reset_index(drop=True)
            self._log('remove_duplicates', 'clean',
                      f'Removed {dup_count} duplicate rows',
                      {'removed': dup_count}, int((time.time()-t0)*1000))
        else:
            self._log('check_duplicates', 'clean',
                      'No duplicate rows found — dataset is clean',
                      duration_ms=int((time.time()-t0)*1000))

        # ── 2. Drop columns with >60% nulls ──
        t0 = time.time()
        dropped_cols = []
        for col in df_clean.columns:
            if col == target:
                continue
            null_pct = df_clean[col].isnull().sum() / len(df_clean)
            if null_pct > 0.6:
                dropped_cols.append((col, round(null_pct * 100, 1)))
        if dropped_cols:
            cols_to_drop = [c[0] for c in dropped_cols]
            df_clean = df_clean.drop(columns=cols_to_drop)
            desc = '; '.join([f"'{c}' ({p}% null)" for c, p in dropped_cols])
            self._log('drop_sparse_columns', 'clean',
                      f'Dropped {len(dropped_cols)} columns with >60% nulls: {desc}',
                      {'dropped': [c[0] for c in dropped_cols]},
                      int((time.time()-t0)*1000))

        # ── 3. Drop ID-like columns ──
        t0 = time.time()
        id_cols = []
        for col in df_clean.columns:
            if col == target:
                continue
            if self._is_id_column(col, df_clean[col]):
                id_cols.append(col)
        if id_cols:
            df_clean = df_clean.drop(columns=id_cols)
            self._log('drop_id_columns', 'clean',
                      f"Dropped {len(id_cols)} ID-like column(s): {', '.join(id_cols)} — unique per row, no predictive value",
                      {'dropped': id_cols}, int((time.time()-t0)*1000))

        # ── 4. Coerce string-numeric columns to actual numeric types ──
        # Handles: Indian formatting (9,44,999), Western commas (1,234,567),
        # currency (₹, $, €, £, ¥), percentages (45%), parenthetical negatives ((500)),
        # plus/minus signs, whitespace, etc.
        t0 = time.time()
        coerced_cols = []
        object_cols = df_clean.select_dtypes(include=['object', 'string']).columns.tolist()

        for col in object_cols:
            if col == target and problem_type == 'classification':
                continue  # Don't coerce classification targets
            sample = df_clean[col].dropna().head(50).astype(str)
            if len(sample) == 0:
                continue
            numeric_count = 0
            needs_complex_parse = False
            for val in sample:
                cleaned = self._try_parse_number(val)
                if cleaned is not None:
                    numeric_count += 1
                    # Check if simple pandas str ops can handle it or need full parser
                    if any(c in val for c in '₹$€£¥()%LCrBMK') or re.search(r'(kms|km|bhp|kg|miles)\s*$', val, re.IGNORECASE):
                        needs_complex_parse = True
            # If ≥70% of non-null values parse as numbers, coerce the whole column
            if numeric_count / len(sample) >= 0.70:
                if needs_complex_parse or len(df_clean) < 50000:
                    # Use per-cell parser for complex formats or small datasets
                    df_clean[col] = df_clean[col].apply(
                        lambda x: self._try_parse_number(str(x)) if pd.notna(x) else np.nan
                    )
                else:
                    # Fast vectorized path: strip common chars and pd.to_numeric
                    s = df_clean[col].astype(str)
                    s = s.str.replace(r'[₹$€£¥,\s]', '', regex=True)
                    s = s.str.replace(r'\s*(kms|km|bhp|cc|hrs|kg)$', '', regex=True, case=False)
                    s = s.str.strip()
                    s = s.replace(['', 'nan', 'null', 'None', 'N/A', 'n/a', '-', '--'], np.nan)
                    df_clean[col] = pd.to_numeric(s, errors='coerce')
                df_clean[col] = pd.to_numeric(df_clean[col], errors='coerce')
                coerced_cols.append(col)

        if coerced_cols:
            self._log('coerce_numeric', 'clean',
                      f"Converted {len(coerced_cols)} text column(s) to numeric: {', '.join(coerced_cols)} "
                      f"(removed currency symbols, commas, percentages, etc.)",
                      {'columns': coerced_cols}, int((time.time()-t0)*1000))

        # ── 5. Detect and parse date-like string columns ──
        t0 = time.time()
        date_cols_parsed = []
        remaining_object = df_clean.select_dtypes(include=['object', 'string']).columns.tolist()
        for col in remaining_object:
            if col == target:
                continue
            sample = df_clean[col].dropna().head(30).astype(str)
            if len(sample) == 0:
                continue
            # Quick heuristic: check if values look like dates
            date_like = 0
            for val in sample:
                if re.search(r'\d{2,4}[-/]\d{1,2}[-/]\d{1,4}', val):
                    date_like += 1
                elif re.search(r'\d{1,2}\s+(Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)', val, re.IGNORECASE):
                    date_like += 1
            if date_like / len(sample) >= 0.6:
                try:
                    parsed = pd.to_datetime(df_clean[col], errors='coerce', infer_datetime_format=True)
                    if parsed.notna().sum() / max(1, df_clean[col].notna().sum()) >= 0.7:
                        df_clean[col] = parsed
                        date_cols_parsed.append(col)
                except Exception:
                    pass
        if date_cols_parsed:
            self._log('parse_dates', 'clean',
                      f"Parsed {len(date_cols_parsed)} date column(s): {', '.join(date_cols_parsed)}",
                      {'columns': date_cols_parsed}, int((time.time()-t0)*1000))

        # ── 6. Handle nulls in target column ──
        t0 = time.time()
        target_nulls = int(df_clean[target].isnull().sum())
        if target_nulls > 0:
            df_clean = df_clean.dropna(subset=[target]).reset_index(drop=True)
            self._log('drop_target_nulls', 'clean',
                      f"Dropped {target_nulls} rows with null target values ('{target}') — cannot train on unknown outcomes",
                      {'removed_rows': target_nulls}, int((time.time()-t0)*1000))

        # ── 7. Normalize dtypes (convert nullable Int64, StringDtype etc. to standard types) ──
        for col in df_clean.columns:
            col_dtype = df_clean[col].dtype
            dtype_name = str(col_dtype)
            # Convert pandas nullable integer types (Int8, Int16, Int32, Int64) to float64
            if dtype_name in ('Int8', 'Int16', 'Int32', 'Int64', 'UInt8', 'UInt16', 'UInt32', 'UInt64'):
                df_clean[col] = df_clean[col].astype('float64')
            # Convert pandas nullable float types
            elif dtype_name in ('Float32', 'Float64'):
                df_clean[col] = df_clean[col].astype('float64')
            # Convert pandas StringDtype to plain object
            elif isinstance(col_dtype, pd.StringDtype):
                df_clean[col] = df_clean[col].astype('object')
            # Convert pandas BooleanDtype
            elif dtype_name == 'boolean':
                df_clean[col] = df_clean[col].astype('float64')

        # ── 8. Handle nulls in feature columns ──
        t0 = time.time()
        null_actions = []
        for col in df_clean.columns:
            if col == target:
                continue
            null_count = int(df_clean[col].isnull().sum())
            if null_count == 0:
                continue

            null_pct = null_count / len(df_clean)
            if pd.api.types.is_numeric_dtype(df_clean[col]):
                # Decide: median (robust) vs mean (symmetric)
                skewness = abs(df_clean[col].skew()) if df_clean[col].notna().sum() > 2 else 2.0
                if skewness > 1.0:
                    fill_val = round(float(df_clean[col].median()), 4)
                    df_clean[col] = df_clean[col].fillna(fill_val)
                    null_actions.append(
                        f"'{col}': filled {null_count} nulls with median ({fill_val}) — skewed distribution (skew={round(skewness, 2)})"
                    )
                else:
                    fill_val = round(float(df_clean[col].mean()), 4)
                    df_clean[col] = df_clean[col].fillna(fill_val)
                    null_actions.append(
                        f"'{col}': filled {null_count} nulls with mean ({fill_val}) — symmetric distribution"
                    )
            else:
                mode_val = df_clean[col].mode()
                if not mode_val.empty:
                    fill_val = mode_val.iloc[0]
                    df_clean[col] = df_clean[col].fillna(fill_val)
                    null_actions.append(
                        f"'{col}': filled {null_count} nulls with mode ('{fill_val}')"
                    )

        if null_actions:
            self._log('handle_nulls', 'clean',
                      f'Imputed nulls in {len(null_actions)} column(s)',
                      {'actions': null_actions}, int((time.time()-t0)*1000))
        else:
            self._log('check_nulls', 'clean',
                      'No remaining null values in features — dataset is complete',
                      duration_ms=int((time.time()-t0)*1000))

        # ── 9. Convert date columns to numeric components ──
        t0 = time.time()
        date_cols_processed = []
        for col in df_clean.columns:
            if col == target:
                continue
            if pd.api.types.is_datetime64_any_dtype(df_clean[col]):
                df_clean[col + '_year'] = df_clean[col].dt.year
                df_clean[col + '_month'] = df_clean[col].dt.month
                df_clean[col + '_day'] = df_clean[col].dt.day
                df_clean = df_clean.drop(columns=[col])
                date_cols_processed.append(col)
        if date_cols_processed:
            self._log('convert_dates', 'clean',
                      f"Extracted year/month/day from {len(date_cols_processed)} date column(s): {', '.join(date_cols_processed)}",
                      {'columns': date_cols_processed}, int((time.time()-t0)*1000))

        # ── 10. Feature Engineering ──
        t0 = time.time()
        fe_actions = []
        numeric_cols_now = df_clean.select_dtypes(include=[np.number]).columns.tolist()

        # a) If 'year' exists and looks like a calendar year, create 'age'
        for col in numeric_cols_now:
            if col == target:
                continue
            col_lower = col.lower().strip()
            if col_lower in ['year', 'yr', 'model_year', 'manufacture_year', 'mfg_year']:
                median_val = df_clean[col].median()
                if 1900 < median_val < 2100:
                    import datetime
                    current_year = datetime.datetime.now().year
                    new_col = f'{col}_age'
                    df_clean[new_col] = current_year - df_clean[col]
                    df_clean[new_col] = df_clean[new_col].clip(lower=0)
                    fe_actions.append(f"Created '{new_col}' = {current_year} - {col} (age is more predictive than raw year)")

        # b) Log-transform highly skewed features (only for regression target)
        if problem_type == 'regression':
            for col in numeric_cols_now:
                if col == target:
                    continue
                if df_clean[col].min() >= 0 and df_clean[col].notna().sum() > 10:
                    skew = abs(df_clean[col].skew())
                    if skew > 2.0 and df_clean[col].median() > 0:
                        new_col = f'{col}_log'
                        df_clean[new_col] = np.log1p(df_clean[col])
                        fe_actions.append(f"Created '{new_col}' — log transform (skew={skew:.1f}, high skew hurts linear models)")

            # c) Log-transform skewed target for regression
            if target in df_clean.columns and df_clean[target].min() >= 0:
                target_skew = abs(df_clean[target].skew())
                if target_skew > 2.0:
                    fe_actions.append(f"Note: target '{target}' is highly skewed (skew={target_skew:.1f}) — tree models handle this well")

        if fe_actions:
            self._log('feature_engineering', 'feature',
                      f'Engineered {len(fe_actions)} new feature(s)',
                      {'actions': fe_actions}, int((time.time()-t0)*1000))

        # ── 11. Encode categorical columns ──
        t0 = time.time()
        encode_actions = []
        categorical_cols = df_clean.select_dtypes(include=['object', 'category', 'string']).columns.tolist()

        for col in categorical_cols:
            n_unique = df_clean[col].nunique()

            if col == target:
                if problem_type == 'classification':
                    le = LabelEncoder()
                    df_clean[col] = le.fit_transform(df_clean[col].astype(str))
                    encoding_map[col] = {
                        'method': 'label',
                        'mapping': dict(zip(le.classes_.tolist(),
                                            range(len(le.classes_))))
                    }
                    encode_actions.append(
                        f"'{col}' (target): label encoded {n_unique} classes"
                    )
                continue

            if n_unique > 50:
                df_clean = df_clean.drop(columns=[col])
                encode_actions.append(
                    f"'{col}': dropped — {n_unique} unique values, too high cardinality for encoding"
                )
            elif n_unique <= 10:
                # One-hot encode low cardinality
                dummies = pd.get_dummies(df_clean[col], prefix=col, dtype=int)
                df_clean = pd.concat([df_clean.drop(columns=[col]), dummies], axis=1)
                encoding_map[col] = {
                    'method': 'onehot',
                    'categories': dummies.columns.tolist()
                }
                encode_actions.append(
                    f"'{col}': one-hot encoded ({n_unique} categories → {len(dummies.columns)} columns)"
                )
            else:
                # Target encoding for medium cardinality (11-50 unique)
                # Replace each category with the mean target value for that category
                # This preserves meaningful relationships (e.g., 'BMW' → high avg price)
                if target in df_clean.columns and pd.api.types.is_numeric_dtype(df_clean[target]):
                    target_means = df_clean.groupby(col)[target].mean()
                    global_mean = df_clean[target].mean()
                    # Smoothing to prevent overfitting on rare categories
                    category_counts = df_clean[col].value_counts()
                    smoothing_factor = 10
                    smoothed_means = {}
                    for cat in target_means.index:
                        n = category_counts.get(cat, 0)
                        smoothed_means[cat] = (n * target_means[cat] + smoothing_factor * global_mean) / (n + smoothing_factor)
                    df_clean[col] = df_clean[col].map(smoothed_means).fillna(global_mean)
                    encoding_map[col] = {
                        'method': 'target',
                        'mapping': {str(k): round(v, 4) for k, v in smoothed_means.items()}
                    }
                    encode_actions.append(
                        f"'{col}': target encoded ({n_unique} categories → mean target value, preserves meaningful relationships)"
                    )
                else:
                    # Fallback to label encoding if target isn't numeric
                    le = LabelEncoder()
                    df_clean[col] = le.fit_transform(df_clean[col].astype(str))
                    encoding_map[col] = {
                        'method': 'label',
                        'mapping': dict(zip(le.classes_.tolist(),
                                            range(len(le.classes_))))
                    }
                    encode_actions.append(
                        f"'{col}': label encoded ({n_unique} categories → integer codes)"
                    )

        if encode_actions:
            self._log('encode_categoricals', 'encode',
                      f'Encoded {len(encode_actions)} categorical column(s)',
                      {'actions': encode_actions}, int((time.time()-t0)*1000))

        # ── 12. Remove outliers (numeric features only, conservative IQR method) ──
        t0 = time.time()
        outlier_actions = []
        numeric_features = [c for c in df_clean.select_dtypes(include=[np.number]).columns if c != target]
        rows_before = len(df_clean)

        for col in numeric_features:
            col_data = df_clean[col].dropna()
            if len(col_data) < 20:
                continue
            Q1 = col_data.quantile(0.25)
            Q3 = col_data.quantile(0.75)
            IQR = Q3 - Q1
            if IQR == 0:
                continue
            lower = Q1 - 3.5 * IQR  # Use 3.5x IQR (more conservative)
            upper = Q3 + 3.5 * IQR
            outlier_count = int(((col_data < lower) | (col_data > upper)).sum())
            if outlier_count > 0 and outlier_count / len(col_data) < 0.05:
                # Only remove if <5% of data are outliers (stricter threshold)
                mask = df_clean[col].between(lower, upper) | df_clean[col].isna()
                df_clean = df_clean[mask].reset_index(drop=True)
                outlier_actions.append(f"'{col}': removed {outlier_count} extreme outliers (3.5×IQR)")

        rows_removed = rows_before - len(df_clean)
        if outlier_actions:
            self._log('remove_outliers', 'clean',
                      f'Removed {rows_removed} rows with extreme outliers across {len(outlier_actions)} column(s)',
                      {'actions': outlier_actions, 'rows_removed': rows_removed},
                      int((time.time()-t0)*1000))

        return df_clean, encoding_map

    # ════════════════════════════════════════════════════
    #  AUTO-EDA
    # ════════════════════════════════════════════════════

    def _auto_eda(self, df_original: pd.DataFrame, df_clean: pd.DataFrame,
                   target: str, problem_type: str) -> List[Dict]:
        """Generate comprehensive EDA visualizations"""
        t0 = time.time()
        charts = []

        # ── Downsample for EDA performance if dataset is massive ──
        if len(df_clean) > 20000:
            df_clean = df_clean.sample(n=20000, random_state=42)
            df_original = df_original.loc[df_clean.index]

        # ── 1. Distribution histograms for numeric columns ──
        numeric_cols = df_clean.select_dtypes(include=[np.number]).columns.tolist()
        for col in numeric_cols[:12]:  # Cap at 12 to avoid overload
            clean = df_clean[col].dropna()
            if len(clean) == 0:
                continue
            n_bins = min(25, max(10, len(clean.unique())))
            try:
                counts, bin_edges = np.histogram(clean, bins=n_bins)
                charts.append({
                    'chart_type': 'histogram',
                    'title': f'Distribution of {col}',
                    'data': {
                        'column': col,
                        'counts': [int(c) for c in counts],
                        'bins': [round(float(b), 4) for b in bin_edges],
                        'mean': round(float(clean.mean()), 4),
                        'median': round(float(clean.median()), 4),
                        'std': round(float(clean.std()), 4) if len(clean) > 1 else 0
                    }
                })
            except Exception:
                pass

        # ── 2. Count plots for original categorical columns ──
        cat_cols_original = df_original.select_dtypes(include=['object', 'category', 'string']).columns.tolist()
        for col in cat_cols_original[:8]:
            vc = df_original[col].dropna().value_counts().head(15)
            if len(vc) > 0:
                charts.append({
                    'chart_type': 'countplot',
                    'title': f'Value Counts: {col}',
                    'data': {
                        'column': col,
                        'labels': [str(l) for l in vc.index.tolist()],
                        'counts': [int(c) for c in vc.values.tolist()]
                    }
                })

        # ── 3. Box plots for numeric columns ──
        for col in numeric_cols[:8]:
            clean = df_clean[col].dropna()
            if len(clean) < 5:
                continue
            q1 = float(clean.quantile(0.25))
            median = float(clean.median())
            q3 = float(clean.quantile(0.75))
            iqr = q3 - q1
            lower = q1 - 1.5 * iqr
            upper = q3 + 1.5 * iqr
            in_bounds = clean[(clean >= lower) & (clean <= upper)]
            outliers = clean[(clean < lower) | (clean > upper)].head(30).tolist()
            charts.append({
                'chart_type': 'boxplot',
                'title': f'Box Plot: {col}',
                'data': {
                    'column': col,
                    'min': float(in_bounds.min()) if not in_bounds.empty else q1,
                    'q1': q1,
                    'median': median,
                    'q3': q3,
                    'max': float(in_bounds.max()) if not in_bounds.empty else q3,
                    'outliers': [round(float(o), 4) for o in outliers]
                }
            })

        # ── 4. Correlation heatmap ──
        if len(numeric_cols) >= 2:
            corr = df_clean[numeric_cols].corr().fillna(0)
            charts.append({
                'chart_type': 'correlation',
                'title': 'Correlation Heatmap',
                'data': {
                    'columns': corr.columns.tolist(),
                    'matrix': [[round(float(v), 4) for v in row] for row in corr.values.tolist()]
                }
            })

        # ── 5. Top scatter plots (features vs target) ──
        if target in df_clean.columns and target in numeric_cols:
            feature_cols = [c for c in numeric_cols if c != target]
            # Pick top 4 by absolute correlation with target
            if feature_cols:
                try:
                    corrs = df_clean[feature_cols].corrwith(df_clean[target]).abs().sort_values(ascending=False)
                    top_features = corrs.head(4).index.tolist()
                    for feat in top_features:
                        sample = df_clean[[feat, target]].dropna().head(200)
                        if len(sample) > 0:
                            charts.append({
                                'chart_type': 'scatter',
                                'title': f'{feat} vs {target}',
                                'data': {
                                    'x_col': feat,
                                    'y_col': target,
                                    'x': [round(float(v), 4) for v in sample[feat].tolist()],
                                    'y': [round(float(v), 4) for v in sample[target].tolist()]
                                }
                            })
                except Exception:
                    pass

        duration = int((time.time() - t0) * 1000)
        self._log('generate_eda', 'eda',
                  f'Generated {len(charts)} EDA visualizations',
                  {'chart_count': len(charts)}, duration)

        return charts

    # ════════════════════════════════════════════════════
    #  AUTO-TRAIN
    # ════════════════════════════════════════════════════

    def _auto_train(self, df_clean: pd.DataFrame, target: str,
                     problem_type: str) -> Dict[str, Any]:
        """Smart model selection and training with heuristic hyperparameters"""

        # Determine features (all numeric except target)
        features = [c for c in df_clean.select_dtypes(include=[np.number]).columns if c != target]

        if not features:
            raise ValueError("No numeric features available after cleaning. Cannot train models.")

        X = df_clean[features].copy()
        y = df_clean[target].copy()

        # Replace inf/-inf with NaN, then drop
        X = X.replace([np.inf, -np.inf], np.nan)

        # Ensure y is numeric
        if not pd.api.types.is_numeric_dtype(y):
            try:
                y = pd.to_numeric(y, errors='coerce')
            except Exception:
                pass

        # Drop rows with NaN or non-finite values
        mask = X.notna().all(axis=1) & y.notna()
        X = X[mask]
        y = y[mask]

        if len(X) < 10:
            raise ValueError("Too few valid rows (<10) after cleaning. Need more data to train.")

        # ── Cap dataset size to prevent server lock-ups on massive datasets ──
        if len(X) > 20000:
            t0 = time.time()
            original_size = len(X)
            if problem_type == 'classification':
                try:
                    _, X, _, y = train_test_split(
                        X, y, test_size=20000/len(X), random_state=42, stratify=y
                    )
                except ValueError:
                    # stratify failed (too few samples in some class)
                    idx = X.sample(n=20000, random_state=42).index
                    X = X.loc[idx]
                    y = y.loc[idx]
            else:
                idx = X.sample(n=20000, random_state=42).index
                X = X.loc[idx]
                y = y.loc[idx]
            self._log('downsample', 'train',
                      f'Downsampled from {original_size:,} to {len(X):,} rows for training efficiency',
                      {'original': original_size, 'sampled': len(X)},
                      int((time.time()-t0)*1000))

        n_rows = len(X)
        n_features = len(features)

        # ── Detect imbalance (classification only) ──
        imbalance_info = None
        smote_applied = False
        if problem_type == 'classification':
            vc = y.value_counts()
            majority = float(vc.iloc[0])
            minority = float(vc.iloc[-1])
            ratio = round(majority / minority, 1) if minority > 0 else float('inf')
            imbalance_info = {
                'ratio': float(ratio),
                'is_imbalanced': bool(ratio > 3.0),
                'distribution': {str(k): int(v) for k, v in vc.items()}
            }
            if imbalance_info['is_imbalanced']:
                self._log('detect_imbalance', 'train',
                          f"Class imbalance detected (ratio {ratio}:1). SMOTE will be applied to training data.",
                          imbalance_info)

        # ── Train/Test Split ──
        t0 = time.time()
        if problem_type == 'classification':
            X_train, X_test, y_train, y_test = train_test_split(
                X, y, test_size=0.2, random_state=42, stratify=y
            )
        else:
            X_train, X_test, y_train, y_test = train_test_split(
                X, y, test_size=0.2, random_state=42
            )
        self._log('train_test_split', 'train',
                  f'Split data: {len(X_train)} train / {len(X_test)} test (80/20)',
                  {'train_rows': len(X_train), 'test_rows': len(X_test)},
                  int((time.time()-t0)*1000))

        # ── Apply SMOTE if imbalanced ──
        if imbalance_info and imbalance_info['is_imbalanced']:
            t0 = time.time()
            try:
                from imblearn.over_sampling import SMOTE
                minority_count = y_train.value_counts().min()
                k_neighbors = min(5, minority_count - 1) if minority_count > 1 else 1
                if k_neighbors >= 1:
                    smote = SMOTE(random_state=42, k_neighbors=k_neighbors)
                    X_train_arr, y_train_arr = smote.fit_resample(X_train, y_train)
                    X_train = pd.DataFrame(X_train_arr, columns=X_train.columns)
                    y_train = pd.Series(y_train_arr, name=y_train.name)
                    smote_applied = True
                    self._log('apply_smote', 'train',
                              f'Applied SMOTE: {len(X_train)} training samples (balanced)',
                              {'new_train_size': len(X_train)},
                              int((time.time()-t0)*1000))
            except Exception as e:
                self._log('smote_skipped', 'train',
                          f'SMOTE could not be applied: {str(e)}')

        # ── Scale features ──
        t0 = time.time()
        scaler = StandardScaler()
        X_train_scaled = pd.DataFrame(
            scaler.fit_transform(X_train), columns=X_train.columns, index=X_train.index
        )
        X_test_scaled = pd.DataFrame(
            scaler.transform(X_test), columns=X_test.columns, index=X_test.index
        )
        self._log('scale_features', 'train',
                  f'Applied StandardScaler to {n_features} features',
                  duration_ms=int((time.time()-t0)*1000))

        # ── Select algorithms based on dataset size ──
        algorithms = self._select_algorithms(n_rows, n_features, problem_type)
        self._log('select_algorithms', 'train',
                  f"Selected {len(algorithms)} algorithms: {', '.join([a['name'] for a in algorithms])}",
                  {'algorithms': [a['name'] for a in algorithms]})

        # ── Train each model ──
        results = []
        trained_models = {}

        for algo in algorithms:
            t0 = time.time()
            model = algo['factory']()
            algo_name = algo['name']

            try:
                # SVM cap for large datasets
                if algo['key'] in ['svm', 'svr'] and len(X_train_scaled) > 5000:
                    X_fit = X_train_scaled.sample(n=5000, random_state=42)
                    y_fit = y_train.loc[X_fit.index]
                    model.fit(X_fit, y_fit)
                else:
                    model.fit(X_train_scaled, y_train)

                y_pred = model.predict(X_test_scaled)
                training_time = round(time.time() - t0, 3)

                metrics = self._calculate_metrics(y_test, y_pred, problem_type, model, X_test_scaled, n_features)
                conf_matrix = confusion_matrix(y_test, y_pred).tolist() if problem_type == 'classification' else None
                feat_importance = self._get_feature_importance(model, features)

                model_id = str(uuid.uuid4())
                results.append({
                    'modelId': model_id,
                    'name': algo_name,
                    'algorithm': algo['key'],
                    'metrics': metrics,
                    'confusionMatrix': conf_matrix,
                    'featureImportance': feat_importance,
                    'trainingTime': training_time,
                    'hyperparameters': algo.get('params', {}),
                    'isBest': False
                })
                trained_models[model_id] = {
                    'model': model,
                    'scaler': scaler,
                    'features': features,
                    'target': target
                }

                self._log(f'train_{algo["key"]}', 'train',
                          f'Trained {algo_name} in {training_time}s',
                          {'time': training_time, 'params': algo.get('params', {})},
                          int(training_time * 1000))
            except Exception as e:
                self._log(f'train_{algo["key"]}_failed', 'train',
                          f'{algo_name} failed: {str(e)}')

        # ── Determine best model ──
        best_model_name = 'N/A'
        best_model_id = ''
        best_metrics = {}
        feature_importance = None

        if results:
            if problem_type == 'classification':
                if imbalance_info and imbalance_info['is_imbalanced']:
                    best_idx = max(range(len(results)), key=lambda i: results[i]['metrics'].get('f1Score') or 0)
                    ranking_metric = 'F1 Score'
                else:
                    best_idx = max(range(len(results)), key=lambda i: results[i]['metrics'].get('accuracy') or 0)
                    ranking_metric = 'Accuracy'
            else:
                best_idx = max(range(len(results)), key=lambda i: results[i]['metrics'].get('r2Score') or 0)
                ranking_metric = 'R² Score'

            results[best_idx]['isBest'] = True
            best_model_name = results[best_idx]['name']
            best_model_id = results[best_idx]['modelId']
            best_metrics = results[best_idx]['metrics']
            feature_importance = results[best_idx].get('featureImportance')

            metric_val = best_metrics.get('f1Score') or best_metrics.get('accuracy') or best_metrics.get('r2Score') or 0
            self._log('best_model', 'train',
                      f"🏆 Best Model: {best_model_name} — {ranking_metric}: {metric_val:.4f}",
                      {'model': best_model_name, 'metric': ranking_metric, 'value': metric_val})

        return {
            'results': {
                'models': results,
                'bestModel': best_model_id,
                'problemType': problem_type,
                'smoteApplied': smote_applied,
                'imbalanceInfo': imbalance_info
            },
            'best_model_name': best_model_name,
            'best_model_id': best_model_id,
            'best_metrics': best_metrics,
            'feature_importance': feature_importance,
            'trained_models': trained_models,
            'features_used': features,
        }

    def _select_algorithms(self, n_rows: int, n_features: int,
                            problem_type: str) -> List[Dict]:
        """Select algorithms and hyperparameters based on dataset characteristics"""

        if problem_type == 'classification':
            algos = []

            # Logistic Regression — always include (fast, interpretable baseline)
            algos.append({
                'key': 'logistic_regression',
                'name': 'Logistic Regression',
                'factory': lambda: LogisticRegression(max_iter=1000, class_weight='balanced', random_state=42),
                'params': {'max_iter': 1000, 'class_weight': 'balanced'}
            })

            # Decision Tree
            dt_depth = min(12, max(4, n_features))
            algos.append({
                'key': 'decision_tree',
                'name': 'Decision Tree',
                'factory': lambda d=dt_depth: DecisionTreeClassifier(
                    max_depth=d, min_samples_split=5, class_weight='balanced', random_state=42
                ),
                'params': {'max_depth': dt_depth, 'min_samples_split': 5}
            })

            # Random Forest — adjust by dataset size
            rf_estimators = 100 if n_rows < 2000 else (200 if n_rows < 10000 else 300)
            rf_depth = min(15, max(6, n_features + 2))
            algos.append({
                'key': 'random_forest',
                'name': 'Random Forest',
                'factory': lambda e=rf_estimators, d=rf_depth: RandomForestClassifier(
                    n_estimators=e, max_depth=d, min_samples_split=5,
                    class_weight='balanced', random_state=42, n_jobs=-1
                ),
                'params': {'n_estimators': rf_estimators, 'max_depth': rf_depth}
            })

            # SVM — only for smaller datasets (O(n²) complexity)
            if n_rows <= 5000:
                algos.append({
                    'key': 'svm',
                    'name': 'Support Vector Machine',
                    'factory': lambda: SVC(kernel='rbf', class_weight='balanced', random_state=42, probability=True),
                    'params': {'kernel': 'rbf', 'class_weight': 'balanced'}
                })

            # XGBoost
            xgb_estimators = 100 if n_rows < 2000 else 200
            xgb_depth = min(8, max(4, n_features // 2))
            xgb_lr = 0.1 if n_rows < 5000 else 0.05
            algos.append({
                'key': 'xgboost',
                'name': 'XGBoost',
                'factory': lambda e=xgb_estimators, d=xgb_depth, lr=xgb_lr: XGBClassifier(
                    n_estimators=e, max_depth=d, learning_rate=lr,
                    subsample=0.8, colsample_bytree=0.8,
                    random_state=42, verbosity=0, n_jobs=-1,
                    use_label_encoder=False, eval_metric='logloss'
                ),
                'params': {'n_estimators': xgb_estimators, 'max_depth': xgb_depth, 'learning_rate': xgb_lr}
            })

            return algos

        else:  # regression
            algos = []

            algos.append({
                'key': 'linear_regression',
                'name': 'Linear Regression',
                'factory': lambda: LinearRegression(),
                'params': {}
            })

            dt_depth = min(15, max(5, n_features + 1))
            algos.append({
                'key': 'decision_tree',
                'name': 'Decision Tree',
                'factory': lambda d=dt_depth: DecisionTreeRegressor(
                    max_depth=d, min_samples_split=5, min_samples_leaf=3, random_state=42
                ),
                'params': {'max_depth': dt_depth, 'min_samples_leaf': 3}
            })

            rf_estimators = 200 if n_rows < 2000 else (300 if n_rows < 10000 else 500)
            rf_depth = min(20, max(8, n_features + 4))
            algos.append({
                'key': 'random_forest',
                'name': 'Random Forest',
                'factory': lambda e=rf_estimators, d=rf_depth: RandomForestRegressor(
                    n_estimators=e, max_depth=d, min_samples_split=4, min_samples_leaf=2,
                    random_state=42, n_jobs=-1
                ),
                'params': {'n_estimators': rf_estimators, 'max_depth': rf_depth}
            })

            if n_rows <= 5000:
                algos.append({
                    'key': 'svr',
                    'name': 'SVR',
                    'factory': lambda: SVR(kernel='rbf', C=10.0),
                    'params': {'kernel': 'rbf', 'C': 10.0}
                })

            xgb_estimators = 200 if n_rows < 2000 else 400
            xgb_depth = min(10, max(5, n_features))
            xgb_lr = 0.05 if n_rows < 5000 else 0.03
            algos.append({
                'key': 'xgboost',
                'name': 'XGBoost',
                'factory': lambda e=xgb_estimators, d=xgb_depth, lr=xgb_lr: XGBRegressor(
                    n_estimators=e, max_depth=d, learning_rate=lr,
                    subsample=0.8, colsample_bytree=0.8,
                    min_child_weight=3, reg_alpha=0.1,
                    random_state=42, verbosity=0, n_jobs=-1
                ),
                'params': {'n_estimators': xgb_estimators, 'max_depth': xgb_depth, 'learning_rate': xgb_lr}
            })

            return algos

    def _calculate_metrics(self, y_true, y_pred, problem_type, model, X_test, n_features):
        """Calculate comprehensive metrics"""
        if problem_type == 'classification':
            precision, recall, f1, _ = precision_recall_fscore_support(
                y_true, y_pred, average='weighted', zero_division=0
            )
            roc_auc = None
            log_loss_val = None
            try:
                if hasattr(model, 'predict_proba') and X_test is not None:
                    y_proba = model.predict_proba(X_test)
                    n_classes = len(np.unique(y_true))
                    if n_classes == 2:
                        roc_auc = round(roc_auc_score(y_true, y_proba[:, 1]), 4)
                    else:
                        roc_auc = round(roc_auc_score(y_true, y_proba, multi_class='ovr', average='weighted'), 4)
                    log_loss_val = round(log_loss(y_true, y_proba), 4)
            except Exception:
                pass

            return {
                'accuracy': round(accuracy_score(y_true, y_pred), 4),
                'precision': round(precision, 4),
                'recall': round(recall, 4),
                'f1Score': round(f1, 4),
                'rocAuc': roc_auc,
                'logLoss': log_loss_val,
                'r2Score': None, 'mae': None, 'rmse': None, 'mape': None, 'mse': None, 'adjR2': None
            }
        else:
            r2 = r2_score(y_true, y_pred)
            mae = mean_absolute_error(y_true, y_pred)
            mse = mean_squared_error(y_true, y_pred)
            rmse = np.sqrt(mse)
            n = len(y_true)
            p = n_features
            adj_r2 = 1 - (1 - r2) * (n - 1) / (n - p - 1) if n > p + 1 else r2
            try:
                mape = mean_absolute_percentage_error(y_true, y_pred)
            except Exception:
                mape = None

            return {
                'accuracy': None, 'precision': None, 'recall': None,
                'f1Score': None, 'rocAuc': None, 'logLoss': None,
                'r2Score': round(r2, 4), 'adjR2': round(adj_r2, 4),
                'mae': round(mae, 4), 'mse': round(mse, 4),
                'rmse': round(rmse, 4),
                'mape': round(mape, 4) if mape is not None else None
            }

    def _get_feature_importance(self, model, features):
        """Extract feature importance from tree-based models"""
        if hasattr(model, 'feature_importances_'):
            importances = model.feature_importances_
            return {feat: round(float(imp), 4) for feat, imp in zip(features, importances)}
        return None


# Global instance
autopilot_engine = AutoPilotEngine()
