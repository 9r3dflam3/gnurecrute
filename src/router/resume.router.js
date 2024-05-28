import express from "express";
import authMiddleware from "../middleware/auth.middleware.js";
import { prisma } from "../utils/prisma.util.js";
import { Prisma } from "@prisma/client";

const router = express.Router();

//이력서 생성
router.post("/resumes", authMiddleware, async (req, res, next) => {
  try {
    const { userId } = req.user;
    const { title, comment } = req.body;

    if (!title) {
      return res.status(400).json({ error: "제목을 입력해 주세요." });
    }
    if (!comment || comment.length < 150) {
      return res
        .status(400)
        .json({ error: "자기소개는 150자 이상 작성해야 합니다." });
    }

    const resume = await prisma.resumes.create({
      data: {
        userId,
        title,
        comment,
      },
    });
    return res.status(201).json({ messge: "이력서 생성 성공!", resume });
  } catch (error) {
    next(error);
  }
});

//이력서 목록 조회 api
router.get("/resumes", authMiddleware, async (req, res, next) => {
  try {
    const { userId, role } = req.user;
    const { sort, status } = req.query;

    const querySort = sort && sort.toLowerCase() === "asc" ? "asc" : "desc";
    const queryStatus = status ? { status: status.toUpperCase() } : {};

    const Role = { userId };

    const resume = await prisma.resumes.findMany({
      where: { ...Role, ...queryStatus },
      select: {
        resumeId: true,
        user: {
          select: {
            name: true,
          },
        },
        title: true,
        comment: true,
        status: true,
        createAt: true,
        updateAt: true,
      },
      orderBy: {
        createAt: querySort,
      },
    });

    return res.status(200).json({ message: "이력서 조회 성공!", resume });
  } catch (error) {
    next(error);
  }
});

//이력서 상세 조회 api
router.get("/resumes/:resumeId", authMiddleware, async (req, res, next) => {
  try {
    const { userId, role } = req.user;
    const { resumeId } = req.params;

    const Role = { userId, resumeId: +resumeId };

    const resume = await prisma.resumes.findFirst({
      where: Role,
      select: {
        resumeId: true,
        user: {
          select: {
            name: true,
          },
        },
        title: true,
        comment: true,
        status: true,
        createAt: true,
        updateAt: true,
      },
    });

    if (!resume) {
      throw new Error("이력서가 존재하지 않습니다.");
    }

    return res.status(200).json({ message: "이력서 상세 조회 성공!", resume });
  } catch (error) {
    next(error);
  }
});

//이력서 수정 api
router.patch("/resumes/:resumeId", authMiddleware, async (req, res, next) => {
  try {
    const { userId } = req.user;
    const { resumeId } = req.params;
    const { title, comment } = req.body;

    const resume = await prisma.resumes.findFirst({
      where: { userId, resumeId: +resumeId },
    });

    if (!resume) {
      throw new Error("이력서가 존재하지 않습니다.");
    }

    if (!title && !comment) {
      return res
        .status(400)
        .json({ errorMessage: "수정할 정보를 입력해주세요." });
    }

    if (comment && comment.length < 150) {
      return res
        .status(400)
        .json({ errorMessage: "자기소개는 150자 이상 작성해야 합니다." });
    }

    const updatedResume = await prisma.resumes.update({
      where: { userId, resumeId: +resumeId },
      data: {
        title,
        comment,
      },
    });

    return res
      .status(201)
      .json({ message: "이력서 수정 성공!", resume: updatedResume });
  } catch (error) {
    next(error);
  }
});

//이력서 삭제 api
router.delete("/resumes/:resumeId", authMiddleware, async (req, res, next) => {
  try {
    const { userId } = req.user;
    const { resumeId } = req.params;

    const resume = await prisma.resumes.findFirst({
      where: { userId, resumeId: +resumeId },
    });

    if (!resume) {
      throw new Error("이력서가 존재하지 않습니다.");
    }

    await prisma.resumes.delete({
      where: { userId, resumeId: +resumeId },
    });

    return res.status(200).json({ message: "이력서 삭제 성공!", resumeId });
  } catch (error) {
    next(error);
  }
});

export default router;
