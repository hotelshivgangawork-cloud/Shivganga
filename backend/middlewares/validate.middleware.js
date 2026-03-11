// const parseJSONFields = (obj) => {
//   for (const key in obj) {
//     if (typeof obj[key] === "string") {
//       try {
//         const parsed = JSON.parse(obj[key]);
//         if (Array.isArray(parsed) || typeof parsed === "object") {
//           obj[key] = parsed;
//         }
//       } catch (err) {
//       }
//     }
//   }
// };

// const validate = (schema, property) => {
//   return (req, res, next) => {
//     if (property === "body" && req.is("multipart/form-data")) {
//       parseJSONFields(req.body);
//     }

//     const { error, value } = schema.validate(req[property], {
//       abortEarly: false,
//       stripUnknown: true
//     });

//     if (error) {
//       return res.status(400).json({
//         success: false,
//         message: `${property} validation failed`,
//         errors: error.details.map(err => ({
//           field: err.path.join("."),
//           message: err.message
//         }))
//       });
//     }

//     req[property] = value;
//     next();
//   };
// };

// export const validateBody = (schema) => validate(schema, "body");
// export const validateQuery = (schema) => validate(schema, "query");
// export const validateParams = (schema) => validate(schema, "params");

const parseJSONFields = (obj) => {
  for (const key in obj) {
    if (typeof obj[key] === "string") {
      try {
        const parsed = JSON.parse(obj[key]);
        if (Array.isArray(parsed) || typeof parsed === "object") {
          obj[key] = parsed;
        }
      } catch (err) {
        // Ignore parsing errors, keep original string
      }
    }
  }
};

const validate = (schema, property) => {
  return (req, res, next) => {
    if (property === "body" && req.is("multipart/form-data")) {
      parseJSONFields(req.body);
    }

    const { error, value } = schema.validate(req[property], {
      abortEarly: false,
      stripUnknown: true,
      errors: {
        wrap: {
          label: false
        }
      }
    });

    if (error) {
      const errors = error.details.map(err => {
        let message = err.message;
        
        // Customize validation messages for better user experience
        if (err.type === 'string.min' && err.path.includes('message')) {
          message = 'Message must be at least 10 characters long';
        } else if (err.type === 'string.email') {
          message = 'Please enter a valid email address';
        } else if (err.type === 'any.required') {
          message = `${err.path.join('.')} is required`;
        }
        
        return {
          field: err.path.join("."),
          message: message
        };
      });

      return res.status(400).json({
        success: false,
        message: "Validation failed",
        errors: errors
      });
    }

    req[property] = value;
    next();
  };
};

export const validateBody = (schema) => validate(schema, "body");
export const validateQuery = (schema) => validate(schema, "query");
export const validateParams = (schema) => validate(schema, "params");