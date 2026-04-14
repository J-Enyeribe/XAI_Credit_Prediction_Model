import pandas as pd
from ucimlrepo import fetch_ucirepo 
import os

def download_data():
    print("Fetching German Credit dataset from UCI...")
    try:
        # fetch dataset 
        german_credit = fetch_ucirepo(id=144) 
        
        # data (as pandas dataframes) 
        X = german_credit.data.features 
        y = german_credit.data.targets 
        
        # Combine into one dataframe
        df = pd.concat([X, y], axis=1)
        
        # Save to data/raw
        raw_path = 'data/raw/german_credit.csv'
        df.to_csv(raw_path, index=False)
        print(f"Dataset saved successfully to {raw_path}")
        return raw_path
    except Exception as e:
        print(f"Error downloading data: {e}")
        return None

if __name__ == "__main__":
    download_data()
