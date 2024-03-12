const { Joi} = require('../../../util/validations');

const requireId = Joi.object().keys({
    id: Joi.objectId()
        .valid()
        .required(),
});

const updateStatus = Joi.object().keys({
    id: Joi.objectId()
        .valid()
        .required(),
    status: Joi.boolean().required(),
});

const updateUserType = Joi.object().keys({
    id: Joi.string().required(),
    envs: Joi.string().required()
});

module.exports = {
    updateStatus,
    requireId,
    updateUserType
};
