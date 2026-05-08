import fs from 'fs';
export const errorMiddleware = (err, req, res, next) => {
  const errorLog = `${new Date().toISOString()} - ERROR: ${err.message}\n${err.stack}\n\n`;
  fs.appendFileSync('error.log', errorLog);
  console.error("ERROR ", err);

  res.status(err.statusCode || 500).json({
    success: false,
    message: err.message || "Internal Server Error"
  });
};
