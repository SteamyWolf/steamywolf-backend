const express = require("express");
const dotenv = require("dotenv");
const cors = require("cors");
const cookieParser = require("cookie-parser");

const userRoute = require("./routes/user");
const postRoute = require("./routes/post");
const recentSubmissionsRoute = require("./routes/recentSubmissions");
const authRoute = require("./routes/auth");
const uploadRoute = require("./routes/upload");
const commentRoute = require("./routes/comment");

const cloudinary = require("cloudinary").v2;
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

const app = express();

dotenv.config();
const PORT = process.env.PORT || 4000;

app.use(cookieParser());
app.use(cors({ credentials: true, origin: "http://localhost:4200" }));
app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ limit: "10mb" }));
app.use("/api/user", userRoute);
app.use("/api/post", postRoute);
app.use("/api/submissions", recentSubmissionsRoute);
app.use("/api/auth", authRoute);
app.use("/api/upload", uploadRoute);
app.use("/api/comment", commentRoute);

app.listen(PORT, () => {
  console.log(`listening on port ${PORT}`);
});
