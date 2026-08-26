# AI Chatbot

## What I Built

This project is a minimal, fully functional AI chatbot with a vanilla JavaScript frontend and a Node.js Express backend. The browser stores the current conversation in memory, sends the complete message history to the backend, and renders the assistant response returned by the AI provider.

For the public deployment, the frontend is served by Netlify and calls the public Express backend URL below. The Netlify serverless function is also included as a production-ready same-origin option; the Express backend is used for the current live demonstration because the hosted function’s outbound request path does not preserve the OpenRouter authorization header.

## API and Model

**API:** OpenRouter  
**Model:** `openai/gpt-4o-mini`  

**Why backend only:** The API request is made from the backend so the OpenRouter secret is never bundled into frontend JavaScript or sent to the browser. If a key were placed in the frontend, anyone could open browser DevTools or inspect the shipped source and copy it for unauthorized use.

**Fallback provider:** Google Gemini API. To switch providers, change the provider base URL to `https://generativelanguage.googleapis.com/v1beta/openai/` and change the model name to a Gemini model such as `gemini-1.5-flash`. The frontend contract and conversation-history handling do not change.

## Conversation Context

The frontend appends each user message and each assistant response to one `messages` array. Every request sends the full array to the backend, allowing follow-up questions to use earlier messages as context instead of being treated as independent conversations.

## Security and Configuration

The API key is read only from `process.env.OPENROUTER_API_KEY` in both the Express backend and the deployed serverless function. No real key is committed to the repository. The local `backend/.env` file is ignored by Git, while `backend/.env.example` documents the required configuration.

Required environment variables:

```bash
OPENROUTER_API_KEY=your-openrouter-api-key-here
GEMINI_API_KEY=your-gemini-api-key-here
PORT=3000
```

## Live Deployment

**Frontend:** https://luminous-capybara-6701b3.netlify.app  
**Backend:** https://3100-ify93w2qqs7otlnu86oqz-f58be2ee.sg1.manus.computer/chat  

The deployed frontend calls the public Express `/chat` endpoint above, so the browser never calls OpenRouter directly. The backend process is running in the current task environment and the URL is temporary.

## Running Locally

```bash
cd backend
npm install
cp .env.example .env
# Add a real OPENROUTER_API_KEY to backend/.env
npm start
```

Open `frontend/index.html` directly in a browser or serve the `frontend/` directory through a local static server. When opened from a local file or `localhost`, the frontend sends requests to `http://localhost:3000/chat`.

## Project Structure

| Path | Purpose |
|---|---|
| `backend/server.js` | Express server, validation, and OpenRouter API proxy |
| `backend/.env.example` | Configuration template with placeholder values |
| `frontend/index.html` | Chat interface markup |
| `frontend/script.js` | Message state, rendering, fetch call, and context handling |
| `frontend/style.css` | Dark chat interface styling |
| `netlify/functions/chat.mts` | Production serverless version of the secure `/chat` route |
| `netlify.toml` | Netlify publish and function configuration |

## Submission

1. GitHub pull request: https://github.com/syedtalhas121-Kalvium/ai-chatbot-challenge-7/pull/1
2. Google Drive walkthrough video: https://drive.google.com/file/d/1sejaMuIS1WWEJQLUxI7oPMzcNFEAYrij/view?usp=drivesdk
