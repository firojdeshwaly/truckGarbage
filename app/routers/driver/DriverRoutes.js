const express = require('express');
const router = express.Router();
const DriverController = require('./DriverController');
const { verifyToken } = require('../../../util/auth');
const validations = require('./DriverValidations');
const {validate} = require('../../../util/validations');

router.get('/', verifyToken, DriverController.listPage);
router.get('/list', verifyToken, DriverController.list);
router.get("/view/:id", validate(validations.requireId, "params", {}, "/driver"), verifyToken,DriverController.view);
router.get('/edit/:id',verifyToken,DriverController.edit);
router.post("/update/:id",validate(validations.requireId, "params", {}, "/driver"),verifyToken,DriverController.updateData);
router.get("/approve-status",validate(validations.updateStatus, "query", {}, "/driver"),verifyToken,DriverController.approveStatus);
router.get("/update-status",validate(validations.updateStatus, "query", {}, "/driver"),verifyToken,DriverController.updateStatus);
router.get("/delete/:id",validate(validations.requireId, "params", {}, "/driver"),verifyToken,DriverController.delete);
router.get("/vehicleInfo/:id", validate(validations.requireId, "params", {}, "/driver"), verifyToken,DriverController.vehicleInfo);

module.exports = router;