const {
  models: { User, Request, Review, DumpYard, UserRequest, TrainerSession, Notification, Card, Payment, Customer, Division, Group, JoinGroup, Bank, Chat, Filter, Sport }
} = require('../../../../app/models');
const mailer = require('../../../../lib/mailer');

const sms = require('../../../../lib/sms');
const { uploadImageAPI } = require('../../../../lib/util');
var _ = require('lodash');
const jwtToken = require('jsonwebtoken');
const objectId = require('../../../../lib/util/index');
const multer = require('multer');

var FCM = require('fcm-node');
var serverKey = process.env.SERVER_KEY
var fcm = new FCM(serverKey);
var Secret_Key = 'sk_test_51LO3SWA8lBaPRpoKN4rduTfTSfOttcO9pCW2X5KbQuSfbsIsKL11D4Bi4odwCypeBk1ml1SyQCUTF8OcYFV79DjR00YG4TUWos'
const stripe = require('stripe')(Secret_Key)
var SendGridKey = process.env.SENDGRID_API_KEY;
var apiEnv = process.env.NODE_ENV;
var moment = require('moment-timezone');
var request = require('request');
const rp = require('request-promise');
const path = require('path');
const apn = require("apn");
var gcm = require('node-gcm');
const async = require('async');
var CronJob = require('cron').CronJob;
const fs = require('fs');
const {
  promisify
} = require('util');
const unlinkAsync = promisify(fs.unlink);

const AccessToken = require('twilio').jwt.AccessToken;
const VoiceGrant = AccessToken.VoiceGrant;
const VideoGrant = AccessToken.VideoGrant;
const VoiceResponse = require('twilio').twiml.VoiceResponse;



class RequestController {

  async createRequest(req, res, next) {
    try {
      const { yardId, pickUpLoc, dropLoc, chargedAmount } = req.body;

      let _request = new Request({
        yardId,
        pickUpLoc,
        dropLoc,
        chargedAmount,
        userId: req._id,
        status: 0
      });

      const request = await _request.save();
      return res.success({ request }, "Request added Successfully !");

    } catch (err) {
      console.log(err);
      return next(err);
    }
  }

  async cancelRequest(req, res, next) {
    try {

      const { requestId } = req.body;
      let request = await UserRequest.findOne({ requestId, driverId: req._id });
      if (request) {
        request.status = 3;
      } else {
        
        request.requestId = requestId;
        request.driverId = req._id;
        request.status = 3;
        await request.save();

      }

      return res.success({ request }, "Request cancelled Successfully !");


    } catch (err) {
      console.log(err);
      return next(err);
    }
  }

  async acceptRequest(req, res, next) {
    let session;
    try {
      const { requestId, driverId } = req.body;
      session = await mongoose.startSession();
      session.startTransaction();

      const request = await Request.findOne({ _id: requestId, status: 0 }).session(session);

      if (!request) {
        return res.status(400).json({ error: 'Invalid request or request is already accepted' });
      }

      request.driverId = driverId;
      request.status = 1;
      await request.save({ session });
      await session.commitTransaction();
      res.status(200).json({ message: 'Request accepted successfully' });
    } catch (error) {
      console.error(error);
      if (session) {
        await session.abortTransaction();
      }
      res.status(500).json({ error: 'Internal Server Error' });
    } finally {
      if (session) {
        session.endSession();
      }
    }
  }

  async declineRequest(req, res, next) {
    try {

      const { requestId, driverId } = req.body;

      let declineRequest = new DeclineRequest({
        requestId,
        driverId
      });

      await declineRequest.save();
      res.status(200).json({ message: 'Request accepted successfully' });

    } catch (err) {
      console.log(err);
      return next(err);
    }
  }

  async createPayment(req, res, next) {

    try {


    } catch (err) {
      console.log(err);
      return next(err);
    }
  }

  async confirmPayment(req, res, next) {

    try {


    } catch (err) {
      console.log(err);
      return next(err);
    }
  }

  async requestList(req, res, next) {

    try {

      const requests = await Request.find({ userId: req._id }).lean();
      return res.success({ requests }, "Requests fetched  Successfully !");

    } catch (err) {
      console.log(err);
      return next(err);
    }
  }

  async nearestYards(req, res, next) {
    try {
      let { lng, lat } = req.query;
      console.log("________________+++++++++++++")
      let loc = [];
      const { coordinates } = req.user.loc;

      if (!lng && !lat) {
        loc = coordinates;
      } else {
        loc = [Number(lng), Number(lat)]
      }

      const milesToRadian = function (miles) {
        const earthRadiusInMiles = 3959;
        return miles / earthRadiusInMiles;
      };

      const searchRadiusMiles = 100;
      let query = {
        is_active: true,
        "loc.coordinates": {
          $geoWithin: {
            $centerSphere: [loc, milesToRadian(searchRadiusMiles)],
          },
        },
      };
      console.log(JSON.stringify(query))

      const yards = await DumpYard.find(query).lean();
      return res.status(200).json({ data: { yards }, message: "Yards fetched successfully!" });
    } catch (err) {
      console.log(err);
      return next(err);
    }
  }



