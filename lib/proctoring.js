// Initialize camera and microphone
export const initializeProctoring = async () => {
  try {
    mediaStream = await navigator.mediaDevices.getUserMedia({
      video: {
        width: { ideal: 1280 },
        height: { ideal: 720 },
        facingMode: 'user'
      },
      audio: true
    })
    
    return { success: true, stream: mediaStream }
  } catch (error) {
    console.error('Proctoring initialization failed:', error)
    return { success: false, error: error.message }
  }
}

// Setup audio detection
export const setupAudioDetection = (stream, callback) => {
  try {
    audioContext = new (window.AudioContext || window.webkitAudioContext)()
    analyser = audioContext.createAnalyser()
    const source = audioContext.createMediaStreamSource(stream)
    source.connect(analyser)
    analyser.fftSize = 256
    
    const bufferLength = analyser.frequencyBinCount
    const dataArray = new Uint8Array(bufferLength)
    
    const detectAudio = () => {
      analyser.getByteFrequencyData(dataArray)
      const average = dataArray.reduce((a, b) => a + b) / bufferLength
      
      // If average volume is above threshold, trigger callback
      if (average > 30) {
        callback({
          type: 'audio_detected',
          level: average,
          timestamp: new Date().toISOString()
        })
      }
      
      requestAnimationFrame(detectAudio)
    }
    
    detectAudio()
    return true
  } catch (error) {
    console.error('Audio detection setup failed:', error)
    return false
  }
}

// Detect tab switching
export const setupTabSwitchDetection = (callback) => {
  const handleVisibilityChange = () => {
    if (document.hidden) {
      callback({
        type: 'tab_switched',
        timestamp: new Date().toISOString(),
        message: 'Student switched tabs or minimized window'
      })
    }
  }
  
  const handleBlur = () => {
    callback({
      type: 'window_blur',
      timestamp: new Date().toISOString(),
      message: 'Student clicked outside the test window'
    })
  }
  
  document.addEventListener('visibilitychange', handleVisibilityChange)
  window.addEventListener('blur', handleBlur)
  
  // Return cleanup function
  return () => {
    document.removeEventListener('visibilitychange', handleVisibilityChange)
    window.removeEventListener('blur', handleBlur)
  }
}

// Detect right-click and keyboard shortcuts
export const setupCheatingPrevention = (callback) => {
  const preventRightClick = (e) => {
    e.preventDefault()
    callback({
      type: 'right_click_attempt',
      timestamp: new Date().toISOString()
    })
  }
  
  const preventKeyboardShortcuts = (e) => {
    // Prevent common cheating shortcuts
    const forbidden = [
      (e.ctrlKey && e.key === 'c'), // Copy
      (e.ctrlKey && e.key === 'v'), // Paste
      (e.ctrlKey && e.key === 'x'), // Cut
      (e.ctrlKey && e.key === 'a'), // Select all
      (e.ctrlKey && e.shiftKey && e.key === 'i'), // Inspect
      (e.key === 'F12'), // DevTools
      (e.ctrlKey && e.key === 'u'), // View source
      (e.ctrlKey && e.key === 's'), // Save page
      (e.ctrlKey && e.key === 'p'), // Print
    ]
    
    if (forbidden.some(condition => condition)) {
      e.preventDefault()
      callback({
        type: 'keyboard_shortcut_attempt',
        key: e.key,
        timestamp: new Date().toISOString()
      })
    }
  }
  
  document.addEventListener('contextmenu', preventRightClick)
  document.addEventListener('keydown', preventKeyboardShortcuts)
  
  return () => {
    document.removeEventListener('contextmenu', preventRightClick)
    document.removeEventListener('keydown', preventKeyboardShortcuts)
  }
}

// Request fullscreen
export const requestFullscreen = async () => {
  try {
    const elem = document.documentElement
    if (elem.requestFullscreen) {
      await elem.requestFullscreen()
    } else if (elem.webkitRequestFullscreen) {
      await elem.webkitRequestFullscreen()
    } else if (elem.msRequestFullscreen) {
      await elem.msRequestFullscreen()
    }
    return true
  } catch (error) {
    console.error('Fullscreen request failed:', error)
    return false
  }
}

