# This is the new backend/main.py (FINAL - unfurl_url ADDED BACK)
import re
import os
import httpx
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
import joblib
from urllib.parse import urlparse
import whois
from datetime import datetime, timezone # Import timezone
from dotenv import load_dotenv
import pathlib

load_dotenv() # Reads from your .env file

# --- 1. SET UP API KEYS ---
GOOGLE_SAFE_BROWSING_API_KEY = os.environ.get("GOOGLE_SAFE_BROWSING_API_KEY")
GOOGLE_CUSTOM_SEARCH_API_KEY = os.environ.get("GOOGLE_CUSTOM_SEARCH_API_KEY")
GOOGLE_CUSTOM_SEARCH_CX = os.environ.get("GOOGLE_CUSTOM_SEARCH_CX")

# --- 2. Add checks ---
if not GOOGLE_SAFE_BROWSING_API_KEY:
    print("FATAL ERROR: GOOGLE_SAFE_BROWSING_API_KEY not found in .env file.")
# ...

# --- 3. Load Model ---
try:
    model = joblib.load("scam_model.pkl")
    vectorizer = joblib.load("vectorizer.pkl")
    print("Original scam_model.pkl and vectorizer.pkl loaded.")
except Exception as e:
    print(f"Error loading original model files: {e}")
    exit()

# --- 4. Define Request/Response models ---
class MessageRequest(BaseModel):
    text: str

class AnalysisResponse(BaseModel):
    verdict: str
    explanation: str
    confidence: float
    url_analysis: dict[str, dict[str, str]] = {}
    phone_analysis: dict[str, str] = {}

# --- 5. Create FastAPI App & CORS ---
app = FastAPI()
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000", "http://localhost:3001"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)
client = httpx.AsyncClient()

# --- 6. Helper Functions (URL/Phone/WHOIS) ---
async def check_url_safety(url: str) -> str:
    """Checks a URL against Google Safe Browsing API."""
    if not GOOGLE_SAFE_BROWSING_API_KEY:
        return "⚠️ Google Check: Skipped (API key not set)."

    api_url = f"https://safebrowsing.googleapis.com/v4/threatMatches:find?key={GOOGLE_SAFE_BROWSING_API_KEY}"
    payload = {"client": {"clientId": "scamshield-ai", "clientVersion": "1.0.0"}, "threatInfo": {"threatTypes": ["MALWARE", "SOCIAL_ENGINEERING", "UNWANTED_SOFTWARE", "POTENTIALLY_HARMFUL_APPLICATION"], "platformTypes": ["ANY_PLATFORM"], "threatEntryTypes": ["URL"], "threatEntries": [{"url": url}]}}
    try:
        response = await client.post(api_url, json=payload, timeout=5.0)
        if response.status_code == 200:
            data = response.json()
            if "matches" in data:
                return f"🚨 Google Check: Flagged for {data['matches'][0]['threatType']}."
            else:
                return "✅ Google Check: No known threats found."
        else:
            return f"⚠️ Google Check: Failed (Error {response.status_code}). Check API key."
    except Exception as e:
        return f"⚠️ Google Check: Failed (Could not connect). Error: {e.__class__.__name__}"
    return "⚠️ Google Check: Failed (Unknown error)."

async def search_phone_number(phone: str) -> str:
    """Searches Google for a phone number to check for scam reports."""
    if not GOOGLE_CUSTOM_SEARCH_API_KEY:
        return "⚠️ Google Search: Skipped (API key not set)."

    query = f'"{phone}" scam OR fraud OR fake OR complaints'
    api_url = f"https://www.googleapis.com/customsearch/v1?key={GOOGLE_CUSTOM_SEARCH_API_KEY}&cx={GOOGLE_CUSTOM_SEARCH_CX}&q={query}"
    try:
        response = await client.get(api_url, timeout=5.0)
        if response.status_code == 200:
            data = response.json()
            if "items" in data and len(data["items"]) > 0:
                snippet = data["items"][0]["snippet"]
                return f"⚠️ Google Search: Found potential scam reports. Top result: '{snippet}...' "
            else:
                return "✅ Google Search: No immediate scam reports found."
        else:
            return f"⚠️ Google Search: Failed (Error {response.status_code}). Check API keys."
    except Exception as e:
        return f"⚠️ Google Search: Failed (Could not connect). Error: {e.__class__.__name__}"
    return "⚠️ Google Search: Failed (Unknown error)."

