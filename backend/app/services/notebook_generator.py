"""
Notebook Generator Service
Generates a complete Jupyter/Colab .ipynb notebook documenting the entire
AutoPilot pipeline — including markdown explanations making it a full tutorial.
"""

import json
from typing import Dict, List, Any, Optional


def _make_cell(cell_type: str, source: str | list, execution_count: int = None) -> Dict:
    """Create a single notebook cell"""
    if isinstance(source, str):
        source = source.split('\n')
    # Ensure each line ends with \n except the last
    formatted = []
    for i, line in enumerate(source):
        if i < len(source) - 1:
            formatted.append(line + '\n' if not line.endswith('\n') else line)
        else:
            formatted.append(line.rstrip('\n'))

    cell = {
        'cell_type': cell_type,
        'metadata': {},
        'source': formatted,
    }
    if cell_type == 'code':
        cell['execution_count'] = execution_count
        cell['outputs'] = []
    return cell


def generate_notebook(
    filename: str,
    pipeline_log: List[Dict],
    before_summary: Dict,
    after_summary: Dict,
    problem_type: str,
    target: str,
    features_used: List[str],
    encoding_map: Dict,
    training_results: Dict,
    best_model_name: str,
    best_metrics: Dict,
) -> Dict:
    """
    Generate a complete .ipynb notebook documenting the AutoPilot pipeline.
    Returns the notebook as a Python dict (JSON-serializable).
    """
    cells = []

    # ════════════════════════════════════
    #  1. TITLE + INTRODUCTION
    # ════════════════════════════════════
    cells.append(_make_cell('markdown', f"""# 🚀 ML Yantra AutoPilot — Analysis Report
## Dataset: `{filename}`

> This notebook was **auto-generated** by [ML Yantra](https://mlyantra.dev) AutoPilot.
> It documents every step of the automated pipeline so you can **learn, replicate, and extend** the analysis.

---

### 📋 Pipeline Summary

| Metric | Before | After |
|--------|--------|-------|
| **Rows** | {before_summary.get('rows', 'N/A'):,} | {after_summary.get('rows', 'N/A'):,} |
| **Columns** | {before_summary.get('columns', 'N/A')} | {after_summary.get('columns', 'N/A')} |
| **Null Values** | {before_summary.get('nulls', 0):,} | {after_summary.get('nulls', 0):,} |
| **Duplicates** | {before_summary.get('duplicates', 0):,} | {after_summary.get('duplicates', 0):,} |

**Problem Type**: `{problem_type}`
**Target Column**: `{target}`
**Best Model**: 🏆 `{best_model_name}`
"""))

    # ════════════════════════════════════
    #  2. IMPORT LIBRARIES
    # ════════════════════════════════════
    cells.append(_make_cell('markdown', """---
## 1. 📦 Import Libraries

First, let's import all the libraries we'll need for data manipulation, visualization, and model training."""))

    cells.append(_make_cell('code', """import pandas as pd
import numpy as np
import matplotlib.pyplot as plt
import seaborn as sns
from sklearn.model_selection import train_test_split
from sklearn.preprocessing import StandardScaler, LabelEncoder
from sklearn.metrics import (
    accuracy_score, precision_recall_fscore_support,
    confusion_matrix, classification_report,
    r2_score, mean_absolute_error, mean_squared_error
)

# Model imports
from sklearn.linear_model import LogisticRegression, LinearRegression
from sklearn.ensemble import RandomForestClassifier, RandomForestRegressor
from sklearn.tree import DecisionTreeClassifier, DecisionTreeRegressor
from sklearn.svm import SVC, SVR

# Try importing XGBoost (install if needed: pip install xgboost)
try:
    from xgboost import XGBClassifier, XGBRegressor
    HAS_XGBOOST = True
except ImportError:
    HAS_XGBOOST = False
    print("⚠️ XGBoost not installed. Run: pip install xgboost")

# Display settings
pd.set_option('display.max_columns', None)
sns.set_style('whitegrid')
plt.rcParams['figure.figsize'] = (10, 6)

print("✅ All libraries imported successfully!")""", 1))

    # ════════════════════════════════════
    #  3. LOAD DATASET
    # ════════════════════════════════════
    cells.append(_make_cell('markdown', f"""---
## 2. 📁 Load Dataset

> **Note**: Upload your dataset file (`{filename}`) to the Colab environment first.
> You can use the file upload widget or mount Google Drive."""))

    ext = filename.rsplit('.', 1)[-1].lower() if '.' in filename else 'csv'
    if ext in ('xlsx', 'xls'):
        load_code = f"df = pd.read_excel('{filename}')"
    else:
        load_code = f"df = pd.read_csv('{filename}')"

    cells.append(_make_cell('code', f"""# Upload file in Google Colab
# from google.colab import files
# uploaded = files.upload()

{load_code}

print(f"Dataset Shape: {{df.shape[0]:,}} rows × {{df.shape[1]}} columns")
print(f"\\nColumn Types:\\n{{df.dtypes}}")
df.head()""", 2))

    # ════════════════════════════════════
    #  4. EXPLORATORY DATA ANALYSIS
    # ════════════════════════════════════
    cells.append(_make_cell('markdown', """---
## 3. 🔍 Exploratory Data Analysis (EDA)

Before cleaning, let's understand our data — its distributions, missing values, and relationships."""))

    cells.append(_make_cell('code', """# Basic statistics
print("📊 Basic Statistics:")
print(f"  Total Rows:      {len(df):,}")
print(f"  Total Columns:   {len(df.columns)}")
print(f"  Null Values:     {df.isnull().sum().sum():,}")
print(f"  Duplicate Rows:  {df.duplicated().sum():,}")
print(f"\\n📋 Column Info:")
df.info()""", 3))

    cells.append(_make_cell('code', """# Null value heatmap
plt.figure(figsize=(12, 6))
sns.heatmap(df.isnull(), cbar=True, yticklabels=False, cmap='YlOrRd')
plt.title('Missing Values Heatmap', fontsize=14, fontweight='bold')
plt.tight_layout()
plt.show()""", 4))

    cells.append(_make_cell('code', """# Distribution of numeric columns
numeric_cols = df.select_dtypes(include=[np.number]).columns.tolist()
if numeric_cols:
    n_plots = min(len(numeric_cols), 12)
    fig, axes = plt.subplots(
        nrows=(n_plots + 2) // 3, ncols=3,
        figsize=(15, 4 * ((n_plots + 2) // 3))
    )
    axes = axes.flatten() if n_plots > 1 else [axes]
    for i, col in enumerate(numeric_cols[:n_plots]):
        df[col].dropna().hist(bins=25, ax=axes[i], color='#ab3505', alpha=0.7, edgecolor='white')
        axes[i].set_title(col, fontsize=11, fontweight='bold')
        axes[i].set_ylabel('Frequency')
    for j in range(n_plots, len(axes)):
        axes[j].set_visible(False)
    plt.suptitle('Distribution of Numeric Features', fontsize=14, fontweight='bold', y=1.02)
    plt.tight_layout()
    plt.show()""", 5))

    cells.append(_make_cell('code', """# Categorical value counts
cat_cols = df.select_dtypes(include=['object', 'category']).columns.tolist()
if cat_cols:
    for col in cat_cols[:6]:
        plt.figure(figsize=(10, 4))
        vc = df[col].value_counts().head(15)
        vc.plot(kind='bar', color='#ab3505', alpha=0.8, edgecolor='white')
        plt.title(f'Value Counts: {col}', fontsize=12, fontweight='bold')
        plt.ylabel('Count')
        plt.xticks(rotation=45, ha='right')
        plt.tight_layout()
        plt.show()""", 6))

    cells.append(_make_cell('code', """# Correlation heatmap
if len(numeric_cols) >= 2:
    plt.figure(figsize=(12, 10))
    corr = df[numeric_cols].corr()
    mask = np.triu(np.ones_like(corr, dtype=bool))
    sns.heatmap(corr, mask=mask, annot=True, fmt='.2f', cmap='RdYlBu_r',
                center=0, linewidths=0.5, square=True)
    plt.title('Feature Correlation Matrix', fontsize=14, fontweight='bold')
    plt.tight_layout()
    plt.show()""", 7))

    # ════════════════════════════════════
    #  5. DATA CLEANING
    # ════════════════════════════════════
    cells.append(_make_cell('markdown', """---
## 4. 🧹 Data Cleaning

Now we apply intelligent cleaning operations. Each step includes a justification for **why** it was chosen."""))

    # Generate cleaning code from pipeline log
    clean_steps = [s for s in pipeline_log if s['category'] in ('clean', 'encode')]
    for i, step in enumerate(clean_steps):
        # Add markdown explanation
        cells.append(_make_cell('markdown', f"""### Step {i+1}: {step['step'].replace('_', ' ').title()}
> **Why?** {step['description']}"""))

        # Generate corresponding code
        code = _generate_cleaning_code(step, target)
        if code:
            cells.append(_make_cell('code', code, 8 + i))

    cells.append(_make_cell('code', f"""# Verify cleaned dataset
print(f"\\n✅ Cleaned Dataset Shape: {{df.shape[0]:,}} rows × {{df.shape[1]}} columns")
print(f"   Remaining Nulls: {{df.isnull().sum().sum()}}")
print(f"   Remaining Duplicates: {{df.duplicated().sum()}}")
df.head()""", 8 + len(clean_steps)))

    # ════════════════════════════════════
    #  6. MODEL TRAINING
    # ════════════════════════════════════
    cells.append(_make_cell('markdown', f"""---
## 5. 🤖 Model Training

We'll train multiple models and compare their performance.

- **Problem Type**: `{problem_type}`
- **Target**: `{target}`
- **Features**: {len(features_used)} numeric features
"""))

    features_str = str(features_used)
    cells.append(_make_cell('code', f"""# Prepare features and target
target_col = '{target}'
feature_cols = {features_str}

X = df[feature_cols].copy()
y = df[target_col].copy()

# Drop rows with NaN
mask = X.notna().all(axis=1) & y.notna()
X = X[mask]
y = y[mask]

print(f"Training data: {{len(X):,}} samples, {{len(feature_cols)}} features")""", 20))

    split_code = f"""# Train/Test Split (80/20)
X_train, X_test, y_train, y_test = train_test_split(
    X, y, test_size=0.2, random_state=42{", stratify=y" if problem_type == "classification" else ""}
)
print(f"Train: {{len(X_train):,}} | Test: {{len(X_test):,}}")"""
    cells.append(_make_cell('code', split_code, 21))

    cells.append(_make_cell('code', """# Feature Scaling
scaler = StandardScaler()
X_train_scaled = pd.DataFrame(scaler.fit_transform(X_train), columns=X_train.columns, index=X_train.index)
X_test_scaled = pd.DataFrame(scaler.transform(X_test), columns=X_test.columns, index=X_test.index)
print("✅ Features scaled with StandardScaler")""", 22))

    # Generate model training code
    models_in_results = training_results.get('models', [])
    model_code_lines = ["# Train and evaluate models", "results = {}", ""]

    for model in models_in_results:
        algo = model['algorithm']
        params = model.get('hyperparameters', {})
        model_code_lines.extend(_generate_model_code(algo, params, problem_type))

    model_code_lines.extend([
        "",
        "# Display results",
        "results_df = pd.DataFrame(results).T",
        "print('\\n📊 Model Comparison:')",
        "print(results_df.to_string())",
    ])

    cells.append(_make_cell('code', '\n'.join(model_code_lines), 23))

    # ════════════════════════════════════
    #  7. MODEL EVALUATION
    # ════════════════════════════════════
    cells.append(_make_cell('markdown', """---
## 6. 📈 Model Evaluation

Let's visualize the performance of our models and analyze the best one in detail."""))

    if problem_type == 'classification':
        cells.append(_make_cell('code', """# Model comparison bar chart
if results:
    metrics_to_plot = ['accuracy', 'f1_score', 'precision', 'recall']
    fig, axes = plt.subplots(1, len(metrics_to_plot), figsize=(16, 5))
    results_df = pd.DataFrame(results).T

    for i, metric in enumerate(metrics_to_plot):
        if metric in results_df.columns:
            results_df[metric].plot(kind='bar', ax=axes[i], color='#ab3505', alpha=0.8, edgecolor='white')
            axes[i].set_title(metric.replace('_', ' ').title(), fontweight='bold')
            axes[i].set_ylim(0, 1)
            axes[i].tick_params(axis='x', rotation=45)

    plt.suptitle('Model Performance Comparison', fontsize=14, fontweight='bold')
    plt.tight_layout()
    plt.show()""", 24))
    else:
        cells.append(_make_cell('code', """# Model comparison bar chart
if results:
    metrics_to_plot = ['r2_score', 'mae', 'rmse']
    fig, axes = plt.subplots(1, len(metrics_to_plot), figsize=(15, 5))
    results_df = pd.DataFrame(results).T

    for i, metric in enumerate(metrics_to_plot):
        if metric in results_df.columns:
            results_df[metric].plot(kind='bar', ax=axes[i], color='#ab3505', alpha=0.8, edgecolor='white')
            axes[i].set_title(metric.replace('_', ' ').title(), fontweight='bold')
            axes[i].tick_params(axis='x', rotation=45)

    plt.suptitle('Model Performance Comparison', fontsize=14, fontweight='bold')
    plt.tight_layout()
    plt.show()""", 24))

    # ════════════════════════════════════
    #  8. CONCLUSION
    # ════════════════════════════════════
    primary_metric_key = 'f1Score' if problem_type == 'classification' else 'r2Score'
    primary_metric_val = best_metrics.get(primary_metric_key, best_metrics.get('accuracy', 'N/A'))
    primary_metric_name = 'F1 Score' if problem_type == 'classification' else 'R² Score'

    cells.append(_make_cell('markdown', f"""---
## 7. 🏆 Conclusion

| Result | Value |
|--------|-------|
| **Best Model** | `{best_model_name}` |
| **{primary_metric_name}** | `{primary_metric_val}` |
| **Problem Type** | `{problem_type}` |
| **Features Used** | {len(features_used)} |
| **Training Samples** | {after_summary.get('rows', 'N/A')} |

---

### 🎯 Next Steps

1. **Feature Engineering** — Create interaction features or polynomial features to improve performance.
2. **Hyperparameter Tuning** — Use `GridSearchCV` or `RandomizedSearchCV` for fine-tuning.
3. **Cross-Validation** — Use k-fold cross-validation for more robust evaluation.
4. **Ensemble Methods** — Try stacking or blending multiple models.

---

*Generated by ML Yantra AutoPilot — Your AI-powered ML assistant* 🚀
"""))

    # ════════════════════════════════════
    #  ASSEMBLE NOTEBOOK
    # ════════════════════════════════════
    notebook = {
        'nbformat': 4,
        'nbformat_minor': 5,
        'metadata': {
            'kernelspec': {
                'display_name': 'Python 3',
                'language': 'python',
                'name': 'python3'
            },
            'language_info': {
                'name': 'python',
                'version': '3.10.0',
                'mimetype': 'text/x-python',
                'file_extension': '.py'
            },
            'colab': {
                'provenance': [],
                'name': f'ML_Yantra_AutoPilot_{filename}'
            }
        },
        'cells': cells
    }

    return notebook


