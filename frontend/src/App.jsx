import React, { useState } from 'react';
import { Menu } from 'lucide-react';
import questionsData from './data/questions.json';
import insightExamples from './data/insightExamples.json';
import Sidebar from './components/Sidebar';
import QuestionCard from './components/QuestionCard';
import CompletionMessage from './components/CompletionMessage';
import { calculateProgress } from './utils/interviewHelpers';

function App() {
  const [currentQuestionId, setCurrentQuestionId] = useState('q1');
  const [answers, setAnswers] = useState({});
  const [followUps, setFollowUps] = useState({});
  const [insights, setInsights] = useState({});
  const [inputValue, setInputValue] = useState('');
  const [isAITyping, setIsAITyping] = useState(false);
  const [expandedCards, setExpandedCards] = useState(['q1']);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  const questions = questionsData.questions;

  const simulateAIResponse = (questionId, answerText) => {
    setIsAITyping(true);
    
    setTimeout(() => {
      const question = questions.find(q => q.id === questionId);
      const currentFollowUpCount = (followUps[questionId] || []).length;
      
      if (currentFollowUpCount < question.followUpTemplates.length) {
        const nextFollowUp = question.followUpTemplates[currentFollowUpCount];
        setFollowUps(prev => ({
          ...prev,
          [questionId]: [...(prev[questionId] || []), nextFollowUp]
        }));
      } else {
        const qIndex = questions.findIndex(q => q.id === questionId);
        const extractedInsight = insightExamples[qIndex] || insightExamples[0];
        
        setInsights(prev => ({
          ...prev,
          [questionId]: extractedInsight
        }));
        
        const currentIndex = questions.findIndex(q => q.id === questionId);
        if (currentIndex < questions.length - 1) {
          setTimeout(() => {
            const nextQuestionId = questions[currentIndex + 1].id;
            setCurrentQuestionId(nextQuestionId);
            setExpandedCards(prev => [...prev, nextQuestionId]);
          }, 800);
        }
      }
      setIsAITyping(false);
    }, 1200);
  };

  const handleSubmit = () => {
    console.log('hello world')
    if (!inputValue.trim()) return;

    setAnswers(prev => ({
      ...prev,
      [currentQuestionId]: [...(prev[currentQuestionId] || []), inputValue]
    }));

    simulateAIResponse(currentQuestionId, inputValue);
    setInputValue('');
  };

  const toggleCardExpansion = (questionId) => {
    setExpandedCards(prev => 
      prev.includes(questionId)
        ? prev.filter(id => id !== questionId)
        : [...prev, questionId]
    );
  };

  const completedCount = Object.keys(insights).length;
  const progress = calculateProgress(insights, questions.length);

  return (
    <div className="min-h-screen bg-background text-text">
      <div className="flex flex-col lg:flex-row lg:min-h-screen">
        <Sidebar
          questions={questions}
          currentQuestionId={currentQuestionId}
          insights={insights}
          expandedCards={expandedCards}
          setCurrentQuestionId={setCurrentQuestionId}
          setExpandedCards={setExpandedCards}
          isMobileOpen={isSidebarOpen}
          onClose={() => setIsSidebarOpen(false)}
        />

        <div className="flex-1 flex flex-col">
          <header className="sticky top-0 z-30 border-b border-border bg-background/90 backdrop-blur">
            <div className="flex items-center justify-between px-4 py-3 lg:px-10">
              <div>
                <p className="text-xs uppercase tracking-[0.4em] text-textMuted mb-1">AI INTERVIEWER</p>
                <h1 className="text-xl font-semibold">การสัมภาษณ์เชิงลึก</h1>
              </div>
              <button
                type="button"
                className="inline-flex items-center justify-center rounded-full border border-border p-3 text-text transition hover:bg-card lg:hidden"
                onClick={() => setIsSidebarOpen(true)}
              >
                <Menu className="w-5 h-5" />
              </button>
            </div>
          </header>

          <main className="flex-1 px-4 py-6 sm:px-6 lg:px-10">
            <div className="mx-auto max-w-5xl space-y-6 pb-10">
              <section className="rounded-3xl border border-border bg-surface shadow-soft p-5 sm:p-8">
                <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                  <p className="text-sm text-textMuted">
                    ตอบคำถามอย่างละเอียดเพื่อให้เราเข้าใจมุมมองและประสบการณ์ของคุณอย่างลึกซึ้ง
                  </p>
                  <div className="flex items-center gap-3 text-sm">
                    <div className="relative h-2.5 w-36 rounded-full bg-border">
                      <div
                        className="absolute inset-y-0 left-0 rounded-full bg-primary transition-all"
                        style={{ width: `${progress}%` }}
                      />
                    </div>
                    <span className="font-semibold">
                      {completedCount}/{questions.length} คำถาม
                    </span>
                  </div>
                </div>
              </section>

              <div className="space-y-5">
                {questions.map((q) => (
                  <QuestionCard
                    key={q.id}
                    answers={answers}
                    followUps={followUps}
                    insights={insights}
                    isAITyping={isAITyping}
                    handleSubmit={handleSubmit}
                    setInputValue={setInputValue}
                    inputValue={inputValue}
                    toggleCardExpansion={toggleCardExpansion}
                    question={q}
                    isExpanded={expandedCards.includes(q.id)}
                    isActive={currentQuestionId === q.id && !insights[q.id]}
                  />
                ))}
              </div>

              {completedCount === questions.length && <CompletionMessage />}
            </div>
          </main>
        </div>
      </div>
    </div>
  );
}

export default App;
