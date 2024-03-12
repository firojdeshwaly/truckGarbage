const express = require('express');
const router = express.Router();
const VehicleController = require('./VehicleController');
const { verifyToken } = require('../../../util/auth');
const validations = require('./VehicleValidations');
const {validate} = require('../../../util/validations');
// vehicle
router.get('/', verifyToken, VehicleController.listPage);
router.get('/list', verifyToken, VehicleController.list);
router.post("/datainsert",VehicleController.Datainsert);
router.get("/view/:id", validate(validations.requireId, "params", {}, "/vehicle"), verifyToken,VehicleController.view);

module.exports = router;