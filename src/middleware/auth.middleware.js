import jwt from "jsonwebtoken";
import { prisma } from "../utils/prisma.util.js";
import dotEnv from "dotenv";

dotEnv.config();

export default async function (req, res, next) {
  try {
    const authorization = req.headers["authorization"];

    if (!authorization) {
      return res.status(401).json({ errorMessage: "인증정보가 없습니다." });
    }

    const [TokenType, token] = authorization.split(" ");

    if (TokenType !== "Bearer") {
      return res
        .status(401)
        .json({ errorMessage: "지원하지 않는 인증 방식입니다." });
    }

    const decodeToken = jwt.verify(token, process.env.ACCESS_TOKEN_SECRET_KEY);
    const userId = decodeToken.user_id;

    const user = await prisma.users.findFirst({
      where: { userId: userId },
    });

    if (!user) {
      return res
        .status(401)
        .json({ errorMessage: "인증 정보와 일치하는 사용자가 없습니다." });
    }

    req.user = user;

    next();
  } catch (error) {
    switch (error.name) {
      case "TokenExpiredError":
        return res
          .status(401)
          .json({ errorMessage: "인증 정보가 만료되었습니다." });
      case "JsonWebTokenError":
        return res
          .status(401)
          .json({ errorMessage: "인증 정보가 유효하지 않습니다." });
      default:
        next(error);
    }
  }
}
