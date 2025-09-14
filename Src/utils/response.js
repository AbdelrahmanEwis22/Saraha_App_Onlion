export const asyncHandler = (fn)=>{
    return async (req, res, next) => {
        await fn(req, res, next).catch(error =>{
            return next(error,{cause:500})
        })
    }
}

export const successResponse = ({res,message="Done",status =200,data={}}={})=>{
    return res.status(status).json({message,data})
}

export const globalErrorHandling = (error, req, res, next) => {

    if (error?.code === 11000 || error?.errorResponse?.code === 11000) {
    const keyPattern = error.keyPattern || error?.errorResponse?.keyPattern || {};
    const keyValue   = error.keyValue   || error?.errorResponse?.keyValue   || {};
    const field = Object.keys(keyPattern)[0] || "field";
    return res.status(409).json({
        message: `${field} already exists`,
        keyValue
        });
    }

    const statusCode = typeof error.cause === "number" ? error.cause : 500;
    return res.status(statusCode).json({
    message: error.message,
    error,
    stack: process.env.MOOD==="DEV"? error.stack: undefined
    });
}