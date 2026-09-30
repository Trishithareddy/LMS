import {
  ESPLoader,
  Transport
} from "esptool-js";

function base64ToUint8Array(base64) {

  const binary = atob(base64);

  const bytes =
    new Uint8Array(binary.length);

  for (let i = 0; i < binary.length; i++) {

    bytes[i] =
      binary.charCodeAt(i);
  }

  return bytes;
}

export async function flashESP32(
  port,
  files
) {

  let transport = null;

  try {

    console.log(
      "STARTING ESP32 FLASH"
    );

    // =========================
    // CREATE TRANSPORT
    // =========================

    transport =
      new Transport(port);

    // =========================
    // ESP LOADER
    // =========================

    const esploader =
      new ESPLoader({

        transport,

        baudrate: 115200,

        terminal: {

          clean() { },

          write(data) {
            console.log(data);
          },

          writeLine(data) {
            console.log(data);
          }
        }
      });

    // =========================
    // CONNECT CHIP
    // =========================

    await esploader.main();

    console.log(
      "ESP CONNECTED"
    );

    // =========================
    // WRITE FLASH
    // =========================

    await esploader.writeFlash({

      fileArray: [

        {
          data:
            base64ToUint8Array(
              files.bootloader
            ),

          address: 0x1000
        },

        {
          data:
            base64ToUint8Array(
              files.partitions
            ),

          address: 0x8000
        },

        {
          data:
            base64ToUint8Array(
              files.firmware
            ),

          address: 0x10000
        }
      ],

      flashSize: "keep",

      flashMode: "keep",

      flashFreq: "keep",

      eraseAll: false,

      compress: true
    });


    // =========================
    // CLEANUP + AUTO RESET
    // =========================

    // WAIT FOR FLASH TO FINISH

    await new Promise(
      r => setTimeout(r, 1000)
    );

    // OFFICIAL ESPTOOL RESET

    await esploader.after();

    // EXTRA HARD RESET

    await port.setSignals({
      dataTerminalReady: false,
      requestToSend: true,
    });

    await new Promise(
      r => setTimeout(r, 200)
    );

    await port.setSignals({
      dataTerminalReady: false,
      requestToSend: false,
    });

    await new Promise(
      r => setTimeout(r, 1000)
    );

    // DISCONNECT SERIAL

    await transport.disconnect();

    console.log(
      "FLASH COMPLETE"
    );

    return true;

  } catch (err) {

    console.error(
      "ESP32 FLASH ERROR:",
      err
    );

    try {

      if (transport) {

        await transport.disconnect();
      }

    } catch { }

    return false;
  }
}