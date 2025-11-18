import { useState, useEffect, useCallback } from 'react';
import Swal from 'sweetalert2';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
  faGear,
  faHouse,
  faClipboardList,
  faCircleQuestion,
  faMagnifyingGlass,
  faLightbulb,
  faRobot,
  faFloppyDisk,
  faRotate,
  faFileExport,
  faInbox,
  faThumbtack
} from '@fortawesome/free-solid-svg-icons';

function ConfigPage({ onNavigateToInterview }) {
  // API Base URL
  const API_BASE = 'http://localhost:8000';
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

  const showToast = useCallback((type, message) => {
    const icon = type === 'success' ? 'success' : type === 'warning' ? 'warning' : 'error';
    return Swal.fire({
      icon,
      title: message,
      toast: true,
      position: 'top-end',
      showConfirmButton: false,
      timer: 2600,
      timerProgressBar: true,
      customClass: {
        popup: 'swal2-toast'
      }
    });
  }, []);

  const loadConfig = useCallback(async () => {
    try {
      const response = await fetch(`${API_BASE}/api/config`);
      const data = await response.json();
      console.log('[Config] loaded', data);
      setConfig(data);
    } catch (error) {
      console.error('❌ Error loading config:', error);
      showToast('error', 'ไม่สามารถโหลด config ได้: ' + error.message);
    }
  }, [showToast]);

  useEffect(() => {
    loadConfig();
  }, [loadConfig]);

  const confirmAction = async ({ title, text, confirmText = 'ยืนยัน' }) => {
    const result = await Swal.fire({
      title,
      text,
      icon: 'question',
      showCancelButton: true,
      confirmButtonText: confirmText,
      cancelButtonText: 'ยกเลิก',
      reverseButtons: true
    });
    return result.isConfirmed;
  };

  const saveToServer = async (updates) => {
    try {
      const response = await fetch(`${API_BASE}/api/config`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updates)
      });

      if (response.ok) {
        showToast('success', 'บันทึกสำเร็จ!');
        await loadConfig();
      } else {
        showToast('error', 'บันทึกไม่สำเร็จ');
      }
    } catch (error) {
      showToast('error', 'เกิดข้อผิดพลาด: ' + error.message);
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
      showToast('success', 'Export สำเร็จ!');
    } catch (error) {
      showToast('error', 'Export ไม่สำเร็จ: ' + error.message);
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
          showToast('success', 'Import สำเร็จ!');
          await loadConfig();
        }
      } catch (error) {
        showToast('error', 'Import ไม่สำเร็จ: ' + error.message);
      }
    };
    reader.readAsText(file);
  };

  const resetToDefault = async () => {
    const confirmed = await confirmAction({
      title: 'รีเซ็ตค่าทั้งหมด?',
      text: 'การรีเซ็ตจะล้างการตั้งค่าทั้งหมดกลับเป็นค่าเริ่มต้น',
      confirmText: 'รีเซ็ต'
    });
    if (!confirmed) return;

    try {
      const response = await fetch(`${API_BASE}/api/config/reset`, { method: 'POST' });
      if (response.ok) {
        showToast('success', 'รีเซ็ตสำเร็จ!');
        await loadConfig();
      }
    } catch (error) {
      showToast('error', 'เกิดข้อผิดพลาด: ' + error.message);
    }
  };

  const resetQuestionPrompt = async () => {
    const confirmed = await confirmAction({
      title: 'รีเซ็ต Prompt คำถาม?',
      text: 'บันทึกที่แก้ไขไว้จะถูกแทนที่ด้วยค่าเริ่มต้น',
      confirmText: 'รีเซ็ต'
    });
    if (!confirmed) return;

    try {
      const response = await fetch(`${API_BASE}/api/config/default/question_prompt`);
      const data = await response.json();
      setConfig(prev => ({ ...prev, question_generation_prompt: data.prompt }));
      showToast('success', 'รีเซ็ตสำเร็จ!');
    } catch (error) {
      showToast('error', 'เกิดข้อผิดพลาด: ' + error.message);
    }
  };

  const resetAnalysisPrompt = async () => {
    const confirmed = await confirmAction({
      title: 'รีเซ็ต Prompt วิเคราะห์?',
      text: 'ข้อความปัจจุบันจะถูกแทนที่ด้วยค่าเริ่มต้น',
      confirmText: 'รีเซ็ต'
    });
    if (!confirmed) return;

    try {
      const response = await fetch(`${API_BASE}/api/config/default/analysis_prompt`);
      const data = await response.json();
      setConfig(prev => ({ ...prev, analysis_prompt: data.prompt }));
      showToast('success', 'รีเซ็ตสำเร็จ!');
    } catch (error) {
      showToast('error', '❌ เกิดข้อผิดพลาด: ' + error.message);
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

  const tabs = [
    { id: 'code-types', label: 'ประเภทโค้ด', icon: faClipboardList },
    { id: 'question-prompt', label: 'Prompt คำถาม', icon: faCircleQuestion },
    { id: 'analysis-prompt', label: 'Prompt วิเคราะห์', icon: faMagnifyingGlass },
    { id: 'examples', label: 'ตัวอย่างคำถาม', icon: faLightbulb },
    { id: 'model', label: 'Model Settings', icon: faRobot }
  ];

  return (
    <div className="min-h-screen bg-background text-text p-6">
      <div className="max-w-6xl mx-auto glass-panel overflow-hidden">
        {/* Header */}
        <div className="bg-gradient-to-r from-[#1877F2] to-[#1451A1] text-white p-8 text-center relative border-b border-border/60">
          <div className="flex flex-wrap gap-4 justify-between items-center">
            <h1 className="text-4xl font-bold flex items-center gap-3">
              <FontAwesomeIcon icon={faGear} />
              Configuration
            </h1>
            <button
              onClick={() => onNavigateToInterview && onNavigateToInterview()}
              className="bg-white text-primary px-5 py-2 rounded-xl font-semibold transition-all cursor-pointer shadow-soft hover:bg-[#F0F2F5]"
            >
              <FontAwesomeIcon icon={faHouse} className="mr-2" />
              กลับหน้าหลัก
            </button>
          </div>
        </div>

        <div className="p-8">

          {/* Tabs */}
          <div className="flex flex-wrap gap-3 mb-8">
            {tabs.map(tab => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`px-6 py-3 font-semibold text-sm tracking-wide transition-all rounded-2xl flex items-center gap-2 ${
                  activeTab === tab.id
                    ? 'bg-primary text-white shadow-soft'
                    : 'bg-cardHover text-text border border-border hover:bg-white'
                }`}
              >
                <FontAwesomeIcon icon={tab.icon} />
                {tab.label}
              </button>
            ))}
          </div>

          {/* Tab: Code Types */}
          {activeTab === 'code-types' && (
            <div className="glow-card p-6 space-y-5">
              <h3 className="text-2xl font-bold text-text mb-4 flex items-center gap-2">
                <FontAwesomeIcon icon={faClipboardList} />
                ประเภทโค้ดทั้งหมด
              </h3>
              <p className="text-textMuted mb-5">กำหนดประเภทโค้ดและคำอธิบายแต่ละประเภท</p>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                {Object.entries(config.code_types).map(([type, description]) => (
                  <div key={type} className="bg-card p-5 rounded-2xl border border-border space-y-3">
                    <div className="flex items-center justify-between">
                      <h4 className="text-text font-semibold">{type}</h4>
                      <span className="text-xs uppercase tracking-wide text-textMuted">Editable</span>
                    </div>
                    <textarea
                      value={description}
                      onChange={(e) => setConfig(prev => ({
                        ...prev,
                        code_types: { ...prev.code_types, [type]: e.target.value }
                      }))}
                      className="w-full min-h-[80px] px-3 py-2 border border-border rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/40 text-text bg-inputBg placeholder:text-textMuted"
                    />
                  </div>
                ))}
              </div>
              
              <button
                onClick={saveCodeTypes}
                className="mt-3 inline-flex items-center bg-primary text-white px-6 py-3 rounded-xl font-semibold transition-all shadow-soft hover:bg-[#166FE5]"
              >
                <FontAwesomeIcon icon={faFloppyDisk} className="mr-2" />
                บันทึก
              </button>
            </div>
          )}

          {/* Tab: Question Prompt */}
          {activeTab === 'question-prompt' && (
            <div className="glow-card p-6 space-y-5">
              <h3 className="text-2xl font-bold text-text mb-4 flex items-center gap-2">
                <FontAwesomeIcon icon={faCircleQuestion} />
                Prompt Template สำหรับสร้างคำถาม
              </h3>
              
              <div className="bg-card p-4 rounded-2xl border border-border mb-5">
                <h4 className="text-text font-semibold mb-2 flex items-center gap-2">
                  <FontAwesomeIcon icon={faThumbtack} />
                  ตัวแปรที่ใช้ได้:
                </h4>
                <div className="flex flex-wrap gap-2">
                  {['{topic}', '{history}', '{target_code}', '{target_description}', '{examples}'].map(tag => (
                    <span key={tag} className="bg-surfaceMuted text-primary px-3 py-1 rounded text-sm font-mono">
                      {tag}
                    </span>
                  ))}
                </div>
              </div>
              
              <textarea
                value={config.question_generation_prompt}
                onChange={(e) => setConfig(prev => ({ ...prev, question_generation_prompt: e.target.value }))}
                className="w-full min-h-[200px] px-4 py-3 border border-border rounded-2xl font-mono text-text focus:outline-none focus:ring-2 focus:ring-primary/40 bg-inputBg placeholder:text-textMuted"
              />
              
              <div className="mt-5 flex gap-3">
                <button
                  onClick={saveQuestionPrompt}
                  className="bg-primary text-white px-6 py-3 rounded-xl font-semibold transition-all shadow-soft hover:bg-[#166FE5]"
                >
                  <FontAwesomeIcon icon={faFloppyDisk} className="mr-2" />
                  บันทึก
                </button>
                <button
                  onClick={resetQuestionPrompt}
                  className="bg-white text-primary px-6 py-3 rounded-xl font-semibold transition-all border border-border hover:bg-surfaceMuted"
                >
                  <FontAwesomeIcon icon={faRotate} className="mr-2" />
                  รีเซ็ต
                </button>
              </div>
            </div>
          )}

          {/* Tab: Analysis Prompt */}
          {activeTab === 'analysis-prompt' && (
            <div className="glow-card p-6 space-y-5">
              <h3 className="text-2xl font-bold text-text mb-4 flex items-center gap-2">
                <FontAwesomeIcon icon={faMagnifyingGlass} />
                Prompt Template สำหรับวิเคราะห์คำตอบ
              </h3>
              
              <div className="bg-card p-4 rounded-2xl border border-border mb-5">
                <h4 className="text-text font-semibold mb-2 flex items-center gap-2">
                  <FontAwesomeIcon icon={faThumbtack} />
                  ตัวแปรที่ใช้ได้:
                </h4>
                <div className="flex flex-wrap gap-2">
                  {['{target_code}', '{question}', '{answer}', '{code_types_description}'].map(tag => (
                    <span key={tag} className="bg-surfaceMuted text-primary px-3 py-1 rounded text-sm font-mono">
                      {tag}
                    </span>
                  ))}
                </div>
              </div>
              
              <textarea
                value={config.analysis_prompt}
                onChange={(e) => setConfig(prev => ({ ...prev, analysis_prompt: e.target.value }))}
                className="w-full min-h-[200px] px-4 py-3 border border-border rounded-2xl font-mono text-text focus:outline-none focus:ring-2 focus:ring-primary/40 bg-inputBg placeholder:text-textMuted"
              />
              
              <div className="mt-5 flex gap-3">
                <button
                  onClick={saveAnalysisPrompt}
                  className="bg-primary text-white px-6 py-3 rounded-xl font-semibold transition-all shadow-soft hover:bg-[#166FE5]"
                >
                  <FontAwesomeIcon icon={faFloppyDisk} className="mr-2" />
                  บันทึก
                </button>
                <button
                  onClick={resetAnalysisPrompt}
                  className="bg-white text-primary px-6 py-3 rounded-xl font-semibold transition-all border border-border hover:bg-surfaceMuted"
                >
                  <FontAwesomeIcon icon={faRotate} className="mr-2" />
                  รีเซ็ต
                </button>
              </div>
            </div>
          )}

          {/* Tab: Example Questions */}
          {activeTab === 'examples' && (
            <div className="glow-card p-6 space-y-5">
              <h3 className="text-2xl font-bold text-text mb-4 flex items-center gap-2">
                <FontAwesomeIcon icon={faLightbulb} />
                ตัวอย่างคำถามสำหรับแต่ละประเภท
              </h3>
              <p className="text-textMuted mb-5">ใช้ {'{product}'} เป็นตัวแปรสำหรับชื่อสินค้า</p>
              
              <div className="space-y-5">
                {Object.entries(config.example_questions).map(([type, questions]) => (
                  <div key={type} className="bg-card p-5 rounded-2xl border border-border shadow-soft">
                    <div className="flex items-center justify-between mb-3">
                      <h4 className="text-primary font-semibold">{type}</h4>
                      <span className="text-xs text-textMuted">Prompt set</span>
                    </div>
                    <div className="space-y-2">
                      {questions.map((question, index) => (
                        <div key={index} className="flex gap-2">
                          <input
                            type="text"
                            value={question}
                            onChange={(e) => updateExampleQuestion(type, index, e.target.value)}
                            className="flex-1 px-3 py-2 border border-border rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/40 text-text bg-inputBg placeholder:text-textMuted"
                          />
                          <button
                            onClick={() => removeExampleQuestion(type, index)}
                            className="bg-danger hover:bg-danger/90 text-white px-4 py-2 rounded-xl transition-colors"
                          >
                            🗑️
                          </button>
                        </div>
                      ))}
                    </div>
                    <button
                      onClick={() => addExampleQuestion(type)}
                      className="mt-3 bg-white text-primary hover:bg-surfaceMuted px-4 py-2 rounded-xl transition-colors border border-border"
                    >
                      ➕ เพิ่มคำถาม
                    </button>
                  </div>
                ))}
              </div>
              
              <button
                onClick={saveExamples}
                className="mt-3 inline-flex items-center bg-primary text-white px-6 py-3 rounded-xl font-semibold transition-all shadow-soft hover:bg-[#166FE5]"
              >
                <FontAwesomeIcon icon={faFloppyDisk} className="mr-2" />
                บันทึก
              </button>
            </div>
          )}

          {/* Tab: Model Settings */}
          {activeTab === 'model' && (
            <div className="glow-card p-6 space-y-5">
              <h3 className="text-2xl font-bold text-text mb-4 flex items-center gap-2">
                <FontAwesomeIcon icon={faRobot} />
                Model Settings
              </h3>
              
              <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
                <div>
                  <label className="block font-semibold mb-2 text-text">Model:</label>
                  <select
                    value={config.model_settings.model}
                    onChange={(e) => setConfig(prev => ({
                      ...prev,
                      model_settings: { ...prev.model_settings, model: e.target.value }
                    }))}
                    className="w-full px-4 py-3 border border-border rounded-2xl focus:outline-none focus:ring-2 focus:ring-primary/40 text-text bg-inputBg"
                  >
                    <option value="gpt-4o">gpt-4o (แนะนำ)</option>
                    <option value="gpt-4-turbo">gpt-4-turbo</option>
                    <option value="gpt-4">gpt-4</option>
                    <option value="gpt-3.5-turbo">gpt-3.5-turbo</option>
                  </select>
                </div>
                
                <div>
                  <label className="block font-semibold mb-2 text-text flex items-center justify-between">
                    <span>Temperature (คำถาม):</span>
                    <span className="text-primary font-semibold">{config.model_settings.temperature_question}</span>
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
                    className="w-full accent-primary"
                  />
                </div>
                
                <div>
                  <label className="block font-semibold mb-2 text-text flex items-center justify-between">
                    <span>Temperature (วิเคราะห์):</span>
                    <span className="text-primary font-semibold">{config.model_settings.temperature_analysis}</span>
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
                    className="w-full accent-primary"
                  />
                </div>
              </div>
              
              <button
                onClick={saveModelSettings}
                className="mt-3 inline-flex items-center bg-primary text-white px-6 py-3 rounded-xl font-semibold transition-all shadow-soft hover:bg-[#166FE5]"
              >
                <FontAwesomeIcon icon={faFloppyDisk} className="mr-2" />
                บันทึก
              </button>
            </div>
          )}

          {/* Config Management */}
          <div className="glow-card p-6 mt-8 space-y-4">
            <h3 className="text-2xl font-bold text-text mb-4 flex items-center gap-2">
              <FontAwesomeIcon icon={faGear} />
              การจัดการ Config
            </h3>
            <div className="flex flex-wrap gap-3">
              <button
                onClick={exportConfig}
                className="bg-primary text-white px-6 py-3 rounded-xl font-semibold transition-all shadow-soft hover:bg-[#166FE5]"
              >
                <FontAwesomeIcon icon={faFileExport} className="mr-2" />
                Export Config
              </button>
              <button
                onClick={() => document.getElementById('importFile').click()}
                className="bg-white text-primary hover:bg-surfaceMuted px-6 py-3 rounded-xl font-semibold transition-all border border-border"
              >
                <FontAwesomeIcon icon={faInbox} className="mr-2" />
                Import Config
              </button>
              <button
                onClick={resetToDefault}
                className="bg-white text-danger hover:bg-surfaceMuted px-6 py-3 rounded-xl font-semibold transition-all border border-border"
              >
                <FontAwesomeIcon icon={faRotate} className="mr-2" />
                รีเซ็ตเป็นค่าเริ่มต้น
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
        </div>
      </div>
    </div>
  );
}

export default ConfigPage;
