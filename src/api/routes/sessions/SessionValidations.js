const { Joi, common } = require('../../util/validations');

const addRest = Joi.object().keys({
    email: Joi.string().required(),
    password: Joi.string().required(),
    deviceToken: Joi.string().trim().optional().allow(''),
    role : Joi.string().trim().required()
});

module.exports = {
    addRest
};
