const express = require('express');
const router = express.Router();
const AuthController = require('./AuthController');

const {verifyToken} = require('../../util/auth');

router.get('/generate-token/:_id',AuthController.generateToken);
router.post('/log-in',AuthController.logIn);
router.get('/log-out',verifyToken,AuthController.logOut);
router.post('/verify-otp',AuthController.verifyOtp);
router.post('/resend-otp',AuthController.resendOtp);
router.post('/signup',AuthController.signup);
router.post('/forgot-password',AuthController.forgotPassword);
router.post('/reset-password',AuthController.resetPassword);
router.post('/changepassword', verifyToken, AuthController.changePassword);

module.exports = router;
