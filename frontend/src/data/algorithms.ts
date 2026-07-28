// Algorithm definitions for model selection
import type { AlgorithmInfo } from '../types/training'

export const CLASSIFICATION_ALGORITHMS: AlgorithmInfo[] = [
    {
        id: 'logistic_regression',
        name: 'Logistic Regression',
        type: 'classification',
        description: 'Linear model for binary and multiclass classification',
        icon: 'analytics',
        pros: ['Fast training', 'Interpretable', 'Works well with linearly separable data'],
        cons: ['Linear decision boundary', 'May underfit complex patterns'],
        useCase: 'Customer churn prediction, spam detection',
    },
    {
        id: 'random_forest',
        name: 'Random Forest',
        type: 'both',
        description: 'Ensemble of decision trees for robust predictions',
        icon: 'forest',
        pros: ['Handles non-linear data', 'Robust to overfitting', 'Feature importance'],
        cons: ['Slower training', 'Less interpretable', 'Large model size'],
        useCase: 'General-purpose classification, feature ranking',
    },
    {
        id: 'decision_tree',
        name: 'Decision Tree',
        type: 'both',
        description: 'Tree-based model with interpretable rules',
        icon: 'account_tree',
        pros: ['Highly interpretable', 'No feature scaling needed', 'Handles categorical data'],
        cons: ['Prone to overfitting', 'Unstable with small changes'],
        useCase: 'Rule-based decisions, medical diagnosis',
    },
    {
        id: 'svm',
        name: 'Support Vector Machine',
        type: 'classification',
        description: 'Finds optimal hyperplane for class separation',
        icon: 'water_drop',
        pros: ['Effective in high dimensions', 'Kernel trick for non-linear data'],
        cons: ['Slow on large datasets', 'Requires feature scaling'],
        useCase: 'Text classification, image recognition',
    },
]

export const REGRESSION_ALGORITHMS: AlgorithmInfo[] = [
    {
        id: 'linear_regression',
        name: 'Linear Regression',
        type: 'regression',
        description: 'Simple linear model for continuous predictions',
        icon: 'show_chart',
        pros: ['Fast', 'Interpretable', 'Works well with linear relationships'],
        cons: ['Assumes linearity', 'Sensitive to outliers'],
        useCase: 'House price prediction, sales forecasting',
    },
    {
        id: 'random_forest',
        name: 'Random Forest',
        type: 'both',
        description: 'Ensemble of decision trees for robust predictions',
        icon: 'forest',
        pros: ['Handles non-linear data', 'Robust', 'Feature importance'],
        cons: ['Slower', 'Less interpretable'],
        useCase: 'General-purpose regression',
    },
    {
        id: 'decision_tree',
        name: 'Decision Tree',
        type: 'both',
        description: 'Tree-based model with interpretable rules',
        icon: 'account_tree',
        pros: ['Interpretable', 'No scaling needed'],
        cons: ['Overfitting', 'Unstable'],
        useCase: 'Rule-based predictions',
    },
    {
        id: 'svr',
        name: 'Support Vector Regression',
        type: 'regression',
        description: 'SVM adapted for regression tasks',
        icon: 'water_drop',
        pros: ['Robust to outliers', 'Works in high dimensions'],
        cons: ['Slow on large data', 'Requires scaling'],
        useCase: 'Time series forecasting',
    },
    {
        id: 'xgboost',
        name: 'XGBoost',
        type: 'both',
        description: 'Gradient boosting for high performance',
        icon: 'rocket_launch',
        pros: ['State-of-the-art accuracy', 'Handles missing values', 'Regularization'],
        cons: ['Complex tuning', 'Longer training time'],
        useCase: 'Kaggle competitions, production ML',
    },
]

export function getAlgorithms(problemType: 'classification' | 'regression'): AlgorithmInfo[] {
    if (problemType === 'classification') {
        return CLASSIFICATION_ALGORITHMS
    } else {
        return REGRESSION_ALGORITHMS
    }
}
