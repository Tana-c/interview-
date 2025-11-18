import React from 'react';
import { Check, Circle, X } from 'lucide-react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faRobot } from '@fortawesome/free-solid-svg-icons';

function Sidebar({ 
  questions, 
  currentQuestionId, 
  insights, 
  expandedCards, 
  setCurrentQuestionId, 
  setExpandedCards,
  isMobileOpen = false,
  onClose = () => {}
}) {
  const getQuestionStatus = (qId) => {
    if (qId === currentQuestionId && !insights[qId]) return 'active';
    if (insights[qId]) return 'completed';
    return 'pending';
  };

  const completedCount = Object.keys(insights).length;
  const progress = (completedCount / questions.length) * 100;

  return (
    <>
      <div
        className={`fixed inset-0 bg-black/30 lg:hidden transition-opacity duration-300 ${
          isMobileOpen ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'
        }`}
        onClick={onClose}
      />
      <aside
        className={`fixed inset-y-0 left-0 z-40 w-72 sm:w-80 bg-sidebar border-r border-border overflow-y-auto transform transition-transform duration-300 lg:static lg:translate-x-0 ${
          isMobileOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'
        }`}
      >
        <div className="p-6 h-full flex flex-col text-text">
        {/* Header */}
          <div className="mb-6">
            <div className="flex items-center justify-between mb-4 lg:mb-6">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-2xl bg-primary text-white flex items-center justify-center shadow">
                  <FontAwesomeIcon icon={faRobot} className="text-xl" />
                </div>
                <div>
                  <h1 className="text-lg font-semibold">AI Interview</h1>
                  <p className="text-xs text-textMuted">Qual at Scale</p>
                </div>
              </div>
              <button
                className="lg:hidden text-textMuted hover:text-text transition"
                onClick={onClose}
                aria-label="Close menu"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Progress */}
            <div className="rounded-2xl border border-border bg-card p-4 shadow-sm">
              <div className="flex justify-between text-xs uppercase tracking-wide text-textMuted mb-2">
                <span className="font-semibold">ความคืบหน้า</span>
                <span className="font-semibold text-text">{completedCount}/{questions.length}</span>
              </div>
              <div className="h-2.5 rounded-full bg-border overflow-hidden">
                <div
                  className="h-full rounded-full bg-primary transition-all"
                  style={{ width: `${progress}%` }}
                />
              </div>
              <p className="mt-2 text-xs text-textMuted">
                {progress === 100 ? 'เสร็จสมบูรณ์!' : `เหลืออีก ${questions.length - completedCount} คำถาม`}
              </p>
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
                    onClose();
                  }}
                  className={`w-full text-left p-4 rounded-xl border transition-all ${
                    status === 'active' 
                      ? 'border-primary shadow-md bg-white'
                      : status === 'completed'
                      ? 'border-border bg-cardHover'
                      : 'border-dashed border-border bg-card'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <div className="flex-shrink-0">
                      {status === 'completed' ? (
                        <div className="w-8 h-8 rounded-lg bg-primary text-white flex items-center justify-center">
                          <Check className="w-5 h-5" />
                        </div>
                      ) : status === 'active' ? (
                        <div className="w-8 h-8 rounded-lg border border-primary flex items-center justify-center animate-pulse">
                          <Circle className="w-5 h-5 text-primary" />
                        </div>
                      ) : (
                        <div className="w-8 h-8 rounded-lg border border-border flex items-center justify-center">
                          <Circle className="w-5 h-5 text-textMuted" />
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
      </aside>
    </>
  );
}

export default Sidebar;

