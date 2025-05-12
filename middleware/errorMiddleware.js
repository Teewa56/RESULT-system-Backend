const errorMiddleware = (err, req, res, next) => {
    console.error(err.stack);
    const statusCode = err.statusCode || 500;
    const message = err.message || "Internal Server Error";
    res.status(statusCode).json({
        success: false,
        error: {
            status: statusCode,
            message,
        },
    });
};
  
module.exports = errorMiddleware;