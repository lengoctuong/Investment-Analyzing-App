# 📈 Investment Performance Analyzer
---

> A dynamic web application designed to provide comprehensive analysis of performance metrics of fund and stocks through interactive charts and detailed analytics. This project leverages modern web technologies including React, Vite, and TypeScript to deliver a responsive and intuitive user experience.

## 🔍 Overview

The application allows users to:

*   **Visualize Performance:** Access interactive charts displaying performance trends, beta analysis, drawdowns, and more.
*   **Analyze Metrics:** Dive into various fund/stock metrics and analytics to inform investment decisions.
*   **Real-time Data Integration:** Connect seamlessly with financial data services to pull in the latest fund/stock information.

## ✨ Features

*   **Performance Charts:** Detailed visualizations of fund/stock performance over time.
*   **Risk Analysis:** Insights into volatility, drawdowns, and other risk measures.
*   **Interactive UI:** User-friendly components for an enhanced data exploration experience.
*   **Modular Architecture:** Easily extensible components and services for future features.

## ⚙️ Installation

1.  **Clone the repository:**
    ```bash
    git clone https://github.com/lengoctuong/Investment-Analyzing-App.git
    cd Investment-Analyzing-App
    ```

2.  **Set up the Python Data Server:**
    *   Install the required Python libraries:
        ```bash
        pip install pandas vnstock fastapi uvicorn
        ```
    *   Run the server to serve `vnstock` data:
        ```bash
        uvicorn services.vnstock-server:app --reload
        ```

3.  **Install frontend dependencies:**
    *(In a new terminal window)*
    ```bash
    npm install
    ```

4.  **Run the development server:**
    ```bash
    npm run dev
    ```

5.  **Open the app:** Visit `http://localhost:3000` in your browser.

## 📂 Project Structure

*   `App.tsx`: The main entry point of the application.
*   `components/`: Contains UI components such as charts, tables, and controls.
*   `services/`: Houses API services and performance calculation logic.
*   `index.html` & `index.tsx`: Serve as the foundation for rendering the app.

## 🤝 Contributing

Contributions are welcome! Please fork the repository and submit pull requests for any improvements or bug fixes.

## 📜 License

This project is licensed under the MIT License.