  async Filter(req, res, next) {
    try {
      let filter = await Filter.findOne({ userId: req._id });
      if (filter) return res.success({ filter }, "Successfully fetched filter!")
      else return res.warn({}, "No filter saved!")

    } catch (err) {
      console.log(err);
      return next(err);
    }
  }
  async ResetFilter(req, res, next) {
    try {
      await Filter.findOneAndDelete({ userId: req._id });
      return res.success({ filter }, "Successfully deleted filter!");
    } catch (err) {
      console.log(err);
      return next(err);
    }
  }
  async searchTrainer(req, res, next) {

    let _id = req.user._id;
    try {
      let miles = 1000;
      let user = await User.findOne({ _id });
      if (user) {
        // let userCoordinates = user.loc.coordinates;
        // var milesToRadian = function (miles) {
        //   var earthRadiusInMiles = 3959;
        //   return miles / earthRadiusInMiles;
        // };
        let query = {
          name: { $ne: null },
          email: { $ne: null },
          isSuspended: false,
          role: "Trainer",
          // "loc.coordinates": {
          //   $geoWithin: {
          //     $centerSphere: [userCoordinates, milesToRadian(miles)],
          //   },
          // },
        };
        let query_ = JSON.parse(JSON.stringify(query));
        query.$and = [];
        if (req.query.search) {
          const searchValue = new RegExp(
            req.query.search
              .split(' ')
              .filter(val => val)
              .map(value => value.replace(/[-[\]{}()*+?.,\\^$|#\s]/g, '\\$&'))
              .join('|'),
            'i'
          );
          query.$and.push({ name: searchValue });
        }

        if (req.query.city) query.$and.push({ city: req.query.city });
        if (req.query.zip) query.$and.push({ zip: req.query.zip });
        if (req.query.state) query.$and.push({ state: req.query.state });
        if (req.query.hourly) {
          let hourly = parseInt(req.query.hourly)
          query.$and.push({ hourly_price: { $lte: hourly } });
        }

        if (req.query.rating) query.$and.push({ rating: { $gte: req.query.rating } });
        if (req.query.miles) miles = req.query.miles;


        if (query.$and.length > 0) { } else {
          query = query_;
        }

        let users = await User.find(query).populate({ path: 'division', select: 'name -_id', model: Division }).select('name avatar division');
        res.success({ trainer_list: users }, req.__(`Nearby Trainers search result`));

      } else {
        res.warn({ trainer_list: [] }, req.__("You don't have access !"));
      }
    } catch (err) {
      console.log(err);
      return next(err);
    }
  }
  async createSession(req, res, next) {
    let { timeZone, name } = req.body;

    let date = moment(
      `${req.body.scheduleDate} ${req.body.starting_time}`,
      'YYYY-MM-DD HH:mm:ss'
    ).tz(timeZone).format();
    let offset = date.substring(19);

    let scheduleDate_ = moment(
      `${req.body.scheduleDate} ${req.body.starting_time}`,
      'YYYY-MM-DD HH:mm:ss'
    ).format();

    let endgDate_ = moment(
      `${req.body.scheduleDate} ${req.body.ending_time}`,
      'YYYY-MM-DD HH:mm:ss'
    ).format();

    let offset_ = scheduleDate_.substring(19);

    let scheduleDate = scheduleDate_.replace(offset_, offset);
    let endgDate = endgDate_.replace(offset_, offset);
    let ENDDATE_ = moment(endgDate, 'YYYY-MM-DD HH:mm:ss').add(1, 'hours').format();
    let SCHEDULEDATE_ = moment(scheduleDate, 'YYYY-MM-DD HH:mm:ss').subtract(1, 'hours').format();
    let ENDDATE = ENDDATE_.replace(offset_, offset);
    let SCHEDULEDATE = SCHEDULEDATE_.replace(offset_, offset);



    let user = await User.findOne({ _id: req.user._id });


    if (user?.role === 'Trainer') {

      let sessions = await TrainerSession.find({ userId: user._id, $or: [{ scheduleDate: { $gte: SCHEDULEDATE, $lt: ENDDATE } }, { endgDate: { $gt: SCHEDULEDATE, $lte: ENDDATE } }], status: true });
      if (sessions.length > 0) {
        return res.warn(
          {
            language: req.headers["accept-language"],
          },
          req.__("Session already exist on this scheduled time or there must be minimum one hour gap between two sessions !")
        );
      } else {

        let session = new TrainerSession();
        session.userId = user._id;
        session.name = name;
        session.scheduleDate = scheduleDate;
        session.endgDate = endgDate;
        let SESSION = await session.save();
        let endDate = SESSION.endgDate;

        var DATE = new Date(endDate);


        var d = DATE.getDate()
        var m = DATE.getMonth();
        var h = DATE.getHours();
        var mi = DATE.getMinutes();



        var job = new CronJob(
          `0 ${mi} ${h} ${d} ${m} *`,
          async function () {

            await TrainerSession.findOneAndUpdate({ _id: SESSION._id, editCount: 0 }, { status: false })


          },
          null,
          true,
          // timeZone
        );

        job.start();

        return res.success(
          {
            language: req.headers["accept-language"],
            session,
          },
          req.__("Session Created successfully !")
        );
      }

    }
    else return res.warn({ language: req.headers["accept-language"], }, req.__("Unauthorized to create session !"));


  }

  async editSession(req, res, next) {
    let { timeZone, name, sessionId } = req.body;

    let date = moment(
      `${req.body.scheduleDate} ${req.body.starting_time}`,
      'YYYY-MM-DD HH:mm:ss'
    ).tz(timeZone).format();
    let offset = date.substring(19);

    let scheduleDate_ = moment(
      `${req.body.scheduleDate} ${req.body.starting_time}`,
      'YYYY-MM-DD HH:mm:ss'
    ).format();

    let endgDate_ = moment(
      `${req.body.scheduleDate} ${req.body.ending_time}`,
      'YYYY-MM-DD HH:mm:ss'
    ).format();

    let offset_ = scheduleDate_.substring(19);
    let scheduleDate = scheduleDate_.replace(offset_, offset);
    let endgDate = endgDate_.replace(offset_, offset);

    let user = await User.findOne({ _id: req.user._id });


    if (user?.role === 'Trainer') {

      let ENDDATE_ = moment(endgDate, 'YYYY-MM-DD HH:mm:ss').add(1, 'hours').format();
      let SCHEDULEDATE_ = moment(scheduleDate, 'YYYY-MM-DD HH:mm:ss').subtract(1, 'hours').format();
      let ENDDATE = ENDDATE_.replace(offset_, offset);
      let SCHEDULEDATE = SCHEDULEDATE_.replace(offset_, offset);


      let sessions = await TrainerSession.find({ userId: user._id, $or: [{ scheduleDate: { $gte: SCHEDULEDATE, $lt: ENDDATE } }, { endgDate: { $gt: SCHEDULEDATE, $lte: ENDDATE } }], _id: { $ne: sessionId }, status: true });
      if (sessions.length > 0) {
        return res.warn(
          {
            language: req.headers["accept-language"],
          },
          req.__("Session already exist on this scheduled time !")
        );
      } else {

        let session = await TrainerSession.findOne({ _id: sessionId })
        let r = session.editCount;
        session.userId = user._id;
        session.name = name;
        session.scheduleDate = scheduleDate;
        session.endgDate = endgDate;
        session.editCount = session.editCount + 1;
        await session.save();

        let endDate = session.endgDate;

        var DATE = new Date(endDate);


        var d = DATE.getDate()
        var m = DATE.getMonth();
        var h = DATE.getHours();
        var mi = DATE.getMinutes();



        var job = new CronJob(
          `0 ${mi} ${h} ${d} ${m} *`,
          async function () {

            await TrainerSession.findOneAndUpdate({ _id: sessionId, editCount: (r + 1) }, { status: false });


          },
          null,
          true,
          // timeZone
        );

        job.start();

        return res.success(
          {
            language: req.headers["accept-language"],
            session,
          },
          req.__("Session edited  successfully !")
        );
      }

    } else {
      return res.warn(
        {
          language: req.headers["accept-language"],
        },
        req.__("Unauthorized to create session !")
      );
    }

  }
  async UpcomingSession(req, res, next) {
    try {

      let timeZone = req.query.timeZone;
      let date__ = moment(
        `${req.query.date}`,
        'YYYY-MM-DD HH:mm:ss'
      ).tz(timeZone).format();
      let offset = date__.substring(19);
      let date_;
      date_ = moment(`${req.query.date}`, 'YYYY-MM-DD HH:mm:ss').format();
      let offset_ = date_.substring(19);
      let _date_ = date_.replace(offset_, offset);
      let MONTH = new Date(_date_).getMonth() + 1;

      let QUERY = {};
      if (req.role === 'Trainer') {
        QUERY = {
          userId: req._id, scheduleDate: { $gte: _date_ }, status: true
        }
      } else {
        QUERY = {
          scheduleDate: { $gte: _date_ }, status: true
        }
      }

      let sessions = await TrainerSession.aggregate([
        {
          $match: QUERY
        },
        // {
        //   $addFields:
        //   {
        //     month:
        //     {
        //       $function:
        //       {
        //         body: function (scheduleDate) {

        //           let month = new Date(scheduleDate).getMonth() + 1;
        //           return month;
        //         },
        //         args: ["$scheduleDate"],
        //         lang: "js"
        //       }
        //     }
        //   }
        // },
        // {
        //   $addFields:
        //   {
        //     DAY:
        //     {
        //       $function:
        //       {
        //         body: function (scheduleDate) {

        //           let DAY = new Date(scheduleDate).getDate();
        //           return DAY;
        //         },
        //         args: ["$scheduleDate"],
        //         lang: "js"
        //       }
        //     }
        //   }
        // },
        // {
        //   $match: {
        //     month: { $eq: MONTH }
        //   }
        // }
      ]);

      const DAY = function (DATE) {
        let date = new Date(DATE);
        var d = new Date(date.getFullYear(), date.getMonth() + 1, 0);
        return d.getDate();
      }



      let DAYS = [];
      if (sessions.length > 0) {
        DAYS = sessions.map(r => {
          r.scheduleDate = r.scheduleDate.replace(offset, offset_);
          return moment(`${r.scheduleDate}`).format('YYYY-MM-DD');
        });
        DAYS = [... new Set(DAYS)];
        DAYS = DAYS.sort((a, b) => {
          return (a - b);
        });
      }

      return res.success({ DAYS }, 'Upcoming sessions days list');
    } catch (err) {
      console.log(err)
      return next(err);
    }
  }
  async sessionList(req, res, next) {
    try {
      let lat1 = req.user.loc.coordinates[1];
      let lon1 = req.user.loc.coordinates[0];
      let timeZone = req.query.timeZone;
      let date__ = moment(
        `${req.query.date}`,
        'YYYY-MM-DD HH:mm:ss'
      ).tz(timeZone).format();
      let offset = date__.substring(19);

      let date_;

      date_ = moment(`${req.query.date}`, 'YYYY-MM-DD HH:mm:ss').format();
      let nextDate = moment(`${req.query.date}`, 'YYYY-MM-DD HH:mm:ss').add(1, 'days').format();
      let offset_ = nextDate.substring(19);

      let _date_ = date_.replace(offset_, offset);
      let nextDate_ = nextDate.replace(offset_, offset);

      let sessions = await TrainerSession.aggregate([
        {
          $match: {
            scheduleDate: { $gte: _date_, $lt: nextDate_ }, status: true
          }
        },
        {
          $group: {
            _id: "$userId"
          }
        },
        {
          "$lookup": {
            "from": "users",
            "localField": "_id",
            "foreignField": "_id",
            "as": "user"
          }
        },
        {
          $unwind: {
            path: "$user"
          }
        },
        {
          $addFields:
          {
            distance:
            {
              $function:
              {
                body: function (lat1, lon1, loc) {

                  let lat2 = loc.coordinates[1];
                  let lon2 = loc.coordinates[0];

                  let dLat = (lat2 - lat1) * Math.PI / 180.0;
                  let dLon = (lon2 - lon1) * Math.PI / 180.0;

                  // convert to radiansa
                  lat1 = (lat1) * Math.PI / 180.0;
                  lat2 = (lat2) * Math.PI / 180.0;

                  // apply formulae
                  let a = Math.pow(Math.sin(dLat / 2), 2) +
                    Math.pow(Math.sin(dLon / 2), 2) *
                    Math.cos(lat1) *
                    Math.cos(lat2);
                  let rad = 6371;
                  let c = 2 * Math.asin(Math.sqrt(a));
                  return rad * c;
                },
                args: [lat1, lon1, "$user.loc"],
                lang: "js"
              }
            }
          }
        },
        {
          $project: {
            _id: 0,
            name: "$user.name",
            avatar: "$user.avatar",
            hourly_price: "$user.hourly_price",
            userId: "$user._id",
            distance: "$distance"
          }
        },
        {
          "$lookup": {
            "from": "trainersessions",
            "let": { "userId": "$userId" },
            "pipeline": [
              {
                "$match": {
                  $and: [
                    { "$expr": { "$eq": ["$userId", '$$userId'] } },
                    { "$expr": { "$eq": ["$status", true] } },
                    { "$expr": { "$gte": ["$scheduleDate", _date_] } },
                    { "$expr": { "$lt": ["$scheduleDate", nextDate_] } }
                  ]
                }
              },
              {
                "$sort": {
                  "scheduleDate": 1
                }
              }
            ],
            "as": "session"
          }
        },
        {
          $sort: {
            "distance": 1, "session.scheduleDate": 1
          }
        }
      ]);
      return res.success({ sessions }, 'Sessions list fetched successfully')
    } catch (err) {
      console.log(err)
      return next(err);
    }
  }
  async TrainerSessionList(req, res, next) {
    try {
      let timeZone = req.query.timeZone;
      let date__ = moment(
        `${req.query.date}`,
        'YYYY-MM-DD HH:mm:ss'
      ).tz(timeZone).format();
      let offset = date__.substring(19);


      let date_ = moment(`${req.query.date}`, 'YYYY-MM-DD HH:mm:ss').format();
      let nextDate = moment(`${req.query.date}`, 'YYYY-MM-DD HH:mm:ss').add(1, 'days').format();
      let offset_ = date_.substring(19);

      let _date_ = date_.replace(offset_, offset);
      let nextDate_ = nextDate.replace(offset_, offset);


      let sessions = await TrainerSession.aggregate([
        {
          $match: {
            scheduleDate: { $gte: _date_, $lt: nextDate_ },
            userId: req._id, status: true
          }
        },
        {
          $group: {
            _id: "$userId"
          }
        },
        {
          "$lookup": {
            "from": "users",
            "localField": "_id",
            "foreignField": "_id",
            "as": "user"
          }
        },
        {
          $unwind: {
            path: "$user"
          }
        },
        {
          $project: {
            _id: 0,
            name: "$user.name",
            avatar: "$user.avatar",
            hourly_price: "$user.hourly_price",
            userId: "$user._id"
          }
        },
        {
          "$lookup": {
            "from": "trainersessions",
            "let": { "userId": "$userId" },
            "pipeline": [
              {
                "$match": {
                  $and: [
                    { "$expr": { "$eq": ["$userId", '$$userId'] } },
                    { "$expr": { "$eq": ["$status", true] } },
                    { "$expr": { "$gte": ["$scheduleDate", _date_] } },
                    { "$expr": { "$lt": ["$scheduleDate", nextDate_] } }
                  ]
                }
              },
              {
                "$sort": {
                  "scheduleDate": 1
                }
              }
            ],
            "as": "sessions"
          },
        },
        {
          $sort: {
            "session.created": 1
          }
        }
      ]);

      return res.success({ sessions }, "Trainer's sessions list")
    } catch (err) {
      return next(err);
    }
  }
  async workWithTrainer(req, res, next) {
    try {
      let trainerId = ObjectId(req.query.trainerId);
      var TrainerSessions;
      if (req.query.date) {
        let timeZone = req.query.timeZone;
        let date = moment(
          `${req.query.date}`,
          'YYYY-MM-DD HH:mm:ss'
        ).tz(timeZone).format();
        let offset = date.substring(19);

        let date_;

        date_ = moment(`${req.query.date}`, 'YYYY-MM-DD HH:mm:ss').format();

        let nextDate = moment(`${req.query.date}`, 'YYYY-MM-DD HH:mm:ss').add(1, 'days').format();
        let offset_ = nextDate.substring(19);


        let _date_ = date_.replace(offset_, offset);
        let nextDate_ = nextDate.replace(offset_, offset);



        TrainerSessions = await User.aggregate([
          {
            $match: {
              _id: trainerId
            }
          },
          {
            "$lookup": {
              "from": "divisions",
              "localField": "division",
              "foreignField": "_id",
              "as": "Division"
            }
          },
          {
            "$lookup": {
              "from": "sports",
              "let": { "sportIds": "$sport" },
              "pipeline": [
                {
                  "$match": {
                    "$expr": { "$in": ["$_id", "$$sportIds"] }
                  }
                },
                {
                  "$project": {
                    name: 1
                  }
                }
              ],
              "as": "Sport"
            }
          },
          {
            $unwind: "$Sport"
          },
          {
            $unwind: "$Division"
          },
          {
            $project: {
              name: 1,
              address: { $concat: ["$zip", " , ", "$city", " , ", "$state"] },
              "loc.lat": { $arrayElemAt: ["$loc.coordinates", 1] },
              "loc.lng": { $arrayElemAt: ["$loc.coordinates", 0] },
              avatar: 1,
              "DIVISION": { $concat: ["$school", " | ", "$Sport.name", " | ", "$Division.division"] },
              hourly_price: 1,
              _id: 1
            }
          },
          {
            "$lookup": {
              "from": "trainersessions",
              "let": { "userId": "$_id" },
              "pipeline": [
                {
                  "$match": {
                    $and: [
                      { "$expr": { "$eq": ["$userId", '$$userId'] } },
                      //   { "$expr": { "$eq": ["$status", true] } },
                      { "$expr": { "$gte": ["$scheduleDate", _date_] } },
                      { "$expr": { "$lt": ["$scheduleDate", nextDate_] } }
                    ]
                  }
                },
                {
                  "$lookup": {
                    "from": "bookings",
                    "localField": "_id",
                    "foreignField": "sessionId",
                    "as": "sessions"
                  }
                },
                {
                  $project: {
                    status: 1,
                    userId: 1,
                    name: 1,
                    scheduleDate: 1,
                    endgDate: 1,
                    created: 1,
                    updated: 1,
                    booked: {
                      $cond: [{ $in: [true, "$sessions.status"] }, true, false]
                    }
                  }
                },
                {
                  "$sort": {
                    "scheduleDate": 1
                  }
                }
              ],
              "as": "session"
            }
          },
        ])

      } else {
        TrainerSessions = await User.aggregate([
          {
            $match: {
              _id: trainerId
            }
          },
          {
            "$lookup": {
              "from": "divisions",
              "localField": "division",
              "foreignField": "_id",
              "as": "Division"
            }
          },
          {
            "$lookup": {
              "from": "sports",
              "let": { "sportIds": "$sport" },
              "pipeline": [
                {
                  "$match": {
                    "$expr": { "$in": ["$_id", "$$sportIds"] }
                  }
                },
                {
                  "$project": {
                    name: 1
                  }
                }
              ],
              "as": "Sport"
            }
          },
          {
            $unwind: "$Sport"
          },
          {
            $unwind: "$Division"
          },
          {
            $project: {
              name: 1,
              avatar: 1,
              "DIVISION": { $concat: ["$school", " | ", "$Sport.name", " | ", "$Division.division"] },
              hourly_price: 1,
              _id: 1
            }
          },
          {
            "$lookup": {
              "from": "trainersessions",
              "localField": "_id",
              "foreignField": "userId",
              "as": "sessions"
            }
          },
          {
            $unwind: "$sessions"
          },
          {
            $sort: {
              "sessions.scheduleDate": 1
            }
          }
        ])
      }

      return res.success(
        {
          TrainerSessions
        },
        req.__("All notifications fetched successfully")
      );
    } catch (err) {
      return next(err);
    }
  }
  async Book(req, res, next) {
    let { amount, tip, trainerId, sessionId, timeZone, stripeToken, cardId, lat, lng, address } = req.body;
    try {

      if (req.role == 'College-Athlete' || req.role == 'Junior-Athlete') {
        let session = await TrainerSession.findOne({ _id: sessionId });
        let book_ = await Booking.findOne({ sessionId, status: true });

        if (book_) {

          if (book_.athleteId.equals(req._id)) return res.warn({}, "You already booked this session !")
          else return res.warn({}, "Someone already booked this session!")

        } else {
          let date = session.scheduleDate;
          let endDate = session.endgDate;
          let mybookings = await Booking.aggregate([{
            $match: {
              athleteId: req._id,
              status: true
            }
          },
          {
            "$lookup": {
              "from": "trainersessions",
              "let": { "s_id": "$sessionId" },
              "pipeline": [
                {
                  "$match": {
                    "$expr": { "$eq": ["$_id", '$$s_id'] },


                    $or: [
                      { $and: [{ "$expr": { "$gte": ["$scheduleDate", date] } }, { "$expr": { "$lt": ["$scheduleDate", endDate] } }] },
                      { $and: [{ "$expr": { "$gte": ["$endgDate", date] } }, { "$expr": { "$lt": ["$scheduleDate", endDate] } }] }
                    ],
                  }
                }
              ],
              "as": "session"
            }
          },
          {
            $project: {
              session: "$session",
              _id: 0
            }
          },
          {
            $unwind: {
              path: "$session"
            }
          }
          ]);


          if (mybookings.length > 0 && mybookings[0].session) {
            return res.warn({}, "You have already bookings with in this timestamp")
          } else {

            let customerData = await Customer.findOne({ userId: req._id });
            if (customerData) {

              stripe.customers.createSource(
                customerData.customerId,
                { source: stripeToken }
              ).then(card => {
                let AMOUNT = (req.body.amount) * 100;

                return stripe.charges.create({
                  amount: AMOUNT,
                  description: `Booking of session`,
                  currency: 'USD',
                  customer: card.customer
                })
              })
                .then(async (charge) => {

                  let card = await Card.findOne({ _id: cardId });
                  card.default = true;
                  await card.save();
                  let coordinates = [0, 0];
                  if (lat && lng) coordinates = [lat, lng];

                  let booking = new Booking();
                  booking.athleteId = req._id;
                  booking.trainerId = trainerId;
                  booking.sessionId = sessionId;
                  booking.amount = amount;
                  booking.tip = tip;
                  booking.loc.coordinates = coordinates;
                  booking.address = address;
                  let booking_ = await booking.save();


                  let payment = new Payment();
                  payment.userId = req._id;
                  payment.customerId = charge.customer;
                  payment.chargeId = charge.id;
                  payment.bookingId = booking_._id;
                  await payment.save();

                  let notification = new Notification();
                  notification.userId = trainerId;
                  notification.sessionId = sessionId;
                  notification.type = 'SESSION_BOOK';
                  notification.msg = `Your session has been booked by ${req.user.name}.`;
                  await notification.save();

                  let trainerToken = await User.findOne({ _id: trainerId }).lean();
                  let TOKEN;
                  if (trainerToken && trainerToken.isNotification) {
                    TOKEN = trainerToken.deviceToken;

                    let msg = {
                      "to": TOKEN,

                      "notification": {
                        "sound": "default",
                        "title": "Session booked",
                        "type": "SESSION_BOOK",
                        "body": `Your session has been booked by ${req.user.name}.`,
                      }

                    }

                    fcm.send(msg, function (err, response) {
                      if (err) {
                        console.log('Something has gone wrong!' + err);
                      } else {
                        console.log('Successfully sent with response: ', response);
                      }
                    });

                  }

                  let scheduleDate = session.scheduleDate;
                  var _date = new Date(new Date(scheduleDate).setHours((new Date(scheduleDate)).getHours() - 1));

                  var d = _date.getDate()
                  var m = _date.getMonth();
                  var h = _date.getHours();
                  var mi = _date.getMinutes();


                  var job = new CronJob(
                    `0 ${mi} ${h} ${d} ${m} *`,
                    async function () {


                      let user = await User.findOne({ _id: req._id });
                      let user_ = await User.findOne({ _id: trainerId });

                      let notification = new Notification();
                      notification.userId = req._id;
                      notification.sessionId = sessionId;
                      notification.type = 'SESSION_START';
                      notification.msg = `Your session with ${user_.name} starts in 1 hour.`;
                      await notification.save();

                      let notification_ = new Notification();
                      notification_.userId = trainerId;
                      notification_.sessionId = sessionId;
                      notification_.type = 'SESSION_START';
                      notification_.msg = `Your session with ${user.name} starts in 1 hour.`;
                      await notification_.save();

                      let token = [];

                      if (user?.isNotification) {
                        token.push(user.deviceToken);
                      }

                      if (user_?.isNotification) {
                        token.push(user_.deviceToken);
                      }


                      let msg = {
                        "registration_ids": token,

                        "notification": {
                          "sound": "default",
                          "title": "Session about to start",
                          "type": "SESSION_START",
                          "body": `Your session with ${user.name} starts in 1 hour.`,

                        }

                      }

                      fcm.send(msg, function (err, response) {
                        if (err) {
                          console.log('Something has gone wrong!' + err);
                        } else {
                          console.log('Successfully sent with response: ', response);
                        }
                      });

                    },
                    null,
                    true,
                    // timeZone
                  );
                  job.start();



                  let endDate = session.endgDate;
                  var _date_ = new Date(endDate);

                  var d_ = _date_.getDate()
                  var m_ = _date_.getMonth();
                  var h_ = _date_.getHours();
                  var mi_ = _date_.getMinutes();



                  var job_ = new CronJob(
                    `0 ${mi_} ${h_} ${d_} ${m_} *`,
                    async function () {

                      let { _Mi, _H, _AMPM, _D, _M, _Y } = _DDATE(session.scheduleDate);
                      let booking__ = await Booking.findOne({ sessionId, status: true });
                      if (booking__ && !(booking__.start)) {
                        booking__.status = false;
                        await booking__.save();




                        let notification = new Notification();
                        notification.userId = req._id;
                        notification.sessionId = sessionId;
                        notification.type = 'CANCEL';
                        notification.msg = `Has canceled your training session on ${_D}th ${_M} ${_Y} at ${_H}:${_Mi} ${_AMPM}.`;
                        await notification.save();

                        let notification_ = new Notification();
                        notification_.userId = trainerId;
                        notification_.sessionId = sessionId;
                        notification_.type = 'CANCEL';
                        notification_.msg = `Has canceled your training session on ${_D}th ${_M} ${_Y} at ${_H}:${_Mi} ${_AMPM}.`;
                        await notification_.save();

                        let user = await User.findOne({ _id: req._id });
                        let user_ = await User.findOne({ _id: trainerId });
                        let token = [];

                        if (user?.isNotification) {
                          token.push(user.deviceToken);
                        }

                        if (user_?.isNotification) {
                          token.push(user_.deviceToken);
                        }
                        let msg = {
                          "registration_ids": token,

                          "notification": {
                            "sound": "default",
                            "title": "Session cancelled",
                            "type": "CANCEL",
                            "body": `Has canceled your training session on ${_D}th ${_M} ${_Y} at ${_H}:${_Mi} ${_AMPM}.`,

                          }

                        }
                        fcm.send(msg, function (err, response) {
                          if (err) {
                            console.log('Something has gone wrong!' + err);
                          } else {
                            console.log('Successfully sent with response: ', response);
                          }
                        });
                      } else { }
                    },
                    null,
                    true,
                    // timeZone
                  );
                  job_.start();
                  return res.success({ booking: booking_, charge }, 'Booking completed successfully')// If no error occurs
                })
                .catch((err) => {
                  return res.warn({}, 'Payment error');

                });
            } else {
              stripe.customers.create({
                email: req.user.email,
                source: req.body.stripeToken,
                name: req.user.name,
                address: {
                  postal_code: req.user.zip,
                  city: req.user.zip,
                  state: req.user.state
                }
              })
                .then(async (customer) => {

                  let AMOUNT = (req.body.amount) * 100;
                  let cust = new Customer();
                  cust.userId = req._id;
                  cust.customerId = customer.id;
                  await cust.save();
                  return stripe.charges.create({
                    amount: AMOUNT,
                    description: `Booking of session`,
                    currency: 'USD',
                    customer: customer.id
                  });
                })
                .then(async (charge) => {
                  let card = await Card.findOne({ _id: cardId });
                  card.default = true;
                  await card.save();

                  let coordinates = [0, 0];
                  if (lat && lng) {
                    coordinates = [lat, lng];
                  }

                  let booking = new Booking();
                  booking.athleteId = req._id;
                  booking.trainerId = trainerId;
                  booking.sessionId = sessionId;
                  booking.amount = amount;
                  booking.tip = tip;
                  booking.loc.coordinates = coordinates;
                  booking.address = address;
                  let booking_ = await booking.save();

                  let payment = new Payment();
                  payment.userId = req._id;
                  payment.customerId = charge.customer;
                  payment.chargeId = charge.id;
                  payment.bookingId = booking_._id;
                  await payment.save();

                  let notification = new Notification();
                  notification.userId = trainerId;
                  notification.sessionId = sessionId;
                  notification.type = 'SESSION_BOOK';
                  notification.msg = `Your session has been booked by ${req.user.name}.`;
                  await notification.save();

                  let trainerToken = await User.findOne({ _id: trainerId }).lean();
                  let TOKEN;
                  if (trainerToken && trainerToken.isNotification) {
                    TOKEN = trainerToken.deviceToken;

                    let msg = {
                      "to": TOKEN,

                      "notification": {
                        "sound": "default",
                        "title": "Session booked",
                        "type": "SESSION_BOOK",
                        "body": `Your session has been booked by ${req.user.name}.`,
                      }

                    }

                    fcm.send(msg, function (err, response) {
                      if (err) {
                        console.log('Something has gone wrong!' + err);
                      } else {
                        console.log('Successfully sent with response: ', response);
                      }
                    });

                  }


                  let scheduleDate = session.scheduleDate;
                  var _date = new Date(new Date(scheduleDate).setHours((new Date(scheduleDate)).getHours() - 1));
                  var d = _date.getDate()
                  var m = _date.getMonth();
                  var h = _date.getHours();
                  var mi = _date.getMinutes();


                  var job = new CronJob(
                    `0 ${mi} ${h} ${d} ${m} *`,
                    async function () {

                      let user = await User.findOne({ _id: req._id });
                      let user_ = await User.findOne({ _id: trainerId });

                      let notification = new Notification();
                      notification.userId = req._id;
                      notification.sessionId = sessionId;
                      notification.type = 'SESSION_START';
                      notification.msg = `Your session with ${user_.name} starts in 1 hour`;
                      await notification.save();

                      let notification_ = new Notification();
                      notification_.userId = trainerId;
                      notification_.sessionId = sessionId;
                      notification_.type = 'SESSION_START';
                      notification_.msg = `Your session with ${user.name} starts in 1 hour`;
                      await notification_.save();


                      let token = [];

                      if (user?.isNotification) {
                        token.push(user.deviceToken);
                      }

                      if (user_?.isNotification) {
                        token.push(user_.deviceToken);
                      }
                      let MSG = {
                        "to": user.deviceToken,

                        "notification": {
                          "sound": "default",
                          "title": "Session about to start",
                          "type": "SESSION_START",
                          "body": `Your session with ${user_.name} starts in 1 hour`,

                        }

                      }

                      let msg = {
                        "to": user_.deviceToken,

                        "notification": {
                          "sound": "default",
                          "title": "Session about to start",
                          "type": "SESSION_START",
                          "body": `Your session with ${user.name} starts in 1 hour`,

                        }

                      }

                      fcm.send(MSG, function (err, response) {
                        if (err) {
                          console.log('Something has gone wrong!' + err);
                        } else {
                          console.log('Successfully sent with response: ', response);
                        }
                      });
                      fcm.send(msg, function (err, response) {
                        if (err) {
                          console.log('Something has gone wrong!' + err);
                        } else {
                          console.log('Successfully sent with response: ', response);
                        }
                      });

                    },
                    null,
                    true,
                    // timeZone
                  );
                  job.start();

                  let endDate = session.endgDate;
                  var _date_ = new Date(endDate);
                  var d_ = _date_.getDate()
                  var m_ = _date_.getMonth();
                  var h_ = _date_.getHours();
                  var mi_ = _date_.getMinutes();



                  var job_ = new CronJob(
                    `0 ${mi_} ${h_} ${d_} ${m_} *`,
                    async function () {
                      let { _Mi, _H, _AMPM, _D, _M, _Y } = _DDATE(session.scheduleDate);

                      let booking__ = await Booking.findOne({ sessionId, status: true });
                      if (booking__ && !(booking__.start)) {
                        booking__.status = false;
                        await booking__.save();

                        let user = await User.findOne({ _id: req._id });
                        let user_ = await User.findOne({ _id: trainerId });

                        let notification = new Notification();
                        notification.userId = req._id;
                        notification.sessionId = sessionId;
                        notification.type = 'CANCEL';
                        notification.msg = `Has canceled your training session on ${_D}th ${_M} ${_Y} at ${_H}:${_Mi} ${_AMPM}.`;
                        await notification.save();

                        let notification_ = new Notification();
                        notification_.userId = trainerId;
                        notification_.sessionId = sessionId;
                        notification_.type = 'CANCEL';
                        notification_.msg = `Has canceled your training session on ${_D}th ${_M} ${_Y} at ${_H}:${_Mi} ${_AMPM}.`;
                        await notification_.save();


                        let token = [];

                        if (user?.isNotification) {
                          token.push(user.deviceToken);
                        }

                        if (user_?.isNotification) {
                          token.push(user_.deviceToken);
                        }
                        let msg = {
                          "registration_ids": token,

                          "notification": {
                            "sound": "default",
                            "title": "Session cancelled",
                            "type": "CANCEL",
                            "body": `Has canceled your training session on ${_D}th ${_M} ${_Y} at ${_H}:${_Mi} ${_AMPM}.`,

                          }

                        }
                        fcm.send(msg, function (err, response) {
                          if (err) {
                            console.log('Something has gone wrong!' + err);
                          } else {
                            console.log('Successfully sent with response: ', response);
                          }
                        });
                      } else { }
                    },
                    null,
                    true,
                    // timeZone
                  );
                  job_.start();

                  return res.success({ booking: booking_, charge }, 'Booking completed successfully')// If no error occurs
                })
                .catch((err) => {
                  return res.warn({}, 'Payment error')
                  //res.send(err)       // If some error occurs
                });
            }

          }
        }

      } else {
        return res.warn({}, "Booking not allwed for Trainers")
      }
    } catch (err) {
      console.log(err)
      return next(err);
    }
  }
  async CheckSlot(req, res, next) {
    try {
      let sessionId = req.query.sessionId;
      let book = await Booking.findOne({ sessionId, status: true });
      if (book) {
        return res.warn({}, 'This session has already been booked')
      } else {
        return res.success({}, 'This session is available for booking')
      }
    } catch (err) {
      return next(err);
    }
  }
  async sentRequests(req, res, next) {
    try {
      let bookings = await Booking.aggregate([
        {
          $match: {
            $or: [{ athleteId: ObjectId(req._id) }, { trainerId: ObjectId(req._id) }],
            status: true, start: false, end: false, confirmed: false
          }
        },
        {
          "$lookup": {
            "from": "users",
            "localField": "trainerId",
            "foreignField": "_id",
            "as": "Trainer"
          }
        },
        {
          $unwind: {
            path: "$Trainer"
          }
        },
        {
          "$lookup": {
            "from": "users",
            "localField": "athleteId",
            "foreignField": "_id",
            "as": "Athlete"
          }
        },
        {
          $unwind: {
            path: "$Athlete"
          }
        },
        {
          "$lookup": {
            "from": "bookings",
            "let": {
              "userId": "$trainerId",
              "userIdd": "$athleteId"
            },
            "pipeline": [
              {
                "$match": {
                  $and: [
                    { "$expr": { "$eq": ["$trainerId", '$$userId'] } },
                    { "$expr": { "$eq": ["$athleteId", "$$userIdd"] } },
                    { "$expr": { "$eq": ["$end", true] } },
                  ]
                }
              },
            ],
            "as": "MyBookings"
          }
        },
        {
          "$lookup": {
            "from": "trainersessions",
            "localField": "sessionId",
            "foreignField": "_id",
            "as": "session"
          }
        },
        {
          $unwind: {
            path: "$session"
          }
        },
        {
          "$project": {
            _id: 1,
            athleteId: 1,
            trainerId: 1,
            sessionId: 1,
            startDate: "$session.scheduleDate",
            endDate: "$session.endgDate",
            Status: "pending",
            "Trainer.name": "$Trainer.name",
            "Trainer.avatar": "$Trainer.avatar",
            "Trainer.hourly": "$Trainer.hourly_price",
            "Athlete.name": "$Athlete.name",
            "Athlete.avatar": "$Athlete.avatar",
            "Athlete.hourly": "$Trainer.hourly_price",
            sessions: {
              $size: "$MyBookings"
            },
            created: "$created"
          }
        },
        {
          $sort: {
            "startDate": 1
          }
        }

      ])

      return res.success({ bookings }, 'Pending sessions list')

    } catch (err) {
      return next(err);
    }
  }
  async ongoingSessions(req, res, next) {
    try {
      // let slug=req.query.slug;
      let timeZone = req.query.timeZone;

      let bookings = await Booking.aggregate([
        {
          $match: {
            $or: [{ athleteId: ObjectId(req._id) }, { trainerId: ObjectId(req._id) }],
            status: true, end: false, confirmed: true
          }
        },
        {
          "$lookup": {
            "from": "users",
            "localField": "trainerId",
            "foreignField": "_id",
            "as": "Trainer"
          }
        },
        {
          $unwind: {
            path: "$Trainer"
          }
        },
        {
          "$lookup": {
            "from": "users",
            "localField": "athleteId",
            "foreignField": "_id",
            "as": "Athlete"
          }
        },
        {
          $unwind: {
            path: "$Athlete"
          }
        },
        {
          "$lookup": {
            "from": "bookings",
            "let": {
              "userId": "$trainerId",
              "userIdd": "$athleteId"
            },
            "pipeline": [
              {
                "$match": {
                  $and: [
                    { "$expr": { "$eq": ["$trainerId", '$$userId'] } },
                    { "$expr": { "$eq": ["$athleteId", "$$userIdd"] } },
                    { "$expr": { "$eq": ["$end", true] } },
                  ]
                }
              },
            ],
            "as": "MyBookings"
          }
        },
        {
          "$lookup": {
            "from": "trainersessions",
            "localField": "sessionId",
            "foreignField": "_id",
            "as": "session"
          }
        },
        {
          $unwind: {
            path: "$session"
          }
        },
        {
          "$project": {
            _id: 1,
            athleteId: 1,
            trainerId: 1,
            sessionId: 1,
            startDate: "$session.scheduleDate",
            endDate: "$session.endgDate",
            Start_Session: {
              // $cond:{ if: {$and:[{$lte:["$session.scheduleDate",moment((new Date(new Date().setHours((new Date()).getHours()+1))),'YYYY-MM-DD HH:mm:ss').tz(timeZone).format()]},{$gte:["$session.endgDate",moment((new Date(new Date().setHours((new Date()).getHours()+1))),'YYYY-MM-DD HH:mm:ss').tz(timeZone).format()]}]},then:true,else:false}

              $cond: { if: { $lte: ["$session.scheduleDate", moment((new Date(new Date().setHours((new Date()).getHours() + 1))), 'YYYY-MM-DD HH:mm:ss').tz(timeZone).format()] }, then: true, else: false }
            },
            Track_Session: {
              $cond: [{ $eq: [true, '$start'] }, true, false]
            },
            Status: {
              $cond: [{ $eq: [true, '$start'] }, "Ongoing", "Confirmed"]
            },
            "Trainer.name": "$Trainer.name",
            "Trainer.avatar": "$Trainer.avatar",
            "Trainer.hourly": "$Trainer.hourly_price",
            "Athlete.name": "$Athlete.name",
            "Athlete.avatar": "$Athlete.avatar",
            "Athlete.hourly": "$Trainer.hourly_price",
            sessions: {
              $size: "$MyBookings"
            },
            updated: "$updated"
          }
        },
        {
          $sort: {
            "startDate": 1
          }
        }
      ])


      return res.success({ bookings }, "Ongoing sessions list")

    } catch (err) {
      return next(err);
    }
  }
  async completedSessions(req, res, next) {
    try {
      // let slug=req.query.slug;

      let bookings = await Booking.aggregate([
        {
          $match: {
            $or: [{ athleteId: ObjectId(req._id) }, { trainerId: ObjectId(req._id) }],
            status: true, start: true, end: true, confirmed: true
          }
        },
        {
          "$lookup": {
            "from": "users",
            "localField": "trainerId",
            "foreignField": "_id",
            "as": "Trainer"
          }
        },
        {
          $unwind: {
            path: "$Trainer"
          }
        },
        {
          "$lookup": {
            "from": "users",
            "localField": "athleteId",
            "foreignField": "_id",
            "as": "Athlete"
          }
        },
        {
          $unwind: {
            path: "$Athlete"
          }
        },
        {
          "$lookup": {
            "from": "bookings",
            "let": {
              "userId": "$trainerId",
              "userIdd": "$athleteId"
            },
            "pipeline": [
              {
                "$match": {
                  $and: [
                    { "$expr": { "$eq": ["$trainerId", '$$userId'] } },
                    { "$expr": { "$eq": ["$athleteId", "$$userIdd"] } },
                    { "$expr": { "$eq": ["$end", true] } },
                  ]
                }
              },
            ],
            "as": "MyBookings"
          }
        },
        {
          "$lookup": {
            "from": "trainersessions",
            "localField": "sessionId",
            "foreignField": "_id",
            "as": "session"
          }
        },
        {
          "$lookup": {
            "from": "reviews",
            "localField": "sessionId",
            "foreignField": "sessionId",
            "as": "review"
          }
        },
        {
          $unwind: {
            path: "$session"
          }
        },
        // {
        //   $unwind:{
        //     path:"$review",
        //     "preserveNullAndEmptyArrays": true
        //   }
        // },
        {
          "$project": {
            _id: 1,
            athleteId: 1,
            trainerId: 1,
            sessionId: 1,
            review: {
              $cond: [{ $in: [req.user._id, '$review.FROM'] }, true, false]
            },
            startDate: "$session.scheduleDate",
            endDate: "$session.endgDate",
            Status: "Completed",
            "Trainer.name": "$Trainer.name",
            "Trainer.avatar": "$Trainer.avatar",
            "Trainer.hourly": "$Trainer.hourly_price",
            "Athlete.name": "$Athlete.name",
            "Athlete.avatar": "$Athlete.avatar",
            "Athlete.hourly": "$Trainer.hourly_price",
            sessions: {
              $size: "$MyBookings"
            },
            updated: "$updated"
          }
        },
        {
          $sort: {
            "startDate": 1
          }
        }
      ])


      return res.success({ bookings }, 'Completed sessions list')

    } catch (err) {
      return next(err);
    }
  }
  async BookingDetails(req, res, next) {
    try {
      let bookingId = req.query.bookingId;
      let BookingDetails = await Booking.aggregate([
        {
          $match: {
            _id: ObjectId(bookingId)
          }
        },
        {
          "$lookup": {
            "from": "users",
            "localField": "trainerId",
            "foreignField": "_id",
            "as": "Trainer"
          }
        },
        {
          $unwind: {
            path: "$Trainer"
          }
        },
        {
          "$lookup": {
            "from": "divisions",
            "localField": "Trainer.division",
            "foreignField": "_id",
            "as": "Division"
          }
        },
        {
          "$lookup": {
            "from": "sports",
            "let": { "sportIds": "$Trainer.sport" },
            "pipeline": [
              {
                "$match": {
                  "$expr": { "$in": ["$_id", "$$sportIds"] }
                }
              },
              {
                "$project": {
                  name: 1
                }
              }
            ],
            "as": "Sport"
          }
        },
        {
          $unwind: "$Sport"
        },
        {
          $unwind: "$Division"
        },
        {
          "$lookup": {
            "from": "users",
            "localField": "athleteId",
            "foreignField": "_id",
            "as": "Athlete"
          }
        },
        {
          $unwind: {
            path: "$Athlete"
          }
        },
        {
          "$lookup": {
            "from": "bookings",
            "let": {
              "userId": "$trainerId",
              "userIdd": "$athleteId"
            },
            "pipeline": [
              {
                "$match": {
                  $and: [
                    { "$expr": { "$eq": ["$trainerId", '$$userId'] } },
                    { "$expr": { "$eq": ["$athleteId", "$$userIdd"] } },
                    { "$expr": { "$eq": ["$end", true] } }
                  ]
                }
              },
            ],
            "as": "MyBookings"
          }
        },
        {
          "$lookup": {
            "from": "trainersessions",
            "localField": "sessionId",
            "foreignField": "_id",
            "as": "session"
          }
        },
        {
          $unwind: {
            path: "$session"
          }
        },
        {
          "$project": {
            _id: 1,
            athleteId: 1,
            trainerId: 1,
            sessionId: 1,
            Total_Price: "$amount",
            sports: "$sports",
            Tip: "$tip",
            startDate: "$session.scheduleDate",
            endDate: "$session.endgDate",
            "Trainer.name": "$Trainer.name",
            "Trainer.avatar": "$Trainer.avatar",
            "Trainer.description": "$Trainer.description",
            "Trainer.DIVISION": { $concat: ["$Trainer.school", " | ", "$Sport.name", " | ", "$Division.division"] },
            "Athlete.name": "$Athlete.name",
            "Athlete.avatar": "$Athlete.avatar",
            "Athlete.description": "$Athlete.description",
            sessions: {
              $size: "$MyBookings"
            },
            Booking_Date: "$created",
            address: 1,
            loc: 1
          }
        }
      ]);

      return res.success({ BookingDetails }, 'Booking details fetched successfully')
    } catch (err) {
      return next(err);
    }
  }
  async CancelSession(req, res, next) {
    try {
      let bookingId = req.body.bookingId;
      let booking = await Booking.findOne({ _id: bookingId, status: true });
      let session = await TrainerSession.findOne({ _id: booking.sessionId });

      if (req.role === 'College-Athlete') {

        let date = new Date();
        let curTime = moment(
          date,
          'YYYY-MM-DD HH:mm:ss'
        ).format();

        let offset_ = curTime.substring(19);
        let offset = (session.scheduleDate).substring(19);
        let curDate = curTime.replace(offset_, offset);
        let startDate = session.scheduleDate;
        //startDate = "2022-09-08T08:00:00+05:30"
        let diff = moment(startDate).diff(moment(curDate), 'hours');
        let prcnt = diff > 24 ? (1 / 2) : (diff > 8 && diff <= 24) ? (1 / 4) : 0;
        let amount = ((booking.amount) * prcnt + booking.tip);

        if (amount * 100 > 1) {
          let payment = await Payment.findOne({ bookingId }).lean();
          let charge = payment.chargeId;
          const refund = await stripe.refunds.create({
            charge: charge,
            amount: amount * 100
          });
          booking.refund = amount;
        }




      } else if (req.role === 'Trainer') {
        let amount = (booking.amount + booking.tip);
        if (amount * 100 > 1) {
          let payment = await Payment.findOne({ bookingId }).lean();
          let charge = payment.chargeId;
          const refund = await stripe.refunds.create({
            charge: charge,
            amount: amount * 100
          });

          booking.refund = amount;
        }


      }

      if (booking) {

        let { _Mi, _H, _AMPM, _D, _M, _Y } = _DDATE(session.scheduleDate);



        booking.status = false;
        await booking.save();

        let notification = new Notification();
        notification.userId = (req._id.equals(booking.athleteId) ? booking.trainerId : booking.athleteId);
        notification.sessionId = booking.sessionId;
        notification.performedBy = req.user._id;
        notification.type = 'CANCEL';
        notification.msg = `${req.user.name} has canceled your training session on ${_D}th ${_M} ${_Y} at ${_H}:${_Mi} ${_AMPM}.`;
        await notification.save();


        let user = await User.findOne({ _id: notification.userId });
        let token
        if (user?.isNotification) {
          token = user.deviceToken;

          let msg = {
            "to": token,
            "notification": {
              "sound": "default",
              "title": `${req.user.name}`,
              "type": "CANCEL",
              "body": `Has canceled your training session on ${_D}th ${_M} ${_Y} at ${_H}:${_Mi} ${_AMPM}.`,
            }

          }



          fcm.send(msg, function (err, response) {
            if (err) {
              console.log('Something has gone wrong!' + err);
            } else {
              console.log('Successfully sent with response: ', response);
            }
          });


        }



        return res.success({}, 'You have successfully cancelled the session')
      } else {
        return res.warn({}, 'You already cancelled this session')
      }
    } catch (err) {
      console.log(err)
      return next(err);
    }
  }
  async StartSession(req, res, next) {
    try {
      let bookingId = req.body.bookingId;
      let booking = await Booking.findOne({ _id: bookingId, athleteId: req._id, status: true });

      if (booking) {
        booking.start = true;
        await booking.save();

        let session = await TrainerSession.findOne({ _id: booking.sessionId })
        let endDate = session.endgDate;
        var date = new Date(endDate);
        var d = date.getDate();
        var m = date.getMonth();
        var h = date.getHours();
        var mi = date.getMinutes();
        var job = new CronJob(
          `0 ${mi} ${h} ${d} ${m} *`,
          async function () {

            let booking_ = await Booking.findOne({ _id: bookingId, status: true, start: true });

            if (!booking_.confirmed && !booking_.end) {
              let amount = ((booking_.amount) + booking_.tip);

              let payment = await Payment.findOne({ bookingId }).lean();
              let charge = payment.chargeId;
              const refund = await stripe.refunds.create({
                charge: charge,
                amount: amount * 100
              });
              booking_.refaund = amount;
            } else if (booking_.confirmed && !booking_.end) {
              booking_.end = true;
              await booking_.save();
            }



          },
          null,
          true
        );
        job.start();


        return res.success({}, 'You have successfully start the session')
      } else {
        return res.warn({}, 'You already started this session')
      }
    } catch (err) {
      return next(err);
    }
  }
  async ConfirmSession(req, res, next) {
    try {
      let bookingId = req.body.bookingId;
      let booking = await Booking.findOne({ _id: bookingId, trainerId: req._id, status: true });
      let session = await TrainerSession.findOne({ _id: booking.sessionId });

      let { _Mi, _H, _AMPM, _D, _M, _Y } = _DDATE(session.scheduleDate);

      if (booking) {
        booking.confirmed = true;
        await booking.save();

        let notification = new Notification();
        notification.userId = booking.athleteId;
        notification.sessionId = booking.sessionId;
        notification.performedBy = req.user._id;
        notification.type = 'CONFIRM';
        notification.msg = `${req.user.name} has confirmed your training session for ${_D}th ${_M} ${_Y} at ${_H}:${_Mi} ${_AMPM}.`;

        await notification.save();

        let user = await User.findOne({ _id: notification.userId });
        let token = user.deviceToken;

        let curTime = moment(
          session.scheduleDate,
          'YYYY-MM-DD HH:mm:ss'
        ).format();



        let msg = {
          "to": token,

          "notification": {
            "sound": "default",
            "title": `${req.user.name}`,
            "type": "CONFIRM",
            "body": `Has confirmed your training session for ${_D}th ${_M} ${_Y} at ${_H}:${_M} ${_AMPM}.`,

          }

        }

        let MSG = {
          "to": token,
          "notification": {
            "sound": "default",
            "title": `${req.user.name}`,
            "body": 'Hi athlete...',
          }

        }

        if (user?.isNotification) {

          fcm.send(msg, function (err, response) {
            if (err) {
              console.log('Something has gone wrong!' + err);
            } else {
              console.log('Successfully sent with response: ', response);
            }
          });


          fcm.send(MSG, function (err, response) {
            if (err) {
              console.log('Something has gone wrong!' + err);
            } else {
              console.log('Successfully sent with response: ', response);
            }
          });
        }


        // let obj = {
        //   START: session.scheduleDate,
        //   END: session.endgDate
        // }

        let participants = [];
        participants.push(booking.athleteId);
        participants.push(req._id);

        let _chat = await Chat.findOne({ receiverId: booking.athleteId, senderId: req._id });

        if (_chat) {
          let chat = new Chat();
          chat.senderId = req._id;
          chat.receiverId = booking.athleteId;
          chat.msg = 'Hi athlete...';
          chat.participants = participants;
          await chat.save();
        }




        return res.success({}, 'You have successfully confirmed the session')
      } else {
        return res.warn({}, 'You already confirmed this session')
      }
    } catch (err) {
      return next(err);
    }
  }
  async AddReview(req, res, next) {
    let { userId, sessionId, rating, review } = req.body;

    try {
      let reviewEx = await Review.findOne({ TO: userId, sessionId, FROM: req._id })

      if (reviewEx) {
        return res.warn({}, 'You already gave review on this session')
      } else {

        let reviewSave = new Review();
        reviewSave.TO = userId;
        reviewSave.FROM = req._id;
        reviewSave.sessionId = sessionId;
        reviewSave.rating = rating;
        reviewSave.review = review;
        await reviewSave.save();
        return res.success({}, 'Review added successfully')
      }
    } catch (err) {
      return next(err);
    }
  }
  async Reviews(req, res, next) {
    let userId = req.query.userId;
    let sessionId = req.query.sessionId;
    try {
      let reviews;
      if (userId) {
        reviews = await Review.aggregate([
          {
            $match: {
              TO: ObjectId(userId)
            }
          },
          {
            "$lookup": {
              "from": "users",
              "localField": "FROM",
              "foreignField": "_id",
              "as": "User"
            }
          },
          {
            $unwind: {
              path: "$User"
            }
          },
          {
            "$project": {
              _id: 1,
              sessionId: 1,
              rating: 1,
              review: 1,
              "User.name": "$User.name",
              "User.avatar": "$User.avatar",
              "User.hourly": "$User.hourly_price",
              created: 1
            }
          }
        ]);
      } else if (sessionId) {
        reviews = await Review.aggregate([
          {
            $match: {
              FROM: req._id, sessionId: ObjectId(sessionId)
            }
          },
          {
            "$lookup": {
              "from": "users",
              "localField": "FROM",
              "foreignField": "_id",
              "as": "User"
            }
          },
          {
            $unwind: {
              path: "$User"
            }
          },
          {
            "$project": {
              _id: 1,
              sessionId: 1,
              rating: 1,
              review: 1,
              "User.name": "$User.name",
              "User.avatar": "$User.avatar",
              "User.hourly": "$User.hourly_price",
              created: 1
            }
          }
        ]);
      } else {
        reviews = await Review.aggregate([
          {
            $match: {
              TO: req._id
            }
          },
          {
            "$lookup": {
              "from": "users",
              "localField": "FROM",
              "foreignField": "_id",
              "as": "User"
            }
          },
          {
            $unwind: {
              path: "$User"
            }
          },
          {
            "$project": {
              _id: 1,
              sessionId: 1,
              rating: 1,
              review: 1,
              "User.name": "$User.name",
              "User.avatar": "$User.avatar",
              "User.hourly": "$User.hourly_price",
              created: 1
            }
          }
        ]);
      }
      return res.success({ reviews }, 'Reviews list fetched successfully')
    } catch (err) {
      console.log(err)
      return next(err);
    }
  }
  async TrackingDetails(req, res, next) {
    let bookingId = req.query.bookingId;

    try {

      let user = await Booking.aggregate([
        {
          $match: {
            _id: ObjectId(bookingId)
          }
        },
        {
          $project: {
            loc: 1,
            address: 1,
            userId: { $cond: [{ $eq: [req._id, '$athleteId'] }, "$trainerId", "$athleteId"] }
          }
        },
        {
          "$lookup": {
            "from": "users",
            "localField": "userId",
            "foreignField": "_id",
            "as": "User"
          }
        },
        {
          $unwind: "$User"
        },
        {
          $project: {
            _id: 0,
            bookingId: "$_id",
            "User._id": "$User._id",
            "User.name": "$User.name",
            "User.avatar": "$User.avatar",
            "User.loc": "$loc",
            "User.address": "$address",

          }
        }
      ]);
      let trackingDetails = user[0];

      // let coordinates = trackingDetails.User.loc.coordinates;
      // let X = coordinates[1];
      // let Y = coordinates[0];
      // trackingDetails.User.loc.coordinates = [X, Y];
      return res.success({ trackingDetails }, 'Tracking details ')
    } catch (err) {
      console.log(err)
      return next(err);
    }
  }
  async TrackingProfile(req, res, next) {
    let bookingId = req.query.bookingId;

    try {

      let trackingProfile = await Booking.aggregate([
        {
          $match: {
            _id: ObjectId(bookingId)
          }
        },
        {
          $project: {
            userId: { $cond: [{ $eq: [req._id, '$athleteId'] }, "$trainerId", "$athleteId"] },
            trainerId: 1
          }
        },
        {
          "$lookup": {
            "from": "users",
            "localField": "userId",
            "foreignField": "_id",
            "as": "User"
          }
        },
        {
          "$lookup": {
            "from": "users",
            "localField": "trainerId",
            "foreignField": "_id",
            "as": "Trainer"
          }
        },
        {
          $unwind: "$Trainer"
        },
        {
          "$lookup": {
            "from": "divisions",
            "localField": "Trainer.division",
            "foreignField": "_id",
            "as": "Division"
          }
        },
        {
          "$lookup": {
            "from": "sports",
            "let": { "sportIds": "$Trainer.sport" },
            "pipeline": [
              {
                "$match": {
                  "$expr": { "$in": ["$_id", "$$sportIds"] }
                }
              },
              {
                "$project": {
                  name: 1
                }
              }
            ],
            "as": "Sport"
          }
        },
        {
          $unwind: "$Sport"
        },
        {
          $unwind: "$Division"
        },
        {
          $unwind: "$User"
        },
        {
          $project: {
            _id: 0,
            bookingId: "$_id",
            "User._id": "$User._id",
            "User.name": "$User.name",
            "User.avatar": "$User.avatar",
            "School": "$Trainer.school",
            "Sport": "$Sport",
            "Division": "$Division"
          }
        }
      ]);

      return res.success({ trackingProfile }, 'Tracking details ')
    } catch (err) {
      console.log(err)
      return next(err);
    }
  }
  async createGroup(req, res, next) {
    try {

      if (req.user && (req.user.role === 'Junior-Athlete')) {
        // if (req.user) {
        const upload = multer({
          dest: 'uploads/'
        }).single('groupIcon');

        upload(req, res, async err => {
          if (err) {
            return res.send({
              status: false,
              message: 'Something went wrong!',
            });
          }
          var {
            name, users
          } = req.body;
          let BODY = req.body.users;
          users = JSON.parse(BODY);
          const file = req.file;
          let image;
          if (file) {
            image = await uploadImageAPI(file, 'groupIcon');
            await unlinkAsync(file.path);
          }


          let group = new Group();
          group.hostId = req._id;
          group.name = name;
          if (file) {
            group.groupIcon = image.key;
          }
          let gp = await group.save();
          let obj = {};
          obj.userId = req._id;
          users.push(obj)

          users = users.map(x => {
            return ({ ...x, gpId: gp._id });
          });
          await JoinGroup.insertMany(users);


          let participants = users.map(R => {
            return R.userId;
          });

          let readersArray = [];
          readersArray.push(req._id);
          let chat = new Chat();
          chat.senderId = req._id;
          chat.groupId = gp._id;
          chat.msg = 'Hi members...';
          chat.participants = participants;
          chat.readersArray = readersArray;
          await chat.save();

          return res.success({}, "Group created successfully")
        });

      }

    } catch (err) {
      return next(err);
    }
  }
  async AddMembersList(req, res, next) {
    try {

      var trainerslist = await Booking.aggregate([
        {
          $match: {
            athleteId: req._id,
            end: true,
            status: true,
            confirmed: true,
            start: true,
          },
        },
        {
          $group: {
            _id: "$trainerId"
          }
        },
        {
          "$lookup": {
            "from": "users",
            "localField": "_id",
            "foreignField": "_id",
            "as": "Trainer"
          }
        },
        {
          $unwind: "$Trainer"
        },
        {
          $project: {
            _id: 0,
            userId: "$Trainer._id",
            avatar: "$Trainer.avatar",
            name: "$Trainer.name",
          }
        }
      ])

      return res.success({ trainerslist }, 'Trainer list for create group.');
    } catch (err) {
      console.log(err)
      return next(err);
    }
  }
  async PaymentHistory(req, res, next) {

    try {

      let Payments = await Booking.aggregate([
        {
          $match: {
            trainerId: ObjectId(req._id),
            status: true,
            start: true,
            confirmed: true,
            end: true,
          }
        },
        {
          "$lookup": {
            "from": "users",
            "localField": "athleteId",
            "foreignField": "_id",
            "as": "Athlete"
          }
        },
        {
          $unwind: "$Athlete"
        },
        {
          "$lookup": {
            "from": "trainersessions",
            "localField": "sessionId",
            "foreignField": "_id",
            "as": "Session",
          }
        },
        {
          $unwind: "$Session"
        },
        {
          $project: {
            _id: 0,
            bookingId: "$_id",
            // "amount": {
            //   $add: ['$amount', '$tip']
            // },
            "amount": {
              $function: {
                body: function (amount, tip, refund) {
                  return (amount - refund);
                },
                args: ["$amount", "$tip", "$refund"],
                lang: "js"
              },
            },
            "Athlete._id": "$Athlete._id",
            "Athlete.name": "$Athlete.name",
            "Athlete.avatar": "$Athlete.avatar",
            "scheduleDate": "$Session.scheduleDate",
            "endgDate": "$Session.endgDate",
            "endDate": { $toDate: "$Session.endgDate" },
          }
        },
        {
          $group: {
            _id: { $dateToString: { format: "%Y-%m-%d", date: "$endDate" } },
            list: { $push: "$$ROOT" },
          }
        },
        {
          $project: {
            _id: 0,
            date: "$_id",
            list: "$list"
          }
        },
        {
          $sort: {
            date: -1
          }
        }
      ]);
      //  Payments = Payments[0];
      return res.success({ Payments }, `Trainer's payment history `)
    } catch (err) {
      console.log(err)
      return next(err);
    }
  }
  async ChatScreenInd(req, res, next) {
    try {

      let searchValue;
      let query = {};
      query.$and = [
        { "$expr": { "$eq": ["$_id", '$$userId'] } },
      ]
      if (req.query.search) {
        searchValue = new RegExp(
          req.query.search
            .split(' ')
            .filter(val => val)
            .map(value => value.replace(/[-[\]{}()*+?.,\\^$|#\s]/g, '\\$&'))
            .join('|'),
          'i'
        );
        query.$and = [
          {
            "$expr": {
              $regexMatch: {
                input: "$name",
                regex: searchValue,
              }
            }
          },
          { "$expr": { "$eq": ["$_id", '$$userId'] } },

        ]
      }


      let CHATS = await Chat.aggregate([
        {
          $match: {
            $or: [{ senderId: req._id }, { receiverId: req._id }]
          }
        },
        {
          $sort: {
            created: -1
          }
        },
        {
          $project: {
            _id: 0,
            receiverId: {
              $cond: [{ $eq: [req._id, "$senderId"] }, "$receiverId", "$senderId"]
            }
          }
        },
        {
          $group: {
            _id: "$receiverId"
          }
        },
        {
          "$lookup": {
            "from": "users",
            "let": {
              "userId": "$_id"
            },
            "pipeline": [
              {
                "$match": query
              }
            ],
            "as": "Friend"
          }
        },
        {
          $unwind: {
            path: "$Friend"
          }
        },
        {
          "$lookup": {
            "from": "chats",
            "let": {
              "userId": "$_id",
              "userIdd": req._id
            },
            "pipeline": [
              {
                "$match": {
                  $and: [
                    { "$expr": { "$eq": ["$senderId", "$$userId"] } },
                    { "$expr": { "$eq": ["$receiverId", "$$userIdd"] } },
                    { "$expr": { "$in": [req._id.toString(), "$participants"] } },
                    { "$expr": { "$eq": ["$read", false] } }
                  ]
                }
              },
              {
                $sort: { created: -1 }
              }
            ],
            "as": "ReadUnread"
          }
        },
        {
          "$lookup": {
            "from": "chats",
            "let": {
              "userId": "$_id",
              "userIdd": req._id
            },
            "pipeline": [
              {
                "$match": {
                  $or: [
                    {
                      $and: [
                        { "$expr": { "$eq": ["$senderId", '$$userId'] } },
                        { "$expr": { "$eq": ["$receiverId", "$$userIdd"] } },
                        { "$expr": { "$in": [req._id.toString(), "$participants"] } }
                      ]
                    },
                    {
                      $and: [
                        { "$expr": { "$eq": ["$senderId", "$$userIdd"] } },
                        { "$expr": { "$eq": ["$receiverId", "$$userId"] } },
                        { "$expr": { "$in": [req._id.toString(), "$participants"] } }
                      ]
                    },
                  ]
                }

              },
              {
                $sort: { created: -1 }
              }
            ],
            "as": "Chats"
          }
        },
        {
          $project: {

            _id: 0,
            "friend._id": "$Friend._id",
            "friend.name": "$Friend.name",
            "friend.avatar": "$Friend.avatar",
            "msg": {
              $arrayElemAt: ["$Chats", 0]
            },
            "unread": {
              $size: "$ReadUnread"
            }

          }
        },
        {
          $sort: { "msg.created": -1 }
        }
      ]);

      let chats = [];
      if (CHATS.length > 0) {
        CHATS.map(e => {
          if (e.msg) {
            chats.push(e)
          }
        })
      }

      return res.success({
        chats
      }, `Individual  chat list`);

    } catch (err) {
      console.log(err)
      return next(err);
    }
  }
  async ChatScreenGroup(req, res, next) {
    try {

      let searchValue;
      let query = {};
      query.$and = [
        { "$expr": { "$eq": ["$_id", '$$groupId'] } },
      ]
      if (req.query.search) {
        searchValue = new RegExp(
          req.query.search
            .split(' ')
            .filter(val => val)
            .map(value => value.replace(/[-[\]{}()*+?.,\\^$|#\s]/g, '\\$&'))
            .join('|'),
          'i'
        );
        query.$and = [
          {
            "$expr": {
              $regexMatch: {
                input: "$name",
                regex: searchValue,
              }
            }
          },
          { "$expr": { "$eq": ["$_id", '$$groupId'] } },

        ]
      }


      let CHATS = await JoinGroup.aggregate([
        {
          $match: {
            userId: req._id
          }
        },
        {
          $sort: {
            created: -1
          }
        },
        {
          "$lookup": {
            "from": "groups",
            "let": {
              "groupId": "$gpId"
            },
            "pipeline": [
              {
                "$match": query
              }
            ],
            "as": "Group"
          }
        },
        {
          $unwind: {
            path: "$Group"
          }
        },
        {
          "$lookup": {
            "from": "chats",
            "let": {
              "groupId": "$gpId"
            },
            "pipeline": [
              {
                "$match": {
                  $and: [
                    { "$expr": { "$eq": ["$groupId", '$$groupId'] } },
                    { "$expr": { "$in": [req._id.toString(), "$participants"] } },
                    { "$expr": { "$not": { "$in": [req._id.toString(), "$readersArray"] } } }
                  ]
                }
              },
              {
                $sort: { created: -1 }
              }
            ],
            "as": "ReadUnread"
          }
        },
        {
          "$lookup": {
            "from": "chats",
            "let": {
              "groupId": "$gpId"
            },
            "pipeline": [
              {
                "$match": {

                  $and: [
                    { "$expr": { "$eq": ["$groupId", '$$groupId'] } },
                    { "$expr": { "$in": [req._id.toString(), "$participants"] } },
                  ]
                }

              },
              {
                $sort: { created: -1 }
              }
            ],
            "as": "Chats"
          }
        },
        {
          $project: {

            _id: 0,
            "friend._id": "$Group._id",
            "friend.name": "$Group.name",
            "friend.avatar": "$Group.groupIcon",
            "msg": {
              $arrayElemAt: ["$Chats", 0]
            },
            "unread": {
              $size: "$ReadUnread"
            }

          }
        },
        {
          "$lookup": {
            "from": "users",
            "localField": "msg.senderId",
            "foreignField": "_id",
            "as": "Sender"
          }
        },
        {
          $unwind: {
            path: "$Sender"
          }
        },
        {
          $project: {
            friend: 1,
            // msg:1,
            "msg._id": "$msg._id",
            "msg.senderId": "$msg.senderId",
            "msg.groupId": "$msg.groupId",
            "msg.updated": "$msg.updated",
            "msg.isSuspended": "$msg.isSuspended",
            "msg.__v": "$msg.__v",
            "msg.read": "$msg.read",
            "msg.participants": "$msg.participants",
            "msg.msg": "$msg.msg",
            "msg.created": "$msg.created",
            "msg.sendName": "$Sender.name",
            "msg.senderAvatar": "$Sender.avatar",
            unread: 1
          },

        },
        {
          $sort: { "msg.created": -1 }
        }
      ]);


      let chats = [];
      if (CHATS.length > 0) {
        CHATS.map(r => {
          if (r.msg) {
            chats.push(r);
          }
        })
      }

      return res.success({
        chats
      }, `Group chat list`);

    } catch (err) {
      console.error(err);
      return next(err);
    }
  }
  async AddBank(req, res, next) {
    let { BANK_ACCOUNT_TYPE, BANK_ACCOUNT, BANK_ROUTING } = req.body;

    try {

      let account = await Bank.findOne({ userId: req._id });

      let bank = new Bank();
      bank.userId = req._id;
      bank.BANK_ACCOUNT_TYPE = BANK_ACCOUNT_TYPE;
      bank.BANK_ACCOUNT = BANK_ACCOUNT;
      bank.BANK_ROUTING = BANK_ROUTING;
      bank.default = account ? false : true;
      await bank.save();

      let accounts = await Bank.find({ userId: req._id });
      return res.success({ accounts }, 'Bank info added successfully')

    } catch (err) {
      return next(err);
    }
  }
  async DefaultBank(req, res, next) {
    let { bankId } = req.query;
    try {

      await Bank.findOneAndUpdate({ userId: req._id, _id: bankId }, { default: true });
      await Bank.updateMany({ userId: req._id, _id: { $ne: bankId } }, { default: false });
      let accounts = await Bank.find({ userId: req._id });

      return res.success({ accounts }, 'Made default account successfully');
    } catch (err) {
      return next(err);
    }
  }
  async DeleteBank(req, res, next) {
    let { bankId } = req.query;
    try {

      await Bank.findOneAndDelete({ userId: req._id, _id: bankId }, { default: true });
      let accounts = await Bank.find({ userId: req._id });

      return res.success({ accounts }, 'Bank account deleted successfully');
    } catch (err) {
      return next(err);
    }
  }
  async BankList(req, res, next) {
    try {

      let accounts = await Bank.find({ userId: req._id });

      return res.success({ accounts }, 'Bank account deleted successfully');
    } catch (err) {
      return next(err);
    }
  }
  async DeleteChat(req, res, next) {

    let { ID } = req.query;
    try {
      await Chat.updateMany({ $or: [{ senderId: req._id, receiverId: ID }, { receiverId: req._id, senderId: ID }, { groupId: ID }] }, { $pull: { participants: req._id.toString() } });
      return res.success({}, 'Chat deleted successfully');
    } catch (err) {
      return next(err);
    }

  }
  async Test(req, res, next) {
    try {

      // const account = await stripe.accounts.create({
      //   type: 'custom',
      //   country: 'US',
      //   email: 'jenny.rosen@yopmail.com',
      //   business_type: 'individual',
      //   tos_acceptance: {
      //     date: '1663205946',
      //     ip: '192.168.1.48'
      //   },
      //   capabilities: {
      //     card_payments: { requested: true },
      //     transfers: { requested: true },
      //   },
      //   external_account: {
      //     object: 'bank_account',
      //     country: 'US',
      //     currency: 'USD',
      //     account_holder_name: 'Rosen Jenny',
      //     routing_number: '110000000',
      //     account_number: '000123456789'
      //   }

      // });


      // const transfer = await stripe.transfers.create({
      //   amount: 1000,
      //   currency: "USD",
      //   destination: "acct_1LiWYjPAKL6yEs6v",
      // });
      // let participants = await JoinGroup.find({ gpId: ObjectId("632c26031d5341118079497f") }).lean();
      // participants = participants.map(r => {
      //   return r.userId.toString();
      // });
      let participants = ['62fb2f34d8f5f5c3d4e50566', '62d930f761a7c8ef105236c9']

      let chat = new Chat();
      chat.senderId = '62d930f761a7c8ef105236c9';
      chat.receiverId = '62fb2f34d8f5f5c3d4e50566';
      chat.msg = 'Hello   6';
      chat.participants = participants;
      let CHAT = await chat.save();


      return res.success({ CHAT })


    } catch (err) {
      console.log(err)
      return res.warn({ err });
    }
  }
  async MakeCall(req, res, next) {
    // let {  } = req.body;
    try {

      let TO = req.body.to;
      let CallSid = req.body.callSid;

      const voiceResponse = new VoiceResponse();
      const dial = voiceResponse.dial();
      const client = dial.client();
      client.identity(TO);
      voiceResponse.say('WelCome');
      return res.send(voiceResponse.toString());

    } catch (err) {
      console.log(err)
      return next(err);
    }


  }
  async AccessTokenVoice(req, res, next) {

    let { identity, DEVICE } = req.query;
    try {

      const accountSid = process.env.TWILIO_SID;
      const apiKey = process.env.API_KEY;
      const apiSecret = process.env.API_KEY_SECRET;
      const outgoingApplicationSid = process.env.APP_SID;

      let pushCredSid;
      if (DEVICE === 'ios' && req.role === 'Junior-Athlete') {
        pushCredSid = process.env.PUSH_CREDENTIAL_SID_IOS_ATHLETE;
      } else if (DEVICE === 'ios' && req.role === 'Trainer') {
        pushCredSid = process.env.PUSH_CREDENTIAL_SID_IOS_TRAINER;
      } else {
        pushCredSid = process.env.PUSH_CREDENTIAL_SID_ANDROID;
      }

      const voiceGrant = new VoiceGrant({
        outgoingApplicationSid: outgoingApplicationSid,
        pushCredentialSid: pushCredSid,
      });


      let token = new AccessToken(accountSid, apiKey, apiSecret);
      token.addGrant(voiceGrant);
      token.identity = identity;

      let TOKEN = token.toJwt();
      let CallToken = {};
      CallToken.token = TOKEN;
      CallToken.identity = identity;

      return res.success({ CallToken, tokenOne: token }, 'Access Token for voice chat')
    } catch (err) {
      console.log(err)
      return next(err);
    }

  }
  async AccessTokenVideo(req, res, next) {

    let { identity, DEVICE, roomName, userId, _identity } = req.query;
    try {

      const token = new AccessToken(
        process.env.TWILIO_SID,
        process.env.API_KEY,
        process.env.API_KEY_SECRET,
        { identity: identity }
      );
      const videoGrant = new VideoGrant({
        room: roomName,
      });


      token.addGrant(videoGrant);
      let TOKEN = token.toJwt();
      let CallToken = {};
      CallToken.token = TOKEN;
      CallToken.identity = identity;
      CallToken.roomName = roomName;
      CallToken.userId = userId;

      let user = await User.findOne({ _id: userId }).lean();
      if (user?.voip && user.role === 'Junior-Athlete') {
        let voip = user.voip;

        const _token = new AccessToken(
          process.env.TWILIO_SID,
          process.env.API_KEY,
          process.env.API_KEY_SECRET,
          { identity: _identity }
        );

        const _videoGrant = new VideoGrant({
          room: roomName,
        });

        _token.addGrant(_videoGrant);
        let _TOKEN = _token.toJwt();

        let _path = path.join(__dirname, 'AuthKey_9429G4939H.p8');

        var options = {
          token: {
            key: _path,
            keyId: "9429G4939H",
            teamId: "3TP2627K45"
          },
          production: false
        };

        var service = new apn.Provider(options);
        var note = new apn.Notification();

        note.expiry = Math.floor(Date.now() / 1000) + 60; // Expires 1 minute from now.
        note.badge = 3;
        note.sound = "ping.aiff";
        note.payload = {
          "type": "video_call",
          "caller_name": `${req.user.name}`,
          "room_name": `${roomName}`,
          "caller_image": `${req.user.avatar}`,
          "twi_bridge_token": `${_TOKEN}`,
          "twi_account_sid": `${process.env.TWILIO_SID}`,
          "userId": `${userId}`,
          "identity": `${_identity}`
        },
          note.topic = "com.G-Taxi.athlete.voip";
        note.pushType = "voip";

        service.send(note, voip).then((err, result) => {
          if (err) return console.log(JSON.stringify(err));
          return console.log(JSON.stringify(result))
        });

      } else if (user?.voip && user.role === 'Trainer') {


        let voip = user.voip;

        const _token = new AccessToken(
          process.env.TWILIO_SID,
          process.env.API_KEY,
          process.env.API_KEY_SECRET,
          { identity: _identity }
        );

        const _videoGrant = new VideoGrant({
          room: roomName,
        });

        _token.addGrant(_videoGrant);
        let _TOKEN = _token.toJwt();

        let _path = path.join(__dirname, 'AuthKey_9429G4939H.p8');

        var options = {
          token: {
            key: _path,
            keyId: "9429G4939H",
            teamId: "3TP2627K45"
          },
          production: false
        };

        var service = new apn.Provider(options);
        var note = new apn.Notification();

        note.expiry = Math.floor(Date.now() / 1000) + 60; // Expires 1 minute from now.
        note.badge = 3;
        note.sound = "ping.aiff";
        note.payload = {
          "type": "video_call",
          "caller_name": `${req.user.name}`,
          "room_name": `${roomName}`,
          "caller_image": `${req.user.avatar}`,
          "twi_bridge_token": `${_TOKEN}`,
          "twi_account_sid": `${process.env.TWILIO_SID}`,
          "userId": `${userId}`,
          "identity": `${_identity}`
        },
          note.topic = "com.G-Taxi.Trainer.voip";
        note.pushType = "voip";

        service.send(note, voip).then((err, result) => {
          if (err) return console.log(JSON.stringify(err));
          return console.log(JSON.stringify(result))
        });
      } else if ((user && !user.voip) && user.role === 'Junior-Athlete') {

        const _token = new AccessToken(
          process.env.TWILIO_SID,
          process.env.API_KEY,
          process.env.API_KEY_SECRET,
          // generate a random unique identity for this participant
          { identity: _identity }
        );

        const _videoGrant = new VideoGrant({
          room: roomName,
        });

        _token.addGrant(_videoGrant);
        let _TOKEN = _token.toJwt();






        let deviceToken = user.deviceToken;
        let msg = {
          "to": deviceToken,
          priority: 'high',
          contentAvailable: true,
          timeToLive: 1,
          data: {
            "type": "video_call",
            "caller_name": `${req.user.name}`,
            "room_name": `${roomName}`,
            "caller_image": `${req.user.avatar}`,
            "twi_bridge_token": `${_TOKEN}`,
            "twi_account_sid": `${process.env.TWILIO_SID}`,
            "userId": `${userId}`,
            "identity": `${_identity}`,
            "type": "video_call"
          },
          "notification": {
            "sound": "default",
            "title": `${user.name}`,
            "body": `${req.user.name} calling`,
            "type": "video_call",
            "test": "test"
          }

        }

        fcm.send(msg, function (err, response) {
          if (err) {
            console.log('Something has gone wrong!' + err);
          } else {
            console.log('Successfully sent with response: ', response);
          }
        });




      } else if ((user && !user.voip) && user.role === 'Trainer') {

        const _token = new AccessToken(
          process.env.TWILIO_SID,
          process.env.API_KEY,
          process.env.API_KEY_SECRET,
          { identity: _identity }
        );

        const _videoGrant = new VideoGrant({
          room: roomName,
        });

        _token.addGrant(_videoGrant);
        let _TOKEN = _token.toJwt();

        let deviceToken = user.deviceToken;
        let msg = {
          "to": deviceToken,
          priority: 'high',
          contentAvailable: true,
          timeToLive: 1,
          data: {
            "type": "video_call",
            "caller_name": `${req.user.name}`,
            "room_name": `${roomName}`,
            "caller_image": `${req.user.avatar}`,
            "twi_bridge_token": `${_TOKEN}`,
            "twi_account_sid": `${process.env.TWILIO_SID}`,
            "userId": `${userId}`,
            "identity": `${_identity}`,
            "type": "video_call"
          },
          "notification": {
            "sound": "default",
            "title": `${user.name}`,
            "body": `${req.user.name} calling`,
            "type": "video_call",
            "test": "test"
          }

        }

        fcm.send(msg, function (err, response) {
          if (err) {
            console.log('Something has gone wrong!' + err);
          } else {
            console.log('Successfully sent with response: ', response);
          }
        });


      }
      return res.success({ CallToken, tokenOne: token }, 'Access Token for video chat')
    } catch (err) {
      console.log(err)
      return next(err);
    }

  }
  async RejectVideoCall(req, res, next) {
    try {

      let { userId } = req.query;
      let user = await User.findOne({ _id: userId }).lean();
      if (user?.voip && user.role === 'Junior-Athlete' && user.deviceType === 'ios') {
        let voip = user.voip;

        let _path = path.join(__dirname, 'AuthKey_9429G4939H.p8');
        var options = {
          token: {
            key: _path,
            keyId: "9429G4939H",
            teamId: "3TP2627K45"
          },
          production: false
        };

        var service = new apn.Provider(options);
        var note = new apn.Notification();

        note.expiry = Math.floor(Date.now() / 1000) + 60; // Expires 1 minute from now.
        note.badge = 3;
        note.sound = "ping.aiff";
        note.payload = {
          "type": "video_call_reject",
          "userId": `${userId}`,
        },
          note.topic = "com.G-Taxi.athlete.voip";
        note.pushType = "voip";

        service.send(note, voip).then((err, result) => {
          if (err) return console.log(JSON.stringify(err));
          return console.log(JSON.stringify(result))
        });

      } else if (user?.voip && user.role === 'Trainer' && user.deviceType === 'ios') {


        let voip = user.voip;

        let _path = path.join(__dirname, 'AuthKey_9429G4939H.p8');
        var options = {
          token: {
            key: _path,
            keyId: "9429G4939H",
            teamId: "3TP2627K45"
          },
          production: false
        };

        var service = new apn.Provider(options);
        var note = new apn.Notification();

        note.expiry = Math.floor(Date.now() / 1000) + 60; // Expires 1 minute from now.
        note.badge = 3;
        note.sound = "ping.aiff";
        note.payload = {
          "type": "video_call_reject",
          "userId": `${userId}`,
        },
          note.topic = "com.G-Taxi.Trainer.voip";
        note.pushType = "voip";

        service.send(note, voip).then((err, result) => {
          if (err) return console.log(JSON.stringify(err));
          return console.log(JSON.stringify(result))
        });




      } else if (user.deviceType === 'android') {

        let deviceToken = user.deviceToken;
        let msg = {
          "to": deviceToken,
          priority: 'high',
          contentAvailable: true,
          timeToLive: 1,
          data: {
            "type": "video_call_reject",
            "userId": `${userId}`,
          },
          "notification": {
            "sound": "default",
            "title": ``,
            "body": ``,
            "type": "video_call_reject",
            // "test":"test"
          }

        }

        fcm.send(msg, function (err, response) {
          if (err) {
            console.log('Something has gone wrong!' + err);
          } else {
            console.log('Successfully sent with response: ', response);
          }
        });






      }
      return res.success();
    } catch (err) {
      console.log(err)
      return next(err);
    }
  }

}

module.exports = new RequestController();

function calcCrow(lat1, lon1, lat2, lon2) {
  var R = 6371; // km
  var dLat = toRad(lat2 - lat1);
  var dLon = toRad(lon2 - lon1);
  var lat1 = toRad(lat1);
  var lat2 = toRad(lat2);

  var a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.sin(dLon / 2) * Math.sin(dLon / 2) * Math.cos(lat1) * Math.cos(lat2);
  var c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  var d = R * c;
  return d;
}

// Converts numeric degrees to radians
function toRad(Value) {
  return Value * Math.PI / 180;
}


function _DDATE(session) {
  let curTime = moment(
    session,
    'YYYY-MM-DD HH:mm:ss'
  ).format();

  let offset_ = curTime.substring(19);
  let offset = (session).substring(19);
  let curDate = session.replace(offset, offset_);
  let date = new Date(curDate);

  const monthNames = ["January", "February", "March", "April", "May", "June",
    "July", "August", "September", "October", "November", "December"
  ];


  let _M = monthNames[date.getMonth()];
  let _D = date.getDate();
  let _Y = date.getFullYear();


  let H = date.getHours();
  let _Mi = date.getMinutes();
  var _AMPM = H >= 12 ? 'pm' : 'am';
  H = ((H == 0 ? 12 : (H < 13) ? H : H - 12));
  _Mi = _Mi < 10 ? '0' + _Mi : _Mi;
  _H = H < 10 ? '0' + H : H;

  return { _Mi, _H, _AMPM, _D, _M, _Y }
}

