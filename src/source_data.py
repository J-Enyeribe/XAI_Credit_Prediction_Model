import pandas as pd
from ucimlrepo import fetch_ucirepo 
import os

def download_data():
    print("Checking for Loan Default Prediction Dataset in data/raw...")
    raw_path = 'data/raw/Loan Default Prediction Dataset export 2026-05-31 08-13-25.csv'
    if os.path.exists(raw_path):
        print(f"Dataset found at {raw_path}")
        return raw_path
    else:
        print(f"Error: Dataset not found at {raw_path}. Please ensure the file is present.")
        return None

if __name__ == "__main__":
    download_data()
