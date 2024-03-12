const {
  models: { VehicleType },
} = require("../../models");
const { uploadImage} = require("../../../lib/util");
const multiparty = require("multiparty");
const console = require("console");

class VehicleTypeController {
  async listPage(req, res) {
    return res.render("vehicletype/list");
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
    const count = await VehicleType.countDocuments(query);
    response.draw = 0;
    if (reqData.draw) {
      response.draw = parseInt(reqData.draw) + 1;
    }
    response.recordsTotal = count;
    response.recordsFiltered = count;
    let skip = parseInt(reqData.start);
    let limit = parseInt(reqData.length);
    let info = await VehicleType.find(query).sort(sortCond).skip(skip).limit(limit);
    if (info) {
        info = info.map((vehicletype) => {
        let actions = "";
        actions = `${actions}<a href="/vehicletype/edit/${vehicletype._id}" class="shadow-sm p-3 mb-5 xyz bg-body rounded-circle" ><span class="text-gradient" ><i class="ion-edit" title="Edit"></i></span></a>`;
        actions = `${actions}<a href="/vehicletype/view/${vehicletype._id}" class="shadow-sm p-3 mb-5 xyz bg-body rounded-circle"><span class="text-gradient"><i class="ion-eye" title="view"></i></span></a>`;
        actions = `${actions}<a href="/vehicletype/delete/${vehicletype._id}" class="deleteChange shadow-sm p-3 mb-5 xyz bg-body rounded-circle"><span class="text-gradient"><i class="ion-trash-a" title="Delete"></i></span></a>`;
        return {
          0: (skip += 1),
          1: vehicletype.name,
          2: vehicletype.type,
          3: vehicletype.charge_time_weight,
          4: vehicletype.isSuspended == false
            ? `<a class="dstatusChange" href="/vehicletype/update-status?id=${vehicletype._id}&status=true&" title="Mark Suspended" style="display: flex;align-items: center;justify-content: center;">
                       <label class="switch">
                       <input type="checkbox" checked>
                       <span class="slider round"></span>
                       </label> </a>`
            : `<a class="estatusChange" href="/vehicletype/update-status?id=${vehicletype._id}&status=false&" title="Mark Active" style="display: flex;align-items: center;justify-content: center;"> 
                       <label class="switch ">
                       <input type="checkbox" >
                       <span class="slider round"></span>
                       </label></a>`,
          5: actions,
        };
      });
    }
    response.data = info;
    return res.send(response);
  }
  async add(req, res) {
    let vehicle = await VehicleType.find({});
    return res.render("vehicletype/add", {
      vehicle,
    });
  }
  async saveAdd(req, res) {
    try {
      let form = new multiparty.Form();
      let vehicleType = new VehicleType();
      form.parse(req, async function (err, fields, files) {
        _.forOwn(fields, (field, key) => {
          vehicleType[key] = field[0];
        });
        if (files.image[0].originalFilename == "") {
        } else {
          let fileupload = files.image[0];
          let image = await uploadImage(fileupload, "vehicleType");
          vehicleType["image"] = image.key;
        }
        await vehicleType.save();
        req.flash("success", req.__("Vehicle type added success !"));
        return res.redirect("/vehicletype");
      });
    } catch (err) {
      console.log(err);
      return next(err);
    }
  }
  async view(req, res) {
    let vehicleType = await VehicleType.findOne({ _id: req.params.id, isDeleted: false, }).lean();
    if (!vehicleType) {
      req.flash("error", req.__("Vehicle type not exists"));
      return res.redirect("/vehicletype");
    }
    return res.render("vehicletype/view", {
      vehicleType,
      url: `${process.env.AWS_BASE_URL}`,
    });
  }
  async edit(req, res) {
    let _id = req.params.id;
    let vehicleType = await VehicleType.findOne({_id});
    if (!vehicleType) {
      req.flash('error', req.__('Vehicle Type is not exists'));
      return res.redirect('/vehicletype');
    }
    return res.render('vehicletype/edit', {vehicleType,_id,});
  }
  async updateData(req, res, next) {
    try {
      let form = new multiparty.Form();
      const vehicleType = await VehicleType.findOne({_id: req.params.id});
      form.parse(req, async function (err, fields, files) {
        _.forOwn(fields, (field, key) => {
          vehicleType[key] = field[0];
        });
        if (files.image[0].originalFilename == "") {
        } else {
          let fileupload = files.image[0];
          let image = await uploadImage(fileupload, "vehicleType");
          vehicleType["image"] = image.key;
        }
        await vehicleType.save();
        req.flash('success', req.__('Vehicle info successfully updated'));
        res.redirect("/vehicletype");

      });
    } catch (err) {
      console.log(err);
      return next(err);
    }
  }
  async updateStatus(req, res) {
    const { id, status } = req.query;
    let vehicleType = await VehicleType.findOne({_id: id});
    if (!vehicleType) {
      req.flash('error', req.__('Vehicle info is not exists'));
      return res.redirect('/vehicletype');
    }

    vehicleType.isSuspended = status;
    await vehicleType.save();
    req.flash('success', req.__('Vehicle info is updated'));
    return res.redirect('/vehicletype');
  }
  async delete(req, res) {
    const vehicleType = await VehicleType.findOne({_id: req.params.id,isDeleted: false});
    if (!vehicleType) {
      req.flash('error', req.__('Vehicle info is not exists'));
      return res.redirect('/vehicletype');
    }
    vehicleType.isDeleted = true;
    await vehicleType.save();
    req.flash('success', req.__('Vehicle info deleted successfully'));
    return res.redirect('/vehicletype');
  }
}
module.exports = new VehicleTypeController();
