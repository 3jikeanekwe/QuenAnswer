import { supabase, getCurrentUser } from './supabase'

// Subscription plans
export const PLANS = {
  FREE: {
    id: 'free',
    name: 'Free Plan',
    price: 0,
    limits: {
      testsPerMonth: 5,
      createdTestsPerMonth: 1,
      showAds: true,
      proctoring: false,
      analytics: false
    }
  },
  MONTHLY: {
    id: 'monthly',
    name: 'Premium Monthly',
    price: 5,
    priceUSDC: 5,
    limits: {
      testsPerMonth: -1, // unlimited
      createdTestsPerMonth: -1, // unlimited
      showAds: false,
      proctoring: true,
      analytics: true
    }
  },
  YEARLY: {
    id: 'yearly',
    name: 'Premium Yearly',
    price: 50,
    priceUSDC: 50,
    limits: {
      testsPerMonth: -1, // unlimited
      createdTestsPerMonth: -1, // unlimited
      showAds: false,
      proctoring: true,
      analytics: true,
      earlyAccess: true
    }
  }
}

// Check if user can take a test
export const canTakeTest = async () => {
  const user = await getCurrentUser()
  if (!user) return { canTake: false, reason: 'Please login first' }

  // Get user subscription
  const { data: subscription } = await supabase
    .from('subscriptions')
    .select('*')
    .eq('user_id', user.id)
    .single()

  if (!subscription) {
    return { canTake: false, reason: 'No subscription found' }
  }

  // Premium users have unlimited access
  if (subscription.plan === 'monthly' || subscription.plan === 'yearly') {
    // Check if subscription is still active
    if (subscription.current_period_end) {
      const endDate = new Date(subscription.current_period_end)
      if (endDate < new Date()) {
        return { 
          canTake: false, 
          reason: 'Your subscription has expired. Please renew.',
          needsRenewal: true
        }
      }
    }
    return { canTake: true, plan: subscription.plan }
  }

  // Free users - check monthly limit
  const startOfMonth = new Date()
  startOfMonth.setDate(1)
  startOfMonth.setHours(0, 0, 0, 0)

  const { data: testsTaken, error } = await supabase
    .from('test_results')
    .select('id')
    .eq('user_id', user.id)
    .gte('completed_at', startOfMonth.toISOString())

  if (error) {
    console.error('Error checking test limit:', error)
    return { canTake: false, reason: 'Error checking limits' }
  }

  const testsThisMonth = testsTaken?.length || 0
  const limit = PLANS.FREE.limits.testsPerMonth

  if (testsThisMonth >= limit) {
    return {
      canTake: false,
      reason: `Free plan limit reached (${testsThisMonth}/${limit} tests this month)`,
      upgrade: true,
      testsThisMonth,
      limit
    }
  }

  return {
    canTake: true,
    plan: 'free',
    testsThisMonth,
    remaining: limit - testsThisMonth
  }
}

// Check if user can create a test
export const canCreateTest = async () => {
  const user = await getCurrentUser()
  if (!user) return { canCreate: false, reason: 'Please login first' }

  // Get user subscription
  const { data: subscription } = await supabase
    .from('subscriptions')
    .select('*')
    .eq('user_id', user.id)
    .single()

  if (!subscription) {
    return { canCreate: false, reason: 'No subscription found' }
  }

  // Premium users have unlimited access
  if (subscription.plan === 'monthly' || subscription.plan === 'yearly') {
    // Check if subscription is still active
    if (subscription.current_period_end) {
      const endDate = new Date(subscription.current_period_end)
      if (endDate < new Date()) {
        return { 
          canCreate: false, 
          reason: 'Your subscription has expired. Please renew.',
          needsRenewal: true
        }
      }
    }
    return { canCreate: true, plan: subscription.plan }
  }

  // Free users - check monthly limit
  const startOfMonth = new Date()
  startOfMonth.setDate(1)
  startOfMonth.setHours(0, 0, 0, 0)

  const { data: testsCreated, error } = await supabase
    .from('tests')
    .select('id')
    .eq('user_id', user.id)
    .gte('created_at', startOfMonth.toISOString())

  if (error) {
    console.error('Error checking creation limit:', error)
    return { canCreate: false, reason: 'Error checking limits' }
  }

  const createdThisMonth = testsCreated?.length || 0
  const limit = PLANS.FREE.limits.createdTestsPerMonth

  if (createdThisMonth >= limit) {
    return {
      canCreate: false,
      reason: `Free plan limit reached (${createdThisMonth}/${limit} test created this month)`,
      upgrade: true,
      createdThisMonth,
      limit
    }
  }

  return {
    canCreate: true,
    plan: 'free',
    createdThisMonth,
    remaining: limit - createdThisMonth
  }
}

// Check if user can use proctoring
export const canUseProctoring = async () => {
  const user = await getCurrentUser()
  if (!user) return false

  const { data: subscription } = await supabase
    .from('subscriptions')
    .select('plan')
    .eq('user_id', user.id)
    .single()

  return subscription?.plan === 'monthly' || subscription?.plan === 'yearly'
}

// Check if ads should be shown
export const shouldShowAds = async () => {
  const user = await getCurrentUser()
  if (!user) return true // Show ads to guests

  const { data: subscription } = await supabase
    .from('subscriptions')
    .select('plan')
    .eq('user_id', user.id)
    .single()

  // Show ads only for free users
  return !subscription || subscription.plan === 'free'
}

// Get user usage stats
export const getUserUsageStats = async () => {
  const user = await getCurrentUser()
  if (!user) return null

  const startOfMonth = new Date()
  startOfMonth.setDate(1)
  startOfMonth.setHours(0, 0, 0, 0)

  const { data: subscription } = await supabase
    .from('subscriptions')
    .select('*')
    .eq('user_id', user.id)
    .single()

  // Get tests taken this month
  const { data: testsTaken } = await supabase
    .from('test_results')
    .select('id')
    .eq('user_id', user.id)
    .gte('completed_at', startOfMonth.toISOString())

  // Get tests created this month
  const { data: testsCreated } = await supabase
    .from('tests')
    .select('id')
    .eq('user_id', user.id)
    .gte('created_at', startOfMonth.toISOString())

  const plan = PLANS[subscription?.plan?.toUpperCase()] || PLANS.FREE

  return {
    plan: subscription?.plan || 'free',
    planName: plan.name,
    testsTaken: testsTaken?.length || 0,
    testsCreated: testsCreated?.length || 0,
    limits: plan.limits,
    isPremium: subscription?.plan === 'monthly' || subscription?.plan === 'yearly',
    subscriptionEnd: subscription?.current_period_end
  }
          }
