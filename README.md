# 🛡️ [ScamShield AI]

**Intelligent scam detection for SMS, URLs, and phone numbers.**

[ScamShield AI] is a full-stack web application designed to proactively detect and analyze scams from text messages. It combines a machine-learning model with real-time external API checks to provide a comprehensive, easy-to-understand verdict on whether a message is safe, suspicious, or a high-risk scam.

## ✨ Features

  * **ML-Powered Text Analysis:** Uses a `LogisticRegression` model (trained on the `spam.csv` dataset) to calculate a scam confidence score based on message content.
  * **Rule-Based Detection:** Instantly flags common, high-risk scam patterns (e.g., KYC scams, Electricity Bill threats, and Lottery scams).
  * **Deep URL Analysis:**
      * **Redirect Following:** Automatically follows shortened links (like `bit.ly`) to analyze the final destination URL.
      * **Google Safe Browsing:** Checks the final URL against Google's real-time database of malicious and phishing sites.
      * **WHOIS Domain Age Check:** Flags newly registered domains (e.g., "created 3 days ago"), a major red flag for scam operations.
  * **Phone Number Reputation:** Uses the Google Custom Search API to find public reports, complaints, or scam warnings associated with a phone number.
  * **Modern & Responsive UI:** A clean, dark-mode interface built with Next.js, Tailwind CSS, and Framer Motion that provides a detailed, actionable report for every analysis.

## 🏗️ How It Works

The application operates with a simple, powerful flow:

1.  A user pastes a suspicious message into the **Next.js frontend**.
2.  The frontend sends the text to the **FastAPI backend**'s `/analyze` endpoint.
3.  The backend orchestrates a multi-step analysis:
    a.  Checks the text against hard-coded **scam rules**.
    b.  If no rule matches, it uses the **scikit-learn ML model** to get a scam confidence score.
    c.  It extracts all URLs and phone numbers using regex.
    d.  It queries **Google Safe Browsing**, **Google Custom Search**, and **WHOIS** services in parallel for all extracted entities.
4.  The backend consolidates all findings into a single JSON response.
5.  The frontend parses this JSON and displays a formatted verdict card with detailed reports on any found URLs or phone numbers.
   
### Technology Stack **🛠️**

| Component | Technology | Description |
| :--- | :--- | :--- |
| **Frontend** | **Next.js 15+**, **React 19**, **TypeScript**, **Tailwind CSS**, **Framer Motion** | Provides a modern, responsive, and animated UI for real-time results display. |
| **Backend** | **Python**, **FastAPI** | A **high-performance**, **asynchronous** framework for handling concurrent ML predictions and external API calls. |
| **Machine Learning** | **Scikit-learn**, **TF-IDF Vectorizer** | Core text analysis model. |

## 🏁 Getting Started

To get a local copy up and running, follow these steps.

### Prerequisites

You will need:

  * **Python 3.8+** and `pip`
  * **Node.js 18+** and `npm`
  * **Google Safe Browsing API Key**
  * **Google Custom Search API Key**
  * **Google Custom Search Engine ID (CX)**

### 1\. Backend Setup (`/backend`)

1.  **Navigate to the backend folder:**

    ```bash
    cd backend
    ```

2.  **Create and activate a virtual environment:**

    ```bash
    # On macOS/Linux
    python3 -m venv venv
    source venv/bin/activate

    # On Windows
    python -m venv venv
    .\venv\Scripts\activate
    ```

3.  **Install Python dependencies:**

    ```bash
    pip install -r requirements.txt
    ```

4.  **Create an environment file:**
    Create a file named `.env` in the `/backend` directory.

5.  **Add your API keys to `.env`:**

    ```ini
    # Google API Keys
    GOOGLE_SAFE_BROWSING_API_KEY="YOUR_SAFE_BROWSING_API_KEY_HERE"
    GOOGLE_CUSTOM_SEARCH_API_KEY="YOUR_CUSTOM_SEARCH_API_KEY_HERE"
    GOOGLE_CUSTOM_SEARCH_CX="YOUR_CUSTOM_SEARCH_ENGINE_ID_HERE"

    # Frontend URL (for CORS)
    ALLOWED_ORIGINS="http://localhost:3000"
    ```

6.  **(Optional) Retrain the Model:**
    The pre-trained `scam_model.pkl` and `vectorizer.pkl` are already included. To retrain them using the `spam.csv` file, simply run:

    ```bash
    python train.py
    ```

### 2\. Frontend Setup (`/frontend`)

1.  **Navigate to the frontend folder:**

    ```bash
    cd frontend
    ```

2.  **Install Node.js dependencies:**

    ```bash
    npm install
    ```

3.  **Create a local environment file:**
    Create a file named `.env.local` in the `/frontend` directory.

4.  **Add the backend API URL to `.env.local`:**
    This tells the Next.js app where to find your FastAPI server.

    ```ini
    NEXT_PUBLIC_API_URL="http://localhost:8000"
    ```

## 🏃‍♂️ Running the Application

You will need two separate terminals.

1.  **Run the Backend Server:**
    In your first terminal (from the `/backend` directory):

    ```bash
    uvicorn main:app --reload
    ```

    The API will be running at `http://localhost:8000`.

2.  **Run the Frontend App:**
    In your second terminal (from the `/frontend` directory):

    ```bash
    npm run dev
    ```

    The frontend will be running at `http://localhost:3000`.

3.  **Open your browser** and navigate to `http://localhost:3000` to use ScamShield AI.


-----

## 🤝 Contributing

We welcome **contributions**, feature suggestions, and bug reports\! Please feel free to **open an issue** or submit a pull request to help improve our collective defense against scams.

-----


[ScamShield AI]: http://scamshield-ai-delta.vercel.app


