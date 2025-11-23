// Detect if running locally
const isLocal = window.location.hostname === 'localhost' || 
                window.location.hostname === '127.0.0.1';

// Set API URL based on environment
const API = isLocal 
    ? 'http://localhost:3000'
    : 'https://unsparked-unperturbedly-dahlia.ngrok-f';

// Log environment for debugging
console.log(`Environment: ${isLocal ? 'LOCAL' : 'PRODUCTION'}`);
console.log(`API URL: ${API}`);

// Export for use in other files
window.API_CONFIG = { API, isLocal };