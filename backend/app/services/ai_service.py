import os
import json
import re
from groq import Groq
from dotenv import load_dotenv

load_dotenv()

GROQ_API_KEY = os.getenv("GROQ_API_KEY")

client = Groq(api_key=GROQ_API_KEY) if GROQ_API_KEY else None

# Precompiled forensic regex patterns
REGEX_PATTERNS = {
    "IPv4": re.compile(r"\b(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\b"),
    "Email": re.compile(r"\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,7}\b"),
    "URL": re.compile(r"https?://(?:[-\w.]|(?:%[\da-fA-F]{2}))+[^\s\"'<>)]*"),
    "SHA256": re.compile(r"\b[A-Fa-f0-9]{64}\b"),
    "MD5": re.compile(r"\b[A-Fa-f0-9]{32}\b"),
    "JWT": re.compile(r"\beyJ[A-Za-z0-9-_=]+\.[A-Za-z0-9-_=]+\.?[A-Za-z0-9-_.+/=]*\b"),
    "Command": re.compile(r"\b(sudo\s+|chmod\s+|chown\s+|rm\s+-rf|nc\s+-e|powershell\s+-enc|cmd\.exe\s+/c|wget\s+|curl\s+-O|bash\s+-i)\b", re.IGNORECASE),
}

KEYWORDS_SEVERITY = {
    "CRITICAL": {
        "ransomware": "Ransomware signature or reference detected",
        "malware": "Malicious software artifact referenced",
        "exploit": "Vulnerability exploit or payload reference",
        "backdoor": "Potential backdoor communication or implant",
        "keylogger": "Keystroke logger artifact detected",
        "cve-": "Common Vulnerabilities and Exposures (CVE) identifier",
        "drop table": "SQL injection destructive statement",
        "mimikatz": "Credential extraction tool signature",
    },
    "HIGH": {
        "password": "Cleartext credential or password reference",
        "passwd": "Unix/Linux authentication database indicator",
        "secret": "Sensitive cryptographic secret or API token",
        "token": "Authentication bearer token or session artifact",
        "api_key": "API credential exposure indicator",
        "private_key": "Cryptographic private key indicator",
        "unauthorized": "Security policy violation / unauthorized access",
        "brute force": "Automated brute-force attack indicator",
        "phishing": "Social engineering or credential harvesting",
        "reverse shell": "Reverse connection command signature",
    },
    "MEDIUM": {
        "login": "Authentication attempt or access event",
        "otp": "One-time password transaction",
        "admin": "Administrative privilege escalation context",
        "root": "Superuser privileges context",
        "session": "User session tracking parameter",
        "failed": "Failed operation or authentication failure",
        "denied": "Access denial or firewall block event",
    },
    "LOW": {
        "user": "Standard user identity identifier",
        "audit": "System auditing event",
        "log": "Diagnostic or activity log entry",
        "connect": "Network connection event",
    }
}

def scan_text_for_indicators(text: str) -> list[dict]:
    """
    Scans text line-by-line and extracts forensic indicators with line numbers,
    type, value, severity, and forensic justification.
    """
    if not text:
        return []

    lines = text.splitlines()
    indicators = []
    seen = set()

    for line_idx, line in enumerate(lines):
        line_num = line_idx + 1
        line_clean = line.strip()
        if not line_clean:
            continue

        # 1. Check Regex Patterns
        for p_name, regex in REGEX_PATTERNS.items():
            for match in regex.finditer(line):
                val = match.group()
                key = (p_name, val, line_num)
                if key in seen:
                    continue
                seen.add(key)

                sev = "MEDIUM"
                reason = f"{p_name} detected in forensic text"
                if p_name == "Command":
                    sev = "CRITICAL"
                    reason = f"Suspicious execution command detected: '{val}'"
                elif p_name == "JWT":
                    sev = "HIGH"
                    reason = "Exposed JSON Web Token (JWT) credential"
                elif p_name in ["SHA256", "MD5"]:
                    sev = "LOW"
                    reason = f"Cryptographic {p_name} hash found"
                elif p_name == "URL":
                    sev = "HIGH" if any(k in val.lower() for k in ["login", "verify", "pay", "bank", "free", "bit.ly"]) else "MEDIUM"
                    reason = "Web URI reference"
                elif p_name == "IPv4":
                    sev = "HIGH" if val.startswith(("10.", "192.168.", "172.16.")) else "MEDIUM"
                    reason = "Internal/External IP address endpoint"

                indicators.append({
                    "type": p_name,
                    "value": val,
                    "line_number": line_num,
                    "severity": sev,
                    "reason": reason,
                    "line_text": line_clean[:120]
                })

        # 2. Check Suspicious Keywords
        line_lower = line.lower()
        for sev_level, kw_map in KEYWORDS_SEVERITY.items():
            for kw, reason in kw_map.items():
                if kw in line_lower:
                    key = ("Keyword", kw, line_num)
                    if key in seen:
                        continue
                    seen.add(key)
                    indicators.append({
                        "type": "Keyword",
                        "value": kw,
                        "line_number": line_num,
                        "severity": sev_level,
                        "reason": reason,
                        "line_text": line_clean[:120]
                    })

    return indicators

