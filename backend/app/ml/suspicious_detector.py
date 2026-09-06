SUSPICIOUS_KEYWORDS = [
    "failed login",
    "multiple login attempts",
    "unknown ip",
    "unauthorized access",
    "admin access",
    "password changed",
    "brute force",
    "malware",
    "suspicious activity",
    "data breach"
]


def detect_suspicious_indicators(text: str):

    text_lower = text.lower()

    detected = []

    for keyword in SUSPICIOUS_KEYWORDS:
        if keyword in text_lower:
            detected.append(keyword)

    risk_level = "Low"

    if len(detected) >= 4:
        risk_level = "High"
    elif len(detected) >= 2:
        risk_level = "Medium"

    return {
        "risk_level": risk_level,
        "indicator_count": len(detected),
        "indicators": detected
    }