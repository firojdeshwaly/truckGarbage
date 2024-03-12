const express = require("express");
const router = express.Router();
const UserController = require("./UserController");
const { validate } = require("../../util/validations");
const validations = require("./UserValidations");
const { verifyToken } = require("../../util/auth");

// ----------------------------------user------------------------------------------
router.post("/createProfile", verifyToken, UserController.createProfile);
router.get("/getProfile", verifyToken, UserController.getProfile);
router.post("/updateProfile", verifyToken, UserController.updateProfile);
router.post("/pricingAccordingVehicle", verifyToken, UserController.pricingAccordingVehicle);


//-------------------------------driverVehicleInfo-----------------------------------
router.post('/add-driver-vehicle', verifyToken, UserController.AddDriverVehicle);
router.get("/vehicle-type-list", verifyToken, UserController.VehicleTypeList);
router.post("/driverDocument", verifyToken, UserController.driverDocument);
router.post("/driverUpdateDocument", verifyToken, UserController.driverUpdateDocument);
router.post("/homeLocation", verifyToken, UserController.homeLocation);
router.post("/address", UserController.Address);

//--------------------------------------------location----------------------------------------
router.post("/pickupLocation", verifyToken, UserController.pickupLocation);

//------------------------------------static page------------------------------------------//
router.get("/privacy_policy", UserController.privacy_policyPage);
router.get("/terms_conditions", UserController.termsAndconditionPage);
router.get("/about_us", UserController.Aboutus);
router.get("/refund_cancellation", UserController.Refund);
router.get("/html_page/:slug", UserController.html_page);
router.post("/pages", UserController.pages);

module.exports = router;
