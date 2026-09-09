"""
Network Forensics Route — GenAI-powered analysis of network logs, PCAP exports,
firewall logs, and raw IP traffic text.
"""
from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
import re
import os
import json
from groq import Groq
from dotenv import load_dotenv
from datetime import datetime, timezone

load_dotenv()

GROQ_API_KEY = os.getenv("GROQ_API_KEY")

router = APIRouter(
    prefix="/network-forensics",
    tags=["Network Forensics"]
)

# ── Precompiled network patterns ──────────────────────────────────────────────

RE_IPV4 = re.compile(
    r"\b(?:(?:25[0-5]|2[0-4]\d|[01]?\d\d?)\.){3}(?:25[0-5]|2[0-4]\d|[01]?\d\d?)\b"
)
RE_URL = re.compile(r"https?://(?:[-\w.]|(?:%[\da-fA-F]{2}))+[^\s\"'<>)]*")
RE_PORT = re.compile(r"(?:port|:)(\d{1,5})\b", re.IGNORECASE)
RE_MAC = re.compile(r"\b([0-9A-Fa-f]{2}[:-]){5}[0-9A-Fa-f]{2}\b")
RE_DOMAIN = re.compile(r"\b(?:[a-zA-Z0-9-]+\.)+(?:com|net|org|io|gov|edu|ru|cn|uk|info|xyz|onion)\b")
RE_HTTP_STATUS = re.compile(r"\b(4\d{2}|5\d{2})\b")
RE_DNS_QUERY = re.compile(r"(?:query|dns|resolve)[:\s]+([a-zA-Z0-9._-]+\.[a-zA-Z]{2,})", re.IGNORECASE)
RE_SCAN_PATTERN = re.compile(r"\b(?:SYN|RST|ICMP|PING|nmap|masscan|zmap)\b", re.IGNORECASE)

SUSPICIOUS_PORTS = {
    22: "SSH", 23: "Telnet (unencrypted)", 445: "SMB/WannaCry vector",
    3389: "RDP", 4444: "Metasploit default", 1337: "Leet/malware C2",
    6666: "IRC botnet C2", 9001: "Tor relay", 4899: "Radmin RAT",
    31337: "Elite hacker tradition / backdoor",
}

INTERNAL_PREFIXES = ("10.", "192.168.", "172.16.", "172.17.", "172.18.", "172.19.",
                     "172.20.", "172.21.", "172.22.", "172.23.", "172.24.", "172.25.",
                     "172.26.", "172.27.", "172.28.", "172.29.", "172.30.", "172.31.",
                     "127.", "169.254.", "::1", "fc00:", "fe80:")


def classify_ip(ip: str) -> str:
    if any(ip.startswith(pfx) for pfx in INTERNAL_PREFIXES):
        return "Internal"
    return "External"


