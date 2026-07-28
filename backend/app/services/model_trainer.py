"""
Model Trainer Service
Handles ML model training, evaluation, and metrics calculation
With built-in imbalanced dataset handling (SMOTE, stratified split, class weights)
"""

import numpy as np
import pandas as pd
from sklearn.model_selection import train_test_split
from sklearn.preprocessing import StandardScaler, MinMaxScaler
from sklearn.linear_model import LogisticRegression, LinearRegression
from sklearn.ensemble import RandomForestClassifier, RandomForestRegressor
from sklearn.tree import DecisionTreeClassifier, DecisionTreeRegressor
from sklearn.svm import SVC, SVR
from xgboost import XGBRegressor
from sklearn.metrics import (
    accuracy_score,
    precision_recall_fscore_support,
    confusion_matrix,
    r2_score,
    mean_absolute_error,
    mean_squared_error,
    mean_absolute_percentage_error,
    log_loss,
    roc_auc_score
)
import time
import uuid
from typing import Dict, List, Tuple, Any, Optional

# Algorithm definitions
CLASSIFICATION_ALGORITHMS = {
    'logistic_regression': lambda: LogisticRegression(max_iter=1000, class_weight='balanced', random_state=42),
    'random_forest': lambda: RandomForestClassifier(n_estimators=100, max_depth=12, min_samples_split=5, class_weight='balanced', random_state=42, n_jobs=-1),
    'decision_tree': lambda: DecisionTreeClassifier(max_depth=10, min_samples_split=5, class_weight='balanced', random_state=42),
    'svm': lambda: SVC(kernel='rbf', class_weight='balanced', random_state=42, probability=True)
}

REGRESSION_ALGORITHMS = {
    'linear_regression': lambda: LinearRegression(),
    'random_forest': lambda: RandomForestRegressor(n_estimators=100, max_depth=12, min_samples_split=5, random_state=42, n_jobs=-1),
    'decision_tree': lambda: DecisionTreeRegressor(max_depth=10, min_samples_split=5, random_state=42),
    'svr': lambda: SVR(kernel='rbf'),
    'xgboost': lambda: XGBRegressor(n_estimators=100, max_depth=6, learning_rate=0.1, random_state=42, verbosity=0, n_jobs=-1)
}

ALGORITHM_NAMES = {
    'logistic_regression': 'Logistic Regression',
    'random_forest': 'Random Forest',
    'decision_tree': 'Decision Tree',
    'svm': 'Support Vector Machine',
    'linear_regression': 'Linear Regression',
    'svr': 'Support Vector Regression',
    'xgboost': 'XGBoost'
}


