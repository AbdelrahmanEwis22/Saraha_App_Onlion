
import multer from "multer";


export const fileValidation = {
    image: ["image/jpeg","image/png"],
    document: ["application/pdf","application/msword","application/vnd.openxmlformats-officedocument.wordprocessingml.document"],
}
export const cloudFileUpload =({validation = []}={})=>{

    
    const storage = multer.diskStorage({})
        
    function fileFilter (req,file,callback){
        // console.log(file);
        if (validation.includes(file.mimetype)) {
            return callback(null,true)
        }
        return callback("In-valid file format",false)
    }
    return multer({storage,fileFilter})
    
}