def _generate_cleaning_code(step: Dict, target: str) -> Optional[str]:
    """Generate Python code corresponding to a pipeline cleaning step"""
    step_name = step['step']
    details = step.get('details', {})

    if step_name == 'remove_duplicates':
        return f"""# Remove duplicate rows
before = len(df)
df = df.drop_duplicates().reset_index(drop=True)
print(f"Removed {{before - len(df)}} duplicate rows. Remaining: {{len(df):,}}")"""

    elif step_name == 'drop_sparse_columns':
        cols = details.get('dropped', [])
        if cols:
            return f"""# Drop columns with >60% null values (too sparse to impute reliably)
cols_to_drop = {cols}
df = df.drop(columns=[c for c in cols_to_drop if c in df.columns])
print(f"Dropped {{len(cols_to_drop)}} sparse columns. Remaining: {{len(df.columns)}} columns")"""

    elif step_name == 'drop_id_columns':
        cols = details.get('dropped', [])
        if cols:
            return f"""# Drop ID-like columns (unique per row, no predictive value)
id_cols = {cols}
df = df.drop(columns=[c for c in id_cols if c in df.columns])
print(f"Dropped {{len(id_cols)}} ID column(s)")"""

    elif step_name == 'drop_target_nulls':
        return f"""# Drop rows where target column is null (can't train on unknown outcomes)
before = len(df)
df = df.dropna(subset=['{target}']).reset_index(drop=True)
print(f"Dropped {{before - len(df)}} rows with null target values")"""

    elif step_name == 'handle_nulls':
        actions = details.get('actions', [])
        code_lines = ["# Handle null values in feature columns"]
        code_lines.append("for col in df.columns:")
        code_lines.append("    null_count = df[col].isnull().sum()")
        code_lines.append("    if null_count == 0:")
        code_lines.append("        continue")
        code_lines.append("    if pd.api.types.is_numeric_dtype(df[col]):")
        code_lines.append("        skewness = abs(df[col].skew()) if df[col].notna().sum() > 2 else 2.0")
        code_lines.append("        if skewness > 1.0:")
        code_lines.append("            fill_val = df[col].median()")
        code_lines.append("            df[col] = df[col].fillna(fill_val)")
        code_lines.append("            print(f\"  {col}: filled {null_count} nulls with median ({fill_val:.4f}) — skewed\")")
        code_lines.append("        else:")
        code_lines.append("            fill_val = df[col].mean()")
        code_lines.append("            df[col] = df[col].fillna(fill_val)")
        code_lines.append("            print(f\"  {col}: filled {null_count} nulls with mean ({fill_val:.4f}) — symmetric\")")
        code_lines.append("    else:")
        code_lines.append("        mode_val = df[col].mode()")
        code_lines.append("        if not mode_val.empty:")
        code_lines.append("            df[col] = df[col].fillna(mode_val.iloc[0])")
        code_lines.append("            print(f\"  {col}: filled {null_count} nulls with mode ({mode_val.iloc[0]})\")")
        code_lines.append("")
        code_lines.append(f"print(f\"\\nRemaining nulls: {{df.isnull().sum().sum()}}\")")
        return '\n'.join(code_lines)

    elif step_name == 'encode_categoricals':
        code_lines = ["# Encode categorical columns"]
        code_lines.append("cat_cols = df.select_dtypes(include=['object', 'category', 'string']).columns.tolist()")
        code_lines.append("for col in cat_cols:")
        code_lines.append("    n_unique = df[col].nunique()")
        code_lines.append("    if n_unique > 50:")
        code_lines.append("        df = df.drop(columns=[col])")
        code_lines.append("        print(f\"  Dropped '{col}' — {n_unique} unique values (too high cardinality)\")")
        code_lines.append("    elif n_unique <= 6:")
        code_lines.append("        dummies = pd.get_dummies(df[col], prefix=col, dtype=int)")
        code_lines.append("        df = pd.concat([df.drop(columns=[col]), dummies], axis=1)")
        code_lines.append("        print(f\"  One-hot encoded '{col}' ({n_unique} categories)\")")
        code_lines.append("    else:")
        code_lines.append("        le = LabelEncoder()")
        code_lines.append("        df[col] = le.fit_transform(df[col].astype(str))")
        code_lines.append("        print(f\"  Label encoded '{col}' ({n_unique} categories)\")")
        return '\n'.join(code_lines)

    elif step_name == 'remove_outliers':
        return """# Remove extreme outliers using IQR method (3x IQR — conservative)
numeric_features = df.select_dtypes(include=[np.number]).columns.tolist()
rows_before = len(df)
for col in numeric_features:
    col_data = df[col].dropna()
    if len(col_data) < 10:
        continue
    Q1 = col_data.quantile(0.25)
    Q3 = col_data.quantile(0.75)
    IQR = Q3 - Q1
    if IQR == 0:
        continue
    lower = Q1 - 3.0 * IQR
    upper = Q3 + 3.0 * IQR
    outlier_count = ((col_data < lower) | (col_data > upper)).sum()
    if outlier_count > 0 and outlier_count / len(col_data) < 0.1:
        mask = df[col].between(lower, upper) | df[col].isna()
        df = df[mask].reset_index(drop=True)

print(f"Removed {rows_before - len(df)} outlier rows. Remaining: {len(df):,}")"""

    elif step_name == 'convert_dates':
        cols = details.get('columns', [])
        code_lines = ["# Convert date columns to numeric components"]
        for col in cols:
            code_lines.append(f"if '{col}' in df.columns:")
            code_lines.append(f"    df['{col}'] = pd.to_datetime(df['{col}'], errors='coerce')")
            code_lines.append(f"    df['{col}_year'] = df['{col}'].dt.year")
            code_lines.append(f"    df['{col}_month'] = df['{col}'].dt.month")
            code_lines.append(f"    df['{col}_day'] = df['{col}'].dt.day")
            code_lines.append(f"    df = df.drop(columns=['{col}'])")
            code_lines.append(f"    print(f\"Extracted year/month/day from '{col}'\")")
        return '\n'.join(code_lines)

    return None


