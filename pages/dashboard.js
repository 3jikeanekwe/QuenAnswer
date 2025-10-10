import { useState, useEffect } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/router'
import { Plus, Trophy, Clock, Users, Edit, Trash2, Share2, BarChart3, LogOut, Settings } from 'lucide-react'
import { useAuth } from '../contexts/AuthContext'
import { getUserTests, getUserResults, deleteTest } from '../lib/supabase'

export default function Dashboard() {
  const router = useRouter()
  const { user, subscription, signOut, isAuthenticated, loading: authLoading } = useAuth()
  const [activeTab, setActiveTab] = useState('my-tests')
  const [myTests, setMyTests] = useState([])
  const [takenTests, setTakenTests] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!authLoading && !isAuthenticated) {
      router.push('/login')
    } else if (isAuthenticated) {
      loadDashboardData()
    }
  }, [isAuthenticated, authLoading])

  const loadDashboardData = async () => {
    setLoading(true)
    
    // Load user's created tests
    const { data: tests, error: testsError } = await getUserTests()
    if (!testsError && tests) {
      setMyTests(tests)
    }

    // Load user's test results
    const { data: results, error: resultsError } = await getUserResults()
    if (!resultsError && results) {
      setTakenTests(results)
    }

    setLoading(false)
  }

  const handleDeleteTest = async (testId) => {
    if (!confirm('Are you sure you want to delete this test?')) return

    const { error } = await deleteTest(testId)
    if (!error) {
      setMyTests(myTests.filter(test => test.id !== testId))
      alert('Test deleted successfully!')
    } else {
      alert('Error deleting test: ' + error.message)
    }
  }

  const handleSignOut = async () => {
    await signOut()
  }

  if (authLoading || loading) {
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

  const userRole = user.user_metadata?.role || 'user'
  const userName = user.user_metadata?.full_name || user.email?.split('@')[0] || 'User'

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-pink-50 to-blue-50">
      {/* Header */}
      <div className="bg-white/80 backdrop-blur-md shadow-lg">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex justify-between items-center">
            <Link href="/">
              <h1 className="text-3xl font-bold bg-gradient-primary bg-clip-text text-transparent cursor-pointer">
                QuenAnswer
              </h1>
            </Link>
            <div className="flex items-center gap-4">
              <Link href="/create-test">
                <button className="bg-gradient-primary text-white px-6 py-3 rounded-xl font-semibold hover:shadow-lg transition-all flex items-center gap-2">
                  <Plus className="w-5 h-5" />
                  Create Test
                </button>
              </Link>
              <Link href="/subscription">
                <button className="text-gray-600 hover:text-gray-800 p-2">
                  <Settings className="w-6 h-6" />
                </button>
              </Link>
              <button onClick={handleSignOut} className="text-red-600 hover:text-red-800 p-2">
                <LogOut className="w-6 h-6" />
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 py-8">
        {/* User Profile Card */}
        <div className="bg-white rounded-3xl shadow-xl p-8 mb-8">
          <div className="flex items-center gap-6 mb-6">
            <div className="w-24 h-24 bg-gradient-primary rounded-full flex items-center justify-center text-white text-4xl font-bold">
              {userName[0]?.toUpperCase()}
            </div>
            <div className="flex-1">
              <h2 className="text-3xl font-bold text-gray-800">{userName}</h2>
              <p className="text-gray-600">{user.email}</p>
              <div className="flex gap-3 mt-2">
                <span className={`inline-block px-4 py-1 rounded-full text-sm font-semibold ${
                  userRole === 'admin' ? 'bg-purple-100 text-purple-700' : 'bg-blue-100 text-blue-700'
                }`}>
                  {userRole === 'admin' ? '👑 Admin' : '👤 User'}
                </span>
                <span className={`inline-block px-4 py-1 rounded-full text-sm font-semibold ${
                  subscription?.plan === 'free' ? 'bg-gray-100 text-gray-700' : 'bg-yellow-100 text-yellow-700'
                }`}>
                  {subscription?.plan === 'free' ? '🆓 Free Plan' : '⭐ Premium'}
                </span>
              </div>
            </div>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-3 gap-6">
            <div className="bg-gradient-to-br from-purple-100 to-pink-100 rounded-2xl p-6 text-center">
              <Plus className="w-10 h-10 text-purple-600 mx-auto mb-2" />
              <p className="text-4xl font-bold text-purple-600">{myTests.length}</p>
              <p className="text-gray-700 font-medium">Tests Created</p>
            </div>
            <div className="bg-gradient-to-br from-blue-100 to-green-100 rounded-2xl p-6 text-center">
              <Trophy className="w-10 h-10 text-blue-600 mx-auto mb-2" />
              <p className="text-4xl font-bold text-blue-600">{takenTests.length}</p>
              <p className="text-gray-700 font-medium">Tests Taken</p>
            </div>
            <div className="bg-gradient-to-br from-yellow-100 to-orange-100 rounded-2xl p-6 text-center">
              <BarChart3 className="w-10 h-10 text-yellow-600 mx-auto mb-2" />
              <p className="text-4xl font-bold text-yellow-600">
                {takenTests.length > 0 
                  ? Math.round(takenTests.reduce((acc, t) => acc + t.score, 0) / takenTests.length) 
                  : 0}%
              </p>
              <p className="text-gray-700 font-medium">Avg Score</p>
            </div>
          </div>
        </div>

        {/* Tabs */}
        <div className="bg-white rounded-3xl shadow-xl overflow-hidden">
          <div className="flex border-b border-gray-200">
            <button
              onClick={() => setActiveTab('my-tests')}
              className={`flex-1 py-4 px-6 font-bold text-lg transition-all ${
                activeTab === 'my-tests'
                  ? 'bg-gradient-primary text-white'
                  : 'text-gray-600 hover:bg-gray-50'
              }`}
            >
              My Created Tests ({myTests.length})
            </button>
            <button
              onClick={() => setActiveTab('taken-tests')}
              className={`flex-1 py-4 px-6 font-bold text-lg transition-all ${
                activeTab === 'taken-tests'
                  ? 'bg-gradient-primary text-white'
                  : 'text-gray-600 hover:bg-gray-50'
              }`}
            >
              Tests I've Taken ({takenTests.length})
            </button>
          </div>

          <div className="p-8">
            {/* My Created Tests */}
            {activeTab === 'my-tests' && (
              <div className="space-y-6">
                {myTests.map((test) => (
                  <div key={test.id} className="bg-gradient-to-r from-purple-50 to-pink-50 rounded-2xl p-6 hover:shadow-lg transition-all">
                    <div className="flex justify-between items-start mb-4">
                      <div className="flex-1">
                        <h3 className="text-2xl font-bold text-gray-800 mb-2">{test.title}</h3>
                        <p className="text-gray-600">{test.description || 'No description'}</p>
                        <p className="text-sm text-gray-500 mt-2">
                          Created on {new Date(test.created_at).toLocaleDateString()}
                        </p>
                      </div>
                      <div className="flex gap-2">
                        <Link href={`/edit-test/${test.id}`}>
                          <button className="p-3 bg-blue-100 text-blue-600 rounded-xl hover:bg-blue-200 transition-all">
                            <Edit className="w-5 h-5" />
                          </button>
                        </Link>
                        <button className="p-3 bg-green-100 text-green-600 rounded-xl hover:bg-green-200 transition-all">
                          <Share2 className="w-5 h-5" />
                        </button>
                        <button 
                          onClick={() => handleDeleteTest(test.id)}
                          className="p-3 bg-red-100 text-red-600 rounded-xl hover:bg-red-200 transition-all"
                        >
                          <Trash2 className="w-5 h-5" />
                        </button>
                      </div>
                    </div>

                    <div className="grid grid-cols-3 gap-4">
                      <div className="bg-white rounded-xl p-4 text-center">
                        <Clock className="w-6 h-6 text-purple-500 mx-auto mb-1" />
                        <p className="text-2xl font-bold text-gray-800">{test.questions?.length || 0}</p>
                        <p className="text-sm text-gray-600">Questions</p>
                      </div>
                      <div className="bg-white rounded-xl p-4 text-center">
                        <Users className="w-6 h-6 text-blue-500 mx-auto mb-1" />
                        <p className="text-2xl font-bold text-gray-800">{test.participants_count || 0}</p>
                        <p className="text-sm text-gray-600">Participants</p>
                      </div>
                      <div className="bg-white rounded-xl p-4 text-center">
                        <Trophy className="w-6 h-6 text-yellow-500 mx-auto mb-1" />
                        <p className="text-2xl font-bold text-gray-800">{test.avg_score || 0}%</p>
                        <p className="text-sm text-gray-600">Avg Score</p>
                      </div>
                    </div>
                  </div>
                ))}

                {myTests.length === 0 && (
                  <div className="text-center py-16">
                    <div className="w-24 h-24 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-6">
                      <Plus className="w-12 h-12 text-gray-400" />
                    </div>
                    <h3 className="text-2xl font-bold text-gray-800 mb-2">No tests created yet</h3>
                    <p className="text-gray-600 mb-6">Start creating your first test!</p>
                    <Link href="/create-test">
                      <button className="bg-gradient-primary text-white px-8 py-4 rounded-xl font-bold hover:shadow-xl transition-all">
                        Create Your First Test
                      </button>
                    </Link>
                  </div>
                )}
              </div>
            )}

            {/* Taken Tests */}
            {activeTab === 'taken-tests' && (
              <div className="space-y-6">
                {takenTests.map((result) => (
                  <div key={result.id} className="bg-gradient-to-r from-blue-50 to-green-50 rounded-2xl p-6 hover:shadow-lg transition-all">
                    <div className="flex justify-between items-start mb-4">
                      <div className="flex-1">
                        <h3 className="text-2xl font-bold text-gray-800 mb-2">{result.tests?.title || 'Test'}</h3>
                        <p className="text-gray-600">Completed on {new Date(result.completed_at).toLocaleDateString()}</p>
                      </div>
                      <div className={`px-6 py-3 rounded-xl font-bold text-2xl ${
                        result.score >= 70 ? 'bg-green-100 text-green-600' : 'bg-yellow-100 text-yellow-600'
                      }`}>
                        {result.score}%
                      </div>
                    </div>

                    <div className="flex gap-4">
                      <div className="flex-1 bg-white rounded-xl p-4 text-center">
                        <p className="text-lg font-bold text-gray-800">
                          {Math.round((result.score / 100) * result.total_questions)}/{result.total_questions}
                        </p>
                        <p className="text-sm text-gray-600">Correct Answers</p>
                      </div>
                      <Link href={`/test-results/${result.test_id}?resultId=${result.id}`} className="flex-1">
                        <button className="w-full bg-blue-500 text-white py-4 rounded-xl font-semibold hover:bg-blue-600 transition-all">
                          View Results
                        </button>
                      </Link>
                      <Link href={`/take-test/${result.test_id}`} className="flex-1">
                        <button className="w-full bg-purple-500 text-white py-4 rounded-xl font-semibold hover:bg-purple-600 transition-all">
                          Retake Test
                        </button>
                      </Link>
                    </div>
                  </div>
                ))}

                {takenTests.length === 0 && (
                  <div className="text-center py-16">
                    <div className="w-24 h-24 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-6">
                      <Trophy className="w-12 h-12 text-gray-400" />
                    </div>
                    <h3 className="text-2xl font-bold text-gray-800 mb-2">No tests taken yet</h3>
                    <p className="text-gray-600 mb-6">Challenge yourself with a test!</p>
                    <Link href="/browse-tests">
                      <button className="bg-gradient-to-r from-blue-500 to-green-500 text-white px-8 py-4 rounded-xl font-bold hover:shadow-xl transition-all">
                        Browse Available Tests
                      </button>
                    </Link>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
      }
