import pytest
import pandas as pd
import numpy as np
from app.services.model_trainer import ModelTrainer

def test_empty_dataset_raises_error():
    trainer = ModelTrainer()
    # Create dataset with all NaNs
    df = pd.DataFrame({'f1': [np.nan, np.nan], 't': [np.nan, np.nan]})
    with pytest.raises(ValueError, match="Dataset is empty after dropping missing values"):
        trainer.train_models(df, ['f1'], 't', 'regression', ['linear_regression'])

def test_categorical_column_raises_error():
    trainer = ModelTrainer()
    # Create dataset with strings
    df = pd.DataFrame({'f1': ['a', 'b', 'c'], 't': [1, 2, 3]})
    with pytest.raises(ValueError, match="Cannot train models on string/categorical columns"):
        trainer.train_models(df, ['f1'], 't', 'regression', ['linear_regression'])
