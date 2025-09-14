
import { UserModel,providerEnum } from "../../DB/models/User.model.js"
import { successResponse,asyncHandler } from "../../utils/response.js";
import * as DBService from "../../DB/db.service.js"
import {generateHash,compareHash}from "../../utils/security/hash.security.js"
import { generateEncryption } from "../../utils/security/encryption.security.js";
import jwt from "jsonwebtoken"
import bcrypt from "bcryptjs";
import { generaLoginCredentials} from "../../utils/security/token.security.js"; // غيّر المسار حسب مكان الملف
import  {OAuth2Client} from 'google-auth-library'
import { emailEvent } from "../../utils/events/email.event.js";
import { customAlphabet } from "nanoid";
// import { v4 as uuidv4 } from "uuid";




export const signup = asyncHandler(
    async (req, res, next) => {
        const {firstName,lastName,email,password,phone,gender,age}= req.body;
        const hashPassword = await generateHash({plaintext: password})
        const encPhone = await generateEncryption({plaintext:phone})
        const otp = customAlphabet("1234567890", 6)();
        const confirmEmailOtp = await generateHash({plaintext:otp})
        const verificationCode = await generateHash({plaintext:otp})
        const verificationCodeExpireAt = new Date(Date.now() + 5*60*1000) // 5 minutes
        const user = await DBService.create({
            model:UserModel,
            data:[{
                firstName,
                lastName,
                email,
                password:hashPassword,
                phone:encPhone,
                gender,
                age,
                confirmEmailOtp, 
                verificationCode:confirmEmailOtp,
                verificationCodeExpireAt,
                isEmailConfirmed:false,
                failedLoginAttempts:0,
                banUntil:null,
                
            }]
        })
        

        emailEvent.emit("conFirmEmail",{
            email,
            otp:otp,

        })
        return successResponse({res, status:201,data:{user}})
    }
)

export const conFirmEmail = asyncHandler(
    async (req, res, next) => {
        const {email,otp}= req.body;
        const user = await DBService.findOne({
            model:UserModel,
            filter:{
                email,
                confirmEmailOtp:{$exists:true},
                confirmEmail:{$exists:false},
            }
        })
        if (!user) {
            return next(new Error("in-valid account or already verified",{cause:404}))
        }
        if (user.isEmailConfirmed) {
            return next(new Error("Account already verified",{cause:429}))
        }
        if (user.banUntil && user.banUntil > Date.now()) {; 
            const waitTime = Math.ceil((user.banUntil - Date.now()) / (60 * 1000));
            return next(new Error(`Too many failed attempts. Please try again after ${waitTime} minutes.`, { cause: 429 }));
        }
        if (!user.verificationCode || user.verificationCodeExpireAt < Date.now()) {
            return next(new Error("OTP Expired",{cause:429}))
        }
        
        if (!(await compareHash({plaintext:otp,hashValue:user.confirmEmailOtp}))) {
            user.failedLoginAttempts += 1;
            if (user.failedLoginAttempts >= 5) {
                user.banUntil = new Date(Date.now() + 5 * 60 * 1000); 
            }
            await user.save();
            return next(new Error("in-valid OTP",{cause:404}))
        }
        

        const updateUser = await DBService.updateOne({
            model:UserModel,
            filter:{email}, 
            data:{
                confirmEmail:Date.now(),
                isEmailConfirmed:true,
                failedLoginAttempts:0,
                banUntil:1,
                $unset:{
                    confirmEmailOtp:true,
                    verificationCode:0,
                    verificationCodeExpireAt:0,
                },
                $inc:{__v:1}
            }
        })
        return updateUser.matchedCount? successResponse({res, status:200,data:{}})
        : next(new Error("Fail to verify account",{cause:400}))
    }
)

export const login = asyncHandler(
    async (req, res, next) => {
        const {email, password} = req.body;
        const user = await DBService.findOne({
            model: UserModel,
            filter: { email},
            // select:"-password"
        });
        if (!user) {
            return next(new Error("Invalid Email or Password",{cause:404}))
        }

        if (!user.confirmEmail) {
            return next("Please confirm your email",{cause:400})
        }
        if (user.deleteAt) {
            return next("this account is deleted",{cause:400})
        }

        // can i remove match put in if after =?
        const match = await compareHash({plaintext:password,hashValue: user.password})
        if (!match) {
            return next(new Error("Invalid login Data",{cause:404}))
        }

            const credentials = await generaLoginCredentials({user})
            return successResponse({res,data:{credentials}})
    }
)

