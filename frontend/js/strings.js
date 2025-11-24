// strings.js - Centralized user-facing messages

const STRINGS = {
    // Login page
    LOGIN: {
        TITLE: 'Login',
        EMAIL_LABEL: 'Email',
        EMAIL_PLACEHOLDER: 'Enter your email',
        PASSWORD_LABEL: 'Password',
        PASSWORD_PLACEHOLDER: 'Enter your password',
        SUBMIT_BUTTON: 'Login',
        SIGNUP_TEXT: "Don't have an account?",
        SIGNUP_LINK: 'Create Account',
        
        // Loading messages
        LOADING_MESSAGE: 'Logging in...',
        
        // Error messages
        ERROR_INVALID_CREDENTIALS: 'Invalid credentials',
        ERROR_LOGIN_FAILED: 'Login failed: ',
        ERROR_PREFIX: 'Error: ',
        ERROR_EMPTY_FIELDS: 'Please fill in all fields',
        ERROR_INVALID_EMAIL: 'Please enter a valid email address',
        ERROR_SERVER: 'Server error. Please try again later',
        ERROR_NETWORK: 'Network error. Please check your connection',
        
        // Success messages
        SUCCESS_LOGIN: 'Login successful! Redirecting...'
    },
    
    // Main Dashboard
    MAIN: {
        // Navigation
        NAV_TITLE: 'AI Phone Call Service',
        NAV_LOGOUT: 'Logout',
        USER_EMAIL_LOADING: 'Loading...',
        
        // Form Section
        FORM_TITLE: 'Create Phone Call Script',
        LABEL_YOUR_NAME: 'Your Name',
        LABEL_RESTAURANT_NAME: 'Restaurant Name',
        LABEL_PHONE_NUMBER: 'Phone Number',
        LABEL_CALL_SCRIPT: 'Call Script',
        
        PLACEHOLDER_NAME: 'John Doe',
        PLACEHOLDER_RESTAURANT: 'Nav Sweets',
        PLACEHOLDER_PHONE: '+1 (555) 123-4567',
        PLACEHOLDER_SCRIPT: "Hi, my name is [Your Name] and I'd like to make a reservation for 4 people at 7pm this Friday...",
        
        HELP_PHONE: 'Include country code (e.g., +1 for USA/Canada)',
        HELP_SCRIPT: 'Write what you want the AI to say on the phone call',
        
        BUTTON_SUBMIT: 'Make AI Phone Call',
        BUTTON_PROCESSING: 'Processing...',
        
        // Progress Bar
        PROGRESS_TITLE: 'Free Tier Progress',
        PROGRESS_TEXT: '0 / 20 calls',
        
        // Result Messages
        RESULT_SUCCESS_TITLE: 'Call Initiated Successfully!',
        RESULT_ERROR_TITLE: 'Call Failed',
        
        // Tips Section
        TIPS_TITLE: 'Script Writing Tips',
        TIP_1: 'Keep it natural and conversational',
        TIP_2: 'Include all necessary details',
        TIP_3: 'Be polite and professional',
        TIP_4: 'Mention your name clearly',
        TIP_5: 'Specify date, time, and party size',
        
        // Templates Section
        TEMPLATES_TITLE: 'Quick Templates',
        TEMPLATE_RESERVATION: 'Restaurant Reservation',
        TEMPLATE_APPOINTMENT: 'Appointment Booking',
        TEMPLATE_INQUIRY: 'General Inquiry',
        BUTTON_CLEAR_FORM: 'Clear Form',
        
        // Recent Calls Section
        RECENT_CALLS_TITLE: 'Recent Calls',
        TABLE_HEADER_TIME: 'Time',
        TABLE_HEADER_RESTAURANT: 'Restaurant',
        TABLE_HEADER_PHONE: 'Phone Number',
        TABLE_HEADER_STATUS: 'Status',
        TABLE_NO_CALLS: 'No recent calls',
        
        // Error messages
        ERROR_ALL_FIELDS: 'Please fill in all fields',
        ERROR_NETWORK: 'Network error. Please try again.',
        ERROR_UNKNOWN: 'Unknown error'
    },
    
    // API Call page
    API_CALL: {
        TITLE: 'Make AI Call',
        CALLER_NAME_LABEL: 'Caller Name',
        RESTAURANT_NAME_LABEL: 'Restaurant Name',
        PHONE_NUMBER_LABEL: 'Phone Number',
        SCRIPT_LABEL: 'Order Details',
        SUBMIT_BUTTON: 'Make Call',
        
        // Error messages
        ERROR_ALL_FIELDS_REQUIRED: 'All fields required',
        ERROR_USER_NOT_FOUND: 'User not found',
        ERROR_LLM_NOT_CONFIGURED: 'LLM server not configured',
        ERROR_GENERATE_SCRIPT: 'Failed to generate AI call script',
        ERROR_INTERNAL_SERVER: 'Internal server error',
        
        // Success messages
        SUCCESS_CALL_COMPLETED: 'AI call script generated and saved to your history.',
        
        // Status messages
        STATUS_COMPLETED: 'Completed'
    },
    
    // AI Prompt
    AI_PROMPT: {
        SYSTEM_MESSAGE: 'You are calling a restaurant on behalf of a client to place an order. ' +
            'Speak casually. Your job is to introduce yourself as an AI bot from the Company UpScaling, ' +
            'explain that you are calling on behalf of the client, state the client\'s name and order clearly, ' +
            'but do not request confirmation. Do NOT output JSON in your answer. Do NOT mention JSON. ' +
            'Just speak as if you are making the call. ' +
            'Here is the order data you should use (this is for you, the AI, and should NOT be repeated as JSON in your answer): ',
    },
    
    // General messages
    GENERAL: {
        LOADING: 'Loading...',
        PLEASE_WAIT: 'Please wait...',
        SUCCESS: 'Success',
        ERROR: 'Error'
    }
};

// Export for Node.js (backend)
if (typeof module !== 'undefined' && module.exports) {
    module.exports = STRINGS;
}

// Export for browser (frontend)
if (typeof window !== 'undefined') {
    window.STRINGS = STRINGS;
}