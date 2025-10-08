import { useState } from 'react'
import Link from 'next/link'
import { ArrowLeft, Plus, Clock, Image as ImageIcon, Users, Share2, Trash2, Check } from 'lucide-react'

export default function CreateTest() {
  const [testData, setTestData] = useState({
    title: '',
    description: '',
    timeLimit: 30,
    questions: [
      {
        id: 1,
        question: '',
        image: null,
        options: ['', '', '', ''],
        correctAnswer: 0,
        explanation: ''
      }
    ],
    collaborators: []
  })

  const addQuestion = () => {
    setTestData({
      ...testData,
      questions: [
        ...testData.questions,
        {
          id: testData.questions.length + 1,
          question: '',
          image: null,
          options: ['', '', '', ''],
          correctAnswer: 0,
          explanation: ''
        }
      ]
    })
  }

  const removeQuestion = (id) => {
    setTestData({
      ...testData,
      questions: testData.questions.filter(q => q.id !== id)
    })
  }

  const updateQuestion = (id, field, value) => {
    setTestData({
      ...testData,
      questions: testData.questions.map(q =>
        q.id === id ? { ...q, [field]: value } : q
      )
    })
  }

  const updateOption = (questionId, optionIndex, value) => {
    setTestData({
      ...testData,
      questions: testData.questions.map(q =>
        q.id === questionId
          ? { ...q, options: q.options.map((opt, idx) => idx === optionIndex ? value : opt) }
          : q
      )
    })
  }

  const handleSubmit = (e) => {
    e.preventDefault()
    console.log('Test Created:', testData)
    alert('Test created successfully!')
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-pink-50 to-blue-50">
      {/* Header */}
      <div className="bg-white/80 backdrop-blur-md shadow-lg sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex justify-between items-center">
            <Link href="/" className="inline-flex items-center text-purple-600 hover:text-purple-800 font-medium transition-colors">
              <ArrowLeft className="w-5 h-5 mr-2" />
              Back to Home
            </Link>
            <h1 className="text-2xl font-bold bg-gradient-primary bg-clip-text text-transparent">
              Create New Test
            </h1>
            <div className="w-24"></div>
          </div>
        </div>
      </div>

      <div className="max-w-5xl mx-auto px-4 py-8">
        <form onSubmit={handleSubmit} className="space-y-8">
          {/* Test Details Card */}
          <div className="bg-white rounded-3xl shadow-xl p-8">
            <h2 className="text-3xl font-bold text-gray-800 mb-6">Test Details</h2>
            
            {/* Test Title */}
            <div className="mb-6">
              <label className="block text-gray-700 font-semibold mb-2 text-lg">
                Test Title (Must be unique)
              </label>
              <input
                type="text"
                required
                value={testData.title}
                onChange={(e) => setTestData({...testData, title: e.target.value})}
                className="w-full px-4 py-4 border-2 border-gray-200 rounded-xl focus:border-purple-500 focus:ring-4 focus:ring-purple-100 outline-none transition-all text-lg"
                placeholder="e.g., JavaScript Basics Quiz"
              />
            </div>

            {/* Description */}
            <div className="mb-6">
              <label className="block text-gray-700 font-semibold mb-2 text-lg">
                Description
              </label>
              <textarea
                value={testData.description}
                onChange={(e) => setTestData({...testData, description: e.target.value})}
                className="w-full px-4 py-4 border-2 border-gray-200 rounded-xl focus:border-purple-500 focus:ring-4 focus:ring-purple-100 outline-none transition-all text-lg"
                rows="3"
                placeholder="Brief description of your test..."
              />
            </div>

            {/* Time Limit */}
            <div className="mb-6">
              <label className="block text-gray-700 font-semibold mb-2 text-lg">
                <Clock className="w-5 h-5 inline mr-2" />
                Time Limit (minutes)
              </label>
              <input
                type="number"
                min="1"
                value={testData.timeLimit}
                onChange={(e) => setTestData({...testData, timeLimit: parseInt(e.target.value)})}
                className="w-full px-4 py-4 border-2 border-gray-200 rounded-xl focus:border-purple-500 focus:ring-4 focus:ring-purple-100 outline-none transition-all text-lg"
              />
            </div>

            {/* Action Buttons */}
            <div className="flex gap-4">
              <button
                type="button"
                className="flex-1 bg-gradient-to-r from-blue-500 to-purple-500 text-white py-4 rounded-xl font-semibold hover:shadow-lg transition-all flex items-center justify-center gap-2"
              >
                <Users className="w-5 h-5" />
                Invite Collaborators
              </button>
              <button
                type="button"
                className="flex-1 bg-gradient-to-r from-green-500 to-blue-500 text-white py-4 rounded-xl font-semibold hover:shadow-lg transition-all flex items-center justify-center gap-2"
              >
                <Share2 className="w-5 h-5" />
                Share Test
              </button>
            </div>
          </div>

          {/* Questions */}
          {testData.questions.map((question, qIndex) => (
            <div key={question.id} className="bg-white rounded-3xl shadow-xl p-8">
              <div className="flex justify-between items-center mb-6">
                <h3 className="text-2xl font-bold text-gray-800">
                  Question {qIndex + 1}
                </h3>
                {testData.questions.length > 1 && (
                  <button
                    type="button"
                    onClick={() => removeQuestion(question.id)}
                    className="text-red-500 hover:text-red-700 transition-colors"
                  >
                    <Trash2 className="w-6 h-6" />
                  </button>
                )}
              </div>

              {/* Question Text */}
              <div className="mb-6">
                <label className="block text-gray-700 font-semibold mb-2">
                  Question
                </label>
                <textarea
                  required
                  value={question.question}
                  onChange={(e) => updateQuestion(question.id, 'question', e.target.value)}
                  className="w-full px-4 py-4 border-2 border-gray-200 rounded-xl focus:border-purple-500 focus:ring-4 focus:ring-purple-100 outline-none transition-all"
                  rows="3"
                  placeholder="Enter your question here..."
                />
              </div>

              {/* Upload Image */}
              <div className="mb-6">
                <button
                  type="button"
                  className="bg-gray-100 hover:bg-gray-200 text-gray-700 px-6 py-3 rounded-xl font-semibold transition-all flex items-center gap-2"
                >
                  <ImageIcon className="w-5 h-5" />
                  Upload Image (Optional)
                </button>
              </div>

              {/* Options */}
              <div className="mb-6">
                <label className="block text-gray-700 font-semibold mb-3">
                  Answer Options
                </label>
                <div className="space-y-3">
                  {question.options.map((option, optIndex) => (
                    <div key={optIndex} className="flex gap-3">
                      <button
                        type="button"
                        onClick={() => updateQuestion(question.id, 'correctAnswer', optIndex)}
                        className={`w-12 h-12 rounded-xl border-2 flex items-center justify-center transition-all ${
                          question.correctAnswer === optIndex
                            ? 'bg-green-500 border-green-500 text-white'
                            : 'border-gray-300 hover:border-green-400'
                        }`}
                      >
                        {question.correctAnswer === optIndex && <Check className="w-6 h-6" />}
                      </button>
                      <input
                        type="text"
                        required
                        value={option}
                        onChange={(e) => updateOption(question.id, optIndex, e.target.value)}
                        className="flex-1 px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-purple-500 focus:ring-4 focus:ring-purple-100 outline-none transition-all"
                        placeholder={`Option ${optIndex + 1}`}
                      />
                    </div>
                  ))}
                </div>
                <p className="text-sm text-gray-500 mt-2">
                  Click the checkbox to mark the correct answer
                </p>
              </div>

              {/* Explanation */}
              <div>
                <label className="block text-gray-700 font-semibold mb-2">
                  Explanation (Shown after test completion)
                </label>
                <textarea
                  value={question.explanation}
                  onChange={(e) => updateQuestion(question.id, 'explanation', e.target.value)}
                  className="w-full px-4 py-4 border-2 border-gray-200 rounded-xl focus:border-purple-500 focus:ring-4 focus:ring-purple-100 outline-none transition-all"
                  rows="3"
                  placeholder="Explain why this is the correct answer..."
                />
              </div>
            </div>
          ))}

          {/* Add Question Button */}
          <button
            type="button"
            onClick={addQuestion}
            className="w-full bg-gradient-to-r from-yellow-400 to-orange-400 text-white py-5 rounded-2xl font-bold text-lg hover:shadow-xl transform hover:scale-105 transition-all flex items-center justify-center gap-3"
          >
            <Plus className="w-6 h-6" />
            Add Another Question
          </button>

          {/* Submit Button */}
          <button
            type="submit"
            className="w-full bg-gradient-primary text-white py-6 rounded-2xl font-bold text-xl hover:shadow-2xl transform hover:scale-105 transition-all"
          >
            Create Test & Publish
          </button>
        </form>
      </div>
    </div>
  )
                                        }
