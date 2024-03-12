const {
  models: { Request,User },
} = require("../../models");

class RequestController {
  async listPage(req, res) {
    return res.render("requests/list");
  }
  async list(req, res) {
    try {

      let reqData = req.query;
      let columnNo = parseInt(reqData.order[0].column);
      let sortOrder = reqData.order[0].dir === "desc" ? -1 : 1;
      let query = {
        //isDeleted: false,
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
        query.$or = [{ chargedAmount: searchValue }, { transaction_id: searchValue }];
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
      const count = await Request.countDocuments(query);
      response.draw = 0;
      if (reqData.draw) {
        response.draw = parseInt(reqData.draw) + 1;
      }
      response.recordsTotal = count;
      response.recordsFiltered = count;
      let skip = parseInt(reqData.start);
      let limit = parseInt(reqData.length);

      let requests = await Request.find(query)
        .populate({ path: "driverId", select: "name email", model: User })
        .populate({ path: "userId", select: "name email", model: User })
        .sort(sortCond).skip(skip).limit(limit).lean();

      if (requests) {
        requests = requests.map((request) => {
          let actions = "";
          actions = `${actions}<a href="/requests/edit/${request._id}" class="shadow-sm p-3 mb-5 xyz bg-body rounded-circle" ><span class="text-gradient" ><i class="ion-edit" title="Edit"></i></span></a>`;
          actions = `${actions}<a href="/requests/view/${request._id}" class="shadow-sm p-3 mb-5 xyz bg-body rounded-circle"><span class="text-gradient"><i class="ion-eye" title="view"></i></span></a>`;
          actions = `${actions}<a href="/requests/delete/${request._id}" class="deleteChange shadow-sm p-3 mb-5 xyz bg-body rounded-circle"><span class="text-gradient"><i class="ion-trash-a" title="Delete"></i></span></a>`;
          return {
            0: (skip += 1),
            1: request.chargedAmount,
            2: request.driverId.name,
            3: request.driverId.email,
            4: request.userId.name,
            5: request.userId.email,
            6: request.status,
            7: request.isSuspended == false
              ? `<a class="dstatusChange" href="/vehicletype/update-status?id=${request._id}&status=true&" title="Mark Suspended" style="display: flex;align-items: center;justify-content: center;">
                       <label class="switch">
                       <input type="checkbox" checked>
                       <span class="slider round"></span>
                       </label> </a>`
              : `<a class="estatusChange" href="/vehicletype/update-status?id=${request._id}&status=false&" title="Mark Active" style="display: flex;align-items: center;justify-content: center;"> 
                       <label class="switch ">
                       <input type="checkbox" >
                       <span class="slider round"></span>
                       </label></a>`,
            8: actions,
          };
        });
      }
      response.data = info;
      return res.send(response);
    } catch (e) {
      console.log(e);
    }

  }

  async view(req, res) {

    let request = await Request.findOne({ _id: req.params.id, isDeleted: false }).lean();
    if (!request) {
      req.flash("error", req.__("Request does not exist"));
      return res.redirect("/requests");
    }
    return res.render("requests/view", { vehicleType, url: `${process.env.AWS_BASE_URL}` });

  }

  async updateStatus(req, res) {

    const { id, status } = req.query;
    let request = await Request.findOne({ _id: id });
    if (!request) {
      req.flash('error', req.__('Request does not exist'));
      return res.redirect('/requests');
    }

    request.isSuspended = status;
    await request.save();
    req.flash('success', req.__('Request has been updated'));
    return res.redirect('/requests');

  }
  async delete(req, res) {

    const request = await Request.findOne({ _id: req.params.id, isDeleted: false });
    if (!request) {
      req.flash('error', req.__('Request does not exist'));
      return res.redirect('/requests');
    }
    request.isDeleted = true;
    await request.save();
    req.flash('success', req.__('Request info deleted successfully'));
    return res.redirect('/requests');

  }
}
module.exports = new RequestController();
