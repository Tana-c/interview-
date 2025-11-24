# AI Interviewer Backend

Backend API server for AI Interviewer system.

## 🚀 Quick Start

### 1. Install Dependencies

```bash
npm install
```

### 2. Set Up Environment Variables

Create a `.env` file in the `backend/` directory:

```env
# OpenAI API Configuration
# Get your API key from: https://platform.openai.com/api-keys
OPENAI_API_KEY=sk-your-api-key-here

# Server Configuration (optional)
PORT=8001
API_PORTS=8000,8001

# Node Environment
NODE_ENV=development
```

**Note:** If you don't set `OPENAI_API_KEY`, the system will use example questions as fallback.

### 3. Start Development Server

```bash
npm run dev
```

The server will automatically restart when you modify files in `src/` or `data/`.

### 4. Start Production Server

```bash
npm start
```

## 📝 API Endpoints

- `GET /health` - Health check
- `POST /api/start` - Start interview session
- `POST /api/answer` - Submit answer and get next question
- `GET /api/summary/:sessionId` - Get interview summary
- `GET /api/insight/:sessionId` - Get consumer insights
- `POST /api/save/:sessionId` - Save session to file

## 🔧 Configuration

Edit `data/config.json` to customize:
- Code types and descriptions
- Question generation prompt
- Analysis prompt
- Example questions
- Model settings

## ⚙️ Environment Variables

| Variable | Description | Required |
|----------|-------------|----------|
| `OPENAI_API_KEY` | OpenAI API key for AI question generation | No (falls back to examples) |
| `PORT` | Server port | No (default: 8000) |
| `API_PORTS` | Comma-separated list of ports | No (default: 8000,8001) |
| `NODE_ENV` | Node environment | No (default: development) |

## 🐛 Troubleshooting

### Warning: OPENAI_API_KEY not found

This is normal if you haven't set up the API key. The system will use example questions instead.

To enable AI question generation:
1. Get an API key from https://platform.openai.com/api-keys
2. Create `.env` file in `backend/` directory
3. Add `OPENAI_API_KEY=sk-your-key-here`
4. Restart the server

### Server not restarting automatically

Make sure you're running `npm run dev` (not `npm start`). The `dev` script uses nodemon for auto-restart.

