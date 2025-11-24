import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import { mkdir, readFile, writeFile, readdir, unlink } from 'fs/promises';
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

// CORS configuration - support multiple origins for production
const allowedOrigins = process.env.ALLOWED_ORIGINS 
  ? process.env.ALLOWED_ORIGINS.split(',').map(origin => origin.trim())
  : [
      'http://localhost:3000',
      'http://localhost:5173',
      'http://127.0.0.1:3000',
      'http://127.0.0.1:5173'
    ];

app.use(cors({
  origin: (origin, callback) => {
    // Allow requests with no origin (like mobile apps or curl requests)
    if (!origin) return callback(null, true);
    
    if (allowedOrigins.indexOf(origin) !== -1 || process.env.NODE_ENV !== 'production') {
      callback(null, true);
    } else {
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));

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
  // For In-depth Interview, use general questions
  const generalQuestions = config.example_questions?.general || [];
  if (generalQuestions.length > 0) {
    return generalQuestions.map((text) => ({
      type: 'general',
      text: fillTemplate(text, { topic, product: topic })
    }));
  }

  // Fallback to old structure if exists
  const entries = Object.entries(config.example_questions || {});
  if (entries.length > 0) {
    return entries.flatMap(([type, questions]) =>
      Array.isArray(questions) 
        ? questions.map((text) => ({
            type,
            text: fillTemplate(text, { product: topic, topic })
          }))
        : []
    );
  }

  // Last resort: use default
  return DEFAULT_QUESTION_BANK.map((item) => ({
    type: item.type,
    text: fillTemplate(item.text, { topic, product: topic })
  }));
};

// Helper function to get missing code types (deprecated - kept for compatibility)
const getMissingCodeTypes = (session, config) => {
  // For In-depth Interview, we don't use code types
  return [];
};

// Helper function to build conversation history
const buildHistory = (session) => {
  if (!session.answers || session.answers.length === 0) {
    return 'ยังไม่มีประวัติการสนทนา';
  }
  
  return session.answers
    .map((qa, idx) => {
      const q = qa.question || '';
      const a = qa.answer || '';
      return `คำถามที่ ${idx + 1}: ${q}\nคำตอบ: ${a}`;
    })
    .join('\n\n');
};

// Helper function to get last answer
const getLastAnswer = (session) => {
  if (!session.answers || session.answers.length === 0) {
    return '';
  }
  const lastQA = session.answers[session.answers.length - 1];
  return lastQA.answer || '';
};

// Helper function to get current turn number
const getCurrentTurn = (session) => {
  return (session.answers?.length || 0) + 1;
};

// Generate question using AI for In-depth Interview
const generateQuestionWithAI = async (session, config) => {
  try {
    const modelSettings = config.model_settings || {};
    const apiKey = process.env.OPENAI_API_KEY;
    
    if (!apiKey) {
      console.warn('⚠️ OPENAI_API_KEY not found, falling back to examples');
      return null;
    }

    // Get list of already asked questions to avoid duplicates
    const asked = new Set(session.questionsAsked || []);

    // Build history and get last answer
    const history = buildHistory(session);
    const lastAnswer = getLastAnswer(session);
    const currentTurn = getCurrentTurn(session);
    const isFirstQuestion = currentTurn === 1;
    const isEarlyQuestion = currentTurn <= 3; // คำถามแรกๆ คือ turn 1-3
    
    // Clean topic - remove brand names if exists
    let cleanTopic = session.topic || '';
    // Remove common brand names from topic (case insensitive)
    const brandPatterns = [
      /\s*(liponf|lipinf|sunlight|clear|pantene|l'oréal|dove|sunsilk|head[&\s]*shoulders|gillette|colgate)/gi,
      /\s*(ยี่ห้อ|แบรนด์).*$/i
    ];
    brandPatterns.forEach(pattern => {
      cleanTopic = cleanTopic.replace(pattern, '').trim();
    });
    
    // Use prompt from config, fallback to default
    let promptTemplate = config.question_generation_prompt || 
      `คุณคือ "ผู้สัมภาษณ์เชิงลึก" (In-depth Interviewer)
หัวข้อหลักของการสนทนา คือ {topic}
ประวัติการสนทนาก่อนหน้านี้:
{conversation_history}

คำตอบล่าสุดของผู้ให้ข้อมูล:
{previous_answer}

ตอนนี้เป็นคำตอบที่ {turn} ของการสนทนา
ตอบเป็นคำถามภาษาไทยเพียงข้อเดียว ไม่ต้องมีคำนำหน้าหรือเลขลำดับ`;

    // Replace entire prompt for early questions (turn 1-3) - focus on behavior/daily life, STRICTLY NO BRAND
    if (isEarlyQuestion) {
      // Detect category for better examples
      const category = detectTopicCategory(cleanTopic);
      const categoryExamples = FIRST_QUESTION_MAP[category] || FIRST_QUESTION_MAP['generic'];
      
      // Get example questions for this category (first 2 examples)
      const examples = categoryExamples.slice(0, 2).map(q => {
        // Fill template if contains {topic}
        return q.includes('{topic}') ? fillTemplate(q, { topic: cleanTopic }) : q;
      }).join('\n- ');
      
      // Strict prompt that emphasizes behavior/life context, ABSOLUTELY NO BRAND
      promptTemplate = `คุณคือผู้สัมภาษณ์เชิงลึก

⚠️ นี่เป็นคำถามที่ ${currentTurn} (ยังเป็นคำถามแรกๆ ของการสนทนา)

🚫 กฎที่ต้องทำตามอย่างเคร่งครัด - ห้ามละเมิดโดยเด็ดขาด:
1. ห้ามเอ่ยถึง "ยี่ห้อ" "แบรนด์" "brand" "product" "ผลิตภัณฑ์" ในคำถาม
2. ห้ามถาม "ใช้ยี่ห้ออะไร" "ใช้แบรนด์ไหน" "ใช้ผลิตภัณฑ์อะไร"
3. ห้ามเอ่ยถึงชื่อแบรนด์ใดๆ ทั้งหมด (เช่น LiponF, Sunlight, Clear, Pantene, L'Oréal, Dove ฯลฯ)
4. ห้ามถามเรื่อง "เลือกแบรนด์" "เปรียบเทียบแบรนด์" "ใช้แบรนด์ไหน"

เป้าหมาย: เริ่มจากชีวิตประจำวัน/พฤติกรรม/บริบทการใช้งาน → จะถามเรื่องแบรนด์/ผลิตภัณฑ์ในคำถามถัดๆ ไป (turn 4-5 เป็นต้นไป)

กฎสำหรับคำถามนี้:
1. คำถามต้องสั้น กระชับ ใช้ประโยคเดียว (ประมาณ 10-20 คำ)
2. โฟกัสที่พฤติกรรม/ชีวิตประจำวัน/บริบทการใช้งาน/ความรู้สึก/ประสบการณ์
3. เน้นให้คนตอบเล่าเกี่ยวกับ "ชีวิต/พฤติกรรม/บริบท/ประสบการณ์" ก่อน ไม่ใช่ "ผลิตภัณฑ์/แบรนด์/ยี่ห้อ"
4. ห้ามถามหลายประเด็นในประโยคเดียว

ตัวอย่างคำถามที่ดีสำหรับหมวดนี้ (ไม่มีแบรนด์เลย):
- ${examples}

ตัวอย่างคำถามที่ผิด - ห้ามใช้เด็ดขาด:
- ❌ "ปกติใช้ยี่ห้อไหนครับ?" ← ผิด! มีคำว่า "ยี่ห้อ"
- ❌ "เคยใช้แบรนด์อะไรบ้างครับ?" ← ผิด! มีคำว่า "แบรนด์"
- ❌ "ใช้ผลิตภัณฑ์แบบไหนครับ?" ← ผิด! มีคำว่า "ผลิตภัณฑ์"
- ❌ "ใช้ LiponF หรือ Sunlight ครับ?" ← ผิด! เอ่ยถึงชื่อแบรนด์
- ❌ "ช่วยเล่าประสบการณ์เกี่ยวกับการใช้น้ำยาล้างจาน lipinf..." ← ผิด! เอ่ยถึงแบรนด์
- ❌ "คุณเลือกแบรนด์ยังไง?" ← ผิด! มีคำว่า "แบรนด์"

คำถามที่ถูกต้อง:
- ✅ "หลังมื้ออาหารปกติคุณจัดการเรื่องล้างจานยังไงบ้างครับ?" (ไม่มีแบรนด์)
- ✅ "ในแต่ละวันคุณต้องล้างจานบ่อยแค่ไหนครับ?" (ไม่มีแบรนด์)
- ✅ "ปกติคุณรู้สึกยังไงเวลาต้องล้างจานครับ?" (ไม่มีแบรนด์)

หัวข้อ: ${cleanTopic}

ตอบเป็นคำถามภาษาไทยสั้นๆ เพียงข้อเดียว โฟกัสที่พฤติกรรม/ชีวิตประจำวัน/บริบท ห้ามมีคำว่า "ยี่ห้อ" "แบรนด์" "ผลิตภัณฑ์" หรือชื่อแบรนด์ใดๆ ใช้คำลงท้าย "ครับ" แทน "คะ"`;
    }

    // Add asked questions to prompt to avoid duplicates
    const askedQuestionsList = Array.from(asked).length > 0 
      ? `\n\nคำถามที่ถามไปแล้ว (ห้ามถามซ้ำ):\n${Array.from(asked).map((q, i) => `${i + 1}. ${q}`).join('\n')}`
      : '';

    const filledPrompt = fillTemplate(promptTemplate, {
      topic: cleanTopic, // Use cleaned topic without brand
      conversation_history: history || 'ยังไม่มีประวัติการสนทนา',
      history: history || 'ยังไม่มีประวัติการสนทนา', // Support both {history} and {conversation_history}
      previous_answer: lastAnswer || '',
      turn: currentTurn.toString()
    }) + askedQuestionsList;

    // Call OpenAI API
    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`
      },
      body: JSON.stringify({
        model: modelSettings.model || 'gpt-4o',
        messages: [
          {
            role: 'system',
            content: isEarlyQuestion 
              ? 'คุณคือผู้สัมภาษณ์ที่สร้างคำถามแรกๆ (turn 1-3) ที่สั้น กระชับ โฟกัสที่พฤติกรรม/ชีวิตประจำวัน/บริบทการใช้งาน/ความรู้สึก/ประสบการณ์ ห้ามเอ่ยถึงแบรนด์/ยี่ห้อ/ผลิตภัณฑ์/ชื่อแบรนด์ใดๆ โดยเด็ดขาด เป็นแค่การเริ่มสนทนาเพื่อเข้าใจชีวิตและพฤติกรรมของผู้ตอบก่อน ค่อยถามเรื่องแบรนด์ในคำถามถัดๆ ไป ห้ามถามคำถามที่ถามไปแล้ว ใช้คำลงท้าย "ครับ" แทน "คะ"'
              : 'คุณคือ AI Interviewer ผู้เชี่ยวชาญการสัมภาษณ์เชิงลึก ตั้งคำถามปลายเปิดที่ช่วยดึงความคิดและประสบการณ์จากผู้ตอบอย่างละเอียด ห้ามถามคำถามที่ถามไปแล้ว ใช้คำลงท้าย "ครับ" แทน "คะ"'
          },
          {
            role: 'user',
            content: filledPrompt
          }
        ],
        temperature: isEarlyQuestion ? 0.3 : (modelSettings.temperature_question || 0.8), // Lower temperature for early questions for consistency
        max_tokens: isEarlyQuestion ? 50 : 300 // Limit tokens for early questions to force shorter output
      })
    });

    if (!response.ok) {
      const error = await response.text();
      console.error('❌ OpenAI API error:', error);
      return null;
    }

    const data = await response.json();
    const generatedQuestion = data.choices?.[0]?.message?.content?.trim();
    
    if (generatedQuestion) {
      // Clean up the question (remove quotes if present, remove numbers/bullets)
      let cleanQuestion = generatedQuestion
        .replace(/^["']|["']$/g, '')
        .replace(/^\d+[\.\)]\s*/, '')
        .replace(/^[-\*]\s*/, '')
        .trim();
      
      // Strict check for early questions: If contains brand, reject and return null
      if (isEarlyQuestion && containsBrand(cleanQuestion)) {
        console.warn(`⚠️ Rejected question containing brand (turn ${currentTurn}): "${cleanQuestion}"`);
        return null; // Return null so it falls back to predefined questions
      }
      
      // Check for duplicates
      if (asked.has(cleanQuestion)) {
        console.warn(`⚠️ Rejected duplicate question (turn ${currentTurn}): "${cleanQuestion}"`);
        return null; // Return null so it falls back or retries
      }
      
      return cleanQuestion || null;
    }

    return null;
  } catch (error) {
    console.error('❌ Error generating question with AI:', error);
    return null;
  }
};

// Helper: Detect topic category from topic string
const detectTopicCategory = (topic) => {
  const topicLower = topic.toLowerCase();
  
  if (topicLower.includes('น้ำยาล้างจาน') || topicLower.includes('ล้างจาน')) {
    return 'dishwashing';
  } else if (topicLower.includes('อาหารสด') || topicLower.includes('ของสด')) {
    return 'freshfood';
  } else if (topicLower.includes('ครีม') || topicLower.includes('สกินแคร์') || topicLower.includes('บำรุงผิว')) {
    return 'skincare';
  } else if (topicLower.includes('แชมพู') || topicLower.includes('สระผม')) {
    return 'shampoo';
  } else if (topicLower.includes('เครื่องใช้ไฟฟ้า') || topicLower.includes('ทีวี') || topicLower.includes('ตู้เย็น') || topicLower.includes('แอร์')) {
    return 'appliance';
  } else if (topicLower.includes('เดลิเวอรี่') || topicLower.includes('ส่งของ') || topicLower.includes('ส่งอาหาร')) {
    return 'delivery';
  }
  
  return 'generic';
};

// Helper: Check if question contains brand names (strict check for early questions)
const containsBrand = (question) => {
  if (!question) return false;
  
  const questionLower = question.toLowerCase();
  
  // Common brand names to check
  const brandKeywords = [
    'liponf', 'lipinf', 'sunlight', 'clear', 'pantene', "l'oréal", 'loreal', 'dove',
    'sunsilk', 'head&shoulders', 'head and shoulders', 'gillette', 'colgate',
    'ยี่ห้อ', 'แบรนด์', 'brand', 'product', 'ผลิตภัณฑ์',
    'sunlight', 'clinic', 'lacoste', 'adidas', 'nike', 'unilever', 'procter', 'gamble'
  ];
  
  // Check for brand-related patterns
  const brandPatterns = [
    /ยี่ห้อ\s*(\w+)/i,
    /แบรนด์\s*(\w+)/i,
    /ใช้\s*(liponf|sunlight|clear|pantene|dove)/i,
    /(liponf|sunlight|clear|pantene|dove)\s*(ของ|ที่|คือ)/i
  ];
  
  // Check if question contains any brand keywords
  for (const brand of brandKeywords) {
    if (questionLower.includes(brand)) {
      return true;
    }
  }
  
  // Check brand patterns
  for (const pattern of brandPatterns) {
    if (pattern.test(question)) {
      return true;
    }
  }
  
  return false;
};

// Mapping of first question candidates by topic category
// Focus: สั้น, ไม่เจาะจง, โฟกัสที่พฤติกรรม/ชีวิตประจำวัน, ไม่ถามแบรนด์, ใช้ "ครับ"
const FIRST_QUESTION_MAP = {
  'dishwashing': [
    'หลังมื้ออาหารปกติคุณจัดการเรื่องล้างจานยังไงบ้างครับ?',
    'ในแต่ละวันคุณต้องล้างจานบ่อยแค่ไหนครับ?'
  ],
  'freshfood': [
    'ปกติคุณซื้อของสดมาทำอาหารบ่อยแค่ไหนครับ?',
    'เวลาจะทำอาหารเองที่บ้าน คุณมักซื้อของสดจากที่ไหนครับ?'
  ],
  'skincare': [
    'ในชีวิตประจำวันคุณทาครีมบำรุงผิวบ่อยแค่ไหนครับ?',
    'ปกติคุณดูแลผิวหน้าของตัวเองยังไงบ้างในแต่ละวันครับ?'
  ],
  'shampoo': [
    'ปกติคุณสระผมบ่อยแค่ไหนครับในหนึ่งสัปดาห์?',
    'เวลาคุณเลือกแชมพูใช้เอง คุณนึกถึงเรื่องอะไรเป็นอย่างแรกครับ?'
  ],
  'appliance': [
    'ในชีวิตประจำวัน เครื่องใช้ไฟฟ้าที่คุณใช้บ่อยที่สุดคืออะไรครับ?',
    'ปกติคุณใช้เครื่องใช้ไฟฟ้าพวกทีวี ตู้เย็น หรือแอร์บ่อยแค่ไหนครับ?'
  ],
  'delivery': [
    'ช่วงนี้คุณใช้บริการส่งของหรือเดลิเวอรี่บ่อยแค่ไหนครับ?',
    'ปกติคุณใช้บริการส่งอาหารหรือส่งของในโอกาสแบบไหนบ้างครับ?'
  ],
  'generic': [
    'ปกติคุณใช้{topic}บ่อยแค่ไหนครับ?',
    'ในชีวิตประจำวัน {topic} เข้ามาเกี่ยวข้องกับคุณในช่วงเวลาไหนบ้างครับ?',
    'โดยรวมแล้วตอนนี้คุณรู้สึกยังไงกับ {topic} ครับ?'
  ]
};

// Pick next question - try AI first, fallback to open-ended examples
const pickNextQuestion = async (session, config) => {
  // Get list of already asked questions
  const asked = new Set(session.questionsAsked || []);
  
  // Try to generate question with AI (with retry if duplicate)
  let aiQuestion = await generateQuestionWithAI(session, config);
  let retryCount = 0;
  const maxRetries = 3;
  
  // Check if AI question is duplicate and retry if needed
  while (aiQuestion && asked.has(aiQuestion) && retryCount < maxRetries) {
    console.log(`⚠️ Duplicate question detected, retrying... (${retryCount + 1}/${maxRetries})`);
    aiQuestion = await generateQuestionWithAI(session, config);
    retryCount++;
  }
  
  if (aiQuestion && !asked.has(aiQuestion)) {
    session.questionsAsked = session.questionsAsked || [];
    session.questionsAsked.push(aiQuestion);
    return aiQuestion;
  }

  // Fallback to open-ended questions if AI fails
  console.log('📝 Using fallback open-ended questions');
  const isFirstQuestion = (session.answers?.length || 0) === 0;
  
  if (isFirstQuestion) {
    // Use first question mapping
    const topic = session.topic || 'ผลิตภัณฑ์';
    const category = detectTopicCategory(topic);
    let firstQuestionPool = FIRST_QUESTION_MAP[category] || FIRST_QUESTION_MAP['generic'];
    
    // For generic category, fill in topic template
    if (category === 'generic') {
      // Clean topic - remove brand names
      let cleanTopic = topic;
      const brandPatterns = [
        /\s*(liponf|lipinf|sunlight|clear|pantene|l'oréal|dove|sunsilk|head[&\s]*shoulders|gillette|colgate)/gi,
        /\s*(ยี่ห้อ|แบรนด์).*$/i
      ];
      brandPatterns.forEach(pattern => {
        cleanTopic = cleanTopic.replace(pattern, '').trim();
      });
      
      firstQuestionPool = firstQuestionPool.map(q => fillTemplate(q, { topic: cleanTopic }));
    }
    
    // Filter out already asked questions
    const availableQuestions = firstQuestionPool.filter(q => !asked.has(q));
    const pool = availableQuestions.length > 0 ? availableQuestions : firstQuestionPool;
    
      // If all questions have been asked, return a generic follow-up
      if (pool.length === 0) {
        const genericQuestion = 'เล่าเพิ่มเติมให้ฟังหน่อยได้ไหมครับ?';
        if (!asked.has(genericQuestion)) {
          session.questionsAsked = session.questionsAsked || [];
          session.questionsAsked.push(genericQuestion);
          return genericQuestion;
        }
        return 'มีอะไรอื่นที่อยากเล่าเพิ่มเติมไหมครับ?';
      }
    
    const question = pool[Math.floor(Math.random() * pool.length)];
    
    session.questionsAsked = session.questionsAsked || [];
    session.questionsAsked.push(question);
    return question;
  }
  
  // Subsequent questions - for now empty, AI will generate
  const subsequentQuestionPool = [];
  
  const availableQuestions = subsequentQuestionPool
    .map(q => fillTemplate(q, { topic: session.topic }))
    .filter(q => !asked.has(q));
  
  const pool = availableQuestions.length > 0 
    ? availableQuestions 
    : subsequentQuestionPool.map(q => fillTemplate(q, { topic: session.topic }));
  
  const question = pool.length > 0 ? pool[Math.floor(Math.random() * pool.length)] : null;
  
  if (question && !asked.has(question)) {
    session.questionsAsked = session.questionsAsked || [];
    session.questionsAsked.push(question);
    return question;
  }
  
  // If no subsequent questions available, return a generic follow-up (check for duplicates)
  const genericFollowUp = 'เล่าเพิ่มเติมให้ฟังหน่อยได้ไหมครับ?';
  if (!asked.has(genericFollowUp)) {
    session.questionsAsked = session.questionsAsked || [];
    session.questionsAsked.push(genericFollowUp);
    return genericFollowUp;
  }
  
  // Last resort: return a different generic question
  return 'มีอะไรอื่นที่อยากเล่าเพิ่มเติมไหมครับ?';
};

// Analyze answer for In-depth Interview - extract insights from content
const analyzeAnswer = async (session, question, answer, config) => {
  try {
    const modelSettings = config.model_settings || {};
    const apiKey = process.env.OPENAI_API_KEY;
    
    if (!apiKey) {
      // Fallback: simple summary without AI
      return {
        summary: extractSimpleSummary(answer),
        insights: [{
          key_point: extractSimpleSummary(answer),
          quote: answer.length > 200 ? `${answer.slice(0, 197)}...` : answer,
          confidence: 0.7
        }]
      };
    }

    // Build prompt for insight extraction (no code types)
    const history = buildHistory(session);
    
    // Use analysis prompt from config, fallback to default
    const analysisPromptTemplate = config.analysis_prompt || 
      `คุณคือ AI นักวิเคราะห์สำหรับการสัมภาษณ์เชิงลึก

หัวข้อ: {topic}
คำถาม: {question}
คำตอบ: {answer}

ประวัติการสนทนาก่อนหน้า:
{conversation_history}

ภารกิจ: วิเคราะห์และสรุป insights จากคำตอบของผู้ให้ข้อมูล

สิ่งที่ต้องทำ:
1. สรุปประเด็นหลักที่ผู้ให้ข้อมูลพูดถึง
2. ระบุ key insights, ความคิด, ความรู้สึก, หรือประสบการณ์ที่สำคัญ
3. ไม่ต้องจำแนกเป็นหมวดหมู่ใดๆ แต่ให้สรุปตามเนื้อหาที่ผู้ให้ข้อมูลตอบจริงๆ

ตอบเป็น JSON format:
{
  "summary": "สรุปสั้นๆ ประเด็นหลักจากคำตอบนี้",
  "insights": [
    {
      "key_point": "ประเด็นสำคัญที่ 1",
      "quote": "ประโยคหรือข้อความที่ยืนยันประเด็นนี้ (ใช้ข้อความจากคำตอบเดิม)",
      "confidence": 0.85
    }
  ]
}

ถ้ามี insights หลายประเด็น ให้เพิ่มใน array insights ได้`;

    const filledPrompt = fillTemplate(analysisPromptTemplate, {
      topic: session.topic || '',
      question: question || '',
      answer: answer || '',
      conversation_history: history || 'ยังไม่มีประวัติการสนทนา',
      history: history || 'ยังไม่มีประวัติการสนทนา' // Support both {history} and {conversation_history}
    });

    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`
      },
      body: JSON.stringify({
        model: modelSettings.model || 'gpt-4o',
        messages: [
          {
            role: 'system',
            content: 'คุณคือ AI นักวิเคราะห์การสัมภาษณ์เชิงลึก สรุป insights จากคำตอบของผู้ให้ข้อมูลตามเนื้อหาจริง ไม่ต้องจำแนกเป็นหมวดหมู่ ตอบเป็น JSON เท่านั้น'
          },
          {
            role: 'user',
            content: filledPrompt
          }
        ],
        temperature: modelSettings.temperature_analysis || 0.5,
        response_format: { type: 'json_object' }
      })
    });

    if (!response.ok) {
      const error = await response.text();
      console.error('❌ OpenAI API error:', error);
      return {
        summary: extractSimpleSummary(answer),
        insights: [{
          key_point: extractSimpleSummary(answer),
          quote: answer.length > 200 ? `${answer.slice(0, 197)}...` : answer,
          confidence: 0.7
        }]
      };
    }

    const data = await response.json();
    const content = data.choices?.[0]?.message?.content?.trim();
    
    if (content) {
      try {
        const result = JSON.parse(content);
        // Store insights in session (using 'insights' instead of 'codesByType')
        session.insights = session.insights || [];
        session.insights.push({
          question,
          answer,
          ...result,
          timestamp: new Date().toISOString()
        });
        return result;
      } catch (parseError) {
        console.error('❌ Error parsing AI response:', parseError);
      }
    }

    // Fallback
    return {
      summary: extractSimpleSummary(answer),
      insights: [{
        key_point: extractSimpleSummary(answer),
        quote: answer.length > 200 ? `${answer.slice(0, 197)}...` : answer,
        confidence: 0.7
      }]
    };
  } catch (error) {
    console.error('❌ Error analyzing answer:', error);
    return {
      summary: extractSimpleSummary(answer),
      insights: [{
        key_point: extractSimpleSummary(answer),
        quote: answer.length > 200 ? `${answer.slice(0, 197)}...` : answer,
        confidence: 0.7
      }]
    };
  }
};

