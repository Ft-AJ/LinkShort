// Configuration
const API_BASE = window.API_BASE;

// DOM Elements
const themeToggle = document.getElementById('themeToggle');
const urlForm = document.getElementById('urlForm');
const originalURLInput = document.getElementById('originalURL');
const customAliasInput = document.getElementById('customAlias');
const lengthSelect = document.getElementById('length');
const shortenBtn = document.getElementById('shortenBtn');
const spinner = document.getElementById('spinner');
const toggleAdvanced = document.getElementById('toggleAdvanced');
const advancedContent = document.getElementById('advancedContent');
const resultContainer = document.getElementById('resultContainer');
const errorContainer = document.getElementById('errorContainer');
const infoContainer = document.getElementById('infoContainer');
const shortUrlResult = document.getElementById('shortUrlResult');
const copyBtn = document.getElementById('copyBtn');
const timerText = document.getElementById('timerText');
const progressFill = document.getElementById('progressFill');
const errorMessage = document.getElementById('errorMessage');
const infoTitle = document.getElementById('infoTitle');
const infoMessage = document.getElementById('infoMessage');
const createAnotherBtn = document.getElementById('createAnotherBtn');
const notification = document.getElementById('notification');

// Theme Management
let currentTheme = localStorage.getItem('theme') || 'light';

function setTheme(theme) {
  currentTheme = theme;
  document.documentElement.setAttribute('data-theme', theme);
  localStorage.setItem('theme', theme);
  
  // Update theme toggle icon
  const icon = themeToggle.querySelector('i');
  if (theme === 'dark') {
    icon.className = 'fas fa-sun';
  } else {
    icon.className = 'fas fa-moon';
  }
}

function toggleTheme() {
  const newTheme = currentTheme === 'light' ? 'dark' : 'light';
  setTheme(newTheme);
}

// Initialize theme
setTheme(currentTheme);
themeToggle.addEventListener('click', toggleTheme);

// Advanced Options Toggle
let advancedOpen = false;

function toggleAdvancedOptions() {
  advancedOpen = !advancedOpen;
  advancedContent.classList.toggle('expanded', advancedOpen);
  
  const chevronIcon = toggleAdvanced.querySelector('.fa-chevron-down, .fa-chevron-up');
  if (advancedOpen) {
    chevronIcon.className = 'fas fa-chevron-up';
  } else {
    chevronIcon.className = 'fas fa-chevron-down';
  }
}

toggleAdvanced.addEventListener('click', toggleAdvancedOptions);

// Timer functionality
let timerInterval = null;
let totalDuration = 60; // 60 seconds

function startTimer(expiresAt) {
  clearInterval(timerInterval);
  
  const expiryTime = new Date(expiresAt).getTime();
  const startTime = Date.now();
  totalDuration = Math.max(0, Math.floor((expiryTime - startTime) / 1000));
  
  timerInterval = setInterval(() => {
    const now = Date.now();
    const timeLeft = Math.max(0, Math.floor((expiryTime - now) / 1000));
    
    if (timeLeft <= 0) {
      timerText.textContent = 'Expired';
      progressFill.style.width = '0%';
      clearInterval(timerInterval);
      setTimeout(() => {
        hideResult();
        showError('Your shortened URL has expired');
      }, 1000);
      return;
    }
    
    timerText.textContent = `${timeLeft}s`;
    
    // Update progress bar
    const progress = totalDuration > 0 ? (timeLeft / totalDuration) * 100 : 0;
    progressFill.style.width = `${progress}%`;
    
    // Change timer color when time is running out
    const timer = document.getElementById('timer');
    if (timeLeft <= 10) {
      timer.style.background = 'var(--error-color)';
    } else if (timeLeft <= 30) {
      timer.style.background = 'var(--warning-color)';
    }
  }, 1000);
}

// UI State Management
function showLoading() {
  shortenBtn.classList.add('loading');
  shortenBtn.disabled = true;
}

function hideLoading() {
  shortenBtn.classList.remove('loading');
  shortenBtn.disabled = false;
}

function showResult(data) {
  hideError();
  hideInfo();
  
  shortUrlResult.href = data.newURL;
  shortUrlResult.textContent = data.newURL;
  
  resultContainer.classList.add('show');
  
  if (data.expiresAt) {
    startTimer(data.expiresAt);
  }
  
  // Reset timer color
  const timer = document.getElementById('timer');
  timer.style.background = 'var(--warning-color)';
  
  // Scroll to result
  setTimeout(() => {
    resultContainer.scrollIntoView({ behavior: 'smooth', block: 'center' });
  }, 100);
}

function hideResult() {
  resultContainer.classList.remove('show');
  clearInterval(timerInterval);
  progressFill.style.width = '100%';
}

