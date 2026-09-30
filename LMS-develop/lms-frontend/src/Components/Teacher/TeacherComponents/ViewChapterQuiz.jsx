import React, { useEffect, useState } from 'react';
import { CheckCircle, Circle, HelpCircle } from 'lucide-react';
import { Box, CircularProgress } from '@mui/material';
import axios from 'axios';
import { Clock, BookOpen, Calendar, AlertTriangle, CheckCircle2, XCircle, SquarePen, Trash2Icon, LucideEye, Home } from 'lucide-react';
import { useNavigate } from 'react-router-dom';



const MCQQuestion = ({ question, options, answer, index }) => {
  return (
    <div className="bg-white rounded-xl shadow-lg p-6 hover:shadow-xl transition-shadow duration-300 border border-gray-100">
      <div className="flex items-start gap-4 mb-4">
        <div className="shrink-0 w-10 h-10 bg-blue-600 text-white rounded-full flex items-center justify-center font-bold text-sm">
          {index + 1}
        </div>
        <div className="flex-1">
          <span className="inline-block px-3 py-1 bg-blue-100 text-blue-700 text-xs font-medium rounded-full mb-2">
            Multiple Choice
          </span>
          <h3 className="text-lg font-semibold text-gray-800 leading-relaxed">
            {question}
          </h3>
        </div>
      </div>

      <div className="space-y-3 mb-6">
        {options.map((option, optionIndex) => (
          <label
            key={optionIndex}
            className={`flex items-center p-3 rounded-lg border-2 cursor-pointer transition-all duration-200 ${option === answer
              ? 'border-green-300 bg-green-50 shadow-sm'
              : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'
              }`}
          >
            <input
              type="radio"
              name={`question-${index}`}
              value={option}
              checked={option === answer}
              readOnly
              className="w-4 h-4 text-green-600 border-gray-300 focus:ring-green-500"
            />
            <span className={`ml-3 text-sm font-medium ${option === answer ? 'text-green-800' : 'text-gray-700'
              }`}>
              {option}
            </span>
            {option === answer && (
              <CheckCircle className="ml-auto w-5 h-5 text-green-600" />
            )}
          </label>
        ))}
      </div>

      <div className="flex items-center gap-2 p-3 bg-green-50 rounded-lg border border-green-200">
        <CheckCircle className="w-4 h-4 text-green-600 shrink-0" />
        <span className="text-sm text-green-800">
          <span className="font-medium">Correct Answer:</span> {answer}
        </span>
      </div>
    </div>
  );
};

const TrueFalseQuestion = ({ question, answer, index }) => {
  return (
    <div className="bg-white rounded-xl shadow-lg p-6 hover:shadow-xl transition-shadow duration-300 border border-gray-100">
      <div className="flex items-start gap-4 mb-4">
        <div className="shrink-0 w-10 h-10 bg-purple-600 text-white rounded-full flex items-center justify-center font-bold text-sm">
          {index + 1}
        </div>
        <div className="flex-1">
          <span className="inline-block px-3 py-1 bg-purple-100 text-purple-700 text-xs font-medium rounded-full mb-2">
            True / False
          </span>
          <h3 className="text-lg font-semibold text-gray-800 leading-relaxed">
            {question}
          </h3>
        </div>
      </div>

      <div className="flex gap-4 mb-6">
        {["true", "false"].map((option) => (
          <button
            key={option}
            className={`flex-1 py-3 px-6 rounded-lg border-2 font-medium transition-all duration-200 ${option === answer
              ? 'border-green-300 bg-green-50 text-green-800 shadow-sm'
              : 'border-gray-200 bg-gray-50 text-gray-600 hover:border-gray-300'
              }`}
            disabled
          >
            {option ? 'True' : 'False'}
            {option === answer && (
              <CheckCircle className="inline-block ml-2 w-4 h-4" />
            )}
          </button>
        ))}
      </div>

      <div className="flex items-center gap-2 p-3 bg-green-50 rounded-lg border border-green-200">
        <CheckCircle className="w-4 h-4 text-green-600 shrink-0" />
        <span className="text-sm text-green-800">
          <span className="font-medium">Correct Answer:</span> {answer}
        </span>
      </div>
    </div>
  );
};

const SingleWordQuestion = ({ question, answer, index }) => {
  return (
    <div className="bg-white rounded-xl shadow-lg p-6 hover:shadow-xl transition-shadow duration-300 border border-gray-100">
      <div className="flex items-start gap-4 mb-4">
        <div className="shrink-0 w-10 h-10 bg-orange-600 text-white rounded-full flex items-center justify-center font-bold text-sm">
          {index + 1}
        </div>
        <div className="flex-1">
          <span className="inline-block px-3 py-1 bg-orange-100 text-orange-700 text-xs font-medium rounded-full mb-2">
            Single Word
          </span>
          <h3 className="text-lg font-semibold text-gray-800 leading-relaxed">
            {question}
          </h3>
        </div>
      </div>

      <div className="mb-6">
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Answer:
        </label>
        <input
          type="text"
          value={answer}
          readOnly
          className="w-full p-3 bg-green-50 border-2 border-green-300 rounded-lg text-green-800 font-medium focus:outline-none cursor-default"
        />
      </div>

      <div className="flex items-center gap-2 p-3 bg-green-50 rounded-lg border border-green-200">
        <CheckCircle className="w-4 h-4 text-green-600 shrink-0" />
        <span className="text-sm text-green-800">
          <span className="font-medium">Correct Answer:</span> {answer}
        </span>
      </div>
    </div>
  );
};

