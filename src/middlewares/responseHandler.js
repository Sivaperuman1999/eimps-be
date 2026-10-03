export const responseHandler = (req, res, next) => {
  // Override the default json method to format success responses
  res.sendSuccess = (data, statusCode = 200) => {
    return res.status(statusCode).json({
      success: true,
      data: data,
    });
  };
  
  next();
};
