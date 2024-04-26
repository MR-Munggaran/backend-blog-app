import { Router } from "express";
import {createPost, getPost, getPosts,getCatPosts, getUserPosts, editPost, deletePost} from "../controllers/posts.js"
import authMiddle from "../middlewares/Authmiddle.js";

const router = Router()

router.post('/', authMiddle, createPost)
router.get('/', getPosts)
router.get('/:id', getPost)
router.get('/categories/:category', getCatPosts)
router.get('/users/:id', getUserPosts)
router.patch('/:id', authMiddle,editPost)
router.delete('/:id', authMiddle, deletePost)


export default router;