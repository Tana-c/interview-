import React from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faFlagCheckered, faChartLine } from '@fortawesome/free-solid-svg-icons';

function CompletionMessage() {
  return (
    <div className="mt-8 p-6 bg-card rounded-2xl border border-border animate-fadeIn shadow-md">
      <div className="flex items-start gap-4">
        <div className="w-12 h-12 rounded-full bg-primary text-white flex items-center justify-center flex-shrink-0">
          <FontAwesomeIcon icon={faFlagCheckered} className="text-xl" />
        </div>
        <div className="flex-1 text-text">
          <h3 className="text-xl font-bold mb-2">เสร็จสมบูรณ์!</h3>
          <p className="mb-4 leading-relaxed text-textMuted">
            ขอบคุณสำหรับการให้ข้อมูลที่ละเอียดและมีคุณค่า ระบบ AI กำลังวิเคราะห์และสังเคราะห์ Insights จากคำตอบของคุณ
          </p>
          <button className="px-6 py-3 bg-primary text-white hover:bg-black rounded-lg font-medium transition-all shadow">
            <FontAwesomeIcon icon={faChartLine} className="mr-2" />
            ดูรายงานสรุป Insights
          </button>
        </div>
      </div>
    </div>
  );
}

export default CompletionMessage;

