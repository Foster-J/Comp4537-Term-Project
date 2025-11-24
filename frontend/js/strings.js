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
    
    // Signup/Registration page
    SIGNUP: {
        TITLE: 'Create Account',
        SUBTITLE: 'Fill in your details to get started',
        
        // Form labels
        LABEL_EMAIL: 'Email Address',
        LABEL_PASSWORD: 'Password',
        LABEL_CONFIRM_PASSWORD: 'Confirm Password',
        
        // Placeholders
        PLACEHOLDER_EMAIL: 'your.email@example.com',
        
        // Button text
        BUTTON_SUBMIT: 'Create Account',
        BUTTON_LOADING: 'Creating Account...',
        
        // Password matching
        PASSWORD_MATCH: '✓ Passwords match',
        PASSWORD_NO_MATCH: '✗ Passwords do not match',
        
        // Links
        LOGIN_TEXT: 'Already have an account?',
        LOGIN_LINK: 'Sign in here',
        
        // Success messages
        SUCCESS_REGISTRATION: '✓ Registration successful! Redirecting to login...',
        
        // Error messages
        ERROR_PASSWORDS_NO_MATCH: 'Passwords do not match!',
        ERROR_REGISTRATION_FAILED: 'Registration failed. Please try again.',
        ERROR_NETWORK: 'Network error. Please check your connection and try again.'
    },
    
    // Admin Dashboard
    ADMIN: {
        // Navigation
        NAV_TITLE: 'Admin Control Panel',
        NAV_BADGE: 'ADMIN',
        NAV_LOGOUT: 'Logout',
        ADMIN_EMAIL_LOADING: 'Loading...',
        
        // Hero Section
        HERO_TITLE: 'System Administration Dashboard',
        HERO_SUBTITLE: 'Monitor users and track API usage',
        
        // System Stats Cards
        STAT_TOTAL_USERS: 'TOTAL USERS',
        STAT_TOTAL_API_CALLS: 'TOTAL API CALLS',
        STAT_ACTIVE_USERS: 'ACTIVE USERS',
        STAT_OVER_LIMIT: 'OVER LIMIT',
        
        STAT_USERS_DESC: 'Registered accounts',
        STAT_API_CALLS_DESC: 'All-time commands',
        STAT_ACTIVE_DESC: 'Users with activity',
        STAT_OVER_LIMIT_DESC: 'Exceeded 20 free calls',
        
        // Endpoint Statistics
        ENDPOINT_STATS_TITLE: 'API Endpoint Statistics',
        ENDPOINT_TOTAL_REQUESTS: 'Total Requests:',
        ENDPOINT_REFRESH: 'Refresh',
        ENDPOINT_METHOD: 'Method',
        ENDPOINT_ENDPOINT: 'Endpoint',
        ENDPOINT_REQUESTS: 'Requests',
        ENDPOINT_LAST_ACCESSED: 'Last Accessed',
        ENDPOINT_LOADING: 'Loading endpoint statistics...',
        ENDPOINT_NO_DATA: 'No endpoint data available',
        ENDPOINT_LOAD_ERROR: 'Failed to load endpoint statistics',
        
        // User Management
        USER_MGMT_TITLE: 'User Management',
        USER_SEARCH_PLACEHOLDER: 'Search by email or name...',
        USER_LOADING: 'Loading user data...',
        USER_TABLE_ID: 'ID',
        USER_TABLE_EMAIL: 'Email',
        USER_TABLE_ROLE: 'Role',
        USER_TABLE_API_CALLS: 'API Calls Used',
        USER_TABLE_CREATED: 'Created At',
        USER_TABLE_LAST_LOGIN: 'Last Login',
        USER_TABLE_STATUS: 'Status',
        USER_NO_USERS: 'No users found',
        USER_LOAD_ERROR: 'Failed to load users',
        USER_LAST_LOGIN_NEVER: 'Never',
        
        // Badges
        BADGE_ADMIN: 'Admin',
        BADGE_USER: 'User',
        BADGE_OVER_LIMIT: 'Over Limit',
        BADGE_ACTIVE: 'Active',
        
        // Top Users Section
        TOP_USERS_TITLE: 'Top API Users',
        TOP_USERS_CALLS: 'calls',
        
        // User Distribution
        DISTRIBUTION_TITLE: 'User Distribution',
        DISTRIBUTION_REGULAR: 'Regular Users',
        DISTRIBUTION_ADMIN: 'Admin Users',
        DISTRIBUTION_AVG: 'Avg API Calls',
        DISTRIBUTION_OVER_LIMIT: 'Over Limit %',
        
        // Loading states
        LOADING: 'Loading...',
        SPINNER_LOADING: 'Loading...',
        
        // Actions
        BUTTON_REFRESH: 'Refresh',
        
        // Error messages
        ERROR_LOAD_DASHBOARD: 'Failed to load dashboard',
        ERROR_LOGOUT: 'Logout failed'
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