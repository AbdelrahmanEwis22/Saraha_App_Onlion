import { error } from "node:console";
import{EventEmitter}from "node:events";
import { sendEmail } from "../email/send.email.js";
import { verifyEmailTemplate } from "../email/templates/verify.email.js";
export const emailEvent = new EventEmitter();

emailEvent.on("conFirmEmail",async(data)=>{
    await sendEmail({
        to:data.email,
        subject: data.subject || "Confirm Your Email",
        html:verifyEmailTemplate({otp:data.otp})
    }).catch(error=>{
        console.log(`Failed to send email to ${data.to}`);
    })
})    
emailEvent.on("SendForgotPassword",async(data)=>{
    await sendEmail({
        to:data.to,
        subject: data.subject || "Forgot-Email",
        html:verifyEmailTemplate({otp:data.otp,title:data.title}),
    }).catch(error=>{
        console.log(`Failed to send email to ${data.to}`);
    })
})    