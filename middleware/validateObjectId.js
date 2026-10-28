const mongoose = require('mongoose');

/**
 * Middleware to validate MongoDB ObjectId in request parameters.
 * Defaults to validating 'id', but can accept a custom param name.
 */
const validateObjectId = (paramName = 'id') => {
  return (req, res, next) => {
    const id = req.params[paramName];
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        success: false,
        message: `Invalid ID format: '${id}' is not a valid MongoDB ObjectId`,
      });
    }
    next();
  };
};

module.exports = validateObjectId;

