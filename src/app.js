import express from "express"
import cors from "cors"
import cookiesParser from "cookie-parser"



const app=express()

app.use(cors({
    origin:process.env.CORS_ORIGIN,
    credentials:true
}))



app.use(express.json({ limit:"16kb"}))
app.use(express.urlencoded({extended:true,limit:"16kb"}))
app.use(express.static("public"))
app.use(cookiesParser())

//router import
import userRouter from './routes/user.routes.js'
import videoRouter from './routes/video.routes.js'
import tweetRoute from './routes/tweet.routes.js'
import SubscriptionRoute  from "./routes/subscription.routes.js"
import playlistRoute from "./routes/playlist.routes.js"
import likeRouter from "./routes/like.routes.js"

//route decleration
app.use("/api/v1/users",userRouter)
app.use("/api/v1/videos",videoRouter)
app.use("/api/v1/tweet",tweetRoute)
app.use("/api/v1/subscriptions",SubscriptionRoute)
app.use("/api/v1/playlist",playlistRoute)
app.use("/api/v1/like",likeRouter)

export {app}