def calculate_risk_score(indicators: list[dict]) -> tuple[int, str]:
    """Calculates risk score 0-100 and risk level based on indicator weights."""
    if not indicators:
        return 0, "Low"

    weights = {
        "CRITICAL": 30,
        "HIGH": 15,
        "MEDIUM": 7,
        "LOW": 2
    }

    raw_score = sum(weights.get(ind.get("severity", "LOW"), 2) for ind in indicators)
    normalized_score = min(100, raw_score)

    if normalized_score >= 75:
        level = "Critical"
    elif normalized_score >= 50:
        level = "High"
    elif normalized_score >= 25:
        level = "Medium"
    else:
        level = "Low"

    return normalized_score, level

def generate_forensic_recommendations(risk_level: str, indicators: list[dict]) -> list[str]:
    """Generates forensically-sound actionable next steps."""
    recs = []
    types_found = {ind["type"] for ind in indicators}
    severities_found = {ind["severity"] for ind in indicators}

    if "CRITICAL" in severities_found or risk_level == "Critical":
        recs.append("Immediate triage required: Isolate involved network hosts and preserve system memory images.")
        recs.append("Perform full perimeter and firewall log correlation around the incident timeframe.")

    if "IPv4" in types_found or "URL" in types_found:
        recs.append("Query threat intelligence feeds (VirusTotal / AbuseIPDB) for all discovered IP endpoints and domains.")
        recs.append("Inspect perimeter firewall and proxy logs for active bidirectional sessions.")

    if "JWT" in types_found or any("password" in ind.get("value", "").lower() for ind in indicators):
        recs.append("Trigger credential invalidation and force session revocation across identity providers.")
        recs.append("Review authentication logs for anomalous logins from foreign geolocations.")

    if "Command" in types_found:
        recs.append("Audit endpoint persistence mechanisms: registry run keys, cron jobs, and scheduled tasks.")

    if not recs:
        recs.append("Maintain baseline evidence custody and archive hashes for case verification.")
        recs.append("No critical indicators detected; verify digital signatures and continue standard protocol.")

    return recs

def detect_suspicious_indicators(
    evidence_text: str = "",
    metadata: dict | None = None
) -> dict:
    indicators = scan_text_for_indicators(evidence_text)
    metadata = metadata or {}

    exif = metadata.get("exif", {})
    if isinstance(exif, dict):
        software = exif.get("Software") or exif.get("ProcessingSoftware")
        if software:
            indicators.append({
                "type": "Metadata",
                "value": software,
                "line_number": 0,
                "severity": "MEDIUM",
                "reason": f"Editing software signature detected: {software}",
                "line_text": "EXIF Metadata Header"
            })

    if metadata.get("error"):
        indicators.append({
            "type": "Metadata",
            "value": "Corrupted or unreadable metadata",
            "line_number": 0,
            "severity": "LOW",
            "reason": metadata["error"],
            "line_text": "File Structure"
        })

    risk_score, risk_level = calculate_risk_score(indicators)

    # Transform for compatibility
    compat_indicators = [
        {
            "type": ind["type"].lower(),
            "indicator": ind["value"],
            "description": ind["reason"],
            "severity": ind["severity"],
            "line_number": ind["line_number"]
        }
        for ind in indicators
    ]

    return {
        "risk_level": risk_level,
        "risk_score": risk_score,
        "indicator_count": len(indicators),
        "suspicious_indicators": compat_indicators,
        "structured_indicators": indicators,
        "recommendations": generate_forensic_recommendations(risk_level, indicators),
        "method": "enhanced_forensic_heuristic"
    }

from app.ml.threat_classifier import classify_threat
from app.ml.image_forensics import perform_error_level_analysis

