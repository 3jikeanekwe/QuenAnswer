import { useState, useEffect } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/router'
import { ArrowLeft, Plus, Clock, Image as ImageIcon, Users, Share2, Trash2, Check, AlertCircle, Camera, DollarSign, Calendar, Lock, Mail } from 'lucide-react'
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
    // Optional Features
    proctoring_enabled: false,
    scheduled_start: '',
    scheduled_end: '',
    is_private: false,
    invited_emails: [],
    is_paid: false,
    price_usdc: 0,
    creator_wallet: ''
  })

  const [inviteEmail, setInviteEmail] = useState('')

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

  const addInvitedEmail = () => {
    if (inviteEmail && inviteEmail.includes('@')) {
      if (!testData.invited_emails.includes(inviteEmail)) {
        setTestData({
          ...testData,
          invited_emails: [...testData.invited_emails, inviteEmail]
        })
        setInviteEmail('')
      } else {
        alert('Email already added!')
      }
    } else {
      alert('Please enter a valid email address')
    }
  }

  const removeInvitedEmail = (email) => {
    setTestData({
      ...testData,
      invited_emails: testData.invited_emails.filter(e => e !== email)
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

    // Validate scheduled dates
    if (testData.scheduled_start && testData.scheduled_end) {
      const start = new Date(testData.scheduled_start)
      const end = new Date(testData.scheduled_end)
      if (end <= start) {
        setError('End date must be after start date')
        return false
      }
    }

    // Validate payment settings
    if (testData.is_paid) {
      if (!testData.price_usdc || testData.price_usdc <= 0) {
        setError('Please set a valid price for paid test')
        return false
      }
      if (!testData.creator_wallet || !testData.creator_wallet.trim()) {
        setError('Please enter your USDC wallet address to receive payments')
        return false
      }
    }

    // Validate private test
    if (testData.is_private && testData.invited_emails.length === 0) {
      setError('Please invite at least one person for private test')
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

    setLoading(true)

    try {
      const { data, error: createError } = await createTest(testData)

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
          </div>

          {/* OPTIONAL FEATURES CARD */}
          <div className="bg-gradient-to-br from-blue-50 to-purple-50 rounded-3xl shadow-xl p-8 border-2 border-blue-200">
            <h2 className="text-3xl font-bold text-gray-800 mb-2">Optional Features</h2>
            <p className="text-gray-600 mb-6">Choose which features to enable for this test</p>

            {/* AI Proctoring Toggle */}
            <div className="bg-white rounded-2xl p-6 mb-6">
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-center gap-3">
                  <Camera className="w-8 h-8 text-purple-500" />
                  <div>
                    <h3 className="text-xl font-bold text-gray-800">AI Proctoring</h3>
                    <p className="text-gray-600 text-sm">Monitor students with camera, mic, and behavior tracking</p>
                  </div>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    checked={testData.proctoring_enabled}
                    onChange={(e) => setTestData({...testData, proctoring_enabled: e.target.checked})}
                    className="sr-only peer"
                    disabled={loading}
                  />
                  <div className="w-14 h-8 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-purple-300 rounded-full peer peer-checked:after:translate-x-6 peer-checked:after:border-white after:content-[''] after:absolute after:top-1 after:left-1 after:bg-white after:border-gray-300 after:border after:rounded-full after:h-6 after:w-6 after:transition-all peer-checked:bg-purple-600"></div>
                </label>
              </div>
              {testData.proctoring_enabled && (
                <div className="bg-purple-50 rounded-xl p-4 text-sm text-purple-700">
                  ✓ Camera monitoring • ✓ Audio detection • ✓ Tab switching alerts • ✓ Full-screen enforcement
                </div>
              )}
            </div>

            {/* Schedule Test */}
            <div className="bg-white rounded-2xl p-6 mb-6">
              <div className="flex items-center gap-3 mb-4">
                <Calendar className="w-8 h-8 text-green-500" />
                <div>
                  <h3 className="text-xl font-bold text-gray-800">Schedule Test</h3>
                  <p className="text-gray-600 text-sm">Set start and end times for this test</p>
                </div>
              </div>
              <div className="grid md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-gray-700 font-semibold mb-2">Start Date & Time</label>
                  <input
                    type="datetime-local"
                    value={testData.scheduled_start}
                    onChange={(e) => setTestData({...testData, scheduled_start: e.target.value})}
                    className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-green-500 focus:ring-4 focus:ring-green-100 outline-none transition-all"
                    disabled={loading}
                  />
                </div>
                <div>
                  <label className="block text-gray-700 font-semibold mb-2">End Date & Time</label>
                  <input
                    type="datetime-local"
                    value={testData.scheduled_end}
                    onChange={(e) => setTestData({...testData, scheduled_end: e.target.value})}
                    className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-green-500 focus:ring-4 focus:ring-green-100 outline-none transition-all"
                    disabled={loading}
                  />
                </div>
              </div>
            </div>

            {/* Private Test - Invite Only */}
            <div className="bg-white rounded-2xl p-6 mb-6">
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-center gap-3">
                  <Lock className="w-8 h-8 text-blue-500" />
                  <div>
                    <h3 className="text-xl font-bold text-gray-800">Private Test (Invite Only)</h3>
                    <p className="text-gray-600 text-sm">Only invited people can take this test</p>
                  </div>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    checked={testData.is_private}
                    onChange={(e) => setTestData({...testData, is_private: e.target.checked})}
                    className="sr-only peer"
                    disabled={loading}
                  />
                  <div className="w-14 h-8 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-6 peer-checked:after:border-white after:content-[''] after:absolute after:top-1 after:left-1 after:bg-white after:border-gray-300 after:border after:rounded-full after:h-6 after:w-6 after:transition-all peer-checked:bg-blue-600"></div>
                </label>
              </div>
              {testData.is_private && (
                <div>
                  <label className="block text-gray-700 font-semibold mb-2">Add Invited Emails</label>
                  <div className="flex gap-2 mb-3">
                    <input
                      type="email"
                      value={inviteEmail}
                      onChange={(e) => setInviteEmail(e.target.value)}
                      placeholder="email@example.com"
                      className="flex-1 px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-blue-500 focus:ring-4 focus:ring-blue-100 outline-none transition-all"
                      disabled={loading}
                      onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), addInvitedEmail())}
                    />
                    <button
                      type="button"
                      onClick={addInvitedEmail}
                      disabled={loading}
                      className="px-6 py-3 bg-blue-500 text-white rounded-xl font-semibold hover:bg-blue-600 transition-all"
                    >
                      <Mail className="w-5 h-5" />
                    </button>
                  </div>
                  {testData.invited_emails.length > 0 && (
                    <div className="bg-blue-50 rounded-xl p-4">
                      <p className="text-sm font-semibold text-blue-700 mb-2">Invited ({testData.invited_emails.length}):</p>
                      <div className="flex flex-wrap gap-2">
                        {testData.invited_emails.map((email, index) => (
                          <span key={index} className="inline-flex items-center gap-2 bg-white px-3 py-1 rounded-full text-sm">
                            {email}
                            <button
                              type="button"
                              onClick={() => removeInvitedEmail(email)}
                              className="text-red-500 hover:text-red-700"
                              disabled={loading}
                            >
                              ×
                            </button>
                          </span>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Paid Test */}
            <div className="bg-white rounded-2xl p-6">
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-center gap-3">
                  <DollarSign className="w-8 h-8 text-yellow-500" />
                  <div>
                    <h3 className="text-xl font-bold text-gray-800">Paid Test (USDC)</h3>
                    <p className="text-gray-600 text-sm">Charge students to take this test • Platform takes 10% fee</p>
                  </div>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    checked={testData.is_paid}
                    onChange={(e) => setTestData({...testData, is_paid: e.target.checked})}
                    className="sr-only peer"
                    disabled={loading}
                  />
                  <div className="w-14 h-8 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-yellow-300 rounded-full peer peer-checked:after:translate-x-6 peer-checked:after:border-white after:content-[''] after:absolute after:top-1 after:left-1 after:bg-white after:border-gray-300 after:border after:rounded-full after:h-6 after:w-6 after:transition-all peer-checked:bg-yellow-600"></div>
                </label>
              </div>
              {testData.is_paid && (
                <div className="space-y-4">
                  <div>
                    <label className="block text-gray-700 font-semibold mb-2">Price (USDC) *</label>
                    <input
                      type="number"
                      step="0.01"
                      min="0.01"
                      value={testData.price_usdc}
                      onChange={(e) => setTestData({...testData, price_usdc: parseFloat(e.target.value)})}
                      className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-yellow-500 focus:ring-4 focus:ring-yellow-100 outline-none transition-all"
                      placeholder="5.00"
                      required={testData.is_paid}
                      disabled={loading}
                    />
                  </div>
                  <div>
                    <label className="block text-gray-700 font-semibold mb-2">Your USDC Wallet Address *</label>
                    <input
                      type="text"
                      value={testData.creator_wallet}
                      onChange={(e) => setTestData({...testData, creator_wallet: e.target.value})}
                      className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-yellow-500 focus:ring-4 focus:ring-yellow-100 outline-none transition-all font-mono text-sm"
                      placeholder="0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb"
                      required={testData.is_paid}
                      disabled={loading}
                    />
                  </div>
                  {testData.price_usdc > 0 && (
                    <div className="bg-yellow-50 rounded-xl p-4 text-sm">
                      <p className="font-semibold text-yellow-800 mb-1">Payment Breakdown:</p>
                      <p className="text-yellow-700">• Test Price: ${testData.price_usdc} USDC</p>
                      <p className="text-yellow-700">• Platform Fee (10%): ${(testData.price_usdc * 0.1).toFixed(2)} USDC</p>
                      <p className="text-yellow-700 font-bold">• You Receive: ${(testData.price_usdc * 0.9).toFixed(2)} USDC</p>
                    </div>
                  )}
                </div>
              )}
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