// Helper: extract simple summary from answer
const extractSimpleSummary = (answer) => {
  if (!answer || answer.trim().length === 0) {
    return 'ไม่มีคำตอบ';
  }
  
  // Simple extraction: use first sentence or first 100 chars
  const firstSentence = answer.split(/[.!?。！？]\s*/)[0];
  if (firstSentence && firstSentence.length > 20) {
    return firstSentence.length > 150 ? `${firstSentence.slice(0, 147)}...` : firstSentence;
  }
  
  return answer.length > 150 ? `${answer.slice(0, 147)}...` : answer;
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
    topic: topic.trim() || 'หัวข้อการสัมภาษณ์',
    maxQuestions: Math.max(3, Math.min(Number(max_questions) || 10, 20)),
    currentTurn: 1,
    questionsAsked: [],
    answers: [],
    insights: [], // Changed from codesByType to insights
    createdAt: new Date().toISOString()
  };

  const firstQuestion = await pickNextQuestion(session, config);
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
  const analysis = await analyzeAnswer(session, question, answer, config);

  session.answers.push({ question, answer, analysis });

  let nextQuestion = null;
  let isComplete = session.currentTurn >= session.maxQuestions;

  if (!isComplete) {
    session.currentTurn += 1;
    nextQuestion = await pickNextQuestion(session, config);
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
  // For In-depth Interview: summarize all insights
  const allInsights = session.insights || [];
  const allKeyPoints = allInsights.flatMap(insight => 
    (insight.insights || []).map(i => ({
      key_point: i.key_point || 'ไม่มีประเด็น',
      quote: i.quote || '',
      confidence: i.confidence || 0.7
    }))
  );

  const avgConfidence = allKeyPoints.length
    ? Math.round((allKeyPoints.reduce((sum, item) => sum + (item.confidence || 0), 0) / allKeyPoints.length) * 100)
    : 0;

  return {
    session_id: session.id,
    topic: session.topic,
    total_questions: session.answers.length,
    total_insights: allKeyPoints.length,
    avg_confidence: avgConfidence,
    all_insights: allKeyPoints,
    detailed_insights: allInsights // Include full insights for reference
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

app.get('/api/insight/:sessionId', async (req, res) => {
  const session = sessions.get(req.params.sessionId);
  if (!session) {
    return res.status(404).json({ message: 'Session not found' });
  }

  const config = await loadConfig();
  const apiKey = process.env.OPENAI_API_KEY;

  // Build comprehensive summary from all answers
  const allAnswers = session.answers || [];
  const conversationText = allAnswers
    .map((qa, idx) => `คำถามที่ ${idx + 1}: ${qa.question}\nคำตอบ: ${qa.answer}`)
    .join('\n\n');

  if (apiKey && allAnswers.length > 0) {
    try {
      const modelSettings = config.model_settings || {};
      const prompt = `คุณคือ AI นักวิเคราะห์การสัมภาษณ์เชิงลึก

หัวข้อการสัมภาษณ์: {topic}

การสนทนาทั้งหมด:
{conversation}

ภารกิจ: สรุป insights หลักจากการสัมภาษณ์เชิงลึกทั้งหมด

สิ่งที่ต้องทำ:
- สรุปประเด็นหลักที่ผู้ให้ข้อมูลพูดถึง
- ระบุ key insights, ความคิด, ความรู้สึก, และประสบการณ์ที่สำคัญ
- ไม่ต้องบังคับใช้โครงสร้างแบบ "People want... But... So they..." 
- ให้สรุปตามเนื้อหาจริงที่ผู้ให้ข้อมูลตอบ
- เขียนให้เป็นธรรมชาติ อ่านง่าย

ตอบเป็น JSON:
{
  "summary": "สรุปสั้นๆ ภาพรวมของ insights หลัก",
  "key_themes": ["ธีมหลักที่ 1", "ธีมหลักที่ 2", ...],
  "detailed_insights": "สรุปละเอียดของ insights ทั้งหมด",
  "representative_quotes": ["คำพูดสำคัญที่ 1", "คำพูดสำคัญที่ 2", ...]
}`;

      const filledPrompt = fillTemplate(prompt, {
        topic: session.topic,
        conversation: conversationText
      });

      const response = await fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${apiKey}`
        },
        body: JSON.stringify({
          model: modelSettings.model || 'gpt-4o',
          messages: [
            {
              role: 'system',
              content: 'คุณคือ AI นักวิเคราะห์การสัมภาษณ์เชิงลึก สรุป insights ตามเนื้อหาจริง ตอบเป็น JSON เท่านั้น'
            },
            {
              role: 'user',
              content: filledPrompt
            }
          ],
          temperature: 0.6,
          response_format: { type: 'json_object' }
        })
      });

      if (response.ok) {
        const data = await response.json();
        const content = data.choices?.[0]?.message?.content?.trim();
        if (content) {
          try {
            const insightData = JSON.parse(content);
            return res.json(insightData);
          } catch (parseError) {
            console.error('❌ Error parsing insight response:', parseError);
          }
        }
      }
    } catch (error) {
      console.error('❌ Error generating insight:', error);
    }
  }

  // Fallback: simple summary
  const summaries = allAnswers
    .map(qa => qa.analysis?.summary)
    .filter(Boolean);
  
  res.json({
    summary: summaries.length > 0 
      ? summaries.join(' ') 
      : `สรุป insights จากการสัมภาษณ์เกี่ยวกับ ${session.topic}`,
    key_themes: summaries.slice(0, 5),
    detailed_insights: conversationText,
    representative_quotes: allAnswers
      .map(qa => qa.answer)
      .filter(Boolean)
      .slice(0, 3)
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
    exportedAt: new Date().toISOString(),
    status: 'completed'
  };
  const filename = `session-${session.id}.json`;
  await writeJsonFile(path.join(SESSION_EXPORT_DIR, filename), exportPayload);

  res.json({ message: 'Session saved successfully', filename });
});

// Get list of all saved sessions
app.get('/api/sessions', async (req, res) => {
  try {
    await ensureSessionDir();
    const files = await readdir(SESSION_EXPORT_DIR);
    const sessionFiles = files.filter(f => f.startsWith('session-') && f.endsWith('.json'));
    
    const sessionsList = await Promise.all(
      sessionFiles.map(async (file) => {
        try {
          const filePath = path.join(SESSION_EXPORT_DIR, file);
          const sessionData = await readJsonFile(filePath, null);
          if (!sessionData) return null;
          
          return {
            id: sessionData.id || file.replace('session-', '').replace('.json', ''),
            topic: sessionData.topic || 'ไม่ระบุหัวข้อ',
            createdAt: sessionData.createdAt || sessionData.exportedAt || new Date().toISOString(),
            exportedAt: sessionData.exportedAt,
            totalQuestions: sessionData.answers?.length || 0,
            totalInsights: sessionData.insights?.length || 0,
            filename: file
          };
        } catch (error) {
          console.error(`Error reading session file ${file}:`, error);
          return null;
        }
      })
    );
    
    // Filter out null values and sort by date (newest first)
    const validSessions = sessionsList
      .filter(s => s !== null)
      .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
    
    res.json({ sessions: validSessions });
  } catch (error) {
    console.error('❌ Error listing sessions:', error);
    res.status(500).json({ message: 'Error listing sessions', error: error.message });
  }
});

// Get session details by ID
app.get('/api/sessions/:sessionId', async (req, res) => {
  try {
    await ensureSessionDir();
    const sessionId = req.params.sessionId;
    const filename = `session-${sessionId}.json`;
    const filePath = path.join(SESSION_EXPORT_DIR, filename);
    
    const sessionData = await readJsonFile(filePath, null);
    if (!sessionData) {
      return res.status(404).json({ message: 'Session not found' });
    }
    
    res.json(sessionData);
  } catch (error) {
    console.error('❌ Error getting session:', error);
    res.status(500).json({ message: 'Error getting session', error: error.message });
  }
});

// Delete session by ID
app.delete('/api/sessions/:sessionId', async (req, res) => {
  try {
    await ensureSessionDir();
    const sessionId = req.params.sessionId;
    const filename = `session-${sessionId}.json`;
    const filePath = path.join(SESSION_EXPORT_DIR, filename);
    
    // Check if file exists
    try {
      await readFile(filePath);
    } catch (error) {
      return res.status(404).json({ message: 'Session not found' });
    }
    
    // Delete the file
    await unlink(filePath);
    console.log(`✅ Deleted session: ${filename}`);
    
    res.json({ message: 'Session deleted successfully' });
  } catch (error) {
    console.error('❌ Error deleting session:', error);
    res.status(500).json({ message: 'Error deleting session', error: error.message });
  }
});

const startServer = async () => {
  await ensureSessionDir();
  
  // Check for OpenAI API Key
  if (process.env.OPENAI_API_KEY) {
    console.log('✅ OpenAI API Key found - AI question generation enabled');
  } else {
    console.warn('⚠️  OPENAI_API_KEY not found in environment variables');
    console.warn('   AI question generation will be disabled. Using example questions instead.');
    console.warn('   To enable AI: Create .env file in backend/ with OPENAI_API_KEY=sk-your-key-here');
  }
  
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
