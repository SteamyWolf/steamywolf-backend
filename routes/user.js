const router = require("express").Router();
const { PrismaClient } = require("@prisma/client");
const bcrypt = require("bcrypt");

const { user } = new PrismaClient();

router.get("/", async (req, res) => {
  const users = await user.findMany({
    select: {
      id: true,
      username: true,
      email: true,
      posts: true,
    },
  });
  res.json(users);
});

router.post("/", async (req, res) => {
  const { username, email, password, active, thumbnail } = req.body;

  try {
    const userExists = await user.findUnique({
      where: {
        username: username,
      },
      select: {
        username: true,
      },
    });

    if (userExists) {
      return res
        .status(400)
        .json({ message: "Username already exists. Try another one" });
    }
  } catch (error) {
    return res.status(500).json({
      message: "There was a server error with your request. Please try again",
      error,
    });
  }

  let hashedPassword;
  try {
    hashedPassword = await bcrypt.hash(password, 10);
  } catch (error) {
    return res.status(500).json({
      message: "There was an issue creating that password. Please try again",
      error,
    });
  }

  try {
    const newUser = await user.create({
      data: {
        username: username,
        email: email,
        password: hashedPassword,
        active: active,
        thumbnail: thumbnail,
      },
    });

    return res.status(200).json(newUser);
  } catch (error) {
    return res.status(500).json({
      message:
        "There was an issue with creating the user into the database. Please try again",
      error,
    });
  }
});

module.exports = router;
