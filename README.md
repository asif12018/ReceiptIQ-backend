# 🧾 ReceiptIQ - Smart Financial Management Backend

**ReceiptIQ** is a professional, AI-powered financial assistant and receipt management backend. It empowers users to track expenses, manage savings goals, and gain AI-driven financial insights through receipt scanning, voice processing, and intelligent analysis.

---

## 🌟 Unique Features

-   **🤖 AI-Powered Receipt Scanning**: Uses advanced OCR and Generative AI (Gemini/OpenAI) to automatically extract merchant names, total amounts, and itemized expenses from receipt images.
-   **🎙️ Voice-to-Expense**: Enter expenses naturally using voice commands, processed by AI to categorize and log data.
-   **🎯 Intelligent Goal Tracking**: Set financial goals (e.g., buying a motorcycle) and receive AI-generated advice on daily budget caps and saving strategies.
-   **📅 Subscription Detection**: Automatically identifies recurring subscriptions from your spending patterns.
-   **🛡️ Robust Admin Panel**: Control system-wide settings, manage users, monitor AI usage, and toggle maintenance modes.
-   **🔐 Enterprise-Grade Auth**: Secure authentication powered by `Better-Auth`, including session management and verification flows.
-   **📈 AI Quota & Logging**: Comprehensive tracking of AI API usage and system logs for performance monitoring.

---

## 🏗️ Project Structure

The project follows a **Modular Architecture** for scalability and maintainability.

```text
src/
├── app/
│   ├── config/             # Configuration files (env, database, cloud)
│   ├── lib/                # Third-party library initializations (Prisma, Cloudinary)
│   ├── middlewares/        # Global and route-specific middlewares (Auth, Error handling)
│   ├── modules/            # Domain-driven feature modules
│   │   ├── auth/           # Authentication logic & session management
│   │   ├── chat/           # AI Financial Assistant chat features
│   │   ├── goal/           # Savings goals and AI budget advice
│   │   ├── receipt/        # Receipt scanning (Image, Voice, Text)
│   │   └── user/           # User profiles and management
│   ├── routes/             # Aggregated API routing
│   ├── templates/          # EJS email/view templates
│   ├── utils/              # Helper functions and constants
│   └── views/              # Optional static views
├── app.ts                  # Express application setup
└── server.ts               # Server entry point
```

---

## ⚙️ Tech Stack

-   **Core**: [Node.js](https://nodejs.org/) & [Express.js v5](https://expressjs.com/)
-   **Language**: [TypeScript](https://www.typescriptlang.org/)
-   **Database & ORM**: [PostgreSQL](https://www.postgresql.org/) with [Prisma](https://www.prisma.io/)
-   **AI Integration**: [Google Gemini](https://ai.google.dev/), [Groq](https://groq.com/), and [OpenAI](https://openai.com/)
-   **Authentication**: [Better-Auth](https://better-auth.com/)
-   **Storage**: [Cloudinary](https://cloudinary.com/) (Media/Avatar management)
-   **Logging**: [Winston](https://github.com/winstonjs/winston)
-   **Email**: [Nodemailer](https://nodemailer.com/)

---

## 🚀 Project Setup

Follow these steps to get the development environment running:

### 1. Prerequisites
-   Node.js (v18+ recommended)
-   PostgreSQL database instance
-   Cloudinary Account (for image uploads)
-   AI API Keys (Gemini, Groq, or OpenAI)

### 2. Installation
Clone the repository and install dependencies:
```bash
npm install
```

### 3. Environment Configuration
Create a `.env` file in the root directory and add the following:
```env
# Database
DATABASE_URL="postgresql://user:password@localhost:5432/receiptiq"

# AI Keys
GEMINI_API_KEY="your_gemini_key"
GROQ_API_KEY="your_groq_key"
OPENAI_API_KEY="your_openai_key"

# Cloudinary
CLOUDINARY_CLOUD_NAME="your_cloud_name"
CLOUDINARY_API_KEY="your_api_key"
CLOUDINARY_API_SECRET="your_api_secret"

# Auth
BETTER_AUTH_SECRET="your_secret"
BETTER_AUTH_URL="http://localhost:5000"

# Mail
EMAIL_USER="your_email"
EMAIL_PASS="your_app_password"
```

### 4. Database Setup
Generate the Prisma client and push the schema to your database:
```bash
npm run generate
npm run push
```

### 5. Running the App
Start the development server:
```bash
npm run dev
```

---

## 🔌 API Endpoints (Quick Reference)

| Method | Endpoint | Description |
| :--- | :--- | :--- |
| `POST` | `/api/v1/auth/signup` | Register a new account |
| `POST` | `/api/v1/receipts/scan` | Scan receipt image (AI OCR) |
| `POST` | `/api/v1/receipts/voice` | Log expense via voice |
| `POST` | `/api/v1/goals/create` | Set a new financial goal |
| `GET` | `/api/v1/goals/:id/ai-advice` | Get AI budget advice for a goal |
| `GET` | `/api/v1/chat` | Chat with the financial assistant |

---

## 📝 License

This project is licensed under the **ISC License**.

---
Built with ❤️ for the Contest Submission.
