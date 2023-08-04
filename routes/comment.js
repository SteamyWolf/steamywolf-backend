const router = require("express").Router();
const { PrismaClient } = require("@prisma/client");
const cookieJwtAuth = require("../middleware/cookieJwtAuth");

const { comment } = new PrismaClient();

router.post("/", cookieJwtAuth, async (req, res) => {
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

router.post('/update', async (req, res) => {
  const passedComment = req.body.comment;
  try {
    const updatedComment = await comment.update({
      where: {
        id: passedComment.id
      },
      data: {
        text: passedComment.text
      }
    })
    return res.status(200).json({message: 'Successfully saved edited comment', updatedComment})
  } catch (error) {
    return res.status(500).json({message: 'Edited comment not saved', error});
  }
});

router.delete('/delete/:commentId', async (req, res) => {
  const commentId = req.params.commentId;
  try {
    const deletedComment = await comment.delete({
      where: {
        id: +commentId
      }
    })
    return res.status(200).json({message: 'Comment deleted successfully', deletedComment})
  } catch (error) {
    return res.status(500).json({message: 'Comment unsuccessfully deleted. Error.', error})
  }
})

module.exports = router;
