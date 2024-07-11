import mongoose, { isValidObjectId } from "mongoose";
import { Playlist } from "../models/playlist.model.js";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { User } from "../models/user.model.js";

const createPlayist = asyncHandler( async (req, res) => {
    // to create a playlist
    const { name, description } = req.body;

    if(!name && !description){
        throw new ApiError(400, "Name and description are required")
    }
    
    const playlist = await Playlist.create({
        name,
        description,
        owner: req.user?._id,
    })

    if (!playlist) {
        throw new ApiError(400, "Playlist not created")
    }

    return res.status(200)
    .json(
        new ApiResponse(200, playlist, "Playlist created successfully!!")
    )
})

const getUserPlaylist = asyncHandler( async (req, res) => {
    // to get user playlists 
    const { userId } = req.params;

    if (!isValidObjectId(userId)) {
        throw new ApiError(400, "Invalid user id")
    }

    const user = await User.findById(userId);
    if (!user) {
        throw new ApiError(400, "User not found!!")
    } 

    const playlist = await Playlist.aggregate([
        {
            $match: {
                owner: new mongoose.Types.ObjectId(userId),
            },
        },
        {
            $lookup: {
                from: "videos",
                localField: "videos",
                foreignField: "_id",
                as: "videos",
                pipeline: [
                    {
                        $sort: { createdAt: -1 }
                    },
                    {
                        $limit: 1,
                    },
                    {
                        $project: {
                            thumbnail: 1,
                        },
                    }
                ]
            }
        },
        {
            $addFields: {
                playlistThumbnail: {
                    $cond: {
                        if: { $isArray: "$videos" },
                        then: { $first: "videos.thumbnail" },
                        else: null,
                    },
                },
            }
        },
        {
            $project: {
                name: 1,
                description: 1,
                playlistThumbnail: 1,
            }
        },
    ])

    if (!playlist) {
        throw new ApiError(400, "Sorry no playlists found!!")
    }

    return res.status(200)
    .json(
        new ApiResponse(200, playlist, "Playlists fetched successfully!!")
    )
})

const getPlaylistById = asyncHandler( async (req, res) => {
    // to get playlist by its id
    const { playlistId } = req.params;

    if (!isValidObjectId(playlistId)) {
        throw new ApiError(400, "Invalid Playlist Id")
    }

    const playlist = await Playlist.findById(playlistId);
    if(!playlist){
        throw new ApiError(400, "Playlist not found!!")
    }

    return res.status(200)
    .json(
        new ApiResponse(200, playlist, "Playlist fetched successfully")
    )
})

const addVideoToPlaylist = asyncHandler( async (req, res) => {
    // to add a video to a playlist 
    const { playlistId, videoId } = req.params;

    if (!isValidObjectId(playlistId) || !isValidObjectId(videoId)) {
        throw new ApiError(400, "Invalid Playlist id or Video id")
    }

    
})

export {
    createPlayist,
    getUserPlaylist,
    getPlaylistById,
}
