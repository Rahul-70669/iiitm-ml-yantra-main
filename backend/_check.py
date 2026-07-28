import os, pandas as pd
cache = '.cache/datasets'
files = sorted([f for f in os.listdir(cache) if f.endswith('.pkl')], key=lambda f: os.path.getmtime(os.path.join(cache,f)), reverse=True)
if files:
    df = pd.read_pickle(os.path.join(cache, files[0]))
    print(f"Latest: {files[0]}")
    print(f"Shape: {df.shape}")
    obj_cols = df.select_dtypes(include=['object']).columns.tolist()
    print(f"Object cols ({len(obj_cols)}): {obj_cols[:10]}")
    print(f"All cols: {df.columns.tolist()[:15]}")
