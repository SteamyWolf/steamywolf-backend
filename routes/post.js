const router = require("express").Router();
const { PrismaClient } = require("@prisma/client");

const { post, user, recentSubmissions, comment } = new PrismaClient();

// FINDS THE POST AND THEN GETS THE USER ASSOCIATED WITH THAT POST AND RETURNS IT WITH COMMENTS AND THE USER OF EACH COMMENT
router.get("/find/:postId", async (req, res) => {
  const postId = parseInt(req.params.postId);

  let foundPost;
  try {
    foundPost = await post.findUnique({
      where: {
        id: postId,
      },
      select: {
        id: true,
        title: true,
        image: true,
        description: true,
        createdAt: true,
        updatedAt: true,
        userId: true,
        comments: true,
        tags: true,
        hash: true,
      },
    });
  } catch (error) {
    return res
      .status(500)
      .json({ message: "Could not find post. Server error", error });
  }

  let mappedCommentsWithUsers;
  if (foundPost.comments.length) {
    try {
      mappedCommentsWithUsers = foundPost.comments.map(async (comment) => {
        const userFromComment = await user.findUnique({
          where: {
            id: comment.userId,
          },
        });
        return {
          user: userFromComment,
          comment,
        };
      });
    } catch (error) {
      return res.status(500).json({
        message: "Could not find user associated with comment",
        error,
      });
    }
  }

  let resolvedMappedCommentsWithUsers;
  if (mappedCommentsWithUsers && mappedCommentsWithUsers.length) {
    try {
      resolvedMappedCommentsWithUsers = await Promise.all(
        mappedCommentsWithUsers
      );
    } catch (error) {
      return res.status(500).json({
        message: "There was an issue with promise.all mapping",
        error,
      });
    }

    if (
      resolvedMappedCommentsWithUsers &&
      resolvedMappedCommentsWithUsers.length
    ) {
      foundPost.comments = resolvedMappedCommentsWithUsers;
    }
  }

  try {
    const userFound = await user.findUnique({
      where: {
        id: foundPost.userId,
      },
    });
    const response = {
      userFound,
      foundPost,
    };
    return res.status(200).json({ message: "Post found!", response });
  } catch (error) {
    return res
      .status(500)
      .json({ message: "Unable to find user associated to post.", error });
  }
});

router.get("/search/:query/:skip/:take", async (req, res) => {
  const { query, skip, take } = req.params;
  try {
    const posts = await post.findMany({
      where: {
        tags: {
          has: query,
        },
      },
      skip: +skip,
      take: +take,
      orderBy: {
        id: "desc",
      },
    });

    console.log(posts);

    const mappedSubmissions = posts.map(async (submission) => {
      const userSubmission = await user.findUnique({
        where: {
          id: submission.userId,
        },
        select: {
          id: true,
          username: true,
        },
      });
      return {
        id: submission.id,
        user: userSubmission,
        post: submission,
      };
    });

    const resolvedSubmissions = await Promise.all(mappedSubmissions);

    return res.status(200).json(resolvedSubmissions);
  } catch (error) {
    return res.status(500).json({
      message: "There was a server issue with getting the queried posts",
      error,
    });
  }
});

router.get("/search-count/:query", async (req, res) => {
  const { query } = req.params;

  try {
    const count = await post.count({
      where: {
        tags: {
          has: query,
        },
      },
    });
    return res.status(200).json(count);
  } catch (error) {
    return res.status(500).json({
      message: "There was a server issue getting the count of the search query",
      error,
    });
  }
});

// GETS ALL POSTS BY USER ID
router.get("/:userId", async (req, res) => {
  const { userId } = req.params;

  const posts = await post.findMany({
    where: {
      userId: parseInt(userId),
    },
  });

  res.json(posts);
});

// DELETES A SINGLE POST BASED ON POST ID
router.delete("/", async (req, res) => {
  const { postId } = req.body;
  try {
    const deletedPost = await post.delete({
      where: {
        id: postId,
      },
    });
    res.status(200).json(deletedPost);
  } catch (error) {
    res.status(400).json({
      message: "There was an issue deleting your post. Please try again",
      error,
    });
  }
});

module.exports = router;
