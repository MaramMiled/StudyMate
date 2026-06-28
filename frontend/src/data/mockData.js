export const mockUser = {
  id: 'user-1',
  name: 'Maram Milad',
  email: 'maram.miled003@gmail.com',
  initials: 'MM',
};

export const mockSessions = [
  {
    id: 'session-1',
    name: 'Machine Learning Model Evaluation',
    lastUpdated: '10 May 2026',
    fileCount: 1,
    subject: 'Computer Science',
    files: ['Ch5-Evaluation.pdf'],
  },
  {
    id: 'session-2',
    name: 'Organic Chemistry Finals',
    lastUpdated: 'Yesterday',
    fileCount: 2,
    subject: 'Chemistry',
    files: ['orgo_textbook_ch8-10.pdf', 'reaction_mechanisms.pdf'],
  },
];

export const mockMessages = [
  {
    id: 'msg-1',
    role: 'assistant',
    content: "Hello! I've analyzed your uploaded documents. I'm ready to help you study. You can ask me to explain concepts, generate quizzes, create summaries, or help you build a study plan. What would you like to start with?",
    timestamp: '10:02 AM',
  },
  {
    id: 'msg-2',
    role: 'user',
    content: 'Can you explain what gradient descent is in simple terms?',
    timestamp: '10:04 AM',
  },
  {
    id: 'msg-3',
    role: 'assistant',
    content: 'Great question! **Gradient descent** is an optimization algorithm used to minimize a function — in ML, that\'s usually the loss function.\n\nThink of it like this: imagine you\'re blindfolded on a hilly landscape and you want to reach the lowest valley. You feel the slope under your feet and take a small step in the direction that goes downhill. You keep doing this until you can\'t go any lower.\n\nThe **learning rate** controls how big each step is. Want me to show how it relates to your lecture notes?',
    timestamp: '10:04 AM',
  },
];

export const mockReplies = [
  "Based on your uploaded documents, I found a relevant explanation in Chapter 3. The concept relates to how neural networks adjust weights during training using backpropagation combined with gradient descent.",
  "Great question! Let me break this down from your lecture slides. There are three key principles here that your professor emphasized: the theoretical foundation, the practical application, and common exam traps to watch out for.",
  "I've analyzed this concept across all your uploaded materials. Your textbook defines it formally, while the lecture notes give a more intuitive explanation. For exam purposes, I'd focus on the lecture's three-step framework.",
  "That's covered in pages 47–52 of your PDF. The key insight is that this process is iterative — each step depends on the output of the previous one. Want me to create a quiz on this topic?",
  "Looking at your study materials, this concept appears 8 times across your documents — it's clearly important! The simplest way to think about it: imagine calibrating a measuring instrument until the error is negligible.",
];

export const getSessionById = (sessions, id) => sessions.find(s => s.id === id) || null;