const express = require("express");
const router = express.Router();
const { verifyCode,compileUpload } = require("../controllers/arduinoController");

router.post("/verify", verifyCode);
router.get("/verify", (req, res) => {
  res.json({ message: "Arduino API working" });
});
router.post(
  "/compile-upload",
compileUpload
);

module.exports = router;