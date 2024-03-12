const express = require('express');
const router = express.Router();
const RequestController = require('./RequestController');
const { verifyToken } = require('../../../util/auth');
const validations = require('./RequestValidations');
const {validate} = require('../../../util/validations');

router.get('/', verifyToken, RequestController.listPage);
router.get('/list', verifyToken, RequestController.list);
router.get("/view/:id", validate(validations.requireId, "params", {}, "/vehicleinfo"), verifyToken,RequestController.view);
router.get("/update-status",validate(validations.updateStatus, "query", {}, "/vehicleinfo"),verifyToken,RequestController.updateStatus);
router.get("/delete/:id",validate(validations.requireId, "params", {}, "/vehicleinfo"),verifyToken,RequestController.delete);

module.exports = router;