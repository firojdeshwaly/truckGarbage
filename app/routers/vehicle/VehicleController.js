const {
  models: { Vehicle, User },
} = require("./../../models");
const {
  showDate,
  uploadImageLocal,
  uploadImage,
} = require("../../../lib/util");
const multiparty = require("multiparty");
const fs = require("fs");
const { promisify } = require("util");
const console = require("console");
class VehicleController {

  async listPage(req, res) {
    return res.render("vehicle/list");
  }

  async list(req, res) {
    let reqData = req.query;
    let columnNo = parseInt(reqData.order[0].column);
    let sortOrder = reqData.order[0].dir === "desc" ? -1 : 1;
    let query = {
      isDeleted: false,
    };
    if (reqData.search.value) {
      const searchValue = new RegExp(
        reqData.search.value
          .split(" ")
          .filter((val) => val)
          .map((value) => value.replace(/[-[\]{}()*+?.,\\^$|#\s]/g, "\\$&"))
          .join("|"),
        "i"
      );
      query.$or = [{ title: searchValue }, { description: searchValue }];
    }
    let sortCond = { created: sortOrder };
    let response = {};
    switch (columnNo) {
      case 1:
        sortCond = {
          title: sortOrder,
        };
        break;
      case 5:
        sortCond = {
          status: sortOrder,
        };
        break;
      default:
        sortCond = { created: sortOrder };
        break;
    }
    const count = await Vehicle.countDocuments(query);
    response.draw = 0;
    if (reqData.draw) {
      response.draw = parseInt(reqData.draw) + 1;
    }
    response.recordsTotal = count;
    response.recordsFiltered = count;
    let skip = parseInt(reqData.start);
    let limit = parseInt(reqData.length);
    let vehicle = await Vehicle.find(query)
      .populate({ path: "driverId", model: User })
      .sort(sortCond)
      .skip(skip)
      .limit(limit)
      .lean();
    if (vehicle) {
      vehicle = vehicle.map((vehicle) => {
        let actions = "";
        actions = `${actions}<a href="/vehicle/view/${vehicle._id}" class="shadow-sm p-3 mb-5 xyz bg-body rounded-circle"><span class="text-gradient"><i class="ion-eye" title="view"></i></span></a>`;
        return {
          0: (skip += 1),
          1: vehicle.vehicleName,
          2: actions,
        };
      });
    }
    response.data = vehicle;
    return res.send(response);
  }
  async Datainsert(req, res, next) {
    try {
      let data = req.body;
      const user = new Vehicle();
      user.name = data.name;
      user.slug = data.slug;
      user.save();
      return res.send({
        message: "data insert successfullys",
      });
    } catch (err) {
      console.log("error", err);
      return next(err);
    }
  }
  async view(req, res) {
    let vehicle = await Vehicle.findOne({ _id: req.params.id, isDeleted: false }).lean();
    if (!vehicle) {
      req.flash("error", req.__("Vehicle not exists"));
      return res.redirect("/vehicle");
    }
    return res.render("vehicle/view", { vehicle });
  }
}
module.exports = new VehicleController();
