export const errorHandler = (err, req, res, next) => {
  console.error(err);
  return res.status(500).json({
    status: 500,
    errorMessage: "예상치 못한 에러가 발생했습니다. 관리자에게 문의해주세요.",
  });
};
