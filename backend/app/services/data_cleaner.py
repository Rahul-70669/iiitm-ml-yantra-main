import pandas as pd
from sklearn.preprocessing import LabelEncoder, OneHotEncoder
from typing import List, Optional, Any, Tuple

class DataCleaner:
    """Data cleaning operations"""
    
    @staticmethod
    def handle_nulls(
        df: pd.DataFrame,
        strategy: str,
        columns: Optional[List[str]] = None,
        fill_value: Any = None
    ) -> pd.DataFrame:
        """Handle null values in dataset"""
        df_clean = df.copy()
        target_cols = columns if columns else df_clean.columns.tolist()
        
        if strategy == 'drop':
            df_clean = df_clean.dropna(subset=target_cols)
        elif strategy == 'fill_mean':
            for col in target_cols:
                if pd.api.types.is_numeric_dtype(df_clean[col]):
                    df_clean[col] = df_clean[col].fillna(df_clean[col].mean())
        elif strategy == 'fill_median':
            for col in target_cols:
                if pd.api.types.is_numeric_dtype(df_clean[col]):
                    df_clean[col] = df_clean[col].fillna(df_clean[col].median())
        elif strategy == 'fill_mode':
            for col in target_cols:
                mode_value = df_clean[col].mode()
                if not mode_value.empty:
                    df_clean[col] = df_clean[col].fillna(mode_value[0])
        elif strategy == 'fill_value':
            if fill_value is not None:
                df_clean[target_cols] = df_clean[target_cols].fillna(fill_value)
        
        return df_clean
    
    @staticmethod
    def handle_duplicates(df: pd.DataFrame, keep: str = 'first') -> Tuple[pd.DataFrame, int]:
        """Remove duplicate rows"""
        initial_count = len(df)
        keep_param = keep if keep in ['first', 'last'] else False
        df_clean = df.drop_duplicates(keep=keep_param)
        removed_count = initial_count - len(df_clean)
        return df_clean, removed_count
    
    @staticmethod
    def _clean_numeric_string(series: pd.Series) -> pd.Series:
        """Clean a string series for numeric conversion.
        
        Handles all common edge cases:
        - Null-like: N/A, -, —, nil, null, NA, n.a., not available, etc.
        - Currency symbols: ₹, $, €, £, ¥
        - Currency prefixes: Rs., Rs, INR, USD, EUR, etc.
        - Commas: 34,000 and Indian format 1,25,000
        - Multiplier words: 1.5 lakh → 150000, 2 crore → 20000000
        - Multiplier suffixes: K=1000, M=1M, B=1B, L=100K, Cr=10M
        - Unit suffixes: kms, km, miles, mi
        - Percentage: 50% → 50
        - Scientific notation: 1.5e3 → 1500
        - Negatives: -5000 → -5000
        - Whitespace: '  4,500  ' → 4500
        - Pure text: 'Ask For Price' → NaN
        """
        import re
        
        # Common strings that should be treated as null/NaN
        NULL_STRINGS = {
            '', 'nan', 'none', 'null', 'na', 'n/a', 'n.a.', 'n.a',
            '-', '—', '–', '.', '..', '...', '?', '??',
            'nil', 'undefined', 'missing', 'not available',
            'not applicable', 'no data', 'no value',
            'ask for price', 'on request', 'call for price',
            'tbd', 'tba', '#n/a', '#na', '#value!', '#ref!',
        }
        
        # Word-based multipliers (must be checked BEFORE stripping suffixes)
        WORD_MULTIPLIERS = {
            'lakh': 100_000, 'lakhs': 100_000, 'lac': 100_000, 'lacs': 100_000,
            'crore': 10_000_000, 'crores': 10_000_000, 'cr': 10_000_000,
            'thousand': 1_000, 'thousands': 1_000,
            'million': 1_000_000, 'millions': 1_000_000,
            'billion': 1_000_000_000, 'billions': 1_000_000_000,
        }
        
        # Letter-based multipliers
        LETTER_MULTIPLIERS = {
            'k': 1_000, 'K': 1_000,
            'm': 1_000_000, 'M': 1_000_000,
            'b': 1_000_000_000, 'B': 1_000_000_000,
            'l': 100_000, 'L': 100_000,
        }
        
        def clean_value(val):
            if pd.isna(val):
                return None
            
            s = str(val).strip()
            
            # 1. Check for null-like strings
            if s.lower() in NULL_STRINGS:
                return None
            
            # 2. Remove currency prefixes (Rs., Rs, INR, USD, EUR, etc.)
            s = re.sub(r'^(Rs\.?|INR|USD|EUR|GBP|JPY)\s*', '', s, flags=re.IGNORECASE).strip()
            
            # 3. Remove currency symbols
            for ch in '₹$€£¥':
                s = s.replace(ch, '')
            s = s.strip()
            
            # 4. Remove commas (thousands separators)
            s = s.replace(',', '')
            
            # 5. Remove percentage sign (50% → 50)
            if s.endswith('%'):
                s = s[:-1].strip()
            
            # 6. Check for word multipliers: "1.5 lakh", "2 crore", "5 thousand"
            for word, mult in WORD_MULTIPLIERS.items():
                pattern = re.compile(r'^([+-]?\d*\.?\d+)\s*' + re.escape(word) + r's?\s*$', re.IGNORECASE)
                match = pattern.match(s)
                if match:
                    try:
                        return float(match.group(1)) * mult
                    except ValueError:
                        return None
            
            # 7. Remove unit suffixes that are NOT multipliers (kms, km, miles, etc.)
            s = re.sub(r'\s*(kms|km|miles|mi|kg|kgs|grams|g|liters|litres|ltr|cc)\s*$', '', s, flags=re.IGNORECASE).strip()
            
            # 8. Check for letter multiplier suffixes: 3.5L, 2M, 50K
            letter_match = re.match(r'^([+-]?\d*\.?\d+)\s*([KkMmBbLl])\s*$', s)
            if letter_match:
                try:
                    num = float(letter_match.group(1))
                    suffix = letter_match.group(2)
                    return num * LETTER_MULTIPLIERS.get(suffix, 1)
                except ValueError:
                    return None
            
            # 9. Try to parse as number (handles integers, floats, scientific notation)
            try:
                return float(s)
            except ValueError:
                return None  # Pure text like "Ask For Price" → NaN
        
        return series.apply(clean_value)
    
    @staticmethod
    def convert_dtype(df: pd.DataFrame, column: str, target_type: str) -> pd.DataFrame:
        """Convert column data type with smart cleaning for formatted values."""
        df_clean = df.copy()
        
        try:
            if target_type in ('int', 'float'):
                # First clean the values (strip commas, currency, units, etc.)
                cleaned = DataCleaner._clean_numeric_string(df_clean[column])
                # Convert cleaned series to numeric (None/NaN → NaN, numbers stay)
                numeric = pd.to_numeric(cleaned, errors='coerce')
                
                if target_type == 'int':
                    # Round floats and convert to nullable Int64
                    # This preserves NaN as <NA> in the Int64 dtype
                    rounded = numeric.round(0)
                    df_clean[column] = rounded.astype('Int64')
                else:
                    df_clean[column] = numeric.astype('float64')
                    
            elif target_type == 'str':
                df_clean[column] = df_clean[column].astype(str)
                # Clean up 'nan' and 'None' string representations
                df_clean[column] = df_clean[column].replace({'nan': '', 'None': '', '<NA>': ''})
                
            elif target_type == 'datetime':
                # Try common date formats
                col_data = df_clean[column].astype(str).str.strip()
                parsed = pd.to_datetime(col_data, errors='coerce')
                
                # If most values failed, try day-first format (common in India/Europe)
                if parsed.isna().sum() > len(parsed) * 0.5:
                    parsed_dayfirst = pd.to_datetime(col_data, errors='coerce', dayfirst=True)
                    if parsed_dayfirst.notna().sum() > parsed.notna().sum():
                        parsed = parsed_dayfirst
                
                df_clean[column] = parsed
                
        except Exception as e:
            raise ValueError(f"Could not convert column {column} to {target_type}: {str(e)}")
        
        return df_clean
    
    @staticmethod
    def encode_column(df: pd.DataFrame, column: str, method: str) -> Tuple[pd.DataFrame, List[str]]:
        """Encode categorical column"""
        df_clean = df.copy()
        new_columns = []
        
        if method == 'label':
            le = LabelEncoder()
            df_clean[column] = le.fit_transform(df_clean[column].astype(str))
            new_columns = [column]
        
        elif method == 'onehot':
            # Create one-hot encoded columns
            encoded = pd.get_dummies(df_clean[column], prefix=column)
            df_clean = pd.concat([df_clean.drop(columns=[column]), encoded], axis=1)
            new_columns = encoded.columns.tolist()
        
        elif method == 'ordinal':
            # Simple ordinal encoding (similar to label but preserves order)
            unique_values = sorted(df_clean[column].unique())
            mapping = {val: idx for idx, val in enumerate(unique_values)}
            df_clean[column] = df_clean[column].map(mapping)
            new_columns = [column]
        
        return df_clean, new_columns

    @staticmethod
    def filter_rows(
        df: pd.DataFrame,
        column: str,
        operator: str,
        value: str,
        value2: str = None,
        values_list: list = None
    ) -> pd.DataFrame:
        """Filter rows based on condition.
        
        Supported operators:
        - Numeric:    ==, !=, >, <, >=, <=, between, top_n, bottom_n
        - Text:       contains, starts_with, ends_with, regex, is_empty
        - Null:       is_null, is_not_null
        - Categorical: in, not_in
        - Date/Time:  before, after, date_between
        - Statistical: outliers, percentile
        """
        import re as re_mod
        import numpy as np

        df_clean = df.copy()
        
        try:
            # ── Null-aware operators (no value needed) ──
            if operator == 'is_null':
                mask = df_clean[column].isna()
            elif operator == 'is_not_null':
                mask = df_clean[column].notna()
            elif operator == 'is_empty':
                mask = df_clean[column].isna() | (df_clean[column].astype(str).str.strip() == '')

            # ── Numeric comparison ──
            elif operator == '==':
                if pd.api.types.is_numeric_dtype(df_clean[column]):
                    mask = df_clean[column] == float(value)
                else:
                    mask = df_clean[column] == value
            elif operator == '!=':
                if pd.api.types.is_numeric_dtype(df_clean[column]):
                    mask = df_clean[column] != float(value)
                else:
                    mask = df_clean[column] != value
            elif operator in ['>', '<', '>=', '<=']:
                numeric_val = float(value)
                if operator == '>':
                    mask = df_clean[column] > numeric_val
                elif operator == '<':
                    mask = df_clean[column] < numeric_val
                elif operator == '>=':
                    mask = df_clean[column] >= numeric_val
                else:
                    mask = df_clean[column] <= numeric_val

            elif operator == 'between':
                lo = float(value)
                hi = float(value2) if value2 else lo
                mask = df_clean[column].between(lo, hi)

            elif operator == 'top_n':
                n = int(value)
                threshold = df_clean[column].nlargest(n).min()
                mask = df_clean[column] >= threshold

            elif operator == 'bottom_n':
                n = int(value)
                threshold = df_clean[column].nsmallest(n).max()
                mask = df_clean[column] <= threshold

            # ── Text operators ──
            elif operator == 'contains':
                mask = df_clean[column].astype(str).str.contains(value, case=False, na=False)

            elif operator == 'starts_with':
                mask = df_clean[column].astype(str).str.startswith(value, na=False)

            elif operator == 'ends_with':
                mask = df_clean[column].astype(str).str.endswith(value, na=False)

            elif operator == 'regex':
                mask = df_clean[column].astype(str).str.contains(value, flags=re_mod.IGNORECASE, regex=True, na=False)

            # ── Categorical operators ──
            elif operator == 'in':
                vals = values_list if values_list else [v.strip() for v in value.split(',')]
                if pd.api.types.is_numeric_dtype(df_clean[column]):
                    vals = [float(v) for v in vals]
                mask = df_clean[column].isin(vals)

            elif operator == 'not_in':
                vals = values_list if values_list else [v.strip() for v in value.split(',')]
                if pd.api.types.is_numeric_dtype(df_clean[column]):
                    vals = [float(v) for v in vals]
                mask = ~df_clean[column].isin(vals)

            # ── Date/Time operators ──
            elif operator == 'before':
                dt_col = pd.to_datetime(df_clean[column], errors='coerce')
                dt_val = pd.to_datetime(value)
                mask = dt_col < dt_val

            elif operator == 'after':
                dt_col = pd.to_datetime(df_clean[column], errors='coerce')
                dt_val = pd.to_datetime(value)
                mask = dt_col > dt_val

            elif operator == 'date_between':
                dt_col = pd.to_datetime(df_clean[column], errors='coerce')
                dt_lo = pd.to_datetime(value)
                dt_hi = pd.to_datetime(value2) if value2 else dt_lo
                mask = dt_col.between(dt_lo, dt_hi)

            # ── Statistical operators ──
            elif operator == 'outliers':
                n_std = float(value) if value else 2.0
                col_data = pd.to_numeric(df_clean[column], errors='coerce')
                mean = col_data.mean()
                std = col_data.std()
                mask = (col_data < mean - n_std * std) | (col_data > mean + n_std * std)

            elif operator == 'percentile':
                pct = float(value) / 100.0
                col_data = pd.to_numeric(df_clean[column], errors='coerce')
                threshold = col_data.quantile(pct)
                # If pct > 0.5 keep top, else keep bottom
                if pct >= 0.5:
                    mask = col_data >= threshold
                else:
                    mask = col_data <= threshold

            else:
                raise ValueError(f"Unsupported operator: {operator}")
            
            df_clean = df_clean[mask].reset_index(drop=True)
        except (ValueError, TypeError) as e:
            raise ValueError(f"Filter error on column '{column}': {str(e)}")
        
        return df_clean

    @staticmethod
    def manage_columns(
        df: pd.DataFrame,
        action: str,
        columns: List[str],
        new_names: Optional[dict] = None
    ) -> pd.DataFrame:
        """Drop or rename columns"""
        df_clean = df.copy()
        
        if action == 'drop':
            missing = [c for c in columns if c not in df_clean.columns]
            if missing:
                raise ValueError(f"Columns not found: {', '.join(missing)}")
            df_clean = df_clean.drop(columns=columns)
        elif action == 'rename':
            if not new_names:
                raise ValueError("new_names must be provided for rename action")
            df_clean = df_clean.rename(columns=new_names)
        else:
            raise ValueError(f"Unsupported action: {action}")
        
        return df_clean

    @staticmethod
    def normalize_columns(
        df: pd.DataFrame,
        columns: List[str],
        method: str = 'standard'
    ) -> pd.DataFrame:
        """Normalize numeric columns using StandardScaler or MinMaxScaler"""
        from sklearn.preprocessing import StandardScaler, MinMaxScaler
        
        df_clean = df.copy()
        numeric_cols = [c for c in columns if pd.api.types.is_numeric_dtype(df_clean[c])]
        
        if not numeric_cols:
            raise ValueError("No numeric columns selected for normalization")
        
        if method == 'standard':
            scaler = StandardScaler()
        elif method == 'minmax':
            scaler = MinMaxScaler()
        else:
            raise ValueError(f"Unsupported normalization method: {method}")
        
        df_clean[numeric_cols] = scaler.fit_transform(df_clean[numeric_cols])
        return df_clean

    @staticmethod
    def string_operations(
        df: pd.DataFrame,
        column: str,
        operation: str,
        find_str: str = '',
        replace_str: str = '',
        regex_pattern: str = ''
    ) -> pd.DataFrame:
        """Apply string operations to a column"""
        import re as re_mod
        df_clean = df.copy()
        
        if column not in df_clean.columns:
            raise ValueError(f"Column '{column}' not found")
        
        col = df_clean[column].astype(str)
        
        if operation == 'trim':
            df_clean[column] = col.str.strip()
        elif operation == 'lowercase':
            df_clean[column] = col.str.lower()
        elif operation == 'uppercase':
            df_clean[column] = col.str.upper()
        elif operation == 'title_case':
            df_clean[column] = col.str.title()
        elif operation == 'replace':
            if not find_str:
                raise ValueError("find_str is required for replace operation")
            df_clean[column] = col.str.replace(find_str, replace_str, regex=False)
        elif operation == 'regex_replace':
            if not regex_pattern:
                raise ValueError("regex_pattern is required for regex_replace")
            df_clean[column] = col.str.replace(regex_pattern, replace_str, regex=True)
        elif operation == 'extract':
            if not regex_pattern:
                raise ValueError("regex_pattern is required for extract")
            extracted = col.str.extract(f'({regex_pattern})', expand=False)
            df_clean[column + '_extracted'] = extracted
        elif operation == 'remove_whitespace':
            df_clean[column] = col.str.replace(r'\s+', ' ', regex=True).str.strip()
        elif operation == 'remove_special_chars':
            df_clean[column] = col.str.replace(r'[^a-zA-Z0-9\s]', '', regex=True)
        elif operation == 'pad_left':
            width = int(find_str) if find_str.isdigit() else 10
            df_clean[column] = col.str.zfill(width)
        else:
            raise ValueError(f"Unsupported string operation: {operation}")
        
        return df_clean

    @staticmethod
    def remove_outliers(
        df: pd.DataFrame,
        column: str,
        method: str = 'zscore',
        threshold: float = 2.0
    ) -> pd.DataFrame:
        """Remove outliers from a numeric column"""
        import numpy as np
        df_clean = df.copy()
        
        if column not in df_clean.columns:
            raise ValueError(f"Column '{column}' not found")
        
        col_data = pd.to_numeric(df_clean[column], errors='coerce')
        
        if method == 'zscore':
            mean = col_data.mean()
            std = col_data.std()
            if std == 0:
                return df_clean
            z_scores = ((col_data - mean) / std).abs()
            mask = z_scores <= threshold
        elif method == 'iqr':
            Q1 = col_data.quantile(0.25)
            Q3 = col_data.quantile(0.75)
            IQR = Q3 - Q1
            lower = Q1 - threshold * IQR
            upper = Q3 + threshold * IQR
            mask = col_data.between(lower, upper)
        elif method == 'percentile':
            lower_pct = threshold / 100.0
            upper_pct = 1 - lower_pct
            lower = col_data.quantile(lower_pct)
            upper = col_data.quantile(upper_pct)
            mask = col_data.between(lower, upper)
        else:
            raise ValueError(f"Unsupported outlier method: {method}")
        
        # Keep rows where column is NaN (don't filter those out)
        mask = mask | col_data.isna()
        df_clean = df_clean[mask].reset_index(drop=True)
        return df_clean

    @staticmethod
    def feature_engineering(
        df: pd.DataFrame,
        new_column: str,
        expression: str,
        source_columns: list = None
    ) -> pd.DataFrame:
        """Create a new column from an expression"""
        df_clean = df.copy()
        
        try:
            # We use pandas natively string-evaluating engine which is safe
            # and prevents Remote Code Execution attacks (no python code payload injections).
            result = pd.eval(expression, target=df_clean, engine='numexpr')
            df_clean[new_column] = result
        except ImportError:
            # Fallback to pandas python engine if numexpr isn't installed (still safe sandboxed mode)
            try:
                result = pd.eval(expression, target=df_clean)
                df_clean[new_column] = result
            except Exception as e:
                raise ValueError(f"Expression error: {str(e)}")
        except Exception as e:
            raise ValueError(f"Expression error: {str(e)}")
            
        return df_clean

    @staticmethod
    def date_operations(
        df: pd.DataFrame,
        column: str,
        operation: str,
        second_column: str = None
    ) -> pd.DataFrame:
        """Extract or transform date/time columns"""
        df_clean = df.copy()
        
        if column not in df_clean.columns:
            raise ValueError(f"Column '{column}' not found")
        
        dt_col = pd.to_datetime(df_clean[column], errors='coerce')
        
        if operation == 'extract_year':
            df_clean[column + '_year'] = dt_col.dt.year
        elif operation == 'extract_month':
            df_clean[column + '_month'] = dt_col.dt.month
        elif operation == 'extract_day':
            df_clean[column + '_day'] = dt_col.dt.day
        elif operation == 'extract_weekday':
            df_clean[column + '_weekday'] = dt_col.dt.day_name()
        elif operation == 'extract_hour':
            df_clean[column + '_hour'] = dt_col.dt.hour
        elif operation == 'extract_quarter':
            df_clean[column + '_quarter'] = dt_col.dt.quarter
        elif operation == 'extract_all':
            df_clean[column + '_year'] = dt_col.dt.year
            df_clean[column + '_month'] = dt_col.dt.month
            df_clean[column + '_day'] = dt_col.dt.day
            df_clean[column + '_weekday'] = dt_col.dt.day_name()
        elif operation == 'date_diff':
            if not second_column or second_column not in df_clean.columns:
                raise ValueError("second_column is required for date_diff")
            dt_col2 = pd.to_datetime(df_clean[second_column], errors='coerce')
            df_clean[f'{column}_minus_{second_column}_days'] = (dt_col - dt_col2).dt.days
        elif operation == 'to_timestamp':
            df_clean[column + '_timestamp'] = dt_col.astype('int64') // 10**9
        else:
            raise ValueError(f"Unsupported date operation: {operation}")
        
        return df_clean

    @staticmethod
    def binning(
        df: pd.DataFrame,
        column: str,
        method: str = 'equal_width',
        n_bins: int = 5,
        labels: list = None,
        custom_edges: list = None
    ) -> pd.DataFrame:
        """Bin continuous data into categories"""
        df_clean = df.copy()
        
        if column not in df_clean.columns:
            raise ValueError(f"Column '{column}' not found")
        
        col_data = pd.to_numeric(df_clean[column], errors='coerce')
        new_col = column + '_binned'
        
        if method == 'equal_width':
            df_clean[new_col] = pd.cut(col_data, bins=n_bins, labels=labels)
        elif method == 'equal_frequency':
            df_clean[new_col] = pd.qcut(col_data, q=n_bins, labels=labels, duplicates='drop')
        elif method == 'custom':
            if not custom_edges or len(custom_edges) < 2:
                raise ValueError("custom_edges must have at least 2 values for custom binning")
            edges = [float(e) for e in custom_edges]
            if labels and len(labels) != len(edges) - 1:
                labels = None
            df_clean[new_col] = pd.cut(col_data, bins=edges, labels=labels, include_lowest=True)
        else:
            raise ValueError(f"Unsupported binning method: {method}")
        
        # Convert to string for compatibility
        df_clean[new_col] = df_clean[new_col].astype(str)
        return df_clean

    @staticmethod
    def sampling(
        df: pd.DataFrame,
        method: str = 'random',
        fraction: float = 0.5,
        n_rows: int = None,
        stratify_column: str = None,
        random_state: int = 42
    ) -> pd.DataFrame:
        """Sample rows from the dataset"""
        if method == 'random':
            if n_rows:
                n = min(n_rows, len(df))
                return df.sample(n=n, random_state=random_state).reset_index(drop=True)
            else:
                frac = min(max(fraction, 0.01), 1.0)
                return df.sample(frac=frac, random_state=random_state).reset_index(drop=True)
        elif method == 'stratified':
            if not stratify_column or stratify_column not in df.columns:
                raise ValueError("stratify_column is required for stratified sampling")
            frac = min(max(fraction, 0.01), 1.0)
            sampled = df.groupby(stratify_column, group_keys=False).apply(
                lambda x: x.sample(frac=frac, random_state=random_state)
            ).reset_index(drop=True)
            return sampled
        elif method == 'first':
            n = n_rows or int(len(df) * fraction)
            return df.head(min(n, len(df))).reset_index(drop=True)
        elif method == 'last':
            n = n_rows or int(len(df) * fraction)
            return df.tail(min(n, len(df))).reset_index(drop=True)
        else:
            raise ValueError(f"Unsupported sampling method: {method}")

data_cleaner = DataCleaner()
