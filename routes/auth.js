const { PrismaClient } = require("@prisma/client");
const router = require("express").Router();
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const cookieJwtAuth = require("../middleware/cookieJwtAuth");

const prisma = new PrismaClient();

router.post("/login", async (req, res) => {
  const { username, password } = req.body;
  let user;
  try {
    user = await prisma.user.findUnique({
      where: {
        username: username,
      },
      select: {
        username: true,
        password: true,
        email: true,
        id: true,
        nsfw_checked: true,
      },
    });

    if (!user) {
      return res
        .status(401)
        .json({ message: "That username does not exist. Please try again" });
    }
  } catch (error) {
    return res.status(500).json({
      message:
        "There was an issue finding a user with that username. Please try again",
      error,
    });
  }

  try {
    const hashedPassword = await bcrypt.compare(password, user.password);

    delete user.password;
    const token = jwt.sign(user, process.env.SECRET_JWT_KEY, {
      expiresIn: "1d",
    });

    if (hashedPassword) {
      return res
        .status(200)
        .setHeader("Access-Control-Allow-Credentials", "true")
        .setHeader("Access-Control-Allow-Origin", "http://localhost:4200")
        .cookie("token", token, {
          httpOnly: true,
          sameSite: "none",
          secure: true,
          maxAge: 1000 * 60 * 60 * 60,
        })
        .json({ message: "Logged in successfully", login: true, user });
    }
    if (!hashedPassword) {
      return res
        .status(401)
        .json({ message: "Username or Password is invalid. Please try again" });
    }
  } catch (error) {
    return res
      .status(500)
      .json({ message: "There was an issue trying to hash the password" });
  }
});

router.get("/logout", (req, res) => {
  return res
    .status(200)
    .clearCookie("token")
    .json({ message: "Logged out successfully" })
    .end();
});

router.get("/current-user/:id", async (req, res) => {
  const { id } = req.params;
  try {
    const foundUser = await prisma.user.findUnique({
      where: {
        id: +id,
      },
      select: {
        id: true,
        username: true,
        posts: true,
        comments: true,
        favorites: true,
        thumbnail: true,
        email: true,
        createdAt: true,
        nsfw_checked: true,
      },
    });
    if (foundUser) {
      return res
        .status(200)
        .json({ message: "Complete user information", foundUser });
    } else {
      return res
        .status(200)
        .json({ message: "No current user found. User must not be logged in" });
    }
  } catch (error) {
    return res
      .status(400)
      .json({ message: "Server error trying to get current user", error });
  }
});

router.get("/status", cookieJwtAuth, (req, res) => {
  return res
    .status(200)
    .json({ message: "User session valid", status: true, user: req.user });
});

router.get("/:username", async (req, res) => {
  const { username } = req.params;
  try {
    const user = await prisma.user.findUnique({
      where: {
        username: username,
      },
    });

    if (user) {
      return res.status(400).json({ message: "User already exists" });
    } else {
      return res.status(200).json({ message: "Username available" });
    }
  } catch (error) {
    return res.status(500).json({ message: "There was a server error", error });
  }
});

module.exports = router;
