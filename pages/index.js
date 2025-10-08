import { useState } from 'react'
import Link from 'next/link'
import { Search, Plus, Trophy, Clock, Users, Sparkles } from 'lucide-react'

export default function Home() {
  const [searchQuery, setSearchQuery] = useState('')

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-pink-50 to-blue-50">
      {/* Navigation */}
      <nav className="bg-white/80 backdrop-blur-md shadow-lg sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-20">
            <div className="flex items-center space-x-3">
              <div className="w-12 h-12 bg-gradient-primary rounded-full flex items-center justify-center">
                <Sparkles className="w-6 h-6 text-white" />
              </div>
              <h1 className="text-3xl font-bold bg-gradient-primary bg-clip-text text-transparent">
                QuenAnswer
              </h1>
            </div>
            
            <div className="flex items-center space-x-6">
              <Link href="/login" className="text-gray-700 hover:text-purple-600 font-medium transition-colors">
                Login
              </Link>
              <Link href="/signup" className="bg-gradient-primary text-white px-6 py-3 rounded-full font-semibold hover:shadow-lg transform hover:scale-105 transition-all">
                Sign Up
              </Link>
            </div>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="text-center mb-16">
          <h2 className="text-5xl md:text-6xl font-bold mb-6 bg-gradient-rainbow bg-clip-text text-transparent animate-pulse">
            Create Amazing Quizzes & Polls
          </h2>
          <p className="text-xl text-gray-600 mb-12 max-w-2xl mx-auto">
            Build interactive tests, set timers, track scores, and share with the world!
          </p>
        </div>

        {/* Search Bar */}
        <div className="max-w-3xl mx-auto mb-16">
          <div className="relative">
            <Search className="absolute left-6 top-1/2 transform -translate-y-1/2 text-gray-400 w-6 h-6" />
            <input
              type="text"
              placeholder="Search for quizzes, polls, and tests..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-16 pr-6 py-5 rounded-2xl border-2 border-purple-200 focus:border-purple-500 focus:ring-4 focus:ring-purple-100 outline-none text-lg transition-all shadow-lg"
            />
          </div>
        </div>

        {/* Action Cards */}
        <div className="grid md:grid-cols-2 gap-8 mb-16">
          <Link href="/create-test" className="group">
            <div className="bg-white rounded-3xl p-10 shadow-xl hover:shadow-2xl transform hover:scale-105 transition-all duration-300 border-4 border-transparent hover:border-purple-300">
              <div className="w-20 h-20 bg-gradient-to-br from-purple-500 to-pink-500 rounded-2xl flex items-center justify-center mb-6 group-hover:rotate-12 transition-transform">
                <Plus className="w-10 h-10 text-white" />
              </div>
              <h3 className="text-3xl font-bold text-gray-800 mb-4">Create a Test</h3>
              <p className="text-gray-600 text-lg">
                Build custom quizzes with unlimited questions, timers, and detailed explanations
              </p>
            </div>
          </Link>

          <Link href="/browse-tests" className="group">
            <div className="bg-white rounded-3xl p-10 shadow-xl hover:shadow-2xl transform hover:scale-105 transition-all duration-300 border-4 border-transparent hover:border-blue-300">
              <div className="w-20 h-20 bg-gradient-to-br from-blue-500 to-green-500 rounded-2xl flex items-center justify-center mb-6 group-hover:rotate-12 transition-transform">
                <Trophy className="w-10 h-10 text-white" />
              </div>
              <h3 className="text-3xl font-bold text-gray-800 mb-4">Take a Test</h3>
              <p className="text-gray-600 text-lg">
                Challenge yourself with tests from the community and see your results instantly
              </p>
            </div>
          </Link>
        </div>

        {/* Features */}
        <div className="grid md:grid-cols-3 gap-8">
          <div className="bg-white/60 backdrop-blur-sm rounded-2xl p-8 text-center">
            <div className="w-16 h-16 bg-yellow-400 rounded-full flex items-center justify-center mx-auto mb-4">
              <Clock className="w-8 h-8 text-white" />
            </div>
            <h4 className="text-xl font-bold text-gray-800 mb-2">Timed Tests</h4>
            <p className="text-gray-600">Set custom time limits for each test</p>
          </div>

          <div className="bg-white/60 backdrop-blur-sm rounded-2xl p-8 text-center">
            <div className="w-16 h-16 bg-green-400 rounded-full flex items-center justify-center mx-auto mb-4">
              <Users className="w-8 h-8 text-white" />
            </div>
            <h4 className="text-xl font-bold text-gray-800 mb-2">Collaborate</h4>
            <p className="text-gray-600">Invite others to create tests together</p>
          </div>

          <div className="bg-white/60 backdrop-blur-sm rounded-2xl p-8 text-center">
            <div className="w-16 h-16 bg-pink-400 rounded-full flex items-center justify-center mx-auto mb-4">
              <Trophy className="w-8 h-8 text-white" />
            </div>
            <h4 className="text-xl font-bold text-gray-800 mb-2">Instant Results</h4>
            <p className="text-gray-600">Get scores and explanations immediately</p>
          </div>
        </div>
      </div>
    </div>
  )
    }
