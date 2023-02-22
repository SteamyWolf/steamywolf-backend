const jwt = require("jsonwebtoken");

const cookieJwtAuth = (req, res, next) => {
  const token = req.cookies.token;
  try {
    const user = jwt.verify(token, process.env.SECRET_JWT_KEY);
    req.user = user;
    next();
  } catch (error) {
    return res
      .status(401)
      .clearCookie("token")
      .json({ message: "Token does not exist or has expired", error });
  }
};

module.exports = cookieJwtAuth;
