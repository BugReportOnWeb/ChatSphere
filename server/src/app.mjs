import express from 'express';
import { createServer } from 'http';
import { Server } from 'socket.io';
import userRouter from './routes/userRouter.mjs';
import mongoose from 'mongoose';
import dotenv from 'dotenv';
import cors from 'cors'; // Import the cors middleware
import User from './models/users.mjs';
import { notFound, errorHandler } from '../src/middleware/errorHandler.mjs';
import chatRouter from './routes/chatRouter.mjs';
import messageRouter  from './routes/messageRouter.mjs'

dotenv.config();

const MONGO_URI = process.env.MONGO_URI; 
const PORT = process.env.PORT ?? 3000;

const app = express();

app.use(cors());

app.use(express.json());
app.use('/api/users', userRouter);
app.use('/api/chat', chatRouter);
app.use('/api/message', messageRouter);



const server = createServer(app);
const io = new Server(server, {
    cors: {
      origin: "*",
      methods: ["GET", "POST"]
    }
  });  

io.on("connection", socket => {
    console.log(`${socket.id} connected`);

    socket.on("setup", (userData) => {
        console.log(userData);
        socket.join(userData._id);
        socket.emit("connected");
    })

    socket.on("join chat", (room) => {
        socket.join(room);
        console.log("User Joined Room: " + room);
    });
    socket.on("typing", (room) => socket.in(room).emit("typing"));
    socket.on("stop typing", (room) => socket.in(room).emit("stop typing"));

    socket.on("new message", (newMessageRecieved) => {
        var chat = newMessageRecieved.chat;

        if (!chat.users) return console.log("chat.users not defined");

        chat.users.forEach((user) => {
            if (user._id == newMessageRecieved.sender._id) return;
            console.log("emitting to " + user._id);
            socket.in(user._id).emit("message recieved", newMessageRecieved);
        });
    });

    socket.on("disconnect", () => {
        console.log(`${socket.id} disconnected`);
    })
});

app.get('/health', (_req, res) => {
    res.send({ health: 'OK' })
})


//app.use(notFound);
app.use(errorHandler);

// Mongoose connection

mongoose.connect(MONGO_URI, { useNewUrlParser: true, useUnifiedTopology: true })
    .then(() => {
        console.log("Connected to MongoDB");
        // Start the Express.js server
        server.listen(PORT, () => {
            console.log(`Server listening on port ${PORT}`);
        });
    })
    .catch(error => {
        console.error("Error connecting to MongoDB:", error);
        process.exit(1); // Exit the process if MongoDB connection fails
    });
