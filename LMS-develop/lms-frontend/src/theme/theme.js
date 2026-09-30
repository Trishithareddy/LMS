import { createTheme } from "@mui/material/styles";

export const getTheme = (mode) =>
  createTheme({
    palette: {
      mode,
      primary: {
        main: "#1976d2",
      },
      background: {
        default: mode === "light" ? "#F9F8F6" : "#121212",
        paper: mode === "light" ? "#ffffff" : "#1E1E1E",
      },
    },
  });