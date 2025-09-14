import joi from 'joi'
import { generalFields } from '../../middleware/validation.middleware.js'
import {fileValidation} from '../../utils/multer/cloud.multer'
export const sendMessage = {
    params:joi.object().keys({
        receiverId:generalFields.id.required()
    }).required(),

    body :joi.object().keys({
        content: joi.string().min(2).max(200000)
    }).required(),

    files:joi.array().items(
        joi.object().keys({
                    fieldname: generalFields.file.fieldname.valid("attachments"),
                    originalname: generalFields.file.originalname,
                    encoding: generalFields.file.encoding,
                    mimetype: generalFields.file.mimetype.valid(...fileValidation.image),

                    destination: generalFields.file.destination,
                    filename: generalFields.file.filename,
                    path: generalFields.file.path,
                    size: generalFields.file.size,
                })
    ).min(0).max(2)
}