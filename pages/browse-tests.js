import { useState, useEffect } from 'react'
import Link from 'next/link'
import { ArrowLeft, Search, Clock, Users, Trophy, Play } from 'lucide-react'
import { getTests, searchTests } from '../lib/supabase'

export default function BrowseTests() {
  const [searchQuery, setSearchQuery] = useState('')
  const [tests, setTests] = useState([])
  const [filteredTests, setFilteredTests] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadTests()
  }, [])

  useEffect(() => {
    if (searchQuery.trim()) {
      performSearch()
    } else {
      setFilteredTests(tests)
    }
  }, [searchQuery, tests])

  const loadTests = async () => {
    setLoading(true)
    const { data, error } = await getTests()
    
    if (!error && data) {
      setTests(data)
      setFilteredTests(data)
    }
    
    setLoading(false)
  }

  const performSearch = async () => {
    if (!searchQuery.trim()) {
      setFilteredTests(tests)
      return
    }

    const { data, error } = await searchTests(searchQuery)
    
    if (!error && data) {
      setFilteredTests(data)
    }
  }

  const getDifficultyColor = (questionsCount) => {
    if (questionsCount <= 10) return 'bg-green-100 text-green-700'
    if (questionsCount <= 20) return 'bg-yellow-100 text-yellow-700'
    return 'bg-red-100 text-red-700'
  }

  const getDifficultyLabel = (questionsCount) => {
    if (questionsCount <= 10) return 'Beginner'
    if (questionsCount <= 20) return 'Intermediate'
    return 'Advanced'
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-purple-50 to-pink-50 flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-purple-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600 font-semibold">Loading tests...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-purple-50 to-pink-50">
      {/* Header */}
      <div className="bg-white/80 backdrop-blur-md shadow-lg sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex justify-between items-center">
            <Link href="/" className="inline-flex items-center text-purple-600 hover:text-purple-800 font-medium transition-colors">
              <ArrowLeft className="w-5 h-5 mr-2" />
              Back to Home
            </Link>
            <h1 className="text-2xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
              Browse Tests
            </h1>
            <div className="w-24"></div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 py-8">
        {/* Hero Section */}
        <div className="text-center mb-12">
          <h2 className="text-4xl md:text-5xl font-bold mb-4 bg-gradient-rainbow bg-clip-text text-transparent">
            Challenge Yourself!
          </h2>
          <p className="text-xl text-gray-600">
            Browse {tests.length} tests created by our amazing community
          </p>
        </div>

        {/* Search Bar */}
        <div className="max-w-3xl mx-auto mb-12">
          <div className="relative">
            <Search className="absolute left-6 top-1/2 transform -translate-y-1/2 text-gray-400 w-6 h-6" />
            <input
              type="text"
              placeholder="Search for tests by title or description..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-16 pr-6 py-5 rounded-2xl border-2 border-purple-200 focus:border-purple-500 focus:ring-4 focus:ring-purple-100 outline-none text-lg transition-all shadow-lg bg-white"
            />
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-3 gap-6 mb-12">
          <div className="bg-white rounded-2xl p-6 text-center shadow-lg">
            <Trophy className="w-12 h-12 text-yellow-500 mx-auto mb-2" />
            <p className="text-3xl font-bold text-gray-800">{tests.length}</p>
            <p className="text-gray-600">Active Tests</p>
          </div>
          <div className="bg-white rounded-2xl p-6 text-center shadow-lg">
            <Users className="w-12 h-12 text-blue-500 mx-auto mb-2" />
            <p className="text-3xl font-bold text-gray-800">
              {tests.reduce((acc, test) => acc + (test.participants_count || 0), 0)}
            </p>
            <p className="text-gray-600">Total Participants</p>
          </div>
          <div className="bg-white rounded-2xl p-6 text-center shadow-lg">
            <Clock className="w-12 h-12 text-green-500 mx-auto mb-2" />
            <p className="text-3xl font-bold text-gray-800">
              {tests.length > 0 
                ? Math.round(tests.reduce((acc, test) => acc + (test.time_limit || 30), 0) / tests.length)
                : 0}
            </p>
            <p className="text-gray-600">Avg. Time (min)</p>
          </div>
        </div>

        {/* Tests Grid */}
        {filteredTests.length > 0 ? (
          <div className="grid md:grid-cols-2 gap-8">
            {filteredTests.map((test) => {
              const questionsCount = test.questions?.length || 0
              const difficulty = getDifficultyLabel(questionsCount)
              
              return (
                <div key={test.id} className="bg-white rounded-3xl shadow-xl overflow-hidden hover:shadow-2xl transform hover:scale-105 transition-all duration-300">
                  {/* Test Header */}
                  <div className="bg-gradient-to-r from-purple-500 to-pink-500 p-6">
                    <div className="flex justify-between items-start mb-3">
                      <h3 className="text-2xl font-bold text-white flex-1">{test.title}</h3>
                      <span className={`px-4 py-1 rounded-full text-sm font-semibold ${getDifficultyColor(questionsCount)}`}>
                        {difficulty}
                      </span>
                    </div>
                    <p className="text-white/90">{test.description || 'No description available'}</p>
                  </div>

                  {/* Test Details */}
                  <div className="p-6">
                    <div className="grid grid-cols-3 gap-4 mb-6">
                      <div className="text-center">
                        <div className="w-12 h-12 bg-blue-100 rounded-xl flex items-center justify-center mx-auto mb-2">
                          <Trophy className="w-6 h-6 text-blue-500" />
                        </div>
                        <p className="text-2xl font-bold text-gray-800">{questionsCount}</p>
                        <p className="text-sm text-gray-600">Questions</p>
                      </div>
                      <div className="text-center">
                        <div className="w-12 h-12 bg-green-100 rounded-xl flex items-center justify-center mx-auto mb-2">
                          <Clock className="w-6 h-6 text-green-500" />
                        </div>
                        <p className="text-2xl font-bold text-gray-800">{test.time_limit || 30}</p>
                        <p className="text-sm text-gray-600">Minutes</p>
                      </div>
                      <div className="text-center">
                        <div className="w-12 h-12 bg-purple-100 rounded-xl flex items-center justify-center mx-auto mb-2">
                          <Users className="w-6 h-6 text-purple-500" />
                        </div>
                        <p className="text-2xl font-bold text-gray-800">{test.participants_count || 0}</p>
                        <p className="text-sm text-gray-600">Taken</p>
                      </div>
                    </div>

                    {/* Creator */}
                    <div className="flex items-center justify-between mb-6 pb-6 border-b border-gray-200">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-gradient-primary rounded-full flex items-center justify-center text-white font-bold">
                          {test.user_id ? test.user_id.substring(0, 2).toUpperCase() : 'U'}
                        </div>
                        <div>
                          <p className="text-sm text-gray-500">Created</p>
                          <p className="font-semibold text-gray-800">
                            {new Date(test.created_at).toLocaleDateString()}
                          </p>
                        </div>
                      </div>
                      {test.avg_score > 0 && (
                        <div className="text-right">
                          <p className="text-sm text-gray-500">Avg Score</p>
                          <p className="font-semibold text-gray-800">{Math.round(test.avg_score)}%</p>
                        </div>
                      )}
                    </div>

                    {/* Take Test Button */}
                    <Link href={`/take-test/${test.id}`}>
                      <button className="w-full bg-gradient-to-r from-blue-500 to-purple-500 text-white py-4 rounded-xl font-bold text-lg hover:shadow-xl transform hover:scale-105 transition-all flex items-center justify-center gap-3">
                        <Play className="w-6 h-6" />
                        Start Test Now
                      </button>
                    </Link>
                  </div>
                </div>
              )
            })}
          </div>
        ) : (
          /* No Results */
          <div className="text-center py-16">
            <div className="w-24 h-24 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-6">
              <Search className="w-12 h-12 text-gray-400" />
            </div>
            <h3 className="text-2xl font-bold text-gray-800 mb-2">
              {searchQuery ? 'No tests found' : 'No tests available yet'}
            </h3>
            <p className="text-gray-600 mb-6">
              {searchQuery 
                ? 'Try adjusting your search query' 
                : 'Be the first to create a test!'}
            </p>
            {!searchQuery && (
              <Link href="/create-test">
                <button className="bg-gradient-primary text-white px-8 py-4 rounded-xl font-bold hover:shadow-xl transition-all">
                  Create First Test
                </button>
              </Link>
            )}
          </div>
        )}
      </div>
    </div>
  )
                               }
