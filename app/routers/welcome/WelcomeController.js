const {
    models: { Welcome },
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
  class WelcomeController {
    async listPage(req, res) {
      return res.render("welcome/list");
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
      const count = await Welcome.countDocuments(query);
      response.draw = 0;
      if (reqData.draw) {
        response.draw = parseInt(reqData.draw) + 1;
      }
      response.recordsTotal = count;
      response.recordsFiltered = count;
      let skip = parseInt(reqData.start);
      let limit = parseInt(reqData.length);
      let welcome = await Welcome.find(query)
        .sort(sortCond)
        .skip(skip)
        .limit(limit);
      if (welcome) {
        welcome = welcome.map((welcome) => {
          let actions = "";
          actions = `${actions}<a href="/welcome/edit/${welcome._id}" class="shadow-sm p-3 mb-5 xyz bg-body rounded-circle" ><span class="text-gradient" ><i class="ion-edit" title="Edit"></i></span></a>`;
          actions = `${actions}<a href="/welcome/view/${welcome._id}" class="shadow-sm p-3 mb-5 xyz bg-body rounded-circle"><span class="text-gradient"><i class="ion-eye" title="view"></i></span></a>`;
          actions = `${actions}<a href="/welcome/delete/${welcome._id}" class="deleteChange shadow-sm p-3 mb-5 xyz bg-body rounded-circle"><span class="text-gradient"><i class="ion-trash-a" title="Delete"></i></span></a>`;
          return {
            0: (skip += 1),
            1: welcome.title,
            2: welcome.description.substr(0,30),
            3: welcome.isSuspended == false
                ? `<a class="dstatusChange" href="/welcome/update-status?id=${welcome._id}&status=true&" title="Mark Suspended" style="display: flex;align-items: center;justify-content: center;">
                     <label class="switch">
                     <input type="checkbox" checked>
                     <span class="slider round"></span>
                     </label> </a>`
                : `<a class="estatusChange" href="/welcome/update-status?id=${welcome._id}&status=false&" title="Mark Active" style="display: flex;align-items: center;justify-content: center;"> 
                     <label class="switch ">
                     <input type="checkbox" >
                     <span class="slider round"></span>
                     </label></a>`,
            4: actions,
          };
        });
      }
      response.data = welcome;
      return res.send(response);
    }
    async add(req, res) {
      return res.render("welcome/add");
    }
    async saveAdd(req, res) {
      try {
        let form = new multiparty.Form();
        let welcome = new Welcome();
        console.log("><><><><", req.body);
        form.parse(req, async function(err, fields, files) {
          _.forOwn(fields, (field, key) => {
            welcome[key] = field[0];
          });
          console.log("--------files", files);
          if (files.image[0].originalFilename == "") {
          } else {
            let fileupload = files.image[0];
            let image = await uploadImage(fileupload, "welcome");
            welcome["image"] = image.key;
          }
          await welcome.save();
          req.flash("success", req.__("Welcome added success !"));
          return res.redirect("/welcome");
        });
      } catch (err) {
        console.log(err);
        return next(err);
      }
    }
    async view(req,res) {
      let welcome = await Welcome.findOne({
        _id: req.params.id,
        isDeleted: false,
      })
      .lean();
      console.log(welcome);
      if (!welcome) {
        req.flash("error", req.__("Welcome not exists"));
        return res.redirect("/welcome");
      }
      return res.render("welcome/view", {
        welcome,
        url: `${process.env.AWS_BASE_URL}`,
      });
    }
    async edit(req, res) {
      let _id = req.params.id;
      let welcome = await Welcome.findOne({
          _id: _id,
      });
      if (!welcome) {
          req.flash('error', req.__('Welcome is not exists'));
          return res.redirect('/welcome');
      }
      return res.render('welcome/edit', {
          welcome,
          _id,
      });
  }
  async updateData(req, res, next) {
      try {
        let form = new multiparty.Form();
        const welcome = await Welcome.findOne({
              _id: req.params.id,
        });
        form.parse(req, async function(err, fields, files) {
          _.forOwn(fields, (field, key) => {
            welcome[key] = field[0];
          });
          console.log("--------files", files);
          if (files.image[0].originalFilename == "") {
          } else {
              let fileupload = files.image[0];
              let image = await uploadImage(fileupload, "welcome");
            welcome["image"] = image.key;
          }
  
          await welcome.save();
          req.flash('success', req.__('Welcome successfully updated'));
          res.redirect("/welcome");
        });
      } catch (err) {
        console.log(err);
        return next(err);
      }
    }
    async updateStatus(req, res) {
      const { id, status } = req.query;
      let welcome = await Welcome.findOne({
          _id: id,
      });
      if (!welcome) {
          req.flash('error', req.__('Welcome is not exists'));
          return res.redirect('/welcome');
      }
      welcome.isSuspended = status;
      await welcome.save();
      req.flash('success', req.__('Welcome is updated'));
      return res.redirect('/welcome');
  }
  async delete(req, res) {
      const welcome = await Welcome.findOne({
          _id: req.params.id,
          isDeleted: false,
      });
      if (!welcome) {
          req.flash('error', req.__('Welcome is not exists'));
          return res.redirect('/welcome');
      }
      welcome.isDeleted = true;
      await welcome.save();
      req.flash('success', req.__('Welcome deleted successfully'));
      return res.redirect('/welcome');
  }
  }
  module.exports = new WelcomeController();
  