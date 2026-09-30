import React, { useEffect, useState } from "react";
import axios from "axios";
import {
  Grid,
  Paper,
  Avatar,
  Typography,
  Button,
  Stack,
  Menu,
} from "@mui/material";
import { MenuItem } from "@mui/material";
import ShareIcon from "@mui/icons-material/Share";
import LinkedInIcon from "@mui/icons-material/LinkedIn";
import WhatsAppIcon from "@mui/icons-material/WhatsApp";
import ContentCopyIcon from "@mui/icons-material/ContentCopy";


const API =
  import.meta.env.VITE_API_URL ||
  import.meta.env.VITE_BACKEND_URL ||
  "http://localhost:5000";

const FRONTEND_URL =
  import.meta.env.VITE_FRONTEND_URL || "http://localhost:5173";

const VERIFY_URL = `${FRONTEND_URL}/verify`;


export default function TeacherMyBadges({ mode = "active" }) {

  const [items, setItems] = useState([]);
  const [anchorEl, setAnchorEl] = useState(null);
  const [shareBadge, setShareBadge] = useState(null);

  const getCurrentAcademicYear = () => {
    const now = new Date();
    const year = now.getFullYear();
    const month = now.getMonth(); // 0 = Jan

    // Switch on April (month 3)
    return month >= 3
      ? `${year}-${year + 1}`
      : `${year - 1}-${year}`;
  };


  const currentAcademicYear = getCurrentAcademicYear();



  const handleShareClick = (event, badge) => {
    setAnchorEl(event.currentTarget);
    setShareBadge(badge);
  };

  const handleClose = () => {
    setAnchorEl(null);
    setShareBadge(null);
  };

  const FRONTEND_URL =
    import.meta.env.VITE_FRONTEND_URL || "http://localhost:5173";

  const PUBLIC_API =
    import.meta.env.VITE_PUBLIC_API_URL || API;

  const shareUrl = shareBadge
    ? `${PUBLIC_API}/api/badges/share/badge/${shareBadge.verifyCode}`
    : "";





  const shareText = shareBadge
    ? `🏅 ${shareBadge.badgeId?.title}
👤 Awarded To: ${shareBadge.userName || "Verified User"}
🔐 Verification Code: ${shareBadge.verifyCode}
🏫 Super Teacher EduroForms

Verify authenticity here 👇`
    : "";



  useEffect(() => {
    (async () => {
      const token = localStorage.getItem("token");

      const url =
        mode === "archived"
          ? `${API}/api/badges/teacher-badges/archived`
          : `${API}/api/badges/teacher-badges/me`;

      const res = await axios.get(url, {
        headers: { Authorization: `Bearer ${token}` },
      });

      setItems(res.data || []);
    })();
  }, [mode]);
  const handleRestore = async (badgeId) => {
    const token = localStorage.getItem("token");

    await axios.patch(
      `${API}/api/badges/teacher-badges/${badgeId}/restore`,
      {},
      { headers: { Authorization: `Bearer ${token}` } }
    );

    // Remove from archived UI instantly
    setItems((prev) => prev.filter((b) => b._id !== badgeId));
  };


  return (
    <Grid container spacing={2}>
      <Menu
        anchorEl={anchorEl}
        open={Boolean(anchorEl)}
        onClose={handleClose}
      >
        <MenuItem
          onClick={() => {
            window.open(
              `https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(shareUrl)}`,
              "_blank"
            );
            handleClose();
          }}
        >
          <LinkedInIcon sx={{ mr: 1, color: "#0A66C2" }} />
          LinkedIn
        </MenuItem>
        <MenuItem
          onClick={() => {
            window.open(
              `https://wa.me/?text=${encodeURIComponent(shareText + " " + shareUrl)}`,
              "_blank"
            );
            handleClose();
          }}
        >
          <WhatsAppIcon sx={{ mr: 1, color: "#25D366" }} />
          WhatsApp
        </MenuItem>

        <MenuItem
          onClick={() => {
            navigator.clipboard.writeText(shareUrl);
            handleClose();
          }}
        >
          <ContentCopyIcon sx={{ mr: 1 }} />
          Copy link
        </MenuItem>

        {"share" in navigator && (
          <MenuItem
            onClick={() => {
              navigator.share({
                title: "My Badge",
                text: shareText,
                url: shareUrl,
              });
              handleClose();
            }}
          >
            📲 Share (Device)
          </MenuItem>
        )}
      </Menu>

      {items.map((ub) => (
        <Grid item xs={12} sm={6} md={4} key={ub._id}>
          <Paper sx={{ p: 2, textAlign: "center" }}>
            <Avatar
              src={`${API}${ub.badgeId?.iconUrl}`}
              sx={{ width: 64, height: 64, mx: "auto", mb: 1 }}
            />

            <Typography variant="subtitle1">
              {ub.badgeId?.title}
            </Typography>

            <Typography variant="caption" display="block">
              Awarded on{" "}
              {new Date(ub.awardedAt).toLocaleDateString()}
            </Typography>
            <Typography variant="caption" sx={{ mt: 1 }}>
              Badge Number: <b>{ub.verifyCode}</b>
            </Typography>


            <Typography variant="caption" display="block">
              Academic Year: <b>{ub.academicYear}</b>
            </Typography>

            {/* <Typography
              variant="caption"
              color="primary"
              display="block"
              sx={{ mt: 1 }}
            >
              Badge Number: <b>{ub.badgeNumber}</b>
            </Typography> */}

            <Stack
              direction="row"
              spacing={2}
              justifyContent="center"
              sx={{ mt: 2 }}
            >
              <Typography
                component="a"
                href={VERIFY_URL}
                target="_blank"
                rel="noopener noreferrer"
                sx={{
                  fontSize: 13,
                  color: "primary.main",
                  textDecoration: "underline",
                  cursor: "pointer",
                }}
              >
                Verify
              </Typography>



              <Typography
                component="a"
                href={`${API}/api/badges/download/${ub.badgeNumber}`}
                target="_blank"
                rel="noopener noreferrer"
                sx={{
                  fontSize: 13,
                  color: "primary.main",
                  textDecoration: "underline",
                  cursor: "pointer",
                  "&:hover": {
                    color: "primary.dark",
                  },
                }}
              >
                Download
              </Typography>
              {mode === "archived" && ub.academicYear === currentAcademicYear && (
                <Typography
                  onClick={() => handleRestore(ub._id)}
                  sx={{
                    fontSize: 13,
                    color: "success.main",
                    textDecoration: "underline",
                    cursor: "pointer",
                  }}
                >
                  ♻ Restore
                </Typography>
              )}

              <Typography
                onClick={(e) => handleShareClick(e, ub)}
                sx={{
                  fontSize: 13,
                  color: "primary.main",
                  textDecoration: "underline",
                  cursor: "pointer",
                  display: "flex",
                  alignItems: "center",
                  gap: 0.5,
                }}
              >
                <ShareIcon sx={{ fontSize: 16 }} />
                Share
              </Typography>
            </Stack>

          </Paper>
        </Grid>
      ))}
    </Grid>
  );
}
