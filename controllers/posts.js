import Post from "../models/Post.js";
import User from "../models/User.js";

import fs from "fs";
import { v4 as uuid } from "uuid";
import path, { dirname } from "path";
import { fileURLToPath } from "url";
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

import HttpError from "../models/Error.js";

// Create Post
// POST : api/posts
// Protected
const createPost = async (req, res, next) => {
  try {
    let { title, category, description } = req.body;
    if (!title || !category || !description || !req.files) {
      return next(
        new HttpError("Fill in all fields and choose thumbnail", 422)
      );
    }
    const { thumbnail } = req.files;
    // check the file size
    if (thumbnail.size > 2000000) {
      return next(
        new HttpError("Thumbnail too big. File should be less than 2mb", 422)
      );
    }
    let fileName = thumbnail.name;
    let splittedFilename = fileName.split(".");
    let newFilename =
      splittedFilename[0] +
      uuid() +
      "." +
      splittedFilename[splittedFilename.length - 1];
    thumbnail.mv(
      path.join(__dirname, "..", "uploads", newFilename),
      async (err) => {
        if (err) {
          return new HttpError(err);
        } else {
          const newPost = await Post.create({
            title,
            category,
            description,
            thumbnail: newFilename,
            creator: req.user.id,
          });
          if (!newPost) {
            return new HttpError("Post Couldn't be created", 422);
          }
          // find user and increase post count by 1
          const currentUser = await User.findById(req.user.id);
          const userPostCount = currentUser.allPost + 1;
          await User.findByIdAndUpdate(req.user.id, { allPost: userPostCount });

          res.status(201).json(newPost);
        }
      }
    );
  } catch (error) {
    return next(new HttpError(error));
  }
};

// Get Posts
// GET : api/posts
// Protected
const getPosts = async (req, res, next) => {
  try {
    const posts = await Post.find().sort({ updatedAt: -1 });
    res.status(201).json(posts);
  } catch (error) {
    return next(new HttpError(error));
  }
};

// Get Single Post
// GET : api/posts/:id
// Protected
const getPost = async (req, res, next) => {
  try {
    const postId = req.params.id;
    const post = await Post.findById(postId);
    if (!post) {
      return next(new HttpError("Post not found", 404));
    }
    res.status(201).json(post);
  } catch (error) {
    return next(new HttpError(error));
  }
};

// Get Posts By Category
// GET : api/posts/categories/:category
// Protected
const getCatPosts = async (req, res, next) => {
  try {
    const { category } = req.params;
    const catPosts = await Post.find({ category }).sort({ createdAt: -1 });
    res.status(201).json(catPosts);
  } catch (error) {
    return next(new HttpError(error));
  }
};

// Get Author Post
// GET : api/posts/users/:id
// Protected
const getUserPosts = async (req, res, next) => {
  try {
    const { id } = req.params;
    const posts = await Post.find({ creator: id }).sort({ createdAt: -1 });
    res.status(201).json(posts);
  } catch (error) {
    return next(new HttpError(error));
  }
};

// Edit Post
// PATCH : api/posts/:id
// Protected
const editPost = async (req, res, next) => {
  try {
    let fileName;
    let newFilename;
    let updatedPost;
    const postId = req.params.id;
    let { title, category, description } = req.body;
    // ReactQuill has a paragraph opening and closing tag with a break tag in between so there are 11 characters in there already
    if (!title || !category || description.length < 12) {
      return next(new HttpError("Fill in all fields", 422));
    }
    const oldPost = await Post.findById(postId);
    if(req.user.id == oldPost.creator){
    if (!req.files) {
      updatedPost = await Post.findByIdAndUpdate(
        postId,
        { title, category, description },
        { new: true }
      );
      res.status(200).json(updatedPost)
    } else {
      // get old post from database
      fs.unlink(
        path.join(__dirname, "..", "uploads", oldPost.thumbnail),
        async (err) => {
          if (err) {
            return new HttpError(err);
          }
        }
      );
      // Upload new Thumnail
      const { thumbnail } = req.files;
      // check the file size
      if (thumbnail.size > 2000000) {
        return next(
          new HttpError("Thumbnail too big. File should be less than 2mb", 422)
        );
      }
      fileName = thumbnail.name;
      let splittedFilename = fileName.split(".");
      newFilename =
        splittedFilename[0] +
        uuid() +
        "." +
        splittedFilename[splittedFilename.length - 1];
      thumbnail.mv(
        path.join(__dirname, "..", "uploads", newFilename),
        async (err) => {
          if (err) {
            return new HttpError(err);
          }
        }
      );
      updatedPost = await Post.findByIdAndUpdate(
        postId,
        { title, category, description, thumbnail: newFilename },
        { new: true }
      );
    }
      if (!updatedPost) {
        return new HttpError("Couldn't update post", 400);
      }
      
      res.status(200).json(updatedPost);
    }
  } catch (error) {
    return next(new HttpError(error));
  }
};

// Delete Post
// DELETE : api/posts/:id
// Protected
const deletePost = async (req, res, next) => {
  try {
    const postId = req.params.id
    if(!postId){
    return next(new HttpError("Post unavailable", 400));
    }
    const post  = await Post.findById(postId)
    const fileName = post.thumbnail
    if(req.user.id == post.creator){
    // delete file upload
    fs.unlink(
      path.join(__dirname, "..", "uploads", fileName),
      async (err) => {
        if (err) {
          return new HttpError(err);
        }else{
          await Post.findByIdAndDelete(postId)
          //find user and reduce post count by 1
          const currentUser = await User.findById(req.user.id)
          const userPostCount = currentUser.allPost - 1
          await User.findByIdAndUpdate(req.user.id, {allPost: userPostCount})
          res.status(202).json(`Post ${postId} deleted successfully`)
        }
      }
    );
  }else{
    return next(new HttpError("Post couldn't be deleted", 403))
  }
  } catch (error) {
    return next(new HttpError(error));
  }
};

export {
  createPost,
  getPost,
  getPosts,
  getCatPosts,
  getUserPosts,
  editPost,
  deletePost,
};
