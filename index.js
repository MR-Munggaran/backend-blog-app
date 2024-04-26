import express from 'express';
import cors from 'cors'
import { connect } from 'mongoose';
import dotenv from 'dotenv';
import upload from 'express-fileupload';
import path, { dirname } from 'path';
import { fileURLToPath } from 'url';
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);



import userRoutes from './routes/userRoutes.js'
import postRoutes from './routes/postRoutes.js'
import { errorHandler, notFound } from './middlewares/errorMiddleware.js';

dotenv.config();
const app = express()
app.use(express.json({extended : true}))
app.use(express.urlencoded({extended: true}))
app.use(cors({credentials: true, origin: "http://localhost:5173"}))
app.use(upload())
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

app.use('/api/users', userRoutes)
app.use('/api/posts', postRoutes)

app.use(notFound)
app.use(errorHandler)


connect(process.env.MONGO_URL).then(()=> {
    console.log('Connect to Database')
}).catch(err=>console.log(err))

app.listen(process.env.PORT, ()=> {
    console.log('Server running on port 5000')
})
