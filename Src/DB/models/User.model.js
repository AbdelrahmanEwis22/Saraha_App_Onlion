import mongoose from "mongoose";

export const genderEnum = { male: "male", female: "female" };
export const roleEnum = { user: "user", admin: "admin" };
export const providerEnum = { system: "system", google: "google" };

const userSchema = new mongoose.Schema(
    {
    firstName: {
        type: String,
        required: true,
        minLength: 2,
        maxLength: [
        20,
        "FirstNamed Max Length is 20 char You have entered {VALUE}",
        ],
    },
    lastName: {
        type: String,
        required: true,
        minLength: 2,
        maxLength: [
        20,
        "lastNamed Max Length is 20 char You have entered {VALUE}",
        ],
    },
    email: { type: String, required: true, minLength: 2, unique: true, trim: true ,lowercase:true,index:true},
    password: {
        type: String,
        required: function () {
        return this.provider === providerEnum.system ? true : false;
        },
        minLength: 2,
        maxLength: 60,
    },
    oldPasswords:[String],
    forgotPasswordOtp:String,
    phone: {
        type: String,
        required: function () {
        return this.provider === providerEnum.system ? true : false;
        },
      //unique: true,
    },
    age: {
        type: Number, 
        min: 0, 
        max: 120, 
        default: null 
    },
    gender: {
        type: String,
        enum: {
        values: Object.values(genderEnum),
        message: `Gender only Allow ${Object.values(genderEnum)}`,
        },
        default: genderEnum.male,
    },
    role: {
        type: String,
        enum: Object.values(roleEnum),
        default: roleEnum.user,
    },
    provider: {
        type: String,
        enum: Object.values(providerEnum),
        default: providerEnum.system,
    },
    confirmEmail: Date,
    confirmEmailOtp: String,
    picture: {secure_url:String,public_id:String},
    coverImages:[{secure_url:String,public_id:String}],
    deleteAt: Date,
    changeCredentialsTime:Date,
    deletedBy:{
        type:mongoose.Schema.Types.ObjectId,
        ref:"User",
    },
    restoreAt: Date,
    restoredBy:{
        type:mongoose.Schema.Types.ObjectId,
        ref:"User",
    },
    //تاسك بتاع otp لمده معينه
    isEmailConfirmed: {
        type: Boolean,
        default: false 
    },
    verificationCode: String,
    verificationCodeExpireAt: {
        type: Date, 
        default: Date.now()
    },
    failedLoginAttempts: {
        type: Number, 
        default: 0
    },
    banUntil: {type: Date, default: null},
},
{
    timestamps: true,
    toObject: { virtuals: true },
    toJSON: { virtuals: true },
}
);

    userSchema.virtual("fullName").set(function(value){
    const [firstName,lastName]= value?.split(" ")|| [];
    this.set({firstName,lastName})
}).get(function(){
    return this.firstName+ " " +this.lastName;
})

userSchema.virtual('messages',{
    localField:'_id',
    foreignField:"receiverId",
    ref:"Message"
})

export const UserModel =
mongoose.model.User || mongoose.model("User", userSchema);
UserModel.syncIndexes();

