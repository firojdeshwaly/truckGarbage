const {
  models: { User },
} = require("../../../../app/models");

const { signToken } = require("../../util/auth");
const { utcDateTime, generateOtp, randomString, generateResetToken, generateCode } = require("../../../../lib/util");
var _ = require("lodash");
const jwtToken = require("jsonwebtoken");
const sgMail = require("@sendgrid/mail");
sgMail.setApiKey(process.env.SENDGRID_API_KEY);
let STATUS = process.env.STATUS;
let apiEnv = process.env.NODE_ENV;
let FROM_MAIL = process.env.FROM_MAIL;




class AuthController {
  async logIn(req, res, next) {
    try {
      const {
        email,
        password,
        deviceToken,
        deviceType,
        lat,
        long,
      } = req.body;

      let user = await User.findOne({ email });
      if (!user) { return res.notFound({}, "User does not exist"); } else {
        if (user.isSuspended) { return res.warn({}, "This account is deactivated, please contact admin"); }

        const passwordMatched = await user.comparePassword(password);
        if (!passwordMatched) { return res.warn({}, "Please Check Your Email & Password"); }
        user.authTokenIssuedAt = utcDateTime().valueOf();
        user.deviceToken = deviceToken;
        user.deviceType = deviceType;
        user.isLogin = true;
        let location = [];
        if (lat && long) {
          location.push(long);
          location.push(lat);
          user.loc.coordinates = location;
        }

        let user_ = await user.save();
        const jwttoken = signToken(user_);
        const userJson = user_.toJSON();
        ["password", "authTokenIssuedAt", "otp", "emailToken", "__v"].forEach((key) => delete userJson[key]);
        userJson.jwt = jwttoken;
        return res.success({ user: userJson }, req.__("LOGIN_SUCCESS"));

      }
    } catch (err) {
      return next(err);
    }
  }

  async generateToken(req, res) {
    let _id = req.params._id;
    const user = await User.findOne({ _id });
    const platform = req.headers["x-hrms-platform"];
    const token = signToken(user, platform);
    return res.success({
      token,
    });
  }

