const mongoose = require("mongoose");
const userRouter = require("./Routes/userRoute");
const dotenv = require("dotenv");
dotenv.config({ path: "./config.env" });

const app = require("./app");

mongoose
  .connect(process.env.DB_URL)
  .then((con) => {
    console.log("DB Connected Succssefly");
  })
  .catch((err) => {
    console.log(`There was and error ${err}`);
    process.exit(1);
  });

// Server
const port = 8001;

const server=app.listen(port, () => {
  console.log(`Server is runing on port ${port}`);
});

// Events ==> list ==> callback(err)
// Error outside express errors
process.on("uncaughtException", (err) => {
  console.log(`uncaughtException error: ${err.name}|${err.message}`);
  server.close(() => {
    console.log("Shutting Down The Server....");
    process.exit(1);
  });
});