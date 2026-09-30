const arduinoService = require("../services/arduinoService");



exports.verifyCode = async (
  req,
  res
) => {

  try {

    const {
      code,
      board
    } = req.body;

    console.log("VERIFY REQUEST");

    const result =
      await arduinoService.verifyCode(
        code,
        board
      );

    console.log("COMPILE DONE");

    res.json(result);

  } catch (err) {

    console.error(
      "VERIFY ERROR:",
      err
    );

    res.status(500).json({
      success: false,
      message: err.message
    });
  }
};

exports.compileUpload = async (
  req,
  res
) => {

  try {

    const {
      code,
      board
    } = req.body;

    const result =
      await arduinoService.compileForUpload(
        code,
        board
      );

    res.json(result);

  } catch (err) {

    console.error(
      "UPLOAD COMPILE ERROR:",
      err
    );

    res.status(500).json({
      success: false,
      message: err.message
    });
  }
};