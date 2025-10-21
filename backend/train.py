import pandas as pd
from sklearn.model_selection import train_test_split
from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.linear_model import LogisticRegression
import joblib
import os

print("--- Starting Model Training ---")

# --- 1. Load and Clean Data ---
try:
    # Use latin1 encoding as it's common for this dataset
    df = pd.read_csv("spam.csv", encoding='latin1')
except FileNotFoundError:
    print("Error: 'spam.csv' not found. Make sure it's in the 'backend' folder.")
    exit()

# Drop unnecessary columns and rename
df.drop(columns=['Unnamed: 2', 'Unnamed: 3', 'Unnamed: 4'], inplace=True, errors='ignore')
df.rename(columns={'v1': 'label', 'v2': 'message'}, inplace=True)

# Handle any potential missing messages
df['message'] = df['message'].fillna('')

print("Data loaded and cleaned.")
print(df['label'].value_counts())

# --- 2. Define Features and Split Data ---
X = df['message']
y = df['label']

X_train, X_test, y_train, y_test = train_test_split(X, y, test_size=0.2, random_state=42, stratify=y)

print(f"Training set size: {len(X_train)}")
print(f"Testing set size: {len(X_test)}")

# --- 3. Vectorize Text ---
vectorizer = TfidfVectorizer(stop_words='english', max_features=5000)
X_train_vec = vectorizer.fit_transform(X_train)

print("Text vectorization complete.")

# --- 4. Train Model ---
model = LogisticRegression(class_weight='balanced', random_state=42, max_iter=1000)
model.fit(X_train_vec, y_train)

print("Model training complete.")

# --- 5. Save Model and Vectorizer ---
model_filename = 'scam_model.pkl'
vectorizer_filename = 'vectorizer.pkl'

joblib.dump(model, model_filename)
joblib.dump(vectorizer, vectorizer_filename)

print(f"\nSUCCESS: Model saved to {model_filename}")
print(f"SUCCESS: Vectorizer saved to {vectorizer_filename}")
print("You are now ready to run the API with 'main.py'")