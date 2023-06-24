const router = require("express").Router();
const { PrismaClient } = require("@prisma/client");
const bcrypt = require("bcrypt");
const nodemailer = require("nodemailer");
const jwt = require("jsonwebtoken");
const cookieJwtAuth = require("../middleware/cookieJwtAuth");

const { user } = new PrismaClient();

const transporter = nodemailer.createTransport({
  service: "hotmail",
  auth: {
    user: "steamywolf-website@outlook.com",
    pass: process.env.NODEMAILER_PASS,
  },
});

router.post("/forgot-password", async (req, res) => {
  const { email } = req.body;
  // Make sure the email does exist in the database
  try {
    const foundUser = await user.findUnique({
      where: {
        email: email,
      },
    });
    if (foundUser.email === email) {
      const jwt_secret = process.env.SECRET_JWT_KEY + foundUser.password;
      const payload = {
        email: foundUser.email,
        id: foundUser.id,
      };
      const token = jwt.sign(payload, jwt_secret, { expiresIn: "30m" });
      const link = `http://localhost:4200/reset-password/${foundUser.id}/${token}`;
      const options = {
        from: "steamywolf-website@outlook.com",
        to: foundUser.email,
        subject: "SteamyWolf: Reset Password Request",
        html: `
          <p>It looks like you have sent a request to reset your password.</p><br>
          <p>Please click on the link below to initiate the password reset process.</p>
          <a href="${link}">${link}</a><br>
          <p>If you have not done this then please respond to this email and the account administrator will assist you.</p>
        `,
      };

      transporter.sendMail(options, (err, info) => {
        if (err) {
          return res.status(500).json({
            message: "Error trying to send password request email",
            err,
          });
        }
        return res
          .status(200)
          .json({ message: "Email sent successfully", info });
      });
    }
  } catch (error) {
    res.status(401).json({ message: "Email not found in registry", error });
  }
});

router.get("/reset-password/:id/:token", async (req, res) => {
  const { id, token } = req.params;

  // Check if this id exists in the database
  let foundUser;
  let secret;
  try {
    foundUser = await user.findUnique({
      where: {
        id: +id,
      },
    });
    secret = process.env.SECRET_JWT_KEY + foundUser.password;
  } catch (error) {
    return res
      .status(401)
      .json({ message: "Could not find user in database", error });
  }

  try {
    const payload = jwt.verify(token, secret);
    return res.status(200).json({
      message: "Token verified. User may proceed to reset password",
      payload,
    });
  } catch (error) {
    return res.status(400).json({
      message:
        "Could not verify the token for resetting the password or it has expired",
      error,
    });
  }
});

router.post("/reset-password-request", async (req, res) => {
  const { id, password } = req.body;

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
    const foundUser = await user.update({
      where: {
        id: +id,
      },
      data: {
        password: hashedPassword,
      },
      select: {
        id: true,
        username: true,
      },
    });
    return res
      .status(200)
      .json({ message: "Successfully updated user password", foundUser });
  } catch (error) {
    return res.status(500).json({
      message: "Error when trying to update the user password",
      error,
    });
  }
});

router.get("/", async (req, res) => {
  try {
    const users = await user.findMany({
      select: {
        id: true,
        username: true,
        email: true,
        posts: true,
      },
    });
    return res.status(200).json(users);
  } catch (error) {
    return res
      .status(500)
      .json({ message: "There was an issue with geting all users", error });
  }
});

router.post("/email", async (req, res) => {
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

  try {
    const emailExists = await user.findUnique({
      where: {
        email: email,
      },
      select: {
        email: true,
      },
    });

    if (emailExists) {
      return res
        .status(400)
        .json({
          message:
            "Email already exists. Try logging in with that email instead",
        });
    }
  } catch (error) {
    return res
      .status(500)
      .json({
        message: "There was a server issue with fetching the user email",
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

router.post("/nsfw", cookieJwtAuth, async (req, res) => {
  try {
    const foundUser = await user.update({
      where: {
        id: req.user.id,
      },
      data: {
        nsfw_checked: req.body.nsfw,
      },
      select: {
        comments: true,
        createdAt: true,
        email: true,
        favorites: true,
        id: true,
        nsfw_checked: true,
        posts: true,
        thumbnail: true,
        username: true,
      },
    });
    return res.status(200).json({ message: "Updated nsfw_checked", foundUser });
  } catch (error) {
    return res.status(500).json({
      message: "There was a server error updating the nsfw_checked",
      error,
    });
  }
});

module.exports = router;
