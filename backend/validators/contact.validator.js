// import Joi from "joi";

// export const createContactSchema = Joi.object({
//   firstName: Joi.string().trim().required(),
//   lastName: Joi.string().trim().required(),
//   email: Joi.string().email().required(),
//   subject: Joi.string().trim().required(),
//   message: Joi.string().trim().min(5).required()
// });

import Joi from "joi";

export const createContactSchema = Joi.object({
  firstName: Joi.string().trim().required(),
  lastName: Joi.string().trim().required(),
  email: Joi.string().email().required(),
  subject: Joi.string().trim().required(),
  message: Joi.string().trim().min(10).required() // Changed from min(5) to min(10)
});