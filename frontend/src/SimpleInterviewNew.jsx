// src/SimpleInterview.jsx
import { useState, useEffect } from 'react';
import Swal from 'sweetalert2';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
  faGear,
  faMicrophoneLines,
  faRocket,
  faPaperPlane,
  faWandMagicSparkles,
  faThumbtack,
  faTrophy,
  faChartBar,
  faHourglassHalf,
  faCheckCircle,
  faLightbulb,
  faRotate,
  faFloppyDisk,
  faTriangleExclamation,
  faCommentDots,
  faSun,
  faMoon
} from '@fortawesome/free-solid-svg-icons';

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

  const [theme, setTheme] = useState(() =>
    localStorage.getItem('theme') === 'dark' ? 'dark' : 'light'
  );

  useEffect(() => {
    const nextClass = theme === 'dark' ? 'theme-dark' : 'theme-light';
    document.body.classList.remove('theme-light', 'theme-dark');
    document.body.classList.add(nextClass);
    localStorage.setItem('theme', theme);
  }, [theme]);

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

  const showAlert = ({ icon = 'info', title, text }) =>
    Swal.fire({
      icon,
      title,
      text,
      background: '#111827',
      color: '#F4F7FF',
      confirmButtonColor: '#FACC15'
    });

  const handleConfigClick = (event) => {
    if (onNavigateToConfig) {
      event.preventDefault();
      onNavigateToConfig();
    } else {
      window.location.href = '/config';
    }
  };

  const toggleTheme = () => {
    setTheme(prev => (prev === 'dark' ? 'light' : 'dark'));
  };

  const startInterview = async () => {
    console.log('[Interview] Starting interview...', { topic, maxQuestions });

    try {
      const response = await fetch(`${API_BASE}/api/start`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ topic, max_questions: maxQuestions })
      });

      const data = await response.json();
      console.log('[Interview] Session created:', data);

      setSessionId(data.session_id);
      setCurrentView('interview');
      setCurrentTurn(1);
      setCurrentQuestion(data.question);
      setCollectedCodes([]);
      setAllCodes({});
    } catch (error) {
      console.error('❌ Error starting interview:', error);
      showAlert({
        icon: 'error',
        title: 'เกิดข้อผิดพลาดในการเริ่มสัมภาษณ์',
        text: error.message
      });
    }
  };

  const submitAnswer = async () => {
    if (!answerInput.trim()) {
      showAlert({
        icon: 'warning',
        title: 'กรุณาใส่คำตอบ',
        text: 'โปรดพิมพ์คำตอบของคุณก่อนกดส่ง'
      });
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
      console.log('[Interview] Analysis result:', data);

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

        // Store all codes (by question turn)
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
      showAlert({
        icon: 'error',
        title: 'ส่งคำตอบไม่สำเร็จ',
        text: error.message
      });
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
      console.log('[Interview] Insight:', insight);

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
      showAlert({
        icon: 'success',
        title: 'บันทึกผลลัพธ์สำเร็จ',
        text: `ไฟล์: ${data.filename}`
      });
    } catch (error) {
      console.error('❌ Error saving results:', error);
      showAlert({
        icon: 'error',
        title: 'บันทึกไม่สำเร็จ',
        text: error.message
      });
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

      showAlert({
        icon: 'success',
        title: 'Export สำเร็จ',
        text: 'บันทึกไฟล์ CSV เรียบร้อยแล้ว'
      });
    } catch (error) {
      console.error('❌ Error exporting CSV:', error);
      showAlert({
        icon: 'error',
        title: 'Export ไม่สำเร็จ',
        text: error.message
      });
    }
  };

  const handleRestart = async () => {
    const { isConfirmed } = await Swal.fire({
      title: 'เริ่มการสัมภาษณ์ใหม่?',
      text: 'ข้อมูลที่ยังไม่บันทึกจะหายไป',
      icon: 'warning',
      showCancelButton: true,
      confirmButtonText: 'ยืนยัน',
      cancelButtonText: 'ยกเลิก',
      reverseButtons: true
    });
    if (isConfirmed) {
      window.location.reload();
    }
  };

  return (
    <div className="min-h-screen bg-background text-text p-6">
      <div className="max-w-4xl mx-auto glass-panel overflow-hidden">
        {/* Header */}

        <div className="bg-gradient-to-r from-[#1877F2] to-[#1451A1] text-white p-8 text-center relative border-b border-border/60">
          <div className="absolute top-8 right-8 flex gap-3 flex-wrap justify-end z-10 pointer-events-none">
           
            <button
              type="button"
              onClick={handleConfigClick}
              className="inline-flex items-center gap-2 rounded-full bg-white text-primary px-5 py-2 font-semibold transition-all shadow-soft hover:bg-[#F0F2F5] focus:outline-none focus:ring-2 focus:ring-primary/40 focus:ring-offset-2 pointer-events-auto"
              aria-label="Configuration"
            >
              <FontAwesomeIcon icon={faGear} />
              Configuration
            </button>
          </div>
          <h1 className="text-4xl font-bold mb-2 flex items-center justify-center gap-3 relative">
            <FontAwesomeIcon icon={faMicrophoneLines} />
            Simple AI Interviewer
          </h1>
          <p className="text-lg opacity-90 relative">ระบบสัมภาษณ์อัตโนมัติด้วย AI - จำแนกโค้ดอัตโนมัติ</p>
        </div>

        <div className="p-8">
          {/* Setup Form */}
          {currentView === 'setup' && (
            <div className="glow-card p-6 mb-8 space-y-5">
              <h2 className="text-2xl font-bold mb-5 flex items-center gap-2 text-text">
                <FontAwesomeIcon icon={faGear} />
                ตั้งค่าการสัมภาษณ์
              </h2>

              <div className="mb-5">
                <label className="block font-semibold mb-2 text-text">หัวข้อที่ต้องการสัมภาษณ์:</label>
                <input
                  type="text"
                  value={topic}
                  onChange={(e) => setTopic(e.target.value)}
                  placeholder="เช่น น้ำยาล้างจาน, แชมพู, สบู่"
                  className="w-full px-4 py-3 border border-border rounded-2xl text-lg focus:outline-none focus:ring-2 focus:ring-primary/30 text-text bg-inputBg placeholder:text-textMuted"
                />
              </div>

              <div className="mb-5">
                <label className="block font-semibold mb-2 text-text">จำนวนคำถามสูงสุด:</label>
                <input
                  type="number"
                  value={maxQuestions}
                  onChange={(e) => setMaxQuestions(parseInt(e.target.value))}
                  min="3"
                  max="20"
                  className="w-full px-4 py-3 border border-border rounded-2xl text-lg focus:outline-none focus:ring-2 focus:ring-primary/30 text-text bg-inputBg"
                />
              </div>

              <button
                onClick={startInterview}
                className="w-full bg-primary text-white py-4 rounded-2xl text-lg font-semibold transition-all transform hover:-translate-y-1 hover:shadow-soft"
              >
                <FontAwesomeIcon icon={faRocket} className="mr-2" />
                เริ่มการสัมภาษณ์
              </button>
            </div>
          )}

          {/* Interview Section */}
          {currentView === 'interview' && (
            <div>
              {/* Progress Bar */}
              <div className="bg-border h-8 rounded-2xl overflow-hidden mb-5">
                <div
                  className="bg-primary h-full flex items-center justify-center text-white font-semibold transition-all duration-500"
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
                    className={`p-3 rounded-xl text-center font-semibold transition-transform hover:scale-105 border ${collectedCodes.includes(code)
                        ? 'bg-primary/10 text-primary border-primary/40'
                        : 'border-border bg-cardHover text-textMuted'
                      }`}
                  >
                    <div className="text-lg mb-1 flex items-center justify-center">
                      <FontAwesomeIcon
                        icon={collectedCodes.includes(code) ? faCheckCircle : faHourglassHalf}
                        className={collectedCodes.includes(code) ? 'text-primary' : 'text-textMuted'}
                      />
                    </div>
                    <div className="text-sm">{CODE_TYPES[code]}</div>
                  </div>
                ))}
              </div>

              {/* Question Box */}
              <div className="glow-card p-6 mb-5">
                <h3 className="text-text mb-3 text-xl font-semibold flex items-center gap-2">
                  <FontAwesomeIcon icon={faLightbulb} />
                  คำถามที่ {currentTurn}/{maxQuestions}
                </h3>
                <p className="text-lg leading-relaxed">{currentQuestion}</p>
              </div>

              {/* Answer Box */}
              <div className="mb-5">
                <textarea
                  value={answerInput}
                  onChange={(e) => setAnswerInput(e.target.value)}
                  onKeyDown={handleKeyDown}
                  placeholder="พิมพ์คำตอบของคุณที่นี่..."
                  className="w-full px-4 py-4 border border-border rounded-2xl text-lg resize-y min-h-[120px] focus:outline-none focus:ring-2 focus:ring-primary/30 bg-inputBg text-text placeholder:text-textMuted"
                />
              </div>

              <button
                onClick={submitAnswer}
                disabled={isLoading}
                className="w-full bg-primary text-white disabled:bg-border disabled:text-textMuted disabled:cursor-not-allowed py-4 rounded-2xl text-lg font-semibold transition-all transform hover:-translate-y-1 hover:shadow-soft"
              >
                <FontAwesomeIcon icon={faPaperPlane} className="mr-2" />
                ส่งคำตอบ
              </button>

              {/* Loading */}
              {isLoading && (
                <div className="text-center py-5 text-primary text-lg">
                  <div className="w-10 h-10 border-4 border-border border-t-primary rounded-full animate-spin mx-auto mb-3"></div>
                  <p>กำลังวิเคราะห์คำตอบ...</p>
                </div>
              )}

              {/* Analysis Result */}
              {showAnalysis && analysisResult && (
                <div className="glow-card p-5 mt-5 space-y-4 font-sans" style={{ fontFamily: "'Kanit', sans-serif" }}>
                  <h4 className="text-text mb-4 font-semibold text-lg flex items-center gap-2">
                    <FontAwesomeIcon icon={faWandMagicSparkles} />
                    พบโค้ดประเภท:
                  </h4>
                  {analysisResult.codes.map((code, idx) => (
                    <div key={idx} className="bg-card p-4 rounded-2xl border border-border shadow-soft">
                      <h5 className="text-text mb-2 font-semibold flex items-center gap-2">
                        <FontAwesomeIcon icon={faThumbtack} />
                        {code.type}
                      </h5>
                      <p className="mb-1 text-text"><strong>ธีม:</strong> {code.theme}</p>
                      <p className="mb-1 text-text">
                        <strong>คำพูด:</strong>{' '}
                        <span className="italic">&ldquo;{code.quote}&rdquo;</span>
                      </p>
                      <p className="mb-2 text-text"><strong>เหตุผล:</strong> {code.rationale}</p>
                      <div className="bg-border h-2 rounded-full overflow-hidden mt-2">
                        <div
                          className="bg-success h-full transition-all duration-500"
                          style={{ width: `${code.confidence * 100}%` }}
                        ></div>
                      </div>
                      <p className="text-right text-sm mt-1 text-textMuted">
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
              <div className="glow-card p-6 space-y-5">
                <h3 className="text-3xl font-bold mb-5 flex items-center gap-2 text-text">
                  <FontAwesomeIcon icon={faTrophy} />
                  สรุปผลการสัมภาษณ์
                </h3>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-5">
                  <div className="bg-card p-5 rounded-2xl text-center border border-border shadow-soft">
                    <h4 className="text-textMuted text-sm mb-2">จำนวนคำถาม</h4>
                    <p className="text-4xl font-bold text-text">{summaryData.totalQuestions}</p>
                  </div>
                  <div className="bg-card p-5 rounded-2xl text-center border border-border shadow-soft">
                    <h4 className="text-textMuted text-sm mb-2">โค้ดที่เก็บได้</h4>
                    <p className="text-4xl font-bold text-text">{summaryData.collectedCount}/5</p>
                  </div>
                  <div className="bg-card p-5 rounded-2xl text-center border border-border shadow-soft">
                    <h4 className="text-textMuted text-sm mb-2">ความมั่นใจเฉลี่ย</h4>
                    <p className="text-4xl font-bold text-text">{summaryData.avgConfidence}%</p>
                  </div>
                </div>

                {/* Code Summary Table */}
                {Object.keys(summaryData.allCodes).length > 0 && (
                  <div className="bg-card p-6 rounded-2xl mb-5 shadow-soft border border-border">
                    <h4 className="text-2xl font-bold text-text mb-4 flex items-center gap-2">
                      <FontAwesomeIcon icon={faChartBar} />
                      ตารางสรุปโค้ด
                    </h4>

                    <div className="overflow-x-auto">
                      <table className="w-full border-collapse text-left text-sm md:text-base">
                        <thead>
                          <tr className="bg-primary text-white">
                            <th className="p-3 border border-border" style={{ width: '15%' }}>Code Type</th>
                            <th className="p-3 border border-border" style={{ width: '10%' }}>Code ID</th>
                            <th className="p-3 border border-border" style={{ width: '30%' }}>Key Theme</th>
                            <th className="p-3 border border-border" style={{ width: '45%' }}>Representative Quote</th>
                          </tr>
                        </thead>
                        <tbody>
                          {Object.entries(summaryData.allCodes).map(([codeType, items]) => (
                            items.length > 0 && items.map((item, index) => (
                              <tr
                                key={`${codeType}-${index}`}
                                className="hover:bg-cardHover/70"
                                style={{
                                  borderBottom: index === items.length - 1 ? '2px solid rgba(47, 60, 82, 0.8)' : '1px solid rgba(47, 60, 82, 0.6)'
                                }}
                              >
                                {index === 0 && (
                                  <td
                                    className="p-3 font-semibold text-text bg-cardHover border border-border"
                                    rowSpan={items.length}
                                  >
                                    {codeType}
                                  </td>
                                )}
                                <td className="p-3 text-center border border-border text-text">
                                  {item.code_id || '-'}
                                </td>
                                <td className="p-3 border border-border text-text">
                                  {item.theme}
                                </td>
                                <td className="p-3 border border-border text-textMuted italic">
                                  &ldquo;{item.quote}&rdquo;
                                </td>
                              </tr>
                            ))
                          ))}
                        </tbody>
                      </table>
                    </div>

                    {/* Missing Codes */}
                    {summaryData.missingCodes.length > 0 && (
                      <div className="gradient-border bg-background/40 rounded-2xl p-4 mt-4 text-text">
                        <h5 className="font-semibold mb-2 flex items-center gap-2">
                          <FontAwesomeIcon icon={faHourglassHalf} />
                          ประเภทโค้ดที่ยังขาด:
                        </h5>
                        <p className="text-textMuted">{summaryData.missingCodes.join(', ')}</p>
                      </div>
                    )}
                  </div>
                )}

                {/* Consumer Insight */}
                {summaryData.insight && (
                  <div className="bg-surfaceMuted text-text p-6 rounded-2xl mb-5 border border-border">
                    <h4 className="text-2xl font-bold mb-4 flex items-center gap-2">
                      <FontAwesomeIcon icon={faLightbulb} />
                      Consumer Insight
                    </h4>
                    <div className="space-y-4">
                      <div className="bg-white p-4 rounded-lg border border-border">
                        <strong className="block mb-2 text-lg flex items-center gap-2">
                          <FontAwesomeIcon icon={faThumbtack} />
                          People want:
                        </strong>
                        <p>{summaryData.insight.people_want}</p>
                      </div>
                      <div className="bg-white p-4 rounded-lg border border-border">
                        <strong className="block mb-2 text-lg flex items-center gap-2">
                          <FontAwesomeIcon icon={faTriangleExclamation} />
                          But:
                        </strong>
                        <p>{summaryData.insight.but}</p>
                      </div>
                      <div className="bg-white p-4 rounded-lg border border-border">
                        <strong className="block mb-2 text-lg flex items-center gap-2">
                          <FontAwesomeIcon icon={faCheckCircle} />
                          So they:
                        </strong>
                        <p>{summaryData.insight.so_they}</p>
                      </div>
                      <div className="bg-white p-5 rounded-lg mt-5 border border-border">
                        <strong className="block mb-2 text-lg flex items-center gap-2">
                          <FontAwesomeIcon icon={faCommentDots} />
                          Full Insight:
                        </strong>
                        <p className="text-lg leading-relaxed">{summaryData.insight.full_insight}</p>
                      </div>
                    </div>
                  </div>
                )}

                {/* Action Buttons */}
                <div className="flex flex-wrap gap-3">
                  <button
                    onClick={saveResults}
                    className="flex-1 min-w-[180px] bg-primary text-white py-3 rounded-xl font-semibold transition-all shadow-soft hover:bg-[#166FE5]"
                  >
                    <FontAwesomeIcon icon={faFloppyDisk} className="mr-2" />
                    บันทึกผลลัพธ์ (JSON)
                  </button>
                  <button
                    onClick={exportCSV}
                    className="flex-1 min-w-[180px] bg-white text-primary py-3 rounded-xl font-semibold transition-all border border-border hover:bg-surfaceMuted"
                  >
                    <FontAwesomeIcon icon={faChartBar} className="mr-2" />
                    Export ตาราง (CSV)
                  </button>
                  <button
                    onClick={handleRestart}
                    className="flex-1 min-w-[180px] bg-white text-danger py-3 rounded-xl font-semibold transition-all border border-border hover:bg-surfaceMuted"
                  >
                    <FontAwesomeIcon icon={faRotate} className="mr-2" />
                    เริ่มใหม่
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
