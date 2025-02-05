import { Router } from "express";
import { addComment, deleteComment, getAllComments, updateComment } from "../controllers/comment.controller.js";
import { verifyJWT } from "../middlewares/auth.middleware.js";

const router = Router();

router.use(verifyJWT);

router.route("/:videoId").get(getAllComments).post(addComment)
router.route("/c/:commentId").patch(updateComment).delete(deleteComment)

export default router