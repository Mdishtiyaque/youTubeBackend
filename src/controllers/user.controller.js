import {asyncHandler}  from "../utils/asyncHandler.js"

import {ApiError} from "../utils/ApiError.js"
import {User} from "../models/user.mode.js"
import {uploadOnCloudinary} from "../utils/cloudinary.js"
import { ApiResponse } from "../utils/ApiResponse.js"
import  jwt  from "jsonwebtoken"
import { deleteOnCloudinary} from "../utils/cloudinary.js"


const generateAccessAndRefereshTokens=async(userId)=>
{

  try{
   const user =await User.findById(userId)
   const accessToken = user.generateAccessToken()
   const refreshToken=user.generateRefreshToken()
   user.refreshToken=refreshToken
   await user.save({validateBeforeSave:false})
return {accessToken,refreshToken}
  }catch(error){
    throw new ApiError(500, "Something went wrong while generating referesh and acess token")
  }

}



const registerUser=asyncHandler(async (req,res)=>{

// get user details from frontend
// validation -not empty
// check if user already exists: username, email
// check for images, check for avatar
// upload them to cloudinary, avatar
// create user object -create entry in db
// remove password and refresh token field from response
// check for user creation
// return res


 const {fullName,email,username,password}=req.body
 console.log("email:", email);

 

 if([fullName, email, username,password].some((field)=>field?.trim()===""))
   {
    throw new ApiError(400,"All fields are required")
   }

  const existedUser=await User.findOne({
    $or:[{username},{email}]
  })

  if(existedUser){
    throw new ApiError(409,"User with email or username already exists")
  }
  
  const avatarLocalPath=req.files?.avatar[0]?.path
  // const coverImageLocalPath=req.files?.coverImage[0]?.path
const coverImageFile = req.files?.["coverImage"]?.[0];
const coverImageLocalPath = coverImageFile?.path;

  if(!avatarLocalPath){
    throw new ApiError(400,"Avtar file is required")

  }
//console.log("body")
//console.log(typeof req.body)
//console.log("files")
//console.log(typeof req.files)
const avatar=await uploadOnCloudinary(avatarLocalPath)
const coverImage=await uploadOnCloudinary(coverImageLocalPath)  

if(!avatar){
  throw new ApiError(400,"Avtar file is required")  
}


const user=await User.create(
    {
        fullName,
        avatar: {public_id:avatar?.public_id, url: avatar?.url},
        coverImage: {public_id: coverImage?.public_id, url: coverImage?.url},
        
        email,
        password,
        username:username.toLowerCase()
    }

)


const createdUser= await User.findById(user._id).select(
    "-password -refreshToken"
)

if(!createdUser){
throw new ApiError(500,"something went wrong while registering the user")
}

return res.status(201).json(
    new ApiResponse(20,createdUser,"User register Successfully")
)

})





const loginUser=asyncHandler(async (req,res)=>{
// req body-> data
// username or email
// find the user
// password check
// acccess and refresh token
// send cookie



const {email, username, password}=req.body


if(!username && !email){
  throw new ApiError(400,"username or email is required ")

}



const user=await User.findOne({
  $or:[{username},{email}]
})



if(!user){
 throw new ApiError(401,"Invalid user credentials")
}

const isPasswordValid=await user.isPasswordCorrect(password)

if(!isPasswordValid){
  throw new ApiError(401,"Invalid user credentials")
}

const {accessToken,refreshToken}=await generateAccessAndRefereshTokens(user._id)
// console.log("refereshToken",refreshToken)

 // console.log("accessToken:",accessToken)
const loggedInUser=await User.findById(user._id).
select("-password -refreshToken")   


     //instaed of this can i use update here   const loggedInUser=await User.findById(user._id).
    // select("-password -refreshToken")   

  const options={
    httpOnly:true,
    secure:true
  }
 
  return res
  .status(200)
  .cookie("accessToken",  accessToken,options)
  .cookie("refreshToken", refreshToken,options)
  .json(new ApiResponse(
    200,
    {
      user:loggedInUser
    },
    "User logged In sucessfully"
  ))

})



const logoutUser=asyncHandler(async(req,res)=>{
   await User.findByIdAndUpdate(
    req.user._id,
    {
       $set:{
        refreshToken:undefined
       }
    },
    {
      new:true
    }
   )


   const options={
    httpOnly:true,
    secure:true
   }

   return res
   .status(200)
   .clearCookie("accessToken",options)
   .clearCookie("refreshToken",options)
   .json(new ApiResponse(200,{},"user logout"))
})



const refreshAccessToken= asyncHandler(async (req,res)=>{

 const incomingRefreshToken= req.cookies.refreshToken || req.body.refreshToken
  
 if(!incomingRefreshToken){
  throw new ApiError(401,"unauthorize access")
 }

 try {
  
 const decodedToken= jwt.verify(incomingRefreshToken,process.env.REFRESH_TOKEN_SECRET)
 
 const user= await User.findById(decodedToken._id)
 
 if(!user){
   throw new ApiError(401,"Invalid refresh token")
 }
 
 if(incomingRefreshToken!==user?.refreshToken){
   throw new ApiError(401,"Refresh token is expired or used")
 }
 

 const options={
 httpOnly:true,
 secure:true
 }
 
 const {accessToken,newrefreshToken}=await generateAccessAndRefereshTokens(user._id)
 
 return res
 .status(200)
 .cookie("accessToken",accessToken,options)
 .cookie("refreshToken",newrefreshToken,options)
 .json(new ApiResponse(
   200,
   {accessToken,refreshToken:newrefreshToken},
   "Access token refreshed"
 ))
 
 } catch (error) {
  throw new ApiError(401,error?.message || "Invalid refresh token")
 }

})

