const express = require("express");
const morgan = require("morgan");
const userRouter = require("./Routes/userRoute");
const translateRouter = require("./Routes/translateRoute");
const AppError = require("./utils/AppError");
const bodyParser = require("body-parser");
const globalErrorHandler = require("./Middleware/errorMiddleware");

const app = express();

if (process.env.NODE_ENV === "development") {
  app.use(morgan("dev"));
}

app.use(express.json({ limit: "10kb" }));

//Mounted Routes
app.use("/api/v1/users", userRouter);
app.use("/api/v1/", translateRouter);

//Handle unrouted routes with express
app.use("*", (req, res, next) => {
  next(new AppError(`Can't Find this URL ${req.originalUrl}`, 400));
});

app.use(globalErrorHandler);

module.exports = app;
