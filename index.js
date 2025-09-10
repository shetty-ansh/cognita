import mongoose from "mongoose";
import express from "express";
import dotenv from "dotenv"
import connectDB from "./src/db/db.js";


dotenv.config()
const PORT = process.env.PORT || 3000
const app = express()


app.listen(PORT, () => {
    if (connectDB){
        try {
            console.log(`Server is up and running at http://localhost:${PORT}`)
        } catch (error) {
            console.log("Couldn't start server")
        }
    }
    else{
        console.log("Problem starting up teh server. Database might not be connected")
    }
})

app.get("/", (req, res) => {
    res.send("Helloooo")
})