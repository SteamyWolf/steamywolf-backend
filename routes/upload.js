const router = require("express").Router();
const { PrismaClient } = require("@prisma/client");
const cookieJwtAuth = require("../middleware/cookieJwtAuth");
const cloudinary = require("cloudinary").v2;

const { post, user, recentSubmissions } = new PrismaClient();

router.post("/", cookieJwtAuth, async (req, res) => {
  let uploadedResponse;
  try {
    uploadedResponse = await cloudinary.uploader.upload(req.body.file);
  } catch (error) {
    console.error(error);
    return res
      .status(500)
      .json({ message: "There was an error uploading. Please try again." });
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