class ModelTrainer:
    """Service for training and evaluating ML models"""
    
    def __init__(self):
        self.scalers = {}
    
    def _detect_imbalance(self, y: pd.Series) -> Dict[str, Any]:
        """
        Detect class imbalance in target variable.
        Returns imbalance info dict with class distribution and ratio.
        """
        value_counts = y.value_counts()
        total = len(y)
        
        # Calculate class distribution as percentages
        class_distribution = {
            str(cls): round(count / total * 100, 2) 
            for cls, count in value_counts.items()
        }
        
        # Imbalance ratio = majority / minority
        majority_count = value_counts.iloc[0]
        minority_count = value_counts.iloc[-1]
        imbalance_ratio = round(majority_count / minority_count, 1) if minority_count > 0 else float('inf')
        
        return {
            'class_distribution': class_distribution,
            'imbalance_ratio': imbalance_ratio,
            'is_imbalanced': imbalance_ratio > 3.0,  # flag as imbalanced if ratio > 3:1
            'is_severely_imbalanced': imbalance_ratio > 10.0  # severe if > 10:1
        }
    
    def _apply_smote(self, X_train: pd.DataFrame, y_train: pd.Series) -> Tuple[pd.DataFrame, pd.Series]:
        """
        Apply SMOTE (Synthetic Minority Over-sampling Technique) to balance training data.
        Only applied to training set — never to test set.
        """
        try:
            from imblearn.over_sampling import SMOTE
            
            # Auto-determine k_neighbors based on minority class size
            minority_count = y_train.value_counts().min()
            k_neighbors = min(5, minority_count - 1) if minority_count > 1 else 1
            
            if k_neighbors < 1:
                return X_train, y_train
            
            smote = SMOTE(random_state=42, k_neighbors=k_neighbors)
            X_resampled, y_resampled = smote.fit_resample(X_train, y_train)
            
            return pd.DataFrame(X_resampled, columns=X_train.columns), pd.Series(y_resampled, name=y_train.name)
        except Exception as e:
            # If SMOTE fails for any reason, proceed without it
            print(f"SMOTE could not be applied: {e}")
            return X_train, y_train
    
    def train_models(
        self,
        df: pd.DataFrame,
        features: List[str],
        target: str,
        problem_type: str,
        algorithms: List[str],
        train_test_split_ratio: float = 0.8,
        validation_split: float = 0.0,
        scaling: bool = True
    ) -> Dict[str, Any]:
        """
        Train multiple ML models and evaluate them.
        Automatically detects and handles class imbalance via SMOTE + stratified splitting.
        Supports optional 3-way split: train / test / validation.
        """
        # Prepare data
        X = df[features].copy()
        y = df[target].copy()

        # Replace inf/-inf with NaN
        X = X.replace([np.inf, -np.inf], np.nan)

        # Attempt to coerce any string-numeric columns (e.g., "9,44,999")
        for col in X.columns:
            if X[col].dtype == 'object':
                try:
                    X[col] = X[col].str.replace(r'[₹$€£¥,\s]', '', regex=True)
                    X[col] = pd.to_numeric(X[col], errors='coerce')
                except Exception:
                    pass

        # Handle missing values (drop rows with NaN)
        mask = X.notna().all(axis=1) & y.notna()
        X = X[mask]
        y = y[mask]
        
        if X.empty:
            raise ValueError("Dataset is empty after dropping missing values. Please clean missing data first.")
            
        # Hard cap dataset size for training to prevent server lock-ups on massive datasets
        if len(X) > 20000:
            # Use stratified sampling if classification to preserve class ratios
            if problem_type == 'classification':
                from sklearn.model_selection import train_test_split as stratified_sample
                _, X_sampled, _, y_sampled = stratified_sample(
                    X, y, test_size=20000/len(X), random_state=42, stratify=y
                )
                X = X_sampled
                y = y_sampled
            else:
                sample_idx = X.sample(n=20000, random_state=42).index
                X = X.loc[sample_idx]
                y = y.loc[sample_idx]
            
        categorical_cols = X.select_dtypes(include=['object', 'string', 'category']).columns
        if len(categorical_cols) > 0:
            raise ValueError(f"Cannot train models on string/categorical columns ({', '.join(categorical_cols)})... Please encode them first.")
        
        # Detect class imbalance (classification only)
        imbalance_info = None
        smote_applied = False
        if problem_type == 'classification':
            imbalance_info = self._detect_imbalance(y)
        
        # === 3-WAY SPLIT: Train / Test / Validation ===
        X_val, y_val = None, None
        
        if validation_split > 0:
            # First split off the validation set
            if problem_type == 'classification':
                X_remaining, X_val, y_remaining, y_val = train_test_split(
                    X, y, test_size=validation_split, random_state=42, stratify=y
                )
            else:
                X_remaining, X_val, y_remaining, y_val = train_test_split(
                    X, y, test_size=validation_split, random_state=42
                )
            
            # Now split remaining into train and test
            adjusted_test_ratio = (1 - train_test_split_ratio) / (1 - validation_split)
            adjusted_test_ratio = min(max(adjusted_test_ratio, 0.05), 0.5)  # clamp to safe range
            
            if problem_type == 'classification':
                X_train, X_test, y_train, y_test = train_test_split(
                    X_remaining, y_remaining, test_size=adjusted_test_ratio, random_state=42, stratify=y_remaining
                )
            else:
                X_train, X_test, y_train, y_test = train_test_split(
                    X_remaining, y_remaining, test_size=adjusted_test_ratio, random_state=42
                )
        else:
            # Standard 2-way split
            if problem_type == 'classification':
                X_train, X_test, y_train, y_test = train_test_split(
                    X, y, test_size=(1 - train_test_split_ratio), random_state=42, stratify=y
                )
            else:
                X_train, X_test, y_train, y_test = train_test_split(
                    X, y, test_size=(1 - train_test_split_ratio), random_state=42
                )
        
        # Apply SMOTE if imbalanced classification (on training data only)
        if imbalance_info and imbalance_info['is_imbalanced']:
            X_train, y_train = self._apply_smote(X_train, y_train)
            smote_applied = True
        
        # Apply scaling if requested
        scaler = None
        if scaling:
            scaler = StandardScaler()
            X_train = pd.DataFrame(
                scaler.fit_transform(X_train),
                columns=X_train.columns,
                index=X_train.index
            )
            X_test = pd.DataFrame(
                scaler.transform(X_test),
                columns=X_test.columns,
                index=X_test.index
            )
        
        # Get algorithm pool based on problem type
        if problem_type == 'classification':
            algo_pool = CLASSIFICATION_ALGORITHMS
        else:
            algo_pool = REGRESSION_ALGORITHMS
        
        # If no specific algorithms requested, train all for the problem type
        if not algorithms:
            algorithms = list(algo_pool.keys())
        
        # Train models
        results = []
        trained_models = {}
        
        for algo_id in algorithms:
            if algo_id not in algo_pool:
                continue
            
            start_time = time.time()
            
            # Create and train model
            model = algo_pool[algo_id]()
            
            # Prevent SVM from infinite hangs on huge datasets by capping training rows to 10k
            if algo_id in ['svm', 'svr'] and len(X_train) > 10000:
                X_train_fit = X_train.sample(n=10000, random_state=42)
                y_train_fit = y_train.loc[X_train_fit.index]
                model.fit(X_train_fit, y_train_fit)
            else:
                model.fit(X_train, y_train)
            
            # Make predictions
            y_pred = model.predict(X_test)
            
            training_time = time.time() - start_time
            
            # Calculate metrics
            metrics = self._calculate_metrics(
                y_test, y_pred, problem_type, model, X_test, len(features)
            )
            
            # Get feature importance if available
            feature_importance = self._get_feature_importance(
                model, features
            )
            
            # Get confusion matrix for classification
            conf_matrix = None
            if problem_type == 'classification':
                conf_matrix = confusion_matrix(y_test, y_pred).tolist()
            
            model_id = str(uuid.uuid4())
            
            results.append({
                'modelId': model_id,
                'name': ALGORITHM_NAMES.get(algo_id, algo_id),
                'algorithm': algo_id,
                'metrics': metrics,
                'confusionMatrix': conf_matrix,
                'featureImportance': feature_importance,
                'trainingTime': round(training_time, 3),
                'isBest': False
            })
            
            # Store trained model
            trained_models[model_id] = {
                'model': model,
                'scaler': scaler,
                'features': features,
                'target': target
            }
        
        # Determine best model
        # For imbalanced classification: rank by F1 Score (much more meaningful than accuracy)
        # For balanced classification: rank by accuracy
        # For regression: rank by R² Score
        if results:
            if problem_type == 'classification':
                if imbalance_info and imbalance_info['is_imbalanced']:
                    # Imbalanced: Use F1 Score as primary metric
                    best_idx = max(range(len(results)), key=lambda i: results[i]['metrics']['f1Score'] or 0)
                else:
                    # Balanced: Use Accuracy
                    best_idx = max(range(len(results)), key=lambda i: results[i]['metrics']['accuracy'] or 0)
            else:
                best_idx = max(range(len(results)), key=lambda i: results[i]['metrics']['r2Score'] or 0)
            
            results[best_idx]['isBest'] = True
            best_model_id = results[best_idx]['modelId']
        else:
            best_model_id = None
        
        training_id = str(uuid.uuid4())
        
        response = {
            'trainingId': training_id,
            'problemType': problem_type,
            'models': results,
            'bestModel': best_model_id,
            'trained_models': trained_models
        }
        
        # Attach imbalance metadata if classification
        if imbalance_info:
            response['classDistribution'] = imbalance_info['class_distribution']
            response['imbalanceRatio'] = imbalance_info['imbalance_ratio']
            response['smoteApplied'] = smote_applied
        
        # === VALIDATION SET METRICS ===
        # If a validation split was requested, evaluate the best model on the held-out validation set
        if X_val is not None and y_val is not None and best_model_id and best_model_id in trained_models:
            best_model_data = trained_models[best_model_id]
            best_model = best_model_data['model']
            
            # Apply same scaling to validation set
            X_val_scaled = X_val
            if scaler is not None:
                X_val_scaled = pd.DataFrame(
                    scaler.transform(X_val),
                    columns=X_val.columns,
                    index=X_val.index
                )
            
            y_val_pred = best_model.predict(X_val_scaled)
            val_metrics = self._calculate_metrics(
                y_val.values, y_val_pred, problem_type, best_model, X_val_scaled, len(features)
            )
            
            val_conf_matrix = None
            if problem_type == 'classification':
                val_conf_matrix = confusion_matrix(y_val, y_val_pred).tolist()
            
            response['validationMetrics'] = {
                'metrics': val_metrics,
                'confusionMatrix': val_conf_matrix,
                'validationRows': len(y_val),
                'bestModelName': ALGORITHM_NAMES.get(results[best_idx]['algorithm'], results[best_idx]['algorithm'])
            }
        
        return response
    
    def _calculate_metrics(
        self,
        y_true: np.ndarray,
        y_pred: np.ndarray,
        problem_type: str,
        model: Any = None,
        X_test: np.ndarray = None,
        n_features: int = 1
    ) -> Dict[str, Optional[float]]:
        """Calculate metrics based on problem type"""
        
        if problem_type == 'classification':
            precision, recall, f1, _ = precision_recall_fscore_support(
                y_true, y_pred, average='weighted', zero_division=0
            )
            
            # ROC AUC (needs predict_proba)
            roc_auc = None
            log_loss_val = None
            try:
                if model is not None and hasattr(model, 'predict_proba') and X_test is not None:
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
                'r2Score': None,
                'mae': None,
                'rmse': None,
                'mape': None,
                'mse': None,
                'adjR2': None
            }
        else:  # regression
            r2 = r2_score(y_true, y_pred)
            mae = mean_absolute_error(y_true, y_pred)
            mse = mean_squared_error(y_true, y_pred)
            rmse = np.sqrt(mse)
            
            # Adjusted R²
            n = len(y_true)
            p = n_features
            if n > p + 1:
                adj_r2 = 1 - (1 - r2) * (n - 1) / (n - p - 1)
            else:
                adj_r2 = r2
            
            # Calculate MAPE safely (avoid division by zero)
            try:
                mape = mean_absolute_percentage_error(y_true, y_pred)
            except Exception:
                mape = None
            
            return {
                'accuracy': None,
                'precision': None,
                'recall': None,
                'f1Score': None,
                'rocAuc': None,
                'logLoss': None,
                'r2Score': round(r2, 4),
                'adjR2': round(adj_r2, 4),
                'mae': round(mae, 4),
                'mse': round(mse, 4),
                'rmse': round(rmse, 4),
                'mape': round(mape, 4) if mape is not None else None
            }
    
    def _get_feature_importance(
        self,
        model: Any,
        features: List[str]
    ) -> Optional[Dict[str, float]]:
        """Extract feature importance from tree-based models"""
        
        if hasattr(model, 'feature_importances_'):
            importances = model.feature_importances_
            return {
                feature: round(float(importance), 4)
                for feature, importance in zip(features, importances)
            }
        
        return None


# Global instance
model_trainer = ModelTrainer()
