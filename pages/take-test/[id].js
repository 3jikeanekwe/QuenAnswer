import { useState, useEffect } from 'react'
import { useRouter } from 'next/router'
import Link from 'next/link'
import { ArrowLeft, Clock, AlertCircle } from 'lucide-react'

export default function TakeTest() {
  const router = useRouter()
  const { id } = router.query

  const [timeLeft, setTimeLeft] = useState(1800) // 30 minutes in seconds
  const [currentQuestion, setCurrentQuestion] = useState(0)
  const [answers, setAnswers] = useState({})
  const [showWarning, setShowWarning] = useState(false)

  // Sample test data (will be replaced with real data)
  const testData = {
    title: 'JavaScript Fundamentals',
    timeLimit: 30,
    questions: [
      {
        id: 1,
        question: 'What is the correct syntax for referring to an external script called "app.js"?',
        options: [
          '<script href="app.js">',
          '<script name="app.js">',
          '<script src="app.js">',
          '<script file="app.js">'
        ]
      },
      {
        id: 2,
        question: 'Which company developed JavaScript?',
        options: [
          'Microsoft',
          'Netscape',
          'Oracle',
          'Google'
        ]
      },
      {
        id: 3,
        question: 'What does "DOM" stand for?',
        options: [
          'Document Object Model',
          'Data Object Management',
          'Digital Optimization Method',
          'Dynamic Output Module'
        ]
      }
    ]
  }

  // Timer countdown
  useEffect(() => {
    if (timeLeft > 0) {
      const timer = setTimeout(() => setTimeLeft(timeLeft - 1), 1000)
      return () => clearTimeout(timer)
    } else {
      handleSubmit()
    }
  }, [timeLeft])

  // Show warning at 5 minutes
  useEffect(() => {
    if (timeLeft === 300 && !showWarning) {
      setShowWarning(true)
      setTimeout(() => setShowWarning(false), 5000)
    }
  }, [timeLeft])

  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${mins}:${secs.toString().padStart(2, '0')}`
  }

  const handleAnswer = (questionId, optionIndex) => {
    setAnswers({ ...answers, [questionId]: optionIndex })
  }

  const handleNext = () => {
    if (currentQuestion < testData.questions.length - 1) {
      setCurrentQuestion(currentQuestion + 1)
    }
  }

  const handlePrevious = () => {
    if (currentQuestion > 0) {
      setCurrentQuestion(currentQuestion - 1)
    }
  }

  const handleSubmit = () => {
    router.push(`/test-results/${id}?answers=${JSON.stringify(answers)}`)
  }

  const question = testData.questions[currentQuestion]
  const progress = ((currentQuestion + 1) / testData.questions.length) * 100

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-purple-50 to-pink-50">
      {/* Header with Timer */}
      <div className="bg-white/90 backdrop-blur-md shadow-lg sticky top-0 z-50">
        <div className="max-w-5xl mx-auto px-4 py-4">
          <div className="flex justify-between items-center">
            <h1 className="text-xl font-bold text-gray-800">{testData.title}</h1>
            <div className={`flex items-center gap-2 px-6 py-3 rounded-xl font-bold text-lg ${
              timeLeft < 300 ? 'bg-red-100 text-red-600' : 'bg-blue-100 text-blue-600'
            }`}>
              <Clock className="w-6 h-6" />
              {formatTime(timeLeft)}
            </div>
          </div>

          {/* Progress Bar */}
          <div className="mt-4">
            <div className="flex justify-between text-sm text-gray-600 mb-2">
              <span>Question {currentQuestion + 1} of {testData.questions.length}</span>
              <span>{Math.round(progress)}% Complete</span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-3">
              <div 
                className="bg-gradient-primary h-3 rounded-full transition-all duration-300"
                style={{ width: `${progress}%` }}
              />
            </div>
          </div>
        </div>
      </div>

      {/* Warning Banner */}
      {showWarning && (
        <div className="bg-yellow-100 border-l-4 border-yellow-500 p-4 mx-4 mt-4 rounded-lg">
          <div className="flex items-center">
            <AlertCircle className="w-6 h-6 text-yellow-600 mr-3" />
            <p className="text-yellow-800 font-semibold">
              Only 5 minutes remaining!
            </p>
          </div>
        </div>
      )}

      {/* Question Card */}
      <div className="max-w-5xl mx-auto px-4 py-8">
        <div className="bg-white rounded-3xl shadow-2xl p-8 md:p-12">
          {/* Question Number Badge */}
          <div className="inline-block bg-gradient-primary text-white px-6 py-2 rounded-full font-bold text-lg mb-6">
            Question {currentQuestion + 1}
          </div>

          {/* Question Text */}
          <h2 className="text-3xl font-bold text-gray-800 mb-8">
            {question.question}
          </h2>

          {/* Options */}
          <div className="space-y-4 mb-12">
            {question.options.map((option, index) => (
              <button
                key={index}
                onClick={() => handleAnswer(question.id, index)}
                className={`w-full text-left p-6 rounded-2xl border-3 font-medium text-lg transition-all transform hover:scale-102 ${
                  answers[question.id] === index
                    ? 'border-purple-500 bg-purple-50 shadow-lg'
                    : 'border-gray-200 hover:border-purple-300 bg-white'
                }`}
              >
                <div className="flex items-center gap-4">
                  <div className={`w-8 h-8 rounded-full border-2 flex items-center justify-center font-bold ${
                    answers[question.id] === index
                      ? 'border-purple-500 bg-purple-500 text-white'
                      : 'border-gray-300'
                  }`}>
                    {String.fromCharCode(65 + index)}
                  </div>
                  <span className={answers[question.id] === index ? 'text-purple-700' : 'text-gray-700'}>
                    {option}
                  </span>
                </div>
              </button>
            ))}
          </div>

          {/* Navigation Buttons */}
          <div className="flex gap-4">
            <button
              onClick={handlePrevious}
              disabled={currentQuestion === 0}
              className={`flex-1 py-4 rounded-xl font-bold text-lg transition-all ${
                currentQuestion === 0
                  ? 'bg-gray-200 text-gray-400 cursor-not-allowed'
                  : 'bg-gray-700 text-white hover:bg-gray-800 hover:shadow-lg'
              }`}
            >
              Previous
            </button>

            {currentQuestion === testData.questions.length - 1 ? (
              <button
                onClick={handleSubmit}
                className="flex-1 bg-gradient-to-r from-green-500 to-blue-500 text-white py-4 rounded-xl font-bold text-lg hover:shadow-xl transform hover:scale-105 transition-all"
              >
                Submit Test
              </button>
            ) : (
              <button
                onClick={handleNext}
                className="flex-1 bg-gradient-primary text-white py-4 rounded-xl font-bold text-lg hover:shadow-xl transform hover:scale-105 transition-all"
              >
                Next Question
              </button>
            )}
          </div>

          {/* Question Navigator */}
          <div className="mt-8 pt-8 border-t border-gray-200">
            <p className="text-gray-600 font-semibold mb-4">Quick Navigation:</p>
            <div className="flex flex-wrap gap-3">
              {testData.questions.map((q, index) => (
                <button
                  key={q.id}
                  onClick={() => setCurrentQuestion(index)}
                  className={`w-12 h-12 rounded-xl font-bold transition-all ${
                    index === currentQuestion
                      ? 'bg-gradient-primary text-white shadow-lg'
                      : answers[q.id] !== undefined
                      ? 'bg-green-100 text-green-700 border-2 border-green-300'
                      : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                  }`}
                >
                  {index + 1}
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
    }
