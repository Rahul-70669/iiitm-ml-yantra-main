from typing import Dict, Any, List, Optional
from app.services.dataset_manager import dataset_manager

class ContextBuilder:
    """Build context for AI assistant from current session state"""
    
    def build_dataset_context(self, session_id: str) -> Dict[str, Any]:
        """Build dataset information context"""
        try:
            df = dataset_manager.get_dataset(session_id)
            stats = dataset_manager.get_statistics(session_id)
            
            return {
                'filename': 'current_dataset.csv',
                'rows': len(df),
                'columns': len(df.columns),
                'column_names': df.columns.tolist(),
                'column_types': stats.get('column_types', {}),
                'null_counts': stats.get('null_counts', {}),
                'duplicate_rows': stats.get('duplicate_rows', 0),
                'numeric_stats': stats.get('numeric_stats', {})
            }
        except Exception as e:
            return {
                'error': str(e),
                'filename': 'Unknown',
                'rows': 0,
                'columns': 0
            }
    
    def build_history_context(self, session_id: str) -> List[Dict[str, Any]]:
        """Build cleaning operation history context"""
        try:
            history = dataset_manager.get_history(session_id)
            return history
        except Exception:
            return []
    
    def build_full_context(
        self,
        session_id: str,
        include_training: bool = False,
        training_results: Optional[Dict[str, Any]] = None
    ) -> Dict[str, Any]:
        """Build complete context for AI assistant"""
        
        context = {
            'dataset': self.build_dataset_context(session_id),
            'history': self.build_history_context(session_id)
        }
        
        if include_training and training_results:
            context['training'] = training_results
        
        return context


# Global instance
context_builder = ContextBuilder()
