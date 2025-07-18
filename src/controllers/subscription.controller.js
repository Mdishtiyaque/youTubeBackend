import mongoose, {isValidObjectId} from "mongoose"
import {User} from "../models/user.mode.js"
import { Subscription } from "../models/subscription.model.js"
import {ApiError} from "../utils/ApiError.js"
import {ApiResponse} from "../utils/ApiResponse.js"
import {asyncHandler} from "../utils/asyncHandler.js"

// toggle subscription
const toggleSubscription = asyncHandler(async (req, res) => {
    const { channelId } = req.params

    if(!isValidObjectId(channelId)){
        throw new ApiError(
            400,
            "This channel id is not valid"
        )
    }
   // if its a chhannel so its already a user 
    const channel = await User.findById({
        _id: channelId
    })

    if(!channel){
        throw new ApiError(
            400,
            "This channel does not Exists"
        )
    }

    let unsubscribe
    let subscribe;

    const itHasSubscription = await Subscription.findOne({
        subscriber: req.user._id,
        channel: channelId
    })

    if(itHasSubscription){
        // unsubscribe
         unsubscribe = await Subscription.findOneAndDelete(
            {
                subscriber: req.user._id,
                channel: channelId
            }
        )

        if(!unsubscribe){
            throw new ApiError(500, "something went wrong while unsubscribe the channel")
        }

        // return responce 
        return res.status(200).json(
            new ApiResponse(
                200,
                unsubscribe,
                "channel unsubscribe successfully!!"
            )
        )
    }else{
        // subscribe 
        subscribe = await Subscription.create({
            subscriber: req.user._id,
            channel: channelId
        })

        if(!subscribe){
            throw new ApiError(500, "something went wrong while subscribe the channel")
        }

        return res.status(200).json(
            new ApiResponse(
                200,
                subscribe,
                "channel subscribe successfully!!"
            )
        )
    }

})



const getUserChannelSubscribers = asyncHandler(async (req, res) => {
    const { channelId } = req.params;

    if (!isValidObjectId(channelId)) {
        throw new ApiError(400, "This channel id is not valid");
    }

    const subscriptions = await Subscription.aggregate([
        {
            $match: {
                channel: new mongoose.Types.ObjectId(channelId)
            }
        },
        {
            $lookup: {
                from: "users",
                localField: "subscriber",
                foreignField: "_id",
                as: "subscriberDetails"
            }
        },
        {
            $unwind: "$subscriberDetails"
        },
        {
            $project: {
                _id: 0,
                username: "$subscriberDetails.username",
                fullName: "$subscriberDetails.fullName",
                avatar: "$subscriberDetails.avatar"
            }
        }
    ]);

    return res.status(200).json(
        new ApiResponse(
            200,
            subscriptions,
            "All channel subscribers fetched successfully!"
        )
    );
});


const getSubscribedChannels = asyncHandler(async (req, res) => {
    const { subscriberId } = req.params;

    if (!isValidObjectId(subscriberId)) {
        throw new ApiError(400, "This subscriber id is not valid");
    }

    const subscriptions = await Subscription.aggregate([
        {
            $match: {
                subscriber: new mongoose.Types.ObjectId(subscriberId)
            }
        },
        {
            $lookup: {
                from: "users",
                localField: "channel",
                foreignField: "_id",
                as: "channelDetails"
            }
        },
        {
            $unwind: "$channelDetails"
        },
        {
            $project: {
                _id: 0,
                username: "$channelDetails.username",
                fullName: "$channelDetails.fullName",
                avatar: "$channelDetails.avatar"
            }
        }
    ]);

    return res.status(200).json(
        new ApiResponse(
            200,
            subscriptions,
            "All subscribed channels fetched successfully!"
        )
    );
});

export {
    toggleSubscription,
    getUserChannelSubscribers,
    getSubscribedChannels
}
