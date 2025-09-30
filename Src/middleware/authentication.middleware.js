import { asyncHandler } from "../utils/response.js";
import { decodeToken, tokenTypeEnum } from "../utils/security/token.security.js";

export const authentication = ({tokenType = tokenTypeEnum.access}={}) => {
    return asyncHandler(
        async (req,res,next) => {
            const {user,decoded} = await decodeToken({next,authorization: req.headers.authorization, tokenType}) ||{}
            req.user=user;
            req.decoded= decoded;
            return next()
        }
    )
};

export const authorization = ({accessRoles = []}={}) => {
    return asyncHandler(
        async (req,res,next) => {
        // console.log({
        //     accessRoles,
        //     currentRole:req.user.role,
        //     match: accessRoles.includes(req.user.role)
        // })
            if(!accessRoles.includes(req.user.role))
                return next(new Error("Not Authorized account",{cause:403}))
            return next()       
        }
    )
};
//لو عايز ادمج الاثنين مع بعض في فانكش واحده
export const auth = ({tokenType = tokenTypeEnum.access,accessRoles = []}={}) => {
    return asyncHandler(
        async (req,res,next) => {
            const {user,decoded} = await decodeToken({next,authorization: req.headers.authorization, tokenType}) ||{}
            req.user=user;
            req.decoded= decoded;            
            // console.log({
            //     accessRoles,
            //     currentRole:req.user.role,
            //     match: accessRoles.includes(req.user.role)
            // })
                if(!accessRoles.includes(req.user.role))
                    return next(new Error("Not Authorized account",{cause:403}))
                return next()       
        }
    )
};
