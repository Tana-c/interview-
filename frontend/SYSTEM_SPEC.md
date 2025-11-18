# AI Interview System - Complete System Specification

## 📋 Overview

ระบบ AI Interview System ออกแบบมาเพื่อทำการวิจัยเชิงคุณภาพ (Qualitative Research) แบบ "Qual at Scale" โดยใช้ AI 2 ระดับ:

1. **Micro-AI (Interviewer)**: สัมภาษณ์ทีละคน ถามคำถามเจาะลึก
2. **Macro-AI (Synthesizer)**: วิเคราะห์และสังเคราะห์ข้อมูลจากหลายคน

---

## 🏗️ System Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                     Frontend Layer                           │
│              (React + Vite + Tailwind CSS)                   │
└─────────────────────┬───────────────────────────────────────┘
                      │
┌─────────────────────▼───────────────────────────────────────┐
│                   API Gateway                                │
│              (Express / FastAPI)                             │
└─────────────────────┬───────────────────────────────────────┘
                      │
        ┌─────────────┴─────────────┐
        │                           │
┌───────▼────────┐         ┌────────▼────────┐
│   Micro-AI     │         │    Macro-AI     │
│  (Interviewer) │         │  (Synthesizer)  │
│  ChatGPT/Claude│         │  ChatGPT/Claude │
└───────┬────────┘         └────────┬────────┘
        │                           │
        └─────────────┬─────────────┘
                      │
┌─────────────────────▼───────────────────────────────────────┐
│                    Database Layer                            │
│              (PostgreSQL / MongoDB)                          │
└─────────────────────────────────────────────────────────────┘
```

---

## 🗄️ Database Schema

### Table: `interview_sessions`
```sql
CREATE TABLE interview_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id VARCHAR(255) NOT NULL,
  start_time TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  end_time TIMESTAMP,
  status VARCHAR(50) DEFAULT 'active', -- active, completed, abandoned
  language VARCHAR(10) DEFAULT 'th-TH',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

### Table: `questions`
```sql
CREATE TABLE questions (
  id VARCHAR(50) PRIMARY KEY,
  category VARCHAR(100) NOT NULL,
  text TEXT NOT NULL,
  follow_up_templates JSONB, -- Array of follow-up questions
  order_index INTEGER NOT NULL,
  language VARCHAR(10) DEFAULT 'th-TH',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

### Table: `responses`
```sql
CREATE TABLE responses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id UUID REFERENCES interview_sessions(id),
  question_id VARCHAR(50) REFERENCES questions(id),
  answer TEXT NOT NULL,
  follow_up_answers JSONB, -- Array of follow-up answers
  insight_schema JSONB, -- {desire, barrier, action}
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

