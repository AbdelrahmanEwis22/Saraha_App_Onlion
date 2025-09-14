import jwt from 'jsonwebtoken'
import * as DBService from '../../DB/db.service.js'
import { UserModel , roleEnum} from "../../DB/models/User.model.js";
import { TokenModel } from '../../DB/models/Token.model.js';
import { nanoid } from 'nanoid';
import joi from 'joi';
export const signatureLevelEnum ={bearer : 'Bearer',system : 'System'}
export const tokenTypeEnum ={access : 'access',refresh : 'refresh'}
export const logoutEnum ={signoutFromAll:"signoutFromAll",signout:"signout",stayLoggedIn:"stayLoggedIn"}
export const generateToken = async ({
    payload = {},
    secret = process.env.ACCESS_USER_TOKEN_SIGNATURE,
    options = {
        expiresIn:  Number(process.env.ACCESS_TOKEN_EXPIRES_IN)
    }}= {}) =>{
        return jwt.sign(payload,secret,options)
}

export const generateRefreshToken = async ({
    payload = {},
    signature = process.env.REFRESH_TOKEN_SIGNATURE,
    options = {
    expiresIn: Number(process.env.REFRESH_TOKEN_EXPIRES_IN) 
    }
} = {}) => {
    return jwt.sign(payload, signature, options);
};

export const verifyToken = async ({
    token = "",
    secret = process.env.ACCESS_USER_TOKEN_SIGNATURE,
    }= {}) =>{
        return jwt.verify(token,secret)
    }

export const getSignatures = async ({signatureLevel = signatureLevelEnum.bearer} = {})=>{
    let signature = {accessSignature:undefined,refreshSignature:undefined};
            switch (signatureLevel) {
                case signatureLevelEnum.system:
                    signature.accessSignature = process.env.ACCESS_SYSTEM_TOKEN_SIGNATURE;
                    signature.refreshSignature = process.env.REFRESH_SYSTEM_TOKEN_SIGNATURE;
                    break;
                default:
                    signature.accessSignature = process.env.ACCESS_USER_TOKEN_SIGNATURE;
                    signature.refreshSignature = process.env.REFRESH_USER_TOKEN_SIGNATURE;
                    break;
            }
    return signature;
}

export const decodeToken = async ({next , authorization = "", tokenType = tokenTypeEnum.access }={})=>{
        

        const [bearer,token] = authorization?.split(' ') || [] // Bearer token
        
        if (!bearer || !token) {
            return next (new Error("Miss token parts",{cause:401}))
        }

        let signatures = await getSignatures({signatureLevel: bearer}) // {accessSignature,refreshSignature}


        const decoded = await verifyToken({
            token,
            secret: tokenType === tokenTypeEnum.access ? signatures.accessSignature : signatures.refreshSignature
        })
        // console.log(decoded);
        if (decoded.jti && await DBService.findOne({model:TokenModel,filter:{jti:decoded.jti}})) {
            return next (new Error("in-valid login credentials ",{cause:401}))
        }
        
        if (!decoded?._id) {
            return next (new Error("in-valid token ",{cause:400}))
        }
        const user = await DBService.findById({
            model:UserModel,
            id:decoded._id
        })

        if (!user) {
            return next (new Error("Not register account ",{cause:404}))
        }
        // console.log({user,decoded});
        
        return {user,decoded};
}

export const generaLoginCredentials = async ({user}={})=>{
    let signatures = await getSignatures({  
                signatureLevel:user.role != roleEnum.user? signatureLevelEnum.system: signatureLevelEnum.bearer,
            });
            const jwtid = nanoid()
            // console.log(signatures);
            const access_token = await generateToken({
                payload: { _id: user._id },
                secret: signatures.accessSignature,
                options:{
                    jwtid,
                    expiresIn:Number(process.env.REFRESH_TOKEN_EXPIRES_IN)
                }
            });
            const refresh_token = await generateToken({
                    payload: { _id: user._id },
                    secret: signatures.refreshSignature,
                    options: {
                    expiresIn: process.env.REFRESH_TOKEN_EXPIRES_IN,
                },
            });
                return { access_token, refresh_token };
}

export const createRevokeToken = async({req}={})=>{
    await DBService.create
    ({
        model:TokenModel,
        data:{
                jti:req.decoded.jti,
                expiresIn:req.decoded.iat +
                Number(process.env.REFRESH_TOKEN_EXPIRES_IN),
                userId:req.decoded._id
            }
    })
}