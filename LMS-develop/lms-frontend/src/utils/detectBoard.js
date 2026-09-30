// export function detectBoard(portInfo) {

//   const vid = portInfo.usbVendorId;
//   const pid = portInfo.usbProductId;

//   console.log(
//     "VID:", vid,
//     "PID:", pid
//   );

//   // ESP32 DevKit (CP2102)

//   if (
//     vid === 0x10C4 &&
//     pid === 0xEA60
//   ) {
//     return {
//       board: "esp32",
//       name: "ESP32 DevKit V1"
//     };
//   }

//   // Official Arduino UNO

//   if (
//     vid === 0x2341
//   ) {
//     return {
//       board: "uno",
//       name: "Arduino UNO"
//     };
//   }

//   return {
//     board: null,
//     name: "Unknown (Select manually)"
//   };
// }
import { BOARD_PROFILES }
from "../config/boardProfiles";

export function detectBoard(portInfo) {

  const vid = portInfo.usbVendorId;
  const pid = portInfo.usbProductId;

  console.log(
    "VID:", vid,
    "PID:", pid
  );

  // HIGH CONFIDENCE MATCHES

  const match =
    BOARD_PROFILES.find(
      profile =>
        profile.vid === vid &&
        (!profile.pid ||
          profile.pid === pid)
    );

  if (
    match &&
    match.board !== "unknown"
  ) {

    return {
      board: match.board,
      name: match.name,
      manualSelection: false
    };
  }

  // FTDI

  if (vid === 0x0403) {

    return {
      board: null,
      name: "FTDI USB Serial",
      manualSelection: true
    };
  }

  // CH340

  if (vid === 0x1A86) {

    return {
      board: null,
      name: "CH340 USB Serial",
      manualSelection: true
    };
  }

  // UNKNOWN

  return {
    board: null,
    name: "Unknown Device",
    manualSelection: true
  };
}