const express = require('express');
const router = express.Router();
const path = require('path');
const fs = require('fs');
const { upload, uploadsDir } = require('../middleware/upload');
const { auth } = require('../middleware/auth');

// Upload a single file
router.post('/', auth, upload.single('file'), async (req, res) => {
    try {
        if (!req.file) {
            return res.status(400).json({ message: 'No file uploaded' });
        }

        const fileInfo = {
            filename: req.file.filename,
            originalName: req.file.originalname,
            mimetype: req.file.mimetype,
            size: req.file.size,
            uploadedAt: new Date()
        };

        res.status(201).json(fileInfo);
    } catch (error) {
        console.error('Upload error:', error);
        res.status(500).json({ message: error.message });
    }
});

// Upload multiple files (up to 10)
router.post('/multiple', auth, upload.array('files', 10), async (req, res) => {
    try {
        if (!req.files || req.files.length === 0) {
            return res.status(400).json({ message: 'No files uploaded' });
        }

        const filesInfo = req.files.map(file => ({
            filename: file.filename,
            originalName: file.originalname,
            mimetype: file.mimetype,
            size: file.size,
            uploadedAt: new Date()
        }));

        res.status(201).json(filesInfo);
    } catch (error) {
        console.error('Upload error:', error);
        res.status(500).json({ message: error.message });
    }
});

// Delete a file
router.delete('/:filename', auth, async (req, res) => {
    try {
        const filename = req.params.filename;
        const filePath = path.join(uploadsDir, filename);

        // Security check: ensure filename doesn't contain path traversal
        if (filename.includes('..') || filename.includes('/') || filename.includes('\\')) {
            return res.status(400).json({ message: 'Invalid filename' });
        }

        // Check if file exists
        if (!fs.existsSync(filePath)) {
            return res.status(404).json({ message: 'File not found' });
        }

        // Delete the file
        fs.unlinkSync(filePath);
        res.json({ message: 'File deleted successfully' });
    } catch (error) {
        console.error('Delete error:', error);
        res.status(500).json({ message: error.message });
    }
});

// Error handling middleware for multer errors
router.use((error, req, res, next) => {
    if (error instanceof require('multer').MulterError) {
        if (error.code === 'LIMIT_FILE_SIZE') {
            return res.status(400).json({
                message: 'File too large. Maximum size is 50MB.'
            });
        }
        return res.status(400).json({ message: error.message });
    }
    if (error) {
        return res.status(400).json({ message: error.message });
    }
    next();
});

module.exports = router;
