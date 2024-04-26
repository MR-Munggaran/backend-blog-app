import { Router } from "express";
import authMiddle from "../middlewares/Authmiddle.js";
import {registerUser, loginUser, getUser, getAuthors, changeAvatar, editUser} from '../controllers/users.js'

const router = Router()

router.post('/register', registerUser)
router.post('/login', loginUser)
router.get('/:id', getUser)
router.get('/', getAuthors)
router.post('/change-avatar', authMiddle,  changeAvatar)
router.patch('/edit-user',authMiddle,editUser)

export default router;