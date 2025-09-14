import { roleEnum } from "../../DB/models/User.model.js";
import { deleteAccount } from "./user.service.js";
export const endpoint ={
    profile:[roleEnum.user,roleEnum.admin],
    restoreAccount:[roleEnum.admin],
    deleteAccount:[roleEnum.admin],

}