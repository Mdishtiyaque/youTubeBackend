import mongoose, {isValidObjectId} from "mongoose"
import {Video} from "../models/video.model.js"
import {User} from "../models/user.mode.js"
import {ApiError} from "../utils/ApiError.js"
import {ApiResponse} from "../utils/ApiResponse.js"
import {asyncHandler} from "../utils/asyncHandler.js"
import {uploadOnCloudinary,deleteOnCloudinary} from "../utils/cloudinary.js"


const publishAVideo = asyncHandler(async (req, res) => {
    const { title, description, isPublished=true} = req.body
    // TODO: get video, upload to cloudinary, create video
       
       if(!title || title?.trim()===""){
        throw new ApiError(400, "Title content is required")
      }
    if(!description || description?.trim()===""){
        throw new ApiError(400, "description content is required")
      }
        
       const videoFilePath1 = req.files?.["videoFile"]?.[0];
       const videoFilePath = videoFilePath1?.path;
       const thumbnailPath1= req.files?.["thumbnail"]?.[0];
        const thumbnailPath= thumbnailPath1?.path;
        
      if (!videoFilePath || !thumbnailPath) {
        throw new ApiError(400, "Both video and thumbnail are required");
     }
     
     const videoFile = await uploadOnCloudinary(videoFilePath);
     const thumbnail = await uploadOnCloudinary(thumbnailPath);
        
     

     const video = await Video.create({
      videoFile: {
         public_id:videoFile?.public_id,
         url:videoFile?.url
      },
      thumbnail: {
         public_id:thumbnail?.public_id,
         url:thumbnail?.url
      },
      title,
      description,
      duration:videoFile?.duration,
      isPublished,
      owner: req.user._id
     });

     if(!video){
      throw new ApiError(500,"something went wrong while store the the video in database")
     }

  return res.status(201).json(new ApiResponse(201, video, "Video published successfully"));
});


const updateVideo=asyncHandler(async (req,res)=>{
   const {videoId}= req.params
   const {title,description}= req.body
   const thumbnailFile=req.file?.path
   
    if(!isValidObjectId(videoId)){
        throw new ApiError(400, "This video id is not valid")
    } 
    // if any feild not provide
   if (!thumbnailFile && !title && !description) {
  throw new ApiError(400, "At least one field (title, description, or thumbnail) is required for update.");
}


    const previousVideo=await Video.findOne(
      {
         _id:videoId
      }
    )

      if(!previousVideo){
        throw new ApiError(404, "video not found")
    }

    let updateFields = {
        $set:{
            title,
            description,
        }
    }

    // if thumbnail provided delete the previous one and upload new on 
    let thumbnailUploadOnCloudinary;
    if(thumbnailFile){
        await deleteOnCloudinary(previousVideo.thumbnail?.public_id)

        // upload new one 
         thumbnailUploadOnCloudinary = await uploadOnCloudinary(thumbnailFile);

        if(!thumbnailUploadOnCloudinary){
            throw new ApiError(500, "something went wrong while updating thumbnail on cloudinary !!")
        }

        updateFields.$set.thumbnail = {
            public_id: thumbnailUploadOnCloudinary.public_id,
            url: thumbnailUploadOnCloudinary.url
        }
    }

    const updatedVideoDetails = await Video.findByIdAndUpdate(
        videoId,
        updateFields,
        {
            new: true
        }
    )

    if(!updatedVideoDetails){
        throw new ApiError(500, "something went wrong while updating video details");
    }

    //retrun responce
    return res.status(200).json(new ApiResponse(
        200,
        { updatedVideoDetails },
        "Video details updated successfully!"
    ));


})

const getVideoById=asyncHandler(async(req,res)=>{
    const {videoId}= req.params

    if(!isValidObjectId(videoId)){
        throw new ApiError(400,"this video id is not valid")

    }

    const video = await Video.findById(
        {
            _id: videoId
        }
    )

     if(!video){
        throw new ApiError(404, "video not found")
    }

    // return responce
    return res.status(200).json(
        new ApiResponse(
            200,
            video,
            "video fetched successfully!!"
        )
    )

})

const getAllVideos = asyncHandler(async (req, res) => {
    let {
        page = 1,
        limit = 5,
        query = "",
        sortBy = "createdAt",
        sortType = -1,
        userId
    } = req.query;

    page = parseInt(page);
    limit = parseInt(limit);
    sortType = parseInt(sortType); // ✅ Ensure it's a number

    // Fallback to current user if userId is not provided
    userId = userId || req.user._id;

    // Check if user exists
    const user = await User.findById(userId);
    if (!user) {
        throw new ApiError(404, "User not found");
    }

    // Build the aggregate pipeline
    const aggregation = Video.aggregate([
        {
            $match: {
                owner: new mongoose.Types.ObjectId(userId),
                $or: [
                    { title: { $regex: query, $options: "i" } },
                    { description: { $regex: query, $options: "i" } }
                ]
            }
        },
        {
            $sort: {
                [sortBy]: sortType
            }
        }
    ]);

    // Paginate the aggregate result
    const result = await Video.aggregatePaginate(aggregation, {
        page,
        limit
    });

    return res.status(200).json(
        new ApiResponse(200, result, "Fetched all videos successfully!")
    );

});

const deleteVideo = asyncHandler(async (req, res) => {
    const { videoId } = req.params
    if(!isValidObjectId(videoId)){
        throw new ApiError(400, "This video id is not valid")
    } 

    // find video in db
    const video = await Video.findById(
        {
            _id: videoId
        }
    )

    if(!video){
        throw new ApiError(404, "video not found")
    }

    if (video.videoOwner.toString() !== req.user._id.toString()) {
        throw new ApiError(403, "You don't have permission to delete this video!");
    }

    // delete video and thumbnail in cloudinary
    if(video.videoFile){
        await deleteOnCloudinary(video.videoFile.public_id, "video")
    }

    if(video.thumbnail){
        await deleteOnCloudinary(video.thumbnail.public_id)
    }

    const deleteResponce = await Video.findByIdAndDelete(videoId)

    if(!deleteResponce){
        throw new ApiError(500, "something went wrong while deleting video !!")
    }

    // return responce
    return res.status(200).json(
        new ApiResponse(
            200,
            deleteResponce,
            "video deleted successfully!!"
        )
    )
})


export {publishAVideo,updateVideo,getVideoById,getAllVideos,deleteVideo}

