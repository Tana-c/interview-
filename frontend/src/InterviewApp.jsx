import React, { useState } from 'react';
import { ChevronRight, ChevronDown, Send, Check, Circle, Sparkles } from 'lucide-react';

function InterviewApp() {
  const [currentQuestionId, setCurrentQuestionId] = useState('q1');
  const [answers, setAnswers] = useState({});
  const [followUps, setFollowUps] = useState({});
  const [insights, setInsights] = useState({});
  const [inputValue, setInputValue] = useState('');
  const [isAITyping, setIsAITyping] = useState(false);
  const [expandedCards, setExpandedCards] = useState(['q1']);

  const questions = [
    {
      id: 'q1',
      category: 'WORK BEHAVIOR',
      text: 'เล่าให้ฟังหน่อยว่าคุณจัดลำดับความสำคัญของงานแต่ละวันอย่างไร?',
      followUpTemplates: [
        'อะไรทำให้คุณเลือกใช้เกณฑ์นี้ในการจัดลำดับความสำคัญของงานครับ?',
        'มีครั้งไหนบ้างที่วิธีนี้ไม่ได้ผลตามที่คาดหวัง?'
      ]
    },
    {
      id: 'q2',
      category: 'PROBLEM SOLVING',
      text: 'ครั้งล่าสุดที่คุณเจอปัญหาในงาน คุณแก้ไขอย่างไร?',
      followUpTemplates: [
        'คุณรู้สึกอย่างไรในขณะที่กำลังแก้ปัญหานั้น?',
        'ถ้าเจอสถานการณ์แบบนี้อีก คุณจะทำแตกต่างไปจากเดิมไหม?'
      ]
    },
    {
      id: 'q3',
      category: 'MOTIVATION',
      text: 'อะไรคือแรงจูงใจหลักในการทำงานของคุณ?',
      followUpTemplates: [
        'เมื่อไหร่ที่คุณรู้สึกว่าแรงจูงใจนี้มีผลต่อการตัดสินใจของคุณมากที่สุด?',
        'มีอะไรที่อาจทำให้แรงจูงใจนี้ลดลงหรือเปลี่ยนแปลงไปบ้างไหม?'
      ]
    }
  ];

  const insightExamples = [
    {
      desire: 'งานไหลลื่น ไม่กระทบลูกค้า',
      barrier: 'งานด่วนแทรกบ่อย ทำให้เสียโฟกัส',
      action: 'ใช้เกณฑ์ลูกค้าและ Deadline เป็นตัวตั้ง'
    },
    {
      desire: 'ต้องการการสื่อสารที่โปร่งใสและแก้ปัญหาอย่างเป็นระบบ',
      barrier: 'ข้อมูลไม่ครบถ้วน ทำให้ตัดสินใจช้า',
      action: 'รวบรวมข้อมูลก่อนแก้ปัญหา และสื่อสารกับทีมอย่างชัดเจน'
    },
    {
      desire: 'ต้องการเติบโตและเรียนรู้สิ่งใหม่ๆ',
      barrier: 'งานซ้ำซากจำเจ ไม่มีความท้าทาย',
      action: 'มองหาโอกาสในการพัฒนาทักษะใหม่และรับผิดชอบงานที่ท้าทาย'
    }
  ];

  const getQuestionStatus = (qId) => {
    if (qId === currentQuestionId && !insights[qId]) return 'active';
    if (insights[qId]) return 'completed';
    return 'pending';
  };

  const simulateAIResponse = (questionId, answerText) => {
    setIsAITyping(true);
    
    setTimeout(() => {
      const question = questions.find(q => q.id === questionId);
      const currentFollowUpCount = (followUps[questionId] || []).length;
      
      if (currentFollowUpCount < question.followUpTemplates.length) {
        const nextFollowUp = question.followUpTemplates[currentFollowUpCount];
        setFollowUps(prev => ({
          ...prev,
          [questionId]: [...(prev[questionId] || []), nextFollowUp]
        }));
      } else {
        const qIndex = questions.findIndex(q => q.id === questionId);
        const extractedInsight = insightExamples[qIndex] || insightExamples[0];
        
        setInsights(prev => ({
          ...prev,
          [questionId]: extractedInsight
        }));
        
        const currentIndex = questions.findIndex(q => q.id === questionId);
        if (currentIndex < questions.length - 1) {
          setTimeout(() => {
            const nextQuestionId = questions[currentIndex + 1].id;
            setCurrentQuestionId(nextQuestionId);
            setExpandedCards(prev => [...prev, nextQuestionId]);
          }, 800);
        }
      }
      setIsAITyping(false);
    }, 1200);
  };

  const handleSubmit = () => {
    if (!inputValue.trim()) return;

    setAnswers(prev => ({
      ...prev,
      [currentQuestionId]: [...(prev[currentQuestionId] || []), inputValue]
    }));

    simulateAIResponse(currentQuestionId, inputValue);
    setInputValue('');
  };

  const toggleCardExpansion = (questionId) => {
    setExpandedCards(prev => 
      prev.includes(questionId)
        ? prev.filter(id => id !== questionId)
        : [...prev, questionId]
    );
  };

  const completedCount = Object.keys(insights).length;
  const progress = (completedCount / questions.length) * 100;

  return (
    <div className="flex h-screen bg-background text-white overflow-hidden">
      {/* Sidebar */}
      <div className="w-80 bg-sidebar border-r border-border overflow-y-auto flex-shrink-0">
        <div className="p-6">
          {/* Header */}
          <div className="mb-6">
            <div className="flex items-center gap-3 mb-3">
              <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center">
                <span className="text-2xl">🤖</span>
              </div>
              <div>
                <h1 className="text-xl font-bold text-text">AI Interview</h1>
                <p className="text-xs text-textMuted">Qual at Scale</p>
              </div>
            </div>
          </div>

          {/* Progress */}
          <div className="mb-6 p-4 bg-gradient-to-br from-card to-[#151719] rounded-xl border border-border">
            <div className="flex justify-between items-center text-xs text-textMuted mb-2">
              <span className="font-medium">ความคืบหน้า</span>
              <span className="font-bold text-blue-400">{completedCount}/{questions.length}</span>
            </div>
            <div className="w-full bg-border rounded-full h-2.5 overflow-hidden">
              <div 
                className="bg-gradient-to-r from-blue-500 to-purple-500 h-2.5 rounded-full transition-all duration-500 ease-out"
                style={{ width: `${progress}%` }}
              />
            </div>
            <div className="mt-2 text-xs text-textMuted">
              {progress === 100 ? '✅ เสร็จสมบูรณ์!' : `เหลืออีก ${questions.length - completedCount} คำถาม`}
            </div>
          </div>

          {/* Question List */}
          <div className="space-y-2">
            <h3 className="text-xs font-semibold text-textMuted uppercase tracking-wide mb-3">
              รายการคำถาม
            </h3>
            {questions.map((q, idx) => {
              const status = getQuestionStatus(q.id);
              return (
                <button
                  key={q.id}
                  onClick={() => {
                    setCurrentQuestionId(q.id);
                    if (!expandedCards.includes(q.id)) {
                      setExpandedCards(prev => [...prev, q.id]);
                    }
                  }}
                  className={`w-full text-left p-4 rounded-xl transition-all ${
                    status === 'active' 
                      ? 'bg-gradient-to-r from-blue-900/60 to-blue-800/60 border-l-4 border-blue-500 shadow-lg' 
                      : status === 'completed'
                      ? 'bg-card hover:bg-cardHover border-l-4 border-green-500/50'
                      : 'bg-card hover:bg-cardHover opacity-60 hover:opacity-80'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <div className="flex-shrink-0">
                      {status === 'completed' ? (
                        <div className="w-8 h-8 rounded-lg bg-green-500 flex items-center justify-center">
                          <Check className="w-5 h-5 text-white" />
                        </div>
                      ) : status === 'active' ? (
                        <div className="w-8 h-8 rounded-lg bg-blue-500 flex items-center justify-center animate-pulse">
                          <Circle className="w-5 h-5 text-white fill-current" />
                        </div>
                      ) : (
                        <div className="w-8 h-8 rounded-lg bg-gray-700 flex items-center justify-center">
                          <Circle className="w-5 h-5 text-gray-500" />
                        </div>
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="text-xs text-textMuted mb-1 font-medium">
                        คำถามที่ {idx + 1}
                      </div>
                      <div className="text-sm font-medium text-text line-clamp-2 leading-snug">
                        {q.text}
                      </div>
                    </div>
                  </div>
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* Main Panel */}
      <div className="flex-1 overflow-y-auto">
        <div className="max-w-4xl mx-auto p-8">
          {/* Header */}
          <div className="mb-8">
            <h2 className="text-3xl font-bold text-text mb-2">การสัมภาษณ์เชิงลึก</h2>
            <p className="text-textMuted leading-relaxed">
              ตอบคำถามอย่างละเอียดเพื่อให้เราเข้าใจมุมมองและประสบการณ์ของคุณอย่างลึกซึ้ง
            </p>
          </div>

          {/* Questions */}
          <div className="space-y-4">
            {questions.map((q) => (
              <QuestionCard
                key={q.id}
                answers={answers}
                followUps={followUps}
                insights={insights}
                isAITyping={isAITyping}
                handleSubmit={handleSubmit}
                setInputValue={setInputValue}
                inputValue={inputValue}
                toggleCardExpansion={toggleCardExpansion}
                question={q}
                isExpanded={expandedCards.includes(q.id)}
                isActive={currentQuestionId === q.id && !insights[q.id]}
              />
            ))}
          </div>

          {/* Completion Message */}
          {completedCount === questions.length && (
            <div className="mt-8 p-6 bg-gradient-to-r from-green-600/20 via-blue-600/20 to-purple-600/20 rounded-2xl border border-green-500/30 animate-fadeIn">
              <div className="flex items-start gap-4">
                <div className="w-12 h-12 rounded-full bg-gradient-to-br from-green-500 to-blue-500 flex items-center justify-center flex-shrink-0">
                  <span className="text-2xl">🎉</span>
                </div>
                <div className="flex-1">
                  <h3 className="text-xl font-bold text-text mb-2">เสร็จสมบูรณ์!</h3>
                  <p className="text-text mb-4 leading-relaxed">
                    ขอบคุณสำหรับการให้ข้อมูลที่ละเอียดและมีคุณค่า ระบบ AI กำลังวิเคราะห์และสังเคราะห์ Insights จากคำตอบของคุณ
                  </p>
                  <button className="px-6 py-3 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 rounded-lg font-medium transition-all shadow-lg hover:shadow-blue-500/50">
                    📊 ดูรายงานสรุป Insights
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function QuestionCard({ question, isExpanded, isActive, answers, followUps, insights, isAITyping, handleSubmit, setInputValue, inputValue, toggleCardExpansion }) {
  const hasAnswers = answers[question.id] && answers[question.id].length > 0;
  const questionFollowUps = followUps[question.id] || [];
  const insight = insights[question.id];

  return (
    <div className={`mb-4 rounded-2xl transition-all duration-300 ${
      isActive ? 'bg-gradient-to-r from-blue-900/40 to-blue-800/40 border-l-4 border-blue-500 shadow-lg shadow-blue-500/20' : 'bg-card hover:bg-cardHover'
    }`}>
      <div 
        className="p-5 cursor-pointer flex items-center justify-between"
        onClick={() => !isActive && toggleCardExpansion(question.id)}
      >
        <div className="flex-1">
          <div className="flex items-center gap-3 mb-2">
            <span className="text-xs font-semibold text-blue-400 uppercase tracking-wide bg-blue-500/10 px-2 py-1 rounded-md">
              {question.category}
            </span>
            {insight && (
              <div className="flex items-center gap-1">
                <Check className="w-4 h-4 text-green-500" />
                <span className="text-xs text-green-500 font-medium">ตอบแล้ว</span>
              </div>
            )}
          </div>
          <h3 className="text-lg font-semibold text-text leading-relaxed">
            {question.text}
          </h3>
          {hasAnswers && !isExpanded && !isActive && (
            <p className="text-sm text-textMuted mt-2 line-clamp-1">
              {answers[question.id][0]}
            </p>
          )}
        </div>
        
        {!isActive && (
          <button className="ml-4 transition-transform">
            {isExpanded ? (
              <ChevronDown className="w-5 h-5 text-textMuted" />
            ) : (
              <ChevronRight className="w-5 h-5 text-textMuted" />
            )}
          </button>
        )}
      </div>

      {(isExpanded || isActive) && (
        <div className="px-5 pb-5 space-y-4">
          {hasAnswers && answers[question.id].map((answer, idx) => (
            <div key={idx} className="space-y-3">
              {idx > 0 && questionFollowUps[idx - 1] && (
                <div className="flex gap-3 animate-fadeIn">
                  <div className="w-10 h-10 rounded-full bg-gradient-to-br from-purple-500 to-blue-500 flex items-center justify-center flex-shrink-0">
                    <Sparkles className="w-5 h-5 text-white" />
                  </div>
                  <div className="bg-[#262930] rounded-2xl rounded-tl-sm px-4 py-3 max-w-2xl">
                    <p className="text-sm text-text">
                      {questionFollowUps[idx - 1]}
                    </p>
                  </div>
                </div>
              )}
              
              <div className="flex gap-3 justify-end animate-fadeIn">
                <div className="bg-gradient-to-r from-blue-600 to-blue-700 rounded-2xl rounded-tr-sm px-4 py-3 max-w-2xl shadow-lg">
                  <p className="text-sm text-white leading-relaxed">
                    {answer}
                  </p>
                </div>
                <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-500 to-cyan-500 flex items-center justify-center flex-shrink-0">
                  <span className="text-white text-xs font-bold">คุณ</span>
                </div>
              </div>
            </div>
          ))}

          {isActive && !insight && questionFollowUps.length > 0 && 
           questionFollowUps.length > (answers[question.id]?.length || 0) - 1 && (
            <div className="flex gap-3 animate-fadeIn">
              <div className="w-10 h-10 rounded-full bg-gradient-to-br from-purple-500 to-blue-500 flex items-center justify-center flex-shrink-0">
                <Sparkles className="w-5 h-5 text-white" />
              </div>
              <div className="bg-[#262930] rounded-2xl rounded-tl-sm px-4 py-3 max-w-2xl">
                <p className="text-sm text-text">
                  {questionFollowUps[questionFollowUps.length - 1]}
                </p>
              </div>
            </div>
          )}

          {isActive && isAITyping && (
            <div className="flex gap-3 animate-fadeIn">
              <div className="w-10 h-10 rounded-full bg-gradient-to-br from-purple-500 to-blue-500 flex items-center justify-center flex-shrink-0">
                <Sparkles className="w-5 h-5 text-white" />
              </div>
              <div className="bg-[#262930] rounded-2xl px-4 py-3">
                <div className="flex gap-1">
                  <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></div>
                  <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></div>
                  <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></div>
                </div>
              </div>
            </div>
          )}

          {insight && (
            <div className="mt-4 p-5 bg-gradient-to-br from-inputBg to-[#151719] rounded-xl border border-border animate-fadeIn">
              <div className="flex items-center gap-2 mb-4">
                <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-yellow-500 to-orange-500 flex items-center justify-center">
                  <span className="text-white text-lg">💡</span>
                </div>
                <h4 className="text-sm font-bold text-text uppercase tracking-wide">
                  Insight Schema
                </h4>
              </div>
              <div className="space-y-3">
                <div className="flex items-start gap-3 p-3 bg-blue-500/10 rounded-lg border border-blue-500/20">
                  <span className="px-2.5 py-1 bg-blue-500 text-white text-xs rounded-md font-bold uppercase flex-shrink-0">
                    Desire
                  </span>
                  <span className="text-sm text-text flex-1 pt-0.5">
                    {insight.desire}
                  </span>
                </div>
                <div className="flex items-start gap-3 p-3 bg-red-500/10 rounded-lg border border-red-500/20">
                  <span className="px-2.5 py-1 bg-red-500 text-white text-xs rounded-md font-bold uppercase flex-shrink-0">
                    Barrier
                  </span>
                  <span className="text-sm text-text flex-1 pt-0.5">
                    {insight.barrier}
                  </span>
                </div>
                <div className="flex items-start gap-3 p-3 bg-green-500/10 rounded-lg border border-green-500/20">
                  <span className="px-2.5 py-1 bg-green-500 text-white text-xs rounded-md font-bold uppercase flex-shrink-0">
                    Action
                  </span>
                  <span className="text-sm text-text flex-1 pt-0.5">
                    {insight.action}
                  </span>
                </div>
              </div>
            </div>
          )}

          {isActive && !insight && (
            <div className="mt-4 animate-fadeIn">
              <div className="relative">
                <textarea
                  value={inputValue}
                  onChange={(e) => setInputValue(e.target.value)}
                  placeholder="เขียนคำตอบของคุณที่นี่... (กด Cmd+Enter เพื่อส่ง)"
                  className="w-full bg-inputBg text-text rounded-xl px-4 py-3 min-h-[120px] resize-none focus:outline-none focus:ring-2 focus:ring-blue-500 border border-border placeholder:text-textMuted"
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) {
                      e.preventDefault();
                      handleSubmit();
                    }
                  }}
                />
              </div>
              <div className="mt-3 flex justify-between items-center">
                <span className="text-xs text-textMuted">
                  {questionFollowUps.length > 0 && `Follow-up ${questionFollowUps.length}/${question.followUpTemplates.length}`}
                </span>
                <button
                  onClick={handleSubmit}
                  disabled={!inputValue.trim() || isAITyping}
                  className="flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 disabled:from-gray-700 disabled:to-gray-700 disabled:cursor-not-allowed text-white rounded-lg font-medium transition-all shadow-lg hover:shadow-blue-500/50 disabled:shadow-none"
                >
                  <Send className="w-4 h-4" />
                  ส่งคำตอบ
                </button>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

export default InterviewApp;
