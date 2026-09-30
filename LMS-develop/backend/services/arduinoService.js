const { exec } = require("child_process");
const fs = require("fs");
const path = require("path");
const ARDUINO_CLI = "/root/LMS/backend/bin/arduino-cli";
// const TEMP_DIR = path.join(__dirname, "../scripts/temp");
const os = require("os");

const TEMP_DIR =
  path.join(
    os.tmpdir(),
    "arduino-temp"
  );

if (!fs.existsSync(TEMP_DIR)) {
  fs.mkdirSync(TEMP_DIR, { recursive: true });
}

exports.verifyCode = (
  code,
  board = "uno"
) => {

  return new Promise((resolve) => {

    const sketchName =
      `sketch_${Date.now()}`;

    const sketchDir =
      path.join(TEMP_DIR, sketchName);

    fs.mkdirSync(sketchDir, {
      recursive: true
    });

    const filePath =
      path.join(
        sketchDir,
        `${sketchName}.ino`
      );

    fs.writeFileSync(
      filePath,
      "\n" + code
    );

    let fqbn = "";

    if (board === "uno") {
      fqbn = "arduino:avr:uno";
    }

    if (board === "esp32") {
      fqbn = "esp32:esp32:esp32";
    }

    exec(
      `${ARDUINO_CLI} compile --fqbn ${fqbn} "${sketchDir}"`,
      {
        maxBuffer: 1024 * 1024 * 50
      },
      (error, stdout, stderr) => {

        if (error) {

          return resolve({
            success: false,
            errors: parseErrors(
              stderr,
              sketchName
            ),
            raw: stderr
          });
        }

        resolve({
          success: true,
          output: stdout
        });
      }
    );
  });
};


exports.compileForUpload = (
  code,
  board = "uno"
) => {
  return new Promise((resolve) => {
    // 🔥 unique sketch name
    const sketchName = `sketch_${Date.now()}`;
    const sketchDir = path.join(TEMP_DIR, sketchName);

    fs.mkdirSync(sketchDir, { recursive: true });

    // 🔥 IMPORTANT: filename MUST match folder name
    const filePath = path.join(sketchDir, `${sketchName}.ino`);

    // small fix for line alignment
    fs.writeFileSync(filePath, "\n" + code);
    let fqbn = "";

    if (board === "uno") {
      fqbn = "arduino:avr:uno";
    }

    if (board === "esp32") {
      fqbn = "esp32:esp32:esp32";
    }
    exec(
      "which arduino-cli",
      (err, stdout, stderr) => {
        console.log("WHICH:", stdout);
        console.log("ERR:", stderr);
      }
    );
    exec(
      `${ARDUINO_CLI} compile --fqbn ${fqbn} --output-dir "${sketchDir}/build" "${sketchDir}"`,
      (error, stdout, stderr) => {

        if (error) {
          return resolve({
            success: false,
            errors: parseErrors(stderr, sketchName),
            raw: stderr
          });
        }

        const buildPath = path.join(sketchDir, "build");

        const files = fs.readdirSync(buildPath);

        console.log("FILES:", files);

        if (board === "uno") {

          const hexFile = files.find(
            file =>
              file.endsWith(".hex") &&
              !file.includes("with_bootloader")
          );

          if (!hexFile) {

            return resolve({
              success: false,
              raw: "HEX file not generated"
            });
          }

          const hexPath =
            path.join(buildPath, hexFile);

          const hexContent =
            fs.readFileSync(
              hexPath,
              "base64"
            );

          return resolve({
            success: true,
            board: "uno",
            hexContent
          });
        }

        if (board === "esp32") {

          const firmwareFile =
            files.find(
              file =>
                file.endsWith(".bin") &&
                !file.includes("bootloader") &&
                !file.includes("partitions")
            );

          const bootloaderFile =
            files.find(
              file =>
                file.includes("bootloader") &&
                file.endsWith(".bin")
            );

          const partitionsFile =
            files.find(
              file =>
                file.includes("partitions") &&
                file.endsWith(".bin")
            );

          if (
            !firmwareFile ||
            !bootloaderFile ||
            !partitionsFile
          ) {

            return resolve({
              success: false,
              raw: "ESP32 BIN files missing"
            });
          }

          const firmware =
            fs.readFileSync(
              path.join(buildPath, firmwareFile),
              "base64"
            );

          const bootloader =
            fs.readFileSync(
              path.join(buildPath, bootloaderFile),
              "base64"
            );

          const partitions =
            fs.readFileSync(
              path.join(buildPath, partitionsFile),
              "base64"
            );

          return resolve({
            success: true,
            board: "esp32",
            firmware,
            bootloader,
            partitions
          });
        }

      }
    );

  });
};

// 🔍 Extract line numbers (UPDATED)
function parseErrors(stderr, sketchName) {
  const lines = stderr.split("\n");

  return lines
    .map(line => {
      const regex = new RegExp(`${sketchName}\\.ino:(\\d+):(\\d+):\\s(error|warning):\\s(.+)`);
      const match = line.match(regex);

      if (match) {
        return {
          line: parseInt(match[1]),
          type: match[3],
          message: match[4]
        };
      }
      return null;
    })
    .filter(Boolean);
}
