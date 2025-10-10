import { createContext, useContext, useEffect, useState } from 'react'
import { useRouter } from 'next/router'
import { supabase, getCurrentUser, signOut as supabaseSignOut } from '../lib/supabase'

const AuthContext = createContext({})

export const useAuth = () => {
  const context = useContext(AuthContext)
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider')
  }
  return context
}

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)
  const [subscription, setSubscription] = useState(null)
  const router = useRouter()

  useEffect(() => {
    // Check active session
    checkUser()

    // Listen for auth changes
    const { data: authListener } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        if (session?.user) {
          setUser(session.user)
          await loadUserSubscription(session.user.id)
        } else {
          setUser(null)
          setSubscription(null)
        }
        setLoading(false)
      }
    )

    return () => {
      authListener?.subscription?.unsubscribe()
    }
  }, [])

  const checkUser = async () => {
    try {
      const user = await getCurrentUser()
      setUser(user)
      if (user) {
        await loadUserSubscription(user.id)
      }
    } catch (error) {
      console.error('Error checking user:', error)
    } finally {
      setLoading(false)
    }
  }

  const loadUserSubscription = async (userId) => {
    try {
      const { data, error } = await supabase
        .from('subscriptions')
        .select('*')
        .eq('user_id', userId)
        .single()

      if (!error && data) {
        setSubscription(data)
      }
    } catch (error) {
      console.error('Error loading subscription:', error)
    }
  }

  const signOut = async () => {
    await supabaseSignOut()
    setUser(null)
    setSubscription(null)
    router.push('/')
  }

  const value = {
    user,
    subscription,
    loading,
    signOut,
    isAuthenticated: !!user,
    isPremium: subscription?.plan !== 'free',
    canCreateTest: () => {
      if (!subscription) return false
      if (subscription.plan !== 'free') return true
      // Free users can create up to 3 tests (will implement count check later)
      return true
    }
  }

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}