def _generate_model_code(algorithm: str, params: Dict, problem_type: str) -> List[str]:
    """Generate Python code to train a specific model"""
    lines = []
    name_map = {
        'logistic_regression': ('LogisticRegression', 'Logistic Regression'),
        'linear_regression': ('LinearRegression', 'Linear Regression'),
        'decision_tree': ('DecisionTreeClassifier' if problem_type == 'classification' else 'DecisionTreeRegressor', 'Decision Tree'),
        'random_forest': ('RandomForestClassifier' if problem_type == 'classification' else 'RandomForestRegressor', 'Random Forest'),
        'svm': ('SVC', 'SVM'),
        'svr': ('SVR', 'SVR'),
        'xgboost': ('XGBClassifier' if problem_type == 'classification' else 'XGBRegressor', 'XGBoost'),
    }

    class_name, display_name = name_map.get(algorithm, (algorithm, algorithm))
    var_name = algorithm.replace(' ', '_').lower()

    params_str = ', '.join([f'{k}={repr(v)}' for k, v in params.items()])
    if params_str:
        params_str = ', ' + params_str

    lines.append(f"# --- {display_name} ---")

    if algorithm == 'xgboost':
        lines.append(f"if HAS_XGBOOST:")
        lines.append(f"    model_{var_name} = {class_name}(random_state=42{params_str})")
        lines.append(f"    model_{var_name}.fit(X_train_scaled, y_train)")
        lines.append(f"    y_pred = model_{var_name}.predict(X_test_scaled)")
    else:
        lines.append(f"model_{var_name} = {class_name}(random_state=42{params_str})")
        lines.append(f"model_{var_name}.fit(X_train_scaled, y_train)")
        lines.append(f"y_pred = model_{var_name}.predict(X_test_scaled)")

    if problem_type == 'classification':
        indent = "    " if algorithm == 'xgboost' else ""
        lines.append(f"{indent}results['{display_name}'] = {{")
        lines.append(f"{indent}    'accuracy': round(accuracy_score(y_test, y_pred), 4),")
        lines.append(f"{indent}    'f1_score': round(precision_recall_fscore_support(y_test, y_pred, average='weighted', zero_division=0)[2], 4),")
        lines.append(f"{indent}    'precision': round(precision_recall_fscore_support(y_test, y_pred, average='weighted', zero_division=0)[0], 4),")
        lines.append(f"{indent}    'recall': round(precision_recall_fscore_support(y_test, y_pred, average='weighted', zero_division=0)[1], 4),")
        lines.append(f"{indent}}}")
    else:
        indent = "    " if algorithm == 'xgboost' else ""
        lines.append(f"{indent}results['{display_name}'] = {{")
        lines.append(f"{indent}    'r2_score': round(r2_score(y_test, y_pred), 4),")
        lines.append(f"{indent}    'mae': round(mean_absolute_error(y_test, y_pred), 4),")
        lines.append(f"{indent}    'rmse': round(np.sqrt(mean_squared_error(y_test, y_pred)), 4),")
        lines.append(f"{indent}}}")

    lines.append(f"print(f'✅ {display_name} trained')")
    lines.append("")

    return lines
