import React, { useState, useEffect } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import Swal from 'sweetalert2';

function ConfigPage({ onNavigateToInterview }) {
  // API Base URL - Support environment variable for production
  const API_BASE = import.meta.env.VITE_API_BASE || 'http://localhost:7183';
  const [activeTab, setActiveTab] = useState('code-types');
  const [config, setConfig] = useState({
    code_types: {},
    question_generation_prompt: '',
    analysis_prompt: '',
    example_questions: {},
    model_settings: {
      model: 'gpt-4o',
      temperature_question: 0.7,
      temperature_analysis: 0.3
    }
  });
  const [sessionsList, setSessionsList] = useState([]);
  const [selectedSession, setSelectedSession] = useState(null);
  const [isLoadingSessions, setIsLoadingSessions] = useState(false);
  
  useEffect(() => {
    loadConfig();
    if (activeTab === 'history') {
      loadSessions();
    }
  }, [activeTab]);

  const loadConfig = async () => {
    try {
      const response = await fetch(`${API_BASE}/api/config`);
      const data = await response.json();
      console.log('✅ Config loaded:', data);
      setConfig(data);
    } catch (error) {
      console.error('❌ Error loading config:', error);
      Swal.fire({
        icon: 'error',
        title: 'เกิดข้อผิดพลาด',
        text: 'ไม่สามารถโหลด config ได้: ' + error.message,
        confirmButtonText: 'ตกลง'
      });
    }
  };

  const saveToServer = async (updates) => {
    try {
      const response = await fetch(`${API_BASE}/api/config`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updates)
      });

      if (response.ok) {
        Swal.fire({
          icon: 'success',
          title: 'สำเร็จ!',
          text: 'บันทึกสำเร็จ',
          confirmButtonText: 'ตกลง',
          timer: 1000,
          timerProgressBar: true
        });
        await loadConfig();
      } else {
        Swal.fire({
          icon: 'error',
          title: 'เกิดข้อผิดพลาด',
          text: 'บันทึกไม่สำเร็จ',
          confirmButtonText: 'ตกลง'
        });
      }
    } catch (error) {
      Swal.fire({
        icon: 'error',
        title: 'เกิดข้อผิดพลาด',
        text: 'เกิดข้อผิดพลาด: ' + error.message,
        confirmButtonText: 'ตกลง'
      });
    }
  };

  const saveCodeTypes = async () => {
    await saveToServer({ code_types: config.code_types });
  };

  const saveQuestionPrompt = async () => {
    await saveToServer({ question_generation_prompt: config.question_generation_prompt });
  };

  const saveAnalysisPrompt = async () => {
    await saveToServer({ analysis_prompt: config.analysis_prompt });
  };

  const saveExamples = async () => {
    await saveToServer({ example_questions: config.example_questions });
  };

  const saveModelSettings = async () => {
    await saveToServer({ model_settings: config.model_settings });
  };

  const exportConfig = async () => {
    try {
      const response = await fetch(`${API_BASE}/api/config/export`);
      const blob = await response.blob();
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = 'interviewer_config.json';
      link.click();
      Swal.fire({
        icon: 'success',
        title: 'สำเร็จ!',
        text: 'Export สำเร็จ!',
        confirmButtonText: 'ตกลง',
        timer: 1000,
        timerProgressBar: true
      });
    } catch (error) {
      Swal.fire({
        icon: 'error',
        title: 'เกิดข้อผิดพลาด',
        text: 'Export ไม่สำเร็จ: ' + error.message,
        confirmButtonText: 'ตกลง'
      });
    }
  };

  const importConfig = (event) => {
    const file = event.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = async (e) => {
      try {
        const importedConfig = JSON.parse(e.target.result);
        const response = await fetch(`${API_BASE}/api/config/import`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(importedConfig)
        });

        if (response.ok) {
          Swal.fire({
            icon: 'success',
            title: 'สำเร็จ!',
            text: 'Import สำเร็จ!',
            confirmButtonText: 'ตกลง',
            timer: 1000,
            timerProgressBar: true
          });
          await loadConfig();
        }
      } catch (error) {
        Swal.fire({
          icon: 'error',
          title: 'เกิดข้อผิดพลาด',
          text: 'Import ไม่สำเร็จ: ' + error.message,
          confirmButtonText: 'ตกลง'
        });
      }
    };
    reader.readAsText(file);
  };

  const resetToDefault = async () => {
    const result = await Swal.fire({
      icon: 'warning',
      title: 'ยืนยันการรีเซ็ต',
      text: 'คุณแน่ใจหรือไม่ที่จะรีเซ็ตเป็นค่าเริ่มต้น?',
      showCancelButton: true,
      confirmButtonText: 'ยืนยัน',
      cancelButtonText: 'ยกเลิก',
      confirmButtonColor: '#ef4444'
    });

    if (!result.isConfirmed) return;

    try {
      const response = await fetch(`${API_BASE}/api/config/reset`, { method: 'POST' });
      if (response.ok) {
        Swal.fire({
          icon: 'success',
          title: 'สำเร็จ!',
          text: 'รีเซ็ตสำเร็จ!',
          confirmButtonText: 'ตกลง',
          timer: 1000,
          timerProgressBar: true
        });
        await loadConfig();
      }
    } catch (error) {
      Swal.fire({
        icon: 'error',
        title: 'เกิดข้อผิดพลาด',
        text: 'เกิดข้อผิดพลาด: ' + error.message,
        confirmButtonText: 'ตกลง'
      });
    }
  };

  const resetQuestionPrompt = async () => {
    const result = await Swal.fire({
      icon: 'question',
      title: 'ยืนยันการรีเซ็ต',
      text: 'รีเซ็ต Prompt คำถามเป็นค่าเริ่มต้น?',
      showCancelButton: true,
      confirmButtonText: 'ยืนยัน',
      cancelButtonText: 'ยกเลิก'
    });

    if (!result.isConfirmed) return;

    try {
      const response = await fetch(`${API_BASE}/api/config/default/question_prompt`);
      const data = await response.json();
      setConfig(prev => ({ ...prev, question_generation_prompt: data.prompt }));
      Swal.fire({
        icon: 'success',
        title: 'สำเร็จ!',
        text: 'รีเซ็ตสำเร็จ!',
        confirmButtonText: 'ตกลง',
        timer: 1000,
        timerProgressBar: true
      });
    } catch (error) {
      Swal.fire({
        icon: 'error',
        title: 'เกิดข้อผิดพลาด',
        text: 'เกิดข้อผิดพลาด: ' + error.message,
        confirmButtonText: 'ตกลง'
      });
    }
  };

  const resetAnalysisPrompt = async () => {
    const result = await Swal.fire({
      icon: 'question',
      title: 'ยืนยันการรีเซ็ต',
      text: 'รีเซ็ต Prompt วิเคราะห์เป็นค่าเริ่มต้น?',
      showCancelButton: true,
      confirmButtonText: 'ยืนยัน',
      cancelButtonText: 'ยกเลิก'
    });

    if (!result.isConfirmed) return;

    try {
      const response = await fetch(`${API_BASE}/api/config/default/analysis_prompt`);
      const data = await response.json();
      setConfig(prev => ({ ...prev, analysis_prompt: data.prompt }));
      Swal.fire({
        icon: 'success',
        title: 'สำเร็จ!',
        text: 'รีเซ็ตสำเร็จ!',
        confirmButtonText: 'ตกลง',
        timer: 1000,
        timerProgressBar: true
      });
    } catch (error) {
      Swal.fire({
        icon: 'error',
        title: 'เกิดข้อผิดพลาด',
        text: 'เกิดข้อผิดพลาด: ' + error.message,
        confirmButtonText: 'ตกลง'
      });
    }
  };

  const addExampleQuestion = (type) => {
    setConfig(prev => ({
      ...prev,
      example_questions: {
        ...prev.example_questions,
        [type]: [...(prev.example_questions[type] || []), '']
      }
    }));
  };

  const removeExampleQuestion = (type, index) => {
    setConfig(prev => ({
      ...prev,
      example_questions: {
        ...prev.example_questions,
        [type]: prev.example_questions[type].filter((_, i) => i !== index)
      }
    }));
  };

  const updateExampleQuestion = (type, index, value) => {
    setConfig(prev => ({
      ...prev,
      example_questions: {
        ...prev.example_questions,
        [type]: prev.example_questions[type].map((q, i) => i === index ? value : q)
      }
    }));
  };

  const loadSessions = async () => {
    setIsLoadingSessions(true);
    try {
      const response = await fetch(`${API_BASE}/api/sessions`);
      const data = await response.json();
      console.log('✅ Sessions loaded:', data);
      setSessionsList(data.sessions || []);
    } catch (error) {
      console.error('❌ Error loading sessions:', error);
      Swal.fire({
        icon: 'error',
        title: 'เกิดข้อผิดพลาด',
        text: 'ไม่สามารถโหลดประวัติการสัมภาษณ์ได้: ' + error.message,
        confirmButtonText: 'ตกลง'
      });
    } finally {
      setIsLoadingSessions(false);
    }
  };

  const loadSessionDetails = async (sessionId) => {
    try {
      const response = await fetch(`${API_BASE}/api/sessions/${sessionId}`);
      const data = await response.json();
      console.log('✅ Session details loaded:', data);
      setSelectedSession(data);
    } catch (error) {
      console.error('❌ Error loading session details:', error);
      Swal.fire({
        icon: 'error',
        title: 'เกิดข้อผิดพลาด',
        text: 'ไม่สามารถโหลดรายละเอียดการสัมภาษณ์ได้: ' + error.message,
        confirmButtonText: 'ตกลง'
      });
    }
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'ไม่ระบุวันที่';
    const date = new Date(dateString);
    return new Intl.DateTimeFormat('th-TH', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    }).format(date);
  };

  const deleteSession = async (sessionId, event) => {
    if (event) {
      event.stopPropagation(); // Prevent triggering the parent onClick
    }
    
    if (!window.confirm('คุณแน่ใจหรือไม่ว่าต้องการลบประวัติการสัมภาษณ์นี้?')) {
      return;
    }
    
    try {
      const response = await fetch(`${API_BASE}/api/sessions/${sessionId}`, {
        method: 'DELETE'
      });
      
      if (!response.ok) {
        throw new Error('Failed to delete session');
      }
      
      // Reload sessions list
      await loadSessions();
      
      // If deleted session was selected, clear selection
      if (selectedSession && selectedSession.id === sessionId) {
        setSelectedSession(null);
      }
      
      alert('ลบประวัติการสัมภาษณ์สำเร็จ');
    } catch (error) {
      console.error('Error deleting session:', error);
      alert('เกิดข้อผิดพลาดในการลบประวัติการสัมภาษณ์');
    }
  };

  const exportSessionCSV = async (session) => {
    try {
      const response = await fetch(`${API_BASE}/api/sessions/${session.id}`);
      const sessionData = await response.json();

      let csv = '\uFEFF';
      csv += 'ลำดับ,คำถาม,คำตอบ,Key Point,Quote,Confidence\n';

      (sessionData.answers || []).forEach((qa, index) => {
        const question = (qa.question || '').replace(/"/g, '""');
        const answer = (qa.answer || '').replace(/"/g, '""');
        const insights = qa.analysis?.insights || [];
        
        if (insights.length > 0) {
          insights.forEach((insight, i) => {
            const keyPoint = (insight.key_point || '').replace(/"/g, '""');
            const quote = (insight.quote || '').replace(/"/g, '""');
            const confidence = insight.confidence ? Math.round(insight.confidence * 100) : '';
            csv += `"${index + 1}","${question}","${answer}","${keyPoint}","${quote}","${confidence}"\n`;
          });
        } else {
          csv += `"${index + 1}","${question}","${answer}","","",""\n`;
        }
      });

      const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `interview_${session.id}.csv`;
      link.click();

      Swal.fire({
        icon: 'success',
        title: 'สำเร็จ!',
        text: 'Export CSV สำเร็จ!',
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
      <div className="max-w-6xl mx-auto px-4 py-8">
        {/* Header - Mentimeter Style */}
        <div className="mb-8 flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold mb-1" style={{ fontFamily: "'Kanit', sans-serif", background: 'linear-gradient(135deg, #6C5CE7 0%, #0984E3 100%)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text' }}>การตั้งค่า</h1>
            <p className="text-sm mt-1" style={{ fontFamily: "'Kanit', sans-serif", color: '#64748b' }}>ปรับแต่งการทำงานของระบบ</p>
          </div>
          <button
            onClick={() => onNavigateToInterview && onNavigateToInterview()}
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
            <FontAwesomeIcon icon="fa-solid fa-arrow-left" className="text-sm" />
            <span>กลับหน้าสัมภาษณ์</span>
          </button>
        </div>

        <div className="space-y-6">
          {/* Tabs - Mentimeter Style */}
          <div className="bg-white rounded-2xl shadow-mentimeter p-2 mb-6 border border-gray-200">
            <div className="flex gap-2 flex-wrap">
              {[
                { id: 'question-prompt', label: 'Prompt คำถาม', icon: 'fa-solid fa-question' },
                { id: 'analysis-prompt', label: 'Prompt วิเคราะห์', icon: 'fa-solid fa-magnifying-glass' },
                { id: 'examples', label: 'ตัวอย่างคำถาม', icon: 'fa-solid fa-lightbulb' },
                { id: 'model', label: 'Model Settings', icon: 'fa-solid fa-robot' },
                { id: 'history', label: 'ประวัติการสัมภาษณ์', icon: 'fa-solid fa-clock-rotate-left' }
              ].map(tab => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`px-4 py-2 text-sm font-semibold transition-all rounded-xl flex items-center gap-2 ${
                    activeTab === tab.id
                      ? 'text-white shadow-md'
                      : 'text-gray-600 hover:text-gray-900'
                  }`}
                  style={{
                    fontFamily: "'Kanit', sans-serif",
                    background: activeTab === tab.id 
                      ? 'linear-gradient(135deg, #6C5CE7 0%, #0984E3 100%)'
                      : 'transparent'
                  }}
                  onMouseEnter={(e) => {
                    if (activeTab !== tab.id) {
                      e.target.style.background = '#f5f3ff';
                    }
                  }}
                  onMouseLeave={(e) => {
                    if (activeTab !== tab.id) {
                      e.target.style.background = 'transparent';
                    }
                  }}
                >
                  <FontAwesomeIcon icon={tab.icon} className="text-sm" />
                  <span>{tab.label}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Tab: Question Prompt - Mentimeter Style */}
          {activeTab === 'question-prompt' && (
            <div className="bg-white rounded-2xl shadow-mentimeter p-8 border border-gray-200">
              <div className="mb-6">
                <h3 className="text-xl font-bold mb-2" style={{ fontFamily: "'Kanit', sans-serif", color: '#1e293b' }}>Prompt Template สำหรับสร้างคำถาม</h3>
                <p className="text-sm" style={{ fontFamily: "'Kanit', sans-serif", color: '#64748b' }}>ปรับแต่ง prompt สำหรับการสร้างคำถามจาก AI</p>
              </div>
              
              <div className="mb-6 p-6 rounded-xl" style={{ background: 'linear-gradient(135deg, #f5f3ff 0%, #e0e7ff 100%)', border: '1px solid #e2e8f0' }}>
                <div className="flex items-start gap-3 mb-4">
                  <div className="flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center" style={{ background: 'linear-gradient(135deg, #6C5CE7 0%, #0984E3 100%)' }}>
                    <FontAwesomeIcon icon="fa-solid fa-info" className="text-white text-sm" />
                  </div>
                  <div>
                    <h4 className="font-semibold mb-2" style={{ fontFamily: "'Kanit', sans-serif", color: '#1e293b' }}>Natural Conversation Flow</h4>
                    <p className="text-sm leading-relaxed" style={{ fontFamily: "'Kanit', sans-serif", color: '#64748b' }}>
                      Prompt นี้จะใช้สำหรับสร้างคำถามถัดไปจากคำตอบของผู้ให้ข้อมูล ทำให้การสนทนาเป็นไปอย่างธรรมชาติ 
                      ไม่ใช่แบบสอบถามแบบเดิม AI จะวิเคราะห์คำตอบก่อนหน้านี้และสร้างคำถามที่เกี่ยวข้องและต่อเนื่อง
                    </p>
                  </div>
                </div>
                
                <div className="bg-white p-4 rounded-xl border-2" style={{ borderColor: '#e2e8f0' }}>
                  <div className="flex items-center gap-2 mb-3">
                    <FontAwesomeIcon icon="fa-solid fa-code" style={{ color: '#6C5CE7' }} className="text-sm" />
                    <h4 className="text-sm font-semibold" style={{ fontFamily: "'Kanit', sans-serif", color: '#1e293b' }}>ตัวแปรที่ใช้ได้:</h4>
                  </div>
                  <div className="flex flex-wrap gap-2 mb-4">
                    {['{topic}', '{previous_answer}', '{conversation_history}', '{turn}'].map(tag => (
                      <span key={tag} className="px-3 py-1 rounded-xl text-xs font-mono text-white" style={{ background: 'linear-gradient(135deg, #6C5CE7 0%, #0984E3 100%)' }}>
                        {tag}
                      </span>
                    ))}
                  </div>
                  <div className="text-xs space-y-1" style={{ fontFamily: "'Kanit', sans-serif", color: '#64748b' }}>
                    <p><code className="px-1.5 py-0.5 rounded font-mono" style={{ background: '#f1f5f9' }}>{'{topic}'}</code> - หัวข้อการสนทนา</p>
                    <p><code className="px-1.5 py-0.5 rounded font-mono" style={{ background: '#f1f5f9' }}>{'{previous_answer}'}</code> - คำตอบล่าสุดของผู้ให้ข้อมูล</p>
                    <p><code className="px-1.5 py-0.5 rounded font-mono" style={{ background: '#f1f5f9' }}>{'{conversation_history}'}</code> - ประวัติการสนทนาทั้งหมด</p>
                    <p><code className="px-1.5 py-0.5 rounded font-mono" style={{ background: '#f1f5f9' }}>{'{turn}'}</code> - หมายเลขเทิร์นปัจจุบัน (1, 2, 3...)</p>
                  </div>
                </div>
              </div>
              
              <textarea
                value={config.question_generation_prompt}
                onChange={(e) => setConfig(prev => ({ ...prev, question_generation_prompt: e.target.value }))}
                placeholder="วาง prompt template สำหรับสร้างคำถามที่นี่..."
                className="w-full min-h-[400px] px-4 py-3 rounded-xl font-mono text-sm focus:outline-none transition-all border-2"
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
              
              <div className="mt-6 flex gap-3 pt-6 border-t" style={{ borderColor: '#e2e8f0' }}>
                <button 
                  onClick={saveQuestionPrompt} 
                  className="text-white px-6 py-3 rounded-xl font-semibold transition-all shadow-mentimeter flex items-center gap-2"
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
                  <FontAwesomeIcon icon="fa-solid fa-floppy-disk" className="text-sm" />
                  <span>บันทึก</span>
                </button>
                <button 
                  onClick={resetQuestionPrompt} 
                  className="px-6 py-3 rounded-xl font-semibold transition-all border-2 flex items-center gap-2"
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
                  <FontAwesomeIcon icon="fa-solid fa-rotate" className="text-sm" />
                  <span>รีเซ็ต</span>
                </button>
              </div>
            </div>
          )}

          {/* Tab: Analysis Prompt - Mentimeter Style */}
          {activeTab === 'analysis-prompt' && (
            <div className="bg-white rounded-2xl shadow-mentimeter p-8 border border-gray-200">
              <div className="mb-6">
                <h3 className="text-xl font-bold mb-2" style={{ fontFamily: "'Kanit', sans-serif", color: '#1e293b' }}>Prompt Template สำหรับวิเคราะห์คำตอบ</h3>
                <p className="text-sm" style={{ fontFamily: "'Kanit', sans-serif", color: '#64748b' }}>ปรับแต่ง prompt สำหรับการวิเคราะห์คำตอบและสร้าง Insights</p>
              </div>
              
              <div className="mb-6 p-6 rounded-xl" style={{ background: 'linear-gradient(135deg, #f5f3ff 0%, #e0e7ff 100%)', border: '1px solid #e2e8f0' }}>
                <div className="bg-white p-4 rounded-xl border-2 mb-4" style={{ borderColor: '#e2e8f0' }}>
                  <div className="flex items-center gap-2 mb-3">
                    <FontAwesomeIcon icon="fa-solid fa-code" style={{ color: '#6C5CE7' }} className="text-sm" />
                    <h4 className="text-sm font-semibold" style={{ fontFamily: "'Kanit', sans-serif", color: '#1e293b' }}>ตัวแปรที่ใช้ได้:</h4>
                  </div>
                  <div className="flex flex-wrap gap-2 mb-4">
                    {['{topic}', '{question}', '{answer}', '{conversation_history}'].map(tag => (
                      <span key={tag} className="px-3 py-1 rounded-xl text-xs font-mono text-white" style={{ background: 'linear-gradient(135deg, #6C5CE7 0%, #0984E3 100%)' }}>
                        {tag}
                      </span>
                    ))}
                  </div>
                  <div className="text-xs space-y-1" style={{ fontFamily: "'Kanit', sans-serif", color: '#64748b' }}>
                    <p><code className="px-1.5 py-0.5 rounded font-mono" style={{ background: '#f1f5f9' }}>{'{topic}'}</code> - หัวข้อการสนทนา</p>
                    <p><code className="px-1.5 py-0.5 rounded font-mono" style={{ background: '#f1f5f9' }}>{'{question}'}</code> - คำถาม</p>
                    <p><code className="px-1.5 py-0.5 rounded font-mono" style={{ background: '#f1f5f9' }}>{'{answer}'}</code> - คำตอบ</p>
                    <p><code className="px-1.5 py-0.5 rounded font-mono" style={{ background: '#f1f5f9' }}>{'{conversation_history}'}</code> - ประวัติการสนทนาก่อนหน้า</p>
                  </div>
                </div>
                <p className="text-sm" style={{ fontFamily: "'Kanit', sans-serif", color: '#64748b' }}>
                  Prompt นี้จะวิเคราะห์คำตอบและสร้าง Insights เพื่อใช้ในการคิดคำถามถัดไป ให้ AI สามารถถามคำถามที่เกี่ยวข้องและต่อเนื่องกับคำตอบที่ได้รับ
                </p>
              </div>
              
              <textarea
                value={config.analysis_prompt}
                onChange={(e) => setConfig(prev => ({ ...prev, analysis_prompt: e.target.value }))}
                placeholder="วาง prompt template สำหรับวิเคราะห์คำตอบที่นี่..."
                className="w-full min-h-[300px] px-4 py-3 rounded-xl font-mono text-sm focus:outline-none transition-all border-2"
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
              
              <div className="mt-6 flex gap-3 pt-6 border-t" style={{ borderColor: '#e2e8f0' }}>
                <button 
                  onClick={saveAnalysisPrompt} 
                  className="text-white px-6 py-3 rounded-xl font-semibold transition-all shadow-mentimeter flex items-center gap-2"
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
                  <FontAwesomeIcon icon="fa-solid fa-floppy-disk" className="text-sm" />
                  <span>บันทึก</span>
                </button>
                <button 
                  onClick={resetAnalysisPrompt} 
                  className="px-6 py-3 rounded-xl font-semibold transition-all border-2 flex items-center gap-2"
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
                  <FontAwesomeIcon icon="fa-solid fa-rotate" className="text-sm" />
                  <span>รีเซ็ต</span>
                </button>
              </div>
            </div>
          )}

          {/* Tab: Example Questions - Mentimeter Style */}
          {activeTab === 'examples' && (
            <div className="bg-white rounded-2xl shadow-mentimeter p-8 border border-gray-200">
              <div className="mb-6">
                <h3 className="text-xl font-bold mb-2" style={{ fontFamily: "'Kanit', sans-serif", color: '#1e293b' }}>ตัวอย่างคำถามสำหรับแต่ละประเภท</h3>
                <p className="text-sm" style={{ fontFamily: "'Kanit', sans-serif", color: '#64748b' }}>ใช้ <code className="px-1.5 py-0.5 rounded font-mono text-xs" style={{ background: '#f1f5f9' }}>{'{topic}'}</code> เป็นตัวแปรสำหรับหัวข้อ</p>
              </div>
              
              <div className="space-y-6">
                {Object.entries(config.example_questions || {}).map(([type, questions]) => (
                  <div key={type} className="p-6 rounded-xl border-2" style={{ background: 'linear-gradient(135deg, #f5f3ff 0%, #e0e7ff 100%)', borderColor: '#e2e8f0' }}>
                    <h4 className="text-base font-semibold mb-4" style={{ fontFamily: "'Kanit', sans-serif", color: '#1e293b' }}>{type}</h4>
                    <div className="space-y-3">
                      {questions.map((question, index) => (
                        <div key={index} className="flex gap-2">
                          <input
                            type="text"
                            value={question}
                            onChange={(e) => updateExampleQuestion(type, index, e.target.value)}
                            className="flex-1 px-4 py-2 rounded-xl focus:outline-none transition-all border-2 text-sm"
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
                            onClick={() => removeExampleQuestion(type, index)}
                            className="text-white px-4 py-2 rounded-xl transition-all flex items-center gap-2 shadow-md font-semibold"
                            style={{ 
                              fontFamily: "'Kanit', sans-serif",
                              background: 'linear-gradient(135deg, #D63031 0%, #c92a2a 100%)'
                            }}
                            onMouseEnter={(e) => {
                              e.target.style.transform = 'translateY(-1px)';
                              e.target.style.boxShadow = '0 8px 16px 0 rgba(214, 48, 49, 0.3)';
                            }}
                            onMouseLeave={(e) => {
                              e.target.style.transform = 'translateY(0)';
                              e.target.style.boxShadow = '0 4px 8px 0 rgba(214, 48, 49, 0.2)';
                            }}
                          >
                            <FontAwesomeIcon icon="fa-solid fa-trash" className="text-sm" />
                            <span>ลบ</span>
                          </button>
                        </div>
                      ))}
                    </div>
                    <button
                      onClick={() => addExampleQuestion(type)}
                      className="mt-4 text-white px-4 py-2 rounded-xl transition-all flex items-center gap-2 text-sm font-semibold shadow-mentimeter"
                      style={{ 
                        fontFamily: "'Kanit', sans-serif",
                        background: 'linear-gradient(135deg, #6C5CE7 0%, #0984E3 100%)'
                      }}
                      onMouseEnter={(e) => {
                        e.target.style.transform = 'translateY(-1px)';
                      }}
                      onMouseLeave={(e) => {
                        e.target.style.transform = 'translateY(0)';
                      }}
                    >
                      <FontAwesomeIcon icon="fa-solid fa-plus" className="text-sm" />
                      <span>เพิ่มคำถาม</span>
                    </button>
                  </div>
                ))}
              </div>
              
              <div className="mt-6 flex gap-3 pt-6 border-t" style={{ borderColor: '#e2e8f0' }}>
                <button 
                  onClick={saveExamples} 
                  className="text-white px-6 py-3 rounded-xl font-semibold transition-all shadow-mentimeter flex items-center gap-2"
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
                  <FontAwesomeIcon icon="fa-solid fa-floppy-disk" className="text-sm" />
                  <span>บันทึก</span>
                </button>
              </div>
            </div>
          )}

          {/* Tab: Model Settings - Mentimeter Style */}
          {activeTab === 'model' && (
            <div className="bg-white rounded-2xl shadow-mentimeter p-8 border border-gray-200">
              <div className="mb-6">
                <h3 className="text-xl font-bold mb-2" style={{ fontFamily: "'Kanit', sans-serif", color: '#1e293b' }}>Model Settings</h3>
                <p className="text-sm" style={{ fontFamily: "'Kanit', sans-serif", color: '#64748b' }}>ตั้งค่าโมเดล AI และพารามิเตอร์ต่างๆ</p>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div>
                  <label className="block text-sm font-semibold mb-2" style={{ fontFamily: "'Kanit', sans-serif", color: '#1e293b' }}>Model</label>
                  <select
                    value={config.model_settings.model}
                    onChange={(e) => setConfig(prev => ({
                      ...prev,
                      model_settings: { ...prev.model_settings, model: e.target.value }
                    }))}
                    className="w-full px-4 py-3 rounded-xl focus:outline-none transition-all border-2 text-sm"
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
                  >
                    <option value="gpt-4o">gpt-4o (แนะนำ)</option>
                    <option value="gpt-4-turbo">gpt-4-turbo</option>
                    <option value="gpt-4">gpt-4</option>
                    <option value="gpt-3.5-turbo">gpt-3.5-turbo</option>
                  </select>
                </div>
                
                <div>
                  <label className="block text-sm font-semibold mb-2" style={{ fontFamily: "'Kanit', sans-serif", color: '#1e293b' }}>
                    Temperature (คำถาม): <span className="font-bold" style={{ color: '#6C5CE7' }}>{config.model_settings.temperature_question}</span>
                  </label>
                  <input
                    type="range"
                    min="0"
                    max="1"
                    step="0.1"
                    value={config.model_settings.temperature_question}
                    onChange={(e) => setConfig(prev => ({
                      ...prev,
                      model_settings: { ...prev.model_settings, temperature_question: parseFloat(e.target.value) }
                    }))}
                    className="w-full h-2 rounded-lg appearance-none cursor-pointer"
                    style={{ background: '#e2e8f0' }}
                  />
                  <style>{`
                    input[type="range"]::-webkit-slider-thumb {
                      appearance: none;
                      width: 20px;
                      height: 20px;
                      border-radius: 50%;
                      background: linear-gradient(135deg, #6C5CE7 0%, #0984E3 100%);
                      cursor: pointer;
                    }
                    input[type="range"]::-moz-range-thumb {
                      width: 20px;
                      height: 20px;
                      border-radius: 50%;
                      background: linear-gradient(135deg, #6C5CE7 0%, #0984E3 100%);
                      cursor: pointer;
                      border: none;
                    }
                  `}</style>
                </div>
                
                <div>
                  <label className="block text-sm font-semibold mb-2" style={{ fontFamily: "'Kanit', sans-serif", color: '#1e293b' }}>
                    Temperature (วิเคราะห์): <span className="font-bold" style={{ color: '#6C5CE7' }}>{config.model_settings.temperature_analysis}</span>
                  </label>
                  <input
                    type="range"
                    min="0"
                    max="1"
                    step="0.1"
                    value={config.model_settings.temperature_analysis}
                    onChange={(e) => setConfig(prev => ({
                      ...prev,
                      model_settings: { ...prev.model_settings, temperature_analysis: parseFloat(e.target.value) }
                    }))}
                    className="w-full h-2 rounded-lg appearance-none cursor-pointer"
                    style={{ background: '#e2e8f0' }}
                  />
                </div>
              </div>
              
              <div className="mt-6 flex gap-3 pt-6 border-t" style={{ borderColor: '#e2e8f0' }}>
                <button 
                  onClick={saveModelSettings} 
                  className="text-white px-6 py-3 rounded-xl font-semibold transition-all shadow-mentimeter flex items-center gap-2"
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
                  <FontAwesomeIcon icon="fa-solid fa-floppy-disk" className="text-sm" />
                  <span>บันทึก</span>
                </button>
              </div>
            </div>
          )}

          {/* Tab: Interview History - Mentimeter Style */}
          {activeTab === 'history' && (
            <div className="bg-white rounded-2xl shadow-mentimeter p-8 border border-gray-200">
              <div className="mb-6">
                <h3 className="text-xl font-bold mb-2" style={{ fontFamily: "'Kanit', sans-serif", color: '#1e293b' }}>ประวัติการสัมภาษณ์</h3>
                <p className="text-sm" style={{ fontFamily: "'Kanit', sans-serif", color: '#64748b' }}>ดูประวัติการสัมภาษณ์ที่จบแล้วทั้งหมด</p>
              </div>

              {isLoadingSessions ? (
                <div className="text-center py-12">
                  <div className="inline-block w-8 h-8 border-4 border-t-transparent rounded-full animate-spin" style={{ borderColor: '#6C5CE7', borderTopColor: 'transparent' }}></div>
                  <p className="mt-4 text-sm" style={{ fontFamily: "'Kanit', sans-serif", color: '#64748b' }}>กำลังโหลด...</p>
                </div>
              ) : sessionsList.length === 0 ? (
                <div className="text-center py-12 p-6 rounded-xl" style={{ background: 'linear-gradient(135deg, #f5f3ff 0%, #e0e7ff 100%)', border: '1px solid #e2e8f0' }}>
                  <FontAwesomeIcon icon="fa-solid fa-inbox" className="text-4xl mb-4" style={{ color: '#6C5CE7' }} />
                  <p className="text-base font-semibold mb-2" style={{ fontFamily: "'Kanit', sans-serif", color: '#1e293b' }}>ยังไม่มีประวัติการสัมภาษณ์</p>
                  <p className="text-sm" style={{ fontFamily: "'Kanit', sans-serif", color: '#64748b' }}>การสัมภาษณ์ที่จบแล้วจะแสดงที่นี่</p>
                </div>
              ) : selectedSession ? (
                <div>
                  <button
                    onClick={() => setSelectedSession(null)}
                    className="mb-4 px-4 py-2 rounded-xl font-semibold transition-all border-2 flex items-center gap-2"
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
                    <FontAwesomeIcon icon="fa-solid fa-arrow-left" className="text-sm" />
                    <span>กลับไปรายการ</span>
                  </button>

                  <div className="space-y-6">
                    {/* Session Header */}
                    <div className="p-6 rounded-xl border-2" style={{ background: 'linear-gradient(135deg, #f5f3ff 0%, #e0e7ff 100%)', borderColor: '#e2e8f0' }}>
                      <div className="flex items-start justify-between mb-4">
                        <div>
                          <h4 className="text-lg font-bold mb-2" style={{ fontFamily: "'Kanit', sans-serif", color: '#1e293b' }}>{selectedSession.topic || 'ไม่ระบุหัวข้อ'}</h4>
                          <p className="text-xs" style={{ fontFamily: "'Kanit', sans-serif", color: '#64748b' }}>{formatDate(selectedSession.createdAt)}</p>
                        </div>
                        <div className="flex gap-2">
                          <button
                            onClick={() => exportSessionCSV(selectedSession)}
                            className="px-4 py-2 rounded-xl font-semibold transition-all border-2 flex items-center gap-2"
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
                            <FontAwesomeIcon icon="fa-solid fa-file-export" className="text-sm" />
                            <span>Export CSV</span>
                          </button>
                          <button
                            onClick={() => deleteSession(selectedSession.id)}
                            className="px-4 py-2 rounded-xl font-semibold transition-all flex items-center gap-2 shadow-md"
                            style={{ 
                              fontFamily: "'Kanit', sans-serif",
                              background: 'linear-gradient(135deg, #D63031 0%, #c92a2a 100%)',
                              color: 'white'
                            }}
                            onMouseEnter={(e) => {
                              e.target.style.transform = 'translateY(-1px)';
                              e.target.style.boxShadow = '0 8px 16px 0 rgba(214, 48, 49, 0.3)';
                            }}
                            onMouseLeave={(e) => {
                              e.target.style.transform = 'translateY(0)';
                              e.target.style.boxShadow = '0 4px 8px 0 rgba(214, 48, 49, 0.2)';
                            }}
                          >
                            <FontAwesomeIcon icon="fa-solid fa-trash" className="text-sm" />
                            <span>ลบ</span>
                          </button>
                        </div>
                      </div>
                      <div className="grid grid-cols-3 gap-4 mt-4">
                        <div className="text-center p-4 rounded-xl border-2" style={{ background: 'white', borderColor: '#e2e8f0' }}>
                          <p className="text-xs mb-1" style={{ fontFamily: "'Kanit', sans-serif", color: '#64748b' }}>จำนวนคำถาม</p>
                          <p className="text-2xl font-bold" style={{ fontFamily: "'Kanit', sans-serif", background: 'linear-gradient(135deg, #6C5CE7 0%, #0984E3 100%)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text' }}>{selectedSession.answers?.length || 0}</p>
                        </div>
                        <div className="text-center p-4 rounded-xl border-2" style={{ background: 'white', borderColor: '#e2e8f0' }}>
                          <p className="text-xs mb-1" style={{ fontFamily: "'Kanit', sans-serif", color: '#64748b' }}>Insights</p>
                          <p className="text-2xl font-bold" style={{ fontFamily: "'Kanit', sans-serif", background: 'linear-gradient(135deg, #6C5CE7 0%, #0984E3 100%)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text' }}>{selectedSession.insights?.length || 0}</p>
                        </div>
                        <div className="text-center p-4 rounded-xl border-2" style={{ background: 'white', borderColor: '#e2e8f0' }}>
                          <p className="text-xs mb-1" style={{ fontFamily: "'Kanit', sans-serif", color: '#64748b' }}>วันที่บันทึก</p>
                          <p className="text-xs font-semibold" style={{ fontFamily: "'Kanit', sans-serif", color: '#1e293b' }}>{formatDate(selectedSession.exportedAt)}</p>
                        </div>
                      </div>
                    </div>

                    {/* Q&A List */}
                    {selectedSession.answers && selectedSession.answers.length > 0 && (
                      <div className="space-y-4">
                        <h5 className="text-base font-bold" style={{ fontFamily: "'Kanit', sans-serif", color: '#1e293b' }}>คำถามและคำตอบ</h5>
                        {selectedSession.answers.map((qa, idx) => (
                          <div key={idx} className="p-6 rounded-xl border-2" style={{ background: 'white', borderColor: '#e2e8f0' }}>
                            <div className="flex items-start gap-3 mb-4">
                              <div className="flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center text-white text-xs font-semibold" style={{ background: 'linear-gradient(135deg, #6C5CE7 0%, #0984E3 100%)' }}>
                                {idx + 1}
                              </div>
                              <div className="flex-1">
                                <p className="text-base font-semibold mb-2" style={{ fontFamily: "'Kanit', sans-serif", color: '#1e293b' }}>{qa.question || 'ไม่มีคำถาม'}</p>
                                <p className="text-sm leading-relaxed" style={{ fontFamily: "'Kanit', sans-serif", color: '#64748b' }}>{qa.answer || 'ไม่มีคำตอบ'}</p>
                              </div>
                            </div>
                            {qa.analysis && qa.analysis.insights && qa.analysis.insights.length > 0 && (
                              <div className="mt-4 pt-4 border-t" style={{ borderColor: '#e2e8f0' }}>
                                <p className="text-xs font-semibold mb-2" style={{ fontFamily: "'Kanit', sans-serif", color: '#6C5CE7' }}>Insights:</p>
                                <div className="space-y-2">
                                  {qa.analysis.insights.map((insight, i) => (
                                    <div key={i} className="p-3 rounded-lg" style={{ background: 'linear-gradient(135deg, #f5f3ff 0%, #e0e7ff 100%)', border: '1px solid #e2e8f0' }}>
                                      <p className="text-sm font-medium mb-1" style={{ fontFamily: "'Kanit', sans-serif", color: '#1e293b' }}>{insight.key_point}</p>
                                      {insight.quote && (
                                        <p className="text-xs italic mt-1" style={{ fontFamily: "'Kanit', sans-serif", color: '#64748b' }}>"{insight.quote}"</p>
                                      )}
                                    </div>
                                  ))}
                                </div>
                              </div>
                            )}
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              ) : (
                <div className="space-y-3">
                  {sessionsList.map((session) => (
                    <div
                      key={session.id}
                      className="p-6 rounded-xl border-2 transition-all"
                      style={{ 
                        background: 'white',
                        borderColor: '#e2e8f0'
                      }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.borderColor = '#6C5CE7';
                        e.currentTarget.style.boxShadow = '0 4px 12px 0 rgba(108, 92, 231, 0.1)';
                        e.currentTarget.style.transform = 'translateY(-2px)';
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.borderColor = '#e2e8f0';
                        e.currentTarget.style.boxShadow = 'none';
                        e.currentTarget.style.transform = 'translateY(0)';
                      }}
                    >
                      <div className="flex items-start justify-between gap-4">
                        <div 
                          className="flex-1 cursor-pointer"
                          onClick={() => loadSessionDetails(session.id)}
                        >
                          <h4 className="text-base font-bold mb-2" style={{ fontFamily: "'Kanit', sans-serif", color: '#1e293b' }}>{session.topic || 'ไม่ระบุหัวข้อ'}</h4>
                          <p className="text-xs mb-3" style={{ fontFamily: "'Kanit', sans-serif", color: '#64748b' }}>{formatDate(session.createdAt)}</p>
                          <div className="flex gap-4">
                            <div className="flex items-center gap-2">
                              <FontAwesomeIcon icon="fa-solid fa-question" className="text-sm" style={{ color: '#6C5CE7' }} />
                              <span className="text-xs" style={{ fontFamily: "'Kanit', sans-serif", color: '#64748b' }}>{session.totalQuestions || 0} คำถาม</span>
                            </div>
                            <div className="flex items-center gap-2">
                              <FontAwesomeIcon icon="fa-solid fa-lightbulb" className="text-sm" style={{ color: '#0984E3' }} />
                              <span className="text-xs" style={{ fontFamily: "'Kanit', sans-serif", color: '#64748b' }}>{session.totalInsights || 0} Insights</span>
                            </div>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <button
                            onClick={(e) => deleteSession(session.id, e)}
                            className="px-3 py-2 rounded-xl font-semibold transition-all flex items-center gap-2 shadow-md"
                            style={{ 
                              fontFamily: "'Kanit', sans-serif",
                              background: 'linear-gradient(135deg, #D63031 0%, #c92a2a 100%)',
                              color: 'white'
                            }}
                            onMouseEnter={(e) => {
                              e.target.style.transform = 'translateY(-1px)';
                              e.target.style.boxShadow = '0 8px 16px 0 rgba(214, 48, 49, 0.3)';
                            }}
                            onMouseLeave={(e) => {
                              e.target.style.transform = 'translateY(0)';
                              e.target.style.boxShadow = '0 4px 8px 0 rgba(214, 48, 49, 0.2)';
                            }}
                          >
                            <FontAwesomeIcon icon="fa-solid fa-trash" className="text-sm" />
                            <span>ลบ</span>
                          </button>
                          <FontAwesomeIcon icon="fa-solid fa-chevron-right" className="text-sm mt-1 cursor-pointer" style={{ color: '#6C5CE7' }} onClick={() => loadSessionDetails(session.id)} />
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Config Management - Mentimeter Style */}
          {activeTab !== 'history' && (
            <div className="bg-white rounded-2xl shadow-mentimeter p-8 border border-gray-200">
              <div className="mb-6">
                <h3 className="text-xl font-bold mb-2" style={{ fontFamily: "'Kanit', sans-serif", color: '#1e293b' }}>การจัดการ Config</h3>
                <p className="text-sm" style={{ fontFamily: "'Kanit', sans-serif", color: '#64748b' }}>Export, Import หรือรีเซ็ตการตั้งค่า</p>
              </div>
              <div className="flex flex-wrap gap-3">
                <button 
                  onClick={exportConfig} 
                  className="text-white px-6 py-3 rounded-xl font-semibold transition-all shadow-mentimeter flex items-center gap-2"
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
                  <FontAwesomeIcon icon="fa-solid fa-file-export" className="text-sm" />
                  <span>Export Config</span>
                </button>
                <button 
                  onClick={() => document.getElementById('importFile').click()} 
                  className="text-white px-6 py-3 rounded-xl font-semibold transition-all shadow-mentimeter flex items-center gap-2"
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
                  <FontAwesomeIcon icon="fa-solid fa-file-import" className="text-sm" />
                  <span>Import Config</span>
                </button>
                <button 
                  onClick={resetToDefault} 
                  className="text-white px-6 py-3 rounded-xl font-semibold transition-all shadow-mentimeter flex items-center gap-2"
                  style={{ 
                    fontFamily: "'Kanit', sans-serif",
                    background: 'linear-gradient(135deg, #D63031 0%, #c92a2a 100%)'
                  }}
                  onMouseEnter={(e) => {
                    e.target.style.transform = 'translateY(-2px)';
                    e.target.style.boxShadow = '0 12px 28px 0 rgba(214, 48, 49, 0.25)';
                  }}
                  onMouseLeave={(e) => {
                    e.target.style.transform = 'translateY(0)';
                    e.target.style.boxShadow = '0 8px 24px 0 rgba(214, 48, 49, 0.15), 0 4px 8px 0 rgba(0, 0, 0, 0.08)';
                  }}
                >
                  <FontAwesomeIcon icon="fa-solid fa-rotate" className="text-sm" />
                  <span>รีเซ็ตเป็นค่าเริ่มต้น</span>
                </button>
                <input
                  type="file"
                  id="importFile"
                  accept=".json"
                  onChange={importConfig}
                  className="hidden"
                />
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default ConfigPage;
