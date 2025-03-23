import mongoose, { isValidObjectId } from "mongoose";
import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiError } from "../utils/ApiError.js";
import { Video } from "../models/video.model.js";
import { Comment } from "../models/comment.model.js";
import { ApiResponse } from "../utils/ApiResponse.js";

const getAllComments = asyncHandler(async(req, res) => {
    // get all comments for a video
    const { videoId } = req.params;
    const { page = 1, limit = 10 } = req.query;

    const pipeline = [];

    if (!isValidObjectId(videoId)) {
        throw new ApiError(400, "Invalid videoId")
    }

    const video = await Video.findById(videoId);

    if (!video) {
        throw new ApiError(400, "Video not found!!")
    }

    if (videoId) {
        pipeline.push({
            $match: new mongoose.Types.ObjectId(videoId)
        })
    }

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
                    }
                }
            ]
        }
/*  for getting likes ye bhi likh skte hai bas upar project vail pipeline hatake niche likhni hogi 
        aur add fields krni hogi and then at the end project them together
        {
            $lookup:{
                from:"likes",
                localField:"_id",
                foreignField:"comment",
                as:"likedBy"
            }
        },
        {
            $addFields:{
                likesCount:{
                    $size:"$likedBy"
                },
                owner:{
                    $first:"$owner"
                },
                isLiked:{
                    $cond:{
                        if:{$in:[req.user?._id,"$likedBy.likedBy"]},
                        then:true,
                        else:false
                    }
                }
            }
        },
        {
            $project:{
                _id:1,
                content:1,
                createdAt:1,
                owner:{
                    username:1,
                    fullName:1,
                    avatar:1
                },
                likesCount:1,
                isLiked:1
            }
        }
*/

    })

    const options = {
        page: parseInt(page, 10),
        limit: parseInt(limit, 10)
    }

    const comments = await  Comment.aggregate(pipeline);

    const allComments = Comment.aggregatePaginate(comments, options);

    return res.status(200)
    .json(
        new ApiResponse(200, allComments, "Comments fetched sucessfully")
    )

})

const addComment = asyncHandler(async(req, res) => {
    // add a comment to a video

    const { videoId } = req.params;
    const { content } = req.body;

    if(isValidObjectId(videoId)){
        throw new ApiError(400, "Invalid VideoId")
    }

    if(!content){
        throw new ApiError(400, "Content is required")
    }

    const video = await Video.findById(videoId)

    if (!video) {
        throw new ApiError(400, "Video not found")
    }

    const comment = await Comment.create({
        content,
        video: video?._id,
        owner: req.user?._id,
    })

    if (!comment) {
        throw new ApiError(400, "Something went wrong while adding comment")
    }

    return res.status(200)
    .json(
        new ApiResponse(200, comment, "Comment Added sucessfully")
    )
})

const updateComment = asyncHandler(async(req, res) => {
    // update the content of a comment
    const { commentId } = req.params;

    if (!isValidObjectId(commentId)) {
        throw new ApiError(400, "Invalid comment Id")
    }

    const { content } = req.body;

    if (!content) {
        throw new ApiError(400, "Content is required to update comment")
    }

    const comment = await Comment.findById(commentId)

    if(comment.owner.toString() !== req.user._id.toString()){
        throw new ApiError(400, "You are unauthorized to update comment")
    }

    const updatedComment = await Comment.findByIdAndUpdate(commentId, 
        {
            $set: {
                content,
            }
        },
        { new: true }
    )

    if (!updatedComment) {
        throw new ApiError(400, "Something went wrong while updating comment")
    }

    return res.status(200)
    .json(
        new ApiResponse(200, updatedComment, "Comment updated Sucessfully")
    )
})

const deleteComment = asyncHandler(async(req, res) => {
    // to delete a comment

    const { commentId } = req.params;

    if (!isValidObjectId(commentId)) {
        throw new ApiError(400, "Invalid comment Id")
    }

    const comment = await Comment.findById(commentId)

    if (!comment) {
        throw new ApiError(400, "Comment not found")
    }

    if(comment.owner.toString() !== req.user?._id.toString()){
        throw new ApiError(400, "You are not authorized to delete comment")
    }

    const deletedComment = await Comment.findByIdAndDelete(commentId)

    if (!deletedComment) {
        throw new ApiError(400, "Something went wrong while deleting comment")
    }

    return res.status(200)
    .json(
        new ApiResponse(200, deletedComment, "Comment deleted Successfully!!")
    )
})

export {
    getAllComments,
    addComment,
    updateComment,
    deleteComment,
}