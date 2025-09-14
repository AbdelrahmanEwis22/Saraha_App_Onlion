import CryptoJS from "crypto-js";
export const generateEncryption= async ({plaintext = "", secretKey = process.env.ENCRYPTION_SECRET }={})=>{
    return CryptoJS.AES.encrypt(plaintext,secretKey).toString()
}
export const decryptionEncryption = async ({cipherText = "", secretKey = process.env.ENCRYPTION_SECRET}={})=>{
    return CryptoJS.AES.decrypt(cipherText,secretKey).toString(CryptoJS.enc.Utf8)
}