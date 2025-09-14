import joi from "joi";
import { generalFields } from "../../middleware/validation.middleware.js";

export const login = {
    body:joi.object().keys({
        
        email: generalFields.email.required(),
        password: generalFields.password.required(),
    }).required().options({allowUnknown:false}),
}

export const signup = {
    body:login.body.append({
        
        fullName: generalFields.fullName,
        firstName: generalFields.firstName.required(),
        lastName: generalFields.lastName.required(),
        email: generalFields.email.required(),
        password: generalFields.password.required(),
        confirmPassword: generalFields.confirmPassword.required(),
        gender: generalFields.gender,
        phone: generalFields.phone.required(), // Adjust pattern as per your requirements
        age: generalFields.age.required(),
    }).required().options({allowUnknown:false}),
}

export const confirmEmail = {
    body:joi.object().keys({
        email: generalFields.email.required(),
        otp: generalFields.otp.required(),
    })
}
export const loginWithGmail = {
    body:joi.object().keys({
        idToken: joi.string().required().messages({
            "string.base": `"idToken" should be a type of 'text'`,
            "string.empty": `"idToken" cannot be an empty field`,
            "any.required": `"idToken" is a required field`
            }),
    })
}
export const refreshToken = {
    body:joi.object().keys({
        refreshToken: joi.string().required().messages({
            "string.base": `"refreshToken" should be a type of 'text'`,
            "string.empty": `"refreshToken" cannot be an empty field`,
            "any.required": `"refreshToken" is a required field`
            }),
    })
}

export const sendForgotPassword= {
    body:joi.object().keys({
        email:generalFields.email.required(),
    })
}
export const verifyForgotPassword= {
    body:sendForgotPassword.body.append({
        otp:generalFields.otp.required(),
    })
}
export const resetPassword= {
    body:verifyForgotPassword.body.append({
        password:generalFields.password.required(),
        confirmPassword:generalFields.confirmPassword.required()
    })
}