// Detect fullscreen exit
export const setupFullscreenDetection = (callback) => {
  const handleFullscreenChange = () => {
    if (!document.fullscreenElement) {
      callback({
        type: 'fullscreen_exit',
        timestamp: new Date().toISOString(),
        message: 'Student exited fullscreen mode'
      })
    }
  }
  
  document.addEventListener('fullscreenchange', handleFullscreenChange)
  document.addEventListener('webkitfullscreenchange', handleFullscreenChange)
  document.addEventListener('mozfullscreenchange', handleFullscreenChange)
  
  return () => {
    document.removeEventListener('fullscreenchange', handleFullscreenChange)
    document.removeEventListener('webkitfullscreenchange', handleFullscreenChange)
    document.removeEventListener('mozfullscreenchange', handleFullscreenChange)
  }
}

// Capture screenshot from video stream
export const captureScreenshot = (videoElement) => {
  try {
    const canvas = document.createElement('canvas')
    canvas.width = videoElement.videoWidth
    canvas.height = videoElement.videoHeight
    const ctx = canvas.getContext('2d')
    ctx.drawImage(videoElement, 0, 0)
    return canvas.toDataURL('image/jpeg', 0.8)
  } catch (error) {
    console.error('Screenshot capture failed:', error)
    return null
  }
}

// Save suspicious activity
export const logSuspiciousActivity = (activity) => {
  suspiciousActivities.push({
    ...activity,
    id: Date.now(),
    timestamp: activity.timestamp || new Date().toISOString()
  })
  
  // Keep only last 100 activities
  if (suspiciousActivities.length > 100) {
    suspiciousActivities.shift()
  }
  
  return suspiciousActivities
}

// Get all logged activities
export const getSuspiciousActivities = () => {
  return [...suspiciousActivities]
}

// Clear activities log
export const clearActivitiesLog = () => {
  suspiciousActivities = []
}

// Stop proctoring
export const stopProctoring = () => {
  if (mediaStream) {
    mediaStream.getTracks().forEach(track => track.stop())
    mediaStream = null
  }
  
  if (audioContext) {
    audioContext.close()
    audioContext = null
  }
  
  analyser = null
  videoElement = null
  clearActivitiesLog()
}

// Face detection using basic motion detection
export const detectMotion = (videoElement, callback) => {
  const canvas = document.createElement('canvas')
  const ctx = canvas.getContext('2d')
  let lastImageData = null
  
  const checkMotion = () => {
    if (!videoElement.videoWidth) return
    
    canvas.width = videoElement.videoWidth
    canvas.height = videoElement.videoHeight
    ctx.drawImage(videoElement, 0, 0)
    
    const currentImageData = ctx.getImageData(0, 0, canvas.width, canvas.height)
    
    if (lastImageData) {
      let diff = 0
      for (let i = 0; i < currentImageData.data.length; i += 4) {
        diff += Math.abs(currentImageData.data[i] - lastImageData.data[i])
      }
      
      const motionLevel = diff / (canvas.width * canvas.height)
      
      // High motion = student moved significantly
      if (motionLevel > 50) {
        callback({
          type: 'significant_motion',
          level: motionLevel,
          timestamp: new Date().toISOString(),
          message: 'Significant movement detected'
        })
      }
      
      // Very low motion = student may have left
      if (motionLevel < 5) {
        callback({
          type: 'no_motion',
          level: motionLevel,
          timestamp: new Date().toISOString(),
          message: 'Student may have left the frame'
        })
      }
    }
    
    lastImageData = currentImageData
    setTimeout(checkMotion, 2000) // Check every 2 seconds
  }
  
  checkMotion()
}

// Check if browser supports required features
export const checkBrowserSupport = () => {
  const support = {
    camera: !!(navigator.mediaDevices && navigator.mediaDevices.getUserMedia),
    fullscreen: !!(document.documentElement.requestFullscreen || 
                    document.documentElement.webkitRequestFullscreen),
    audioContext: !!(window.AudioContext || window.webkitAudioContext)
  }
  
  return {
    supported: support.camera && support.fullscreen && support.audioContext,
    details: support
  }
                             }
