import { useState, useEffect, useRef } from 'react'
import { useRouter } from 'next/router'
import Link from 'next/link'
import { ArrowLeft, Clock, AlertCircle, Camera, Maximize, X, Video } from 'lucide-react'
import { useAuth } from '../../contexts/AuthContext'
import { getTestById, canAccessTest, saveProctorIncident, saveTestResult, uploadProctorScreenshot } from '../../lib/supabase'
import { 
  initializeProctoring, 
  setupAudioDetection, 
  setupTabSwitchDetection,
  setupCheatingPrevention,
  requestFullscreen,
  setupFullscreenDetection,
  captureScreenshot,
  detectMotion,
  stopProctoring,
  checkBrowserSupport
} from '../../lib/proctoring'

export default function TakeTest() {
  const router = useRouter()
  const { id } = router.query
  const { user, isAuthenticated } = useAuth()
  
  const [testData, setTestData] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [accessError, setAccessError] = useState('')
  
  const [timeLeft, setTimeLeft] = useState(0)
  const [currentQuestion, setCurrentQuestion] = useState(0)
  const [answers, setAnswers] = useState({})
  const [showWarning, setShowWarning] = useState(false)
  const [testStarted, setTestStarted] = useState(false)
  
  // Proctoring states
  const [proctoringActive, setProctoring Active] = useState(false)
  const [cameraStream, setCameraStream] = useState(null)
  const [incidents, setIncidents] = useState([])
  const [showIncidentAlert, setShowIncidentAlert] = useState(false)
  const [latestIncident, setLatestIncident] = useState(null)
  
  const videoRef = useRef(null)
  const cleanupFunctionsRef = useRef([])

  useEffect(() => {
    if (id && user) {
      checkAccess()
    }
  }, [id, user])

  useEffect(() => {
    if (testStarted && timeLeft > 0) {
      const timer = setTimeout(() => setTimeLeft(timeLeft - 1), 1000)
      return () => clearTimeout(timer)
    } else if (timeLeft === 0 && testStarted) {
      handleSubmit()
    }
  }, [timeLeft, testStarted])

  useEffect(() => {
    if (timeLeft === 300 && !showWarning && testStarted) {
      setShowWarning(true)
      setTimeout(() => setShowWarning(false), 5000)
    }
  }, [timeLeft, testStarted])

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      stopProctoring()
      cleanupFunctionsRef.current.forEach(cleanup => cleanup())
    }
  }, [])

  const checkAccess = async () => {
    setLoading(true)
    
    const { data: test, error: fetchError } = await getTestById(id)
    
    if (fetchError || !test) {
      setError('Test not found')
      setLoading(false)
      return
    }

    // Check access permissions
    const accessCheck = await canAccessTest(id, user.email)
    
    if (!accessCheck.canAccess) {
      setAccessError(accessCheck.reason)
      if (accessCheck.requiresPayment) {
        // Show payment modal/page
        router.push(`/pay-for-test/${id}`)
        return
      }
      setLoading(false)
      return
    }

    setTestData(test)
    setTimeLeft((test.time_limit || 30) * 60)
    setLoading(false)
  }

  const startTest = async () => {
    // Check if proctoring is required
    if (testData.proctoring_enabled) {
      const support = checkBrowserSupport()
      
      if (!support.supported) {
        alert('Your browser does not support proctoring features. Please use Chrome, Edge, or Safari.')
        return
      }

      // Request permissions and start proctoring
      const result = await initializeProctoring()
      
      if (!result.success) {
        alert('Camera and microphone access is required for this proctored test.')
        return
      }

      setCameraStream(result.stream)
      
      // Setup video preview
      if (videoRef.current) {
        videoRef.current.srcObject = result.stream
      }

      // Setup proctoring monitors
      setupProctoring(result.stream)
      
      // Request fullscreen
      await requestFullscreen()
      
      setProctoring Active(true)
    }

    setTestStarted(true)
  }

  const setupProctoring = (stream) => {
    // Audio detection
    setupAudioDetection(stream, handleIncident)

    // Tab switching detection
    const tabCleanup = setupTabSwitchDetection(handleIncident)
    cleanupFunctionsRef.current.push(tabCleanup)

    // Cheating prevention
    const cheatCleanup = setupCheatingPrevention(handleIncident)
    cleanupFunctionsRef.current.push(cheatCleanup)

    // Fullscreen detection
    const fullscreenCleanup = setupFullscreenDetection(handleIncident)
    cleanupFunctionsRef.current.push(fullscreenCleanup)

    // Motion detection
    if (videoRef.current) {
      setTimeout(() => {
        detectMotion(videoRef.current, handleIncident)
      }, 2000)
    }
  }

  const handleIncident = async (incident) => {
    console.log('Incident detected:', incident)
    
    const newIncident = {
      ...incident,
      questionNumber: currentQuestion + 1,
      timestamp: new Date().toISOString()
    }
    
    setIncidents(prev => [...prev, newIncident])
    setLatestIncident(newIncident)
    setShowIncidentAlert(true)
    setTimeout(() => setShowIncidentAlert(false), 3000)

    // Capture screenshot if camera is active
    let screenshotUrl = null
    if (videoRef.current && videoRef.current.videoWidth > 0) {
      const screenshot = captureScreenshot(videoRef.current)
      if (screenshot) {
        const { url } = await uploadProctorScreenshot(id, user.id, screenshot)
        screenshotUrl = url
      }
    }

    // Save to database
    await saveProctorIncident({
      test_id: id,
      type: incident.type,
      data: incident,
      screenshot_url: screenshotUrl,
      timestamp: newIncident.timestamp
    })
  }

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

  const handleSubmit = async () => {
    // Calculate score
    let correctCount = 0
    testData.questions.forEach(q => {
      if (answers[q.id] === q.correctAnswer) {
        correctCount++
      }
    })
    const score = Math.round((correctCount / testData.questions.length) * 100)

    // Save result
    await saveTestResult({
      test_id: id,
      score: score,
      total_questions: testData.questions.length,
      answers: answers,
      time_taken: (testData.time_limit * 60) - timeLeft
    })

    // Stop proctoring
    stopProctoring()
    cleanupFunctionsRef.current.forEach(cleanup => cleanup())

    // Redirect to results
    router.push(`/test-results/${id}?answers=${JSON.stringify(answers)}&incidents=${incidents.length}`)
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-purple-50 to-pink-50 flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-purple-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600 font-semibold">Loading test...</p>
        </div>
      </div>
    )
  }

  if (accessError) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-purple-50 to-pink-50 flex items-center justify-center p-4">
        <div className="max-w-md w-full bg-white rounded-3xl shadow-2xl p-8 text-center">
          <div className="w-20 h-20 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-6">
            <X className="w-10 h-10 text-red-600" />
          </div>
          <h2 className="text-3xl font-bold text-gray-800 mb-4">Access Denied</h2>
          <p className="text-gray-600 mb-8">{accessError}</p>
          <Link href="/browse-tests">
            <button className="bg-gradient-primary text-white px-8 py-4 rounded-xl font-bold hover:shadow-xl transition-all">
              Browse Other Tests
            </button>
          </Link>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-purple-50 to-pink-50 flex items-center justify-center">
        <div className="text-center">
          <p className="text-red-600 font-semibold">{error}</p>
        </div>
      </div>
    )
  }

  if (!testData) return null

  // Pre-test screen
  if (!testStarted) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-purple-50 to-pink-50 flex items-center justify-center p-4">
        <div className="max-w-2xl w-full bg-white rounded-3xl shadow-2xl p-8">
          <h1 className="text-4xl font-bold text-gray-800 mb-4">{testData.title}</h1>
          <p className="text-gray-600 mb-8">{testData.description}</p>

          <div className="grid grid-cols-2 gap-6 mb-8">
            <div className="bg-blue-50 rounded-2xl p-6 text-center">
              <Clock className="w-10 h-10 text-blue-500 mx-auto mb-2" />
              <p className="text-3xl font-bold text-blue-600">{testData.time_limit}</p>
              <p className="text-gray-700">Minutes</p>
            </div>
            <div className="bg-purple-50 rounded-2xl p-6 text-center">
              <AlertCircle className="w-10 h-10 text-purple-500 mx-auto mb-2" />
              <p className="text-3xl font-bold text-purple-600">{testData.questions?.length || 0}</p>
              <p className="text-gray-700">Questions</p>
            </div>
          </div>

          {testData.proctoring_enabled && (
            <div className="bg-yellow-50 border-l-4 border-yellow-500 p-6 rounded-r-2xl mb-8">
              <div className="flex items-start gap-3">
                <Camera className="w-6 h-6 text-yellow-600 flex-shrink-0 mt-1" />
                <div>
                  <h3 className="font-bold text-yellow-800 mb-2">⚠️ AI Proctored Test</h3>
                  <p className="text-yellow-700 text-sm mb-2">This test requires:</p>
                  <ul className="text-yellow-700 text-sm space-y-1 list-disc list-inside">
                    <li>Camera and microphone access</li>
                    <li>Full-screen mode (no minimizing)</li>
                    <li>No tab switching or leaving the page</li>
                    <li>Face must be visible at all times</li>
                    <li>Suspicious activities will be flagged</li>
                  </ul>
                </div>
              </div>
            </div>
          )}

          <div className="bg-gray-50 rounded-2xl p-6 mb-8">
            <h3 className="font-bold text-gray-800 mb-3">Instructions:</h3>
            <ul className="text-gray-700 space-y-2 list-disc list-inside">
              <li>Read each question carefully</li>
              <li>Select the best answer for each question</li>
              <li>You can navigate between questions using Previous/Next buttons</li>
              <li>Click "Submit Test" when you're done</li>
              {testData.proctoring_enabled && (
                <li className="text-red-600 font-semibold">Do not switch tabs, minimize window, or leave full-screen mode</li>
              )}
            </ul>
          </div>

          <button
            onClick={startTest}
            className="w-full bg-gradient-primary text-white py-6 rounded-2xl font-bold text-xl hover:shadow-2xl transform hover:scale-105 transition-all"
          >
            {testData.proctoring_enabled ? 'Start Proctored Test' : 'Start Test'}
          </button>

          <Link href="/browse-tests">
            <button className="w-full mt-4 text-gray-600 hover:text-gray-800 py-3 font-semibold">
              Cancel
            </button>
          </Link>
        </div>
      </div>
    )
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
            
            <div className="flex items-center gap-4">
              {proctoringActive && (
                <div className="flex items-center gap-2 bg-red-100 px-4 py-2 rounded-xl">
                  <div className="w-3 h-3 bg-red-500 rounded-full animate-pulse"></div>
                  <span className="text-red-700 font-semibold text-sm">PROCTORED</span>
                </div>
              )}
              
              <div className={`flex items-center gap-2 px-6 py-3 rounded-xl font-bold text-lg ${
                timeLeft < 300 ? 'bg-red-100 text-red-600' : 'bg-blue-100 text-blue-600'
              }`}>
                <Clock className="w-6 h-6" />
                {formatTime(timeLeft)}
              </div>
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

      {/* Incident Alert */}
      {showIncidentAlert && latestIncident && (
        <div className="fixed top-24 right-4 bg-red-500 text-white px-6 py-4 rounded-2xl shadow-2xl z-50 animate-bounce">
          <div className="flex items-center gap-3">
            <AlertCircle className="w-6 h-6" />
            <div>
              <p className="font-bold">Suspicious Activity Detected!</p>
              <p className="text-sm">{latestIncident.message || latestIncident.type}</p>
            </div>
          </div>
        </div>
      )}

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

      <div className="max-w-5xl mx-auto px-4 py-8">
        <div className="grid md:grid-cols-4 gap-6">
          {/* Camera Preview (if proctored) */}
          {proctoringActive && (
            <div className="md:col-span-1">
              <div className="bg-white rounded-2xl shadow-xl p-4 sticky top-32">
                <div className="flex items-center gap-2 mb-3">
                  <Video className="w-5 h-5 text-red-500" />
                  <p className="font-bold text-gray-800">Your Camera</p>
                </div>
                <video
                  ref={videoRef}
                  autoPlay
                  muted
                  playsInline
                  className="w-full rounded-xl bg-gray-900"
                />
                <p className="text-xs text-gray-500 mt-2 text-center">
                  {incidents.length} incident{incidents.length !== 1 ? 's' : ''} detected
                </p>
              </div>
            </div>
          )}

          {/* Question Card */}
          <div className={proctoringActive ? 'md:col-span-3' : 'md:col-span-4'}>
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
      </div>
    </div>
  )
        }
