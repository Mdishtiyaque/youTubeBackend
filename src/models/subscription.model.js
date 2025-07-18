import mogoose , {Schema} from "mongoose";

const subscriptionSchema=  new Schema({
    subscriber:{
        type: Schema.Types.ObjectId,  //one who is subscribing
        ref: "User",
    },
    channel:{
     type:Schema.Types.ObjectId,
     ref:"User" //one to whom 'subscriber' is subscribing
    },


},{timestamps:true})

export const Subscription = mogoose.model("Subscription",subscriptionSchema)
