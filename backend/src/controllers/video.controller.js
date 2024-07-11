import { ApiError } from "../utils/ApiError.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { uploadOnCloudinary } from "../utils/cloudinary.js";
import { Video } from "../models/video.model.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import mongoose, { isValidObjectId } from "mongoose";
import { User } from "../models/user.model.js";

const getAllVideos = asyncHandler(async (req, res) => {
    const {page = 1, limit = 10, query, sortBy, sortType, userId} = req.query;

    // first we declare a pipeline that we will use, you can give any name
    const pipeline = [];

    if (!isValidObjectId(userId)) {
        throw new ApiError(400, "Invalid UderId")
    }
    // find the user in db by it useriD
    const user = await User.findById(userId);
    // see if user exists
    if (!user) {
        throw new ApiError(400, "User not avaliable")
    }
    
    // pipeline starts

    //first match all documents through userid
    // it will give all documents that have this userId
    if (userId) {
        pipeline.push({
            $match: new mongoose.Types.ObjectId(userId),
        })
    }

    // then match through query
    // aab iseme query mai you can give title or desc so issliye $or laga ke match kiya hai
    // this will give all documents that have the query
    if(query){
        pipeline.push({
            $match: {
                $or: [
                    {title: {$regex: query, $options: "i"}},
                    {description: {$regex: query, $options: "i"}}
                ]
            }
        })
    }

    // abb sort krna padega uske sortType and sortBy ke basis pe
    // so we used $sort, but
    // If sortBy and sortType are provided, it adds a $sort stage to the pipeline to sort the videos.
    if(sortBy && sortType){
        const sortTypeValue = sortType === "desc"? -1 : 1;
        pipeline.push({
            $sort: {[sortBy]: sortTypeValue}
        })
    }

    // It adds a $lookup stage to populate the owner field, fetching details from the "users" collection.
    // It adds a $project stage to include only specific fields of the owner.
    pipeline.push({
        $lookup: {
            from: "users",
            localField: "owner",
            foreignField: "_id",
            as: "owner",
            pipeline: [
                {
                    $project: {
                        username: 1,
                        fullName: 1,
                        avatar: 1
                    }
                }
            ]
        }
    })

    // It adds a $addFields stage to replace the array of owner details with just the first object from the array.
    pipeline.push({
        $addFields: {
            owner: {
                $first: $owner,
            }
        }
    })

    const video = await Video.aggregate(pipeline);

    Video.aggregatePaginate(video, {page, limit})
        .then(function(result){
            return res.status(200)
                .json(
                    new ApiResponse(200, {result}, "Videos Fetched Sucessfully")
                )
        })
        .catch(function(error){
            throw new ApiError(400, error)
        })

/* 
Your code looks like an Express.js route handler for fetching videos. Let's break down what it does:

It extracts query parameters like page, limit, query, sortBy, sortType, and userId from the request query.
It sets up an empty pipeline for MongoDB aggregation.
It validates the userId using isValidObjectId function, which presumably checks if it's a valid MongoDB ObjectId.
It retrieves the user corresponding to the userId using User.findById(userId).
If the user doesn't exist, it throws a 404 error.
If userId is provided, it adds a $match stage to the aggregation pipeline to filter videos by owner.
If query is provided, it adds a $match stage to filter videos based on text search in title or description fields.
If sortBy and sortType are provided, it adds a $sort stage to the pipeline to sort the videos.
It adds a $lookup stage to populate the owner field, fetching details from the "users" collection.
It adds a $project stage to include only specific fields of the owner.
It adds a $addFields stage to replace the array of owner details with just the first object from the array.
It creates an aggregation object using Video.aggregate(pipeline).
It uses a pagination plugin (Video.aggregatePaginate) to paginate the aggregation results.
It sends the paginated result as a JSON response with a success message.
Overall, this code fetches videos based on various criteria, populates the owner field with details from the "users" collection, 
sorts and paginates the results, and returns them in a structured JSON response.
*/

})

