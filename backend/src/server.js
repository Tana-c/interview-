import express from 'express';
import cors from 'cors';
import { mkdir, readFile, writeFile } from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';
import { v4 as uuid } from 'uuid';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const DATA_DIR = path.join(__dirname, '..', 'data');
const CONFIG_PATH = path.join(DATA_DIR, 'config.json');
const DEFAULT_CONFIG_PATH = path.join(DATA_DIR, 'defaultConfig.json');
const SESSION_EXPORT_DIR = path.join(DATA_DIR, 'sessions');

const app = express();
app.use(cors());
app.use(express.json({ limit: '1mb' }));

const sessions = new Map();

const ensureSessionDir = async () => mkdir(SESSION_EXPORT_DIR, { recursive: true });

const readJsonFile = async (filePath, fallback = null) => {
  try {
    const raw = await readFile(filePath, 'utf-8');
    return JSON.parse(raw);
  } catch (error) {
    if (fallback !== null) return fallback;
    throw error;
  }
};

const writeJsonFile = async (filePath, data) =>
  writeFile(filePath, JSON.stringify(data, null, 2), 'utf-8');

const loadConfig = async () => {
  const defaults = await readJsonFile(DEFAULT_CONFIG_PATH, {});
  const config = await readJsonFile(CONFIG_PATH, defaults);
  return {
    ...defaults,
    ...config,
    code_types: config.code_types && Object.keys(config.code_types).length ? config.code_types : defaults.code_types,
    example_questions:
      config.example_questions && Object.keys(config.example_questions).length
        ? config.example_questions
        : defaults.example_questions,
    model_settings: config.model_settings || defaults.model_settings
  };
};

const DEFAULT_QUESTION_BANK = [
  { type: 'Functional', text: 'คุณใช้ {topic} อย่างไรและทำไมถึงเลือกใช้ {topic}?' },
  { type: 'Emotional', text: 'คุณรู้สึกอย่างไรเมื่อใช้ {topic}?' },
  { type: 'Barrier', text: 'มีอะไรที่ทำให้คุณไม่พอใจหรือไม่สะดวกเกี่ยวกับ {topic}?'},
  { type: 'Trigger', text: 'อะไรที่ทำให้คุณตัดสินใจซื้อหรือใช้ {topic}?'},
  { type: 'Brand Image', text: 'ถ้าคุณต้องแนะนำ {topic} ให้เพื่อน 3 คน คุณจะบอกอะไร?'}
];

const fillTemplate = (template = '', vars = {}) =>
  template.replace(/\{(\w+)\}/g, (_, key) => vars[key] ?? `{${key}}`);

const getQuestionTemplates = (config, topic) => {
  const entries = Object.entries(config.example_questions || {});
  if (!entries.length) {
    return DEFAULT_QUESTION_BANK.map((item) => ({
      type: item.type,
      text: fillTemplate(item.text, { topic, product: topic })
    }));
  }

  return entries.flatMap(([type, questions]) =>
    questions.map((text) => ({
      type,
      text: fillTemplate(text, { product: topic, topic })
    }))
  );
};

const pickNextQuestion = (session, config) => {
  const templates = getQuestionTemplates(config, session.topic);
  const asked = new Set(session.questionsAsked || []);
  const remaining = templates.filter((q) => !asked.has(q.text));
  const pool = remaining.length ? remaining : templates;
  const question = pool[Math.floor(Math.random() * pool.length)];

  session.questionsAsked = session.questionsAsked || [];
  session.questionsAsked.push(question.text);
  return question.text;
};

const simulateAnalysis = (session, answer, config) => {
  const codeTypes = Object.keys(config.code_types || {});
  const selectedType = codeTypes[Math.floor(Math.random() * codeTypes.length)] || 'Functional';
  const confidence = Number((0.55 + Math.random() * 0.4).toFixed(2));
  const trimmedQuote = answer.length > 160 ? `${answer.slice(0, 157)}...` : answer || 'ไม่มีคำตอบ';

  const payload = {
    code_id: `${selectedType.slice(0, 2).toUpperCase()}-${(session.codesByType[selectedType]?.length || 0) + 1}`,
    type: selectedType,
    theme: `ธีมความรู้สึก ${selectedType}`,
    quote: trimmedQuote,
    rationale: `พบโค้ดประเภท ${selectedType.toLowerCase()} จากการวิเคราะห์คำตอบของผู้ใช้`,
    confidence
  };

  session.codesByType[selectedType] = session.codesByType[selectedType] || [];
  session.codesByType[selectedType].push(payload);

  return {
    summary: `พบ ${selectedType} (ความมั่นใจ ${confidence * 100}%)`,
    codes: [payload]
  };
};

