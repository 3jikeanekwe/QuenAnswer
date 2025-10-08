import { useRouter } from 'next/router'
import Link from 'next/link'
import { Trophy, CheckCircle, XCircle, Home, Share2, RotateCcw } from 'lucide-react'

export default function TestResults() {
  const router = useRouter()
  const { id } = router.query

  // Sample test data with correct answers and explanations
  const testData = {
    title: 'JavaScript Fundamentals',
    questions: [
      {
        id: 1,
        question: 'What is the correct syntax for referring to an external script called "app.js"?',
        options: [
          '<script href="app.js">',
          '<script name="app.js">',
          '<script src="app.js">',
          '<script file="app.js">'
        ],
        correctAnswer: 2,
        explanation: 'The correct attribute to link an external JavaScript file is "src" (source). The script tag uses src="filename.js" to reference external scripts.'
      },
      {
        id: 2,
        question: 'Which company developed JavaScript?',
        options: [
          'Microsoft',
          'Netscape',
          'Oracle',
          'Google'
        ],
        correctAnswer: 1,
        explanation: 'JavaScript was created by Brendan Eich at Netscape Communications in 1995. It was originally called Mocha, then LiveScript, before being renamed to JavaScript.'
      },
      {
        id: 3,
        question: 'What does "DOM" stand for?',
        options: [
          'Document Object Model',
          'Data Object Management',
          'Digital Optimization Method',
          'Dynamic Output Module'
        ],
        correctAnswer: 0,
        explanation: 'DOM stands for Document Object Model. It is a programming interface that represents the structure of HTML and XML documents as a tree of objects that can be manipulated with JavaScript.'
      }
    ]
  }

  // Get user answers from query (in real app, this would come from database)
  const userAnswers = router.query.answers ? JSON.parse(router.query.answers) : {}

  // Calculate score
  let correctCount = 0
  testData.questions.forEach(q => {
    if (userAnswers[q.id] === q.correctAnswer) {
      correctCount++
    }
  })

  const score = Math.round((correctCount / testData.questions.length) * 100)
  const passed = score >= 70

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-pink-50 to-blue-50 py-8">
      <div className="max-w-5xl mx-auto px-4">
        {/* Score Card */}
        <div className="bg-white rounded-3xl shadow-2xl p-8 md:p-12 mb-8 text-center">
          {/* Trophy Icon */}
          <div className={`w-32 h-32 mx-auto mb-6 rounded-full flex items-center justify-center ${
            passed ? 'bg-gradient-to-br from-yellow-400 to-orange-400' : 'bg-gradient-to-br from-gray-400 to-gray-500'
          }`}>
            <Trophy className="w-16 h-16 text-white" />
          </div>

          {/* Score */}
          <h1 className="text-6xl font-bold mb-4 bg-gradient-rainbow bg-clip-text text-transparent">
            {score}%
          </h1>
          
          <h2 className="text-3xl font-bold text-gray-800 mb-2">
            {passed ? '🎉 Congratulations!' : '💪 Keep Practicing!'}
          </h2>
          
          <p className="text-xl text-gray-600 mb-6">
            You got {correctCount} out of {testData.questions.length} questions correct
          </p>

          {/* Stats */}
          <div className="grid grid-cols-3 gap-6 max-w-2xl mx-auto mb-8">
            <div className="bg-green-50 rounded-2xl p-4">
              <CheckCircle className="w-8 h-8 text-green-500 mx-auto mb-2" />
              <p className="text-3xl font-bold text-green-600">{correctCount}</p>
              <p className="text-gray-600">Correct</p>
            </div>
            <div className="bg-red-50 rounded-2xl p-4">
              <XCircle className="w-8 h-8 text-red-500 mx-auto mb-2" />
              <p className="text-3xl font-bold text-red-600">{testData.questions.length - correctCount}</p>
              <p className="text-gray-600">Wrong</p>
            </div>
            <div className="bg-blue-50 rounded-2xl p-4">
              <Trophy className="w-8 h-8 text-blue-500 mx-auto mb-2" />
              <p className="text-3xl font-bold text-blue-600">{score}%</p>
              <p className="text-gray-600">Score</p>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex flex-wrap gap-4 justify-center">
            <Link href="/">
              <button className="bg-gradient-primary text-white px-8 py-4 rounded-xl font-bold hover:shadow-xl transform hover:scale-105 transition-all flex items-center gap-2">
                <Home className="w-5 h-5" />
                Back to Home
              </button>
            </Link>
            <button className="bg-gradient-to-r from-blue-500 to-green-500 text-white px-8 py-4 rounded-xl font-bold hover:shadow-xl transform hover:scale-105 transition-all flex items-center gap-2">
              <Share2 className="w-5 h-5" />
              Share Results
            </button>
            <Link href={`/take-test/${id}`}>
              <button className="bg-gradient-to-r from-yellow-500 to-orange-500 text-white px-8 py-4 rounded-xl font-bold hover:shadow-xl transform hover:scale-105 transition-all flex items-center gap-2">
                <RotateCcw className="w-5 h-5" />
                Retake Test
              </button>
            </Link>
          </div>
        </div>

        {/* Detailed Results */}
        <div className="mb-8">
          <h3 className="text-3xl font-bold text-gray-800 mb-6 text-center">
            📊 Detailed Results & Explanations
          </h3>
        </div>

        {/* Question Results */}
        {testData.questions.map((question, index) => {
          const userAnswer = userAnswers[question.id]
          const isCorrect = userAnswer === question.correctAnswer

          return (
            <div key={question.id} className="bg-white rounded-3xl shadow-xl p-8 mb-6">
              {/* Question Header */}
              <div className="flex items-start gap-4 mb-6">
                <div className={`w-12 h-12 rounded-xl flex items-center justify-center font-bold text-lg flex-shrink-0 ${
                  isCorrect ? 'bg-green-100 text-green-600' : 'bg-red-100 text-red-600'
                }`}>
                  {index + 1}
                </div>
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-2">
                    {isCorrect ? (
                      <CheckCircle className="w-6 h-6 text-green-500" />
                    ) : (
                      <XCircle className="w-6 h-6 text-red-500" />
                    )}
                    <span className={`font-bold text-lg ${
                      isCorrect ? 'text-green-600' : 'text-red-600'
                    }`}>
                      {isCorrect ? 'Correct!' : 'Incorrect'}
                    </span>
                  </div>
                  <h4 className="text-xl font-bold text-gray-800">
                    {question.question}
                  </h4>
                </div>
              </div>

              {/* Options */}
              <div className="space-y-3 mb-6">
                {question.options.map((option, optIndex) => {
                  const isUserAnswer = userAnswer === optIndex
                  const isCorrectAnswer = question.correctAnswer === optIndex

                  return (
                    <div
                      key={optIndex}
                      className={`p-4 rounded-xl border-2 ${
                        isCorrectAnswer
                          ? 'border-green-500 bg-green-50'
                          : isUserAnswer
                          ? 'border-red-500 bg-red-50'
                          : 'border-gray-200 bg-gray-50'
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <div className={`w-8 h-8 rounded-full border-2 flex items-center justify-center font-bold text-sm ${
                          isCorrectAnswer
                            ? 'border-green-500 bg-green-500 text-white'
                            : isUserAnswer
                            ? 'border-red-500 bg-red-500 text-white'
                            : 'border-gray-300 text-gray-600'
                        }`}>
                          {String.fromCharCode(65 + optIndex)}
                        </div>
                        <span className={`flex-1 ${
                          isCorrectAnswer ? 'text-green-700 font-semibold' : 'text-gray-700'
                        }`}>
                          {option}
                        </span>
                        {isCorrectAnswer && (
                          <CheckCircle className="w-5 h-5 text-green-500" />
                        )}
                        {isUserAnswer && !isCorrectAnswer && (
                          <XCircle className="w-5 h-5 text-red-500" />
                        )}
                      </div>
                    </div>
                  )
                })}
              </div>

              {/* Explanation */}
              <div className="bg-blue-50 border-l-4 border-blue-500 p-6 rounded-r-2xl">
                <p className="font-bold text-blue-900 mb-2 flex items-center gap-2">
                  <span className="text-xl">💡</span>
                  Explanation:
                </p>
                <p className="text-blue-800 leading-relaxed">
                  {question.explanation}
                </p>
              </div>
            </div>
          )
        })}

        {/* Bottom Actions */}
        <div className="bg-white rounded-3xl shadow-xl p-8 text-center">
          <h3 className="text-2xl font-bold text-gray-800 mb-4">
            Want to improve your score?
          </h3>
          <p className="text-gray-600 mb-6">
            Review the explanations above and try again!
          </p>
          <Link href="/browse-tests">
            <button className="bg-gradient-rainbow text-white px-10 py-4 rounded-xl font-bold text-lg hover:shadow-xl transform hover:scale-105 transition-all">
              Browse More Tests
            </button>
          </Link>
        </div>
      </div>
    </div>
  )
          }
