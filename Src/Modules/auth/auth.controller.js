import { validation ,} from '../../middleware/validation.middleware.js';
import * as authService from './auth.service.js'
import * as validators from "./auth.validation.js"
import { Router } from "express";
const router = Router({
        caseSensitive:true
    });
//signup
router.post(
    "/signup",
    validation(validators.signup),
    authService.signup
)
router.post("/signup/gmail",
    validation(validators.loginWithGmail),
    authService.signupWithGmail
)
router.patch("/confirm-email",
    validation(validators.confirmEmail),
    authService.conFirmEmail
)

//login
router.post("/login",
    validation(validators.login),
    authService.login
)

router.post("/login/gmail",
    validation(validators.loginWithGmail),
    authService.loginWithGmail
)
//forgot password
router.patch("/forgot-password",
    validation(validators.sendForgotPassword),
    authService.sendForgotPassword
)
router.patch("/verify-forgot-password",
    validation(validators.verifyForgotPassword),
    authService.verifyForgotPassword
)
router.patch("/reset-forgot-password",
    validation(validators.resetPassword),
    authService.resetPassword
)

//refresh token
router.post('/refresh-token',
    validation(validators.refreshToken),
    authService.refreshToken
)
export default router