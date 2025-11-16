import React, { useState } from 'react';

function SimpleInterview() {
  // State management
  const [currentView, setCurrentView] = useState('setup'); // 'setup', 'interview', 'summary'
  const [topic, setTopic] = useState('น้ำยาล้างจาน');
  const [maxQuestions, setMaxQuestions] = useState(10);
  const [currentTurn, setCurrentTurn] = useState(1);
  const [currentQuestion, setCurrentQuestion] = useState('');
  const [answerInput, setAnswerInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [analysisResult, setAnalysisResult] = useState(null);
  const [showAnalysis, setShowAnalysis] = useState(false);
  
  // Codes tracking
  const [collectedCodes, setCollectedCodes] = useState([]);
  const [allCodes, setAllCodes] = useState({});
  
  const CODE_TYPES = {
    'Functional': 'ประโยชน์ใช้สอย',
    'Emotional': 'ความรู้สึก',
    'Brand Image': 'ภาพลักษณ์แบรนด์',
    'Barrier': 'อุปสรรค',
    'Trigger': 'ตัวกระตุ้น'
  };

  // Summary data
  const [summaryData, setSummaryData] = useState({
    totalQuestions: 0,
    collectedCount: 0,
    avgConfidence: 0,
    insight: null
  });

  const startInterview = () => {
    setCurrentView('interview');
    setCurrentTurn(1);
    setCurrentQuestion('เล่าให้ฟังหน่อยว่าคุณใช้ ' + topic + ' อย่างไร?');
    setCollectedCodes([]);
    setAllCodes({});
  };

  const submitAnswer = () => {
    if (!answerInput.trim()) {
      alert('กรุณาใส่คำตอบ');
      return;
    }

    setIsLoading(true);
    setShowAnalysis(false);

    // Simulate API call
    setTimeout(() => {
      // Mock analysis result
      const mockAnalysis = {
        codes: [
          {
            type: 'Functional',
            theme: 'ทำความสะอาดได้ดี',
            quote: answerInput.substring(0, 50) + '...',
            rationale: 'ผู้ใช้กล่าวถึงประสิทธิภาพในการใช้งาน',
            confidence: 0.85
          }
        ]
      };

      setAnalysisResult(mockAnalysis);
      setShowAnalysis(true);
      setIsLoading(false);

      // Update collected codes
      if (!collectedCodes.includes('Functional')) {
        setCollectedCodes([...collectedCodes, 'Functional']);
      }

      // Move to next question or summary
      if (currentTurn >= maxQuestions) {
        setTimeout(() => {
          showSummaryView();
        }, 2000);
      } else {
        setTimeout(() => {
          setCurrentTurn(currentTurn + 1);
          setCurrentQuestion('คำถามถัดไป: คุณรู้สึกอย่างไรเกี่ยวกับ ' + topic + '?');
          setAnswerInput('');
          setShowAnalysis(false);
        }, 3000);
      }
    }, 1200);
  };

  const showSummaryView = () => {
    setCurrentView('summary');
    setSummaryData({
      totalQuestions: currentTurn,
      collectedCount: collectedCodes.length,
      avgConfidence: 85,
      insight: {
        people_want: 'ผู้บริโภคต้องการ' + topic + 'ที่ทำความสะอาดได้ดีและมีกลิ่นหอม',
        but: 'แต่ราคาแพงและหาซื้อยาก',
        so_they: 'จึงเลือกซื้อแบรนด์ที่คุ้มค่าและหาง่าย',
        full_insight: 'ผู้บริโภคต้องการผลิตภัณฑ์ที่มีประสิทธิภาพสูง แต่ต้องไม่แพงเกินไปและหาซื้อได้ง่าย'
      }
    });
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      submitAnswer();
    }
  };

  const saveResults = () => {
    const data = {
      topic,
      totalQuestions: summaryData.totalQuestions,
      collectedCodes,
      timestamp: new Date().toISOString()
    };
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `interview_results_${Date.now()}.json`;
    link.click();
  };

  const exportCSV = () => {
    let csv = '\uFEFF'; // UTF-8 BOM
    csv += 'Code Type,Status\n';
    Object.keys(CODE_TYPES).forEach(code => {
      csv += `"${code}","${collectedCodes.includes(code) ? 'Collected' : 'Missing'}"\n`;
    });
    
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `interview_summary_${Date.now()}.csv`;
    link.click();
  };

  return (
    <div className="min-h-screen bg-[#0B0C0F] text-gray-100 p-5">
      <div className="max-w-4xl mx-auto bg-[#101114] rounded-3xl shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="bg-gradient-to-r from-blue-600 to-purple-600 text-white p-8 text-center relative">
          <a href="/config" className="absolute top-8 right-8 bg-white/20 hover:bg-white/30 px-5 py-2 rounded-lg font-semibold transition-colors">
            ⚙️ Configuration
          </a>
          <h1 className="text-4xl font-bold mb-2">🎙️ Simple AI Interviewer</h1>
          <p className="text-lg opacity-90">ระบบสัมภาษณ์อัตโนมัติด้วย AI - จำแนกโค้ดอัตโนมัติ</p>
        </div>

        <button className="w-full mb-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-sm font-medium transition-colors">
          เริ่มสัมภาษณ์
        </button>

        <div className="mt-2 flex-1 flex flex-col">
          <p className="text-xs text-gray-400 mb-2">รายการคำถาม</p>

          <div className="space-y-1 overflow-y-auto pr-1">
            {questions.map((q) => (
              <button
                key={q.id}
                className={`w-full text-left px-3 py-2 rounded-lg text-sm transition-all ${getStatusButtonClass(q.status)}`}
              >
                <div className="flex items-center justify-between gap-2">
                  <span className={q.status === 'active' ? 'text-xs text-gray-200' : 'text-xs text-gray-400'}>
                    {q.label}
                  </span>
                  <span className={`inline-block w-2 h-2 rounded-full ${getStatusColor(q.status)}`}></span>
                </div>
                <div className="mt-1 line-clamp-2">
                  {q.text}
                </div>
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Main panel */}
      <main className="flex-1 p-8 flex flex-col gap-6 overflow-y-auto">
        {/* Active Question Card */}
        <section className="bg-[#181A1F] rounded-2xl p-6 shadow-lg border border-[#26282D]">
          <div className="flex items-center justify-between mb-3">
            <div>
              <p className="text-xs uppercase tracking-wide text-gray-500 mb-1">
                WORK BEHAVIOR
              </p>
              <h2 className="text-2xl font-semibold">
                เล่าให้ฟังหน่อยว่าคุณจัดลำดับความสำคัญของงานแต่ละวันอย่างไร?
              </h2>
            </div>
            <div className="text-xs text-gray-400">
              Status: <span className="font-semibold text-blue-400">active</span>
            </div>
          </div>

          {/* Chat area */}
          <div className="bg-[#101114] rounded-xl p-4 mb-4 max-h-72 overflow-y-auto space-y-3">
            {chatMessages.map((message, index) => (
              <div
                key={index}
                className={`flex ${message.type === 'user' ? 'items-end justify-end' : 'items-start'}`}
              >
                <div
                  className={`max-w-[80%] px-3 py-2 rounded-2xl text-sm ${
                    message.type === 'user'
                      ? 'bg-[#1E3A8A]'
                      : message.type === 'ai'
                      ? 'bg-[#262930]'
                      : 'bg-[#111317]'
                  }`}
                >
                  {message.text}
                </div>
              </div>
            ))}
          </div>

          {/* Insight Tags */}
          <div className="mt-3 flex flex-wrap gap-2 text-xs">
            {insights.map((insight, index) => (
              <span
                key={index}
                className={`inline-flex items-center px-3 py-1 rounded-full ${insight.color} bg-opacity-90`}
              >
                {insight.type.charAt(0).toUpperCase() + insight.type.slice(1)}: {insight.text}
              </span>
            ))}
          </div>

          {/* Input */}
          <div className="mt-4 flex gap-3">
            <input
              type="text"
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="พิมพ์คำตอบของคุณที่นี่..."
              className="flex-1 px-4 py-3 rounded-xl bg-[#101114] border border-[#26282D] focus:outline-none focus:border-blue-500 text-sm"
            />
            <button
              onClick={handleSendMessage}
              className="px-6 py-3 rounded-xl bg-blue-600 hover:bg-blue-700 text-sm font-semibold transition-colors"
            >
              ส่งคำตอบ
            </button>
          </div>
        </section>

        {/* Other Questions */}
        <section>
          <h3 className="text-sm text-gray-400 mb-2">คำถามอื่น ๆ ในแบบสัมภาษณ์</h3>
          <div className="space-y-2">
            {otherQuestions.map((question, index) => (
              <button
                key={index}
                className="w-full text-left px-4 py-3 rounded-xl bg-[#181A1F] hover:bg-[#1F2228] border border-[#26282D] flex justify-between items-center transition-colors"
              >
                <div className="flex-1">
                  <p className="text-xs text-gray-500">{question.category}</p>
                  <p className="text-sm line-clamp-1">{question.text}</p>
                  {question.insight && (
                    <p className="text-xs text-blue-300 mt-1 line-clamp-1">
                      Insight: {question.insight}
                    </p>
                  )}
                </div>
                <div className="flex flex-col items-end gap-1 ml-4">
                  <span className={`inline-block w-2 h-2 rounded-full ${getStatusColor(question.status)}`}></span>
                  <span className="text-xs text-gray-500">{question.status}</span>
                </div>
              </button>
            ))}
          </div>
        </section>
      </main>
    </div>
  );
}

export default SimpleInterview;
