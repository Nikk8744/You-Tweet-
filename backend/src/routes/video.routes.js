import { Router } from "express";
import { deleteVideo, getAllVideos, getVideoById, publishAVideo, togglePublishStatus, updateVideo } from "../controllers/video.controller.js";
import { verifyJWT } from "../middlewares/auth.middleware.js";
import { upload } from "../middlewares/multer.middleware.js";

const router = Router();

// rather than verifying jwt in every route apply in middleware to all routes
router.use(verifyJWT)
// now dont need to write verifyJWT in each route..

router.route("/all-videos").get(getAllVideos)
router.route("/publish-video").post(
    // verifyJWT,
    upload.fields([
        {
            name: "videoFile",
            maxCount: 1
        },
        {
            name: "thumbnail",
            maxCount: 1
        },
    ]), 
    publishAVideo   
)

router.route("/:videoId").get(
    // verifyJWT,
     getVideoById)
router.route("/:videoId").patch(upload.single("thumbnail"), updateVideo)
router.route("/:videoId").delete(deleteVideo)
router.route("/toggle/publish/:videoId").patch(togglePublishStatus)


export default router