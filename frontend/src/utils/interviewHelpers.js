/**
 * Helper functions for interview logic
 */

export const getQuestionStatus = (qId, currentQuestionId, insights) => {
  if (qId === currentQuestionId && !insights[qId]) return 'active';
  if (insights[qId]) return 'completed';
  return 'pending';
};

export const calculateProgress = (insights, totalQuestions) => {
  const completedCount = Object.keys(insights).length;
  return (completedCount / totalQuestions) * 100;
};

