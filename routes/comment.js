const router = require("express").Router();
const { PrismaClient } = require("@prisma/client");
const cookieJwtAuth = require("../middleware/cookieJwtAuth");

const { post, user, comment } = new PrismaClient();

router.post("/", cookieJwtAuth, async (req, res) => {
  console.log(req.user);
  try {
    const newComment = await comment.create({
      data: {
        userId: req.user.id,
        postId: req.body.postId,
        text: req.body.comment,
      },
    });
    return res.status(200).json({ message: "Comment created", newComment });
  } catch (error) {
    return res.status(500).json({
      message: "There was a server issue with creating a comment",
      error,
    });
  }
});

module.exports = router;
