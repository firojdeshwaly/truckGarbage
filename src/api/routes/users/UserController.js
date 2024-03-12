const {
  models: { User, Address, Page, DriverVehicleInfo, VehicleInfo },
} = require("../../../../app/models");
const { signToken } = require("../../util/auth");

const multiparty = require("multiparty");
const { utcDateTime, uploadS3, uploadImage } = require("../../../../lib/util");
var _ = require("lodash");

var FCM = require("fcm-node");
var serverKey = process.env.SERVER_KEY;
var geoAPIKEY = process.env.GEO_API_KEY;
var fcm = new FCM(serverKey);
const NodeGeocoder = require("node-geocoder");

class UserController {

  async getProfile(req, res, next) {
    try {
      let user = await User.findOne({ _id: req.user._id });
      if (!user) { return res.notFound({}, req.__("INVALID_REQUEST")) } else {

        user = user.toJSON();
        ["password", "authTokenIssuedAt", "otp", "emailToken", "__v"].forEach((key) => delete user[key]);
        return res.success({ user }, req.__("Profile_Information"));

      }
    } catch (err) {
      console.log(err);
      return next(err);
    }
  }
  async createProfile(req, res, next) {
    try {
      let user = await User.findOne({ _id: req.user._id });
      if (user) {
        let form = new multiparty.Form();
        form.parse(req, async function (err, fields, files) {
          let fileupload = files.image[0];
          _.forOwn(fields, (field, key) => {
            user[key] = field[0];
          });
          try {
            if (files.image[0].originalFilename != "") {
              let image = await uploadImage(fileupload, "user");
              user["image"] = image.key;
            }
            user.progress = 2;
            let user_ = await user.save();
            user_.authTokenIssuedAt = utcDateTime().valueOf();
            const jwttoken = signToken(user_);
            const userJson = user_.toJSON();
            ["password", "authTokenIssuedAt", "otp", "emailToken", "__v",].forEach((key) => delete userJson[key]);
            userJson.jwt = jwttoken;
            return res.success({ user: userJson }, "User Profile Created");
          } catch (err) {
            return res.next(err);
          }
        });
      } else {
        return res.warn({}, req.__("USER_NOT_FOUND"));
      }
    } catch (err) {
      console.log(err);
      return next(err);
    }
  }
  async updateProfile(req, res, next) {
    try {
      let user = await User.findOne({ _id: req.user._id });
      if (user) {
        let form = new multiparty.Form();
        form.parse(req, async function (err, fields, files) {

          _.forOwn(fields, (field, key) => {
            user[key] = field[0];
          });
          if (files.image && files.image.originalFilename) {
            let fileupload = files.image[0];
            let image = await uploadImage(fileupload, "user");
            user["image"] = image.key;
          }
          await user.save();
          return res.success({}, "User Profile updated");

        });
      } else {
        return res.warn({}, req.__("USER_NOT_FOUND"));
      }
    } catch (err) {
      return next(err);
    }
  }
  async AddDriverVehicle(req, res, next) {

    try {

      let { vehicleTypeId, vehicleName, vehicleModel, vehicleNumber } = req.body;
      let driverVehicle = new Vehicle({
        driverId: req._id,
        vehicleTypeId,
        vehicleName,
        vehicleModel,
        vehicleNumber
      });
      await driverVehicle.save();
      return res.success({}, req.__("Driver vehicle info added success"));

    } catch (err) {
      console.log(err);
      return next(err);
    }
  }
  async VehicleTypeList(req, res, next) {

    try {
      let vehicleTypeList = await VehicleType.find({ is_active: true })
      return res.success({ vehicleTypeList }, req.__("Vehicle type list"));

    } catch (err) {
      console.log(err);
      return next(err);
    }
  }
  async driverDocument(req, res, next) {
    try {
      let driver = await DriverVehicleInfo.findOne({ driverId: req.user._id });
      let user = await User.findOne({ _id: req.user._id });
      if (driver) {
        let form = new multiparty.Form();
        form.parse(req, async function (err, fields, files) {
          let fileupload1 = files.dlImage[0];
          let fileupload2 = files.rcImage[0];
          let fileupload3 = files.panImage[0];
          _.forOwn(fields, (field, key) => {
            driver[key] = field[0];
          });
          try {
            if (files.dlImage[0].originalFilename != "") {
              let dlImage = await uploadImage(fileupload1, "dlImage");
              driver["dlImage"] = dlImage.Key;
            }
            if (files.rcImage[0].originalFilename != "") {
              let rcImage = await uploadImage(fileupload2, "rcImage");
              driver["rcImage"] = rcImage.Key;
            }
            if (files.panImage[0].originalFilename != "") {
              let panImage = await uploadImage(fileupload3, "panImage");
              driver["panImage"] = panImage.Key;
            }
            await driver.save();
            user.progress = 3;
            let user_ = await user.save();
            const userJson = user_.toJSON();

            const jwttoken = signToken(user);
            userJson.jwt = jwttoken;
            ["password", "authTokenIssuedAt", "otp", "emailToken", "__v",].forEach((key) => delete userJson[key]);
            return res.success({ user: userJson }, "Driver Profile Created");
          } catch (err) {
            return next(err);
          }
        });
      } else {
        return res.warn({}, req.__("DRIVER_NOT_FOUND"));
      }
    } catch (err) {
      console.log(err);
      return next(err);
    }
  }
  async driverUpdateDocument(req, res, next) {
    try {
      let driver = await DriverVehicleInfo.findOne({ driverId: req.user._id });
      let user = await User.findOne({ _id: req.user._id });
      if (driver) {
        let form = new multiparty.Form();
        form.parse(req, async function (err, fields, files) {
          _.forOwn(fields, (field, key) => {
            driver[key] = field[0];
          });
          if (files.dlImage && files.dlImage[0].originalFilename) {
            let fileupload1 = files.dlImage[0];
            let dlImage = await uploadImage(fileupload1, "dlImage");
            driver["dlImage"] = dlImage.key;
          }
          if (files.rcImage && files.rcImage[0].originalFilename) {
            let fileupload2 = files.rcImage[0];
            let rcImage = await uploadImage(fileupload2, "rcImage");
            driver["rcImage"] = rcImage.key;
          }
          if (files.panImage && files.panImage[0].originalFilename) {
            let fileupload3 = files.panImage[0];
            let panImage = await uploadImage(fileupload3, "panImage");
            driver["panImage"] = panImage.key;
          }
          await driver.save();
          await user.save();
          return res.success({}, "User Profile updated");
        });
      } else {
        return res.warn({}, req.__("USER_NOT_FOUND"));
      }
    } catch (err) {
      return next(err);
    }
  }
  async homeLocation(req, res, next) {
    const { _id } = req;
    try {
      let user = await User.findOne({ _id });
      if (user) {
        let userCoordinates = user.loc.coordinates;
        var milesToRadian = function (miles) {
          var earthRadiusInMiles = 3959;
          return miles / earthRadiusInMiles;
        };
        let query;
        if (userCoordinates.length > 0) {
          query = {
            name: { $ne: null },
            email: { $ne: null },
            isSuspended: false,
            role: "Driver",
            "loc.coordinates": {
              $geoWithin: {
                $centerSphere: [userCoordinates, milesToRadian(miles)],
              },
            },
          };
        } else {
          query = {
            name: { $ne: null },
            email: { $ne: null },
            isSuspended: false,
            role: "Driver",
          };
        }
        let users = await User.find(query).lean();
        res.success({ users }, req.__(`User's Homescreen`));
      } else {
        res.warn({}, req.__("User does not exist !"));
      }
    } catch (err) {
      console.log(err);
      return next(err);
    }
  }
  async Address(req, res) {

    let data = req.body;
    let { lat, long } = req.body;
    let address = new Address();
    address.userId = data.userId;
    let location = [];
    if (lat && long) {
      location.push(long);
      location.push(lat);
      address.loc.coordinates = location;
    }
    address.address = data.address;
    address.type = data.type;
    await address.save();
  }
  async pricingAccordingVehicle(req, res, next) {
    try {

      let { distance, vehicleId } = req.body;
      let details = [];
      let vehicles = await VehicleInfo.find({
        vehicleId: vehicleId,
        isSuspended: false,
        isDeleted: false,
      });

      if (vehicles.length > 0) {
        vehicles.map((val) => {
          let obj = {};
          obj._id = val._id;
          obj.name = val.vehicle_name;
          obj.price = distance * val.vehicle_price;
          obj.image = val.image;
          obj.pickup = val.pickup;

          details.push(obj);
        });

        return res.success({ vehicles: details }, "vehicles get sucessfully");
      } else {
        return res.notFound({}, "vehicles not found");
      }
    } catch (err) {
      console.log(err);
      return next(err);
    }
  }


