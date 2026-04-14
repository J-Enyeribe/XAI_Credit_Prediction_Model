import pandas as pd
import matplotlib.pyplot as plt
import seaborn as sns
import os

def perform_eda(file_path):
    print(f"Performing EDA on {file_path}...")
    df = pd.read_csv(file_path)
    
    # Basic Info
    print("\n--- Basic Info ---")
    print(df.info())
    
    # Target Distribution
    print("\n--- Target Distribution ---")
    print(df['class'].value_counts(normalize=True))
    
    # Missing Values
    print("\n--- Missing Values ---")
    print(df.isnull().sum().sum())
    
    # Correlation Matrix for numerical features
    numerical_cols = df.select_dtypes(include=['int64', 'float64']).columns
    if len(numerical_cols) > 1:
        print("\n--- Numerical Correlation ---")
        corr = df[numerical_cols].corr()
        print(corr)
    
    # Create a directory for plots
    plot_dir = 'notebooks/plots'
    os.makedirs(plot_dir, exist_ok=True)
    
    # Target distribution plot
    plt.figure(figsize=(6, 4))
    sns.countplot(x='class', data=df)
    plt.title('Target Distribution (1: Good, 2: Bad)')
    plt.savefig(f'{plot_dir}/target_distribution.png')
    plt.close()
    
    print(f"\nEDA plots saved to {plot_dir}")

if __name__ == "__main__":
    raw_data_path = 'data/raw/german_credit.csv'
    perform_eda(raw_data_path)
