import { Schema, model } from "mongoose";

const postSchema = new Schema({
    title: {
        type: String,
        required: true
    },
    category: {
        type: String,
        enum : ["Agriculture", "Bussiness", "Education", "Entertainment", "Art", "Investment", "Uncategorized", "Weather"],
        message: "{Value} is Not Supported"
    },
    description: {
        type: String,
        required: true,
    },
    creator: {
        type: Schema.Types.ObjectId,
        ref: "User",
    },
    thumbnail: {
        type: String
    },

}, {timestamps: true})

const Post = model('Post', postSchema)

export default Post