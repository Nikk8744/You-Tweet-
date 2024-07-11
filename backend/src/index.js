// require('dotenv').config({path: './env'})

// import dotenv from "dotenv"
import connectDB from "./db/index.js";
import {app} from './app.js'
// dotenv.config({
//     path: './.env'
// })

// The new release of @nodejs fixes long due problem of environment variables issue.  No external package is required.
// so i've used it here instead of the above method -- its pretty dope:)
process.loadEnvFile;



connectDB()
.then(() => {
    app.listen(process.env.PORT || 8000, () => {
        console.log(`Server is running at port : ${process.env.PORT}`);
    })
})
.catch((err) => {
    console.log("MONGO db connection failed !!! ", err);
})










/*
import express from "express"
const app = express()
( async () => {
    try {
        await mongoose.connect(`${process.env.MONGODB_URI}/${DB_NAME}`)
        app.on("errror", (error) => {
            console.log("ERRR: ", error);
            throw error
        })

        app.listen(process.env.PORT, () => {
            console.log(`App is listening on port ${process.env.PORT}`);
        })

    } catch (error) {
        console.error("ERROR: ", error)
        throw err
    }
})()

*/