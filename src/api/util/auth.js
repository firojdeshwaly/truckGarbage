const jwt = require('jsonwebtoken');
const {
    models: { User, Vendor },
} = require('../../../app/models');

const { getPlatform } = require('./common');

const signToken = (user,platform) => {
    const payload = {
        sub: user._id,
        phoneNumber: user.phoneNumber,
        iat: user.authTokenIssuedAt,
        role: user.role
    };
    return jwt.sign(payload, process.env.JWT_SECRET);
};

const signTempToken = (user) => {
    const payload = {
        id: user._id,
    };
    return jwt.sign(payload, process.env.JWT_SECRET_TEMP);
};

const verifyToken = (req, res, next) => {
    
    jwt.verify(req.headers['authorization'], process.env.JWT_SECRET, async (err, decoded) => {
       
        const platform = req.headers['x-G-Taxi-platform'];

        if (err || !decoded || !decoded.sub) {
            console.log("----------------------")
            return res.unauthorized(null, req.__('UNAUTHORIZED'));
        }
        console.log("=========================",decoded.sub)
        const user = await User.findOne({
            _id: decoded.sub,
            isDeleted: false,
            isSuspended:false,
            phoneNumber:decoded.phoneNumber
            
        });


        console.log("-=-=-=-=user",user)
        if (!user) {
            console.log("++++++++++++++++++++++++++++++++++++++")
            return res.send({
                success:"deactivated",
                status:"deactivated",
                message:req.__('UNAUTHORIZED')
            });
        }

        if (user.isSuspended) {
            //return res.unauthorized(null, 'Admin has deactivated your account');
            return res.send({
                success:"deactivated",
                status:"deactivated",
                message:"Admin has deactivated your account"
            });
        }

        req.role = user['role'];
        req._id = user['_id'];
        req.user = user;
        next();
    });
}




module.exports = {
    signToken,
    signTempToken,
    verifyToken
};
