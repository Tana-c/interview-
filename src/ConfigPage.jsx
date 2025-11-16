import React, { useState, useEffect } from 'react';

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
  const [alert, setAlert] = useState({ show: false, type: '', message: '' });

  useEffect(() => {
    loadConfig();
  }, []);

  const loadConfig = async () => {
    try {
      const response = await fetch(`${API_BASE}/api/config`);
      const data = await response.json();
      console.log('✅ Config loaded:', data);
      setConfig(data);
    } catch (error) {
      console.error('❌ Error loading config:', error);
      showAlert('error', 'ไม่สามารถโหลด config ได้: ' + error.message);
    }
  };

  const showAlert = (type, message) => {
    setAlert({ show: true, type, message });
    setTimeout(() => {
      setAlert({ show: false, type: '', message: '' });
    }, 3000);
  };

  const saveToServer = async (updates) => {
    try {
      const response = await fetch(`${API_BASE}/api/config`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updates)
      });

      if (response.ok) {
        showAlert('success', '✅ บันทึกสำเร็จ!');
        await loadConfig();
      } else {
        showAlert('error', '❌ บันทึกไม่สำเร็จ');
      }
    } catch (error) {
      showAlert('error', '❌ เกิดข้อผิดพลาด: ' + error.message);
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
      showAlert('success', '✅ Export สำเร็จ!');
    } catch (error) {
      showAlert('error', '❌ Export ไม่สำเร็จ: ' + error.message);
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
          showAlert('success', '✅ Import สำเร็จ!');
          await loadConfig();
        }
      } catch (error) {
        showAlert('error', '❌ Import ไม่สำเร็จ: ' + error.message);
      }
    };
    reader.readAsText(file);
  };

  const resetToDefault = async () => {
    if (!window.confirm('คุณแน่ใจหรือไม่ที่จะรีเซ็ตเป็นค่าเริ่มต้น?')) return;

    try {
      const response = await fetch(`${API_BASE}/api/config/reset`, { method: 'POST' });
      if (response.ok) {
        showAlert('success', '✅ รีเซ็ตสำเร็จ!');
        await loadConfig();
      }
    } catch (error) {
      showAlert('error', '❌ เกิดข้อผิดพลาด: ' + error.message);
    }
  };

  const resetQuestionPrompt = async () => {
    if (!window.confirm('รีเซ็ต Prompt คำถามเป็นค่าเริ่มต้น?')) return;

    try {
      const response = await fetch(`${API_BASE}/api/config/default/question_prompt`);
      const data = await response.json();
      setConfig(prev => ({ ...prev, question_generation_prompt: data.prompt }));
      showAlert('success', '✅ รีเซ็ตสำเร็จ!');
    } catch (error) {
      showAlert('error', '❌ เกิดข้อผิดพลาด: ' + error.message);
    }
  };

  const resetAnalysisPrompt = async () => {
    if (!window.confirm('รีเซ็ต Prompt วิเคราะห์เป็นค่าเริ่มต้น?')) return;

    try {
      const response = await fetch(`${API_BASE}/api/config/default/analysis_prompt`);
      const data = await response.json();
      setConfig(prev => ({ ...prev, analysis_prompt: data.prompt }));
      showAlert('success', '✅ รีเซ็ตสำเร็จ!');
    } catch (error) {
      showAlert('error', '❌ เกิดข้อผิดพลาด: ' + error.message);
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

  return (
    <div className="min-h-screen bg-[#0B0C0F] text-gray-100 p-5">
      <div className="max-w-6xl mx-auto bg-white rounded-3xl shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="bg-gradient-to-r from-blue-600 to-purple-600 text-white p-8 flex justify-between items-center">
          <h1 className="text-4xl font-bold">⚙️ Configuration</h1>
          <button
            onClick={() => onNavigateToInterview && onNavigateToInterview()}
            className="bg-white/20 hover:bg-white/30 px-5 py-2 rounded-lg font-semibold transition-colors cursor-pointer"
          >
            🏠 กลับหน้าหลัก
          </button>
        </div>

        <div className="p-8">
          {/* Alert */}
          {alert.show && (
            <div className={`p-4 rounded-lg mb-5 ${
              alert.type === 'success' 
                ? 'bg-green-100 text-green-800 border border-green-300' 
                : 'bg-red-100 text-red-800 border border-red-300'
            }`}>
              {alert.message}
            </div>
          )}

          {/* Tabs */}
          <div className="flex gap-3 mb-8 border-b-2 border-gray-200">
            {[
              { id: 'code-types', label: '📋 ประเภทโค้ด' },
              { id: 'question-prompt', label: '❓ Prompt คำถาม' },
              { id: 'analysis-prompt', label: '🔍 Prompt วิเคราะห์' },
              { id: 'examples', label: '💡 ตัวอย่างคำถาม' },
              { id: 'model', label: '🤖 Model Settings' }
            ].map(tab => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`px-6 py-3 font-semibold text-lg transition-all border-b-4 ${
                  activeTab === tab.id
                    ? 'text-blue-600 border-blue-600'
                    : 'text-gray-600 border-transparent hover:text-blue-600'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>

          {/* Tab: Code Types */}
          {activeTab === 'code-types' && (
            <div className="bg-gray-50 p-6 rounded-2xl">
              <h3 className="text-2xl font-bold text-blue-600 mb-4">📋 ประเภทโค้ดทั้งหมด</h3>
              <p className="text-gray-600 mb-5">กำหนดประเภทโค้ดและคำอธิบายแต่ละประเภท</p>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                {Object.entries(config.code_types).map(([type, description]) => (
                  <div key={type} className="bg-white p-5 rounded-xl border-2 border-gray-200">
                    <h4 className="text-blue-600 font-semibold mb-3">{type}</h4>
                    <textarea
                      value={description}
                      onChange={(e) => setConfig(prev => ({
                        ...prev,
                        code_types: { ...prev.code_types, [type]: e.target.value }
                      }))}
                      className="w-full min-h-[80px] px-3 py-2 border-2 border-gray-300 rounded-lg focus:outline-none focus:border-blue-500 text-gray-800"
                    />
                  </div>
                ))}
              </div>
              
              <button onClick={saveCodeTypes} className="mt-5 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white px-6 py-3 rounded-xl font-semibold transition-all">
                💾 บันทึก
              </button>
            </div>
          )}

          {/* Tab: Question Prompt */}
          {activeTab === 'question-prompt' && (
            <div className="bg-gray-50 p-6 rounded-2xl">
              <h3 className="text-2xl font-bold text-blue-600 mb-4">❓ Prompt Template สำหรับสร้างคำถาม</h3>
              
              <div className="bg-blue-50 p-4 rounded-lg border-l-4 border-blue-600 mb-5">
                <h4 className="text-blue-600 font-semibold mb-2">📌 ตัวแปรที่ใช้ได้:</h4>
                <div className="flex flex-wrap gap-2">
                  {['{topic}', '{history}', '{target_code}', '{target_description}', '{examples}'].map(tag => (
                    <span key={tag} className="bg-blue-600 text-white px-3 py-1 rounded text-sm font-mono">
                      {tag}
                    </span>
                  ))}
                </div>
              </div>
              
              <textarea
                value={config.question_generation_prompt}
                onChange={(e) => setConfig(prev => ({ ...prev, question_generation_prompt: e.target.value }))}
                className="w-full min-h-[200px] px-4 py-3 border-2 border-gray-300 rounded-xl font-mono text-gray-800 focus:outline-none focus:border-blue-500"
              />
              
              <div className="mt-5 flex gap-3">
                <button onClick={saveQuestionPrompt} className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white px-6 py-3 rounded-xl font-semibold transition-all">
                  💾 บันทึก
                </button>
                <button onClick={resetQuestionPrompt} className="bg-gray-600 hover:bg-gray-700 text-white px-6 py-3 rounded-xl font-semibold transition-all">
                  🔄 รีเซ็ต
                </button>
              </div>
            </div>
          )}

          {/* Tab: Analysis Prompt */}
          {activeTab === 'analysis-prompt' && (
            <div className="bg-gray-50 p-6 rounded-2xl">
              <h3 className="text-2xl font-bold text-blue-600 mb-4">🔍 Prompt Template สำหรับวิเคราะห์คำตอบ</h3>
              
              <div className="bg-blue-50 p-4 rounded-lg border-l-4 border-blue-600 mb-5">
                <h4 className="text-blue-600 font-semibold mb-2">📌 ตัวแปรที่ใช้ได้:</h4>
                <div className="flex flex-wrap gap-2">
                  {['{target_code}', '{question}', '{answer}', '{code_types_description}'].map(tag => (
                    <span key={tag} className="bg-blue-600 text-white px-3 py-1 rounded text-sm font-mono">
                      {tag}
                    </span>
                  ))}
                </div>
              </div>
              
              <textarea
                value={config.analysis_prompt}
                onChange={(e) => setConfig(prev => ({ ...prev, analysis_prompt: e.target.value }))}
                className="w-full min-h-[200px] px-4 py-3 border-2 border-gray-300 rounded-xl font-mono text-gray-800 focus:outline-none focus:border-blue-500"
              />
              
              <div className="mt-5 flex gap-3">
                <button onClick={saveAnalysisPrompt} className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white px-6 py-3 rounded-xl font-semibold transition-all">
                  💾 บันทึก
                </button>
                <button onClick={resetAnalysisPrompt} className="bg-gray-600 hover:bg-gray-700 text-white px-6 py-3 rounded-xl font-semibold transition-all">
                  🔄 รีเซ็ต
                </button>
              </div>
            </div>
          )}

          {/* Tab: Example Questions */}
          {activeTab === 'examples' && (
            <div className="bg-gray-50 p-6 rounded-2xl">
              <h3 className="text-2xl font-bold text-blue-600 mb-4">💡 ตัวอย่างคำถามสำหรับแต่ละประเภท</h3>
              <p className="text-gray-600 mb-5">ใช้ {'{product}'} เป็นตัวแปรสำหรับชื่อสินค้า</p>
              
              <div className="space-y-5">
                {Object.entries(config.example_questions).map(([type, questions]) => (
                  <div key={type} className="bg-white p-5 rounded-xl border-2 border-gray-200">
                    <h4 className="text-blue-600 font-semibold mb-3">{type}</h4>
                    <div className="space-y-2">
                      {questions.map((question, index) => (
                        <div key={index} className="flex gap-2">
                          <input
                            type="text"
                            value={question}
                            onChange={(e) => updateExampleQuestion(type, index, e.target.value)}
                            className="flex-1 px-3 py-2 border-2 border-gray-300 rounded-lg focus:outline-none focus:border-blue-500 text-gray-800"
                          />
                          <button
                            onClick={() => removeExampleQuestion(type, index)}
                            className="bg-red-500 hover:bg-red-600 text-white px-4 py-2 rounded-lg transition-colors"
                          >
                            🗑️
                          </button>
                        </div>
                      ))}
                    </div>
                    <button
                      onClick={() => addExampleQuestion(type)}
                      className="mt-3 bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg transition-colors"
                    >
                      ➕ เพิ่มคำถาม
                    </button>
                  </div>
                ))}
              </div>
              
              <button onClick={saveExamples} className="mt-5 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white px-6 py-3 rounded-xl font-semibold transition-all">
                💾 บันทึก
              </button>
            </div>
          )}

          {/* Tab: Model Settings */}
          {activeTab === 'model' && (
            <div className="bg-gray-50 p-6 rounded-2xl">
              <h3 className="text-2xl font-bold text-blue-600 mb-4">🤖 Model Settings</h3>
              
              <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
                <div>
                  <label className="block font-semibold mb-2 text-gray-700">Model:</label>
                  <select
                    value={config.model_settings.model}
                    onChange={(e) => setConfig(prev => ({
                      ...prev,
                      model_settings: { ...prev.model_settings, model: e.target.value }
                    }))}
                    className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:outline-none focus:border-blue-500 text-gray-800"
                  >
                    <option value="gpt-4o">gpt-4o (แนะนำ)</option>
                    <option value="gpt-4-turbo">gpt-4-turbo</option>
                    <option value="gpt-4">gpt-4</option>
                    <option value="gpt-3.5-turbo">gpt-3.5-turbo</option>
                  </select>
                </div>
                
                <div>
                  <label className="block font-semibold mb-2 text-gray-700">
                    Temperature (คำถาม): <span className="text-blue-600">{config.model_settings.temperature_question}</span>
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
                    className="w-full"
                  />
                </div>
                
                <div>
                  <label className="block font-semibold mb-2 text-gray-700">
                    Temperature (วิเคราะห์): <span className="text-blue-600">{config.model_settings.temperature_analysis}</span>
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
                    className="w-full"
                  />
                </div>
              </div>
              
              <button onClick={saveModelSettings} className="mt-5 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white px-6 py-3 rounded-xl font-semibold transition-all">
                💾 บันทึก
              </button>
            </div>
          )}

          {/* Config Management */}
          <div className="bg-gray-50 p-6 rounded-2xl mt-8">
            <h3 className="text-2xl font-bold text-blue-600 mb-4">🔧 การจัดการ Config</h3>
            <div className="flex flex-wrap gap-3">
              <button onClick={exportConfig} className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white px-6 py-3 rounded-xl font-semibold transition-all">
                📤 Export Config
              </button>
              <button onClick={() => document.getElementById('importFile').click()} className="bg-gray-600 hover:bg-gray-700 text-white px-6 py-3 rounded-xl font-semibold transition-all">
                📥 Import Config
              </button>
              <button onClick={resetToDefault} className="bg-red-600 hover:bg-red-700 text-white px-6 py-3 rounded-xl font-semibold transition-all">
                🔄 รีเซ็ตเป็นค่าเริ่มต้น
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
