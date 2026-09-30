import React from "react";
import ReactDOM from "react-dom/client";
import App from "./App.jsx";
import { CustomThemeProvider } from "./contexts/ThemeContext.jsx";
import AuthProvider from "./contexts/AuthContext.jsx"; // ✅ add this
import  { Toaster } from 'react-hot-toast';

ReactDOM.createRoot(document.getElementById("root")).render(
  <AuthProvider>
    <CustomThemeProvider>
      <App />
      <Toaster position="top-center" reverseOrder={false} />
    </CustomThemeProvider>
  </AuthProvider>
);
