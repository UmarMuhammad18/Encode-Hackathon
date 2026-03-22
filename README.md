# PokéAgent – AI-Powered Pokémon Card Assistant

PokéAgent is an intelligent assistant for Pokémon card collectors. It helps you track your collection, get market insights, and receive trading advice – all powered by AI with built‑in safety guardrails using Civic.

![Demo]([https://via.placeholder.com/800x400?text=Demo+Screenshot+Placeholder](https://www.loom.com/share/23db0f7517ba44e29deb2de4ffd185a3))

## ✨ Features

- **Collection Management** – Add, view, edit, and delete cards with set, rarity, condition, and quantity.
- **AI Assistant** – Ask anything about your collection, trading strategies, or card values. Powered by OpenAI GPT‑3.5.
- **Civic Guardrails** – Protects against prompt injection, sensitive data leaks, and harmful content. Full audit logging.
- **Security Dashboard** – View all security events and active protections.
- **Responsive Design** – Works on desktop and mobile with a toggle button.
- **Authentication** – Secure signup/login with JWT.
- **Database** – PostgreSQL (local or cloud) for persistent storage.

## 🛠️ Tech Stack

- **Frontend**: HTML5, CSS3, JavaScript (vanilla)
- **Backend**: Node.js, Express, PostgreSQL, JSON Web Tokens
- **AI**: OpenAI API (GPT‑3.5)
- **Guardrails**: Civic Passport
- **Database Client**: `pg` (node-postgres)

## 🚀 Getting Started

### Prerequisites

- Node.js (v20 or later)
- PostgreSQL (local or remote)
- An OpenAI API key (for the AI assistant)

### Installation

1. **Clone the repository**
   ```bash
   git clone https://github.com/your-username/pokeagent-backend.git
   cd pokeagent-backend
2. **Install dependencies**
   ```bash
   cd backend
   npm install
3. **Set up environment variables**
 Create a .env file in the backend folder:
   ```text
   PORT=5000
   JWT_SECRET=your_super_secret_key
   DATABASE_URL=postgresql://postgres:postgres@localhost:5432/pokeagent
   OPENAI_API_KEY=sk-xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
   CIVIC_API_KEY=your_civic_key  # optional
4. **Create the database**
   Start PostgreSQL and create a database named pokeagent.
   Run the SQL schema from the section below.
5. **Run the baeckend**
   ```bash
   cd backend
   npm run dev
 The server will start at http://localhost:5000.
6. **Open the frontend**
  Open Pokeagent.html directly in your browser (or serve it with a local server like npx serve .).

### Database Setup

If you're using a local PostgreSQL, connect and run:
CREATE DATABASE pokeagent;

\c pokeagent

CREATE EXTENSION IF NOT EXISTS "pgcrypto";

CREATE TABLE "User" (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  email TEXT UNIQUE NOT NULL,
  password TEXT NOT NULL,
  name TEXT,
  "createdAt" TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE "Card" (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  name TEXT NOT NULL,
  set TEXT NOT NULL,
  number TEXT,
  rarity TEXT,
  condition TEXT,
  quantity INTEGER DEFAULT 1,
  language TEXT DEFAULT 'English',
  notes TEXT,
  "addedAt" TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  "marketPrice" FLOAT,
  "lastPriceCheck" TIMESTAMP WITH TIME ZONE,
  "userId" TEXT REFERENCES "User"(id) ON DELETE CASCADE
);

CREATE INDEX idx_card_user_id ON "Card"("userId");

### 📸 Demo



### 🛡️ Civic Guardrails

The agent is protected by Civic's safety features:
-  Prompt injection detection – Blocks attempts to override instructions.
-  Sensitive data redaction – Automatically hides credit cards, emails, etc.
-  Rate limiting – Prevents abuse.
-  Audit logging – All security events are logged and visible on the Security page.

### 🤝 Contributing

Feel free to open issues or pull requests. For major changes, please discuss first.

### 📄 License

MIT
