import { useState, useEffect } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/router'
import { ArrowLeft, Check, X, Zap, Crown, Star, DollarSign, AlertCircle } from 'lucide-react'
import { useAuth } from '../contexts/AuthContext'
import { updateSubscription } from '../lib/supabase'
import { getUserUsageStats } from '../lib/subscriptionLimits'

export default function Subscription() {
  const router = useRouter()
  const { user, subscription: currentSub, isAuthenticated } = useAuth()
  const [loading, setLoading] = useState(true)
  const [upgrading, setUpgrading] = useState(false)
  const [selectedPlan, setSelectedPlan] = useState(null)
  const [showPaymentModal, setShowPaymentModal] = useState(false)
  const [usageStats, setUsageStats] = useState(null)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState(false)

  const [paymentData, setPaymentData] = useState({
    walletAddress: '',
    transactionHash: ''
  })

  useEffect(() => {
    if (!isAuthenticated) {
      router.push('/login')
      return
    }
    loadUsageStats()
  }, [isAuthenticated])

  const loadUsageStats = async () => {
    const stats = await getUserUsageStats()
    setUsageStats(stats)
    setLoading(false)
  }

  const handleUpgrade = (plan) => {
    setSelectedPlan(plan)
    setShowPaymentModal(true)
    setError('')
  }

  const handlePaymentSubmit = async (e) => {
    e.preventDefault()
    
    if (!paymentData.walletAddress.trim() || !paymentData.transactionHash.trim()) {
      setError('Please fill in all payment details')
      return
    }

    setUpgrading(true)
    setError('')

    try {
      // Calculate subscription period
      const now = new Date()
      const periodEnd = new Date(now)
      
      if (selectedPlan === 'monthly') {
        periodEnd.setMonth(periodEnd.getMonth() + 1)
      } else if (selectedPlan === 'yearly') {
        periodEnd.setFullYear(periodEnd.getFullYear() + 1)
      }

      // Update subscription in database
      const { data, error: subError } = await updateSubscription({
        plan: selectedPlan,
        status: 'active',
        current_period_start: now.toISOString(),
        current_period_end: periodEnd.toISOString()
      })

      if (subError) {
        setError('Failed to update subscription: ' + subError.message)
        setUpgrading(false)
        return
      }

      setSuccess(true)
      
      // Reload usage stats
      await loadUsageStats()
      
      // Close modal after 2 seconds
      setTimeout(() => {
        setShowPaymentModal(false)
        setSuccess(false)
        setPaymentData({ walletAddress: '', transactionHash: '' })
      }, 2000)

    } catch (err) {
      setError('An error occurred. Please try again.')
    } finally {
      setUpgrading(false)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-50 via-pink-50 to-blue-50 flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-purple-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600 font-semibold">Loading...</p>
        </div>
      </div>
    )
  }

  const isPremium = usageStats?.isPremium
  const currentPlan = usageStats?.plan || 'free'

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-pink-50 to-blue-50">
      {/* Header */}
      <div className="bg-white/80 backdrop-blur-md shadow-lg">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex justify-between items-center">
            <Link href="/dashboard" className="inline-flex items-center text-purple-600 hover:text-purple-800 font-medium transition-colors">
              <ArrowLeft className="w-5 h-5 mr-2" />
              Back to Dashboard
            </Link>
            <h1 className="text-2xl font-bold bg-gradient-primary bg-clip-text text-transparent">
              Subscription Plans
            </h1>
            <div className="w-32"></div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 py-12">
        {/* Current Usage */}
        {usageStats && (
          <div className="bg-white rounded-3xl shadow-xl p-8 mb-12">
            <h2 className="text-2xl font-bold text-gray-800 mb-6">Your Current Usage</h2>
            
            <div className="grid md:grid-cols-3 gap-6">
              <div className="bg-gradient-to-br from-blue-50 to-purple-50 rounded-2xl p-6">
                <p className="text-gray-600 mb-2">Current Plan</p>
                <p className="text-3xl font-bold text-purple-600">{usageStats.planName}</p>
                {isPremium && usageStats.subscriptionEnd && (
                  <p className="text-sm text-gray-600 mt-2">
                    Renews: {new Date(usageStats.subscriptionEnd).toLocaleDateString()}
                  </p>
                )}
              </div>

              <div className="bg-gradient-to-br from-green-50 to-blue-50 rounded-2xl p-6">
                <p className="text-gray-600 mb-2">Tests Taken This Month</p>
                <p className="text-3xl font-bold text-blue-600">
                  {usageStats.testsTaken}
                  {usageStats.limits.testsPerMonth > 0 && ` / ${usageStats.limits.testsPerMonth}`}
                </p>
                {!isPremium && (
                  <p className="text-sm text-gray-600 mt-2">
                    {usageStats.limits.testsPerMonth - usageStats.testsTaken} remaining
                  </p>
                )}
              </div>

              <div className="bg-gradient-to-br from-yellow-50 to-orange-50 rounded-2xl p-6">
                <p className="text-gray-600 mb-2">Tests Created This Month</p>
                <p className="text-3xl font-bold text-orange-600">
                  {usageStats.testsCreated}
                  {usageStats.limits.createdTestsPerMonth > 0 && ` / ${usageStats.limits.createdTestsPerMonth}`}
                </p>
                {!isPremium && (
                  <p className="text-sm text-gray-600 mt-2">
                    {usageStats.limits.createdTestsPerMonth - usageStats.testsCreated} remaining
                  </p>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Pricing Cards */}
        <div className="text-center mb-12">
          <h2 className="text-5xl font-bold mb-4 bg-gradient-rainbow bg-clip-text text-transparent">
            Choose Your Plan
          </h2>
          <p className="text-xl text-gray-600">
            Upgrade to unlock unlimited tests and remove ads
          </p>
        </div>

        <div className="grid md:grid-cols-3 gap-8">
          {/* Free Plan */}
          <div className="bg-white rounded-3xl shadow-xl p-8 relative">
            <div className="text-center mb-6">
              <Zap className="w-16 h-16 text-gray-400 mx-auto mb-4" />
              <h3 className="text-3xl font-bold text-gray-800 mb-2">Free</h3>
              <p className="text-5xl font-bold text-gray-800 mb-2">$0</p>
              <p className="text-gray-600">Forever free</p>
            </div>

            <ul className="space-y-4 mb-8">
              <li className="flex items-start gap-3">
                <Check className="w-6 h-6 text-green-500 flex-shrink-0 mt-0.5" />
                <span className="text-gray-700">5 tests per month</span>
              </li>
              <li className="flex items-start gap-3">
                <Check className="w-6 h-6 text-green-500 flex-shrink-0 mt-0.5" />
                <span className="text-gray-700">Create 1 test per month</span>
              </li>
              <li className="flex items-start gap-3">
                <Check className="w-6 h-6 text-green-500 flex-shrink-0 mt-0.5" />
                <span className="text-gray-700">Basic features</span>
              </li>
              <li className="flex items-start gap-3">
                <X className="w-6 h-6 text-red-500 flex-shrink-0 mt-0.5" />
                <span className="text-gray-500">Ads displayed</span>
              </li>
              <li className="flex items-start gap-3">
                <X className="w-6 h-6 text-red-500 flex-shrink-0 mt-0.5" />
                <span className="text-gray-500">No proctoring</span>
              </li>
            </ul>

            {currentPlan === 'free' && (
              <div className="bg-gray-100 text-gray-600 py-3 rounded-xl font-semibold text-center">
                Current Plan
              </div>
            )}
          </div>

          {/* Monthly Plan */}
          <div className="bg-gradient-to-br from-purple-500 to-pink-500 rounded-3xl shadow-2xl p-8 relative transform scale-105">
            <div className="absolute -top-4 left-1/2 transform -translate-x-1/2 bg-yellow-400 text-yellow-900 px-6 py-2 rounded-full font-bold text-sm">
              POPULAR
            </div>

            <div className="text-center mb-6">
              <Crown className="w-16 h-16 text-white mx-auto mb-4" />
              <h3 className="text-3xl font-bold text-white mb-2">Premium Monthly</h3>
              <p className="text-6xl font-bold text-white mb-2">$5</p>
              <p className="text-white/90">USDC per month</p>
            </div>

            <ul className="space-y-4 mb-8 text-white">
              <li className="flex items-start gap-3">
                <Check className="w-6 h-6 flex-shrink-0 mt-0.5" />
                <span className="font-medium">Unlimited tests to take</span>
              </li>
              <li className="flex items-start gap-3">
                <Check className="w-6 h-6 flex-shrink-0 mt-0.5" />
                <span className="font-medium">Create unlimited tests</span>
              </li>
              <li className="flex items-start gap-3">
                <Check className="w-6 h-6 flex-shrink-0 mt-0.5" />
                <span className="font-medium">No ads</span>
              </li>
              <li className="flex items-start gap-3">
                <Check className="w-6 h-6 flex-shrink-0 mt-0.5" />
                <span className="font-medium">AI Proctoring</span>
              </li>
              <li className="flex items-start gap-3">
                <Check className="w-6 h-6 flex-shrink-0 mt-0.5" />
                <span className="font-medium">Advanced analytics</span>
              </li>
              <li className="flex items-start gap-3">
                <Check className="w-6 h-6 flex-shrink-0 mt-0.5" />
                <span className="font-medium">Priority support</span>
              </li>
            </ul>

            {currentPlan === 'monthly' ? (
              <div className="bg-white/20 text-white py-3 rounded-xl font-semibold text-center">
                Current Plan
              </div>
            ) : (
              <button
                onClick={() => handleUpgrade('monthly')}
                className="w-full bg-white text-purple-600 py-4 rounded-xl font-bold text-lg hover:shadow-xl transform hover:scale-105 transition-all"
              >
                Upgrade to Monthly
              </button>
            )}
          </div>

          {/* Yearly Plan */}
          <div className="bg-white rounded-3xl shadow-xl p-8 relative border-4 border-yellow-400">
            <div className="absolute -top-4 left-1/2 transform -translate-x-1/2 bg-green-500 text-white px-6 py-2 rounded-full font-bold text-sm">
              BEST VALUE
            </div>

            <div className="text-center mb-6">
              <Star className="w-16 h-16 text-yellow-500 mx-auto mb-4" />
              <h3 className="text-3xl font-bold text-gray-800 mb-2">Premium Yearly</h3>
              <p className="text-6xl font-bold text-gray-800 mb-2">$50</p>
              <p className="text-gray-600">USDC per year</p>
              <p className="text-green-600 font-bold mt-2">Save $10!</p>
            </div>

            <ul className="space-y-4 mb-8">
              <li className="flex items-start gap-3">
                <Check className="w-6 h-6 text-green-500 flex-shrink-0 mt-0.5" />
                <span className="text-gray-700 font-medium">Everything in Monthly</span>
              </li>
              <li className="flex items-start gap-3">
                <Check className="w-6 h-6 text-green-500 flex-shrink-0 mt-0.5" />
                <span className="text-gray-700 font-medium">Save $10 per year</span>
              </li>
              <li className="flex items-start gap-3">
                <Check className="w-6 h-6 text-green-500 flex-shrink-0 mt-0.5" />
                <span className="text-gray-700 font-medium">Early access to features</span>
              </li>
              <li className="flex items-start gap-3">
                <Check className="w-6 h-6 text-green-500 flex-shrink-0 mt-0.5" />
                <span className="text-gray-700 font-medium">API access (coming soon)</span>
              </li>
            </ul>

            {currentPlan === 'yearly' ? (
              <div className="bg-gray-100 text-gray-600 py-3 rounded-xl font-semibold text-center">
                Current Plan
              </div>
            ) : (
              <button
                onClick={() => handleUpgrade('yearly')}
                className="w-full bg-gradient-to-r from-yellow-500 to-orange-500 text-white py-4 rounded-xl font-bold text-lg hover:shadow-xl transform hover:scale-105 transition-all"
              >
                Upgrade to Yearly
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Payment Modal */}
      {showPaymentModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-3xl shadow-2xl p-8 max-w-md w-full">
            <h3 className="text-2xl font-bold text-gray-800 mb-6">
              Complete Payment
            </h3>

            {error && (
              <div className="mb-4 bg-red-50 border-l-4 border-red-500 p-4 rounded-r-xl">
                <div className="flex items-center">
                  <AlertCircle className="w-5 h-5 text-red-500 mr-3" />
                  <p className="text-red-700 text-sm">{error}</p>
                </div>
              </div>
            )}

            {success && (
              <div className="mb-4 bg-green-50 border-l-4 border-green-500 p-4 rounded-r-xl">
                <div className="flex items-center">
                  <Check className="w-5 h-5 text-green-500 mr-3" />
                  <p className="text-green-700">Payment successful! Welcome to Premium!</p>
                </div>
              </div>
            )}

            {!success && (
              <form onSubmit={handlePaymentSubmit} className="space-y-6">
                {/* Payment Instructions */}
                <div className="bg-blue-50 rounded-xl p-4 text-sm">
                  <p className="font-bold text-blue-900 mb-2">Send Payment To:</p>
                  <p className="font-mono text-blue-800 text-xs break-all bg-white p-2 rounded">
                    0xPLATFORM_WALLET_ADDRESS_HERE
                  </p>
                  <p className="font-bold text-blue-900 mt-3">Amount:</p>
                  <p className="text-2xl font-bold text-blue-600">
                    ${selectedPlan === 'monthly' ? '5' : '50'} USDC
                  </p>
                </div>

                <div>
                  <label className="block text-gray-700 font-semibold mb-2 text-sm">
                    Your Wallet Address *
                  </label>
                  <input
                    type="text"
                    required
                    value={paymentData.walletAddress}
                    onChange={(e) => setPaymentData({...paymentData, walletAddress: e.target.value})}
                    className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-purple-500 outline-none font-mono text-sm"
                    placeholder="0x..."
                    disabled={upgrading}
                  />
                </div>

                <div>
                  <label className="block text-gray-700 font-semibold mb-2 text-sm">
                    Transaction Hash *
                  </label>
                  <input
                    type="text"
                    required
                    value={paymentData.transactionHash}
                    onChange={(e) => setPaymentData({...paymentData, transactionHash: e.target.value})}
                    className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-purple-500 outline-none font-mono text-sm"
                    placeholder="0x..."
                    disabled={upgrading}
                  />
                </div>

                <div className="flex gap-3">
                  <button
                    type="button"
                    onClick={() => setShowPaymentModal(false)}
                    disabled={upgrading}
                    className="flex-1 bg-gray-200 text-gray-700 py-3 rounded-xl font-semibold hover:bg-gray-300 transition-all"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={upgrading}
                    className={`flex-1 bg-gradient-primary text-white py-3 rounded-xl font-bold hover:shadow-lg transition-all ${
                      upgrading ? 'opacity-50 cursor-not-allowed' : ''
                    }`}
                  >
                    {upgrading ? 'Processing...' : 'Confirm Payment'}
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}
    </div>
  )
      }
