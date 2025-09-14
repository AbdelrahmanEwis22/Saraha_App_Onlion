import { UserModel,roleEnum } from "../../DB/models/User.model.js";
import * as DBService from "../../DB/db.service.js";
import { asyncHandler, successResponse } from "../../utils/response.js";
import { decryptionEncryption, generateEncryption} from "../../utils/security/encryption.security.js";
import {generateHash,compareHash} from "../../utils/security/hash.security.js"
import { createRevokeToken, generaLoginCredentials,logoutEnum} from "../../utils/security/token.security.js"; 
import { TokenModel } from "../../DB/models/Token.model.js";
import jwt from 'jsonwebtoken'
import { cloud,uploadFile ,destroyFile,uploadFiles,deleteResources,deleteFolderByPrefix} from "../../utils/multer/cloudinary.js";
import path from "path";


export const logout = asyncHandler(
    async (req, res, next) =>{
        //console.log("decoded token:", req.decoded);
        const {flag}= req.body;
        let status =200
        switch (flag) {
            case logoutEnum.signoutFromAll:
                await DBService.findOneAndUpdate({
                    model:UserModel,
                    filter:{
                        _id:req.decoded._id
                    },
                    data:{
                        changeCredentialsTime:new Date()
                    }
                })
                break;
        
            default:
                await createRevokeToken({req})
                    status =201
                break;
        }
        
        return successResponse({ res,status, data: { } });
});

export const profile = asyncHandler(async (req, res, next) =>{
    const user = await DBService.findById({
        model:UserModel,
        id:req.user._id,
        populate:[{path:"messages"}]

    })
    user.phone = await decryptionEncryption({ cipherText: req.user.phone });
    return successResponse({ res, data: { user} });
});

export const shareProfile = asyncHandler(
    async (req, res, next) =>{
    const {userId} = req.params;
    const user = await DBService.findOne({
        model:UserModel,
        filter:{
            _id:userId,
            confirmEmail:{$exists:true},
        }
    })
    return user? successResponse({ res, data: { user} }): next(new Error("In-valid account",{cause:404}));
});

export const updateBasicInfo = asyncHandler
    (async (req, res, next) =>{
        if (req.body.phone) {
            req.body.phone = await generateEncryption({plaintext:req.body.phone});
        }
        const user = await DBService.findOneAndUpdate({
            model:UserModel,
            filter:{
                _id:req.user._id,
            },
            data:req.body,
        })
        return user? successResponse({ res, data: { user} }): next(new Error("In-valid account",{cause:404}));

})

export const getNewLoginCredentials = asyncHandler(async (req, res, next) => {
    const user = req.user;
    const credentials = await generaLoginCredentials({user:req.user})
            return successResponse({ res, data: { credentials } });
});

export const freezeAccount = asyncHandler(
    async (req, res, next) =>{

        const {userId} = req.params;
        if (userId && req.user.role !== roleEnum.admin) {
            return next(new Error("You are not allowed to freeze this account",{cause:403}));
        }
        const user = await DBService.findOneAndUpdate({
            model:UserModel,
            filter:{
                _id:userId || req.user._id,
                deleteAt:{$exists:false},
            },
            data:{
                deleteAt: new Date(),
                deletedBy: req.user._id,
                changeCredentialsTime:new Date(),
                $unset: {
                    restoreAt:1,
                    resizeBy:1
                }
            },
        })
        return user? successResponse({ res, data: { user} }): next(new Error("In-valid account",{cause:404}));

});

export const restoreAccount = asyncHandler(
    async (req, res, next) =>{

        const {userId} = req.params;
        const user = await DBService.findOneAndUpdate({
            model:UserModel,
            filter:{
                _id:userId ,
                deleteAt:{$exists:true},
                deletedBy:{$ne:userId},
            },
            data:{
                $unset: {
                    deleteAt: 1, 
                    deletedBy: 1 
                },
                restoredAt: new Date(),
                restoredBy: req.user._id,
            },
        })
        return user? successResponse({ res, data: { user} }): next(new Error("In-valid account",{cause:404}));

});

export const deleteAccount = asyncHandler(
    async (req, res, next) =>{

        const {userId} = req.params;
        const user = await DBService.deleteOne({
            model:UserModel,
            filter:{
                _id:userId,
                deleteAt:{$exists:true},
            },
        })
        if (user.deletedCount) {
            await deleteFolderByPrefix({prefix:`user/${userId}`})
        }
        return user.deletedCount? successResponse({ res, data: { user} }): next(new Error("In-valid account",{cause:404}));

});


export const updateUserAccount = asyncHandler(async (req, res, next) =>{
    const {id}= req.user;
    const {firstName,lastName,email,password,phone,gender}= req.body;
    if (email) {
        if (await DBService.findOne({model:UserModel,filter:{email,_id:{$ne:id}}})) {
            return next(new Error("Email Exist",{cause:409}))
        }
    }
    const user = await DBService.findById({
        model: UserModel,
        id: id,
        update: {
            firstName,
            lastName,
            email,
            password,
            phone,
            gender
        }
    },  {
        new: true, 
        runValidators: true 
    })
    if (!user) {
        return next(new Error("In-valid account",{cause:404}))
    }
    user.phone = await decryptionEncryption({ cipherText: user.phone });
    return successResponse({ res, data: { user } });
});
export const updatePassword = asyncHandler(
    async (req, res, next) =>{
        const {oldPassword,password,flag}= req.body;
        if (!await compareHash({plaintext:oldPassword,hashValue:req.user.password})) {
            return next(new Error("in-valid old password",{cause:404}))
        }

        if (req.user.oldPasswords?.length) {
            for(const hashPassword of req.user.oldPasswords|| []){
                if (await compareHash({plaintext:password,hashValue:hashPassword}))
                    {
                        return next(new Error("this password is used before",{cause:409}))
                    }
        }
        }
        let updatedData ={}
        switch (flag) {
            case logoutEnum.signoutFromAll:
                updatedData.changeCredentialsTime = new Data()
                break;
            case logoutEnum.signout:
                await createRevokeToken({req})
                break;
            default:
                
                break;
        }

        const user = await DBService.findOneAndUpdate({
            model: UserModel,
            filter:{
                _id:req.user._id
            },
            data:{
                password: await generateHash({ plaintext: password }),
                ...updatedData,
                $push: { oldPasswords: req.user.password }
            },
            // select:"-password"
        })
        return user? successResponse({ res, data: { user} }):
            next(new Error("In-valid account",{cause:404}));


});

export const profileImage = asyncHandler(
    async (req, res, next) =>{

        const {secure_url,public_id} = await uploadFile({file:req.file,path:`user/${req.user._id}`})
        const user = await DBService.findOneAndUpdate({
            model:UserModel,
            filter:{
                _id:req.user._id,
            },
            data:{
                picture: {secure_url,public_id}
            },
            options:{
                new: false
            }
        })
        if (user?.picture?.public_id) {
            await destroyFile({public_id:user.picture.public_id})
        }
        return successResponse({ res, data: { user} })

});

export const profileCoverImages = asyncHandler(
    async (req, res, next) =>{
        const attachments = await uploadFiles({files:req.files,path:`user/${req.user._id}/cover`})
        const user = await DBService.findOneAndUpdate({
            model:UserModel,
            filter:{
                _id:req.user._id,
            },
            data:{
                coverImages: attachments
            },
            options:{
                new:false
            }
        })
        if (user?.coverImages?.length) {
            await deleteResources({
                public_ids:user.coverImages.map(ele=>ele.public_id)
            })
        }
        return successResponse({ res, data: { user} })

});