import { useState, useEffect } from 'react'
import { useRouter } from 'next/router'
import Link from 'next/link'
import { ArrowLeft, DollarSign, Wallet, Check, AlertCircle, Clock, Trophy } from 'lucide-react'
import { useAuth } from '../../contexts/AuthContext'
import { getTestById, recordTestPayment } from '../../lib/supabase'

export default function PayForTest() {
  const router = useRouter()
  const { id } = router.query
  const { user, isAuthenticated } = useAuth()
  
  const [testData, setTestData] = useState(null)
  const [loading, setLoading] = useState(true)
  const [paying, setPaying] = useState(false)
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
    
    if (id) {
      loadTest()
    }
  }, [id, isAuthenticated])

  const loadTest = async () => {
    setLoading(true)
    
    const { data: test, error } = await getTestById(id)
    
    if (error || !test) {
      setError('Test not found')
      setLoading(false)
      return
    }

    if (!test.is_paid) {
      // Not a paid test, redirect to take test
      router.push(`/take-test/${id}`)
      return
    }

    setTestData(test)
    setLoading(false)
  }

  const handlePayment = async (e) => {
    e.preventDefault()
    
    if (!paymentData.walletAddress.trim()) {
      setError('Please enter your wallet address')
      return
    }

    if (!paymentData.transactionHash.trim()) {
      setError('Please enter the transaction hash')
      return
    }

    setPaying(true)
    setError('')

    try {
      // Record payment in database
      const { data, error: paymentError } = await recordTestPayment({
        test_id: id,
        user_email: user.email,
        amount_usdc: testData.price_usdc,
        platform_fee_percentage: 10,
        transaction_hash: paymentData.transactionHash
      })

      if (paymentError) {
        setError('Failed to record payment: ' + paymentError.message)
        setPaying(false)
        return
      }

      setSuccess(true)
      
      // Redirect to test after 3 seconds
      setTimeout(() => {
        router.push(`/take-test/${id}`)
      }, 3000)

    } catch (err) {
      setError('An error occurred. Please try again.')
      setPaying(false)
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

  if (!testData) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-50 via-pink-50 to-blue-50 flex items-center justify-center">
        <div className="text-center">
          <p className="text-red-600 font-semibold">{error || 'Test not found'}</p>
          <Link href="/browse-tests">
            <button className="mt-4 bg-gradient-primary text-white px-6 py-3 rounded-xl font-semibold">
              Browse Tests
            </button>
          </Link>
        </div>
      </div>
    )
  }

  const platformFee = (testData.price_usdc * 0.1).toFixed(2)
  const creatorAmount = (testData.price_usdc * 0.9).toFixed(2)

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-pink-50 to-blue-50">
      {/* Header */}
      <div className="bg-white/80 backdrop-blur-md shadow-lg">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex justify-between items-center">
            <Link href={`/browse-tests`} className="inline-flex items-center text-purple-600 hover:text-purple-800 font-medium transition-colors">
              <ArrowLeft className="w-5 h-5 mr-2" />
              Back
            </Link>
            <h1 className="text-2xl font-bold bg-gradient-primary bg-clip-text text-transparent">
              Payment Required
            </h1>
            <div className="w-20"></div>
          </div>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 py-8">
        <div className="grid md:grid-cols-2 gap-8">
          {/* Test Info */}
          <div className="bg-white rounded-3xl shadow-xl p-8">
            <h2 className="text-3xl font-bold text-gray-800 mb-4">{testData.title}</h2>
            <p className="text-gray-600 mb-6">{testData.description}</p>

            <div className="space-y-4 mb-6">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 bg-blue-100 rounded-xl flex items-center justify-center">
                  <Trophy className="w-6 h-6 text-blue-500" />
                </div>
                <div>
                  <p className="text-2xl font-bold text-gray-800">{testData.questions?.length || 0}</p>
                  <p className="text-sm text-gray-600">Questions</p>
                </div>
              </div>

              <div className="flex items-center gap-3">
                <div className="w-12 h-12 bg-green-100 rounded-xl flex items-center justify-center">
                  <Clock className="w-6 h-6 text-green-500" />
                </div>
                <div>
                  <p className="text-2xl font-bold text-gray-800">{testData.time_limit}</p>
                  <p className="text-sm text-gray-600">Minutes</p>
                </div>
              </div>
            </div>

            <div className="bg-gradient-to-r from-yellow-50 to-orange-50 rounded-2xl p-6 border-2 border-yellow-200">
              <div className="flex items-center gap-3 mb-3">
                <DollarSign className="w-10 h-10 text-yellow-600" />
                <div>
                  <p className="text-sm text-gray-600">Test Price</p>
                  <p className="text-4xl font-bold text-yellow-600">${testData.price_usdc}</p>
                  <p className="text-sm text-gray-600">USDC</p>
                </div>
              </div>

              <div className="bg-white rounded-xl p-4 text-sm space-y-1">
                <div className="flex justify-between">
                  <span className="text-gray-600">Test Price:</span>
                  <span className="font-semibold">${testData.price_usdc} USDC</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Platform Fee (10%):</span>
                  <span className="font-semibold">-${platformFee} USDC</span>
                </div>
                <div className="border-t border-gray-200 pt-2 mt-2">
                  <div className="flex justify-between">
                    <span className="text-gray-600">Creator Receives:</span>
                    <span className="font-bold text-green-600">${creatorAmount} USDC</span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Payment Form */}
          <div className="bg-white rounded-3xl shadow-xl p-8">
            <h3 className="text-2xl font-bold text-gray-800 mb-6">Complete Payment</h3>

            {error && (
              <div className="mb-6 bg-red-50 border-l-4 border-red-500 p-4 rounded-r-xl">
                <div className="flex items-center">
                  <AlertCircle className="w-5 h-5 text-red-500 mr-3" />
                  <p className="text-red-700">{error}</p>
                </div>
              </div>
            )}

            {success && (
              <div className="mb-6 bg-green-50 border-l-4 border-green-500 p-4 rounded-r-xl">
                <div className="flex items-center">
                  <Check className="w-5 h-5 text-green-500 mr-3" />
                  <p className="text-green-700">Payment recorded! Redirecting to test...</p>
                </div>
              </div>
            )}

            {!success && (
              <form onSubmit={handlePayment} className="space-y-6">
                {/* Instructions */}
                <div className="bg-blue-50 rounded-2xl p-6">
                  <h4 className="font-bold text-blue-900 mb-3">How to Pay:</h4>
                  <ol className="text-blue-800 space-y-2 text-sm list-decimal list-inside">
                    <li>Copy the creator's wallet address below</li>
                    <li>Send <span className="font-bold">${testData.price_usdc} USDC</span> to that address</li>
                    <li>Copy the transaction hash from your wallet</li>
                    <li>Paste it below and submit</li>
                  </ol>
                </div>

                {/* Creator Wallet Address */}
                <div>
                  <label className="block text-gray-700 font-semibold mb-2">
                    <Wallet className="w-5 h-5 inline mr-2" />
                    Creator's USDC Wallet Address
                  </label>
                  <div className="bg-gray-50 rounded-xl p-4 border-2 border-gray-200">
                    <p className="font-mono text-sm text-gray-800 break-all">{testData.creator_wallet}</p>
                    <button
                      type="button"
                      onClick={() => {
                        navigator.clipboard.writeText(testData.creator_wallet)
                        alert('Wallet address copied!')
                      }}
                      className="mt-2 text-purple-600 hover:text-purple-800 font-semibold text-sm"
                    >
                      📋 Copy Address
                    </button>
                  </div>
                </div>

                {/* User Wallet */}
                <div>
                  <label className="block text-gray-700 font-semibold mb-2">
                    Your Wallet Address *
                  </label>
                  <input
                    type="text"
                    required
                    value={paymentData.walletAddress}
                    onChange={(e) => setPaymentData({...paymentData, walletAddress: e.target.value})}
                    className="w-full px-4 py-4 border-2 border-gray-200 rounded-xl focus:border-purple-500 focus:ring-4 focus:ring-purple-100 outline-none transition-all font-mono text-sm"
                    placeholder="0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb"
                    disabled={paying}
                  />
                </div>

                {/* Transaction Hash */}
                <div>
                  <label className="block text-gray-700 font-semibold mb-2">
                    Transaction Hash *
                  </label>
                  <input
                    type="text"
                    required
                    value={paymentData.transactionHash}
                    onChange={(e) => setPaymentData({...paymentData, transactionHash: e.target.value})}
                    className="w-full px-4 py-4 border-2 border-gray-200 rounded-xl focus:border-purple-500 focus:ring-4 focus:ring-purple-100 outline-none transition-all font-mono text-sm"
                    placeholder="0x1234567890abcdef..."
                    disabled={paying}
                  />
                  <p className="text-sm text-gray-500 mt-2">
                    The transaction hash from your wallet after sending USDC
                  </p>
                </div>

                {/* Submit Button */}
                <button
                  type="submit"
                  disabled={paying}
                  className={`w-full bg-gradient-to-r from-green-500 to-blue-500 text-white py-4 rounded-xl font-bold text-lg hover:shadow-xl transform hover:scale-105 transition-all ${
                    paying ? 'opacity-50 cursor-not-allowed' : ''
                  }`}
                >
                  {paying ? 'Verifying Payment...' : 'Confirm Payment & Start Test'}
                </button>

                <p className="text-xs text-gray-500 text-center">
                  By proceeding, you agree that you have sent the payment. Our team will verify the transaction.
                </p>
              </form>
            )}
          </div>
        </div>

        {/* Need Help */}
        <div className="mt-8 bg-white rounded-2xl shadow-lg p-6 text-center">
          <h3 className="font-bold text-gray-800 mb-2">Need Help?</h3>
          <p className="text-gray-600 mb-4">
            If you don't have USDC or need assistance with the payment process, please contact support.
          </p>
          <div className="flex justify-center gap-4">
            <a href="https://www.coinbase.com/how-to-buy/usd-coin" target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:text-blue-800 font-semibold">
              How to buy USDC
            </a>
            <span className="text-gray-400">•</span>
            <Link href="/support" className="text-purple-600 hover:text-purple-800 font-semibold">
              Contact Support
            </Link>
          </div>
        </div>
      </div>
    </div>
  )
      }
