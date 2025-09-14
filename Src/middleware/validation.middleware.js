import { asyncHandler } from "../utils/response.js";
import joi from "joi";
import { Types } from "mongoose";
import { genderEnum } from "../DB/models/User.model.js";

export const generalFields ={
        fullName: joi.string().pattern(new RegExp(/^[A-Z][a-z]{1,19}\s[{1}[A-Z][a-z]{1,19}$/)).min(3).max(20).messages({
            "string.base": `"fullName" should be a type of 'text'`,
            "string.empty": `"fullName" cannot be an empty field`,
            "string.min": `"fullName" should have a minimum length of {#limit}`,
            "string.max": `"fullName" should have a maximum length of {#limit}`,
            "any.required": `"fullName" is a required field`
        }),
        firstName: joi.string().min(3).max(30).messages({
            "string.base": `"firstName" should be a type of 'text'`,
            "string.empty": `"firstName" cannot be an empty field`,
            "string.min": `"firstName" should have a minimum length of {#limit}`,
            "string.max": `"firstName" should have a maximum length of {#limit}`,
            "any.required": `"firstName" is a required field`
        }),
        lastName: joi.string().min(3).max(30).messages({
            "string.base": `"lastName" should be a type of 'text'`,
            "string.empty": `"lastName" cannot be an empty field`,
            "string.min": `"lastName" should have a minimum length of {#limit}`,
            "string.max": `"lastName" should have a maximum length of {#limit}`,
            "any.required": `"lastName" is a required field`
        }),
        email: joi.string().email({minDomainSegments:2,maxDomainSegments:3,tlds:{allow:["net","com","edu"]}}).messages({
            "string.base": `"email" should be a type of 'text'`,
            "string.empty": `"email" cannot be an empty field`,
            "string.email": `"email" must be a valid email`,
            "any.required": `"email" is a required field`
        }),
        password: joi.string().pattern(new RegExp(/^(?=.*\d)(?=.*[a-z])(?=.*[A-Z])(?=.*[a-zA-Z]).{8,}$/)).min(8).max(20).messages({
            "string.base": `"password" should be a type of 'text'`,
            "string.empty": `"password" cannot be an empty field`,
            "string.min": `"password" should have a minimum length of {#limit}`,
            "string.max": `"password" should have a maximum length of {#limit}`,
            "string.pattern.base": `"password" must contain at least one uppercase letter, one lowercase letter, one number, and be at least 8 characters long`,
            "any.required": `"password" is a required field`
        }),
        confirmPassword: joi.string().valid(joi.ref('password')).messages({
            "any.only": `"confirmPassword" does not match "password"`,
            "any.required": `"confirmPassword" is a required field`,
        }),
        gender: joi.string().valid(...Object.values(genderEnum)),
        phone: joi.string().pattern(new RegExp(/^(002|\+2)?01[0125][0-9]{8}$/)), // Adjust pattern as per your requirements
        age: joi.number().positive().integer().min(18).max(120).messages({
            "number.base": `"age" should be a type of 'number'`,
            "number.min": `"age" should have a minimum value of {#limit}`,
            "number.max": `"age" should have a maximum value of {#limit}`,
            "any.required": `"age" is a required field`
        }),
        otp: joi.string().pattern(new RegExp(/^\d{6}$/)).messages({
            "string.base": `"otp" should be a type of 'text'`,
            "string.empty": `"otp" cannot be an empty field`,
            "string.pattern.base": `"otp" must be a valid OTP`,
            "any.required": `"otp" is a required field`
        }),
        id: joi.string().custom(
                (value,helpers)=>{
                        return Types.ObjectId.isValid(value)? value : helpers.message("In-valid ObjectId")
                }
                ).messages({
                "string.base": `"id" should be a type of 'text'`,
                "string.empty": `"id" cannot be an empty field`,
                "any.required": `"id" is a required field`
                }),
        file:{
            fieldname: joi.string().required(),
            originalname: joi.string().required(),
            encoding: joi.string().required(),
            mimetype: joi.string().required(),
            finalPath: joi.string().required(),
            destination: joi.string().required(),
            filename: joi.string().required(),
            path: joi.string().required(),
            size: joi.number().positive().required(),
        },    
            

    }

export const validation = (schema)=>{
    return asyncHandler(
        async (req,res,next) => {
            //console.log(req.files);
            
            const validationError = []
            for (const key of Object.keys(schema)){

                const validationResult = schema[key].validate(req[key],{abortEarly:false});
                if (validationResult.error){
                    validationError.push({
                        key,details:validationResult.error.details.map(ele=>
                            {
                            return {message:ele.message, path: ele.path[0]}
                            }
                        )})
                }
            } 
            if (validationError.length){
                return res.status(400).json({err_message:"validation error" ,validationError})
            }
            return next()
        }
    )
}

