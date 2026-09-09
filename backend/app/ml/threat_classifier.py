import os
import joblib
import numpy as np

_MODEL_PATH = os.path.join(os.path.dirname(__file__), "models", "threat_classifier.joblib")
_MODEL_BUNDLE = None

def _get_model():
    global _MODEL_BUNDLE
    if _MODEL_BUNDLE is None:
        if os.path.exists(_MODEL_PATH):
            try:
                _MODEL_BUNDLE = joblib.load(_MODEL_PATH)
            except Exception as e:
                print(f"[ML Warning] Failed to load ML threat classifier: {e}")
                _MODEL_BUNDLE = None
    return _MODEL_BUNDLE

def classify_threat(text: str) -> dict:
    """
    Evaluates evidence text against trained Scikit-Learn TF-IDF + Logistic Regression
    and Isolation Forest anomaly detector.
    """
    if not text or not text.strip():
        return {
            "predicted_category": "Benign",
            "confidence": 0.0,
            "anomaly_detected": False,
            "anomaly_score": 0.0,
            "risk_level": "Low",
            "top_features": [],
            "category_probabilities": {}
        }

    bundle = _get_model()
    if bundle is None:
        # Fallback if model not yet trained or unavailable
        return {
            "predicted_category": "Unclassified",
            "confidence": 0.0,
            "anomaly_detected": False,
            "anomaly_score": 0.0,
            "risk_level": "Low",
            "top_features": [],
            "category_probabilities": {}
        }

    classifier = bundle["classifier"]
    isolation_forest = bundle.get("isolation_forest")
    classes = bundle["classes"]

    # 1. Supervised Classification
    probs = classifier.predict_proba([text])[0]
    best_idx = np.argmax(probs)
    best_category = str(classes[best_idx])
    confidence = round(float(probs[best_idx]) * 100, 2)

    # 2. Extract Top Contributing Features (Tokens / N-grams)
    tfidf = classifier.named_steps["tfidf"]
    clf = classifier.named_steps["clf"]
    feature_names = np.array(tfidf.get_feature_names_out())
    text_vector = tfidf.transform([text]).toarray()[0]
    non_zero_indices = np.where(text_vector > 0)[0]

    top_features = []
    if len(non_zero_indices) > 0 and best_category != "Benign":
        # Weight by classifier coefficient for predicted class
        class_coef = clf.coef_[best_idx]
        scores = text_vector[non_zero_indices] * class_coef[non_zero_indices]
        top_sorted = non_zero_indices[np.argsort(scores)[::-1][:5]]
        top_features = [str(feature_names[i]) for i in top_sorted if scores[np.where(non_zero_indices == i)[0][0]] > 0]

    # 3. Unsupervised Anomaly Detection
    anomaly_detected = False
    anomaly_score = 0.0
    if isolation_forest:
        try:
            iso_pred = isolation_forest.predict([text_vector])[0]
            anomaly_detected = bool(iso_pred == -1)
            raw_score = isolation_forest.decision_function([text_vector])[0]
            anomaly_score = round(float(raw_score), 4)
        except Exception:
            pass

    # 4. Map to Forensic Risk Level
    if best_category in ["Ransomware", "Malware"]:
        risk_level = "Critical" if confidence >= 60 else "High"
    elif best_category in ["SQL Injection", "Web Exploit", "Privilege Escalation"]:
        risk_level = "High" if confidence >= 50 else "Medium"
    elif best_category in ["Brute Force", "Lateral Movement", "Phishing"]:
        risk_level = "High" if confidence >= 65 else "Medium"
    elif best_category == "Network Reconnaissance":
        risk_level = "Medium"
    else:
        risk_level = "Low" if not anomaly_detected else "Medium"

    prob_dict = {
        str(cls_name): round(float(probs[i]) * 100, 1)
        for i, cls_name in enumerate(classes)
        if probs[i] >= 0.05
    }

    return {
        "predicted_category": best_category,
        "confidence": confidence,
        "anomaly_detected": anomaly_detected,
        "anomaly_score": anomaly_score,
        "risk_level": risk_level,
        "top_features": top_features[:6],
        "category_probabilities": prob_dict,
        "model_version": bundle.get("version", "2.0.0")
    }
