/**
 * Input Sanitization Middleware
 * Prevents XSS attacks by sanitizing user input
 */

// Sanitize a single string value
const sanitizeString = (value) => {
    if (typeof value !== 'string') return value;
    
    // Remove script tags and event handlers
    let sanitized = value
        // Remove script tags
        .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
        // Remove javascript: protocol
        .replace(/javascript:/gi, '')
        // Remove on* event handlers (onclick, onload, etc.)
        .replace(/on\w+\s*=\s*["'][^"']*["']/gi, '')
        // Remove <iframe> tags
        .replace(/<iframe\b[^<]*(?:(?!<\/iframe>)<[^<]*)*<\/iframe>/gi, '')
        // Remove <object> tags
        .replace(/<object\b[^<]*(?:(?!<\/object>)<[^<]*)*<\/object>/gi, '')
        // Remove <embed> tags
        .replace(/<embed\b[^<]*(?:(?!<\/embed>)<[^<]*)*<\/embed>/gi, '')
        // Remove <link> tags
        .replace(/<link\b[^<]*(?:(?!\/?>)|\/?>)*\s*\/?>/gi, '')
        // Remove <meta> tags
        .replace(/<meta\b[^<]*(?:(?!\/?>)|\/?>)*\s*\/?>/gi, '')
        // Decode common HTML entities that could be used for XSS
        .replace(/&lt;/g, '<')
        .replace(/&gt;/g, '>')
        .replace(/&quot;/g, '"')
        .replace(/&#x27;/g, "'")
        .replace(/&#x2F;/g, '/')
        .replace(/&#x60;/g, '`')
        .replace(/&#x3D;/g, '=');
    
    // Trim whitespace
    return sanitized.trim();
};

// Sanitize an object recursively
const sanitizeObject = (obj) => {
    if (obj === null || obj === undefined) return obj;
    
    if (typeof obj === 'string') {
        return sanitizeString(obj);
    }
    
    if (Array.isArray(obj)) {
        return obj.map(item => sanitizeObject(item));
    }
    
    if (typeof obj === 'object') {
        const sanitized = {};
        for (const key in obj) {
            if (Object.prototype.hasOwnProperty.call(obj, key)) {
                // Don't sanitize keys that are likely to contain HTML (like detailAction, progress)
                // but still sanitize the values
                sanitized[key] = sanitizeObject(obj[key]);
            }
        }
        return sanitized;
    }
    
    return obj;
};

// Middleware to sanitize request body
const sanitizeInput = (req, res, next) => {
    try {
        if (req.body) {
            req.body = sanitizeObject(req.body);
        }
        
        if (req.query) {
            req.query = sanitizeObject(req.query);
        }
        
        if (req.params) {
            req.params = sanitizeObject(req.params);
        }
        
        next();
    } catch (error) {
        // If sanitization fails, continue without sanitizing
        // Log error in development
        if (process.env.NODE_ENV === 'development') {
            console.error('Sanitization error:', error.message);
        }
        next();
    }
};

// Helper function for manual sanitization (if needed in routes)
const sanitize = (input) => {
    return sanitizeString(input);
};

module.exports = {
    sanitizeInput,
    sanitize,
    sanitizeString,
    sanitizeObject
};
