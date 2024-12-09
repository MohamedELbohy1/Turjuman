const globalErrorHandler = (err, req, res, next) => {
  console.log(err.statusCode);
  err.statusCode = err.statusCode || 500;
  err.status = err.status || "Error";

  if (process.env.NODE_ENV === "development") {
    sendErrorForDev(err, res);
  } else process.env.NODE_ENV === "producation";
  sendErrorForProd(err, res);
};

const sendErrorForDev = (err, res) => {
    res.status(err.statusCode).json({
      status: err.status,
      message: err.message,
      err,
      stack: err.stack,
    });
  };
  
  const sendErrorForProd = (err, res) => {
    res.status(err.statusCode).json({
      status: err.status,
      message: err.message,
    });
  };
  
  module.exports = globalErrorHandler;
  