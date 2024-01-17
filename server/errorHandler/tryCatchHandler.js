module.exports = (func) => (req, res, next) =>
  func(req, res, next).catch((error) =>
    res.status(500).json({ message: error?.message, error })
  );
