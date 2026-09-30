
// import { parse } from "intel-hex";

function hexToBytes(hexString) {

  const lines =
    hexString.split("\n");

  const bytes = [];

  for (const line of lines) {

    if (!line.startsWith(":")) {
      continue;
    }

    const byteCount =
      parseInt(
        line.substr(1, 2),
        16
      );

    const recordType =
      parseInt(
        line.substr(7, 2),
        16
      );

    // DATA RECORD ONLY

    if (recordType !== 0) {
      continue;
    }

    const data =
      line.substr(
        9,
        byteCount * 2
      );

    for (
      let i = 0;
      i < data.length;
      i += 2
    ) {

      bytes.push(
        parseInt(
          data.substr(i, 2),
          16
        )
      );
    }
  }

  return new Uint8Array(bytes);
}
async function readResponse(reader) {

  let response = [];

  while (true) {

    const { value } =
      await reader.read();

    if (value) {

      response.push(...value);

      // STK_OK received

      if (response.includes(0x10)) {
        break;
      }
    }
  }

  return new Uint8Array(response);
}

// =====================================
// SEND COMMAND
// =====================================

async function sendCommand(
  writer,
  reader,
  command
) {

  console.log(
    "SENDING:",
    command
  );

  await writer.write(command);

  const timeoutPromise =
    new Promise((_, reject) =>
      setTimeout(
        () => reject("TIMEOUT"),
        5000
      )
    );

  const responsePromise =
    readResponse(reader);

  const response =
    await Promise.race([
      responsePromise,
      timeoutPromise
    ]);

  console.log(
    "RESPONSE:",
    response
  );

  return response;
}
// =====================================
// LOAD ADDRESS
// =====================================

async function loadAddress(
  writer,
  reader,
  address
) {

  const wordAddress =
    address / 2;

  const low =
    wordAddress & 0xFF;

  const high =
    (wordAddress >> 8) & 0xFF;

  const command =
    new Uint8Array([
      0x55,
      low,
      high,
      0x20
    ]);

  return sendCommand(
    writer,
    reader,
    command
  );
}

// =====================================
// PROGRAM PAGE
// =====================================

async function programPage(
  writer,
  reader,
  chunk
) {

  const sizeHigh =
    (chunk.length >> 8) & 0xFF;

  const sizeLow =
    chunk.length & 0xFF;

  const command =
    new Uint8Array([
      0x64,
      sizeHigh,
      sizeLow,
      0x46,
      ...chunk,
      0x20
    ]);

  return sendCommand(
    writer,
    reader,
    command
  );
}

// =====================================
// MAIN FLASH FUNCTION
// =====================================

export async function flashArduino(
  port,
  hexContent
) {

  let writer;
  let reader;

  try {

    // =========================
    // OPEN PORT
    // =========================

    await port.open({
      baudRate: 115200,
      dataBits: 8,
      stopBits: 1,
      parity: "none",
      flowControl: "none",
    });

    console.log("PORT OPENED");

    // =========================
    // RESET BOARD
    // =========================

    await port.setSignals({
      dataTerminalReady: false,
      requestToSend: true,
    });

    await new Promise(
      r => setTimeout(r, 100)
    );

    await port.setSignals({
      dataTerminalReady: true,
      requestToSend: false,
    });

    console.log("BOARD RESET");

    // WAIT FOR BOOTLOADER

    await new Promise(
      r => setTimeout(r, 1000)
    );

    // =========================
    // GET STREAMS
    // =========================

    writer =
      port.writable.getWriter();

    reader =
      port.readable.getReader();

    // =========================
    // GET SYNC
    // =========================

    const syncCommand =
      new Uint8Array([
        0x30,
        0x20
      ]);

    const syncResponse =
      await sendCommand(
        writer,
        reader,
        syncCommand
      );

    console.log(
      "SYNC RESPONSE:",
      syncResponse
    );

    if (
      !syncResponse ||
      syncResponse[0] !== 0x14
    ) {

      throw new Error(
        "BOOTLOADER NOT RESPONDING"
      );
    }

    console.log(
      "BOOTLOADER CONNECTED"
    );

    // =========================
    // ENTER PROGRAM MODE
    // =========================

    const enterProgramMode =
      new Uint8Array([
        0x50,
        0x20
      ]);

    await sendCommand(
      writer,
      reader,
      enterProgramMode
    );

    console.log(
      "PROGRAM MODE ENTERED"
    );

    // =========================
    // PARSE HEX
    // =========================

    const hexString =
  atob(hexContent);

const firmware =
  hexToBytes(hexString);

    console.log(
      "FIRMWARE SIZE:",
      firmware.length
    );

    // =========================
    // FLASH PAGES
    // =========================
for (
  let address = 0;
  address < firmware.length;
  address += 128
) {

  const chunk =
    firmware.slice(
      address,
      address + 128
    );

  console.log(
    "WRITING PAGE:",
    address
  );

  await loadAddress(
    writer,
    reader,
    address
  );

  const response =
    await programPage(
      writer,
      reader,
      chunk
    );

  console.log(
    "PAGE RESPONSE:",
    response
  );
}


// {

//       const chunk =
//         firmware.slice(
//           address,
//           address + 128
//         );

//       console.log(
//         "WRITING PAGE:",
//         address
//       );

//       // LOAD ADDRESS

//       await loadAddress(
//         writer,
//         reader,
//         address
//       );

//       // WRITE PAGE

//       await programPage(
//         writer,
//         reader,
//         chunk
//       );

//       console.log(
//         "PAGE WRITTEN:",
//         address
//       );
//     }

    // =========================
    // LEAVE PROGRAM MODE
    // =========================

    const leaveProgramMode =
      new Uint8Array([
        0x51,
        0x20
      ]);

    await sendCommand(
      writer,
      reader,
      leaveProgramMode
    );

    console.log(
      "UPLOAD COMPLETE"
    );

    alert(
      "UPLOAD SUCCESSFUL"
    );

    return true;

  } catch (err) {

    console.error(
      "UPLOAD ERROR:",
      err
    );

    alert(
      "UPLOAD FAILED"
    );

    return false;

  } finally {

    try {

      if (reader) {

        try {
          await reader.cancel();
        } catch {}

        try {
          reader.releaseLock();
        } catch {}
      }

      if (writer) {

        try {
          writer.releaseLock();
        } catch {}
      }

      try {

        await port.close();

        console.log(
          "PORT CLOSED"
        );

      } catch {}

    } catch (e) {

      console.log(
        "CLEANUP ERROR:",
        e
      );
    }
  }
}