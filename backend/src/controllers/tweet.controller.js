import mongoose, { isValidObjectId } from "mongoose";
import { Tweet } from "../models/tweet.model.js";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { User } from "../models/user.model.js";

const createTweet = asyncHandler(async (req, res) => {
    // create a tweet 

    const { content } = req.body;

    if (!content) {
        throw new ApiError(400, "Content is required")
    }

    const tweet = await Tweet.create({
        content,
        owner: req.user?._id,
    })

    if (!tweet) {
        throw new ApiError(400, "Something went wrong while creating tweet")
    }

    return res.status(200)
    .json(
        new ApiResponse(200, tweet, "Tweet created Sucessfully")
    )
})

const getUserTweets = asyncHandler(async (req, res) => {
    const { userId } = req.params;

    if (!isValidObjectId(userId)) {
        throw new ApiError(400, "Invalid User Id")
    }

    const pipeline = [];

    const user = await User.findById(userId);

    if (!user) {
        throw new ApiError(400, "No such user found")
    }

    pipeline.push(
        {
            $match: {
                owner: new mongoose.Types.ObjectId(userId)
            }
        },
        {
            $project: {
                content: 1,
                _id: 1,
            }
        }
    )

    const tweet = await Tweet.aggregate(pipeline)

    if (!tweet) {
        return res.status(200).json(new ApiResponse(200, tweet, "NO tweet found"))
    }

    return res.status(200)
    .json(
        new ApiResponse(200, tweet, "Tweets found successfully")
    )

})

const updateTweet = asyncHandler( async (req, res) => {
    // to update a tweet
    const { tweetId } = req.params;
    const { content } = req.body;

    if (!isValidObjectId(tweetId)) {
        throw new ApiError(400, "Invalid tweet Id")
    }

    if (!content) {
        throw new ApiError(400, "Content is required to update")
    }

    const tweet = await Tweet.findById(tweetId);
    if (!tweet) {
        throw new ApiError(400, "Tweet is not found")
    }

    if (tweet.owner.toString() !== req.user?._id.toString()) {
        throw new ApiError(400, "You are unahorized to update this tweet")
    }

    const updatedTweet = await Tweet.findByIdAndUpdate(tweetId,
        {
            $set: {
                content,
                owner: req.user._id,
            }
        },
        {new: true}
    )

    if (!updatedTweet) {
        throw new ApiError(400, "Tweet could not be updated")
    }

    return res.status(200)
    .json(
        new ApiResponse(200, updatedTweet, "Tweet updated successfully")
    )
})

const deleteTweet = asyncHandler( async (req, res) => {
    // to delete a tweet

    const { tweetId } = req.params;

    if (!isValidObjectId(tweetId)) {
        throw new ApiError(400, "Invalid tweet id")
    }

    const tweet = await Tweet.findById(tweetId);
    if(!tweet){
        throw new ApiError(400, "Tweet not found")
    }

    if (tweet.owner.toString() !== req.user?._id.toString()) {
        throw new ApiError(400, "You are unauthorized to delete this tweet")
    }

    const deleted_Tweet = await Tweet.findByIdAndDelete(tweetId);

    if(!deleted_Tweet){
        throw new ApiError(400, "Something went wrong while deleting the tweet")
    }

    return res.status(200)
    .json(
        new ApiResponse(200, deleted_Tweet, "Tweet deleted Succcessfully!!")
    )
})

export {
    createTweet,
    getUserTweets,
    updateTweet,
    deleteTweet,
}