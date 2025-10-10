import { useState, useEffect } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/router'
import { ArrowLeft, Plus, Clock, Image as ImageIcon, Users, Share2, Trash2, Check, AlertCircle } from 'lucide-react'
import { useAuth } from '../contexts/AuthContext'
import { createTest } from '../lib/supabase'

export default function CreateTest() {
  const router = useRouter()
  const { user, subscription, isAuthenticated, loading: authLoading } = useAuth()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState(false)
  
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

  useEffect(() => {
    if (!authLoading && !isAuthenticated) {
      router.push('/login')
    }
  }, [isAuthenticated, authLoading])

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
    if (testData.questions.length === 1) {
      alert('You must have at least one question!')
      return
    }
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

  const validateTest = () => {
    if (!testData.title.trim()) {
      setError('Please enter a test title')
      return false
    }

    if (testData.questions.length === 0) {
      setError('Please add at least one question')
      return false
    }

    for (let i = 0; i < testData.questions.length; i++) {
      const q = testData.questions[i]
      
      if (!q.question.trim()) {
        setError(`Question ${i + 1} is empty`)
        return false
      }

      const emptyOptions = q.options.filter(opt => !opt.trim())
      if (emptyOptions.length > 0) {
        setError(`Question ${i + 1} has empty options`)
        return false
      }
    }

    return true
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    
    if (!validateTest()) {
      return
    }

    // Check subscription limits for free users
    if (subscription?.plan === 'free') {
      // In a real app, you'd check the count from the database
      // For now, we'll allow it but show a message
      console.log('Free user creating test')
    }

    setLoading(true)

    try {
      const { data, error: createError } = await createTest({
        title: testData.title,
        description: testData.description,
        time_limit: testData.timeLimit,
        questions: testData.questions,
        collaborators: testData.collaborators,
        is_public: true
      })

      if (createError) {
        if (createError.message.includes('duplicate key')) {
          setError('A test with this title already exists. Please choose a different title.')
        } else {
          setError(createError.message)
        }
        setLoading(false)
        return
      }

      setSuccess(true)
      setTimeout(() => {
        router.push('/dashboard')
      }, 2000)
    } catch (err) {
      setError('An unexpected error occurred. Please try again.')
      setLoading(false)
    }
  }

  if (authLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-50 via-pink-50 to-blue-50 flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-purple-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600 font-semibold">Loading...</p>
        </div>
      </div>
    )
  }

  if (!user) return null

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-pink-50 to-blue-50">
      {/* Header */}
      <div className="bg-white/80 backdrop-blur-md shadow-lg sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex justify-between items-center">
            <Link href="/dashboard" className="inline-flex items-center text-purple-600 hover:text-purple-800 font-medium transition-colors">
              <ArrowLeft className="w-5 h-5 mr-2" />
              Back to Dashboard
            </Link>
            <h1 className="text-2xl font-bold bg-gradient-primary bg-clip-text text-transparent">
              Create New Test
            </h1>
            <div className="w-32"></div>
          </div>
        </div>
      </div>

      <div className="max-w-5xl mx-auto px-4 py-8">
        {/* Error Message */}
        {error && (
          <div className="mb-6 bg-red-50 border-l-4 border-red-500 p-4 rounded-r-xl">
            <div className="flex items-center">
              <AlertCircle className="w-5 h-5 text-red-500 mr-3 flex-shrink-0" />
              <p className="text-red-700">{error}</p>
            </div>
          </div>
        )}

        {/* Success Message */}
        {success && (
          <div className="mb-6 bg-green-50 border-l-4 border-green-500 p-4 rounded-r-xl">
            <div className="flex items-center">
              <Check className="w-5 h-5 text-green-500 mr-3" />
              <p className="text-green-700">Test created successfully! Redirecting...</p>
            </div>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-8">
          {/* Test Details Card */}
          <div className="bg-white rounded-3xl shadow-xl p-8">
            <h2 className="text-3xl font-bold text-gray-800 mb-6">Test Details</h2>
            
            {/* Test Title */}
            <div className="mb-6">
              <label className="block text-gray-700 font-semibold mb-2 text-lg">
                Test Title (Must be unique) *
              </label>
              <input
                type="text"
                required
                value={testData.title}
                onChange={(e) => setTestData({...testData, title: e.target.value})}
                className="w-full px-4 py-4 border-2 border-gray-200 rounded-xl focus:border-purple-500 focus:ring-4 focus:ring-purple-100 outline-none transition-all text-lg"
                placeholder="e.g., JavaScript Basics Quiz"
                disabled={loading}
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
                disabled={loading}
              />
            </div>

            {/* Time Limit */}
            <div className="mb-6">
              <label className="block text-gray-700 font-semibold mb-2 text-lg">
                <Clock className="w-5 h-5 inline mr-2" />
                Time Limit (minutes) *
              </label>
              <input
                type="number"
                min="1"
                max="180"
                required
                value={testData.timeLimit}
                onChange={(e) => setTestData({...testData, timeLimit: parseInt(e.target.value)})}
                className="w-full px-4 py-4 border-2 border-gray-200 rounded-xl focus:border-purple-500 focus:ring-4 focus:ring-purple-100 outline-none transition-all text-lg"
                disabled={loading}
              />
            </div>

            {/* Action Buttons */}
            <div className="flex gap-4">
              <button
                type="button"
                disabled={loading}
                className="flex-1 bg-gradient-to-r from-blue-500 to-purple-500 text-white py-4 rounded-xl font-semibold hover:shadow-lg transition-all flex items-center justify-center gap-2"
              >
                <Users className="w-5 h-5" />
                Invite Collaborators
              </button>
              <button
                type="button"
                disabled={loading}
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
                    disabled={loading}
                    className="text-red-500 hover:text-red-700 transition-colors"
                  >
                    <Trash2 className="w-6 h-6" />
                  </button>
                )}
              </div>

              {/* Question Text */}
              <div className="mb-6">
                <label className="block text-gray-700 font-semibold mb-2">
                  Question *
                </label>
                <textarea
                  required
                  value={question.question}
                  onChange={(e) => updateQuestion(question.id, 'question', e.target.value)}
                  className="w-full px-4 py-4 border-2 border-gray-200 rounded-xl focus:border-purple-500 focus:ring-4 focus:ring-purple-100 outline-none transition-all"
                  rows="3"
                  placeholder="Enter your question here..."
                  disabled={loading}
                />
              </div>

              {/* Upload Image */}
              <div className="mb-6">
                <button
                  type="button"
                  disabled={loading}
                  className="bg-gray-100 hover:bg-gray-200 text-gray-700 px-6 py-3 rounded-xl font-semibold transition-all flex items-center gap-2"
                >
                  <ImageIcon className="w-5 h-5" />
                  Upload Image (Optional)
                </button>
              </div>

              {/* Options */}
              <div className="mb-6">
                <label className="block text-gray-700 font-semibold mb-3">
                  Answer Options *
                </label>
                <div className="space-y-3">
                  {question.options.map((option, optIndex) => (
                    <div key={optIndex} className="flex gap-3">
                      <button
                        type="button"
                        onClick={() => updateQuestion(question.id, 'correctAnswer', optIndex)}
                        disabled={loading}
                        className={`w-12 h-12 rounded-xl border-2 flex items-center justify-center transition-all flex-shrink-0 ${
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
                        disabled={loading}
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
                  disabled={loading}
                />
              </div>
            </div>
          ))}

          {/* Add Question Button */}
          <button
            type="button"
            onClick={addQuestion}
            disabled={loading}
            className="w-full bg-gradient-to-r from-yellow-400 to-orange-400 text-white py-5 rounded-2xl font-bold text-lg hover:shadow-xl transform hover:scale-105 transition-all flex items-center justify-center gap-3"
          >
            <Plus className="w-6 h-6" />
            Add Another Question
          </button>

          {/* Submit Button */}
          <button
            type="submit"
            disabled={loading}
            className={`w-full bg-gradient-primary text-white py-6 rounded-2xl font-bold text-xl hover:shadow-2xl transform hover:scale-105 transition-all ${
              loading ? 'opacity-50 cursor-not-allowed' : ''
            }`}
          >
            {loading ? 'Creating Test...' : 'Create Test & Publish'}
          </button>
        </form>
      </div>
    </div>
  )
        }
