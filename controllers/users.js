import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import fs from 'fs';
import { v4 as uuid } from 'uuid';
import path, { dirname } from 'path';
import { fileURLToPath } from 'url';
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);



import HttpError from "../models/Error.js"
import User from "../models/User.js"

// Register Users

// POST : /api/users/register
// UNPROTECTED
const registerUser = async (req,res, next) => {
    try {
        const {name, email, password, password2} = req.body
        if(!name || !email || !password) {
            return next(new HttpError("Fill in all fields", 422))
        }

        const newEmail = email.toLowerCase()

        const emailExists = await User.findOne({email : newEmail})
        if(emailExists) {
            return next(new HttpError("Email already exists", 422))
        }

        if((password.trim()).length < 6) {
            return next(new HttpError("Password should be at least 6 char", 422))
        }
        if(password != password2) {
            return next(new HttpError("Passwords do not match", 422))
        }

        const salt = await bcrypt.genSalt(10)
        const hashedPass = await bcrypt.hash(password, salt)

        const newUser = await User.create({name, email: newEmail, password : hashedPass})


        res.status(201).json(newUser)
    } catch (error) {
        return next(new HttpError("User registration failed", 422))
        // return console.log(error)
    }
}

// Login Users
// POST : /api/users/login
// UNPROTECTED
const loginUser = async (req,res, next) => {
    try {
        const {email, password} = req.body
        if(!email || !password) {
            return next(new HttpError("Fill in all fields", 422))
        }

        const newEmail = email.toLowerCase()

        const user = await User.findOne({email: newEmail})
        if(!user){
            return next(new HttpError("Invalid Credentials", 422))
        }

        const comparePass = await bcrypt.compare(password, user.password)
        if(!comparePass) {
            return next(new HttpError("Invalid credentials", 422))
        }
        
        const {_id:id, name} = user

        const token = jwt.sign({id, name}, process.env.JWT_SECRET, {expiresIn: "1d"})

        res.status(200).json({token, id, name})
    } catch (error) {
        return next(new HttpError("Login failed. Please check your credentials", 422))
    }
}

// User Profile
// POST : /api/users/:id
// PROTECTED
const getUser = async (req,res, next) => {
    try {
        const {id} = req.params
        const user = await User.findById(id).select('-password')

        if (!user) {
            return next(new HttpError("User Not Found", 404))
        }
        res.status(200).json(user)
    } catch (error) {
        return next(new HttpError(error)) 
    }
}

// Change User Avatar
// POST : /api/users/change-avatar
// PROTECTED
const changeAvatar = async (req,res, next) => {
    try {
        console.log(req.files)
        if(!req.files|| !req.files.avatar ) {
            return next(new HttpError("Please choose an image"), 422) 
        }
        // find user from database 
        const user = await User.findById(req.user.id)

        if(user.avatar) {
            fs.unlink(path.join(__dirname, '..', 'uploads', user.avatar), (err) => {
                if(err) return (new HttpError(err))
            })
        }
        const {avatar} = req.files
        // check file size
        if(avatar.size > 500000){
            return next(new HttpError("Profile picture too big. should be less than 500kb")) 
        }
        let fileName;
        fileName = avatar.name

        let splittedFilename = fileName.split('.')
        let newFilename = splittedFilename[0] + uuid() + '.' + splittedFilename[splittedFilename.length - 1]
        avatar.mv(path.join(__dirname, '..', 'uploads', newFilename),  async err => {
            if(err){
                 return (new HttpError(err))
                }
            const updatedAvatar = await User.findByIdAndUpdate(req.user.id, {avatar: newFilename}, {new: true})
            if(!updatedAvatar) {
                return (new HttpError("Avatar couldn't be changed"), 422)

            }
            res.status(200).json(updatedAvatar)
        })
    } catch (error) {
        return next(new HttpError(error)) 
        // console.log(error)
    }
}

// Edit User Details
// POST : /api/users/edit-user
// PROTECTED
const editUser = async (req,res, next) => {
    try {
        const {name, email, currentPassword, newPassword, newConfirmPassword} = req.body
        if( !name || !email || !currentPassword || !newPassword){
            return next(new HttpError("Fill in all fields", 422))
        }
        const user = await User.findById(req.user.id)
        if(!user) {
            return next(new HttpError("User not found", 404))
        }
        const newEmail = email.toLowerCase()
        // make sure new email doesn't exist
        const emailExists = await User.findOne({email : newEmail})
        // we want to update other detail with/without changing the email(which is a unique id because we use it to login)
        console.log(emailExists._id)
        console.log(req.user.id)
        if(emailExists && (emailExists._id != req.user.id)) {
            return next(new HttpError("Email already exist", 422))
        }
        // compare current pass  to db pass
        const validateUserPassword = await bcrypt.compare(currentPassword, user.password)
        if(!validateUserPassword) {
            return next(new HttpError("Invalid current password", 422))
        }

        //compare new pass
        if(newPassword !== newConfirmPassword) {
            return next(new HttpError("New Passwords do not match", 422))

        }

        // hash new 
        const salt = await bcrypt.genSalt(10)
        const Hash = await bcrypt.hash(newPassword, salt)

        // update user info in database
        const newInfo = await User.findByIdAndUpdate(req.user.id, {name, email, password: Hash}, {new : true})

        res.status(200).json(newInfo)
    } catch (error) {
        return next(new HttpError(error)) 
    }
}

// Get Authors
// POST : /api/users/
// PROTECTED
const getAuthors = async (req,res, next) => {
    try {
        const authors = await User.find().select('-password')
        res.json(authors)
    } catch (error) {
        return next(new HttpError(error)) 
        
    }
}


export {
    registerUser,
    loginUser,
    getUser,
    changeAvatar,
    editUser,
    getAuthors
}
