const changeCurrentPassword=asyncHandler(async(req,res)=>{

  const {oldpassword,newPassword}=req.body

  const user=await User.findById(req.user._id)
  const isPasswordCorrect=await user.isPasswordCorrect(oldpassword)

  if(!isPasswordCorrect){
    throw new ApiError(401,"Old password is incorrect")
  }
  user.password=newPassword

  await user.save({validateBeforeSave:false})

  return res.status(200).json(new ApiResponse(200,{},"Password changed successfully"))


})

const getCurrentuser=asyncHandler(async(req,res)=>{
  return res.status(200).json(
    new ApiResponse(200,req.user,"Current user fetched successfully")
  )
})

const updateAccountDetails=asyncHandler(async(req,res)=>{

  const {fullName,email}= req.body

  if(!fullName || !email){
    throw new ApiError(400,"Full name and email are required")
  }

 const user=await User.findByIdAndUpdate(
    req.user._id,
    {
      $set:{
        fullName,
        email:email
      }
    },
    {
      new:true,
    }
  ).select("-password")

  return res
  .status(200)
  .json(new ApiResponse(200,user,"User details updated successfully"))
})


const updateUserAvatar=asyncHandler(async(req,res)=>{

  const avatarLocalPath=req.file?.path

  if(!avatarLocalPath){
    throw new ApiError(400,"Avtar file is required")
  }

  const user=await User.findById(req.user?._id).select("-password -refreshToken")
  const previousAvatar=user.avatar
  if(previousAvatar.public_id){
    await deleteOnCloudinary(previousAvatar.public_id,"image")
  }
  const avatar=await uploadOnCloudinary(avatarLocalPath)

  if(!avatar.url){
    throw new ApiError(400,"Avtar file is required")  
  }
  
 user.avatar = { public_id: avatar?.public_id, url: avatar?.url };
 await user.save({ validateBeforeSave: false });


 

  return res.status(200).json(new ApiResponse(200,user,"User avatar updated successfully"))

})



const updateUserCoverImage=asyncHandler(async(req,res)=>{

  const coverImageLocalPath=req.file?.path

  if(!coverImageLocalPath){
    throw new ApiError(400,"Cover image file is required")
  }

  const user=await User.findById(req.user?._id).select("-password -refreshToken")
  const previousCoverImage=user.coverImage;
   if(previousCoverImage.public_id){
    await deleteOnCloudinary(previousCoverImage.public_id,"image")
   }

  const coverImage=await uploadOnCloudinary(coverImageLocalPath)

  if(!coverImage.url){
    throw new ApiError(400,"Cover image file is required")  
  }

 user.coverImage = { public_id: coverImage?.public_id, url: coverImage?.url };
 await user.save({ validateBeforeSave: false });
 

  return res.status(200).json(new ApiResponse(200,user,"User cover image updated successfully"))

})

const getUserChannel=asyncHandler(async(req,res)=>{
  const {username} = req.params;

  if (!username?.trim()) {
    throw new ApiError(400, "User ID is required");
  }

  const channel = await User.aggregate([
    {
      $match:{
        username: username?.toLowerCase()

      }
    },
    {
      $lookup:{
        from:"subscriptions",
        localField:"_id",
        foreignField:"channel",
        as:"subscribers"
      }
    },
     {
      $lookup:{
        from:"subscriptions",
        localField:"_id",
        foreignField:"subscriber",
        as:"subscribedTo"
      }
    },

    {
      $addFields:{
        subscribersCount:{$size:"$subscribers"},

        channelsSubscriptionCount:{$size:"$subscribedTo"},
        isSubscribed:{
          $cond: {
            if: { $in: [req.user?._id, "$subscribers.subscriber"] },
            then: true,
            else: false
          }
        }
      },
    },
    {
      $project:{
        fullName:1,
        username:1,
        avatar:1,
        coverImage:1,
        subscribersCount:1,
        channelsSubscriptionCount:1,
        isSubscribed:1,
        email:1,
      }
    }
    
  ])

  if(!channel?.length){
   throw new ApiError(404,"user chnnel not found")
  }

  return res.status(200).json(
    new ApiResponse(200,channel[0],"User channel fetch successfuly")
  )

})

const getWatchHistory=asyncHandler(async(res,req)=>{
    const user=await User.aggregate([
     {
     $match:{
         _id:new mongoose.Types.objectId(req.user._id)
       }
      },
      {
      $lookup:{
      from:"videos",
      localField: "watchHistory",
      foreignField:"_id",
      as:"watchHistory",
      pipeline:[
     {
        $lookup:{
          from:"users",
          localField:"owner",
          foreignField:"_id",
          as:"owner",
          pipeline:[
            {
              $project:{
                fullName:1,
                username:1,
                avatar:1
              }
            }
          ]
        }
      },

      {
        $addFields:{
          owner:{
            $first:"$owner"
          }
        }
      }

      ]
    }
  }

])

return res
.status(200)
.json(
  new ApiResponse(
    200,
    user[0].watchHistory,
    "watch history fetch sucessfully"
  )
)

})




export {
  registerUser, 
  loginUser, 
  logoutUser,
  refreshAccessToken,
  changeCurrentPassword,
  getCurrentuser,
  updateAccountDetails,
  updateUserAvatar,
  updateUserCoverImage,
  getUserChannel,
  getWatchHistory,
}

