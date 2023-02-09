const router = require("express").Router();
const { PrismaClient } = require("@prisma/client");

const { user, recentSubmissions } = new PrismaClient();

router.get("/browse/:skip/:take", async (req, res) => {
  try {
    const submissions = await recentSubmissions.findMany({
      skip: +req.params.skip,
      take: +req.params.take,
      orderBy: {
        id: "desc",
      },
    });

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

    return res.status(200).json(resolvedSubmissions);
  } catch (error) {
    return res
      .status(500)
      .json({ message: "There was an issue with fetching the posts.", error });
  }
});

router.get("/count", async (req, res) => {
  try {
    const count = await recentSubmissions.count();
    return res.status(200).json(count);
  } catch (error) {
    return res
      .status(500)
      .json({ message: "Could not get the count of the submissions", error });
  }
});

router.get("/:page", async (req, res) => {
  console.log(req.params.page);
  let submissions;
  if (req.params.page === "home") {
    submissions = await recentSubmissions.findMany({
      take: 20,
    });
  }
  if (req.params.page === "browse") {
    submissions = await recentSubmissions.findMany();
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

  res.json(resolvedSubmissions.reverse());
});

module.exports = router;