### Table: `insights`
```sql
CREATE TABLE insights (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id UUID REFERENCES interview_sessions(id),
  question_id VARCHAR(50) REFERENCES questions(id),
  desire TEXT,
  barrier TEXT,
  action TEXT,
  confidence_score DECIMAL(3,2), -- 0.00 to 1.00
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

### Table: `synthesized_insights`
```sql
CREATE TABLE synthesized_insights (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  theme VARCHAR(255) NOT NULL,
  frequency INTEGER NOT NULL,
  credibility_score DECIMAL(3,2),
  representative_quotes JSONB,
  insight_statement TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

---

## 🔌 API Specification

### 1. Start Interview Session

**Endpoint**: `POST /api/interview/start`

**Request Body**:
```json
{
  "user_id": "user_123",
  "language": "th-TH"
}
```

**Response**:
```json
{
  "session_id": "uuid-here",
  "first_question": {
    "id": "q1",
    "category": "พฤติกรรมการทำงาน",
    "text": "เล่าให้ฟังหน่อยว่าคุณจัดลำดับความสำคัญของงานแต่ละวันอย่างไร?"
  }
}
```

---

### 2. Submit Answer

**Endpoint**: `POST /api/interview/answer`

**Request Body**:
```json
{
  "session_id": "uuid-here",
  "question_id": "q1",
  "answer": "ผมเริ่มจากไล่ดูงานที่ส่งผลกระทบต่อทีมก่อน..."
}
```

**Response**:
```json
{
  "follow_up": "อะไรทำให้คุณจัดลำดับแบบนั้น?",
  "should_continue": true,
  "follow_up_count": 1,
  "max_follow_ups": 4
}
```

---

### 3. Complete Question

**Endpoint**: `POST /api/interview/complete-question`

**Request Body**:
```json
{
  "session_id": "uuid-here",
  "question_id": "q1"
}
```

**Response**:
```json
{
  "insight_schema": {
    "desire": "อยากให้งานไหลลื่นและจัดการง่ายขึ้น",
    "barrier": "งานด่วนแทรกทำให้แผนที่วางไว้ล่ม",
    "action": "ต้องการระบบจัดลำดับงานแบบ Real-time"
  },
  "next_question": {
    "id": "q2",
    "category": "การแก้ปัญหา",
    "text": "ครั้งล่าสุดที่คุณเจอปัญหาในงาน คุณแก้ไขอย่างไร?"
  }
}
```

---

### 4. Get Session Progress

**Endpoint**: `GET /api/interview/session/{session_id}/progress`

**Response**:
```json
{
  "session_id": "uuid-here",
  "total_questions": 10,
  "completed_questions": 3,
  "progress_percentage": 30,
  "current_question_id": "q4",
  "insights_extracted": 3
}
```

---

### 5. Synthesize Insights (Macro-AI)

**Endpoint**: `POST /api/synthesize`

**Request Body**:
```json
{
  "session_ids": ["uuid-1", "uuid-2", "uuid-3"],
  "min_frequency": 3,
  "min_credibility": 0.7
}
```

**Response**:
```json
{
  "synthesis_id": "synth-uuid",
  "themes": [
    {
      "theme": "งานด่วนแทรกทำให้เสียโฟกัส",
      "frequency": 62,
      "credibility_score": 0.81,
      "representative_quotes": [
        "งานด่วนเข้ามาบ่อยมาก ต้องสลับงานตลอด",
        "วางแผนไว้แล้วแต่เปลี่ยนบ่อยเพราะมีงานแทรก"
      ]
    }
  ],
  "insight_statements": [
    "ผู้คนต้องการการทำงานที่ลื่นไหล แต่มีงานด่วนแทรกตลอด ทำให้เสียโฟกัส ดังนั้นพวกเขาจึงต้องการระบบจัดลำดับงานแบบ Real-time"
  ]
}
```

---

## 🤖 AI Prompt Engineering

### Micro-AI (Interviewer) Prompt

```
คุณคือ AI Interviewer ผู้เชี่ยวชาญการตั้งคำถามเชิงลึกแบบ Qualitative Research

เป้าหมายของคุณ:
- ให้ผู้ใช้ตอบคำถามเชิงลึกและละเอียด
- ใช้เทคนิค "5 Whys" และ "Laddering" เพื่อเจาะลึก
- ห้ามชี้นำคำตอบหรือใส่ความเห็นส่วนตัว
- ถาม follow-up ครั้งละ 1 ประโยค สั้นและชัดเจน
- หลังจบคำถาม ให้ Extract Insight Schema: {desire, barrier, action}

Context:
- คำถามหลัก: {main_question}
- คำตอบของผู้ใช้: {user_answer}
- จำนวน follow-up ที่ถามไปแล้ว: {follow_up_count}

ตอบเป็น JSON เท่านั้น:
{
  "follow_up": "คำถามเจาะลึก",
  "should_continue": true/false,
  "reasoning": "เหตุผลที่ถามคำถามนี้"
}
```

### Insight Extraction Prompt

```
วิเคราะห์คำตอบต่อไปนี้และสกัด Insight Schema:

คำถาม: {question}
คำตอบ: {all_answers}

ให้ระบุ:
1. Desire (ความต้องการ): สิ่งที่ผู้ใช้ต้องการหรือปรารถนา
2. Barrier (อุปสรรค): สิ่งที่ขวางทางหรือทำให้ยาก
3. Action (การกระทำ): สิ่งที่ผู้ใช้ทำหรือต้องการทำเพื่อแก้ปัญหา

ตอบเป็น JSON:
{
  "desire": "...",
  "barrier": "...",
  "action": "...",
  "confidence_score": 0.85
}
```

### Macro-AI (Synthesizer) Prompt

```
คุณคือ Macro-AI นักวิเคราะห์ Insight เชิงลึก

ให้คุณรวม Insight Schema จากหลาย session แล้วสร้าง Theme แบบ Qualitative Research

Input Data:
{insights_array}

ให้ทำ:
1. Cluster insights ที่คล้ายกันเป็น themes
2. นับความถี่ของแต่ละ theme
3. คำนวณ credibility score (0-1)
4. เลือก representative quotes ที่ดีที่สุด
5. สร้าง insight statement ในรูปแบบ:
   "ผู้คนต้องการ... แต่... ดังนั้นพวกเขาจึง..."

Output เป็น JSON:
{
  "themes": [...],
  "insight_statements": [...],
  "credibility_scores": [...],
  "representative_quotes": [...]
}
```

---

## 🎨 UI/UX Specification

### Color System

```css
:root {
  --background: #0B0C0F;
  --sidebar: #101114;
  --card: #181A1F;
  --card-hover: #1F2228;
  --border: #26282D;
  --primary: #3B82F6;
  --secondary: #8B5CF6;
  --text: #D0D2D6;
  --text-muted: #6E7176;
  --input-bg: #1C1E23;
}
```

### Typography Scale

| Element | Size | Weight | Line Height |
|---------|------|--------|-------------|
| Page Title | 32-36px | 600 | 1.2 |
| Question Title | 26-30px | 600 | 1.4 |
| Answer Text | 16-18px | 400 | 1.6 |
| Sidebar Items | 15-16px | 400 | 1.5 |
| Micro Labels | 12-13px | 400 | 1.4 |

### Component Specifications

#### Sidebar Navigation
- Width: 320px (80rem)
- Background: `--sidebar`
- Border: 1px solid `--border`
- Padding: 24px

#### Question Card (Expanded)
- Background: `--card`
- Border Radius: 16px
- Padding: 20px
- Active State: Blue gradient + left border

#### AI Bubble
- Background: #262930
- Border Radius: 16px (top-left: 4px)
- Max Width: 672px (2xl)
- Padding: 12px 16px

#### User Answer Bubble
- Background: Blue gradient
- Border Radius: 16px (top-right: 4px)
- Max Width: 672px (2xl)
- Padding: 12px 16px

#### Insight Schema Tags
- Desire: Blue (#3B82F6)
- Barrier: Red (#EF4444)
- Action: Green (#10B981)
- Padding: 8px 12px
- Border Radius: 6px

---

## 🔄 User Flow

```
1. Start Interview
   ↓
2. Show Q1 (expanded card)
   ↓
3. User answers
   ↓
4. Micro-AI follow-up (1-4 times)
   ↓
5. Extract Insight Schema
   ↓
6. Save & collapse card
   ↓
7. Open next question
   ↓
8. Repeat until last question
   ↓
9. Finish → Show Summary
   ↓
10. Send all Insight Schema to Macro-AI
    ↓
11. Generate Themes → Insight Report
```

---

## 📊 Data Flow

### Interview Session Flow

```
User Input → Frontend State
           ↓
        API Call
           ↓
     Micro-AI Processing
           ↓
    Follow-up Generation
           ↓
    Insight Extraction
           ↓
      Database Save
           ↓
    Frontend Update
```

### Synthesis Flow

```
Multiple Sessions → Macro-AI
                  ↓
            Theme Clustering
                  ↓
          Frequency Analysis
                  ↓
        Credibility Scoring
                  ↓
      Insight Statement Generation
                  ↓
            Dashboard Display
```

---

## 🧪 Testing Strategy

### Unit Tests
- Component rendering
- State management
- Data transformation
- API response handling

### Integration Tests
- Complete interview flow
- AI response simulation
- Insight extraction
- Database operations

### E2E Tests
- Full user journey
- Multi-question interview
- Progress tracking
- Synthesis generation

---

## 🚀 Deployment

### Frontend
- Platform: Vercel / Netlify
- Build: `npm run build`
- Environment: Node.js 18+

### Backend
- Platform: Railway / Render / AWS
- Framework: Express.js / FastAPI
- Database: PostgreSQL / Supabase

### AI Services
- OpenAI API (GPT-4)
- Anthropic API (Claude)
- Fallback: Local LLM

---

## 📈 Performance Metrics

### Target Metrics
- Page Load: < 2s
- AI Response: < 3s
- Insight Extraction: < 5s
- Synthesis (100 sessions): < 30s

### Scalability
- Concurrent Users: 1000+
- Sessions per Day: 10,000+
- Data Storage: 1TB+

---

## 🔐 Security

### Authentication
- JWT tokens
- OAuth 2.0 (Google, Microsoft)
- Session management

### Data Protection
- Encryption at rest
- HTTPS/TLS
- GDPR compliance
- Data anonymization

---

## 📝 Future Roadmap

### Phase 1 (MVP) ✅
- [x] Basic interview flow
- [x] Question cards UI
- [x] Simulated AI responses
- [x] Insight extraction display

### Phase 2 (Production)
- [ ] Real AI integration
- [ ] Database implementation
- [ ] User authentication
- [ ] Progress saving

### Phase 3 (Scale)
- [ ] Macro-AI synthesizer
- [ ] Dashboard analytics
- [ ] Export functionality
- [ ] Multi-language support

### Phase 4 (Advanced)
- [ ] Voice input/output
- [ ] Video recording
- [ ] Sentiment analysis
- [ ] Real-time collaboration

---

## 📞 Support

For technical support or questions:
- Email: support@example.com
- Docs: https://docs.example.com
- GitHub: https://github.com/example/ai-interview

---

**Version**: 1.0.0  
**Last Updated**: 2024  
**Status**: MVP Ready
