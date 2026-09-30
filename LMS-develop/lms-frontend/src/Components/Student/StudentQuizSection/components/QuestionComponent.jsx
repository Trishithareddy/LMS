import React from 'react';

const QuestionComponent = ({ question, answer, onAnswerChange }) => {
  const handleSingleChoice = (value) => {
    onAnswerChange(question._id, value);
  };


  const handleTextAnswer = (value) => {
    onAnswerChange(question._id, value);
  };

  return (
    <div className="space-y-4">
      <h3 className="text-lg font-medium text-gray-900 leading-relaxed whitespace-pre-line">
        {question.question}
      </h3>

      {question.type === 'MCQ' && question.options && (
        <div className="space-y-3">
          {question.options.map((option, index) => (
            <label
              key={index}
              className="flex items-start gap-3 p-4 border border-gray-200 rounded-lg hover:bg-gray-50 cursor-pointer transition-colors"
            >
              <input
                type="radio"
                name={`question-${question._id}`}
                value={option}
                checked={answer === option}
                onChange={() => handleSingleChoice(option)}
                className="mt-1 w-4 h-4 text-blue-600 border-gray-300 focus:ring-blue-500"
              />
              <span className="text-gray-700 flex-1">{option}</span>
            </label>
          ))}
        </div>
      )}


      {question.type === 'True or False' && (
        <div className="space-y-3">
          <label className="flex items-center gap-3 p-4 border border-gray-200 rounded-lg hover:bg-gray-50 cursor-pointer transition-colors">
            <input
              type="radio"
              name={`question-${question._id}`}
              value="true"
              checked={answer === 'true'}
              onChange={() => handleSingleChoice('true')}
              className="w-4 h-4 text-blue-600 border-gray-300 focus:ring-blue-500"
            />
            <span className="text-gray-700">True</span>
          </label>
          <label className="flex items-center gap-3 p-4 border border-gray-200 rounded-lg hover:bg-gray-50 cursor-pointer transition-colors">
            <input
              type="radio"
              name={`question-${question._id}`}
              value="false"
              checked={answer === 'false'}
              onChange={() => handleSingleChoice('false')}
              className="w-4 h-4 text-blue-600 border-gray-300 focus:ring-blue-500"
            />
            <span className="text-gray-700">False</span>
          </label>
        </div>
      )}

      {(question.type === 'Very Short Answer' || question.type === 'Fill In the Blanks') && (
        <div>
          <textarea
            value={typeof answer === 'string' ? answer : ''}
            onChange={(e) => handleTextAnswer(e.target.value)}
            placeholder="Enter your answer here..."
            className="w-full p-4 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
            rows={4}
          />
          <p className="mt-2 text-sm text-gray-500">
            Provide a concise answer. Your response will be evaluated for accuracy.
          </p>
        </div>
      )}
    </div>
  );
};

export default QuestionComponent;