def analyze_evidence(
    evidence_text: str,
    metadata: dict | None = None
):
    metadata = metadata or {}
    heuristic_result = detect_suspicious_indicators(evidence_text, metadata)

    # 1. Run Scikit-Learn Supervised Threat Classification & Anomaly Detection
    ml_result = classify_threat(evidence_text)

    # 2. Run Deep Learning Image Forgery / ELA Analysis if evidence is an image
    file_path = metadata.get("file_path", "")
    is_image = False
    file_ext = os.path.splitext(file_path)[1].lower() if file_path else ""
    if file_ext in [".jpg", ".jpeg", ".png", ".webp", ".bmp", ".tiff"]:
        is_image = True
        deepfake_result = perform_error_level_analysis(file_path)
    else:
        deepfake_result = {
            "status": "non_image_artifact",
            "tamper_score": 0.0,
            "is_tampered": False,
            "method": "File type is non-raster document/log"
        }

    # Reconcile risk level taking ML into consideration
    final_risk_level = heuristic_result["risk_level"]
    ml_risk = ml_result.get("risk_level", "Low")
    risk_rank = {"Low": 1, "Medium": 2, "High": 3, "Critical": 4}
    if risk_rank.get(ml_risk, 1) > risk_rank.get(final_risk_level, 1):
        final_risk_level = ml_risk

    # If ELA detects tampering, elevate risk
    if deepfake_result.get("is_tampered"):
        if risk_rank.get(final_risk_level, 1) < 3:
            final_risk_level = "High"

    final_risk_score = max(heuristic_result["risk_score"], int(ml_result.get("confidence", 0) * 0.9))

    if client is None:
        nlp_result = {
            "entities_extracted": [ind["value"] for ind in heuristic_result["structured_indicators"][:10]],
            "summary": (
                f"Machine Learning classified this artifact as '{ml_result.get('predicted_category', 'General')}' "
                f"({ml_result.get('confidence', 0)}% confidence). Heuristic rule engine identified {heuristic_result['indicator_count']} indicators. "
                "AI-driven semantic extraction is in fallback mode because GROQ_API_KEY is not configured."
            )
        }
    else:
        sample_text = evidence_text[:6000] if evidence_text else "No text extracted."
        metadata_sample = json.dumps(metadata, indent=2, default=str)[:1000]

        prompt = f"""
You are a senior digital forensics investigator.
Analyze the following evidence content and extracted forensic indicators.

===== EVIDENCE TEXT SAMPLE =====
{sample_text}

===== ML PREDICTION =====
Predicted Threat: {ml_result.get('predicted_category')} ({ml_result.get('confidence')}% confidence)
Anomaly Flag: {ml_result.get('anomaly_detected')}

===== FORENSIC METADATA =====
{metadata_sample}

===== SUSPICIOUS INDICATORS FOUND =====
{json.dumps(heuristic_result['structured_indicators'][:15], default=str)}

Return ONLY a valid JSON object matching this structure:
{{
  "entities_extracted": ["extracted entity 1", "extracted entity 2"],
  "executive_summary": "Thorough forensic summary describing the nature of the file, potential threats, and artifacts found.",
  "summary": "Concise 2-sentence summary of findings."
}}
Do not invent information. Ensure valid JSON output.
"""
        try:
            response = client.chat.completions.create(
                model="openai/gpt-oss-20b",
                messages=[{"role": "user", "content": prompt}],
                temperature=0.2,
                response_format={"type": "json_object"}
            )
            nlp_result = json.loads(response.choices[0].message.content)
        except Exception as e:
            nlp_result = {
                "entities_extracted": [ind["value"] for ind in heuristic_result["structured_indicators"][:8]],
                "summary": f"Forensic heuristic completed. Groq AI response note: {str(e)}",
                "executive_summary": f"Evidence evaluated with {heuristic_result['indicator_count']} forensic findings detected. ML Category: {ml_result.get('predicted_category')}."
            }

    return {
        "risk_level": final_risk_level,
        "risk_score": final_risk_score,
        "indicator_count": heuristic_result["indicator_count"],
        "suspicious_indicators": heuristic_result["suspicious_indicators"],
        "structured_indicators": heuristic_result["structured_indicators"],
        "recommendations": heuristic_result["recommendations"],
        "executive_summary": nlp_result.get("executive_summary", nlp_result.get("summary", "")),
        "nlp": nlp_result,
        "ml": ml_result,
        "deepfake": deepfake_result,
        "metadata": metadata
    }