const {
  models: { DumpYard },
} = require("../../models");
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
class YardController {
  async listPage(req, res) {
    return res.render("yards/list");

  }
  async list(req, res) {
    try {

      let reqData = req.query;
      let columnNo = parseInt(reqData.order[0].column);
      let sortOrder = reqData.order[0].dir === "desc" ? -1 : 1;
      let query = {
        // isDeleted: false,
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
      const count = await DumpYard.countDocuments(query);
      response.draw = 0;
      if (reqData.draw) {
        response.draw = parseInt(reqData.draw) + 1;
      }
      response.recordsTotal = count;
      response.recordsFiltered = count;
      let skip = parseInt(reqData.start);
      let limit = parseInt(reqData.length);
      let yards = await DumpYard.find(query)
        .sort(sortCond)
        .skip(skip)
        .limit(limit);
      if (yards) {
        yards = yards.map((yard) => {
          let actions = "";
          actions = `${actions}<a href="/preferences/edit/${yard._id}" class="shadow-sm p-3 mb-5 xyz bg-body rounded-circle" ><span class="text-gradient" ><i class="ion-edit" title="Edit"></i></span></a>`;
          actions = `${actions}<a href="/preferences/view/${yard._id}" class="shadow-sm p-3 mb-5 xyz bg-body rounded-circle"><span class="text-gradient"><i class="ion-eye" title="view"></i></span></a>`;
          actions = `${actions}<a href="/preferences/delete/${yard._id}" class="deleteChange shadow-sm p-3 mb-5 xyz bg-body rounded-circle"><span class="text-gradient"><i class="ion-trash-a" title="Delete"></i></span></a>`;
          return {
            0: (skip += 1),
            1: yard.Name,
            2: yard.address.split(',').slice(-4, -1).join(',').trim(),
            3: yard.is_active == false
              ? `<a class="dstatusChange" href="/preferences/update-status?id=${yard._id}&status=true&" title="Mark Suspended" style="display: flex;align-items: center;justify-content: center;">
                     <label class="switch">
                     <input type="checkbox" checked>
                     <span class="slider round"></span>
                     </label> </a>`
              : `<a class="estatusChange" href="/preferences/update-status?id=${yard._id}&status=false&" title="Mark Active" style="display: flex;align-items: center;justify-content: center;"> 
                     <label class="switch ">
                     <input type="checkbox" >
                     <span class="slider round"></span>
                     </label></a>`,
            4: actions,
          };
        });
      }
      response.data = yards;
      return res.send(response);


    } catch (e) {
      console.log("eeee", e)
    }
  }
  async add(req, res) {
    try {
      console.log("+++++++++++++++++")
      return res.render("yards/add");
    } catch (e) {
      console.log("+++++++++++++++++")
      console.log("eeee", e)
    }

  }
  async saveAdd(req, res) {
    try {

      const { yard_name, yard_address, lat, lng } = req.body;
      const loc = {
        coordinates: [lng, lat]
      }

      let yard = new DumpYard({
        Name: yard_name,
        address: yard_address,
        loc
      });

      await yard.save();
      req.flash("success", req.__("Yard added success !"));
      return res.redirect("/yards");
    } catch (err) {
      console.log(err);
      return next(err);
    }
  }
  async view(req, res) {
    let preferences = await DriverPreferences.findOne({
      _id: req.params.id,
      isDeleted: false,
    })
      .lean();
    console.log(preferences);
    if (!preferences) {
      req.flash("error", req.__("Driver Preferences not exists"));
      return res.redirect("/preferences");
    }
    return res.render("preferences/view", {
      preferences,
      url: `${process.env.AWS_BASE_URL}`,
    });
  }
  async edit(req, res) {
    let _id = req.params.id;
    let preferences = await DriverPreferences.findOne({
      _id: _id,
    });
    if (!preferences) {
      req.flash('error', req.__('Driver Preferences is not exists'));
      return res.redirect('/preferences');
    }
    return res.render('preferences/edit', {
      preferences,
      _id,
    });
  }
  async updateData(req, res, next) {
    try {
      let form = new multiparty.Form();
      const preferences = await DriverPreferences.findOne({
        _id: req.params.id,
      });
      form.parse(req, async function (err, fields, files) {
        _.forOwn(fields, (field, key) => {
          preferences[key] = field[0];
        });
        console.log("--------files", files);
        if (files.image[0].originalFilename == "") {
        } else {
          let fileupload = files.image[0];
          let image = await uploadImage(fileupload, "preferences");
          preferences["image"] = image.key;
        }

        await preferences.save();
        req.flash('success', req.__('Driver Preferences successfully updated'));
        res.redirect("/preferences");
      });
    } catch (err) {
      console.log(err);
      return next(err);
    }
  }
  async updateStatus(req, res) {
    const { id, status } = req.query;
    let preferences = await DriverPreferences.findOne({
      _id: id,
    });
    if (!preferences) {
      req.flash('error', req.__('Driver Preferences is not exists'));
      return res.redirect('/preferences');
    }
    preferences.isSuspended = status;
    await preferences.save();
    req.flash('success', req.__('Driver Preferences is updated'));
    return res.redirect('/preferences');
  }
  async delete(req, res) {
    const preferences = await DriverPreferences.findOne({
      _id: req.params.id,
      isDeleted: false,
    });
    if (!preferences) {
      req.flash('error', req.__('Driver Preferences is not exists'));
      return res.redirect('/preferences');
    }
    preferences.isDeleted = true;
    await preferences.save();
    req.flash('success', req.__('Driver Preferences deleted successfully'));
    return res.redirect('/preferences');
  }
}
module.exports = new YardController();
