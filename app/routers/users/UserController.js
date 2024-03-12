const {
  models: { User },
} = require("./../../models");
const {uploadImage} = require("../../../lib/util");
const multiparty = require("multiparty");
const console = require("console");
class UserController {
  async listPage(req, res) {
    return res.render("users/list");
  }
  async list(req, res) {
    let reqData = req.query;
    let columnNo = parseInt(reqData.order[0].column);
    let sortOrder = reqData.order[0].dir === "desc" ? -1 : 1;
    let query = { 
      role:'User',
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
      query.$or = [{ name: searchValue }, { description: searchValue }];
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
    let users = await User.find(query)
      .sort(sortCond)
      .skip(skip)
      .limit(limit);
    if (users) {
      users = users.map((user) => {
        let actions = "";
        actions = `${actions}<a href="/users/edit/${user._id}" class="shadow-sm p-3 mb-5 xyz bg-body rounded-circle" ><span class="text-gradient" ><i class="ion-edit" title="Edit"></i></span></a>`;
        actions = `${actions}<a href="/users/view/${user._id}" class="shadow-sm p-3 mb-5 xyz bg-body rounded-circle"><span class="text-gradient"><i class="ion-eye" title="view"></i></span></a>`;
        actions = `${actions}<a href="/users/delete/${user._id}" class="deleteChange shadow-sm p-3 mb-5 xyz bg-body rounded-circle"><span class="text-gradient"><i class="ion-trash-a" title="Delete"></i></span></a>`;
        return {
          0: (skip += 1),
          1: user.name,
          2: user.email,
          3: user.isSuspended == false
              ? `<a class="dstatusChange" href="/users/update-status?id=${user._id}&status=true&" title="Mark Suspended" style="display: flex;align-items: center;justify-content: center;">
                   <label class="switch">
                   <input type="checkbox" checked>
                   <span class="slider round"></span>
                   </label> </a>`
              : `<a class="estatusChange" href="/users/update-status?id=${user._id}&status=false&" title="Mark Active" style="display: flex;align-items: center;justify-content: center;"> 
                   <label class="switch ">
                   <input type="checkbox" >
                   <span class="slider round"></span>
                   </label></a>`,
          4: actions,
        };
      });
    }
    response.data = users;
    return res.send(response);
  }
  async view(req,res) {
    let user = await User.findOne({
      _id: req.params.id,
      isDeleted: false,
    })
    .lean();
    console.log(user);
    if (!user) {
      req.flash("error", req.__("User not exists"));
      return res.redirect("/users");
    }
    return res.render("users/view", {
      user,
      url: `${process.env.AWS_BASE_URL}`,
    });
  }
  async edit(req, res) {
    let _id = req.params.id;
    let user = await User.findOne({
        _id: _id,
    });
    if (!user) {
        req.flash('error', req.__('User is not exists'));
        return res.redirect('/users');
    }
    return res.render('users/edit', {
        user,
        _id,
    });
}
  async updateData(req, res, next) {
    try {
      let form = new multiparty.Form();
      const user = await User.findOne({
        _id: req.params.id,
      });
      form.parse(req, async function (err, fields, files) {
        _.forOwn(fields, (field, key) => {
          user[key] = field[0];
        });
        if (files.image[0].originalFilename == "") {
        } else {
          let fileupload = files.image[0];
          let image = await uploadImage(fileupload, "user");
          user["image"] = image.key;
        }

        await user.save();
        req.flash('success', req.__('Users successfully updated'));
        res.redirect("/users");
      });
    } catch (err) {
      console.log(err);
      return next(err);
    }
  }

  async updateStatus(req, res) {
    const { id, status } = req.query;
    let user = await User.findOne({
        _id: id,
    });
    if (!user) {
        req.flash('error', req.__('User is not exists'));
        return res.redirect('/users');
    }
    user.isSuspended = status;
    await user.save();
    req.flash('success', req.__('User is updated'));
    return res.redirect('/users');
}
async delete(req, res) {
    const user = await User.findOne({
        _id: req.params.id,
        isDeleted: false,
    });
    if (!user) {
        req.flash('error', req.__('User is not exists'));
        return res.redirect('/users');
    }
    user.isDeleted = true;
    await user.save();
    req.flash('success', req.__('User deleted successfully'));
    return res.redirect('/users');
}
}
module.exports = new UserController();
