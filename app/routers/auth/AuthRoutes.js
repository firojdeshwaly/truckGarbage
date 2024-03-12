const express = require('express');
const router = express.Router();
const { validate } = require("../../../util/validations.js");
const validations = require('./AuthValidations');
const AuthController = require('./AuthController');
const { verifyToken } = require('../../../util/auth');
router.get('/log-in',
    AuthController.logInPage
);
router.post('/log-in',
    AuthController.logIn
);
router.get('/log-out',
    AuthController.logout
);
router.get('/forgot-password',
    AuthController.forgotPasswordPage,
);
router.post('/forgot-password',
    validate(validations.forgotPassword),
    AuthController.forgotPassword
);
router.get('/resend-otp',
    AuthController.resendOTP
);
router.post('/validate-otp',
    AuthController.validateOTP
);
router.get('/reset-password',
    AuthController.resetPasswordPage
);
router.post('/reset-password',
    validate(validations.resetPassword),
    AuthController.resetPassword
);
// Static Pages
router.get('/privacy_policy', verifyToken, AuthController.privacy_policyPage);
router.get('/terms_conditions', verifyToken, AuthController.termsAndconditionPage);
router.get('/about_us', verifyToken, AuthController.Aboutus);
router.get('/faq', verifyToken, AuthController.Faq);
router.get('/contact-us', verifyToken, AuthController.contactUs);
router.get('/refund_cancellation', verifyToken, AuthController.refundCancellation);
router.post('/static', verifyToken, AuthController.Static);
router.post('/create-admin', AuthController.CreateAdmin);

module.exports = router;