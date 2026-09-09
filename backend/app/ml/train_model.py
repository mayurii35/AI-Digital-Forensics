import os
import joblib
from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.linear_model import LogisticRegression
from sklearn.ensemble import IsolationForest
from sklearn.pipeline import Pipeline
from app.ml.dataset import TRAINING_DATA

def train_and_save_model():
    print("[ML] Training Forensic Cyber Threat Classifier...")

    texts = [item[0] for item in TRAINING_DATA]
    labels = [item[1] for item in TRAINING_DATA]

    # Build Pipeline: TF-IDF + Logistic Regression with probability output
    classifier = Pipeline([
        ("tfidf", TfidfVectorizer(
            ngram_range=(1, 2),
            sublinear_tf=True,
            lowercase=True,
            token_pattern=r"(?u)\b\w+\b|[^\w\s]"
        )),
        ("clf", LogisticRegression(
            max_iter=1000,
            C=3.0,
            random_state=42
        ))
    ])

    classifier.fit(texts, labels)

    # Train Isolation Forest on TF-IDF vectors for unsupervised log anomaly detection
    tfidf_matrix = classifier.named_steps["tfidf"].transform(texts)
    isolation_forest = IsolationForest(
        n_estimators=100,
        contamination=0.15,
        random_state=42
    )
    isolation_forest.fit(tfidf_matrix.toarray())

    # Ensure models directory exists
    models_dir = os.path.join(os.path.dirname(__file__), "models")
    os.makedirs(models_dir, exist_ok=True)
    model_path = os.path.join(models_dir, "threat_classifier.joblib")

    model_bundle = {
        "classifier": classifier,
        "isolation_forest": isolation_forest,
        "classes": list(classifier.classes_),
        "version": "2.0.0"
    }

    joblib.dump(model_bundle, model_path)
    print(f"[ML] Model successfully trained on {len(texts)} forensic artifacts and saved to {model_path}!")
    print(f"[ML] Supported threat classes: {classifier.classes_}")

if __name__ == "__main__":
    train_and_save_model()