const publishAVideo = asyncHandler( async (req, res) => {
    // what to do to publish a video ??
    // get title and description of the video
    // then validate them
    // after that get video file and thumbnail file's local path
    // validate them
    // then upload them on cloudinary
    // store title, desc, video url, thumbnail url in db
    // console.log(req.body)

    const {title, description} = req.body;

    if(!title || !description){
        throw new ApiError(400, "Both title and description are required")
    }
    // console.log(req.files)
    const videoLocalPath = req.files?.videoFile[0]?.path;
    const thumbnailLocalPath = req.files?.thumbnail[0].path;

    if (!videoLocalPath || !thumbnailLocalPath) {
        throw new ApiError(400, "Both video and thumbnail are required!!")
    }

    // uploading on cloudinary
    const videoFile = await uploadOnCloudinary(videoLocalPath);
    const thumbnail = await uploadOnCloudinary(thumbnailLocalPath);
    // console.log("V is: ",videoFile)
    if (!videoFile) {
        throw new ApiError(400, "Video upload failed!!")
    }
    if (!thumbnail) {
        throw new ApiError(400, "Thumbnail upload failed!!")
    }

    const video = await Video.create({
        title, 
        description,
        videoFile: videoFile.url,
        thumbnail: thumbnail.url,
        isPublished: true,
        duration: videoFile.duration,
        owner: req.user?._id,
    })

    if (!video) {
        throw new ApiError(400, "Something went wrong while uploading video on DB")
    }

    return res.status(200)
    .json(
        new ApiResponse(200, video, "Video uploaded Sucessfully!!")
    )
})

const getVideoById = asyncHandler(async(req, res) => {

    // get the videId from params
    // then check id params is valid
    // find video by given id
    // validate video
    // return res

    const { videoId } = req.params;

    if (!isValidObjectId(videoId)) {
        throw new ApiError(400, "Invalid Video Id")
    }

    const video = await Video.findById(videoId)
    // console.log(video)
    if(!video){
        throw new ApiError(400, "Video not found")
    }
    
    return res.status(200)
    .json(
        new ApiResponse(200, video, "Video fetched Sucessfully")
    )
})

const updateVideo = asyncHandler(async(req, res) => {
    // update video details like title, desc, thumbnail

    // get the video id
    // get title, desc from body
    // validate them
    // get thubmnail local path
    // vallidate it
    // find video by id in db
    // findById and update in db
    // check it
    // return 
    const { videoId } = req.params;
    
    if(!isValidObjectId(videoId)){
        throw new ApiError(400, "Invalid object Id")
    
    }
    
    const {title, description} = req.body;
    const thumbnailLocalPath = req.file?.path;

    if (!title && !description) {
        throw new ApiError(400, "Title or Description is required")
    }

    if(!thumbnailLocalPath){
        throw new ApiError(400, "Thumbnail not found")
    }

    const video = await Video.findById(videoId);
    
    if (video?.owner.toString() !== req.user?._id.toString()) {
        throw new ApiError(400, "You are unauthorized! Only owner of this video can update its details")
    }

    const thumbnail = await uploadOnCloudinary(thumbnailLocalPath);

    if(!thumbnail.url){
        throw new ApiError(400, "Thumbnail not uploaded")
    }

    const updateVideo = await Video.findByIdAndUpdate(videoId, 
        {
            $set: {
                title,
                description,
                thumbnail: thumbnail.url,
            }
        },
        {new: true}
    )

    if (!updateVideo) {
        throw new ApiError(400, "Details were not updated Sucessfully")
    }

    return res.status(200)
    .json(
        new ApiResponse(200, updateVideo, "Video Details updated Sucessfully")
    )

})

const deleteVideo = asyncHandler(async(req, res) => {
    // to delete a video 
    // get the video Id
    // delete by id in db
    // validate it
    // return res

    const { videoId } = req.params;

    if (!isValidObjectId(videoId)) {
        throw new ApiError(400, "VideoId not Valid")
    }
    // You can even check if user is authorized to delete the video or not
    /*
    const video = await Video.findById(videoId);

    if (video?.owner.toString() !== req.user?._id.toString()) {
        throw new ApiError(400, "You are unauthorized! Only owner of this video can update its details")
    }
    */
    const deletedVideo = await Video.findByIdAndDelete(videoId);

    if (!deletedVideo) {
        throw new ApiError(400, "Video not deleted")
    }

    return res.status(200)
    .json(
        new ApiResponse(200, deletedVideo, "Video Deleted Successfully!!")
    )

})

const togglePublishStatus = asyncHandler(async (req, res) => {

    const { videoId } = req.params;

    if(!isValidObjectId(videoId)){
        throw new ApiError(400, "Invalid Video Id")
    }

    const video = await Video.findById(videoId);

    if (!video) {
        throw new ApiError(400, "Video not found!!")
    }

    // if (video?.isPublished == true) {
    //  video.isPublished = false   
    // }

    video.isPublished = !video.isPublished   

    const updatedVideo = await Video.save({validateBeforeSave: false})

    if (!updatedVideo) {
        throw new ApiError(400, "Publish status was not Updated!!")
    }

    return res.status(200)
    .json(
        new ApiResponse(200, updatedVideo, "Published Status changed sucessfully")
    )
})


export {
    getAllVideos,
    publishAVideo,
    getVideoById,
    updateVideo,
    deleteVideo,
    togglePublishStatus,
}