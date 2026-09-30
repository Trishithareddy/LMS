import React, {
  createContext,
  useMemo,
  useState,
  useEffect,
} from "react";

import { useLocation } from "react-router-dom";
import { ThemeProvider, createTheme } from "@mui/material/styles";
import CssBaseline from "@mui/material/CssBaseline";

const ThemeContext = createContext();

const lightTheme = createTheme({
    palette: {
        mode: "light",

        primary: {
            main: "#4CAF50",
        },

        secondary: {
            main: "#FF5722",
        },

        divider: "#E5E7EB",

        background: {
            default: "#F9F8F6",
            paper: "#FFFFFF",
        },

        text: {
            primary: "#000",
            secondary: "#555",
        },
    },
    components: {
        MuiButton: {
  styleOverrides: {
    root: {
      borderRadius: 8,
      padding: "8px 16px",
      fontWeight: 600,
      textTransform: "none",
    },

    contained: {
      backgroundColor: "#4CAF50",
      color: "#fff",

      "&:hover": {
        backgroundColor: "#43A047",
      },
    },

    outlined: {
      color: "#4CAF50",
      borderColor: "#4CAF50",

      "&:hover": {
        borderColor: "#43A047",
        backgroundColor: "rgba(76,175,80,0.08)",
      },
    },

    text: {
      color: "#4CAF50",

      "&:hover": {
        backgroundColor: "rgba(76,175,80,0.08)",
      },
    },
  },
},
    },
});

// Dark Theme
const darkTheme = createTheme({
    palette: {
        mode: "dark",

        primary: {
            main: "#4CAF50",
        },

        secondary: {
            main: "#FF5722",
        },

        divider: "#3A3A3A",

        background: {
            default: "#121212",
            paper: "#1E1E1E",
        },

        text: {
            primary: "#FFFFFF",
            secondary: "#B0B0B0",
        },
    },
    components: {
       MuiButton: {
  styleOverrides: {
    root: {
      borderRadius: 8,
      padding: "8px 16px",
      fontWeight: 600,
      textTransform: "none",
    },

    contained: {
      backgroundColor: "#4CAF50",
      color: "#fff",

      "&:hover": {
        backgroundColor: "#43A047",
      },
    },

    outlined: {
      color: "#4CAF50",
      borderColor: "#4CAF50",

      "&:hover": {
        borderColor: "#43A047",
        backgroundColor: "rgba(76,175,80,0.08)",
      },
    },

    text: {
      color: "#4CAF50",

      "&:hover": {
        backgroundColor: "rgba(76,175,80,0.08)",
      },
    },
  },
},
    },
});

const CustomThemeProvider = ({ children }) => {
    const [mode, setMode] = useState("light");

    const toggleTheme = () => {
        setMode((prev) => (prev === "light" ? "dark" : "light"));
    };

    const setThemeMode = (newMode) => {
        setMode(newMode);
    };

    const theme = useMemo(
        () => (mode === "light" ? lightTheme : darkTheme),
        [mode]
    );

    return (
        <ThemeContext.Provider
            value={{
                mode,
                toggleTheme,
                setThemeMode,
            }}
        >
            <ThemeProvider theme={theme}>
                <CssBaseline />
                {children}
            </ThemeProvider>
        </ThemeContext.Provider>
    );
};

export { CustomThemeProvider, ThemeContext };
