const router = require("express").Router();
const { PrismaClient } = require("@prisma/client");
const cookieJwtAuth = require("../middleware/cookieJwtAuth");
const cloudinary = require("cloudinary").v2;
const blurhash = require("blurhash");
const Jimp = require("jimp");

const { post, user, recentSubmissions } = new PrismaClient();

router.post("/thumbnail", cookieJwtAuth, async (req, res) => {
  try {
    const deletedImage = await cloudinary.uploader.destroy(req.body.public_id);
  } catch (error) {
    return res.status(500).json({
      message: "There was a server error deleting the old image",
      error,
    });
  }

  let uploadedResponse;
  try {
    uploadedResponse = await cloudinary.uploader.upload(req.body.file);
  } catch (error) {
    return res.status(500).json({
      message:
        "There was a server issue trying to upload a new account image to cloudinary",
      error,
    });
  }

  try {
    const foundUser = await user.update({
      where: {
        username: req.user.username,
      },
      data: {
        thumbnail: uploadedResponse.secure_url,
      },
    });
    if (!foundUser) {
      return res.status(400).json({ message: "User not found" });
    }
    return res.status(200).json({
      message: "New account thumbnail successfully saved",
      thumbnail: uploadedResponse.secure_url,
    });
  } catch (error) {
    return res.status(500).json({
      message:
        "Server error trying to find a user for uploading new account image",
      error,
    });
  }
});

router.post("/", cookieJwtAuth, async (req, res) => {
  let base64String = req.body.file;
  const base64Data = base64String.replace(/^data:image\/\w+;base64,/, "");
  const image = Buffer.from(base64Data, "base64");

  let hash;
  try {
    hash = await new Promise((resolve, reject) => {
      Jimp.read(image, (err, img) => {
        if (err) reject(err);
        const width = img.bitmap.width;
        const height = img.bitmap.height;
        const blurhashString = blurhash.encode(
          img.bitmap.data,
          width,
          height,
          4,
          3
        );
        resolve(blurhashString);
      });
    });
  } catch (error) {
    res.status(500).json({
      message: "There was an error with creating the hash for this image.",
      error,
    });
  }

  let uploadedResponse;
  try {
    uploadedResponse = await cloudinary.uploader.upload(req.body.file);
  } catch (error) {
    console.error(error);
    return res
      .status(500)
      .json({ message: "There was an error uploading. Please try again." });
  }

  let nsfw;
  if (req.body.nsfw === "nsfw") {
    nsfw = true;
  }
  if (req.body.nsfw === "sfw") {
    nsfw = false;
  }

  let newPost;
  try {
    newPost = await post.create({
      data: {
        title: req.body.title,
        image: uploadedResponse.secure_url,
        description: req.body.description,
        userId: req.user.id,
        tags: req.body.tags,
        hash: hash,
        NSFW: nsfw,
      },
    });
  } catch (error) {
    console.error(error);
    return res
      .status(500)
      .json({ message: "There was an issue creating a new post", error });
  }

  const jsonStringifyPost = JSON.stringify(newPost);
  const jsonParsedPost = JSON.parse(jsonStringifyPost);

  try {
    await recentSubmissions.create({
      data: {
        submissions: jsonParsedPost,
      },
    });

    return res.status(200).json({
      message: "Successfully uploaded image",
      newPost,
      uploadedResponse,
    });
  } catch (error) {
    console.error(error);
    return res
      .status(500)
      .json({ message: "Server could not add to recent submissions", error });
  }
});

module.exports = router;