  async privacy_policyPage(req, res) {
    res.render("privacy");
  }

  async Aboutus(req, res) {
    res.render("about_us");
  }

  async termsAndconditionPage(req, res) {
    res.render("terms_conditions");
  }

  async Refund(req, res) {
    res.render("refund_cancellation");
  }


  async html_page(req, res) {
    const slug = req.params.slug;
    const p = await Page.findOne({ slug: slug });
    res.setHeader("Access-Control-Allow-Origin", "*");
    return res.send(p);
  }


  async pages(req, res) {
    const query = req.body.slug;
    let pageURL = "";
    if (query === "privacy-policy") {
      pageURL = `${process.env.API_URL}/users/privacy_policy`;
    } else if (query == "terms-conditions") {
      pageURL = `${process.env.API_URL}/users/terms_conditions`;
    } else if (query == "about-us") {
      pageURL = `${process.env.API_URL}/users/about_us`;
    } else if (query == "refund-cancellation") {
      pageURL = `${process.env.API_URL}/users/refund_cancellation`;
    }
    return res.success({ pageURL, }, "Page URL fetched successfully");
  }


  async pickupLocation(req, res, next) {
    let { pickup, drop } = req.body;
    try {
      return res.success({ pickup: pickup, drop: drop }, "distance  get sucessfully");
    } catch (error) {
      console.log(error);
      return res.next(error);
    }
  }

  async Test(req, res, next) {
    try {
      let form = new multiparty.Form();

      form.parse(req, async function (err, fields, files) {
        let fileupload = files.ID[0];
        let ID = await uploadS3(fileupload, "ID");
        return res.success(ID);
      });

    } catch (err) {
      return res.next(err);
    }
  }

}

module.exports = new UserController();
