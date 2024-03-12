const express = require('express');
const router = express.Router();
const UserController = require('./UserController');
const { verifyToken } = require('../../../util/auth');
const validations = require('./UserValidations');
const {validate} = require('../../../util/validations');


router.get('/', verifyToken, UserController.listPage);
router.get('/list', verifyToken, UserController.list);
router.get("/view/:id", validate(validations.requireId, "params", {}, "/users"), verifyToken,UserController.view);
router.get('/edit/:id',verifyToken,UserController.edit);
router.post("/update/:id",validate(validations.requireId, "params", {}, "/users"),verifyToken,UserController.updateData);
router.get("/update-status",validate(validations.updateStatus, "query", {}, "/users"),verifyToken,UserController.updateStatus);
router.get("/delete/:id",validate(validations.requireId, "params", {}, "/users"),verifyToken,UserController.delete);

module.exports = router;