# Media Streaming Hub (Cloudflare-Native) 🌐

## 📌 Project Overview
A fast, lightweight media streaming platform built to leverage the power of the **Cloudflare ecosystem**. This project focuses on minimizing latency and maximizing uptime by serving content directly from the network edge.

## 🏗️ The Cloud Stack
Instead of traditional heavy server management, I focused on a modern, "Edge-first" architecture:

* **Deployment:** [Cloudflare Pages/Workers] for high-speed global hosting.
* **Media Delivery:** Cloudflare’s Global Network to ensure low-latency streaming.
* **DNS & Security:** Managed via Cloudflare to protect the application and optimize traffic.
* **Frontend:** React.js, designed for rapid loading and responsive media playback.

## 🚀 Key Features
* **Edge Delivery:** By utilizing Cloudflare, media assets are delivered from the nearest data center to the user, drastically reducing buffering.
* **Auto-Scaling:** The infrastructure is serverless, meaning it handles traffic spikes automatically without manual intervention.
* **Optimized Performance:** Implemented efficient asset management within the React frontend to work in harmony with Cloudflare's caching layers.

## 🧠 Why I Chose This Path
As part of my journey in **Computer Systems Engineering**, I wanted to experiment with **Serverless Architecture**. 
* I moved away from traditional servers to see how "Edge" logic improves user experience.
* I learned how to manage global DNS settings and SSL certificates to ensure the platform is secure and professional.

## 🛠️ How to Run
1. Clone the repo: `git clone [your-repo-link]`
2. Install dependencies: `npm install`
3. Deploy to Cloudflare: `npm run deploy`
