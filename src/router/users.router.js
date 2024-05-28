import express from "express";
import { prisma } from "../utils/prisma.util.js";
import dotenv from "dotenv";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import authMiddleware from "../middleware/auth.middleware.js";

dotenv.config();

const router = express.Router();

//회원가입
router.post("/user/sign-up", async (req, res, next) => {
  try {
    const { email, name, password, passwordConfirm } = req.body;
    const isExistUser = await prisma.users.findFirst({
      where: { email },
    });
    //필수 정보가 누락되었을 때 어떤 정보가 누락되었는지 표기
    if (!email || !name || !password || !passwordConfirm) {
      const missingField = [];
      if (!email) missingField.push("이메일");
      if (!name) missingField.push("이름");
      if (!password) missingField.push("비밀번호");
      if (!passwordConfirm) missingField.push("비밀번호 확인");
      return res
        .status(400)
        .json(
          `${missingField.join(`, `)}가 누락되었습니다. 다시 한 번 확인해주세요.`
        );
    }
    if (isExistUser) {
      return res.status(400).json(`해당 이메일로 가입된 사용자가 있습니다.`);
    }
    if (password.length < 6) {
      return res.status(400).json(`비밀번호는 6자 이상이어야 합니다.`);
    }
    if (password !== passwordConfirm) {
      return res
        .status(400)
        .json(`비밀번호가 일치하지 않습니다. 다시 한 번 확인해주세요.`);
    }

    //비밀번호 암호화
    const hashedPassword = bcrypt.hash(password, process.env.HASH);
    //유저 정보 생성 시 비밀번호는 암호화
    const user = await prisma.users.create({
      data: {
        email,
        password: hashedPassword,
        name,
      },
    });
    const { password: _, ...resUser } = user;

    return res.status(201).json({ message: "회원가입 성공!", user: resUser });
  } catch (err) {
    next(err);
  }
});

//액세스토큰 발급(24시간)
function createAccessToken(userId) {
  return jwt.sign({ userId }, process.env.ACCESS_TOKEN_SECRET_KEY, {
    expiresIn: "24h",
  });
}

//로그인
router.post("/user/login", async (req, res, next) => {
  try {
    const { email, password } = req.body;

    const user = await prisma.users.findFirst({ where: { email } });
    if (!user) {
      return res
        .status(401)
        .json({ status: 401, message: "인증 정보가 유효하지 않습니다." });
    }

    const decodePassword = await bcrypt.compare(password, user.password);
    if (!decodePassword) {
      return res
        .status(401)
        .json({ status: 401, message: "인증 정보가 유효하지 않습니다." });
    }

    const accessToken = createAccessToken(user.userId);

    return res
      .status(200)
      .json({ status: 200, message: "로그인 성공!", accessToken });
  } catch (err) {
    next(err);
  }
});

router.get("/user", authMiddleware, async (req, res, next) => {
  try {
    const { userId } = req.user;

    const user = await prisma.users.findFirst({
      where: { userId },
      select: {
        userId: true,
        email: true,
        name: true,
        role: true,
        createAt: true,
        updateAt: true,
      },
    });

    return res
      .status(200)
      .json({ message: "내 정보 조회에 성공했습니다", user });
  } catch (err) {
    next(err);
  }
});

export default router;