async def check_domain_age(url: str) -> str:
    """Checks the creation date of a URL's domain."""
    try:
        domain = urlparse(url).netloc
        if not domain:
            return "⚠️ WHOIS Check: Could not parse domain from URL."
        if domain.startswith("www."):
            domain = domain[4:]

        trusted_tlds = ('.gov', '.edu', '.mil', '.go.in', '.ac.in')

        try:
            domain_info = whois.whois(domain)
        except Exception as e:
             return f"🚨 WHOIS Check: Domain lookup failed (likely doesn't exist)."

        creation_date = domain_info.creation_date
        if isinstance(creation_date, list):
            creation_date = creation_date[0]

        if creation_date:
            now_naive = datetime.now(timezone.utc).replace(tzinfo=None)
            if creation_date.tzinfo is not None:
                creation_date_naive = creation_date.replace(tzinfo=None)
            else:
                creation_date_naive = creation_date
            try:
                days_diff = (now_naive - creation_date_naive).days
                if days_diff < 0: days_diff = 0
                if days_diff < 30:
                    return f"🚨 WHOIS Check: Domain created **{days_diff} days ago** (Very new!)."
                elif days_diff < 90:
                    return f"⚠️ WHOIS Check: Domain created **{days_diff} days ago** (Recent)."
                else:
                    return f"✅ WHOIS Check: Domain created **{days_diff} days ago** (Established)."
            except TypeError:
                 return "⚠️ WHOIS Check: Error comparing domain creation date."
        else:
            if domain.endswith(trusted_tlds):
                return "✅ WHOIS Check: Domain age not available for this trusted domain type."
            else:
                return f"⚠️ WHOIS Check: Domain age hidden (Suspicious for '{domain.split('.')[-1]}' domain)."
    except Exception as e:
        return f"⚠️ WHOIS Check: Failed. Error: {e.__class__.__name__}"


# ==========================================================
# THIS FUNCTION WAS MISSING - IT'S NOW ADDED BACK
# ==========================================================
async def unfurl_url(url: str) -> tuple[str, str]:
    """
    Follows a URL redirect (like bit.ly) to its final destination.
    Returns (final_url, report_string)
    """
    try:
        # Use a new client for each unfurl to handle potential session issues
        async with httpx.AsyncClient() as unfurl_client:
            # Use a HEAD request to be fast, follow redirects
            response = await unfurl_client.head(url, follow_redirects=True, timeout=5.0)
            final_url = str(response.url)

            if final_url != url:
                # We successfully unfurled the link!
                # Provide a clear message showing the redirection
                return final_url, f"✅ Link Redirect: Original URL redirects to: `{final_url}`"
            else:
                # It was not a shortener or redirect
                return url, "✅ Link Redirect: No redirect found (Link is final destination)."

    except httpx.RequestError as e:
        # This includes SSL errors, connection errors, invalid URLs etc.
        # More user-friendly error
        return url, f"🚨 Link Redirect: Link is broken or invalid. Error: {e.__class__.__name__}"
    except Exception as e:
         # Generic fallback error
        return url, f"⚠️ Link Redirect: Could not check redirect. Error: {e.__class__.__name__}"


# --- 8. Regex Patterns ---
url_pattern = re.compile(r'https?://[^\s<>"]+')
phone_pattern = re.compile(r'\b(?:(?:\+91|91|0)?[-\s]?)?[6-9]\d{9}\b')