app.get('/health', (_req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

app.get('/api/config', async (_req, res) => {
  res.json(await loadConfig());
});

app.post('/api/config', async (req, res) => {
  const current = await loadConfig();
  const updates = req.body || {};
  const next = structuredClone ? structuredClone(current) : JSON.parse(JSON.stringify(current));

  Object.entries(updates).forEach(([key, value]) => {
    if (value && typeof value === 'object' && !Array.isArray(value) && current[key]) {
      next[key] = { ...current[key], ...value };
    } else {
      next[key] = value;
    }
  });

  await writeJsonFile(CONFIG_PATH, next);
  res.json({ message: 'Config updated successfully' });
});

app.get('/api/config/export', async (_req, res) => {
  const config = await loadConfig();
  res.setHeader('Content-Disposition', 'attachment; filename="interviewer_config.json"');
  res.type('application/json');
  res.send(JSON.stringify(config, null, 2));
});

app.post('/api/config/import', async (req, res) => {
  await writeJsonFile(CONFIG_PATH, req.body || {});
  res.json({ message: 'Config imported successfully' });
});

app.post('/api/config/reset', async (_req, res) => {
  const defaults = await readJsonFile(DEFAULT_CONFIG_PATH, {});
  await writeJsonFile(CONFIG_PATH, defaults);
  res.json({ message: 'Config reset to default' });
});

app.get('/api/config/default/question_prompt', async (_req, res) => {
  const defaults = await readJsonFile(DEFAULT_CONFIG_PATH, {});
  res.json({ prompt: defaults.question_generation_prompt || '' });
});

app.get('/api/config/default/analysis_prompt', async (_req, res) => {
  const defaults = await readJsonFile(DEFAULT_CONFIG_PATH, {});
  res.json({ prompt: defaults.analysis_prompt || '' });
});

app.post('/api/start', async (req, res) => {
  const { topic = 'สินค้า', max_questions = 10 } = req.body || {};
  const config = await loadConfig();
  const sessionId = uuid();

  const session = {
    id: sessionId,
    topic: topic.trim() || 'สินค้า',
    maxQuestions: Math.max(3, Math.min(Number(max_questions) || 10, 20)),
    currentTurn: 1,
    questionsAsked: [],
    answers: [],
    codesByType: {},
    createdAt: new Date().toISOString()
  };

  const firstQuestion = pickNextQuestion(session, config);
  session.currentQuestion = firstQuestion;
  sessions.set(sessionId, session);

  res.json({ session_id: sessionId, question: firstQuestion });
});

app.post('/api/answer', async (req, res) => {
  const { session_id, answer = '', question = '' } = req.body || {};
  const session = sessions.get(session_id);
  if (!session) {
    return res.status(404).json({ message: 'Session not found' });
  }

  const config = await loadConfig();
  const analysis = simulateAnalysis(session, answer, config);

  session.answers.push({ question, answer, analysis });

  let nextQuestion = null;
  let isComplete = session.currentTurn >= session.maxQuestions;

  if (!isComplete) {
    session.currentTurn += 1;
    nextQuestion = pickNextQuestion(session, config);
    session.currentQuestion = nextQuestion;
    isComplete = session.currentTurn > session.maxQuestions;
  }

  res.json({
    analysis,
    is_complete: isComplete,
    next_question: nextQuestion
  });
});

const buildSummary = (session, config) => {
  const codeTypes = Object.keys(config.code_types || {});
  const collectedCodes = Object.keys(session.codesByType);
  const missingCodes = codeTypes.filter((type) => !collectedCodes.includes(type));
  const flattened = Object.entries(session.codesByType).reduce((acc, [type, codes]) => {
    acc[type] = codes.map(({ code_id, theme, quote }) => ({ code_id, theme, quote }));
    return acc;
  }, {});

  const allCodes = Object.values(session.codesByType).flat();
  const avgConfidence = allCodes.length
    ? Math.round((allCodes.reduce((sum, code) => sum + (code.confidence || 0), 0) / allCodes.length) * 100)
    : 0;

  return {
    session_id: session.id,
    topic: session.topic,
    total_questions: session.answers.length,
    collected_codes: collectedCodes,
    avg_confidence: avgConfidence,
    all_codes: flattened,
    missing_codes: missingCodes
  };
};

app.get('/api/summary/:sessionId', async (req, res) => {
  const session = sessions.get(req.params.sessionId);
  if (!session) {
    return res.status(404).json({ message: 'Session not found' });
  }

  const config = await loadConfig();
  res.json(buildSummary(session, config));
});

app.get('/api/insight/:sessionId', (req, res) => {
  const session = sessions.get(req.params.sessionId);
  if (!session) {
    return res.status(404).json({ message: 'Session not found' });
  }

  const topic = session.topic;
  res.json({
    people_want: `ผู้บริโภคต้องการ ${topic} ที่มีคุณภาพดีและราคาเหมาะสม`,
    but: `แต่บางครั้งยังไม่พบผลิตภัณฑ์ที่ตรงกับความต้องการและความคาดหวัง`,
    so_they: `ดังนั้นพวกเขาจึงต้องหาทางเลือกอื่นๆ ที่เหมาะสมกับตนเอง`,
    full_insight: `สำหรับ ${topic} ผู้บริโภคมีความต้องการและความคาดหวังสูง แต่ยังไม่พบผลิตภัณฑ์ที่ตอบโจทย์ได้ครบถ้วน ดังนั้นพวกเขาจึงต้องหาทางเลือกอื่นๆ ที่เหมาะสมกับตนเองและมีความน่าเชื่อถือ`
  });
});

app.post('/api/save/:sessionId', async (req, res) => {
  const session = sessions.get(req.params.sessionId);
  if (!session) {
    return res.status(404).json({ message: 'Session not found' });
  }

  await ensureSessionDir();
  const exportPayload = {
    ...session,
    exportedAt: new Date().toISOString()
  };
  const filename = `session-${session.id}.json`;
  await writeJsonFile(path.join(SESSION_EXPORT_DIR, filename), exportPayload);

  res.json({ message: 'Session saved successfully', filename });
});

const startServer = async () => {
  await ensureSessionDir();
  const ports = process.env.API_PORTS
    ? process.env.API_PORTS.split(',').map((p) => Number(p.trim())).filter(Boolean)
    : [Number(process.env.PORT) || 8000, 8001];

  [...new Set(ports)].forEach((port) => {
    app.listen(port, () => {
      console.log(`✅ API server listening on http://localhost:${port}`);
    });
  });
};

startServer().catch((error) => {
  console.error('Failed to start API server:', error);
  process.exit(1);
});
