import React from "react";
import { Grid, Paper, Typography, Avatar, Box } from "@mui/material";

const API =
  import.meta.env.VITE_API_URL ||
  import.meta.env.VITE_BACKEND_URL ||
  "http://localhost:5000";

function resolveIcon(iconUrl) {
  if (!iconUrl) return "";
  if (iconUrl.startsWith("http")) return iconUrl;
  return `${API}${iconUrl.startsWith("/") ? iconUrl : `/${iconUrl}`}`;
}

export default function BadgeList({ items = [] }) {
  if (!items.length) {
    return (
      <Typography color="text.secondary">
        No badges earned yet.
      </Typography>
    );
  }

  return (
    <Grid container spacing={2}>
      {items.map((ub) => {
        const badge = ub.badgeId || {};
        return (
          <Grid item xs={12} sm={6} md={4} key={ub._id}>
            <Paper sx={{ p: 2, display: "flex", gap: 2 }}>
              <Avatar
                src={resolveIcon(badge.iconUrl)}
                sx={{ width: 64, height: 64 }}
              >
                {badge.title?.[0]}
              </Avatar>

              <Box>
                <Typography variant="subtitle1">
                  {badge.title}
                </Typography>

                {badge.description && (
                  <Typography
                    variant="body2"
                    color="text.secondary"
                  >
                    {badge.description}
                  </Typography>
                )}

                {ub.awardedAt && (
                  <Typography
                    variant="caption"
                    color="text.secondary"
                  >
                    Awarded on{" "}
                    {new Date(ub.awardedAt).toLocaleDateString()}
                  </Typography>
                )}
              </Box>
            </Paper>
          </Grid>
        );
      })}
    </Grid>
  );
}
