// joiMiddleware.js

const Joi = require('joi');

const registerUserSchema = Joi.object({
  first_name: Joi.string().min(3).max(30).required(),
  last_name: Joi.string().min(3).max(30).required(),
  age: Joi.number().integer().min(1).max(150).required(),
  address: Joi.string().min(5).max(100).required(),
  email: Joi.string().email().required(),
});

function validatePayload(req, res, next) {
  const payload = req.body;

  //// Validate the payload against the schema
  const { error } = registerUserSchema.validate(payload);
  if (error) {
    return res.status(400).json({ error: error.details[0].message });
  }

  //// If the payload is valid, continue to the next middleware/route handler
  next();
}

module.exports = {
    validatePayload,
};
