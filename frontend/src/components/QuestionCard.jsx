import React from 'react';
import { ChevronRight, ChevronDown, Send, Check, Sparkles } from 'lucide-react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faLightbulb } from '@fortawesome/free-solid-svg-icons';

function QuestionCard({ 
  question, 
  isExpanded, 
  isActive, 
  answers, 
  followUps, 
  insights, 
  isAITyping, 
  handleSubmit, 
  setInputValue, 
  inputValue, 
  toggleCardExpansion 
}) {
  const hasAnswers = answers[question.id] && answers[question.id].length > 0;
  const questionFollowUps = followUps[question.id] || [];
  const insight = insights[question.id];

  return (
    <div className={`rounded-3xl border transition-all duration-300 ${
      isActive
        ? 'bg-surface shadow-soft border-primary/50'
        : 'bg-card hover:bg-cardHover border-border'
    }`}>
      <div 
        className="p-5 cursor-pointer flex items-center justify-between"
        onClick={() => !isActive && toggleCardExpansion(question.id)}
      >
        <div className="flex-1">
          <div className="flex items-center gap-3 mb-2">
            <span className="text-xs font-semibold text-white uppercase tracking-wide bg-primary px-3 py-1 rounded-md">
              {question.category}
            </span>
            {insight && (
              <div className="flex items-center gap-1">
                <Check className="w-4 h-4 text-primary" />
                <span className="text-xs text-primary font-medium">ตอบแล้ว</span>
              </div>
            )}
          </div>
          <h3 className="text-lg font-semibold text-text leading-relaxed">
            {question.text}
          </h3>
          {hasAnswers && !isExpanded && !isActive && (
            <p className="text-sm text-textMuted mt-2 line-clamp-1">
              {answers[question.id][0]}
            </p>
          )}
        </div>
        
        {!isActive && (
          <button className="ml-4 transition-transform">
            {isExpanded ? (
              <ChevronDown className="w-5 h-5 text-textMuted" />
            ) : (
              <ChevronRight className="w-5 h-5 text-textMuted" />
            )}
          </button>
        )}
      </div>

      {(isExpanded || isActive) && (
        <div className="px-5 pb-5 space-y-4">
          {hasAnswers && answers[question.id].map((answer, idx) => (
            <div key={idx} className="space-y-3">
              {idx > 0 && questionFollowUps[idx - 1] && (
                <div className="flex gap-3 animate-fadeIn">
                  <div className="w-10 h-10 rounded-full bg-gradient-to-br from-purple-500 to-blue-500 flex items-center justify-center flex-shrink-0">
                    <Sparkles className="w-5 h-5 text-white" />
                  </div>
                  <div className="bg-[#262930] rounded-2xl rounded-tl-sm px-4 py-3 max-w-2xl">
                    <p className="text-sm text-text">
                      {questionFollowUps[idx - 1]}
                    </p>
                  </div>
                </div>
              )}
              
                <div className="flex gap-3 justify-end animate-fadeIn">
                  <div className="bg-primary rounded-2xl rounded-tr-sm px-4 py-3 max-w-2xl shadow-lg">
                    <p className="text-sm text-white leading-relaxed">
                    {answer}
                  </p>
                </div>
                  <div className="w-10 h-10 rounded-full border border-primary flex items-center justify-center flex-shrink-0 text-primary font-semibold">
                    คุณ
                </div>
              </div>
            </div>
          ))}

          {isActive && !insight && questionFollowUps.length > 0 && 
           questionFollowUps.length > (answers[question.id]?.length || 0) - 1 && (
            <div className="flex gap-3 animate-fadeIn">
              <div className="w-10 h-10 rounded-full bg-gradient-to-br from-purple-500 to-blue-500 flex items-center justify-center flex-shrink-0">
                <Sparkles className="w-5 h-5 text-white" />
              </div>
              <div className="bg-[#262930] rounded-2xl rounded-tl-sm px-4 py-3 max-w-2xl">
                <p className="text-sm text-text">
                  {questionFollowUps[questionFollowUps.length - 1]}
                </p>
              </div>
            </div>
          )}

          {isActive && isAITyping && (
            <div className="flex gap-3 animate-fadeIn">
              <div className="w-10 h-10 rounded-full bg-gradient-to-br from-purple-500 to-blue-500 flex items-center justify-center flex-shrink-0">
                <Sparkles className="w-5 h-5 text-white" />
              </div>
              <div className="bg-[#262930] rounded-2xl px-4 py-3">
                <div className="flex gap-1">
                  <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce [animation-delay:0ms]"></div>
                  <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce [animation-delay:150ms]"></div>
                  <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce [animation-delay:300ms]"></div>
                </div>
              </div>
            </div>
          )}

          {insight && (
            <div className="mt-4 p-6 bg-card rounded-xl border border-border animate-fadeIn">
              <div className="flex items-center gap-2 mb-4">
                <div className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center text-white">
                  <FontAwesomeIcon icon={faLightbulb} />
                </div>
                <h4 className="text-sm font-bold text-text uppercase tracking-wide">
                  Insight Schema
                </h4>
              </div>
              <div className="space-y-3">
                <div className="flex items-start gap-3 p-3 bg-cardHover rounded-lg border border-border">
                  <span className="px-2.5 py-1 bg-primary text-white text-xs rounded-md font-bold uppercase flex-shrink-0">
                    Desire
                  </span>
                  <span className="text-sm text-text flex-1 pt-0.5">
                    {insight.desire}
                  </span>
                </div>
                <div className="flex items-start gap-3 p-3 bg-cardHover rounded-lg border border-border">
                  <span className="px-2.5 py-1 bg-secondary text-white text-xs rounded-md font-bold uppercase flex-shrink-0">
                    Barrier
                  </span>
                  <span className="text-sm text-text flex-1 pt-0.5">
                    {insight.barrier}
                  </span>
                </div>
                <div className="flex items-start gap-3 p-3 bg-cardHover rounded-lg border border-border">
                  <span className="px-2.5 py-1 bg-gray-900 text-white text-xs rounded-md font-bold uppercase flex-shrink-0">
                    Action
                  </span>
                  <span className="text-sm text-text flex-1 pt-0.5">
                    {insight.action}
                  </span>
                </div>
              </div>
            </div>
          )}

          {isActive && !insight && (
            <div className="mt-4 animate-fadeIn">
                <div className="relative">
                <textarea
                  value={inputValue}
                  onChange={(e) => setInputValue(e.target.value)}
                  placeholder="เขียนคำตอบของคุณที่นี่... (กด Cmd+Enter เพื่อส่ง)"
                  className="w-full bg-inputBg text-text rounded-2xl px-4 py-3 min-h-[120px] resize-none focus:outline-none focus:ring-2 focus:ring-primary border border-border placeholder:text-textMuted"
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) {
                      e.preventDefault();
                      handleSubmit();
                    }
                  }}
                />
              </div>
                <div className="mt-3 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <span className="text-xs text-textMuted">
                  {questionFollowUps.length > 0 && `Follow-up ${questionFollowUps.length}/${question.followUpTemplates.length}`}
                </span>
                <button
                  onClick={handleSubmit}
                  disabled={!inputValue.trim() || isAITyping}
                    className="flex items-center gap-2 px-5 py-3 bg-primary hover:bg-black disabled:bg-gray-400 disabled:text-white disabled:cursor-not-allowed text-white rounded-2xl font-medium transition-all shadow-lg"
                >
                  <Send className="w-4 h-4" />
                  ส่งคำตอบ
                </button>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

export default QuestionCard;

