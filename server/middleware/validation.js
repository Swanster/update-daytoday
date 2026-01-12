const { body, param, query, validationResult } = require('express-validator');

// Middleware to handle validation errors
const handleValidationErrors = (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(400).json({
            message: 'Validation failed',
            errors: errors.array().map(err => ({
                field: err.path,
                message: err.msg
            }))
        });
    }
    next();
};

// ============================================
// AUTH VALIDATORS
// ============================================

const registerValidation = [
    body('username')
        .trim()
        .isLength({ min: 3, max: 30 })
        .withMessage('Username must be between 3 and 30 characters')
        .matches(/^[a-zA-Z0-9_]+$/)
        .withMessage('Username can only contain letters, numbers, and underscores'),
    body('password')
        .isLength({ min: 6, max: 100 })
        .withMessage('Password must be between 6 and 100 characters'),
    body('displayName')
        .optional()
        .trim()
        .isLength({ max: 50 })
        .withMessage('Display name must be at most 50 characters'),
    handleValidationErrors
];

const loginValidation = [
    body('username')
        .trim()
        .notEmpty()
        .withMessage('Username is required'),
    body('password')
        .notEmpty()
        .withMessage('Password is required'),
    handleValidationErrors
];

// ============================================
// PROJECT VALIDATORS
// ============================================

const projectValidation = [
    body('projectName')
        .trim()
        .notEmpty()
        .withMessage('Project name is required')
        .isLength({ max: 200 })
        .withMessage('Project name must be at most 200 characters'),
    body('services')
        .optional()
        .isArray()
        .withMessage('Services must be an array'),
    body('services.*')
        .optional()
        .trim()
        .isLength({ max: 100 })
        .withMessage('Each service must be at most 100 characters'),
    body('reportSurvey')
        .optional()
        .isIn(['Done', 'Progress', ''])
        .withMessage('Report Survey must be Done, Progress, or empty'),
    body('wo')
        .optional()
        .isIn(['Done', 'Progress', ''])
        .withMessage('WO must be Done, Progress, or empty'),
    body('material')
        .optional()
        .isIn(['Request', 'Done Installation', 'Hold', 'Progress', 'Logistic', ''])
        .withMessage('Invalid material status'),
    body('dueDate')
        .optional({ nullable: true })
        .custom((value) => {
            if (value === null || value === '') return true;
            return !isNaN(Date.parse(value));
        })
        .withMessage('Due date must be a valid date'),
    body('date')
        .optional({ nullable: true })
        .custom((value) => {
            if (value === null || value === '') return true;
            return !isNaN(Date.parse(value));
        })
        .withMessage('Date must be a valid date'),
    body('picTeam')
        .optional()
        .isArray()
        .withMessage('PIC Team must be an array'),
    body('picTeam.*')
        .optional()
        .trim()
        .isLength({ max: 50 })
        .withMessage('Each PIC name must be at most 50 characters'),
    body('progress')
        .optional()
        .trim()
        .isLength({ max: 2000 })
        .withMessage('Progress must be at most 2000 characters'),
    body('status')
        .optional()
        .isIn(['Progress', 'Done', 'Hold', ''])
        .withMessage('Status must be Progress, Done, Hold, or empty'),
    handleValidationErrors
];

// ============================================
// DAILY VALIDATORS
// ============================================

const dailyValidation = [
    body('clientName')
        .trim()
        .notEmpty()
        .withMessage('Client name is required')
        .isLength({ max: 200 })
        .withMessage('Client name must be at most 200 characters'),
    body('services')
        .optional()
        .isArray()
        .withMessage('Services must be an array'),
    body('caseIssue')
        .optional()
        .isArray()
        .withMessage('Case/Issue must be an array'),
    body('action')
        .optional()
        .isIn(['Onsite', 'Remote', ''])
        .withMessage('Action must be Onsite, Remote, or empty'),
    body('date')
        .optional({ nullable: true })
        .custom((value) => {
            if (value === null || value === '') return true;
            return !isNaN(Date.parse(value));
        })
        .withMessage('Date must be a valid date'),
    body('picTeam')
        .optional()
        .isArray()
        .withMessage('PIC Team must be an array'),
    body('detailAction')
        .optional()
        .trim()
        .isLength({ max: 5000 })
        .withMessage('Detail Action must be at most 5000 characters'),
    body('status')
        .optional()
        .isIn(['Progress', 'Done', 'Hold', ''])
        .withMessage('Status must be Progress, Done, Hold, or empty'),
    handleValidationErrors
];

// ============================================
// COMMON VALIDATORS
// ============================================

const mongoIdParam = [
    param('id')
        .isMongoId()
        .withMessage('Invalid ID format'),
    handleValidationErrors
];

const userIdParam = [
    param('userId')
        .isMongoId()
        .withMessage('Invalid user ID format'),
    handleValidationErrors
];

const quarterQueryValidation = [
    query('quarter')
        .optional()
        .matches(/^Q[1-4]-\d{4}$/)
        .withMessage('Quarter must be in format Q1-2025, Q2-2025, etc.'),
    query('year')
        .optional()
        .isInt({ min: 2000, max: 2100 })
        .withMessage('Year must be between 2000 and 2100'),
    handleValidationErrors
];

const batchStatusValidation = [
    body('ids')
        .isArray({ min: 1 })
        .withMessage('IDs must be a non-empty array'),
    body('ids.*')
        .isMongoId()
        .withMessage('Each ID must be a valid MongoDB ID'),
    body('status')
        .isIn(['Done', 'Progress', 'Hold'])
        .withMessage('Status must be Done, Progress, or Hold'),
    handleValidationErrors
];

// ============================================
// CATEGORY/CASE TYPE VALIDATORS
// ============================================

const categoryValidation = [
    body('name')
        .trim()
        .notEmpty()
        .withMessage('Name is required')
        .isLength({ max: 100 })
        .withMessage('Name must be at most 100 characters'),
    body('order')
        .optional()
        .isInt({ min: 0 })
        .withMessage('Order must be a positive integer'),
    handleValidationErrors
];

const roleValidation = [
    body('role')
        .isIn(['superuser', 'admin', 'user'])
        .withMessage('Role must be superuser, admin, or user'),
    handleValidationErrors
];

const passwordResetValidation = [
    body('newPassword')
        .isLength({ min: 6, max: 100 })
        .withMessage('Password must be between 6 and 100 characters'),
    handleValidationErrors
];

module.exports = {
    handleValidationErrors,
    // Auth
    registerValidation,
    loginValidation,
    // Projects
    projectValidation,
    // Dailies
    dailyValidation,
    // Common
    mongoIdParam,
    userIdParam,
    quarterQueryValidation,
    batchStatusValidation,
    // Categories
    categoryValidation,
    // Roles
    roleValidation,
    passwordResetValidation
};