  async logOut(req, res) {

    const { user } = req;
    user.authTokenIssuedAt = null;
    user.deviceToken = null;
    user.voip = null;
    await user.save();
    return res.success({}, req.__("LOGOUT_SUCCESS"));

  }
  async verifyOtp(req, res, next) {
    let { otp, email, token } = req.body;
    try {

      let user = await User.findOne({ email, isSuspended: false });
      if (!user) {
        return res.unauthorized(null, req.__("UNAUTHORIZED"));
      } else {
        if (user.emailToken === token) {
          if (user.otp === otp) {

            user.emailVerify = true;
            user.progress = 1;
            let newUser = await user.save();
            const userJson = newUser.toJSON();

            const jwttoken = signToken(user);
            userJson.jwt = jwttoken;
            return res.success({ user: userJson, token: token, }, req.__("OTP_VERIFY_SUCCESS"));
          } else {
            return res.warn({}, req.__("INVALID_OTP"));
          }
        } else if (user.resetToken == token) {
          if (user.otp === otp) {
            user.emailVerify = true;
            let newUser = await user.save();
            const userJson = newUser.toJSON();
            return res.success({ user: userJson, token, }, req.__("OTP_VERIFY_SUCCESS"));
          } else {
            return res.warn({}, req.__("INVALID_OTP"));
          }
        } else {
          return res.send({
            success: false,
            message: "Please enter correct token !",
          });
        }
      }
    } catch (err) {
      return next(err);
    }
  }
  async resendOtp(req, res, next) {
    let { email, token } = req.body;
    try {
      let user = await User.findOne({ email, isSuspended: false });
      if (!user) { return res.unauthorized(null, req.__("UNAUTHORIZED")); }
      if (user) {
        if (user.resetToken === token) {
          let otp = generateOtp();
          user.otp = otp;
          let newUser = await user.save();
          let emailToSend = newUser.email;
          const msg = {
            to: emailToSend,
            from: FROM_MAIL, // Change to your verified sender
            subject: "G-Taxi: Forgot Password OTP",
            text: "Please enter the following OTP to reset your password : " + user.otp,
            html: "<strong>Please enter the following OTP to reset your password :" + user.otp + " </strong>",
          };

          sgMail
            .send(msg)
            .then(() => {
              console.log("Email sent");
              return res.success({ token, }, req.__("OTP_SEND_SUCCESS"));
            })
            .catch((error) => {
              console.error(error);
            });

        } else if (user.emailToken === token) {
          let otp = generateCode();
          user.otp = otp;
          let newUser = await user.save();

          let emailToSend = newUser.email;
          const msg = {
            to: emailToSend,
            from: FROM_MAIL,
            subject: "G-Taxi: Verify  OTP to complete signup",
            text: "Please enter the following OTP to complete your registration : " + user.otp,
            html: "<strong>Please enter the following OTP to complete your registration :" + user.otp + " </strong>",
          };

          sgMail
            .send(msg)
            .then(() => {
              console.log("Email sent");
              return res.success({ token }, req.__("OTP_SEND_SUCCESS"));
            })
            .catch((error) => {
              console.error(error);
            });

        } else {
          return res.warn({}, req.__("Invalid reset tokens"));
        }
      }
    } catch (err) {
      return next(err);
    }
  }
  async signup(req, res, next) {
    let {
      password,
      confirmPassword,
      email,
      name,
      deviceToken,
      deviceType,
      lat,
      role,
      long,
    } = req.body;

    try {

      let x = await User.findOne({ email });
      if (x) {
        if (x.emailVerify && x.isSuspended) {
          return res.warn({}, "Something went wrong");
        } else if (x.emailVerify && !x.isSuspended) {
          return res.warn({}, "Account already exist with this email , please login!");
        } else if (!x.emailVerify) {
          if (password == confirmPassword) {

            let otp = generateCode();
            x.password = password;
            x.name = name;
            x.email = email;

            let location = [];
            if (lat && long) {
              location.push(long);
              location.push(lat);
              x.loc.coordinates = location;
            }
            x.otp = otp;
            x.role = role;
            x.authTokenIssuedAt = utcDateTime().valueOf();
            x.emailToken = generateResetToken(12);
            x.emailVerify = false;

            if (deviceToken) {
              x.deviceToken = deviceToken;
              x.deviceType = deviceType;
            }

            let user = await x.save();

            let emailToSend = user.email;
            let token = user.emailToken;

            const msg = {
              to: emailToSend,
              from: FROM_MAIL, // Change to your verified sender
              subject: "G-Taxi: Verify  OTP to complete signup",
              text: "Please enter the following OTP to verify : " + user.otp,
              html: "<strong>Please enter the following OTP to verify:" + user.otp + "</strong>",
            };

            sgMail
              .send(msg)
              .then(() => {
                console.log("Email sent");

                const userJson = user.toJSON();
                ["password", "authTokenIssuedAt", "otp", "emailToken", "__v",].forEach((key) => delete userJson[key]);
                return res.success({ token, user: userJson, }, "Please verify otp to complete registration");

              })
              .catch((error) => {
                console.error(error);
              });

          } else {
            return res.warn({}, `Password and Confirm Password Doesn't Match `);
          }
        }
      } else {
        let user = new User();
        let otp = generateCode();
        user.otp = otp;
        user.password = password;
        user.name = name;
        user.email = email;
        let location = [];
        if (lat && long) {
          location.push(long);
          location.push(lat);
          user.loc.coordinates = location;
        }
        user.role = role;
        user.authTokenIssuedAt = utcDateTime().valueOf();
        user.emailToken = generateResetToken(12);
        user.emailVerify = false;

        if (deviceToken) {
          user.deviceToken = deviceToken;
          user.deviceType = deviceType;
        }

        user = await user.save();
        let emailToSend = user.email;
        let token = user.emailToken;

        const msg = {

          to: emailToSend,
          from: FROM_MAIL, // Change to your verified sender
          subject: "G-Taxi: Verify  OTP to complete signup",
          text: "Please enter the following OTP to verify your login : " + user.otp,
          html: "<strong>Please enter the following OTP to verify your login :" + user.otp + "</strong>",

        };

        sgMail
          .send(msg)
          .then(() => {
            console.log("Email sent");
            const userJson = user.toJSON();
            ["password", "authTokenIssuedAt", "otp", "emailToken", "__v",].forEach((key) => delete userJson[key]);
            return res.success({ token, user: userJson, }, "Please verify otp to complete registration");
          })
          .catch((error) => {
            console.error(error);
          });
      }
    } catch (err) {
      console.log(err);
      return next(err);
    }
  }
  async forgotPassword(req, res, next) {
    let { email } = req.body;
    try {
      let user = await User.findOne({ email, isSuspended: false });
      if (!user) {
        return res.warn({}, req.__("UNAUTHORIZED"));
      }

      if (user) {
        let resetToken = randomString(10);
        let otp = generateOtp();
        user.resetToken = resetToken;
        user.otp = otp;
        user.authTokenIssuedAt = utcDateTime().valueOf();
        let user_ = await user.save();
        let emailToSend = user.email;

        const msg = {
          to: emailToSend,
          from: FROM_MAIL, // Change to your verified sender
          subject: "G-Taxi: Forgot Password OTP",
          text: "Please enter the following OTP to reset your password : " + user.otp,
          html: "<strong>Please enter the following OTP to reset your password :" + user.otp + " </strong>",
        };


        sgMail
          .send(msg)
          .then(() => {
            console.log("Email sent");
            return res.success({ token: resetToken, email }, req.__("OTP_SEND_SUCCESS"));
          })
          .catch((error) => {
            console.error(error);
          });

      }
    } catch (err) {
      return next(err);
    }
  }
  async resetPassword(req, res, next) {
    let { password, cnfpassword, email, token } = req.body;
    try {
      const user = await User.findOne({ email, isSuspended: false });

      if (!user) {
        return res.unauthorized({}, req.__("This account is deactivated, please contact admin"));
      }
      if (user) {
        if (user.resetToken === token) {
          if (password === cnfpassword) {
            user.password = password;
            let newUser = await user.save();
            return res.success({}, req.__("Password reset sucessfully"));
          } else {
            return res.warn({}, req.__("Password and confirm password must be same !"));
          }
        } else {
          return res.warn({}, req.__("Invalid reset token"));
        }
      }
    } catch (err) {
      return next(err);
    }
  }
  async changePassword(req, res) {
    const { newPassword, confirmPassword } = req.body;
    let user = await User.findOne({ _id: req.user._id });
    const matcheAddedPassword = await user.comparePassword(newPassword);
    if (matcheAddedPassword) {
      return res.send({
        success: false,
        message: "Old password and new passowrd can not be same",
      });
    } else if (newPassword != confirmPassword) {
      return res.send({
        success: false,
        message: "Confirm password doesn't match",
      });
    } else {
      user.password = newPassword;
      await user.save();
      return res.success({}, "Password updated successfully.");
    }
  }