function showInfo(title, message) {
  hideError();
  hideResult();
  infoTitle.textContent = title;
  infoMessage.textContent = message;
  infoContainer.classList.add('show');
  
  // Scroll to info
  setTimeout(() => {
    infoContainer.scrollIntoView({ behavior: 'smooth', block: 'center' });
  }, 100);
  
  // Auto-hide info after 8 seconds
  setTimeout(() => {
    hideInfo();
  }, 8000);
}

function hideInfo() {
  infoContainer.classList.remove('show');
}

function showError(message) {
  hideResult();
  hideInfo();
  errorMessage.textContent = message;
  errorContainer.classList.add('show');
  
  // Scroll to error
  setTimeout(() => {
    errorContainer.scrollIntoView({ behavior: 'smooth', block: 'center' });
  }, 100);
  
  // Auto-hide error after 5 seconds
  setTimeout(() => {
    hideError();
  }, 5000);
}

function hideError() {
  errorContainer.classList.remove('show');
}

function showNotification(message) {
  const notificationText = notification.querySelector('span');
  notificationText.textContent = message;
  notification.classList.add('show');
  
  setTimeout(() => {
    notification.classList.remove('show');
  }, 3000);
}

// API Functions
async function createShortURL(data) {
  const response = await fetch(`${API_BASE}/`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(data),
  });
  
  let result;
  try {
    result = await response.json();
  } catch {
    result = {};
  }
  
  if (!response.ok) {
    let customMessage;

    switch (response.status) {
      case 400:
        customMessage = 'Bad request. Please check your input and try again.';
        break;
      case 401:
        customMessage = 'You are not authorized to perform this action.';
        break;
      case 403:
        customMessage = 'Access denied. You do not have permission.';
        break;
      case 404:
        customMessage = 'The requested resource was not found.';
        break;
      case 429:
        customMessage = 'Too many requests. Please slow down and try again later.';
        break;
      case 500:
        customMessage = 'Internal server error. Please try again later.';
        break;
      default:
        customMessage = result.message || `HTTP error! status: ${response.status}`;
    }
  }
  
  return result;
}

// Form Submission
async function handleFormSubmit(e) {
  e.preventDefault();
  
  hideError();
  hideResult();
  hideInfo();
  showLoading();
  
  try {
    const formData = {
      originalURL: originalURLInput.value.trim(),
    };
    
    // Add custom alias if provided
    const customAlias = customAliasInput.value.trim();
    if (customAlias) {
      formData.custom_alias = customAlias;
    } else {
      // Add length if no custom alias
      formData.length = parseInt(lengthSelect.value);
    }
    
    const result = await createShortURL(formData);
    
    // Check if it's an existing URL
    if (result.message && result.message.includes('already exists')) {
      showInfo(
        'URL Already Shortened',
        `This URL was already shortened recently. Using the existing short link.`
      );
      // Still show the result after a brief delay
      setTimeout(() => {
        showResult(result);
      }, 2000);
    } else {
      showResult(result);
    }
    
  } catch (error) {
    console.error('Error creating short URL:', error);
    
    // Handle different types of errors
    if (error.message.includes('Alias already exists') || error.message.includes('already exists')) {
      const customAlias = customAliasInput.value.trim();
      if (customAlias) {
        showError(`The alias "${customAlias}" is already taken. Please try a different one.`);
      } else {
        showError('Generated alias already exists. Please try again.');
      }
    } else if (error.message.includes('fetch') || error.message.includes('NetworkError')) {
      showError('Unable to connect to server. Please check if the backend is running on port 5000.');
    } else if (error.message.includes('Invalid URL')) {
      showError('Please enter a valid URL starting with http:// or https://');
    } else {
      showError(error.message || 'An error occurred while creating your short URL');
    }
  } finally {
    hideLoading();
  }
}

// Copy to Clipboard
async function copyToClipboard() {
  try {
    const url = shortUrlResult.textContent;
    await navigator.clipboard.writeText(url);
    
    // Visual feedback
    const originalIcon = copyBtn.innerHTML;
    copyBtn.innerHTML = '<i class="fas fa-check"></i>';
    copyBtn.style.background = 'var(--success-color)';
    
    showNotification('Copied to clipboard!');
    
    setTimeout(() => {
      copyBtn.innerHTML = originalIcon;
      copyBtn.style.background = '';
    }, 1000);
    
  } catch (error) {
    console.error('Failed to copy:', error);
    
    // Fallback for older browsers
    const textArea = document.createElement('textarea');
    textArea.value = shortUrlResult.textContent;
    textArea.style.position = 'fixed';
    textArea.style.left = '-999999px';
    textArea.style.top = '-999999px';
    document.body.appendChild(textArea);
    textArea.focus();
    textArea.select();
    
    try {
      document.execCommand('copy');
      showNotification('Copied to clipboard!');
    } catch (err) {
      showNotification('Failed to copy. Please copy manually.');
    }
    
    document.body.removeChild(textArea);
    
    // Visual feedback
    const originalIcon = copyBtn.innerHTML;
    copyBtn.innerHTML = '<i class="fas fa-check"></i>';
    copyBtn.style.background = 'var(--success-color)';
    
    setTimeout(() => {
      copyBtn.innerHTML = originalIcon;
      copyBtn.style.background = '';
    }, 1000);
  }
}

