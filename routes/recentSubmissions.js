const router = require("express").Router();
const { PrismaClient } = require("@prisma/client");

const { user, recentSubmissions, post } = new PrismaClient();

// This should be pulling from the post section of the db and not the recent submissions
router.get("/browse/:skip/:take/:nsfw", async (req, res) => {
  try {
    let submissions;
    if (req.params.nsfw === "true") {
      submissions = await post.findMany({
        skip: +req.params.skip,
        take: +req.params.take,
        orderBy: {
          id: "desc",
        },
      });
    } else {
      submissions = await post.findMany({
        where: {
          NSFW: false,
        },
        skip: +req.params.skip,
        take: +req.params.take,
        orderBy: {
          id: "desc",
        },
      });
    }

    const mappedSubmissions = submissions.map(async (submission) => {
      const userSubmission = await user.findUnique({
        where: {
          id: submission.userId
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
    return res
      .status(500)
      .json({ message: "There was an issue with fetching the posts.", error });
  }
});


//This should be in the post route. The url call will need to be updated in the front-end
router.get("/count/:nsfw", async (req, res) => {
  try {
    let count;
    if (req.params.nsfw === 'true') {
      count = await post.count();
    } else {
      count = await post.count({
        where: {
          NSFW: false
        },
      });
    }
    return res.status(200).json(count);
  } catch (error) {
    return res
      .status(500)
      .json({ message: "Could not get the count of the submissions", error });
  }
});

router.get("/:nsfw", async (req, res) => {
  let submissions;
  try {
    if (req.params.nsfw === "true") {
      submissions = await recentSubmissions.findMany({
        take: -20,
      });
    } else {
      submissions = await recentSubmissions.findMany({
        take: 20,
        where: {
          submissions: {
            path: ["NSFW"],
            equals: false,
          },
        },
      });
    }
    const mappedSubmissions = submissions.map(async (submission) => {
      const userSubmission = await user.findUnique({
        where: {
          id: submission.submissions.userId,
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

    return res.status(200).json(resolvedSubmissions.reverse());
  } catch (error) {
    return res
      .status(500)
      .json({ message: "Server error retrieving submissions", error });
  }
});

module.exports = router;
