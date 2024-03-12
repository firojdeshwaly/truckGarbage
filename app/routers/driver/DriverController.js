const {
  models: { User, DriverVehicleInfo, Vehicle, DriverPreferences },
} = require("./../../models");
const {
  showDate,
  uploadImageLocal,
  uploadImage,
} = require("../../../lib/util");
const multiparty = require("multiparty");
const fs = require("fs");
const multer = require("multer");
const { promisify } = require("util");
const unlinkAsync = promisify(fs.unlink);
const console = require("console");
class DriverController {

  async listPage(req, res) {
    return res.render("driver/list");
  }
  async list(req, res) {
    let reqData = req.query;
    let columnNo = parseInt(reqData.order[0].column);
    let sortOrder = reqData.order[0].dir === "desc" ? -1 : 1;
    let query = {
      role: 'Driver',
      isDeleted: false,
      emailVerify: true
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
      query.$or = [{ name: searchValue }, { email: searchValue }];
    }
    let sortCond = { created: sortOrder };
    let response = {};
    switch (columnNo) {
      case 1:
        sortCond = {
          name: sortOrder,
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
    const count = await User.countDocuments(query);
    response.draw = 0;
    if (reqData.draw) {
      response.draw = parseInt(reqData.draw) + 1;
    }
    response.recordsTotal = count;
    response.recordsFiltered = count;
    let skip = parseInt(reqData.start);
    let limit = parseInt(reqData.length);
    let drivers = await User.find(query)
      .sort(sortCond)
      .skip(skip)
      .limit(limit)
      .lean();

    if (drivers) {
      drivers = drivers.map((driver) => {
        let actions = "";
        actions = `${actions}<a href="/driver/edit/${driver._id}" class="shadow-sm p-3 mb-5 xyz bg-body rounded-circle" ><span class="text-gradient" ><i class="ion-edit" title="Edit"></i></span></a>`;
        actions = `${actions}<a href="/driver/view/${driver._id}" class="shadow-sm p-3 mb-5 xyz bg-body rounded-circle"><span class="text-gradient"><i class="ion-eye" title="view"></i></span></a>`;
        actions = `${actions}<a href="/driver/delete/${driver._id}" class="deleteChange shadow-sm p-3 mb-5 xyz bg-body rounded-circle"><span class="text-gradient"><i class="ion-trash-a" title="Delete"></i></span></a>`;
        actions = `${actions}<a href="/driver/vehicleInfo/${driver._id}" class="shadow-sm p-3 mb-5 xyz bg-body rounded-circle"><span class="text-gradient"><i class="ion-eye" title="vehicle Info"></i></span></a>`;
        return {
          0: (skip += 1),
          1: driver.name,
          2: driver.email,
          3: driver.isApproved == true
            ? `<a class="dstatusChange" href="/driver/approve-status?id=${driver._id}&status=false&" title="DesApproved" style="display: flex;align-items: center;justify-content: center;">
                 <label class="switch">
                 <input type="checkbox" checked>
                 <span class="slider round"></span>
                 </label> </a>`
            : `<a class="estatusChange" href="/driver/approve-status?id=${driver._id}&status=true&" title="Arroved" style="display: flex;align-items: center;justify-content: center;"> 
                 <label class="switch ">
                 <input type="checkbox" >
                 <span class="slider round"></span>
                 </label></a>`,
          4: driver.isSuspended == false
            ? `<a class="dstatusChange" href="/driver/update-status?id=${driver._id}&status=true&" title="Mark Suspended" style="display: flex;align-items: center;justify-content: center;">
                     <label class="switch">
                     <input type="checkbox" checked>
                     <span class="slider round"></span>
                     </label> </a>`
            : `<a class="estatusChange" href="/driver/update-status?id=${driver._id}&status=false&" title="Mark Active" style="display: flex;align-items: center;justify-content: center;"> 
                     <label class="switch ">
                     <input type="checkbox" >
                     <span class="slider round"></span>
                     </label></a>`,
          5: actions,
        };
      });
    }
    response.data = drivers;
    return res.send(response);
  }
  async view(req, res) {
    let driver = await User.findOne({_id: req.params.id,isDeleted: false}).lean();
    if (!driver) {
      req.flash("error", req.__("Driver not exists"));
      return res.redirect("/driver");
    }
    return res.render("driver/view", {driver,url: `${process.env.AWS_BASE_URL}`});
  }
  async edit(req, res) {
    let _id = req.params.id;
    let driver = await User.findOne({_id});
    if (!driver) {
      req.flash('error', req.__('Driver is not exists'));
      return res.redirect('/driver');
    }
    return res.render('driver/edit', {driver,_id});
  }
  async updateData(req, res, next) {
    try {
      let form = new multiparty.Form();
      const driver = await User.findOne({_id: req.params.id});
      form.parse(req, async function (err, fields, files) {
        _.forOwn(fields, (field, key) => {
          driver[key] = field[0];
        });
        if (files.image[0].originalFilename == "") {
        } else {
          let fileupload = files.image[0];
          let image = await uploadImage(fileupload, "driver");
          driver["image"] = image.key;
        }

        await driver.save();
        req.flash('success', req.__('Driver successfully updated'));
        res.redirect("/driver");
      });
    } catch (err) {
      console.log(err);
      return next(err);
    }
  }
  async approveStatus(req, res) {
    const { id, status } = req.query;
    let driver = await User.findOne({_id: id});
    if (!driver) {
      req.flash('error', req.__('Driver is not exists'));
      return res.redirect('/driver');
    }
    driver.isApproved = status;
    await driver.save();
    req.flash('success', req.__('Driver is updated'));
    return res.redirect('/driver');
  }
  async updateStatus(req, res) {
    const { id, status } = req.query;
    let driver = await User.findOne({_id: id});
    if (!driver) {
      req.flash('error', req.__('Driver is not exists'));
      return res.redirect('/driver');
    }
    driver.isSuspended = status;
    await driver.save();
    req.flash('success', req.__('Driver is updated'));
    return res.redirect('/driver');
  }
  async delete(req, res) {
    const driver = await User.findOne({_id: req.params.id,isDeleted: false});
    if (!driver) {
      req.flash('error', req.__('Driver is not exists'));
      return res.redirect('/driver');
    }
    driver.isDeleted = true;
    await driver.save();
    req.flash('success', req.__('Driver deleted successfully'));
    return res.redirect('/driver');
  }

  async vehicleInfo(req, res) {
    let vehicle = await Vehicle.findOne({ driverId: req.params.id, isDeleted: false, })
      .populate({ path: 'vehicleId', select: '', model: VehicleType })
      .lean();
    if (!vehicle) {
      req.flash("error", req.__("Vehicle not exists"));
      return res.redirect("/driver");
    }
    return res.render("driver/vehicleInfo", { vehicle, url: `${process.env.AWS_BASE_URL}` });
  }

}
module.exports = new DriverController();
