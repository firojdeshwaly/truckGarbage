const express = require('express');
const router = express.Router();
const fs = require('fs');
global._ = require('lodash')
const {verifyToken} = require('../../util/auth');
const { validate } = require('../../util/validations');
const AuthController = require('./auth/AuthController');
const validations = require('./auth/AuthValidations');
const routes = fs.readdirSync(__dirname);
routes.forEach(route => {
    if (route === 'index.js') return;
    console.log(route);
    router.use(`/${route}`, require(`./${route}`));
});
router.get('/',verifyToken,
    AuthController.dashboard
);
//tttttttttttttttttt
router.get('/profile', verifyToken, AuthController.profilePage);
router.post('/profile', verifyToken, validate(validations.profile), AuthController.profile);
router.get('/change-password', verifyToken, AuthController.changePasswordPage);
router.post('/change-password', verifyToken, validate(validations.updatePassword), AuthController.changePassword);
module.exports = router;