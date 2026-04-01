const multer = require('multer');
const path = require('path');
const fs = require('fs');

// Ensure uploads directory exists
const uploadsDir = path.join(__dirname, '..', 'uploads');
if (!fs.existsSync(uploadsDir)) {
    fs.mkdirSync(uploadsDir, { recursive: true });
}

// Configure storage
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, uploadsDir);
    },
    filename: (req, file, cb) => {
        // Generate unique filename: timestamp-randomname-extension
        const timestamp = Date.now();
        const randomString = Math.random().toString(36).substring(2, 8);
        const ext = path.extname(file.originalname);
        const sanitizedName = file.originalname
            .replace(/[^a-zA-Z0-9.-]/g, '_')
            .substring(0, 50); // Limit filename length
        const uniqueName = `${timestamp}-${randomString}-${sanitizedName}${ext}`;
        cb(null, uniqueName);
    }
});

// File filter - allowed types with categories
const allowedMimeTypes = {
    // Images (5MB limit)
    image: [
        'image/jpeg',
        'image/png',
        'image/gif',
        'image/webp'
    ],
    // Documents (10MB limit)
    document: [
        'application/pdf',
        'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        'application/vnd.ms-excel',
        'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
        'application/msword'
    ]
};

const allowedMimeTypesFlat = [
    ...allowedMimeTypes.image,
    ...allowedMimeTypes.document
];

const fileFilter = (req, file, cb) => {
    if (allowedMimeTypesFlat.includes(file.mimetype)) {
        cb(null, true);
    } else {
        const allowedTypes = 'Images (JPEG, PNG, GIF, WebP), PDF, Excel, Word';
        cb(new Error(`File type not allowed: ${file.mimetype}. Allowed types: ${allowedTypes}`), false);
    }
};

// Create multer instance with configuration
const upload = multer({
    storage,
    fileFilter,
    limits: {
        fileSize: 50 * 1024 * 1024, // 50MB general limit
        files: 10, // Max 10 files per request
        fieldNameSize: 100, // Max field name size
        fieldSize: 1024 * 1024 // Max field value size (1MB)
    }
});

// Error handling middleware for multer
const handleMulterError = (err, req, res, next) => {
    if (err instanceof multer.MulterError) {
        // Handle specific multer errors
        if (err.code === 'LIMIT_FILE_SIZE') {
            return res.status(400).json({
                message: 'File too large. Maximum file size is 50MB for documents or 5MB for images.'
            });
        }
        if (err.code === 'LIMIT_FILE_COUNT') {
            return res.status(400).json({
                message: 'Too many files. Maximum 10 files per request.'
            });
        }
        if (err.code === 'LIMIT_UNEXPECTED_FILE') {
            return res.status(400).json({
                message: 'Unexpected field in upload.'
            });
        }
        return res.status(400).json({
            message: `Upload error: ${err.message}`
        });
    }
    
    // Handle custom errors (like file filter errors)
    if (err) {
        return res.status(400).json({
            message: err.message || 'File upload failed'
        });
    }
    
    next();
};

// Helper function to validate file size based on type
const validateFileSize = (file, maxSize) => {
    return new Promise((resolve, reject) => {
        if (file.size > maxSize) {
            reject(new Error(`File size exceeds limit. Maximum size: ${maxSize / 1024 / 1024}MB`));
        } else {
            resolve();
        }
    });
};

module.exports = { 
    upload, 
    uploadsDir, 
    handleMulterError,
    validateFileSize,
    allowedMimeTypes
};
