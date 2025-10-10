import { createClient } from '@supabase/supabase-js'

const supabaseUrl = 'https://hyzdqmgcwkxiocpbphxu.supabase.co'
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imh5emRxbWdjd2t4aW9jcGJwaHh1Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTk5NjYzNTUsImV4cCI6MjA3NTU0MjM1NX0.h45YurFutUIUV6hEXUKqv3JTT9wldNzqKQPWhk5SSH0'

export const supabase = createClient(supabaseUrl, supabaseAnonKey)

// ============================================
// AUTH HELPERS
// ============================================

export const signUp = async (email, password, userData) => {
  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      data: userData
    }
  })
  return { data, error }
}

export const signIn = async (email, password) => {
  const { data, error } = await supabase.auth.signInWithPassword({
    email,
    password
  })
  return { data, error }
}

export const signOut = async () => {
  const { error } = await supabase.auth.signOut()
  return { error }
}

export const getCurrentUser = async () => {
  const { data: { user } } = await supabase.auth.getUser()
  return user
}

// ============================================
// TEST MANAGEMENT
// ============================================

export const createTest = async (testData) => {
  const user = await getCurrentUser()
  const { data, error } = await supabase
    .from('tests')
    .insert([{
      ...testData,
      user_id: user.id,
      created_at: new Date().toISOString(),
      // Proctoring fields
      proctoring_enabled: testData.proctoring_enabled || false,
      // Scheduling fields
      scheduled_start: testData.scheduled_start || null,
      scheduled_end: testData.scheduled_end || null,
      // Privacy fields
      is_private: testData.is_private || false,
      invited_emails: testData.invited_emails || [],
      // Payment fields
      is_paid: testData.is_paid || false,
      price_usdc: testData.price_usdc || 0,
      creator_wallet: testData.creator_wallet || null,
      platform_fee_percentage: 10 // Platform takes 10%
    }])
    .select()
  return { data, error }
}

export const getTests = async () => {
  const { data, error } = await supabase
    .from('tests')
    .select('*')
    .eq('is_public', true)
    .order('created_at', { ascending: false })
  return { data, error }
}

export const getTestById = async (id) => {
  const { data, error } = await supabase
    .from('tests')
    .select('*')
    .eq('id', id)
    .single()
  return { data, error }
}

export const getUserTests = async () => {
  const user = await getCurrentUser()
  const { data, error } = await supabase
    .from('tests')
    .select('*')
    .eq('user_id', user.id)
    .order('created_at', { ascending: false })
  return { data, error }
}

export const updateTest = async (id, updates) => {
  const { data, error } = await supabase
    .from('tests')
    .update(updates)
    .eq('id', id)
    .select()
  return { data, error }
}

export const deleteTest = async (id) => {
  const { error } = await supabase
    .from('tests')
    .delete()
    .eq('id', id)
  return { error }
}

export const searchTests = async (query) => {
  const { data, error } = await supabase
    .from('tests')
    .select('*')
    .eq('is_public', true)
    .or(`title.ilike.%${query}%,description.ilike.%${query}%`)
    .order('created_at', { ascending: false })
  return { data, error }
}

// ============================================
// TEST ACCESS CONTROL
// ============================================

export const canAccessTest = async (testId, userEmail) => {
  const { data: test, error } = await getTestById(testId)
  
  if (error || !test) return { canAccess: false, reason: 'Test not found' }
  
  // Check if test is private
  if (test.is_private) {
    if (!test.invited_emails || !test.invited_emails.includes(userEmail)) {
      return { canAccess: false, reason: 'You are not invited to this test' }
    }
  }
  
  // Check if test is scheduled
  if (test.scheduled_start) {
    const now = new Date()
    const startTime = new Date(test.scheduled_start)
    const endTime = test.scheduled_end ? new Date(test.scheduled_end) : null
    
    if (now < startTime) {
      return { 
        canAccess: false, 
        reason: `Test starts on ${startTime.toLocaleString()}`,
        scheduledStart: startTime
      }
    }
    
    if (endTime && now > endTime) {
      return { 
        canAccess: false, 
        reason: 'Test has ended',
        scheduledEnd: endTime
      }
    }
  }
  
  // Check if test requires payment
  if (test.is_paid) {
    const { data: payment } = await supabase
      .from('test_payments')
      .select('*')
      .eq('test_id', testId)
      .eq('user_email', userEmail)
      .eq('status', 'completed')
      .single()
    
    if (!payment) {
      return { 
        canAccess: false, 
        reason: `This test costs $${test.price_usdc} USDC`,
        requiresPayment: true,
        price: test.price_usdc,
        creatorWallet: test.creator_wallet
      }
    }
  }
  
  return { canAccess: true, test }
}

// ============================================
// TEST RESULTS
// ============================================

