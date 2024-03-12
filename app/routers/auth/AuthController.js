const {
  models: { Admin, User, Page },
} = require("./../../models");
const { generateResetToken, logError } = require("../../../lib/util");
const { signToken } = require("../../../util/auth");
const { utcDateTime } = require("../../../lib/util");
const sgMail = require("@sendgrid/mail");
sgMail.setApiKey(process.env.SENDGRID_API_KEY);
class AuthController {
  async logInPage(req, res) {
    if (req.session.user) {
      return res.redirect("/");
    }

    return res.render("login");
  }
  async logIn(req, res) {
    if (req.session.user) {
      return res.redirect("/");
    }
    const { email, password } = req.body;
    const admin = await Admin.findOne({ email, isDeleted: false });
    if (!admin) {
      req.flash("error", req.__("Invalid credentials"));
      return res.redirect("/auth/log-in");
    }
    if (admin.isSuspended) {
      req.flash("error", req.__("Your account is suspended"));
      return res.redirect("/auth/log-in");
    }
    const passwordMatched = await admin.comparePassword(password);

    if (!passwordMatched) {
      req.flash("error", req.__("Invalid credentials"));
      return res.redirect("/auth/log-in");
    }

    admin.authTokenIssuedAt = utcDateTime().valueOf();
    await admin.save();
    const adminJson = admin.toJSON();
    const token = signToken(admin);
    req.session.user = adminJson;
    req.session.token = token;
    req.flash("success", req.__("Login success"));
    return res.redirect("/");
  }
  async logout(req, res) {

    req.session.user = null;
    return res.redirect("/auth/log-in");
  }
  async dashboard(req, res) {
    const driver_count = await User.countDocuments({
      isDeleted: false,
      role: "Driver",
    });
    let driver = await User.find({
      isDeleted: false,
      role: "Driver",
    })
      .sort({ created: "desc" })
      .limit(5)
      .lean();
    const user_count = await User.countDocuments({
      isDeleted: false,
      role: "User",
    });
    let users = await User.find({
      isDeleted: false,
      role: "User",
    })
      .sort({ created: "desc" })
      .limit(5)
      .lean();

    return res.render("index", {
      driver_count,
      driver,
      user_count,
      users,
    });
  }
  async profilePage(req, res) {
    let admin = await Admin.findOne({ isDeleted: false });
    return res.render("profile", {
      admin,
    });
  }
  async profile(req, res) {
    let admin = await Admin.findOne({ isDeleted: false });
    const { firstName, lastName, email, contactNumber } = req.body;
    admin.firstName = firstName;
    admin.lastName = lastName;
    admin.email = email;
    admin.contactNumber = contactNumber;
    await admin.save();
    req.flash("success", req.__("Profile update"));
    return res.redirect("/profile");
  }
  async changePasswordPage(req, res) {
    console.log("Change-Password");
    return res.render("change-password");
  }
  async changePassword(req, res) {
    const { user } = req;
    const { currentPassword, newPassword, confirmPassword } = req.body;
    const passwordMatched = await user.comparePassword(currentPassword);
    if (!passwordMatched) {
      req.flash("error", req.__("Password match failure"));
      return res.redirect("/change-password");
    } else if (newPassword !== confirmPassword) {
      req.flash("error", req.__("New password and confirm password is same"));
      return res.redirect("/change-password");
    } else if (currentPassword == confirmPassword) {
      req.flash("error", req.__("Current password and New password is same"));
      return res.redirect("/change-password");
    }
    user.password = newPassword;
    await user.save();
    req.flash("success", req.__("Password changed"));
    return res.redirect("/change-password");
  }
  async forgotPasswordPage(req, res) {
    if (req.session.user) {
      return res.redirect("/");
    }
    return res.render("forgot-password");
  }
  async forgotPassword(req, res) {
    if (req.session.user) {
      return res.redirect("/");
    }
    const { email } = req.body;
    const admin = await Admin.findOne({
      email,
      isDeleted: false,
    });
    console.log(admin);
    if (!admin) {
      req.flash("error", req.__("User not found"));
      return res.redirect("/auth/forgot-password");
    }


    if (admin.isSuspended) {
      req.flash("error", req.__("Your account suspended"));
      return res.redirect("/auth/forgot-password");
    }
    admin.resetToken = generateResetToken();
    await admin.save();

    req.flash("success", req.__("Forgot password mail success"));
    const msg = {
      to: email,
      from: "baldianupamdev@yopmail.com",
      subject: "Vital-link: Forgot Password OTP",
      text: `Please enter the following OTP to reset your password : ${admin.resetToken}`,
      html: `<strong>Please enter the following Link to reset your password : ${process.env.SITE_URL}/auth/reset-password?email=${email}</strong>`,
    };
    sgMail
      .send(msg)
      .then(() => {
        console.log("Email sent");
        req.flash("success", req.__("Forgot password mail success"));
        return res.redirect("/auth/forgot-password");
      })
      .catch((error) => {
        console.error("err", error);
      });
  }
  async resendOTP(req, res) {
    if (req.session.user) {
      return res.redirect("/");
    }
    const { email } = req.query;
    const admin = await Admin.findOne({
      email,
      isDeleted: false,
    });
    if (!admin) {
      req.flash("error", req.__("User not found"));
      return res.redirect("/auth/forgot-password");
    }
    if (admin.isSuspended) {
      req.flash("error", req.__("Your account suspended"));
      return res.redirect("/auth/forgot-password");
    }
    admin.resetToken = generateResetToken();
    await admin.save();
    req.flash("success", req.__("Forgot password mail success"));
    res.render("sendotp", { email, msg: true });
    const msg = {
      to: email,
      from: "baldianupamdev@yopmail.com", // Change to your verified sender
      subject: "Din-Din: Forgot Password OTP",
      text: `Please enter the following OTP to reset your password : ${admin.resetToken}`,
      html: `<strong>Please enter the following Link to reset your password : ${process.env.SITE_URL}/auth/reset-password?email=${email}</strong>`,
    };
    sgMail
      .send(msg)
      .then(() => {
        console.log("Email sent");

        return res.redirect("/auth/reset-password");
      })
      .catch((error) => {
        console.error(error);
      });
  }
  async validateOTP(req, res) {
    const { email } = req.query;
    const otp = req.body.otp;
    const admin = await Admin.findOne({
      email,
      isDeleted: false,
    });
    if (admin.resetToken == otp) {
      return res.redirect("/auth/reset-password?email=" + email);
    } else {
      return res.render("sendotp", { email, msg: false });
    }
  }
  async resetPasswordPage(req, res) {
    if (req.session.user) {
      return res.redirect("/");
    }
    const { email } = req.query;
    if (!email) {
      req.flash("error", req.__("Invalid reset pass request"));
      return res.redirect("/auth/forgot-password");
    }
    const admin = await Admin.findOne({
      email,
      isDeleted: false,
    });
    console.log("admin" + admin);
    if (!admin || !admin.resetToken) {
      req.flash("error", req.__("Invalid reset pass request"));
      return res.redirect("/auth/forgot-password");
    }
    if (admin.isSuspended) {
      req.flash("error", req.__("Your account suspended"));
      return res.redirect("/auth/forgot-password");
    }
    return res.render("reset-password", { email });
  }
  async resetPassword(req, res) {
    if (req.session.user) {
      return res.redirect("/");
    }
    const { email } = req.query;
    const { newPassword } = req.body;
    if (!email) {
      req.flash("error", req.__("Invalid reset pass request"));
      return res.redirect("/auth/forgot-password");
    }
    const admin = await Admin.findOne({
      email,
      isDeleted: false,
    });
    if (!admin) {
      req.flash("error", req.__("User not found"));
      return res.redirect("/auth/forgot-password");
    }
    if (admin.isSuspended) {
      req.flash("error", req.__("Your account suspended"));
      return res.redirect("/auth/forgot-password");
    }
    admin.password = newPassword;
    admin.resetToken = null;
    await admin.save();
    req.flash("success", req.__("Password changed"));
    return res.redirect("/auth/log-in");
  }
  async privacy_policyPage(req, res) {
    let cms = await Page.findOne({ slug: "privacy-policy" });
    console.log(cms);
    const content = cms.description;
    const name = cms.title;
    const id = cms._id;
    res.render("layouts/static", { name, content, id });
  }
  async termsAndconditionPage(req, res) {
    console.log("privacy");
    let cms = await Page.findOne({ slug: "terms-conditions" });
    console.log(cms);
    const content = cms.description;
    const name = cms.title;
    const id = cms._id;
    res.render("layouts/static", { name, content, id });
  }
  async Aboutus(req, res) {
    let cms = await Page.findOne({ slug: "about-us" });
    console.log(cms);
    const content = cms.description;
    const name = cms.title;
    const id = cms._id;
    res.render("layouts/static", { name, content, id });
  }
  async refundCancellation(req, res) {
    let cms = await Page.findOne({ slug: "refund-cancellation" });
    console.log(cms);
    const content = cms.description;
    const name = cms.title;
    const id = cms._id;
    res.render("layouts/static", { name, content, id });
  }
  async Faq(req, res) {
    let cms = await Page.findOne({ slug: "faq" });
    console.log(cms);
    const content = cms.description;
    const name = cms.title;
    const id = cms._id;
    res.render("layouts/static", { name, content, id });
  }
  async contactUs(req, res) {
    let cms = await Page.findOne({ slug: "contact-us" });
    console.log(cms);
    const content = cms.description;
    const name = cms.title;
    const id = cms._id;
    res.render("layouts/static", { name, content, id });
  }
  async Static(req, res) {
    const id = req.query.id;
    let originalString = req.body.content;
    const cms = await Page.findOneAndUpdate(
      { _id: id },
      { description: originalString },
      { new: true }
    );
    if (cms.slug == "terms-conditions") {
      req.flash("success", req.__("Successfully updated"));
      res.redirect("/auth/terms_conditions");
    } else if (cms.slug == "privacy-policy") {
      req.flash("success", req.__("Successfully updated"));
      res.redirect("/auth/privacy_policy");
    } else if (cms.slug == "about-us") {
      req.flash("success", req.__("Successfully updated"));
      res.redirect("/auth/about_us");
    } else if (cms.slug == "faq") {
      req.flash("success", req.__("Successfully updated"));
      res.redirect("/auth/faq");
    } else if (cms.slug == "contact-us") {
      req.flash("success", req.__("Successfully updated"));
      res.redirect("/auth/contact-us");
    } else if (cms.slug == "refund-cancellation") {
      req.flash("success", req.__("Successfully updated"));
      res.redirect("/auth/refund_cancellation");
    }
  }

  async CreateAdmin(req, res) {

    let admin = new Admin({
      email: "admin@example.com",
      password: "Admin@1234",
      firstName: "Admin"
    });

    await admin.save();
    return res.send("Successfully created");
  }
}
module.exports = new AuthController();
