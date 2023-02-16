const router = require("express").Router();
const { PrismaClient } = require("@prisma/client");
const bcrypt = require("bcrypt");
const nodemailer = require("nodemailer");

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

router.post("/email", async (req, res) => {
  const transporter = nodemailer.createTransport({
    service: "hotmail",
    auth: {
      user: "steamywolf-website@outlook.com",
      pass: process.env.NODEMAILER_PASS,
    },
  });

  const options = {
    from: "steamywolf-website@outlook.com",
    to: req.body.email,
    subject: "Welcome to SteamyWolf!",
    text: `Welcome ${req.body.username} to SteamyWolf. We are so glad that you decided to join our website. Feel free to respond to this email for any feedback or questions that you might have. Have fun!`,
  };

  transporter.sendMail(options, (err, info) => {
    if (err) {
      return res
        .status(500)
        .json({ message: "Error trying to send sign up email", err });
    }
    return res.status(200).json({ message: "Email sent successfully", info });
  });
});

router.post("/", async (req, res) => {
  const { username, email, password } = req.body;

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
