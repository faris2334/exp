const Joi = require('joi');

const signUpSchema = {
    body: Joi.object({
        first_name: Joi.string().pattern(/^[a-zA-Z0-9ء-ي\s]{2,50}$/).trim().min(2).max(50).required(),
        last_name: Joi.string().pattern(/^[a-zA-Z0-9ء-ي\s]{2,50}$/).trim().min(2).max(50).required(),
        email: Joi.string().email().required(),
        password: Joi.string().pattern(/^(?=.*[A-Za-z])(?=.*\d)[A-Za-z\d@$!%*?&#^]{8,}$/).required(),
    }).required(),
};

const signInSchema = {
    body: Joi.object({
        email: Joi.string().email(),
        password: Joi.string().pattern(/^(?=.*[A-Za-z])(?=.*\d)[A-Za-z\d@$!%*?&#^]{8,}$/),
    }).required(),
};

module.exports = {signUpSchema ,signInSchema};