# Intelligent Assessment Moderation System (IAMS)

An AI-assisted platform for moderating university exam papers.  
The system helps lecturers and moderators ensure fairness, coverage, and correct difficulty in assessments.


## Key Features

- Module and Learning Outcome (LO) management
- Exam question upload and manual entry
- Learning Outcome Coverage Analysis (question ↔ LO relevance)
- Bloom’s Taxonomy–based analysis
- AI-powered question generation aligned to LOs and Bloom levels


## Tech Stack

- Backend: Node.js, Express, MongoDB, JWT Authentication
- AI: Large Language Model (LLM) via Groq API
- Document Parsing: PDF (`pdf-parse`) and DOCX (`mammoth`)
- Frontend: React (under development)

## Repository Structure

intelligent-assessment-moderation-system/
├── backend/ # Node.js + Express API
│ ├── routes/ # auth, modules, questions, coverage, ai
│ ├── models/ # MongoDB models
│ └── server.js
└── frontend/ # React UI (WIP)


## System Architecture

![System Architecture]()


## Getting Started

### Prerequisites
- Node.js 18+
- MongoDB (local or Atlas)
- Groq API key

### Environment Setup

Create `backend/.env`:

env
PORT=5000
MONGODB_URI=mongodb://localhost:27017/loc_analyzer
JWT_SECRET=your_secret_key
GROQ_API_KEY=your_groq_api_key

Run Backend
bash


cd backend
  npm install
  npm run dev

Backend runs at:
  http://localhost:5000

Run Frontend (Optional)
  cd frontend
  npm install
  npm start
  Frontend runs at:
  http://localhost:3000

Development Workflow
  main – stable
  dev – development
  feature/<name> – new features

git checkout dev
  git checkout -b feature/new-feature
  git commit -m "Add new feature"
  git push
