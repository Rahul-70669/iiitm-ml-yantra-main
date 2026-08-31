import pandas as pd
import numpy as np
from typing import Dict, List, Optional, Tuple
import uuid
import os
from datetime import datetime
import time

CACHE_DIR = os.path.join(os.path.dirname(os.path.abspath(__file__)), '..', '..', '.cache', 'datasets')
os.makedirs(CACHE_DIR, exist_ok=True)

class DatasetManager:
    """Manages dataset sessions and operations with disk-caching to prevent memory exhaustion"""
    
    def __init__(self):
        # Maps session_id to current active file_path
        self.sessions: Dict[str, str] = {}
        # Maps session_id to list of (file_path, operation_dict)
        self.history: Dict[str, List[Tuple[str, Dict]]] = {}
        self.current_index: Dict[str, int] = {}
        # Multi-sheet support: maps parent_session_id -> {sheet_name: session_id}
        self.sheet_groups: Dict[str, Dict[str, str]] = {}
        # Reverse map: session_id -> (parent_id, sheet_name)
        self.sheet_parents: Dict[str, Tuple[str, str]] = {}
        # Filename tracking for notebook generation
        self.filenames: Dict[str, str] = {}
        # Stats cache: maps (session_id, history_index) -> stats dict to avoid recomputing
        self._stats_cache: Dict[tuple, Dict] = {}

    def get_filename(self, session_id: str) -> str:
        """Get the original filename for a session"""
        return self.filenames.get(session_id, 'dataset.csv')
    
    def create_session(self, df: pd.DataFrame) -> str:
        """Create a new session with a dataset"""
        session_id = str(uuid.uuid4())
        file_path = os.path.join(CACHE_DIR, f"{session_id}_0.pkl")
        df.to_pickle(file_path)
        
        self.sessions[session_id] = file_path
        self.history[session_id] = [(file_path, {"operation": "upload", "timestamp": datetime.now().isoformat()})]
        self.current_index[session_id] = 0
        return session_id
    
    def create_multi_sheet_session(self, sheets: Dict[str, pd.DataFrame]) -> Tuple[str, Dict[str, str]]:
        """Create sessions for multiple sheets. Returns (group_id, {sheet_name: session_id})"""
        group_id = str(uuid.uuid4())
        sheet_sessions = {}
        
        for sheet_name, df in sheets.items():
            session_id = self.create_session(df)
            sheet_sessions[sheet_name] = session_id
            self.sheet_parents[session_id] = (group_id, sheet_name)
        
        self.sheet_groups[group_id] = sheet_sessions
        return group_id, sheet_sessions
    
    def get_sheet_group(self, group_id: str) -> Dict[str, str]:
        """Get all sheet session IDs for a group"""
        if group_id not in self.sheet_groups:
            raise ValueError(f"Sheet group {group_id} not found")
        return self.sheet_groups[group_id]
    
    def get_sheet_info(self, group_id: str) -> List[Dict]:
        """Get info about all sheets in a group"""
        sheets = self.get_sheet_group(group_id)
        info = []
        for sheet_name, session_id in sheets.items():
            df = self.get_dataset(session_id)
            info.append({
                "sheet_name": sheet_name,
                "session_id": session_id,
                "rows": len(df),
                "columns": len(df.columns),
                "column_names": df.columns.tolist(),
                "column_types": {col: str(df[col].dtype) for col in df.columns}
            })
        return info
    
    def merge_sheets(self, group_id: str, sheet_names: List[str], 
                     merge_type: str, on_column: Optional[str] = None,
                     how: str = 'inner') -> Tuple[str, pd.DataFrame]:
        """
        Merge multiple sheets into one.
        merge_type: 'concat_rows', 'concat_cols', 'join'
        how: 'inner', 'outer', 'left', 'right' (for join)
        on_column: column to join on (for join)
        """
        sheets = self.get_sheet_group(group_id)
        
        dfs = []
        for name in sheet_names:
            if name not in sheets:
                raise ValueError(f"Sheet '{name}' not found in group")
            dfs.append(self.get_dataset(sheets[name]))
        
        if len(dfs) < 2:
            raise ValueError("Need at least 2 sheets to merge")
        
        if merge_type == 'concat_rows':
            merged = pd.concat(dfs, axis=0, ignore_index=True)
        elif merge_type == 'concat_cols':
            merged = pd.concat(dfs, axis=1)
        elif merge_type == 'join':
            if not on_column:
                 raise ValueError("on_column is required for join merge type")
            merged = dfs[0]
            for i, df in enumerate(dfs[1:], start=1):
                merged = pd.merge(merged, df, on=on_column, how=how, suffixes=('', f'_{sheet_names[i]}'))
        else:
            raise ValueError(f"Unknown merge type: {merge_type}")
        
        new_session_id = self.create_session(merged)
        
        merged_name = f"Merged ({'+ '.join(sheet_names)})"
        sheets[merged_name] = new_session_id
        self.sheet_parents[new_session_id] = (group_id, merged_name)
        
        return new_session_id, merged
    
    def get_dataset(self, session_id: str) -> pd.DataFrame:
        """Get dataset for a session from disk"""
        if session_id not in self.sessions:
            raise ValueError(f"Session {session_id} not found")
        file_path = self.sessions[session_id]
        if not os.path.exists(file_path):
            raise ValueError(f"Cache file for session {session_id} missing from disk.")
        return pd.read_pickle(file_path)
    
    def update_dataset(self, session_id: str, df: pd.DataFrame, operation: Dict):
        """Save dataset to disk and update history"""
        if session_id not in self.sessions:
            raise ValueError(f"Session {session_id} not found")
        
        current_idx = self.current_index[session_id]
        new_idx = current_idx + 1
        
        # Cleanup orphaned forward history files if we overwrote after an undo
        for path, _ in self.history[session_id][new_idx:]:
            if os.path.exists(path):
                # Only delete if it's not the file we are currently looking at (edge cases)
                if path != self.sessions[session_id]:
                    os.remove(path)
                    
        self.history[session_id] = self.history[session_id][:new_idx]
        
        file_path = os.path.join(CACHE_DIR, f"{session_id}_{new_idx}.pkl")
        df.to_pickle(file_path)
        
        self.history[session_id].append((file_path, {**operation, "timestamp": datetime.now().isoformat()}))
        self.current_index[session_id] = new_idx
        self.sessions[session_id] = file_path
        # Invalidate the stats cache for this session on any data change
        keys_to_remove = [k for k in self._stats_cache if k[0] == session_id]
        for k in keys_to_remove:
            del self._stats_cache[k]
    
    def undo(self, session_id: str) -> pd.DataFrame:
        """Undo last operation by falling back to previous state"""
        if session_id not in self.sessions:
            raise ValueError(f"Session {session_id} not found")
        
        current_idx = self.current_index[session_id]
        if current_idx > 0:
            self.current_index[session_id] -= 1
            self.sessions[session_id] = self.history[session_id][self.current_index[session_id]][0]
        
        return self.get_dataset(session_id)
    
    def redo(self, session_id: str) -> pd.DataFrame:
        """Redo last undone operation"""
        if session_id not in self.sessions:
            raise ValueError(f"Session {session_id} not found")
        
        current_idx = self.current_index[session_id]
        if current_idx < len(self.history[session_id]) - 1:
            self.current_index[session_id] += 1
            self.sessions[session_id] = self.history[session_id][self.current_index[session_id]][0]
        
        return self.get_dataset(session_id)
    
    def get_history(self, session_id: str) -> List[Dict]:
        """Get operation history (omits internal file paths)"""
        if session_id not in self.sessions:
            raise ValueError(f"Session {session_id} not found")
        
        return [op for _, op in self.history[session_id]]
    
    def get_statistics(self, session_id: str) -> Dict:
        """Calculate dataset statistics (cached per session+version for performance)"""
        cache_key = (session_id, self.current_index.get(session_id, 0))
        if cache_key in self._stats_cache:
            return self._stats_cache[cache_key]

        df = self.get_dataset(session_id)
        n_rows = len(df)

        # Null counts — fast vectorized operation
        null_counts = df.isnull().sum().to_dict()

        # Duplicate detection: exact count for small datasets, sampled estimate for large ones
        # df.duplicated() on 1M+ rows can take several seconds — cap at a fast sample
        if n_rows <= 100_000:
            duplicate_rows = int(df.duplicated().sum())
        else:
            # Sample 50k rows for a quick estimate; label clearly as approximate
            sample = df.sample(n=50_000, random_state=42)
            dup_rate = sample.duplicated().sum() / len(sample)
            duplicate_rows = int(dup_rate * n_rows)

        stats = {
            "total_rows": n_rows,
            "total_columns": len(df.columns),
            "null_counts": null_counts,
            "duplicate_rows": duplicate_rows,
            "column_types": {col: str(df[col].dtype) for col in df.columns}
        }

        # Numeric statistics — use describe() for a single pass over the data
        numeric_df = df.select_dtypes(include=[np.number])
        if not numeric_df.empty:
            desc = numeric_df.describe()  # single-pass: count, mean, std, min, 25%, 50%, 75%, max
            numeric_stats = {}
            for col in numeric_df.columns:
                col_desc = desc[col]
                numeric_stats[col] = {
                    "mean":   float(col_desc['mean'])  if col_desc['count'] > 0 else 0.0,
                    "median": float(col_desc['50%'])   if col_desc['count'] > 0 else 0.0,
                    "std":    float(col_desc['std'])   if col_desc['count'] > 1 else 0.0,
                    "min":    float(col_desc['min'])   if col_desc['count'] > 0 else 0.0,
                    "max":    float(col_desc['max'])   if col_desc['count'] > 0 else 0.0,
                }
            stats["numeric_stats"] = numeric_stats

        # Store in cache (bounded to 200 entries to prevent unbounded growth)
        if len(self._stats_cache) >= 200:
            oldest_key = next(iter(self._stats_cache))
            del self._stats_cache[oldest_key]
        self._stats_cache[cache_key] = stats
        return stats

    def cleanup_old_sessions(self, max_age_hours: int = 24):
        """Scrub old sessions and their respective disk cache files to prevent memory exhaustion"""
        current_time = time.time()
        max_age_seconds = max_age_hours * 3600
        
        # Free files un-tied to tracked sessions
        if os.path.exists(CACHE_DIR):
            for filename in os.listdir(CACHE_DIR):
                filepath = os.path.join(CACHE_DIR, filename)
                try:
                    if os.path.isfile(filepath):
                        file_age = current_time - os.path.getmtime(filepath)
                        if file_age > max_age_seconds:
                            os.remove(filepath)
                except Exception as e:
                    print(f"Error deleting cache file {filepath}: {e}")
                    
        # Free memory-mapped session dictionary references if they no longer exist on disk
        dead_sessions = []
        for session_id, history_list in self.history.items():
            first_path = history_list[0][0]
            if not os.path.exists(first_path):
                dead_sessions.append(session_id)
                
        for sid in dead_sessions:
            self.sessions.pop(sid, None)
            self.history.pop(sid, None)
            self.current_index.pop(sid, None)
            # Also purge any stats cache entries tied to this dead session
            stale_cache_keys = [k for k in self._stats_cache if k[0] == sid]
            for k in stale_cache_keys:
                del self._stats_cache[k]

        print(f"[{datetime.now().time()}] Dataset Cache Cleanup Complete: Purged {len(dead_sessions)} unlinked sessions and scrubbed filesystem.")

# Global instance
dataset_manager = DatasetManager()
