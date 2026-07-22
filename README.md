# FloodResponse AI 🌊🚨
### Explainable AI Emergency Dispatch & GIS Triage System

FloodResponse AI is a real-world, responsive emergency dispatch and triage management portal designed to streamline disaster response during severe monsoon flooding. Centered on the Ameerpet/Hyderabad pilot zone, the system leverages Explainable AI (XAI) algorithms, live IoT sensor feeds, and Leaflet.js GIS map integrations to coordinate civic emergency dispatches securely, accurately, and responsively.

👉 **Live Demo URL**: [https://nxtwave-topaz.vercel.app](https://nxtwave-topaz.vercel.app)

---

## 🚀 Key Features

*   **🗺️ GIS Street-Grid Route Detouring**: Draws multi-point routing paths through actual Hyderabad intersections (Khairatabad, Lakdikapul, Begumpet, Secunderabad, Charminar) rather than straight lines, allowing emergency vehicles to steer around blocked/flooded streets.
*   **🧠 Explainable AI (XAI) Triage Classification**: Citizen text descriptions are parsed, automatically categorized by hazard type, evaluated against base priority weights, and presented with transparent classification reasoning factors.
*   **⚠️ Human-in-the-Loop Safety Check**: Prevents alert fatigue and dispatch "rubber-stamping". Operators must manually check an audit verification box to authorize dispatches on low-confidence recommendation cases (<75%).
*   **🚫 Spam Ingestion Protection**: Debounces incoming reports with a 20-second submission lockout block, preventing duplicate reports from skewing incident priority ratings.
*   **📱 Horizontal Responsive Layout**: A mobile-friendly navbar replaces the sidebar layout on tablets, phones, and high-zoom screens, preventing navigation lockups.
*   **📡 Offline-Resilient Local Queue**: Stores reports in browser local memory during connection dropouts, syncing automatically once connectivity is restored.
*   **💬 Context-Aware Chat Simulator**: Facilitates live SMS chat with stranded residents, responding dynamically to operator keywords and hazard types.

---

## 🛠️ Tech Stack

*   **Frontend**: React (Vite, Hooks, Context, UseMemo)
*   **Styling**: Custom CSS (responsive grid system, glassmorphism, slide notifications)
*   **Maps & GIS**: Leaflet.js + OpenStreetMap API
*   **Triage Engine**: Custom Structured NLP Classifier & Telemetry Parser
*   **Linter & Build**: Oxlint (Oxc) + Vite Production Builder
*   **Deployment**: Vercel

---

## 💻 Local Setup & Installation

Follow these steps to run the project locally on your machine:

1.  **Clone the Repository**:
    ```bash
    git clone <YOUR_GITHUB_REPOSITORY_URL>
    cd nxtwave
    ```

2.  **Install Dependencies**:
    ```bash
    npm install
    ```

3.  **Run Development Server**:
    ```bash
    npm run dev
    ```
    Open `http://localhost:5173` in your browser.

4.  **Lint Verification**:
    ```bash
    npm run lint
    ```

5.  **Build Assets**:
    ```bash
    npm run build
    ```
