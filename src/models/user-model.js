import mongoose from "mongoose";

const userSchema = new mongoose.Schema({
    name: {type:String,
        required: true
    },
    username: {
        type: String,
        unique: true,
        required: true
    },
    email: { type: String, unique: true, required: true},
    password: { type: String, required: true},
    oauthProvider: String,
    avatar: String,   
    bio: String,     
    interests: [String],  
    role: { type: String, default: "student" },
    stats: {
        studyHours: { type: Number, default: 0 },
        streak: { type: Number, default: 0 }
    },
    badges: [String], 
}, { timestamps: true });

userSchema.pre(async function(next){
    if(this.isModified("password")){
        this.password = await bcrypt.hash(this.password , 10)
    }
    next()
})

userSchema.methods.isPasswordCorrect = async function (plainPassword){
    return await bcrypt.compare(plainPassword, this.password)
}

export const User = mongoose.model("User" , userSchema);

