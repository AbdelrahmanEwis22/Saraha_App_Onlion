import path from "node:path";
import * as dotenv from "dotenv"
// dotenv.config({path:path.join('./src/config/.env.dev')})
dotenv.config({})
import express from "express";
import connectDB from "./DB/connection.db.js";
import authController from './Modules/auth/auth.controller.js'
import userController from './Modules/user/user.controller.js'
import  messageController from './Modules/message/message.controller.js'
import { globalErrorHandling } from "./utils/response.js";
//import { successResponse } from "./utils/response.js";
import { sendEmail } from "./utils/email/send.email.js";
import cors from "cors";
import helmet from "helmet";
import { rateLimit } from 'express-rate-limit'
import joi from 'joi'
const bootstrap = async () => {
    const app = express();
    const port = process.env.PORT || 5000;

  //CORS give access to frontend to can use backend mine
    // var whitelist = process.env.ORIGIN.split(",") || []
    // var corsOptions = {
    //   origin: function (origin, callback) {
    //   if (whitelist.indexOf(origin) !== -1) {
    //     callback(null, true)
    //     } else {
    //       callback(new Error('Not allowed by CORS'))
    //     }
    //   }
    // }
    app.use(cors())
    app.use(helmet())

    const limiter = rateLimit({
      windowMs:60 * 1000,
      limit:5,
      message:{error:"اهدي يا فلاح شوي تعبتني"},
      statusCode:429,
      handler:(req,res,next,options)=>{
        return res.status(options.statusCode).json(options.message)
      }
    })
    app.use("/auth",limiter)
  //DB
    await connectDB()
    app.use("/uploads",express.static(path.resolve("./src/uploads")))
  //convert buffer json data
    app.use(express.json());
  //app-routing
    app.get("/", (req, res) => res.json({ message: "Welcome to blog app ❤️" }));
    app.use('/auth', authController)
    app.use('/user', userController)
    app.use('/message', messageController)

    app.all("{/*dummy}", (req, res) =>res.status(404).json({ message: "In-valid app routing ❌" }));
    app.use(globalErrorHandling)

    await sendEmail({
        to: "abdelrahman.ewis@gmail.com",
        subject: "Test Email from Saraha App",
        text: "This is a test email sent from the Saraha App using Node.js and Nodemailer.",
        html: "<h1>This is a test email</h1><p>Sent from the Saraha App using Node.js and Nodemailer.</p>"
    })
    return app.listen(port, () => console.log(`Example app listening on port ${port}!`))
};
export default bootstrap