export const refreshToken = asyncHandler(
    async (req, res, next) =>{
        const { refreshtoken } = req.headers;
        const decoded = jwt.verify(refreshtoken, process.env.REFRESH_USER_TOKEN_SIGNATURE);
        if (!decoded || !decoded._id ) {
            throw new Error("Invalid refresh token");
        }
        const user = await DBService.findById({ 
            model: UserModel,
            id: {
                _id: decoded._id 
            }
        });
        if (!user) {
            throw new Error("User not found");
        }
        const ACCESS_SIG = user.role === "system"
        ? process.env.ACCESS_SYSTEM_TOKEN_SIGNATURE
        : process.env.ACCESS_USER_TOKEN_SIGNATURE;

        const access_token = jwt.sign({
            _id: user._id,
            role:user.role 
        }, 
        process.env.REFRESH_USER_TOKEN_SIGNATURE, 
        { 
            expiresIn: Number(process.env.ACCESS_TOKEN_EXPIRES_IN),
            jwtid:uuidv4(),
        });
        return successResponse({res,status:200,data:{access_token}});
    }
)

export const sendForgotPassword = asyncHandler(
    async (req, res, next) => {

        const {email} = req.body;
        const otp =  customAlphabet("0123456789",6)()
        const user = await DBService.findOneAndUpdate({
            model:UserModel,
            filter:{
                email,
                confirmEmail:{$exists:true},
                deleteAt:{$exists:false},
                provider:providerEnum.system,
            },
            data:{
                forgotPasswordOtp: await generateHash({plaintext:otp})
            }
        })
        if (!user) {
            return next(new Error("in-valid account ",{cause:404}))
        }
        emailEvent.emit("SendForgotPassword",{to:email,subject: "Forgot Password",title:"Reset-Password",otp})
        return successResponse({res})
    }
)

export const verifyForgotPassword = asyncHandler(
    async (req, res, next) => {

        const {email,otp} = req.body;
        const user = await DBService.findOne({
            model:UserModel,
            filter:{
                email,
                confirmEmail:{$exists:true},
                deleteAt:{$exists:false},
                forgotPasswordOtp:{$exists:true},
                provider:providerEnum.system,
            }
        })
        if (!user) {
            return next(new Error("in-valid account ",{cause:404}))
        }
        if (!await compareHash({plaintext:otp,hashValue:user.forgotPasswordOtp})) {
            return next(new Error("in-valid otp ",{cause:400}))
        }
        return successResponse({res})
    }
)

export const resetPassword = asyncHandler(
    async (req, res, next) => {

        const {email,otp,password} = req.body;
        const user = await DBService.findOne({
            model:UserModel,
            filter:{
                email,
                confirmEmail:{$exists:true},
                deleteAt:{$exists:false},
                forgotPasswordOtp:{$exists:true},
                provider:providerEnum.system,
            }
        })
        if (!user) {
            return next(new Error("in-valid account ",{cause:404}))
        }
        if (!await compareHash({plaintext:otp,hashValue:user.forgotPasswordOtp})) {
            return next(new Error("in-valid otp ",{cause:400}))
        }
        await DBService.updateOne({
            model:UserModel,
            filter:{
                email,
            },
            data:{
                password: await generateHash({plaintext:password}),
                changeCredentialsTime:new Date(),
                $unset:{
                    forgotPasswordOtp:1
                }
            }
        })
        return successResponse({res})
    }
)

async function verifyGoogleAccount({idToken}={}) {
    const client = new OAuth2Client();
    const ticket = await client.verifyIdToken({
        idToken,
        audience: process.env.WEB_CLIENT_IDS.split(",") 
    });
    const payload = ticket.getPayload();
    return payload;
}
export const loginWithGmail = asyncHandler(
    async (req, res, next) => {

        const {idToken}= req.body;
        const {email,email_verified} = await verifyGoogleAccount({idToken})
        if (!email_verified) {
            return next(new Error("Your Google Account is not verified",{cause:400}))
        }

        const user = await DBService.findOne({
            model:UserModel,
            filter:{email,provider:providerEnum.google}
        })

        if (!user) {
            return next(new Error("in-valid login data or in-valid provider ",{cause:404}))
        }

        const credentials = await generaLoginCredentials({user})
        return successResponse({res, status:200,data:{credentials}})
    }
)
export const signupWithGmail = asyncHandler(
    async (req, res, next) => {
        const {idToken}= req.body;
        const {picture,name,email,email_verified} = await verifyGoogleAccount({idToken})
        if (!email_verified) {
            return next(new Error("Your Google Account is not verified",{cause:400}))
        }

        const user = await DBService.findOne({
            model:UserModel,
            filter:{email,provider:providerEnum.system}
        })
        
        if (user) {
            if (user.provider === providerEnum.google) {
                const credentials = await generaLoginCredentials({user})
                return successResponse({res, status:200,data:{credentials}})
                // return loginWithGmail(req, res, next) //anther way and AND we use the same function
            }
            return next(new Error("Email Exist",{cause:409}))
        }


        const [newUser] = await DBService.create({
            model:UserModel,
            data:[{
                firstName:name,
                lastName:name,
                email,
                picture,
                confirmEmail: Date.now(),
                provider: providerEnum.google
            }]
        })

        const credentials = await generaLoginCredentials({user:newUser})
        return successResponse({res, status:201,data:{credentials}})
        //return successResponse({res, status:201,data:{user:newUser._id}})
    }
)


