const router = require("express").Router();
const { PrismaClient } = require("@prisma/client");

const { user, recentSubmissions } = new PrismaClient();

router.get("/", async (req, res) => {
  const submissions = await recentSubmissions.findMany({
    take: 20,
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

  // while (resolvedSubmissions.length > 20) {
  //   const removedSubmission = resolvedSubmissions.shift();
  //   await recentSubmissions.delete({
  //     where: {
  //       id: removedSubmission.id,
  //     },
  //   });
  // }

  res.json(resolvedSubmissions.reverse());
});

module.exports = router;
