import React, { useState } from "react";
import { Button, Box, Typography } from "@mui/material";
import { detectBoard }
  from "../../utils/detectBoard";

export default function ArduinoBoardConnect({
  port,
  setPort,
  setSelectedBoard
}) {

  const [connected, setConnected] = useState(false);
  const [boardInfo, setBoardInfo] = useState(null);
  const [detectedBoardName,
    setDetectedBoardName] =
    useState("");

  const connectBoard = async () => {

    try {

      if (!("serial" in navigator)) {
        alert("Web Serial API not supported");
        return;
      }

      // ONLY SELECT PORT
      const selectedPort =
        await navigator.serial.requestPort();

      const info =
        selectedPort.getInfo();

      const result =
        detectBoard(info);

      console.log(
        "Detected:",
        result
      );

      setDetectedBoardName(
        result.name
      );

      if (
        result.board &&
        setSelectedBoard
      ) {

        setSelectedBoard(
          result.board
        );
      }
      setPort(selectedPort);

      setBoardInfo(info);

      setConnected(true);

      alert("Board Selected");

    } catch (err) {

      console.error(err);

      alert("Connection Failed");
    }
  };

  const disconnectBoard = async () => {

    try {

      if (port) {

        try {

          await port.close();

          console.log(
            "PORT CLOSED"
          );

        } catch (err) {

          console.log(
            "PORT ALREADY CLOSED"
          );
        }
      }

      setConnected(false);

      setBoardInfo(null);

      setDetectedBoardName("");

      setPort(null);

      alert("Board Disconnected");

    } catch (err) {

      console.error(
        "DISCONNECT ERROR:",
        err
      );

      alert("Disconnect Failed");
    }
  };

  return (
    <Box sx={{ mt: 2 }}>

      {!connected ? (
        <Button
          variant="contained"
          color="success"
          onClick={connectBoard}
        >
          CONNECT BOARD
        </Button>
      ) : (
        <Button
          variant="contained"
          color="error"
          onClick={disconnectBoard}
        >
          DISCONNECT BOARD
        </Button>
      )}

      {connected && (
        <Box sx={{ mt: 2 }}>

          <Typography>
            ✅ Board Selected
          </Typography>

          <Typography>
            Vendor ID: {boardInfo?.usbVendorId}
          </Typography>

          <Typography>
            Product ID: {boardInfo?.usbProductId}
          </Typography>

          <Typography color="green">
            Detected Device: {detectedBoardName}
          </Typography>

          {detectedBoardName === "FTDI USB Serial" && (
            <Typography color="orange">
              Please select board manually
            </Typography>
          )}

          {detectedBoardName === "CH340 USB Serial" && (
            <Typography color="orange">
              Please select board manually
            </Typography>
          )}

        </Box>
      )}

    </Box>
  );
}