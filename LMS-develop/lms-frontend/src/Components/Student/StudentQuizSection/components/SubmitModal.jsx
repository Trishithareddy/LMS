import React from 'react';
import { AlertTriangle, Clock, CheckCircle, Flag, X } from 'lucide-react';

const SubmitModal = ({
  quiz,
  answeredCount,
  markedCount,
  onConfirm,
  onCancel,
  isLoading
}) => {
  const unansweredCount = quiz.questions.length - answeredCount;

  return (
    <div className="bg-[#F9F8F6]  bg-opacity-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-xl shadow-xl max-w-md w-full">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-orange-100 rounded-lg">
              <AlertTriangle className="text-orange-600" size={24} />
            </div>
            <div>
              <h2 className="text-xl font-semibold text-gray-900">Submit Quiz</h2>
              <p className="text-sm text-gray-600">Are you sure you want to submit?</p>
            </div>
          </div>
          <button
            onClick={onCancel}
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            <X size={24} />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-4">
          {/* Quiz Summary */}
          <div className="bg-gray-50 rounded-lg p-4">
            <h3 className="font-medium text-gray-900 mb-3">Quiz Summary</h3>
            <div className="grid grid-cols-3 gap-4 text-center">
              <div className="p-3 bg-green-100 rounded-lg">
                <div className="flex items-center justify-center mb-1">
                  <CheckCircle size={20} className="text-green-600" />
                </div>
                <div className="text-lg font-bold text-green-700">{answeredCount}</div>
                <div className="text-xs text-gray-600">Answered</div>
              </div>
              <div className="p-3 bg-yellow-100 rounded-lg">
                <div className="flex items-center justify-center mb-1">
                  <Flag size={20} className="text-yellow-600" />
                </div>
                <div className="text-lg font-bold text-yellow-700">{markedCount}</div>
                <div className="text-xs text-gray-600">Marked</div>
              </div>
              <div className="p-3 bg-red-100 rounded-lg">
                <div className="flex items-center justify-center mb-1">
                  <Clock size={20} className="text-red-600" />
                </div>
                <div className="text-lg font-bold text-red-700">{unansweredCount}</div>
                <div className="text-xs text-gray-600">Unanswered</div>
              </div>
            </div>
          </div>

          {/* Warnings */}
          {unansweredCount > 0 && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-4">
              <div className="flex items-start gap-3">
                <AlertTriangle size={20} className="text-red-500 mt-0.5" />
                <div>
                  <h4 className="font-medium text-red-800">Unanswered Questions</h4>
                  <p className="text-sm text-red-700">
                    You have {unansweredCount} unanswered question{unansweredCount !== 1 ? 's' : ''}. 
                    These will be marked as incorrect.
                  </p>
                </div>
              </div>
            </div>
          )}

          {markedCount > 0 && (
            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
              <div className="flex items-start gap-3">
                <Flag size={20} className="text-yellow-500 mt-0.5" />
                <div>
                  <h4 className="font-medium text-yellow-800">Questions Marked for Review</h4>
                  <p className="text-sm text-yellow-700">
                    You have {markedCount} question{markedCount !== 1 ? 's' : ''} marked for review. 
                    You can go back and review them before submitting.
                  </p>
                </div>
              </div>
            </div>
          )}

          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <div className="flex items-start gap-3">
              <AlertTriangle size={20} className="text-green-500 mt-0.5" />
              <div>
                <h4 className="font-medium text-green-800">Important Notice</h4>
                <p className="text-sm text-green-700">
                  Once submitted, you cannot change your answers. 
                  {!quiz.allowReattempt && ' You will not be able to retake this quiz.'}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="flex gap-3 p-6 bg-gray-50 rounded-b-xl">
          <button
            onClick={onCancel}
            className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 font-medium transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={onConfirm}
            disabled={isLoading}
            className="flex-1 px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg font-medium transition-colors"
          >
            {isLoading ? "Submitting...." :"Submit Quiz"}
          </button>
        </div>
      </div>
    </div>
  );
};

export default SubmitModal;