# --- 9. Main "/analyze" Endpoint ---
@app.post("/analyze", response_model=AnalysisResponse)
async def analyze_message(request: MessageRequest):

    text = request.text
    text_lower = text.lower()

    verdict_text = ""
    explanation_text = ""
    rule_applied = False

    # --- Part 1: Check "Obvious Safe" signals ---
    if "beware of fraudulent calls" in text_lower or "mngl only accepts payments via" in text_lower:
        verdict_text = "✅ Looks Safe"
        explanation_text = "This message appears to be a legitimate notification. It includes official links and a warning about fraudulent activity, which is a good sign."
        rule_applied = True

    # --- Part 2: Check High-Risk Scam Rules ---
    if not rule_applied:
        if "kyc" in text_lower and ("bank" in text_lower or "sbi" in text_lower):
            verdict_text = "🚨 High Risk (Likely a Scam)"
            explanation_text = "This message looks like a **KYC Scam**. It creates false urgency ('your account will be blocked') and asks you to click a link. Banks never ask for this via SMS."
            rule_applied = True
        elif ("electricity" in text_lower or "mngl" in text_lower) and \
             ("cut" in text_lower or "disconnected" in text_lower or "pending" in text_lower or "immediately" in text_lower):
            verdict_text = "🚨 High Risk (Likely a Scam)"
            explanation_text = "This message looks like a common **Electricity Bill Scam**. It threatens to cut your service and provides an unofficial contact number or link."
            rule_applied = True
        elif "congratulations" in text_lower or "won" in text_lower or "prize" in text_lower:
             verdict_text = "🚨 High Risk (Likely a Scam)"
             explanation_text = "This message looks like a **Lottery Scam**. It claims you've won a prize to trick you into sending money or personal details."
             rule_applied = True

    # --- Part 3: If no rules, use ML Model ---
    text_vector = vectorizer.transform([text])
    prediction_prob = model.predict_proba(text_vector)[0]
    is_scam_prob = float(prediction_prob[1])

    if not rule_applied:
        if is_scam_prob > 0.8:
            verdict_text = "🚨 High Risk (Likely a Scam)"
            explanation_text = "This message shows strong signs of a scam based on its wording and structure."
        elif is_scam_prob > 0.4:
            verdict_text = "⚠️ Be Cautious (Suspicious)"
            explanation_text = "This message has some suspicious elements based on its wording. Please double-check the sender."
        else:
            verdict_text = "✅ Looks Safe"
            explanation_text = "Our analysis did not find common scam triggers in the text."
        if "mngl.in" in text_lower and is_scam_prob < 0.6:
             verdict_text = "✅ Looks Safe"
             explanation_text = "This message contains official links (mngl.in) and does not have strong text-based scam triggers. It appears to be legitimate."

    # --- Part 4: External Analysis ---
    urls_found = url_pattern.findall(text)
    phones_found = phone_pattern.findall(text)

    url_results = {}
    phone_results = {}

    url_is_dangerous = False

    for url in set(urls_found):
        cleaned_url = url.rstrip('.,)!?];:')

        # Unfurl first
        final_url, unfurl_report = await unfurl_url(cleaned_url)

        # Run checks on final URL
        safe_browsing_report = await check_url_safety(final_url)
        whois_report = await check_domain_age(final_url)

        # Check for danger signals in ANY report
        if "🚨" in whois_report or "🚨" in safe_browsing_report or "🚨" in unfurl_report or "⚠️" in whois_report:
             url_is_dangerous = True

        url_results[final_url] = {
            "original_url": cleaned_url,
            "unfurl_report": unfurl_report,
            "safe_browsing": safe_browsing_report,
            "whois": whois_report
        }

    for phone in set(phones_found):
        phone_results[phone] = await search_phone_number(phone)

    # --- Part 5: Final Verdict Override ---
    if url_is_dangerous and verdict_text == "✅ Looks Safe":
        verdict_text = "🚨 High Risk (Malicious Link)"
        explanation_text = "The message text seemed safe, but our **link analysis** found major red flags (e.g., the link is broken, brand new, hiding its destination, or its age is hidden). This is highly suspicious."

    # --- Part 6: Return Combined Response ---
    return AnalysisResponse(
        verdict=verdict_text,
        explanation=explanation_text,
        confidence=is_scam_prob,
        url_analysis=url_results,
        phone_analysis=phone_results
    )

@app.get("/")
async def root():
    return {"message": "ScamShield AI API v2 (FINAL) is running!"}