// Create Another Button
function handleCreateAnother() {
  // Clear form
  originalURLInput.value = '';
  customAliasInput.value = '';
  lengthSelect.value = '6';
  
  // Reset form validation styles
  originalURLInput.style.borderColor = '';
  originalURLInput.style.boxShadow = '';
  customAliasInput.style.borderColor = '';
  customAliasInput.style.boxShadow = '';
  
  // Enable controls
  lengthSelect.disabled = false;
  lengthSelect.style.opacity = '';
  customAliasInput.disabled = false;
  customAliasInput.style.opacity = '';
  
  // Hide result
  hideResult();
  hideError();
  hideInfo();
  
  // Focus URL input
  originalURLInput.focus();
  
  // Scroll to form
  setTimeout(() => {
    urlForm.scrollIntoView({ behavior: 'smooth', block: 'center' });
  }, 100);
}

// Input Validation
function validateCustomAlias(value) {
  const aliasRegex = /^[A-Za-z0-9_-]{1,32}$/;
  return aliasRegex.test(value);
}

function isValidURL(string) {
  try {
    const url = new URL(string);
    return url.protocol === 'http:' || url.protocol === 'https:';
  } catch (_) {
    return false;
  }
}

// Real-time validation for custom alias
customAliasInput.addEventListener('input', function() {
  const value = this.value.trim();
  
  if (value && !validateCustomAlias(value)) {
    this.style.borderColor = 'var(--error-color)';
    this.style.boxShadow = '0 0 0 3px rgba(239, 68, 68, 0.1)';
  } else {
    this.style.borderColor = '';
    this.style.boxShadow = '';
  }
  
  // Disable/enable length selection
  const hasCustomAlias = value.length > 0;
  lengthSelect.disabled = hasCustomAlias;
  lengthSelect.style.opacity = hasCustomAlias ? '0.5' : '';
});

// URL validation
originalURLInput.addEventListener('blur', function() {
  const url = this.value.trim();
  
  if (url && !isValidURL(url)) {
    this.style.borderColor = 'var(--error-color)';
    this.style.boxShadow = '0 0 0 3px rgba(239, 68, 68, 0.1)';
  } else {
    this.style.borderColor = '';
    this.style.boxShadow = '';
  }
});

// Clear validation on focus
originalURLInput.addEventListener('focus', function() {
  this.style.borderColor = '';
  this.style.boxShadow = '';
});

customAliasInput.addEventListener('focus', function() {
  this.style.borderColor = '';
  this.style.boxShadow = '';
});

// Event Listeners
urlForm.addEventListener('submit', handleFormSubmit);
copyBtn.addEventListener('click', copyToClipboard);
createAnotherBtn.addEventListener('click', handleCreateAnother);

// Keyboard shortcuts
document.addEventListener('keydown', function(e) {
  // Ctrl/Cmd + K to focus URL input
  if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
    e.preventDefault();
    originalURLInput.focus();
  }
  
  // Escape to clear form and hide results
  if (e.key === 'Escape') {
    handleCreateAnother();
  }
});

// Auto-focus URL input on page load
window.addEventListener('load', function() {
  originalURLInput.focus();
});

// Handle page visibility change (pause timer when tab is hidden)
document.addEventListener('visibilitychange', function() {
  if (document.hidden && timerInterval) {
    clearInterval(timerInterval);
  } else if (!document.hidden && timerText && !timerText.textContent.includes('Expired')) {
    // Restart timer if page becomes visible and timer was running
    const currentSeconds = parseInt(timerText.textContent.match(/\d+/)?.[0] || '0');
    if (currentSeconds > 0) {
      const futureTime = new Date(Date.now() + (currentSeconds * 1000));
      startTimer(futureTime);
    }
  }
});

// Handle online/offline status
window.addEventListener('online', function() {
  showNotification('Connection restored!');
});

window.addEventListener('offline', function() {
  showNotification('You are offline. Please check your connection.');
});

// Add smooth scrolling for better UX
document.documentElement.style.scrollBehavior = 'smooth';

// Initialize app
console.log('URL Shortener frontend loaded successfully!');
console.log(`API Base URL: ${API_BASE}`);
console.log('Make sure your backend is running on the correct port.');

// Service Worker Registration (optional, for PWA features)
if ('serviceWorker' in navigator) {
  window.addEventListener('load', function() {
    // Uncomment if you want to add service worker
    // navigator.serviceWorker.register('/sw.js');
  });
}