export const saveTestResult = async (resultData) => {
  const user = await getCurrentUser()
  const { data, error } = await supabase
    .from('test_results')
    .insert([{
      ...resultData,
      user_id: user.id,
      completed_at: new Date().toISOString()
    }])
    .select()
  return { data, error }
}

export const getUserResults = async () => {
  const user = await getCurrentUser()
  const { data, error } = await supabase
    .from('test_results')
    .select('*, tests(*)')
    .eq('user_id', user.id)
    .order('completed_at', { ascending: false })
  return { data, error }
}

// ============================================
// PAYMENT MANAGEMENT
// ============================================

export const recordTestPayment = async (paymentData) => {
  const user = await getCurrentUser()
  
  // Calculate platform fee and creator amount
  const platformFee = (paymentData.amount_usdc * paymentData.platform_fee_percentage) / 100
  const creatorAmount = paymentData.amount_usdc - platformFee
  
  const { data, error } = await supabase
    .from('test_payments')
    .insert([{
      test_id: paymentData.test_id,
      user_id: user?.id,
      user_email: paymentData.user_email,
      amount_usdc: paymentData.amount_usdc,
      platform_fee: platformFee,
      creator_amount: creatorAmount,
      transaction_hash: paymentData.transaction_hash,
      status: 'completed',
      paid_at: new Date().toISOString()
    }])
    .select()
  return { data, error }
}

export const getUserPayments = async () => {
  const user = await getCurrentUser()
  const { data, error } = await supabase
    .from('test_payments')
    .select('*, tests(title)')
    .eq('user_id', user.id)
    .order('paid_at', { ascending: false })
  return { data, error }
}

export const getTestRevenue = async (testId) => {
  const { data, error } = await supabase
    .from('test_payments')
    .select('amount_usdc, creator_amount, platform_fee')
    .eq('test_id', testId)
    .eq('status', 'completed')
  
  if (error) return { data: null, error }
  
  const totalRevenue = data.reduce((sum, payment) => sum + parseFloat(payment.amount_usdc), 0)
  const creatorEarnings = data.reduce((sum, payment) => sum + parseFloat(payment.creator_amount), 0)
  const platformEarnings = data.reduce((sum, payment) => sum + parseFloat(payment.platform_fee), 0)
  
  return {
    data: {
      totalRevenue,
      creatorEarnings,
      platformEarnings,
      paymentCount: data.length
    },
    error: null
  }
}

// ============================================
// PROCTORING & MONITORING
// ============================================

export const saveProctorIncident = async (incidentData) => {
  const user = await getCurrentUser()
  const { data, error } = await supabase
    .from('proctor_incidents')
    .insert([{
      test_id: incidentData.test_id,
      user_id: user.id,
      incident_type: incidentData.type,
      incident_data: incidentData.data,
      screenshot_url: incidentData.screenshot_url,
      timestamp: incidentData.timestamp || new Date().toISOString()
    }])
    .select()
  return { data, error }
}

export const getProctorIncidents = async (testId, userId) => {
  const { data, error } = await supabase
    .from('proctor_incidents')
    .select('*')
    .eq('test_id', testId)
    .eq('user_id', userId)
    .order('timestamp', { ascending: false })
  return { data, error }
}

export const getAllTestIncidents = async (testId) => {
  const { data, error } = await supabase
    .from('proctor_incidents')
    .select('*, profiles(full_name, email)')
    .eq('test_id', testId)
    .order('timestamp', { ascending: false })
  return { data, error }
}

// ============================================
// SUBSCRIPTION MANAGEMENT
// ============================================

export const getUserSubscription = async () => {
  const user = await getCurrentUser()
  const { data, error } = await supabase
    .from('subscriptions')
    .select('*')
    .eq('user_id', user.id)
    .single()
  return { data, error }
}

export const updateSubscription = async (subscriptionData) => {
  const user = await getCurrentUser()
  const { data, error } = await supabase
    .from('subscriptions')
    .upsert([{
      user_id: user.id,
      ...subscriptionData,
      updated_at: new Date().toISOString()
    }])
    .select()
  return { data, error }
}

// ============================================
// STORAGE (for screenshots, recordings)
// ============================================

export const uploadProctorScreenshot = async (testId, userId, imageDataUrl) => {
  try {
    // Convert base64 to blob
    const response = await fetch(imageDataUrl)
    const blob = await response.blob()
    
    const fileName = `${testId}/${userId}/${Date.now()}.jpg`
    
    const { data, error } = await supabase.storage
      .from('proctor-screenshots')
      .upload(fileName, blob, {
        contentType: 'image/jpeg',
        cacheControl: '3600'
      })
    
    if (error) throw error
    
    // Get public URL
    const { data: urlData } = supabase.storage
      .from('proctor-screenshots')
      .getPublicUrl(fileName)
    
    return { url: urlData.publicUrl, error: null }
  } catch (error) {
    return { url: null, error: error.message }
  }
  }
