import React, { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import CloseIcon from "@mui/icons-material/Close";
import SendIcon from "@mui/icons-material/Send";
import DeleteIcon from "@mui/icons-material/Delete";
import CloseFullscreenIcon from "@mui/icons-material/CloseFullscreen";
import OpenInFullIcon from "@mui/icons-material/OpenInFull";
import DownloadIcon from "@mui/icons-material/Download";
import AiraIcon from "./AIra_yellow.svg";
import {
  Box,
  IconButton,
  Paper,
  TextField,
  Typography,
  useTheme,
  useMediaQuery,
  CircularProgress,
  Tooltip,
  Button,
  Chip,
} from "@mui/material";
import axios from "axios";

// Markdown & export libs
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { Document, Packer, Paragraph, TextRun, HeadingLevel } from "docx";
import { saveAs } from "file-saver";
import jsPDF from "jspdf";
import html2canvas from "html2canvas";

const HEADER_HEIGHT = 64;
const SAFE_AREA_BOTTOM = 34;

const QUICK_PROMPTS = [
  {
    label: "Summary",
    prompt: "Using only this chapter PDF, give a short and clear chapter summary with key points.",
  },
  {
    label: "5 MCQs",
    prompt: "Using only this chapter PDF, generate 5 MCQs with 4 options, correct answer, and a short explanation.",
  },
  {
    label: "Important Qs",
    prompt: "Using only this chapter PDF, generate 8 important exam-oriented questions with answers.",
  },
  {
    label: "Short Notes",
    prompt: "Using only this chapter PDF, create short notes that a student can revise quickly.",
  },
  {
    label: "Glossary",
    prompt: "Using only this chapter PDF, create a glossary of important terms with simple meanings.",
  },
  {
    label: "Homework",
    prompt: "Using only this chapter PDF, create 5 homework questions with answers.",
  },
];


// --- markdown -> MUI components with tighter spacing
const markdownComponents = {
  p: ({ node, children, ...props }) => (
    <Typography component="p" variant="body2" sx={{ mb: 0.35, lineHeight: 1.35 }} {...props}>
      {children}
    </Typography>
  ),
  h1: ({ children, ...props }) => (
    <Typography component="h1" variant="h6" sx={{ mt: 0.4, mb: 0.35, fontWeight: 700 }} {...props}>
      {children}
    </Typography>
  ),
  h2: ({ children, ...props }) => (
    <Typography component="h2" variant="subtitle1" sx={{ mt: 0.4, mb: 0.35, fontWeight: 700 }} {...props}>
      {children}
    </Typography>
  ),
  li: ({ children, ...props }) => (
    <Box component="li" sx={{ mb: 0.2, pl: 0 }}>
      <Typography variant="body2" component="span">{children}</Typography>
    </Box>
  ),
  ul: ({ children, ...props }) => <Box component="ul" sx={{ pl: 2, mb: 0.4 }}>{children}</Box>,
  ol: ({ children, ...props }) => <Box component="ol" sx={{ pl: 2, mb: 0.4 }}>{children}</Box>,
};

const ChatBot = ({ sourceId }) => {
  const theme = useTheme();
  const isDesktop = useMediaQuery("(min-width: 900px)");
  const isMobile = useMediaQuery("(max-width: 600px)");
  const isTablet = useMediaQuery("(min-width: 601px) and (max-width: 899px)");
  const [isOpen, setIsOpen] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [message, setMessage] = useState("");
  const [chatHistory, setChatHistory] = useState([]);
  const chatBoxRef = useRef(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isSendingDisabled, setIsSendingDisabled] = useState(false);
  const [keyboardHeight, setKeyboardHeight] = useState(0);
  const [viewportHeight, setViewportHeight] = useState(typeof window !== "undefined" ? window.innerHeight : 800);

  // --- viewport / keyboard handling
  useEffect(() => {
    const handleResize = () => setViewportHeight(window.innerHeight);
    window.addEventListener("resize", handleResize);
    handleResize();
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  useEffect(() => {
    if (!isMobile) return;
    const handleVisualViewportResize = () => {
      const currentHeight = window.visualViewport?.height ?? window.innerHeight;
      const diff = viewportHeight - currentHeight;
      setKeyboardHeight(diff > 100 ? diff : 0);
    };
    window.visualViewport?.addEventListener("resize", handleVisualViewportResize);
    return () => window.visualViewport?.removeEventListener("resize", handleVisualViewportResize);
  }, [isMobile, viewportHeight]);

  // --- scroll to bottom on new messages / keyboard change
  useEffect(() => {
    if (chatBoxRef.current) {
      const scrollToBottom = () => (chatBoxRef.current.scrollTop = chatBoxRef.current.scrollHeight);
      scrollToBottom();
      setTimeout(scrollToBottom, 100);
    }
  }, [chatHistory, keyboardHeight]);

  // --- helpers
  const getChatWindowDimensions = () => {
    if (isFullscreen) {
      return {
        position: "fixed",
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        width: "100%",
        height: "100%",
        zIndex: theme.zIndex.modal + 1,
        borderRadius: 0,
      };
    }

    const baseStyles = {
      position: "fixed",
      zIndex: theme.zIndex.modal + 1,
      transition: "all 0.3s ease",
      maxHeight: "70vh",
      overflow: "hidden",
    };

    // Reverted sizes to your previous defaults
    if (isDesktop) {
      return {
        ...baseStyles,
        bottom: 90,
        right: 20,
        width: 350,
        height: "600px",
      };
    }

    if (isTablet) {
      return {
        ...baseStyles,
        bottom: 90,
        right: 20,
        width: 450,
        height: "600px",
      };
    }

    // mobile
    return {
      ...baseStyles,
      bottom: keyboardHeight > 0 ? keyboardHeight : SAFE_AREA_BOTTOM + 80,
      right: "50%",
      transform: "translateX(50%)",
      width: "calc(100% - 20px)",
      height: `calc(${viewportHeight}px - ${HEADER_HEIGHT}px - ${keyboardHeight > 0 ? keyboardHeight : SAFE_AREA_BOTTOM + 80}px)`,
      maxHeight: "600px",
    };
  };

  const getButtonDimensions = () => {
    const baseStyles = { position: "fixed", zIndex: theme.zIndex.modal };
    if (isMobile || isTablet) {
      return { ...baseStyles, width: "60px", height: "60px", bottom: SAFE_AREA_BOTTOM + 20, right: 20 };
    }
    return { ...baseStyles, width: "75px", height: "75px", bottom: 80, right: 30 };
  };

  // --- message send
  const sendMessageToAira = async (promptText, displayText = promptText) => {
    if (!promptText.trim() || !sourceId || isLoading || isSendingDisabled) return;

    try {
      setIsLoading(true);
      setIsSendingDisabled(true);
      setChatHistory((prev) => [...prev, { type: "user", text: displayText }]);

      const response = await axios.post(
        `${import.meta.env.VITE_API_URL}/chapters/chatPdf`,
        {
          sourceId,
          message: promptText,
        },
        {
          headers: {
            Authorization: `Bearer ${localStorage.getItem("token")}`,
          },
        },
      );

      const botText = response.data?.response ?? "Sorry, no response.";
      const structured = response.data?.structured ?? null;
      const references = response.data?.references ?? [];

      const referenceText = references.length
        ? `\n\n**References:** ${references.map((ref) => ref.pageNumber ? `Page ${ref.pageNumber}` : JSON.stringify(ref)).join(", ")}`
        : "";

      setChatHistory((prev) => [...prev, { type: "bot", text: `${botText}${referenceText}`, structured }]);
      setMessage("");
    } catch (error) {
      console.error("Error sending message:", error);
      setChatHistory((prev) => [...prev, { type: "bot", text: "AIRA is temporarily busy. Please try again in a few minutes." }]);
    } finally {
      setIsLoading(false);
      setTimeout(() => setIsSendingDisabled(false), 500);
    }
  };

  const handleSendMessage = async () => {
    await sendMessageToAira(message);
  };

  const handleQuickPrompt = async (item) => {
    await sendMessageToAira(item.prompt, item.label);
  };

  const handleKeyPress = (e) => {
    if (isMobile) return;
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const handleMobileSubmit = () => {
    if (isMobile) document.activeElement.blur();
    handleSendMessage();
  };

  const clearChat = () => setChatHistory([]);

  const handleInputFocus = () => {
    if (isMobile && chatBoxRef.current) {
      setTimeout(() => (chatBoxRef.current.scrollTop = chatBoxRef.current.scrollHeight), 300);
    }
  };

  const toggleFullscreen = () => setIsFullscreen((s) => !s);

  if (!sourceId) return null;

  // --- build DOCX for whole chat
  const buildDocxFromChat = async () => {
    try {
      if (!chatHistory || chatHistory.length === 0) return;

      const children = [];

      const pushParagraph = (txt, opts = {}) => {
        children.push(
          new Paragraph({
            text: String(txt || ""),
            spacing: { after: 120, line: 276 },
            ...opts,
          })
        );
      };

      for (const entry of chatHistory) {
        if (entry.structured && Array.isArray(entry.structured)) {
          for (const block of entry.structured) {
            if (block.type === "heading") {
              children.push(new Paragraph({ text: String(block.text || ""), heading: HeadingLevel.HEADING_2, spacing: { after: 120, line: 276 } }));
            } else if (block.type === "list") {
              (block.items || []).forEach((it) => {
                children.push(new Paragraph({ text: String(it || ""), bullet: { level: 0 }, spacing: { after: 80, line: 276 } }));
              });
            } else {
              pushParagraph(block.text);
            }
          }
          continue;
        }

        const raw = String(entry.text || "").replace(/\n{3,}/g, "\n\n");
        const lines = raw.split("\n");
        for (const line of lines) {
          const trimmed = line.trim();
          if (!trimmed) {
            children.push(new Paragraph("")); // blank paragraph
            continue;
          }
          if (trimmed.startsWith("# ")) {
            children.push(new Paragraph({ text: trimmed.replace(/^#\s+/, ""), heading: HeadingLevel.HEADING_2, spacing: { after: 120, line: 276 } }));
            continue;
          }
          if (/^[-*]\s+/.test(trimmed)) {
            children.push(new Paragraph({ text: trimmed.replace(/^[-*]\s+/, ""), bullet: { level: 0 }, spacing: { after: 80, line: 276 } }));
            continue;
          }
          pushParagraph(trimmed);
        }
      }

      const doc = new Document({ sections: [{ properties: {}, children }] });
      const blob = await Packer.toBlob(doc);

      const ts = new Date().toISOString().replace(/[:.]/g, "-");
      saveAs(blob, `AIRA_chat_export_${ts}.docx`);
    } catch (err) {
      console.error("Failed to build DOCX:", err);
    }
  };

  // --- build DOCX from a single entry (per-message download)
  const buildDocxFromEntry = async (entry, idx = 0) => {
    try {
      if (!entry) return;

      const children = [];
      const addParagraph = (txt, opts = {}) => {
        children.push(
          new Paragraph({
            text: String(txt || ""),
            spacing: { after: 120, line: 276 },
            ...opts,
          })
        );
      };

      if (entry.structured && Array.isArray(entry.structured)) {
        for (const block of entry.structured) {
          if (block.type === "heading") {
            addParagraph(block.text, { heading: HeadingLevel.HEADING_2 });
          } else if (block.type === "list") {
            (block.items || []).forEach((it) => addParagraph(it, { bullet: { level: 0 }, spacing: { after: 80, line: 276 } }));
          } else {
            addParagraph(block.text);
          }
        }
      } else {
        const raw = String(entry.text || "").replace(/\n{3,}/g, "\n\n");
        const lines = raw.split("\n");
        for (const line of lines) {
          const t = line.trim();
          if (!t) {
            children.push(new Paragraph("")); // blank paragraph
            continue;
          }
          if (t.startsWith("# ")) {
            children.push(new Paragraph({ text: t.replace(/^#\s+/, ""), heading: HeadingLevel.HEADING_2, spacing: { after: 120, line: 276 } }));
            continue;
          }
          if (/^[-*]\s+/.test(t)) {
            children.push(new Paragraph({ text: t.replace(/^[-*]\s+/, ""), bullet: { level: 0 }, spacing: { after: 80, line: 276 } }));
            continue;
          }
          addParagraph(t);
        }
      }

      const doc = new Document({ sections: [{ properties: {}, children }] });
      const blob = await Packer.toBlob(doc);

      const ts = new Date().toISOString().replace(/[:.]/g, "-");
      saveAs(blob, `AIRA_chat_msg_${idx + 1}_${ts}.docx`);
    } catch (err) {
      console.error("Failed to build DOCX from entry:", err);
    }
  };

  // --- build PDF by snapshotting the chat container
  const buildPdfFromChat = async () => {
    if (!chatBoxRef.current) return;
    const node = chatBoxRef.current;
    const prevOverflow = node.style.overflow;
    node.style.overflow = "visible";

    const clone = node.cloneNode(true);
    clone.style.width = `${node.clientWidth}px`;
    clone.style.position = "absolute";
    clone.style.left = "-9999px";
    document.body.appendChild(clone);

    try {
      const canvas = await html2canvas(clone, { scale: 2, useCORS: true });
      const imgData = canvas.toDataURL("image/png");
      const pdf = new jsPDF({
        orientation: canvas.width > canvas.height ? "landscape" : "portrait",
        unit: "px",
        format: [canvas.width, canvas.height],
      });
      pdf.addImage(imgData, "PNG", 0, 0, canvas.width, canvas.height);
      pdf.save("AIRA_chat_export.pdf");
    } catch (err) {
      console.error("PDF generation failed:", err);
    } finally {
      document.body.removeChild(clone);
      node.style.overflow = prevOverflow;
    }
  };

  // --- chat UI
  const chatWindow = (
    <Paper
      sx={{
        ...getChatWindowDimensions(),
        display: "flex",
        flexDirection: "column",
        bgcolor: "background.paper",
        boxShadow: 3,
        bottom: "10px",
      }}
    >
      <Box
        sx={{
          p: isMobile ? 1.5 : 2,
          bgcolor: "primary.main",
          color: "primary.contrastText",
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          borderRadius: "5px 5px 0 0",
        }}
      >
        <Typography color="white" variant={isMobile ? "subtitle1" : "h6"}>
          AIRA
        </Typography>

        <Box sx={{ display: "flex", gap: 0.5, alignItems: "center" }}>
          {/* Removed top download icons per request; kept clear / fullscreen / close */}
          <IconButton size={isMobile ? "small" : "medium"} onClick={clearChat} sx={{ color: "white" }}>
            <DeleteIcon />
          </IconButton>

          <IconButton size={isMobile ? "small" : "medium"} onClick={toggleFullscreen} sx={{ color: "white" }}>
            {isFullscreen ? <CloseFullscreenIcon /> : <OpenInFullIcon />}
          </IconButton>

          <IconButton size={isMobile ? "small" : "medium"} onClick={() => setIsOpen(false)} sx={{ color: "white" }}>
            <CloseIcon />
          </IconButton>
        </Box>
      </Box>

      <Box
        ref={chatBoxRef}
        sx={{
          flex: 1,
          overflowY: "auto",
          p: isMobile ? 1.5 : 2,
          display: "flex",
          flexDirection: "column",
          gap: 1,
        }}
      >
        {chatHistory.length === 0 && (
          <Box sx={{ textAlign: "center", color: "text.secondary", mt: 2 }}>
            <Typography variant={isMobile ? "caption" : "body2"} sx={{ mb: 1 }}>
              Hi, I am AIRA. <br /> Ask me anything from this chapter.
            </Typography>
            <Typography variant="caption" sx={{ display: "block", mb: 1, opacity: 0.75 }}>
              Try a quick action:
            </Typography>
            <Box sx={{ display: "flex", flexWrap: "wrap", gap: 0.75, justifyContent: "center" }}>
              {QUICK_PROMPTS.map((item) => (
                <Chip
                  key={item.label}
                  label={item.label}
                  size="small"
                  clickable
                  disabled={isLoading || isSendingDisabled}
                  onClick={() => handleQuickPrompt(item)}
                  sx={{ fontSize: isMobile ? "11px" : "12px" }}
                />
              ))}
            </Box>
            <Typography variant="caption" sx={{ display: "block", mt: 1.2, opacity: 0.75 }}>
              Note: Please select a chapter before chatting with AIRA.
            </Typography>
          </Box>
        )}

        {chatHistory.map((chat, index) => (
          <Box
            key={index}
            sx={{
              alignSelf: chat.type === "user" ? "flex-end" : "flex-start",
              maxWidth: isMobile ? "90%" : "80%",
              width: "fit-content",
              position: "relative",
            }}
          >
            <Paper
              elevation={1}
              sx={{
                p: isMobile ? 1 : 1.25,
                bgcolor: chat.type === "user" ? "primary.main" : "grey.100",
                color: chat.type === "user" ? "primary.contrastText" : "text.primary",
                wordBreak: "break-word",
                whiteSpace: "normal",
              }}
            >
              {/* message text */}
              <Box sx={{ width: "100%" }}>
                {chat.type === "bot" ? (
                  <ReactMarkdown remarkPlugins={[remarkGfm]} components={markdownComponents}>
                    {String(chat.text || "").replace(/\n{3,}/g, "\n\n")}
                  </ReactMarkdown>
                ) : (
                  <Typography variant={isMobile ? "caption" : "body2"}>{chat.text}</Typography>
                )}
              </Box>

              {/* DOWNLOAD BUTTON BELOW THE MESSAGE */}
              {chat.type === "bot" && (
                <Box sx={{ mt: 1, display: "flex", justifyContent: "flex-end", alignItems: "center" }}>
                  <IconButton
                    size="small"
                    onClick={() => buildDocxFromEntry(chat, index)}
                    sx={{ color: "text.secondary", bgcolor: "transparent", "&:hover": { bgcolor: "transparent" } }}
                    aria-label="Download this message"
                  >
                    <DownloadIcon fontSize="small" />
                  </IconButton>
                </Box>
              )}
            </Paper>

          </Box>
        ))}
      </Box>

      <Box sx={{ p: isMobile ? 1 : 2, borderTop: 1, borderColor: "divider" }}>
        <TextField
          fullWidth
          variant="outlined"
          size={isMobile ? "small" : "medium"}
          placeholder="Type your message..."
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          onKeyPress={handleKeyPress}
          onFocus={handleInputFocus}
          disabled={isLoading || isSendingDisabled}
          InputProps={{
            endAdornment: (
              <IconButton onClick={handleMobileSubmit} size={isMobile ? "small" : "medium"} disabled={isLoading || isSendingDisabled}>
                {isLoading ? <CircularProgress size={isMobile ? 16 : 24} /> : <SendIcon />}
              </IconButton>
            ),
          }}
          sx={{ "& .MuiOutlinedInput-root": { fontSize: isMobile ? 16 : "inherit" } }}
        />
      </Box>
    </Paper>
  );

  // floating button (same layout as your original)
  const buttonStyles = getButtonDimensions();

  return (
    <>
      <Box
        sx={{
          ...buttonStyles,
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          textAlign: "center",
          filter: "drop-shadow(0px 4px 6px rgba(0, 0, 0, 0.12))",
          userSelect: "none",
        }}
      >
        <Box
          onClick={() => setIsOpen(!isOpen)}
          sx={{
            width: buttonStyles.width,
            height: buttonStyles.height,
            cursor: "pointer",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            "&:hover": { transform: !isMobile && "scale(1.03)", transition: "all 0.2s ease" },
          }}
        >
          {isOpen ? <CloseIcon sx={{ fontSize: isMobile ? 20 : 24 }} /> : <img src={AiraIcon} alt="chat icon" style={{ width: "100%", height: "100%", pointerEvents: "none" }} />}
        </Box>

        <Typography sx={{ fontSize: isMobile ? "10px" : "12px", fontWeight: 600, color: "#075997", margin: "0 auto" }}>AIRA</Typography>
      </Box>

      {isOpen && typeof document !== "undefined" && createPortal(chatWindow, document.body)}
    </>
  );
};

export default ChatBot;
