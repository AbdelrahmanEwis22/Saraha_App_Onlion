import {auth, authentication ,authorization} from '../../middleware/authentication.middleware.js';
import * as userService from './user.service.js'
import { tokenTypeEnum } from '../../utils/security/token.security.js';
import { Router } from "express";
// import { roleEnum } from '../../DB/models/User.model.js';
import { endpoint } from './user.authorization.js';
import * as validators from "./user.validation.js"
import { validation } from '../../middleware/validation.middleware.js';
import { fileValidation, localFileUpload } from '../../utils/multer/local.multer.js';
import { cloudFileUpload } from '../../utils/multer/cloud.multer.js';
const router = Router({
        caseSensitive:true
    });
//profile
router.get("/", 
    authentication() ,
    validation(validators.logout),
    //authorization({accessRoles: endpoint.profile}) , 
    userService.profile
)

//refresh token
router.get("/refresh-token", 
    authentication({tokenType:tokenTypeEnum.refresh}) , 
    userService.getNewLoginCredentials
)
router.get("/:userId", 
    validation(validators.shareProfile),
    userService.shareProfile
)
//logout
router.post("/logout",
    authentication(),
    userService.logout
)
//update information
router.patch("/",
    authentication(),
    validation(validators.updateBasicInfo),
    userService.updateBasicInfo
)
//restore account
router.patch("/:userId/restore-account",
    auth({accessRoles: endpoint.restoreAccount}),
    validation(validators.restoreAccount),
    userService.restoreAccount
)
//freeze
router.delete("{/:userId}/freeze-account",
    authentication(),
    validation(validators.freezeAccount),
    userService.freezeAccount
)
//delete hard
router.delete("/:userId",
    auth({accessRoles: endpoint.deleteAccount}),
    validation(validators.deleteAccount),
    userService.deleteAccount
)

//update password
router.patch("/update-password", 
    authentication() , 
    validation(validators.updatePassword),
    userService.updatePassword)

//multer
router.patch("/profile-image",
    authentication(),
    cloudFileUpload({validation:fileValidation.image}).single("image"),
    validation(validators.profileImage),
    userService.profileImage
)
router.patch("/profile-cover-images",
    authentication(),
    cloudFileUpload({validation:fileValidation.image}).array("images",2),
    validation(validators.coverImage),
    userService.profileCoverImages
)

export default router