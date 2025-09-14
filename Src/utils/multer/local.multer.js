import fs from 'node:fs'
import path from "node:path";
import multer from "multer";


export const fileValidation = {
    image: ["image/jpeg","image/png"],
    document: ["application/pdf","application/msword","application/vnd.openxmlformats-officedocument.wordprocessingml.document"],
}
export const localFileUpload =({customPath = "general",validation = []}={})=>{
    let basedPath = `uploads/${customPath}`
    const fullPath = path.resolve(`./src/${basedPath}`)
    
    const storage = multer.diskStorage({
        destination:function(req,file,callback){

            if (req.user?._id) {
                basedPath += `/${req.user._id}`
            }

            const fullPath = path.resolve(`./src/${basedPath}`)
            if (!fs.existsSync(fullPath)) {
                    fs.mkdirSync(fullPath,{recursive:true})
            }
            
            callback(null,path.resolve(fullPath))
        },
        filename:function(req,file,callback){
            const uniqueFileName = Date.now() + "__" + Math.random() + "__" + file.originalname
            file.finalPath = basedPath + "/" + uniqueFileName
            callback(null,uniqueFileName)
        }
    })
    const fileFilter = function(req,file,callback){
        // console.log(file);

        if (validation.includes(file.mimetype)) {
            return callback(null,true)
        }
        return callback("In-valid file format",false)
    }

    return multer({
        dest:"./temp",
        fileFilter,
        storage
    })
}