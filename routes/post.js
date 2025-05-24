import express from "express";
import { getPosts, addPosts } from "../controllers/postController.js";

const router = express.Router();

router.get("/", getPosts);
router.post("/add", addPosts);

export default router;