  async socialLogIn(req, res, next) {
    try {
      const {
        email,
        social_type,
        social_id,
        deviceType,
        deviceId,
        deviceToken,
        email_manual,
        firstname,
        lastname,
        mobile,
        image,
      } = req.body;
      let user;
      let profileAdded = false;
      const platform = req.headers["x-G-Taxi-platform"];
      const version = req.headers["x-G-Taxi-version"];
      let msg;

      //Check 1 -- find user with social ID in DB
      user = await User.findOne({ social_id: social_id, isDeleted: false });
      //console.log("=====1=====");
      let timestamp1 = Date.now();
      let showPop = false;

      if (user != null && user.like_time) {
        let timestamp2 = user.like_time;
        var hours = Math.abs(timestamp1 - timestamp2) / 36e5;

        //console.log(hours);
        if (hours > 24) {
          showPop = true;
        } else {
          showPop = false;
        }
      } else {
        showPop = true;
      }
      // let time = 1636693749000;
      //console.log(timestamp2);
      if (!user) {
        //Check 2 --> Check Email exist ?
        //email find if exist or not
        let checkEmailExists = await User.findOne({
          email,
        });
        //console.log("=====2=====");
        if (checkEmailExists && checkEmailExists.email) {
          return res.warn(
            {
              contactExist: true,
              email: checkEmailExists.mobile,
            },
            req.__("EMAIL_EXISTS")
          );
        } else {
          //console.log("=====3=====");
          //Sign up process goes here
          let x = await User.findOne({ email });
          if (!x) {
            let user = new User();
            let otp;
            otp = generateOtp();
            const platform = req.headers["x-G-Taxi-platform"];
            const version = req.headers["x-G-Taxi-version"];
            user.email = email;
            user.password = email + "123";
            user.role = "normal";
            user.otp = otp;
            user.authTokenIssuedAt = utcDateTime().valueOf();
            user.emailToken = generateResetToken(12);
            user.emailVerify = false;

            user.social_id = social_id;
            user.social_type = social_type;
            //user.avatar = image;
            user.firstname = firstname;
            user.lastname = lastname;

            if (deviceToken) {
              user.deviceToken = deviceToken;
              user.deviceType = deviceType;
            }
            let deviceArr = user.deviceId;
            let newDevice = "no";

            if (deviceArr.indexOf(deviceId) !== -1) {
              //console.log("Exists");
              newDevice = "no";
            } else {
              newDevice = "yes";
            }
            user = await user.save();
            let token = user.emailToken;
            let is_skip = user.skipTwoStep;
            let isSkip;
            if (is_skip == true && newDevice == "yes") {
              isSkip = "no";
            } else {
              isSkip = "yes";
            }

            const jwttoken = signToken(user);

            if (newDevice == "yes") {
              let emailToSend = user.email;

              //Construct mail body here
              const msg = {
                to: emailToSend,
                from: "ronie.ochoajr@gmail.com", // Change to your verified sender
                subject: "G-Taxi: Verify Your Device",
                text:
                  "Please enter the following OTP to verify your device : " +
                  user.otp,
                html:
                  "<strong>Please enter the following OTP to verify your device :" +
                  user.otp +
                  " </strong>",
              };

              //Send Email Here
              sgMail
                .send(msg)
                .then(() => {
                  console.log("Email sent");

                  if (user.isSuspended) {
                    return res.warn(
                      {
                        userId: user._id,
                        emailVerified: user.emailVerify,
                        adminVerified: !user.isSuspended,
                      },
                      "Admin has yet to approve verification"
                    );
                  }

                  const userJson = user.toJSON();

                  [
                    "password",
                    "authTokenIssuedAt",
                    "otp",
                    "emailToken",
                    "__v",
                  ].forEach((key) => delete userJson[key]);

                  return res.success(
                    {
                      language: req.headers["accept-language"],
                      token,
                      jwt: jwttoken,
                      user: userJson,
                      newDevice: newDevice,
                      is_skip: isSkip,
                      showPop: showPop,
                    },
                    req.__("LOGIN_SUCCESS")
                  );
                })
                .catch((error) => {
                  console.error(error);
                });
            } else {
              if (user.isSuspended) {
                return res.warn(
                  {
                    userId: user._id,
                    emailVerified: user.emailVerify,
                    adminVerified: !user.isSuspended,
                  },
                  "Admin has yet to approve verification"
                );
              }

              const userJson = user.toJSON();

              [
                "password",
                "authTokenIssuedAt",
                "otp",
                "emailToken",
                "__v",
              ].forEach((key) => delete userJson[key]);
              let is_skip = userJson.skipTwoStep;
              let isSkip;
              if (is_skip == true && newDevice == "yes") {
                isSkip = "no";
              } else {
                isSkip = "yes";
              }

              return res.success(
                {
                  language: req.headers["accept-language"],
                  token,
                  jwt: jwttoken,
                  user: userJson,
                  is_skip: isSkip,
                  showPop: showPop,
                },
                req.__("LOGIN_SUCCESS")
              );
            }
          } else {
            return res.warn("", req.__("EMAIL_EXISTS"));
          }
        }
      } else {
        //Login the user here

        //deviceId  ---> Single Value
        let deviceArr = user.deviceId;
        let newDevice = "no";
        let otp;
        otp = generateOtp();

        user.otp = otp;
        user.emailToken = generateResetToken(12);

        if (deviceArr.indexOf(deviceId) !== -1) {
          //console.log("Exists");
          newDevice = "no";
        } else {
          newDevice = "yes";
        }

        user.authTokenIssuedAt = utcDateTime().valueOf();
        user.deviceToken = deviceToken;
        user.deviceType = deviceType;

        await user.save();

        let token = user.emailToken;

        let is_skip = user.skipTwoStep;
        let isSkip;
        if (is_skip == true && newDevice == "yes") {
          isSkip = "no";
        } else {
          isSkip = "yes";
        }

        const jwttoken = signToken(user);

        if (newDevice == "yes") {
          let emailToSend = user.email;

          //Construct mail body here
          const msg = {
            to: emailToSend,
            from: "ronie.ochoajr@gmail.com", // Change to your verified sender
            subject: "G-Taxi: Verify Your Device",
            text:
              "Please enter the following OTP to verify your device : " +
              user.otp,
            html:
              "<strong>Please enter the following OTP to verify your device :" +
              user.otp +
              " </strong>",
          };

          //Send Email Here
          sgMail
            .send(msg)
            .then(() => {
              console.log("Email sent");

              if (user.isSuspended) {
                return res.warn(
                  {
                    userId: user._id,
                    emailVerified: user.emailVerify,
                    adminVerified: !user.isSuspended,
                  },
                  "Admin has yet to approve verification"
                );
              }

              const userJson = user.toJSON();

              [
                "password",
                "authTokenIssuedAt",
                "otp",
                "emailToken",
                "__v",
              ].forEach((key) => delete userJson[key]);

              return res.success(
                {
                  language: req.headers["accept-language"],
                  token,
                  jwt: jwttoken,
                  user: userJson,
                  newDevice: newDevice,
                  is_skip: isSkip,
                  showPop: showPop,
                },
                req.__("LOGIN_SUCCESS")
              );
            })
            .catch((error) => {
              console.error(error);
            });
        } else {
          if (user.isSuspended) {
            return res.warn(
              {
                userId: user._id,
                emailVerified: user.emailVerify,
                adminVerified: !user.isSuspended,
              },
              "Admin has yet to approve verification"
            );
          }

          const userJson = user.toJSON();

          ["password", "authTokenIssuedAt", "otp", "emailToken", "__v"].forEach(
            (key) => delete userJson[key]
          );
          let is_skip = userJson.skipTwoStep;
          let isSkip;
          if (is_skip == true && newDevice == "yes") {
            isSkip = "no";
          } else {
            isSkip = "yes";
          }

          return res.success(
            {
              language: req.headers["accept-language"],
              token,
              jwt: jwttoken,
              user: userJson,
              is_skip: isSkip,
              showPop: showPop,
            },
            req.__("LOGIN_SUCCESS")
          );
        }
      }
    } catch (err) {
      return next(err);
    }
  }
}

module.exports = new AuthController();
