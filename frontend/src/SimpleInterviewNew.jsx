import React, { useState, useEffect, useRef } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import Swal from 'sweetalert2';

function SimpleInterview({ onNavigateToConfig }) {
  // State management
  const [currentView, setCurrentView] = useState('setup'); // 'setup', 'interview', 'summary'
  const [topic, setTopic] = useState('น้ำยาล้างจาน');
  const [brand, setBrand] = useState('');
  const [maxQuestions, setMaxQuestions] = useState(10);
  const [conversationHistory, setConversationHistory] = useState([]);
  const [currentTurn, setCurrentTurn] = useState(1);
  const [currentQuestion, setCurrentQuestion] = useState('');
  const [answerInput, setAnswerInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [analysisResult, setAnalysisResult] = useState(null);
  const [showAnalysis, setShowAnalysis] = useState(false);
  const [sessionId, setSessionId] = useState(null);
  
  // Voice features state
  const [isRecording, setIsRecording] = useState(false);
  const [isTTSEnabled, setIsTTSEnabled] = useState(true);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const recognitionRef = useRef(null);
  const synthRef = useRef(null);
  const currentUtteranceRef = useRef(null);
  
  // Insights tracking (instead of codes)
  const [insights, setInsights] = useState([]);
  
  // Summary data
  const [summaryData, setSummaryData] = useState({
    totalQuestions: 0,
    totalInsights: 0,
    avgConfidence: 0,
    insight: null,
    allInsights: [],
    detailedInsights: []
  });

  // API Base URL - Support environment variable for production
  const API_BASE = import.meta.env.VITE_API_BASE || 'http://localhost:8001';

  // Initialize Speech Recognition
  useEffect(() => {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    
    if (SpeechRecognition) {
      const recognition = new SpeechRecognition();
      recognition.continuous = false;
      recognition.interimResults = false;
      recognition.lang = 'th-TH'; // Thai language
      
      recognition.onstart = () => {
        setIsRecording(true);
        console.log('🎤 Speech recognition started');
      };
      
      recognition.onresult = (event) => {
        const transcript = event.results[0][0].transcript;
        setAnswerInput(prev => prev ? `${prev} ${transcript}` : transcript);
        console.log('🎤 Recognized:', transcript);
      };
      
      recognition.onerror = (event) => {
        console.error('🎤 Speech recognition error:', event.error);
        setIsRecording(false);
        if (event.error === 'no-speech') {
          Swal.fire({
            icon: 'info',
            title: 'ไม่พบเสียง',
            text: 'กรุณาพูดอีกครั้ง',
            timer: 2000,
            showConfirmButton: false
          });
        } else if (event.error === 'not-allowed') {
          Swal.fire({
            icon: 'error',
            title: 'ไม่อนุญาตให้ใช้ไมโครโฟน',
            text: 'กรุณาอนุญาตให้ใช้งานไมโครโฟนในเบราว์เซอร์',
            confirmButtonText: 'ตกลง'
          });
        }
      };
      
      recognition.onend = () => {
        setIsRecording(false);
        console.log('🎤 Speech recognition ended');
      };
      
      recognitionRef.current = recognition;
    } else {
      console.warn('⚠️ Speech Recognition API not supported in this browser');
    }

    // Initialize Speech Synthesis
    if ('speechSynthesis' in window) {
      synthRef.current = window.speechSynthesis;
      
      // Load voices if not already loaded
      const loadVoices = () => {
        const voices = synthRef.current.getVoices();
        console.log('🔊 Loaded voices:', voices.length);
        const thaiVoices = voices.filter(v => 
          v.lang.startsWith('th') || v.name.toLowerCase().includes('thai')
        );
        if (thaiVoices.length > 0) {
          console.log('✅ Thai voices found:', thaiVoices.map(v => v.name));
        } else {
          console.warn('⚠️ No Thai voices found, using default voice');
        }
      };
      
      // Chrome loads voices asynchronously
      if (synthRef.current.onvoiceschanged !== undefined) {
        synthRef.current.onvoiceschanged = loadVoices;
      }
      
      // Try loading immediately (some browsers load synchronously)
      loadVoices();
    } else {
      console.warn('⚠️ Speech Synthesis API not supported in this browser');
    }

    // Cleanup
    return () => {
      if (recognitionRef.current) {
        recognitionRef.current.stop();
      }
      if (synthRef.current) {
        synthRef.current.cancel();
      }
    };
  }, []);

  // Detect gender from text based on ending words
  const detectGenderFromText = (text) => {
    if (!text) return 'female'; // default to female
    
    // Check for female indicators (คะ, ค่ะ, นะคะ, นะค่ะ)
    if (/คะ|ค่ะ|นะคะ|นะค่ะ/.test(text)) {
      return 'female';
    }
    
    // Check for male indicators (ครับ, นะครับ, ครับผม)
    if (/ครับ|นะครับ|ครับผม/.test(text)) {
      return 'male';
    }
    
    // Default to female if no indicator found
    return 'female';
  };

  // Find appropriate voice based on gender
  const findVoiceByGender = (voices, gender) => {
    // First, get all Thai voices
    const thaiVoices = voices.filter(voice => 
      voice.lang.startsWith('th') || 
      voice.name.toLowerCase().includes('thai')
    );
    
    if (thaiVoices.length === 0) {
      return null;
    }
    
    // Try to find voice by gender
    if (gender === 'female') {
      // Look for female voices (common patterns: female, woman, f, etc.)
      const femaleVoice = thaiVoices.find(voice => {
        const name = voice.name.toLowerCase();
        return name.includes('female') || 
               name.includes('woman') || 
               name.includes(' f ') ||
               (voice.gender && voice.gender === 'female');
      });
      if (femaleVoice) return femaleVoice;
      
      // If no specific female voice, use first Thai voice with higher pitch
      return thaiVoices[0];
    } else {
      // Look for male voices
      const maleVoice = thaiVoices.find(voice => {
        const name = voice.name.toLowerCase();
        return name.includes('male') || 
               name.includes('man') || 
               name.includes(' m ') ||
               (voice.gender && voice.gender === 'male');
      });
      if (maleVoice) return maleVoice;
      
      // If no specific male voice, use first Thai voice with lower pitch
      return thaiVoices[0];
    }
  };

  // Speak text using TTS
  const speakText = (text, force = false) => {
    // If TTS is disabled and this is not a forced (manual) request, skip
    if ((!isTTSEnabled && !force) || !synthRef.current || !text) return;
    
    // Cancel any ongoing speech
    synthRef.current.cancel();
    setIsSpeaking(false);
    
    // Detect gender from text
    const gender = detectGenderFromText(text);
    
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = 'th-TH'; // Thai language
    utterance.rate = 1.0;
    
    // Adjust pitch based on gender
    // Female: higher pitch (1.1-1.2), Male: lower pitch (0.9-1.0)
    utterance.pitch = gender === 'female' ? 1.15 : 0.95;
    utterance.volume = 1.0;
    
    // Track speaking state
    utterance.onstart = () => {
      setIsSpeaking(true);
    };
    
    utterance.onend = () => {
      setIsSpeaking(false);
      currentUtteranceRef.current = null;
    };
    
    utterance.onerror = () => {
      setIsSpeaking(false);
      currentUtteranceRef.current = null;
    };
    
    currentUtteranceRef.current = utterance;
    
    // Try to find Thai voice with appropriate gender
    // Wait for voices to load if needed
    const getVoices = () => {
      return synthRef.current.getVoices();
    };
    
    const selectAndSpeak = () => {
      const voices = getVoices();
      const selectedVoice = findVoiceByGender(voices, gender);
      
      if (selectedVoice) {
        utterance.voice = selectedVoice;
        console.log(`🔊 Using ${gender} voice: ${selectedVoice.name}`);
      } else {
        console.log(`⚠️ No specific ${gender} voice found, using default Thai voice`);
      }
      
      synthRef.current.speak(utterance);
    };
    
    let voices = getVoices();
    // If voices aren't loaded yet, wait a bit
    if (voices.length === 0) {
      setTimeout(() => {
        selectAndSpeak();
      }, 100);
    } else {
      selectAndSpeak();
    }
  };

  // Start/Stop voice recording
  const toggleRecording = () => {
    if (!recognitionRef.current) {
      Swal.fire({
        icon: 'error',
        title: 'ไม่รองรับ',
        text: 'เบราว์เซอร์ของคุณไม่รองรับการบันทึกเสียง',
        confirmButtonText: 'ตกลง'
      });
      return;
    }

    if (isRecording) {
      recognitionRef.current.stop();
      setIsRecording(false);
    } else {
      try {
        recognitionRef.current.start();
      } catch (error) {
        console.error('Error starting recognition:', error);
        Swal.fire({
          icon: 'error',
          title: 'เกิดข้อผิดพลาด',
          text: 'ไม่สามารถเริ่มบันทึกเสียงได้',
          confirmButtonText: 'ตกลง'
        });
      }
    }
  };

  // Stop any ongoing speech
  const stopSpeech = () => {
    if (synthRef.current) {
      synthRef.current.cancel();
      setIsSpeaking(false);
      currentUtteranceRef.current = null;
    }
  };

  // Handle unified voice button click
  const handleVoiceButtonClick = () => {
    // Check if currently speaking - กดครั้งที่ 2: หยุดและปิดเสียง
    if (isSpeaking || (synthRef.current && synthRef.current.speaking)) {
      // Stop speaking and disable TTS
      stopSpeech();
      setIsTTSEnabled(false);
      return;
    }
    
    // If TTS is disabled - เปิดเสียงและอ่าน
    if (!isTTSEnabled) {
      setIsTTSEnabled(true);
      // Wait a bit then speak
      setTimeout(() => {
        if (currentQuestion) {
          speakText(currentQuestion, true);
        }
      }, 100);
      return;
    }
    
    // TTS is enabled and not speaking - กดครั้งที่ 1: อ่านคำถาม
    if (currentQuestion) {
      speakText(currentQuestion, true);
    }
  };

  const startInterview = async () => {
    // Combine topic and brand for the interview topic
    const interviewTopic = brand ? `${topic} ${brand}`.trim() : topic;
    console.log('🚀 Starting interview...', { topic, brand, interviewTopic, maxQuestions });

    try {
      const response = await fetch(`${API_BASE}/api/start`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ topic: interviewTopic, max_questions: maxQuestions })
      });

      const data = await response.json();
      console.log('✅ Interview started:', data);

      setSessionId(data.session_id);
      setCurrentView('interview');
      setCurrentTurn(1);
      setCurrentQuestion(data.question);
      setInsights([]);
      setConversationHistory([{ type: 'ai', text: data.question }]);
      
      // Speak the first question if TTS is enabled
      if (data.question) {
        setTimeout(() => speakText(data.question), 500);
      }
    } catch (error) {
      console.error('❌ Error starting interview:', error);
      Swal.fire({
        icon: 'error',
        title: 'เกิดข้อผิดพลาด',
        text: 'เกิดข้อผิดพลาดในการเริ่มสัมภาษณ์: ' + error.message,
        confirmButtonText: 'ตกลง'
      });
    }
  };

  const submitAnswer = async () => {
    if (!answerInput.trim()) {
      Swal.fire({
        icon: 'warning',
        title: 'คำเตือน',
        text: 'กรุณาใส่คำตอบ',
        confirmButtonText: 'ตกลง'
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
      console.log('📊 Analysis result:', data);

      // Update conversation history
      setConversationHistory(prev => [
        ...prev,
        { type: 'user', text: answerInput },
        { type: 'ai', text: data.next_question || '' }
      ]);

      // Update analysis result (ซ่อนจากผู้ใช้)
      if (data.analysis && data.analysis.insights) {
        setAnalysisResult(data.analysis);
        setShowAnalysis(false); // ซ่อน Insights

        // Update insights (เก็บไว้ใช้แต่ไม่แสดง)
        setInsights(prev => [
          ...prev,
          ...data.analysis.insights.map(insight => ({
            ...insight,
            question: currentQuestion,
            turn: currentTurn
          }))
        ]);
      }

      setIsLoading(false);

      // Check if interview is complete
      if (data.is_complete || currentTurn >= maxQuestions) {
        setTimeout(() => {
          showSummaryView();
        }, 1500);
      } else {
        // Move to next question
        setTimeout(() => {
          setCurrentTurn(currentTurn + 1);
          setCurrentQuestion(data.next_question);
          setAnswerInput('');
          setShowAnalysis(false);
          
          // Speak the next question if TTS is enabled
          if (data.next_question) {
            setTimeout(() => speakText(data.next_question), 500);
          }
        }, 1500);
      }
    } catch (error) {
      console.error('❌ Error submitting answer:', error);
      setIsLoading(false);
      Swal.fire({
        icon: 'error',
        title: 'เกิดข้อผิดพลาด',
        text: 'เกิดข้อผิดพลาด: ' + error.message,
        confirmButtonText: 'ตกลง'
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
        totalInsights: summary.total_insights || insights.length,
        avgConfidence: summary.avg_confidence || 0,
        insight: null,
        allInsights: summary.all_insights || [],
        detailedInsights: summary.detailed_insights || []
      });

      // Load insight
      loadInsight();
    } catch (error) {
      console.error('❌ Error loading summary:', error);
      // Fallback to local data
      setSummaryData({
        totalQuestions: currentTurn,
        totalInsights: insights.length,
        avgConfidence: 85,
        insight: null,
        allInsights: insights,
        detailedInsights: []
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
          summary: insight.summary || '',
          key_themes: insight.key_themes || [],
          detailed_insights: insight.detailed_insights || '',
          representative_quotes: insight.representative_quotes || []
        }
      }));
    } catch (error) {
      console.error('❌ Error loading insight:', error);
      // Set fallback insight
      setSummaryData(prev => ({
        ...prev,
        insight: {
          summary: `สรุป insights จากการสัมภาษณ์เกี่ยวกับ ${prev.topic || topic}`,
          key_themes: insights.slice(0, 5).map(i => i.key_point || '').filter(Boolean),
          detailed_insights: insights.map(i => i.key_point).filter(Boolean).join('. '),
          representative_quotes: insights.slice(0, 3).map(i => i.quote || '').filter(Boolean)
        }
      }));
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
      Swal.fire({
        icon: 'success',
        title: 'สำเร็จ!',
        html: `${data.message}<br><strong>ไฟล์:</strong> ${data.filename}`,
        confirmButtonText: 'ตกลง'
      });
    } catch (error) {
      console.error('❌ Error saving results:', error);
      Swal.fire({
        icon: 'error',
        title: 'เกิดข้อผิดพลาด',
        text: 'เกิดข้อผิดพลาดในการบันทึก: ' + error.message,
        confirmButtonText: 'ตกลง'
      });
    }
  };

  const exportCSV = async () => {
    try {
      const response = await fetch(`${API_BASE}/api/summary/${sessionId}`);
      const summary = await response.json();

      let csv = '\uFEFF';
      csv += 'ลำดับ,Key Point,Quote,Confidence\n';

      (summary.all_insights || []).forEach((insight, index) => {
        const keyPoint = (insight.key_point || '').replace(/"/g, '""');
        const quote = (insight.quote || '').replace(/"/g, '""');
        const confidence = insight.confidence ? Math.round(insight.confidence * 100) : '';
        csv += `"${index + 1}","${keyPoint}","${quote}","${confidence}"\n`;
      });

      const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `interview_insights_${sessionId}.csv`;
      link.click();

      Swal.fire({
        icon: 'success',
        title: 'สำเร็จ!',
        text: 'Export Insights เป็น CSV สำเร็จ!',
        confirmButtonText: 'ตกลง',
        timer: 2000,
        timerProgressBar: true
      });
    } catch (error) {
      console.error('❌ Error exporting CSV:', error);
      Swal.fire({
        icon: 'error',
        title: 'เกิดข้อผิดพลาด',
        text: 'เกิดข้อผิดพลาด: ' + error.message,
        confirmButtonText: 'ตกลง'
      });
    }
  };

  return (
    <div className="min-h-screen" style={{ fontFamily: "'Kanit', sans-serif", background: 'linear-gradient(135deg, #f8f9fa 0%, #ffffff 100%)' }}>
      <div className="max-w-3xl mx-auto px-4 py-8">
        {/* Header - Mentimeter Style */}
        <div className="mb-8 flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold mb-1" style={{ fontFamily: "'Kanit', sans-serif", background: 'linear-gradient(135deg, #6C5CE7 0%, #0984E3 100%)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text' }}>AI Interview</h1>
          </div>
          <button
            onClick={() => onNavigateToConfig && onNavigateToConfig()}
            className="px-4 py-2 text-sm rounded-xl transition-all flex items-center gap-2 border-2 hover:shadow-md"
            style={{ 
              fontFamily: "'Kanit', sans-serif",
              color: '#6C5CE7',
              borderColor: '#e2e8f0',
              background: 'white'
            }}
            onMouseEnter={(e) => {
              e.target.style.borderColor = '#6C5CE7';
              e.target.style.background = '#f5f3ff';
            }}
            onMouseLeave={(e) => {
              e.target.style.borderColor = '#e2e8f0';
              e.target.style.background = 'white';
            }}
          >
            <FontAwesomeIcon icon="fa-solid fa-gear" className="text-sm" />
            <span>ตั้งค่า</span>
          </button>
        </div>

        {/* Setup Form - Mentimeter Style */}
        {currentView === 'setup' && (
          <div className="bg-white rounded-2xl shadow-mentimeter p-8 border border-gray-200">
            <div className="mb-8">
              <h2 className="text-2xl font-bold mb-2" style={{ fontFamily: "'Kanit', sans-serif", color: '#1e293b' }}>ตั้งค่าการสัมภาษณ์</h2>
              <p className="text-sm" style={{ fontFamily: "'Kanit', sans-serif", color: '#64748b' }}>กรอกข้อมูลเพื่อเริ่มการสัมภาษณ์</p>
            </div>
            
            <div className="space-y-6">
              <div>
                <label className="block text-sm font-semibold mb-2" style={{ fontFamily: "'Kanit', sans-serif", color: '#1e293b' }}>
                  หัวข้อ <span style={{ color: '#D63031' }}>*</span>
                </label>
                <input
                  type="text"
                  value={topic}
                  onChange={(e) => setTopic(e.target.value)}
                  placeholder="เช่น น้ำยาล้างจาน, แชมพู, สบู่"
                  className="w-full px-4 py-3 rounded-xl text-base focus:outline-none transition-all border-2"
                  style={{ 
                    fontFamily: "'Kanit', sans-serif",
                    borderColor: '#e2e8f0',
                    color: '#1e293b',
                    background: 'white'
                  }}
                  onFocus={(e) => {
                    e.target.style.borderColor = '#6C5CE7';
                    e.target.style.boxShadow = '0 0 0 3px rgba(108, 92, 231, 0.1)';
                  }}
                  onBlur={(e) => {
                    e.target.style.borderColor = '#e2e8f0';
                    e.target.style.boxShadow = 'none';
                  }}
                />
                <p className="mt-1 text-xs" style={{ fontFamily: "'Kanit', sans-serif", color: '#64748b' }}>ประเภทผลิตภัณฑ์หรือหัวข้อหลัก</p>
              </div>

              <div>
                <label className="block text-sm font-semibold mb-2" style={{ fontFamily: "'Kanit', sans-serif", color: '#1e293b' }}>
                  แบรนด์ <span style={{ color: '#64748b', fontWeight: 'normal' }}>(ไม่บังคับ)</span>
                </label>
                <input
                  type="text"
                  value={brand}
                  onChange={(e) => setBrand(e.target.value)}
                  placeholder="เช่น LiponF, Sunlight, Clear"
                  className="w-full px-4 py-3 rounded-xl text-base focus:outline-none transition-all border-2"
                  style={{ 
                    fontFamily: "'Kanit', sans-serif",
                    borderColor: '#e2e8f0',
                    color: '#1e293b',
                    background: 'white'
                  }}
                  onFocus={(e) => {
                    e.target.style.borderColor = '#6C5CE7';
                    e.target.style.boxShadow = '0 0 0 3px rgba(108, 92, 231, 0.1)';
                  }}
                  onBlur={(e) => {
                    e.target.style.borderColor = '#e2e8f0';
                    e.target.style.boxShadow = 'none';
                  }}
                />
                <p className="mt-1 text-xs" style={{ fontFamily: "'Kanit', sans-serif", color: '#64748b' }}>ระบุแบรนด์ที่ต้องการถาม (ถ้ามี)</p>
              </div>

              <div>
                <label className="block text-sm font-semibold mb-2" style={{ fontFamily: "'Kanit', sans-serif", color: '#1e293b' }}>
                  จำนวนคำถามสูงสุด
                </label>
                <input
                  type="number"
                  value={maxQuestions}
                  onChange={(e) => setMaxQuestions(parseInt(e.target.value))}
                  min="3"
                  max="20"
                  className="w-full px-4 py-3 rounded-xl text-base focus:outline-none transition-all border-2"
                  style={{ 
                    fontFamily: "'Kanit', sans-serif",
                    borderColor: '#e2e8f0',
                    color: '#1e293b',
                    background: 'white'
                  }}
                  onFocus={(e) => {
                    e.target.style.borderColor = '#6C5CE7';
                    e.target.style.boxShadow = '0 0 0 3px rgba(108, 92, 231, 0.1)';
                  }}
                  onBlur={(e) => {
                    e.target.style.borderColor = '#e2e8f0';
                    e.target.style.boxShadow = 'none';
                  }}
                />
                <p className="mt-1 text-xs" style={{ fontFamily: "'Kanit', sans-serif", color: '#64748b' }}>แนะนำ: 10-15 คำถาม</p>
              </div>

              <div className="pt-4 border-t" style={{ borderColor: '#e2e8f0' }}>
                <button
                  onClick={startInterview}
                  disabled={!topic.trim()}
                  className="w-full text-white py-4 rounded-xl text-base font-semibold transition-all shadow-mentimeter disabled:opacity-50 disabled:cursor-not-allowed"
                  style={{ 
                    fontFamily: "'Kanit', sans-serif",
                    background: !topic.trim() ? '#cbd5e1' : 'linear-gradient(135deg, #6C5CE7 0%, #0984E3 100%)'
                  }}
                  onMouseEnter={(e) => {
                    if (topic.trim()) {
                      e.target.style.transform = 'translateY(-2px)';
                      e.target.style.boxShadow = '0 12px 28px 0 rgba(108, 92, 231, 0.25)';
                    }
                  }}
                  onMouseLeave={(e) => {
                    e.target.style.transform = 'translateY(0)';
                    e.target.style.boxShadow = '0 8px 24px 0 rgba(108, 92, 231, 0.15), 0 4px 8px 0 rgba(0, 0, 0, 0.08)';
                  }}
                >
                  เริ่มการสัมภาษณ์
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Interview Section - Mentimeter Style */}
        {currentView === 'interview' && (
          <div className="bg-white rounded-2xl shadow-mentimeter p-8 border border-gray-200">
            {/* Progress Indicator */}
            <div className="mb-8 pb-6 border-b" style={{ borderColor: '#e2e8f0' }}>
              <div className="flex items-center justify-between text-sm mb-3" style={{ fontFamily: "'Kanit', sans-serif", color: '#1e293b' }}>
                <span className="font-semibold">คำถามที่ {currentTurn}</span>
                <span style={{ color: '#64748b' }}>{currentTurn} / {maxQuestions}</span>
              </div>
              <div className="w-full h-4 rounded-full overflow-hidden" style={{ background: '#f1f5f9' }}>
                <div
                  className="h-full transition-all duration-500 rounded-full"
                  style={{ 
                    width: `${(currentTurn / maxQuestions) * 100}%`,
                    background: 'linear-gradient(90deg, #6C5CE7 0%, #0984E3 100%)'
                  }}
                />
              </div>
            </div>

            {/* Previous Q&A History - Hidden as per requirement */}

            {/* Current Question - Mentimeter Style */}
            {currentQuestion && (
              <div className="mb-8 p-6 rounded-xl" style={{ background: 'linear-gradient(135deg, #f5f3ff 0%, #e0e7ff 100%)', border: '1px solid #e2e8f0' }}>
                <div className="flex items-start justify-between gap-4">
                  <p className="text-xl font-semibold leading-relaxed flex-1" style={{ fontFamily: "'Kanit', sans-serif", color: '#1e293b' }}>
                    {currentQuestion}
                  </p>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={handleVoiceButtonClick}
                      className={`p-3 rounded-xl transition-all border-2 ${
                        isSpeaking
                          ? 'text-white border-red-400 animate-pulse'
                          : isTTSEnabled
                          ? 'text-white border-transparent'
                          : 'text-gray-400 border-gray-300'
                      }`}
                      style={{
                        background: isSpeaking 
                          ? 'linear-gradient(135deg, #D63031 0%, #c92a2a 100%)'
                          : isTTSEnabled
                          ? 'linear-gradient(135deg, #6C5CE7 0%, #0984E3 100%)'
                          : '#f1f5f9'
                      }}
                      title={
                        isSpeaking
                          ? 'กดเพื่อหยุดและปิดเสียง'
                          : isTTSEnabled
                          ? 'กดเพื่ออ่านคำถาม (กดอีกครั้งเพื่อปิดเสียง)'
                          : 'กดเพื่อเปิดเสียง AI และอ่านคำถาม'
                      }
                    >
                      <FontAwesomeIcon 
                        icon={
                          isSpeaking
                            ? "fa-solid fa-stop"
                            : isTTSEnabled
                            ? "fa-solid fa-volume-high"
                            : "fa-solid fa-volume-mute"
                        } 
                        className="text-lg" 
                      />
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* Answer Input - Mentimeter Style */}
            <div className="mb-6">
              <label className="block text-sm font-semibold mb-2" style={{ fontFamily: "'Kanit', sans-serif", color: '#1e293b' }}>
                คำตอบของคุณ
              </label>
              <div className="relative">
                <textarea
                  value={answerInput}
                  onChange={(e) => setAnswerInput(e.target.value)}
                  onKeyDown={handleKeyDown}
                  placeholder="พิมพ์คำตอบของคุณ หรือกดปุ่มไมโครโฟนเพื่อบันทึกเสียง..."
                  disabled={isLoading || isRecording}
                  className="w-full px-4 py-4 pr-14 rounded-xl text-base resize-y min-h-[140px] focus:outline-none transition-all border-2 disabled:bg-gray-50 disabled:cursor-not-allowed"
                  style={{ 
                    fontFamily: "'Kanit', sans-serif",
                    borderColor: '#e2e8f0',
                    color: '#1e293b',
                    background: 'white'
                  }}
                  onFocus={(e) => {
                    e.target.style.borderColor = '#6C5CE7';
                    e.target.style.boxShadow = '0 0 0 3px rgba(108, 92, 231, 0.1)';
                  }}
                  onBlur={(e) => {
                    e.target.style.borderColor = '#e2e8f0';
                    e.target.style.boxShadow = 'none';
                  }}
                />
                <button
                  type="button"
                  onClick={toggleRecording}
                  disabled={isLoading}
                  className={`absolute right-3 bottom-3 p-3 rounded-full transition-all shadow-md disabled:opacity-50 disabled:cursor-not-allowed ${
                    isRecording ? 'animate-pulse' : ''
                  }`}
                  style={{
                    background: isRecording 
                      ? 'linear-gradient(135deg, #D63031 0%, #c92a2a 100%)'
                      : 'linear-gradient(135deg, #6C5CE7 0%, #0984E3 100%)',
                    color: 'white',
                    border: 'none'
                  }}
                  title={isRecording ? 'กดเพื่อหยุดบันทึก' : 'กดเพื่อเริ่มบันทึกเสียง'}
                >
                  <FontAwesomeIcon 
                    icon={isRecording ? "fa-solid fa-stop" : "fa-solid fa-microphone"} 
                    className="text-lg" 
                  />
                </button>
                {isRecording && (
                  <div className="absolute right-3 top-3">
                    <span className="inline-flex items-center gap-1 px-3 py-1 text-xs font-semibold rounded-full border-2" style={{ fontFamily: "'Kanit', sans-serif", background: '#fee2e2', color: '#D63031', borderColor: '#fecaca' }}>
                      <span className="w-2 h-2 rounded-full animate-pulse" style={{ background: '#D63031' }}></span>
                      กำลังฟัง...
                    </span>
                  </div>
                )}
              </div>
              <p className="mt-2 text-xs" style={{ fontFamily: "'Kanit', sans-serif", color: '#64748b' }}>
                💡 คลิกปุ่มไมโครโฟนเพื่อบันทึกเสียง หรือพิมพ์คำตอบของคุณ
              </p>
            </div>

            {/* Submit Button - Mentimeter Style */}
            <button
              onClick={submitAnswer}
              disabled={isLoading || !answerInput.trim()}
              className="w-full text-white py-4 rounded-xl text-base font-semibold transition-all shadow-mentimeter disabled:opacity-50 disabled:cursor-not-allowed"
              style={{ 
                fontFamily: "'Kanit', sans-serif",
                background: (isLoading || !answerInput.trim()) 
                  ? '#cbd5e1' 
                  : 'linear-gradient(135deg, #6C5CE7 0%, #0984E3 100%)'
              }}
              onMouseEnter={(e) => {
                if (!isLoading && answerInput.trim()) {
                  e.target.style.transform = 'translateY(-2px)';
                  e.target.style.boxShadow = '0 12px 28px 0 rgba(108, 92, 231, 0.25)';
                }
              }}
              onMouseLeave={(e) => {
                e.target.style.transform = 'translateY(0)';
                e.target.style.boxShadow = '0 8px 24px 0 rgba(108, 92, 231, 0.15), 0 4px 8px 0 rgba(0, 0, 0, 0.08)';
              }}
            >
              {isLoading ? (
                <span className="flex items-center justify-center gap-2">
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                  กำลังประมวลผล...
                </span>
              ) : (
                'ส่งคำตอบ'
              )}
            </button>
          </div>
        )}

        {/* Summary Section - Mentimeter Style */}
        {currentView === 'summary' && (
          <div className="bg-white rounded-2xl shadow-mentimeter p-8 border border-gray-200">
            <div className="mb-8">
              <h2 className="text-2xl font-bold mb-2" style={{ fontFamily: "'Kanit', sans-serif", color: '#1e293b' }}>สรุปผลการสัมภาษณ์</h2>
            </div>
            
            <div className="grid grid-cols-3 gap-6 mb-8 pb-8 border-b" style={{ borderColor: '#e2e8f0' }}>
              <div className="text-center p-6 rounded-xl border-2" style={{ background: 'linear-gradient(135deg, #f5f3ff 0%, #e0e7ff 100%)', borderColor: '#e2e8f0' }}>
                <div className="text-4xl font-bold mb-2" style={{ fontFamily: "'Kanit', sans-serif", background: 'linear-gradient(135deg, #6C5CE7 0%, #0984E3 100%)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text' }}>{summaryData.totalQuestions}</div>
                <div className="text-sm font-semibold" style={{ fontFamily: "'Kanit', sans-serif", color: '#64748b' }}>จำนวนคำถาม</div>
              </div>
              <div className="text-center p-6 rounded-xl border-2" style={{ background: 'linear-gradient(135deg, #f5f3ff 0%, #e0e7ff 100%)', borderColor: '#e2e8f0' }}>
                <div className="text-4xl font-bold mb-2" style={{ fontFamily: "'Kanit', sans-serif", background: 'linear-gradient(135deg, #6C5CE7 0%, #0984E3 100%)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text' }}>{summaryData.totalInsights}</div>
                <div className="text-sm font-semibold" style={{ fontFamily: "'Kanit', sans-serif", color: '#64748b' }}>Insights</div>
              </div>
              <div className="text-center p-6 rounded-xl border-2" style={{ background: 'linear-gradient(135deg, #f5f3ff 0%, #e0e7ff 100%)', borderColor: '#e2e8f0' }}>
                <div className="text-4xl font-bold mb-2" style={{ fontFamily: "'Kanit', sans-serif", background: 'linear-gradient(135deg, #6C5CE7 0%, #0984E3 100%)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text' }}>{summaryData.avgConfidence}%</div>
                <div className="text-sm font-semibold" style={{ fontFamily: "'Kanit', sans-serif", color: '#64748b' }}>ความมั่นใจ</div>
              </div>
            </div>

            {/* Insights Table - Mentimeter Style */}
            {summaryData.allInsights && summaryData.allInsights.length > 0 && (
              <div className="mb-8">
                <h3 className="text-lg font-bold mb-4" style={{ fontFamily: "'Kanit', sans-serif", color: '#1e293b' }}>สรุป Insights</h3>
                <div className="overflow-x-auto border-2 rounded-xl" style={{ borderColor: '#e2e8f0' }}>
                  <table className="w-full">
                    <thead style={{ background: 'linear-gradient(135deg, #f5f3ff 0%, #e0e7ff 100%)' }}>
                      <tr>
                        <th className="px-4 py-3 text-left text-sm font-semibold border-b" style={{ fontFamily: "'Kanit', sans-serif", color: '#1e293b', borderColor: '#e2e8f0' }}>#</th>
                        <th className="px-4 py-3 text-left text-sm font-semibold border-b" style={{ fontFamily: "'Kanit', sans-serif", color: '#1e293b', borderColor: '#e2e8f0' }}>Key Point</th>
                        <th className="px-4 py-3 text-left text-sm font-semibold border-b" style={{ fontFamily: "'Kanit', sans-serif", color: '#1e293b', borderColor: '#e2e8f0' }}>Quote</th>
                      </tr>
                    </thead>
                    <tbody style={{ borderColor: '#e2e8f0' }}>
                      {summaryData.allInsights.map((insight, index) => (
                        <tr key={index} className="hover:bg-purple-50 transition-colors" style={{ borderBottom: '1px solid #e2e8f0' }}>
                          <td className="px-4 py-3 text-sm font-medium" style={{ fontFamily: "'Kanit', sans-serif", color: '#64748b' }}>{index + 1}</td>
                          <td className="px-4 py-3 text-sm font-medium" style={{ fontFamily: "'Kanit', sans-serif", color: '#1e293b' }}>{insight.key_point || 'ไม่มีประเด็น'}</td>
                          <td className="px-4 py-3 text-sm italic" style={{ fontFamily: "'Kanit', sans-serif", color: '#64748b' }}>"{insight.quote || ''}"</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {/* Detailed Insights - Mentimeter Style */}
            {summaryData.insight && (
              <div className="mb-8 space-y-6">
                {summaryData.insight.summary && (
                  <div className="p-6 rounded-xl" style={{ background: 'linear-gradient(135deg, #f5f3ff 0%, #e0e7ff 100%)', border: '1px solid #e2e8f0' }}>
                    <h3 className="text-lg font-bold mb-3" style={{ fontFamily: "'Kanit', sans-serif", color: '#1e293b' }}>สรุปภาพรวม</h3>
                    <p className="text-base leading-relaxed" style={{ fontFamily: "'Kanit', sans-serif", color: '#334155' }}>{summaryData.insight.summary}</p>
                  </div>
                )}
                {summaryData.insight.key_themes && summaryData.insight.key_themes.length > 0 && (
                  <div className="p-6 rounded-xl" style={{ background: 'linear-gradient(135deg, #f5f3ff 0%, #e0e7ff 100%)', border: '1px solid #e2e8f0' }}>
                    <h3 className="text-lg font-bold mb-3" style={{ fontFamily: "'Kanit', sans-serif", color: '#1e293b' }}>ธีมหลัก</h3>
                    <ul className="space-y-2">
                      {summaryData.insight.key_themes.map((theme, idx) => (
                        <li key={idx} className="text-base flex items-start" style={{ fontFamily: "'Kanit', sans-serif", color: '#334155' }}>
                          <span className="mr-2 font-bold" style={{ color: '#6C5CE7' }}>•</span>
                          <span>{theme}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
                {summaryData.insight.detailed_insights && (
                  <div className="p-6 rounded-xl" style={{ background: 'linear-gradient(135deg, #f5f3ff 0%, #e0e7ff 100%)', border: '1px solid #e2e8f0' }}>
                    <h3 className="text-lg font-bold mb-3" style={{ fontFamily: "'Kanit', sans-serif", color: '#1e293b' }}>รายละเอียด</h3>
                    <p className="text-base leading-relaxed whitespace-pre-line" style={{ fontFamily: "'Kanit', sans-serif", color: '#334155' }}>
                      {summaryData.insight.detailed_insights}
                    </p>
                  </div>
                )}
                {summaryData.insight.representative_quotes && summaryData.insight.representative_quotes.length > 0 && (
                  <div className="p-6 rounded-xl" style={{ background: 'linear-gradient(135deg, #f5f3ff 0%, #e0e7ff 100%)', border: '1px solid #e2e8f0' }}>
                    <h3 className="text-lg font-bold mb-3" style={{ fontFamily: "'Kanit', sans-serif", color: '#1e293b' }}>คำพูดสำคัญ</h3>
                    <div className="space-y-3">
                      {summaryData.insight.representative_quotes.map((quote, idx) => (
                        <blockquote key={idx} className="pl-4 py-3 rounded-r italic" style={{ fontFamily: "'Kanit', sans-serif", color: '#334155', borderLeft: '4px solid #6C5CE7', background: 'white' }}>
                          "{quote}"
                        </blockquote>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Action Buttons - Mentimeter Style */}
            <div className="flex flex-wrap gap-3 pt-6 border-t" style={{ borderColor: '#e2e8f0' }}>
              <button
                onClick={saveResults}
                className="flex-1 text-white py-4 rounded-xl font-semibold transition-all shadow-mentimeter"
                style={{ 
                  fontFamily: "'Kanit', sans-serif",
                  background: 'linear-gradient(135deg, #6C5CE7 0%, #0984E3 100%)'
                }}
                onMouseEnter={(e) => {
                  e.target.style.transform = 'translateY(-2px)';
                  e.target.style.boxShadow = '0 12px 28px 0 rgba(108, 92, 231, 0.25)';
                }}
                onMouseLeave={(e) => {
                  e.target.style.transform = 'translateY(0)';
                  e.target.style.boxShadow = '0 8px 24px 0 rgba(108, 92, 231, 0.15), 0 4px 8px 0 rgba(0, 0, 0, 0.08)';
                }}
              >
                บันทึกผลลัพธ์
              </button>
              <button
                onClick={exportCSV}
                className="flex-1 text-white py-4 rounded-xl font-semibold transition-all shadow-mentimeter"
                style={{ 
                  fontFamily: "'Kanit', sans-serif",
                  background: 'linear-gradient(135deg, #1e293b 0%, #334155 100%)'
                }}
                onMouseEnter={(e) => {
                  e.target.style.transform = 'translateY(-2px)';
                  e.target.style.boxShadow = '0 12px 28px 0 rgba(30, 41, 59, 0.25)';
                }}
                onMouseLeave={(e) => {
                  e.target.style.transform = 'translateY(0)';
                  e.target.style.boxShadow = '0 8px 24px 0 rgba(30, 41, 59, 0.15), 0 4px 8px 0 rgba(0, 0, 0, 0.08)';
                }}
              >
                Export CSV
              </button>
              <button
                onClick={() => window.location.reload()}
                className="flex-1 py-4 rounded-xl font-semibold transition-all border-2"
                style={{ 
                  fontFamily: "'Kanit', sans-serif",
                  background: 'white',
                  color: '#1e293b',
                  borderColor: '#e2e8f0'
                }}
                onMouseEnter={(e) => {
                  e.target.style.background = '#f5f3ff';
                  e.target.style.borderColor = '#6C5CE7';
                }}
                onMouseLeave={(e) => {
                  e.target.style.background = 'white';
                  e.target.style.borderColor = '#e2e8f0';
                }}
              >
                เริ่มใหม่
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default SimpleInterview;

