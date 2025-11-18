import React, { useState, useRef, useEffect } from 'react';

function AIInterviewer() {
  const [messages, setMessages] = useState([
    {
      type: 'system',
      text: 'เล่าให้ฟังหน่อยว่าคุณจัดลำดับความสำคัญของงานแต่ละวันอย่างไร?',
    },
    {
      type: 'user',
      text: 'ปกติผมจะเริ่มจากงานที่มีผลกระทบกับลูกค้าก่อน จากนั้นค่อยไล่งานที่เหลือ ตาม Deadline ครับ',
    },
    {
      type: 'ai',
      text: 'อะไรทำให้คุณเลือกใช้เกณฑ์นี้ในการจัดลำดับความสำคัญของงานครับ?',
    },
    {
      type: 'user',
      text: 'เพราะรู้สึกว่าถ้าลูกค้าได้รับผลกระทบน้อยที่สุด ทีมจะทำงานต่อได้ราบรื่น และปัญหาจะไม่ลุกลามครับ',
    },
  ]);
  const [inputValue, setInputValue] = useState('');
  const chatBoxRef = useRef(null);

  useEffect(() => {
    if (chatBoxRef.current) {
      chatBoxRef.current.scrollTop = chatBoxRef.current.scrollHeight;
    }
  }, [messages]);

  const handleSend = () => {
    const text = inputValue.trim();
    if (!text) return;
    
    setMessages((prev) => [
      ...prev,
      {
        type: 'user',
        text: text,
      },
    ]);
    setInputValue('');
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      handleSend();
    }
  };

  return (
    <div className="min-h-screen bg-[#0B0C0F] text-gray-100 font-sans">
      <div className="min-h-screen flex">
        {/* Sidebar */}
        <aside className="w-72 bg-[#101114] border-r border-[#26282D] p-4 flex flex-col">
          <div className="mb-4">
            <h1 className="text-xl font-semibold mb-1">AI Interviewer System</h1>
            <p className="text-sm text-gray-500">
              Qual at Scale – Thai Interview
            </p>
          </div>

          <button className="w-full mb-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-sm font-medium">
            เริ่มสัมภาษณ์
          </button>

          <div className="mt-2 flex-1 flex flex-col">
            <p className="text-xs text-gray-400 mb-2">รายการคำถาม</p>

            <div className="space-y-1 overflow-y-auto pr-1">
              {/* Q1 active */}
              <button className="w-full text-left px-3 py-2 rounded-lg text-sm transition-all bg-blue-700 text-white">
                <div className="flex items-center justify-between gap-2">
                  <span className="text-xs text-gray-200">Q1</span>
                  <span className="inline-block w-2 h-2 rounded-full bg-blue-300"></span>
                </div>
                <div className="mt-1 line-clamp-2">
                  เล่าให้ฟังหน่อยว่าคุณจัดลำดับความสำคัญของงานแต่ละวันอย่างไร?
                </div>
              </button>

              {/* Q2 completed */}
              <button className="w-full text-left px-3 py-2 rounded-lg text-sm transition-all bg-transparent hover:bg-[#181A1F]">
                <div className="flex items-center justify-between gap-2">
                  <span className="text-xs text-gray-400">Q2</span>
                  <span className="inline-block w-2 h-2 rounded-full bg-green-400"></span>
                </div>
                <div className="mt-1 line-clamp-2">
                  ครั้งล่าสุดที่คุณเจอปัญหาในงาน คุณแก้ไขอย่างไร?
                </div>
              </button>

              {/* Q3 pending */}
              <button className="w-full text-left px-3 py-2 rounded-lg text-sm transition-all bg-transparent hover:bg-[#181A1F]">
                <div className="flex items-center justify-between gap-2">
                  <span className="text-xs text-gray-400">Q3</span>
                  <span className="inline-block w-2 h-2 rounded-full bg-gray-500"></span>
                </div>
                <div className="mt-1 line-clamp-2">
                  อะไรคือแรงจูงใจหลักในการทำงานของคุณ?
                </div>
              </button>
            </div>
          </div>
        </aside>

        {/* Main panel */}
        <main className="flex-1 p-8 flex flex-col gap-6">
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
                Status:
                <span className="font-semibold text-blue-400"> active</span>
              </div>
            </div>

            {/* Chat area */}
            <div
              ref={chatBoxRef}
              className="bg-[#101114] rounded-xl p-4 mb-4 max-h-72 overflow-y-auto space-y-3"
            >
              {messages.map((message, index) => (
                <div
                  key={index}
                  className={
                    message.type === 'user'
                      ? 'flex items-end justify-end'
                      : 'flex items-start'
                  }
                >
                  <div
                    className={`max-w-[80%] px-3 py-2 rounded-2xl text-sm ${
                      message.type === 'user'
                        ? 'bg-[#1E3A8A]'
                        : message.type === 'system'
                        ? 'bg-[#111317]'
                        : 'bg-[#262930]'
                    }`}
                  >
                    {message.text}
                  </div>
                </div>
              ))}
            </div>

            {/* Insight Tags */}
            <div className="mt-3 flex flex-wrap gap-2 text-xs">
              <span className="inline-flex items-center px-3 py-1 rounded-full bg-blue-600 bg-opacity-90">
                Desire: งานไหลลื่น ไม่กระทบลูกค้า
              </span>
              <span className="inline-flex items-center px-3 py-1 rounded-full bg-red-600 bg-opacity-90">
                Barrier: งานด่วนแทรกบ่อย ทำให้เสียโฟกัส
              </span>
              <span className="inline-flex items-center px-3 py-1 rounded-full bg-green-600 bg-opacity-90">
                Action: ใช้เกณฑ์ลูกค้าและ Deadline เป็นตัวตั้ง
              </span>
            </div>

            {/* Input */}
            <div className="mt-4 flex gap-3">
              <input
                type="text"
                placeholder="พิมพ์คำตอบของคุณที่นี่..."
                value={inputValue}
                onChange={(e) => setInputValue(e.target.value)}
                onKeyDown={handleKeyDown}
                className="flex-1 px-4 py-3 rounded-xl bg-[#101114] border border-[#26282D] focus:outline-none focus:border-blue-500 text-sm"
              />
              <button
                onClick={handleSend}
                className="px-6 py-3 rounded-xl bg-blue-600 hover:bg-blue-700 text-sm font-semibold"
              >
                ส่งคำตอบ
              </button>
            </div>
          </section>

          {/* Other Questions */}
          <section>
            <h3 className="text-sm text-gray-400 mb-2">
              คำถามอื่น ๆ ในแบบสัมภาษณ์
            </h3>
            <div className="space-y-2">
              {/* Collapsed Q2 */}
              <button className="w-full text-left px-4 py-3 rounded-xl bg-[#181A1F] hover:bg-[#1F2228] border border-[#26282D] flex justify-between items-center">
                <div className="flex-1">
                  <p className="text-xs text-gray-500">PROBLEM SOLVING</p>
                  <p className="text-sm line-clamp-1">
                    ครั้งล่าสุดที่คุณเจอปัญหาในงาน คุณแก้ไขอย่างไร?
                  </p>
                  <p className="text-xs text-blue-300 mt-1 line-clamp-1">
                    Insight: ต้องการการสื่อสารที่โปร่งใสและแก้ปัญหาอย่างเป็นระบบ
                  </p>
                </div>
                <div className="flex flex-col items-end gap-1 ml-4">
                  <span className="inline-block w-2 h-2 rounded-full bg-green-400"></span>
                  <span className="text-xs text-gray-500">completed</span>
                </div>
              </button>

              {/* Collapsed Q3 */}
              <button className="w-full text-left px-4 py-3 rounded-xl bg-[#181A1F] hover:bg-[#1F2228] border border-[#26282D] flex justify-between items-center">
                <div className="flex-1">
                  <p className="text-xs text-gray-500">MOTIVATION</p>
                  <p className="text-sm line-clamp-1">
                    อะไรคือแรงจูงใจหลักในการทำงานของคุณ?
                  </p>
                </div>
                <div className="flex flex-col items-end gap-1 ml-4">
                  <span className="inline-block w-2 h-2 rounded-full bg-gray-500"></span>
                  <span className="text-xs text-gray-500">pending</span>
                </div>
              </button>
            </div>
          </section>
        </main>
      </div>
    </div>
  );
}

export default AIInterviewer;

