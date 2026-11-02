# Praxis - Project Evaluation & Technical Mapping Guide

## 1. Executive Summary

Praxis is a **Multi-Tenant B2B/B2C Decision Intelligence SaaS**, rather than a simple CRUD application. The product combines custom decision algorithms, a RAG-based ANI (Artificial Narrow Intelligence), predictive machine-learning models, and enterprise authentication/authorisation. Its UI is the entry point to a deeper platform: it supports distinct individual and business journeys, tenant-isolated data, role-aware approvals, and recommendation workflows.

## 2. Feature & Navigation Map (What to click)

Start on the Hero page and choose one of these three pathways:

- **Demo:** Use the one-click login to evaluate the multi-tier approval system immediately. It loads pre-configured roles so the approval and decision flows can be tested without setting up an organisation first.
- **Individual (B2C):** Follow the standard single-user journey, including the 30-day trial.
- **Business (B2B):** Follow the enterprise journey, where a business can define its own roles and decision/approval rules.

The application uses Browser History through React Router. This means each view has a predictable URL and the browser's back/forward controls behave naturally, making navigation between these flows smooth and repeatable during evaluation.

## 3. Academic Mapping (Where the code lives)

| Subject | Concept | Where to find it in the code |
| :--- | :--- | :--- |
| **FLAT** | Deterministic Finite Automaton (DFA) | `backend/app/formal_engine.py` (Validates JSON input states) |
| **DAA** | Dijkstra's Algorithm | `backend/app/decision_engine.py` (Optimizes the best maintenance action) |
| **AI-ML** | Random Forest Regressor/Classifier | `backend/app/prediction/model.py` & `models/*.joblib` (Predicts downtime, cost, risk) |

## 4. Enterprise SaaS Architecture (Why it's impressive)

- **Authentication:** Authentication is implemented with **Clerk** (OAuth), with a fallback Custom JWT path for demo accounts. This supports a low-friction demonstration while keeping the production-oriented sign-in design.
- **Multi-Tenancy:** Every database row carries a `tenant_id`. Queries and permissions are scoped to that tenant, so Company A cannot see Company B's data; this is enforced through strict RBAC.
- **RAG AI (ANI):** The AI is not a generic chatbot. It retrieves from the approximately 5,000-word `backend/app/data/knowledge_base.md` and is designed to strictly refuse off-topic questions through ANI guardrails. Its purpose is to explain and assist with Praxis-specific decision intelligence, not to answer arbitrary web-style questions.

## 5. Security Analogy (If asked about system resilience)

**Antibiotic resistance analogy:** antibiotics do not create resistant bacteria; they select the bacteria that already survive the drug. In the same way, adversarial attacks select for hardened software. Systems with effective input validation, rate limiting, access controls, and secure defaults are more likely to withstand attacks, while weaker designs are exposed or compromised. The useful takeaway is that repeated adversarial pressure rewards resilient engineering and encourages continuous hardening.

## 6. How to test the AI (Viva Script)

1. Go to the AI Chat.
2. Ask a general question: **"Who is the president?"** The AI should refuse because it is outside the ANI's scoped knowledge base.
3. Ask a Praxis question: **"How does Dijkstra optimize decisions?"** The AI should answer using the Knowledge Base, demonstrating grounded retrieval and the relevance guardrail.
