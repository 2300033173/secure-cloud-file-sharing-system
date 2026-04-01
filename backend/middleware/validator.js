const { body, validationResult } = require('express-validator');

exports.validate = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({
      success: false,
      message: errors.array()[0].msg,
      errors: errors.array(),
    });
  }
  next();
};

exports.loginValidation = [
  body('email').isEmail().normalizeEmail().withMessage('Valid email is required'),
  body('password').notEmpty().withMessage('Password is required').isLength({ max: 128 }).withMessage('Password too long'),
];

exports.registerValidation = [
  body('email').isEmail().normalizeEmail().withMessage('Valid email is required'),
  body('name').trim().notEmpty().withMessage('Name is required').isLength({ max: 100 }).withMessage('Name too long').escape(),
  body('password')
    .isLength({ min: 8 }).withMessage('Password must be at least 8 characters')
    .isLength({ max: 128 }).withMessage('Password too long'),
];

exports.fileShareValidation = [
  body('fileId').isMongoId().withMessage('Valid file ID is required'),
  body('sharedWithEmail').isEmail().normalizeEmail().withMessage('Valid email is required'),
  body('accessLevel').optional().isIn(['view', 'download']).withMessage('Access level must be view or download'),
];
