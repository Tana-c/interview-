import React, { useState } from 'react';

function SimpleInterview({ onNavigateToConfig }) {
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
  const [sessionId, setSessionId] = useState(null);
  
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
    insight: null,
    allCodes: {},
    missingCodes: []
  });

  // API Base URL
  const API_BASE = 'http://localhost:8001';

  const startInterview = async () => {
    console.log('🚀 Starting interview...', { topic, maxQuestions });

    try {
      const response = await fetch(`${API_BASE}/api/start`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ topic, max_questions: maxQuestions })
      });

      const data = await response.json();
      console.log('✅ Interview started:', data);

      setSessionId(data.session_id);
      setCurrentView('interview');
      setCurrentTurn(1);
      setCurrentQuestion(data.question);
      setCollectedCodes([]);
      setAllCodes({});
    } catch (error) {
      console.error('❌ Error starting interview:', error);
      alert('เกิดข้อผิดพลาดในการเริ่มสัมภาษณ์: ' + error.message);
    }
  };

  const submitAnswer = async () => {
    if (!answerInput.trim()) {
      alert('กรุณาใส่คำตอบ');
      return;
    }

    setIsLoading(true);
    setShowAnalysis(false);

    try {
      const response = await fetch(`${API_BASE}/api/answer`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          session_id: sessionId,
          answer: answerInput,
          question: currentQuestion
        })
      });

      const data = await response.json();
      console.log('📊 Analysis result:', data);

      // Update analysis result
      if (data.analysis && data.analysis.codes) {
        setAnalysisResult(data.analysis);
        setShowAnalysis(true);

        // Update collected codes
        const newCodes = [...collectedCodes];
        data.analysis.codes.forEach(code => {
          if (!newCodes.includes(code.type)) {
            newCodes.push(code.type);
          }
        });
        setCollectedCodes(newCodes);

        // Store all codes
        setAllCodes(prev => ({
          ...prev,
          [currentTurn]: data.analysis.codes
        }));
      }

      setIsLoading(false);

      // Check if interview is complete
      if (data.is_complete || currentTurn >= maxQuestions) {
        setTimeout(() => {
          showSummaryView();
        }, 2000);
      } else {
        // Move to next question
        setTimeout(() => {
          setCurrentTurn(currentTurn + 1);
          setCurrentQuestion(data.next_question);
          setAnswerInput('');
          setShowAnalysis(false);
        }, 3000);
      }
    } catch (error) {
      console.error('❌ Error submitting answer:', error);
      setIsLoading(false);
      alert('เกิดข้อผิดพลาด: ' + error.message);
    }
  };

  const showSummaryView = async () => {
    setCurrentView('summary');

    try {
      // Get summary from API
      const response = await fetch(`${API_BASE}/api/summary/${sessionId}`);
      const summary = await response.json();
      console.log('📋 Summary:', summary);

      setSummaryData({
        totalQuestions: summary.total_questions || currentTurn,
        collectedCount: summary.collected_codes?.length || collectedCodes.length,
        avgConfidence: summary.avg_confidence || 0,
        insight: null,
        allCodes: summary.all_codes || {},
        missingCodes: summary.missing_codes || []
      });

      // Load insight
      loadInsight();
    } catch (error) {
      console.error('❌ Error loading summary:', error);
      // Fallback to local data
      setSummaryData({
        totalQuestions: currentTurn,
        collectedCount: collectedCodes.length,
        avgConfidence: 85,
        insight: null,
        allCodes: allCodes,
        missingCodes: Object.keys(CODE_TYPES).filter(type => !collectedCodes.includes(type))
      });
    }
  };

  const loadInsight = async () => {
    try {
      const response = await fetch(`${API_BASE}/api/insight/${sessionId}`);
      const insight = await response.json();
      console.log('💡 Insight:', insight);

      setSummaryData(prev => ({
        ...prev,
        insight: {
          people_want: insight.people_want || '',
          but: insight.but || '',
          so_they: insight.so_they || '',
          full_insight: insight.full_insight || ''
        }
      }));
    } catch (error) {
      console.error('❌ Error loading insight:', error);
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      submitAnswer();
    }
  };

  const saveResults = async () => {
    try {
      const response = await fetch(`${API_BASE}/api/save/${sessionId}`, { method: 'POST' });
      const data = await response.json();
      alert('✅ ' + data.message + '\nไฟล์: ' + data.filename);
    } catch (error) {
      console.error('❌ Error saving results:', error);
      alert('เกิดข้อผิดพลาดในการบันทึก: ' + error.message);
    }
  };

  const exportCSV = async () => {
    try {
      const response = await fetch(`${API_BASE}/api/summary/${sessionId}`);
      const summary = await response.json();

      let csv = '\uFEFF';
      csv += 'Code Type,Code ID,Theme,Quote\n';

      Object.entries(summary.codes_by_type || {}).forEach(([codeType, codes]) => {
        const codeTypeDisplay = CODE_TYPES[codeType] || codeType;
        codes.forEach(code => {
          const codeId = code.code_id || '';
          const theme = (code.theme || '').replace(/"/g, '""');
          const quote = (code.quote || '').replace(/"/g, '""');
          csv += `"${codeTypeDisplay}","${codeId}","${theme}","${quote}"\n`;
        });
      });

      const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `interview_summary_${sessionId}.csv`;
      link.click();

      alert('✅ Export ตารางเป็น CSV สำเร็จ!');
    } catch (error) {
      console.error('❌ Error exporting CSV:', error);
      alert('เกิดข้อผิดพลาด: ' + error.message);
    }
  };

  return (
    <div className="min-h-screen bg-[#0B0C0F] text-gray-100 p-5">
      <div className="max-w-4xl mx-auto bg-white rounded-3xl shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="bg-gradient-to-r from-blue-600 to-purple-600 text-white p-8 text-center relative">
          <button
            onClick={() => onNavigateToConfig && onNavigateToConfig()}
            className="absolute top-8 right-8 bg-white/20 hover:bg-white/30 px-5 py-2 rounded-lg font-semibold transition-colors cursor-pointer"
          >
            ⚙️ Configuration
          </button>
          <h1 className="text-4xl font-bold mb-2">🎙️ Simple AI Interviewer</h1>
          <p className="text-lg opacity-90">ระบบสัมภาษณ์อัตโนมัติด้วย AI - จำแนกโค้ดอัตโนมัติ</p>
        </div>

        <div className="p-8">
          {/* Setup Form */}
          {currentView === 'setup' && (
            <div className="bg-gray-50 p-6 rounded-2xl mb-8">
              <h2 className="text-2xl font-bold mb-5 text-gray-800">⚙️ ตั้งค่าการสัมภาษณ์</h2>
              
              <div className="mb-5">
                <label className="block font-semibold mb-2 text-gray-700">หัวข้อที่ต้องการสัมภาษณ์:</label>
                <input
                  type="text"
                  value={topic}
                  onChange={(e) => setTopic(e.target.value)}
                  placeholder="เช่น น้ำยาล้างจาน, แชมพู, สบู่"
                  className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg text-lg focus:outline-none focus:border-blue-500 text-gray-800"
                />
              </div>

              <div className="mb-5">
                <label className="block font-semibold mb-2 text-gray-700">จำนวนคำถามสูงสุด:</label>
                <input
                  type="number"
                  value={maxQuestions}
                  onChange={(e) => setMaxQuestions(parseInt(e.target.value))}
                  min="3"
                  max="20"
                  className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg text-lg focus:outline-none focus:border-blue-500 text-gray-800"
                />
              </div>

              <button
                onClick={startInterview}
                className="w-full bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white py-4 rounded-xl text-lg font-semibold transition-all transform hover:-translate-y-1 hover:shadow-xl"
              >
                🚀 เริ่มการสัมภาษณ์
              </button>
            </div>
          )}

          {/* Interview Section */}
          {currentView === 'interview' && (
            <div>
              {/* Progress Bar */}
              <div className="bg-gray-300 h-8 rounded-2xl overflow-hidden mb-5">
                <div
                  className="bg-gradient-to-r from-blue-600 to-purple-600 h-full flex items-center justify-center text-white font-semibold transition-all duration-500"
                  style={{ width: `${(currentTurn / maxQuestions) * 100}%` }}
                >
                  {Math.round((currentTurn / maxQuestions) * 100)}%
                </div>
              </div>

              {/* Codes Status */}
              <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-5">
                {Object.keys(CODE_TYPES).map((code) => (
                  <div
                    key={code}
                    className={`p-3 rounded-xl text-center font-semibold transition-transform hover:scale-105 ${
                      collectedCodes.includes(code)
                        ? 'bg-green-100 text-green-800 border-2 border-green-500'
                        : 'bg-red-100 text-red-800 border-2 border-red-500'
                    }`}
                  >
                    <div className="text-2xl mb-1">{collectedCodes.includes(code) ? '✅' : '⏳'}</div>
                    <div className="text-sm">{CODE_TYPES[code]}</div>
                  </div>
                ))}
              </div>

              {/* Question Box */}
              <div className="bg-blue-50 p-6 rounded-2xl mb-5 border-l-4 border-blue-600">
                <h3 className="text-blue-600 mb-3 text-xl font-semibold">
                  🤖 คำถามที่ {currentTurn}/{maxQuestions}
                </h3>
                <p className="text-lg leading-relaxed text-gray-800">{currentQuestion}</p>
              </div>

              {/* Answer Box */}
              <div className="mb-5">
                <textarea
                  value={answerInput}
                  onChange={(e) => setAnswerInput(e.target.value)}
                  onKeyDown={handleKeyDown}
                  placeholder="พิมพ์คำตอบของคุณที่นี่..."
                  className="w-full px-4 py-4 border-2 border-gray-300 rounded-xl text-lg resize-y min-h-[120px] focus:outline-none focus:border-blue-500 text-gray-800"
                />
              </div>

              <button
                onClick={submitAnswer}
                disabled={isLoading}
                className="w-full bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 disabled:opacity-60 disabled:cursor-not-allowed text-white py-4 rounded-xl text-lg font-semibold transition-all transform hover:-translate-y-1 hover:shadow-xl"
              >
                📤 ส่งคำตอบ
              </button>

              {/* Loading */}
              {isLoading && (
                <div className="text-center py-5 text-blue-600 text-lg">
                  <div className="w-10 h-10 border-4 border-gray-300 border-t-blue-600 rounded-full animate-spin mx-auto mb-3"></div>
                  <p>กำลังวิเคราะห์คำตอบ...</p>
                </div>
              )}

              {/* Analysis Result */}
              {showAnalysis && analysisResult && (
                <div className="bg-yellow-50 p-5 rounded-xl mt-5 border-l-4 border-yellow-500">
                  <h4 className="text-yellow-800 mb-4 font-semibold text-lg">✨ พบโค้ดประเภท:</h4>
                  {analysisResult.codes.map((code, idx) => (
                    <div key={idx} className="bg-white p-4 rounded-lg mb-3 border border-gray-200">
                      <h5 className="text-blue-600 mb-2 font-semibold">📌 {code.type}</h5>
                      <p className="mb-1 text-gray-800"><strong>ธีม:</strong> {code.theme}</p>
                      <p className="mb-1 text-gray-800"><strong>คำพูด:</strong> "{code.quote}"</p>
                      <p className="mb-2 text-gray-800"><strong>เหตุผล:</strong> {code.rationale}</p>
                      <div className="bg-gray-200 h-2 rounded-full overflow-hidden mt-2">
                        <div
                          className="bg-green-500 h-full transition-all duration-500"
                          style={{ width: `${code.confidence * 100}%` }}
                        ></div>
                      </div>
                      <p className="text-right text-sm mt-1 text-gray-600">
                        ความมั่นใจ: {Math.round(code.confidence * 100)}%
                      </p>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Summary Section */}
          {currentView === 'summary' && (
            <div>
              <div className="bg-gray-50 p-6 rounded-2xl">
                <h3 className="text-3xl font-bold mb-5 text-blue-600">🎉 สรุปผลการสัมภาษณ์</h3>
                
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-5">
                  <div className="bg-white p-5 rounded-xl text-center shadow-md">
                    <h4 className="text-gray-500 text-sm mb-2">จำนวนคำถาม</h4>
                    <p className="text-4xl font-bold text-blue-600">{summaryData.totalQuestions}</p>
                  </div>
                  <div className="bg-white p-5 rounded-xl text-center shadow-md">
                    <h4 className="text-gray-500 text-sm mb-2">โค้ดที่เก็บได้</h4>
                    <p className="text-4xl font-bold text-blue-600">{summaryData.collectedCount}/5</p>
                  </div>
                  <div className="bg-white p-5 rounded-xl text-center shadow-md">
                    <h4 className="text-gray-500 text-sm mb-2">ความมั่นใจเฉลี่ย</h4>
                    <p className="text-4xl font-bold text-blue-600">{summaryData.avgConfidence}%</p>
                  </div>
                </div>

                {/* Code Summary Table */}
                {Object.keys(summaryData.allCodes).length > 0 && (
                  <div className="bg-white p-6 rounded-2xl mb-5 shadow-md">
                    <h4 className="text-2xl font-bold text-blue-600 mb-4">📊 ตารางสรุปโค้ด</h4>
                    
                    <div className="overflow-x-auto">
                      <table className="w-full border-collapse">
                        <thead>
                          <tr className="bg-gradient-to-r from-blue-600 to-purple-600 text-white">
                            <th className="p-3 text-left border border-gray-300" style={{ width: '15%' }}>Code Type</th>
                            <th className="p-3 text-left border border-gray-300" style={{ width: '10%' }}>Code ID</th>
                            <th className="p-3 text-left border border-gray-300" style={{ width: '30%' }}>Key Theme</th>
                            <th className="p-3 text-left border border-gray-300" style={{ width: '45%' }}>Representative Quote</th>
                          </tr>
                        </thead>
                        <tbody>
                          {Object.entries(summaryData.allCodes).map(([codeType, items]) => (
                            items.length > 0 && items.map((item, index) => (
                              <tr 
                                key={`${codeType}-${index}`}
                                className="hover:bg-gray-50"
                                style={{
                                  borderBottom: index === items.length - 1 ? '2px solid #667eea' : '1px solid #e5e7eb'
                                }}
                              >
                                {index === 0 && (
                                  <td 
                                    className="p-3 font-semibold text-blue-600 bg-blue-50 border border-gray-300"
                                    rowSpan={items.length}
                                  >
                                    {codeType}
                                  </td>
                                )}
                                <td className="p-3 text-center border border-gray-300 text-gray-700">
                                  {item.code_id || '-'}
                                </td>
                                <td className="p-3 border border-gray-300 text-gray-800">
                                  {item.theme}
                                </td>
                                <td className="p-3 border border-gray-300 text-gray-600 italic">
                                  "{item.quote}"
                                </td>
                              </tr>
                            ))
                          ))}
                        </tbody>
                      </table>
                    </div>

                    {/* Missing Codes */}
                    {summaryData.missingCodes.length > 0 && (
                      <div className="bg-yellow-50 border border-yellow-300 rounded-lg p-4 mt-4">
                        <h5 className="text-yellow-800 font-semibold mb-2">⏳ ประเภทโค้ดที่ยังขาด:</h5>
                        <p className="text-yellow-700">{summaryData.missingCodes.join(', ')}</p>
                      </div>
                    )}
                  </div>
                )}

                {/* Consumer Insight */}
                {summaryData.insight && (
                  <div className="bg-gradient-to-r from-blue-600 to-purple-600 text-white p-6 rounded-2xl mb-5">
                    <h4 className="text-2xl font-bold mb-4">💡 Consumer Insight</h4>
                    <div className="space-y-4">
                      <div className="bg-white/10 p-4 rounded-lg border-l-4 border-white">
                        <strong className="block mb-2 text-lg">📌 People want:</strong>
                        <p>{summaryData.insight.people_want}</p>
                      </div>
                      <div className="bg-white/10 p-4 rounded-lg border-l-4 border-white">
                        <strong className="block mb-2 text-lg">⚠️ But:</strong>
                        <p>{summaryData.insight.but}</p>
                      </div>
                      <div className="bg-white/10 p-4 rounded-lg border-l-4 border-white">
                        <strong className="block mb-2 text-lg">✅ So they:</strong>
                        <p>{summaryData.insight.so_they}</p>
                      </div>
                      <div className="bg-white/20 p-5 rounded-lg mt-5">
                        <strong className="block mb-2 text-lg">💬 Full Insight:</strong>
                        <p className="text-lg leading-relaxed">{summaryData.insight.full_insight}</p>
                      </div>
                    </div>
                  </div>
                )}

                {/* Action Buttons */}
                <div className="flex flex-wrap gap-3">
                  <button
                    onClick={saveResults}
                    className="flex-1 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white py-3 rounded-xl font-semibold transition-all"
                  >
                    💾 บันทึกผลลัพธ์ (JSON)
                  </button>
                  <button
                    onClick={exportCSV}
                    className="flex-1 bg-green-600 hover:bg-green-700 text-white py-3 rounded-xl font-semibold transition-all"
                  >
                    📊 Export ตาราง (CSV)
                  </button>
                  <button
                    onClick={() => window.location.reload()}
                    className="flex-1 bg-gray-600 hover:bg-gray-700 text-white py-3 rounded-xl font-semibold transition-all"
                  >
                    🔄 เริ่มใหม่
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

export default SimpleInterview;
