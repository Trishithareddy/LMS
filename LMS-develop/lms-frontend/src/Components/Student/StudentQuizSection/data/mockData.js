export const mockQuizzes = [
  {
    id: 'quiz-1',
    title: 'JavaScript Fundamentals',
    description: 'Test your knowledge of JavaScript basics including variables, functions, and DOM manipulation.',
    instructions: 'Read each question carefully. You have 30 minutes to complete this quiz. Make sure to review your answers before submitting.',
    totalMarks: 50,
    timeLimit: 30,
    status: 'active',
    startDate: new Date('2024-01-15'),
    endDate: new Date('2024-12-31'),
    allowReattempt: false,
    showCorrectAnswers: true,
    passingPercentage: 70,
    questions: [
      {
        id: 'q1',
        type: 'mcq-single',
        question: 'Which of the following is the correct way to declare a variable in JavaScript?',
        options: ['var name = "John";', 'variable name = "John";', 'v name = "John";', 'declare name = "John";'],
        correctAnswer: 'var name = "John";',
        marks: 5
      },
      {
        id: 'q2',
        type: 'mcq-multiple',
        question: 'Which of the following are valid JavaScript data types? (Select all that apply)',
        options: ['string', 'number', 'boolean', 'character'],
        correctAnswer: ['string', 'number', 'boolean'],
        marks: 10
      },
      {
        id: 'q3',
        type: 'true-false',
        question: 'JavaScript is a statically typed language.',
        correctAnswer: 'false',
        marks: 5
      },
      {
        id: 'q4',
        type: 'short-answer',
        question: 'What does DOM stand for in web development?',
        correctAnswer: 'Document Object Model',
        marks: 10
      },
      {
        id: 'q5',
        type: 'mcq-single',
        question: 'Which method is used to add an element to the end of an array?',
        options: ['push()', 'pop()', 'shift()', 'unshift()'],
        correctAnswer: 'push()',
        marks: 5
      },
      {
        id: 'q6',
        type: 'mcq-single',
        question: 'What is the correct syntax for creating a function in JavaScript?',
        options: [
          'function myFunction() {}',
          'create myFunction() {}',
          'function = myFunction() {}',
          'def myFunction() {}'
        ],
        correctAnswer: 'function myFunction() {}',
        marks: 5
      },
      {
        id: 'q7',
        type: 'mcq-multiple',
        question: 'Which of the following are JavaScript loop types? (Select all that apply)',
        options: ['for', 'while', 'foreach', 'do-while'],
        correctAnswer: ['for', 'while', 'do-while'],
        marks: 10
      }
    ]
  },
  {
    id: 'quiz-2',
    title: 'React Components & Hooks',
    description: 'Advanced concepts in React including components, hooks, and state management.',
    instructions: 'This quiz covers React fundamentals. You have 45 minutes to complete all questions.',
    totalMarks: 75,
    timeLimit: 45,
    status: 'active',
    startDate: new Date('2024-01-20'),
    endDate: new Date('2024-12-31'),
    allowReattempt: true,
    showCorrectAnswers: true,
    passingPercentage: 75,
    questions: [
      {
        id: 'q1',
        type: 'mcq-single',
        question: 'Which hook is used to manage state in functional components?',
        options: ['useEffect', 'useState', 'useContext', 'useReducer'],
        correctAnswer: 'useState',
        marks: 10
      },
      {
        id: 'q2',
        type: 'true-false',
        question: 'useEffect runs after every render by default.',
        correctAnswer: 'true',
        marks: 5
      },
      {
        id: 'q3',
        type: 'mcq-multiple',
        question: 'Which of the following are valid ways to pass data to components?',
        options: ['Props', 'Context', 'State', 'Global variables'],
        correctAnswer: ['Props', 'Context', 'State'],
        marks: 15
      },
      {
        id: 'q4',
        type: 'short-answer',
        question: 'What is JSX in React?',
        correctAnswer: 'JavaScript XML',
        marks: 15
      },
      {
        id: 'q5',
        type: 'mcq-single',
        question: 'What is the correct way to handle events in React?',
        options: [
          'onClick="handleClick()"',
          'onClick={handleClick}',
          'onclick={handleClick}',
          'onClick={handleClick()}'
        ],
        correctAnswer: 'onClick={handleClick}',
        marks: 10
      },
      {
        id: 'q6',
        type: 'mcq-single',
        question: 'Which of the following is used to optimize performance by memoizing components?',
        options: ['React.memo', 'useState', 'useEffect', 'useCallback'],
        correctAnswer: 'React.memo',
        marks: 10
      },
      {
        id: 'q7',
        type: 'true-false',
        question: 'Keys in React lists should be unique among siblings.',
        correctAnswer: 'true',
        marks: 5
      },
      {
        id: 'q8',
        type: 'short-answer',
        question: 'What does the dependency array in useEffect control?',
        correctAnswer: 'When the effect runs',
        marks: 5
      }
    ]
  },
  {
    id: 'quiz-3',
    title: 'Database Design Principles',
    description: 'Understanding of database normalization, relationships, and SQL queries.',
    instructions: 'Answer all questions about database concepts. Time limit: 40 minutes.',
    totalMarks: 60,
    timeLimit: 40,
    status: 'upcoming',
    startDate: new Date('2024-02-01'),
    endDate: new Date('2024-02-28'),
    allowReattempt: false,
    showCorrectAnswers: false,
    passingPercentage: 60,
    questions: []
  },
  {
    id: 'quiz-4',
    title: 'Web Security Fundamentals',
    description: 'Basic concepts of web application security and best practices.',
    instructions: 'This quiz has expired. Please contact your instructor for a makeup exam.',
    totalMarks: 40,
    timeLimit: 25,
    status: 'expired',
    startDate: new Date('2024-01-01'),
    endDate: new Date('2024-01-10'),
    allowReattempt: false,
    showCorrectAnswers: true,
    passingPercentage: 65,
    questions: []
  }
];

export const mockAttempts = [
  {
    id: 'attempt-1',
    quizId: 'quiz-1',
    studentId: 'student-1',
    answers: {},
    markedForReview: [],
    status: 'in-progress'
  }
];