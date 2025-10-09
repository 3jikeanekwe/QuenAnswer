import { createClient } from '@supabase/supabase-js'

const supabaseUrl = 'https://hyzdqmgcwkxiocpbphxu.supabase.co'
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imh5emRxbWdjd2t4aW9jcGJwaHh1Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTk5NjYzNTUsImV4cCI6MjA3NTU0MjM1NX0.h45YurFutUIUV6hEXUKqv3JTT9wldNzqKQPWhk5SSH0'

export const supabase = createClient(supabaseUrl, supabaseAnonKey)

// Auth helpers
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

// Database helpers
export const createTest = async (testData) => {
  const user = await getCurrentUser()
  const { data, error } = await supabase
    .from('tests')
    .insert([{
      ...testData,
      user_id: user.id,
      created_at: new Date().toISOString()
    }])
    .select()
  return { data, error }
}

export const getTests = async () => {
  const { data, error } = await supabase
    .from('tests')
    .select('*')
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
    .or(`title.ilike.%${query}%,description.ilike.%${query}%`)
    .order('created_at', { ascending: false })
  return { data, error }
}

// Subscription helpers
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
