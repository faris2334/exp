const express = require('express');
const router = express.Router();
const { signUpUser, loginUser, googleLogin } = require('../controllers/authController');
const validate = require('../middleware/validationMiddleware');
const { signUpSchema, signInSchema } = require('../validation/authValidation');

router.post('/signup', validate(signUpSchema), signUpUser); 
router.post('/login', validate(signInSchema), loginUser);
router.post('/google', googleLogin);  // Google OAuth login

module.exports = router;
