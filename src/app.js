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
import healthcheckupRouter from "./routes/healthcheck.routes.js"
import commentRouter from "./routes/comment.routers.js"
import dashboardRouter from "./routes/dashboard.routes.js"

//route decleration
app.use("/api/v1/users",userRouter)
app.use("/api/v1/videos",videoRouter)
app.use("/api/v1/tweet",tweetRoute)
app.use("/api/v1/subscriptions",SubscriptionRoute)
app.use("/api/v1/playlist",playlistRoute)
app.use("/api/v1/like",likeRouter)
app.use("/api/v1/healthcheckup",healthcheckupRouter)
app.use("/api/v1/comment",commentRouter)
app.use("/api/v1/dashboard",dashboardRouter)

export {app}