def parse_network_artifacts(text: str) -> dict:
    """Extract all network IOCs from raw log text."""
    ips_raw = RE_IPV4.findall(text)
    urls = RE_URL.findall(text)
    ports_raw = [int(p) for p in RE_PORT.findall(text) if p.isdigit() and int(p) <= 65535]
    macs = RE_MAC.findall(text)
    domains = list(set(RE_DOMAIN.findall(text)))
    http_errors = RE_HTTP_STATUS.findall(text)
    dns_queries = RE_DNS_QUERY.findall(text)
    scan_sigs = RE_SCAN_PATTERN.findall(text)

    # Deduplicate IPs and categorize
    ip_map = {}
    for ip in ips_raw:
        if ip not in ip_map:
            ip_map[ip] = {"ip": ip, "type": classify_ip(ip), "occurrences": 0}
        ip_map[ip]["occurrences"] += 1

    ip_list = sorted(ip_map.values(), key=lambda x: x["occurrences"], reverse=True)

    # Flag suspicious ports
    suspicious_port_findings = []
    seen_ports = set()
    for p in ports_raw:
        if p in SUSPICIOUS_PORTS and p not in seen_ports:
            seen_ports.add(p)
            suspicious_port_findings.append({
                "port": p,
                "service": SUSPICIOUS_PORTS[p],
                "severity": "HIGH" if p in [4444, 31337, 1337, 6666] else "MEDIUM"
            })

    # Generate findings list
    findings = []

    if scan_sigs:
        findings.append({
            "type": "Network Scan",
            "severity": "HIGH",
            "title": f"Port/Host Scan Detected ({', '.join(set(scan_sigs))})",
            "detail": "Scan tool signatures found — indicative of reconnaissance activity."
        })

    external_ips = [ip for ip in ip_list if ip["type"] == "External"]
    if len(external_ips) > 5:
        findings.append({
            "type": "Lateral Movement / Exfiltration",
            "severity": "HIGH",
            "title": f"{len(external_ips)} Unique External IP Addresses Found",
            "detail": f"Top external: {', '.join([i['ip'] for i in external_ips[:5]])}"
        })

    for pf in suspicious_port_findings:
        findings.append({
            "type": "Suspicious Port",
            "severity": pf["severity"],
            "title": f"Port {pf['port']} ({pf['service']}) detected",
            "detail": f"Port {pf['port']} is associated with {pf['service']}."
        })

    if http_errors:
        err_counts = {}
        for e in http_errors:
            err_counts[e] = err_counts.get(e, 0) + 1
        top_errors = sorted(err_counts.items(), key=lambda x: x[1], reverse=True)[:5]
        findings.append({
            "type": "HTTP Anomalies",
            "severity": "MEDIUM",
            "title": f"{sum(err_counts.values())} HTTP error responses detected",
            "detail": "Errors: " + ", ".join([f"{c} ({n}x)" for c, n in top_errors])
        })

    if dns_queries:
        findings.append({
            "type": "DNS Queries",
            "severity": "LOW",
            "title": f"{len(dns_queries)} DNS queries extracted",
            "detail": f"Domains: {', '.join(dns_queries[:6])}"
        })

    return {
        "ip_list": ip_list[:30],
        "unique_ips": len(ip_map),
        "external_ip_count": len(external_ips),
        "urls": urls[:20],
        "domains": domains[:20],
        "suspicious_ports": suspicious_port_findings,
        "http_errors": list(set(http_errors)),
        "dns_queries": dns_queries[:15],
        "scan_signatures": list(set(scan_sigs)),
        "mac_addresses": list(set(macs))[:10],
        "findings": findings,
        "total_lines": len(text.splitlines()),
    }


class NetworkAnalysisRequest(BaseModel):
    log_text: str
    log_type: str = "generic"  # "firewall", "pcap", "http", "dns", "generic"


@router.post("/analyze")
def analyze_network_log(payload: NetworkAnalysisRequest):
    """
    Analyze raw network log text using regex IOC extraction + GenAI summary.
    """
    if not payload.log_text or len(payload.log_text.strip()) < 10:
        raise HTTPException(status_code=400, detail="Log text is too short to analyze.")

    # Step 1: Local heuristic extraction (fast, no LLM needed)
    artifacts = parse_network_artifacts(payload.log_text)

    # Step 2: GenAI forensic summary using Groq
    ai_summary = None
    if GROQ_API_KEY:
        log_sample = payload.log_text[:5000]
        prompt = f"""You are a senior network forensics investigator.
Analyze the following {payload.log_type} network log and provide a concise forensic assessment.

=== EXTRACTED IOC SUMMARY ===
Unique IPs: {artifacts['unique_ips']} ({artifacts['external_ip_count']} external)
Suspicious Ports: {[f['port'] for f in artifacts['suspicious_ports']]}
Scan Signatures: {artifacts['scan_signatures']}
HTTP Errors: {artifacts['http_errors']}
DNS Queries: {artifacts['dns_queries'][:5]}
Findings: {len(artifacts['findings'])} issues detected

=== RAW LOG SAMPLE ===
{log_sample}

Provide:
1. Executive summary (2-3 sentences)
2. Key threat indicators identified
3. Recommended immediate actions
4. MITRE ATT&CK techniques observed (if any)

Be concise and precise. Format clearly with headers."""

        try:
            groq_client = Groq(api_key=GROQ_API_KEY)
            response = groq_client.chat.completions.create(
                model="openai/gpt-oss-20b",
                messages=[{"role": "user", "content": prompt}],
                temperature=0.2,
                max_tokens=800
            )
            ai_summary = response.choices[0].message.content
        except Exception as e:
            ai_summary = f"GenAI summary unavailable: {str(e)}"
    else:
        ai_summary = "Groq API key not configured. Showing heuristic analysis only."

    return {
        "artifacts": artifacts,
        "ai_summary": ai_summary,
        "log_type": payload.log_type,
        "analyzed_at": datetime.now(timezone.utc).isoformat(),
    }