function ViewQuizDetails({ chapterId}) {
 

  if (!chapterId) {
    return (
      <div className="text-center mt-5">
        No chapter selected. Please select a chapter to view its quiz.
      </div>
    );
  }

  const [quize, setQuize] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const navigate = useNavigate();
  const getStatusConfig = (status) => {
    switch (status) {
      case 'active':
        return {
          bg: 'bg-green-50',
          text: 'text-green-700',
          icon: CheckCircle2,
          label: 'Active'
        };
      case 'inactive':
        return {
          bg: 'bg-red-50',
          text: 'text-red-700',
          icon: XCircle,
          label: 'Inactive'
        };
      default:
        return {
          bg: 'bg-gray-50',
          text: 'text-gray-700',
          icon: AlertTriangle,
          label: 'Unknown'
        };
    }
  };
  const statusConfig = getStatusConfig(quize?.status);
  const StatusIcon = statusConfig.icon;

  const fetchSingleQuiz = async () => {
    setIsLoading(true);

    try {
      const token = localStorage.getItem("token");

      const response = await axios.get(
        `${import.meta.env.VITE_API_URL}/chapter-quiz/get-chapter-quiz/${chapterId}`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );
      // console.log("Quiz data:", response.data);
      setQuize(response.data.quiz || null);

    } catch (error) {
      console.error("Error fetching Questions:", error);
    } finally {
      setIsLoading(false);
    }
  };
  useEffect(() => {
    fetchSingleQuiz();
  }, [chapterId]);

  if (isLoading) {
    return (
      <Box
        sx={{
          display: "flex",
          justifyContent: "center",
          padding: "20px",
          height: "100vh",
          alignItems: "center",
        }}
      >
        <CircularProgress />
      </Box>
    );
  }
  return (
    <div className="min-h-screen">
      {!quize ? (
        <div className="text-center mt-5">
          No quiz available for this chapter.
        </div>
      ) : (
        <div className="container mx-auto px-4 py-8">
          <div className=" mb-8 mx-auto max-w-4xl text-gray-800 p-6 rounded-lg shadow-md ">
            <div className="max-w-2xl mx-auto flex items-start justify-between gap-4">
              <h1 className=" text-4xl font-bold mb-2">
                {quize?.title || 'Quiz Title'}
              </h1>
              <div className={`flex items-center gap-1 px-3 py-1 rounded-full text-sm font-medium ${statusConfig.bg} ${statusConfig.text}`}>
                <StatusIcon size={14} />
                <span>{statusConfig.label}</span>
              </div>
            </div>


            <div className='max-w-2xl mx-auto flex justify-start items-center gap-4 mt-3'>
              {/* Quiz Details */}
              <div className="grid grid-cols-2 gap-4 mb-6">
                <div className="flex items-center gap-2 text-gray-600">
                  <BookOpen size={16} />
                  <span className="text-sm">{quize?.totalMarks} marks</span>
                </div>
                <div className="flex items-center gap-2 text-gray-600">
                  <Clock size={16} />
                  <span className="text-sm">{quize?.timeLimit} minutes</span>
                </div>

                <div className="flex items-center gap-2 text-gray-600">
                  <AlertTriangle size={16} />
                  <span className="text-sm">Pass: {quize?.passingPercentage}%</span>
                </div>
              </div>
            </div>
          </div>

          <div className="grid gap-6 md:gap-8 max-w-4xl mx-auto">
            {quize?.questions.map((quiz, index) => {
              switch (quiz.type) {
                case 'MCQ':
                  return (
                    <MCQQuestion
                      key={index}
                      question={quiz.question}
                      options={quiz.options || []}
                      answer={quiz.correctAnswer}
                      index={index}
                    />
                  );
                case 'True or False':
                  return (
                    <TrueFalseQuestion
                      key={index}
                      question={quiz.question}
                      answer={quiz.correctAnswer}
                      index={index}
                    />
                  );
                case 'Very Short Answer':
                  return (
                    <SingleWordQuestion
                      key={index}
                      question={quiz.question}
                      answer={quiz.correctAnswer}
                      index={index}
                    />
                  );
                case 'Fill In the Blanks':
                  return (
                    <SingleWordQuestion
                      key={index}
                      question={quiz.question}
                      answer={quiz.correctAnswer}
                      index={index}
                    />
                  );
                default:
                  return null;
              }
            })}
          </div>

        </div>
      )}

    </div>
  );
}

export default ViewQuizDetails;