// src/components/MiniCalendarColorful.jsx
import React, { useMemo, useState } from "react";
import {
  Card, CardContent, Box, Typography, IconButton, Chip, Tooltip
} from "@mui/material";
import ChevronLeft from "@mui/icons-material/ChevronLeft";
import ChevronRight from "@mui/icons-material/ChevronRight";

/** ---------- helpers ---------- */
function buildMatrix(viewDate) {
  const y = viewDate.getFullYear(), m = viewDate.getMonth();
  const firstDow = new Date(y, m, 1).getDay();
  const daysInMonth = new Date(y, m + 1, 0).getDate();
  const daysInPrev = new Date(y, m, 0).getDate();
  const cells = [];

  // previous-month pad
  for (let i = firstDow - 1; i >= 0; i--) {
    const d = daysInPrev - i;
    cells.push({ d, inMonth: false, date: new Date(y, m - 1, d) });
  }

  // current month
  for (let d = 1; d <= daysInMonth; d++) {
    cells.push({ d, inMonth: true, date: new Date(y, m, d) });
  }

  // next-month pad
  let i = 1;
  while (cells.length % 7) {
    cells.push({ d: i, inMonth: false, date: new Date(y, m + 1, i) });
    i++;
  }

  const weeks = [];
  for (let j = 0; j < cells.length; j += 7) weeks.push(cells.slice(j, j + 7));
  return weeks;
}

// format key as YYYY-MM-DD
const keyFor = (dt) =>
  `${dt.getFullYear()}-${String(dt.getMonth() + 1).padStart(2, "0")}-${String(
    dt.getDate()
  ).padStart(2, "0")}`;

export default function MiniCalendar({
  events = {},
  onSelectDate,
}) {
  const today = new Date();
  const [view, setView] = useState(new Date(today.getFullYear(), today.getMonth(), 1));
  const [selected, setSelected] = useState(null);

  const weeks = useMemo(() => buildMatrix(view), [view]);
  const monthLabel = view.toLocaleString(undefined, { month: "long", year: "numeric" });

  const brand = {
    headerFrom: "linear-gradient(135deg, #0ea5e9 0%, #10b981 60%, #f59e0b 120%)", // blue → green → yellow
    inMonthBg: "rgba(16,185,129,0.06)",  // subtle green wash
    weekendBg: "rgba(14,165,233,0.06)", // subtle blue wash
    outMonthBg: "transparent",
  };

  const isSameDay = (a, b) =>
    a &&
    b &&
    a.getFullYear() === b.getFullYear() &&
    a.getMonth() === b.getMonth() &&
    a.getDate() === b.getDate();

  const handlePick = (cell) => {
    setSelected(cell.date);
    onSelectDate?.(cell.date);
  };

  return (
    <Card
      sx={{
        borderRadius: 3,
        overflow: "hidden",
        boxShadow: 4,
      }}
    >
      {/* Header */}
      <Box
        sx={{
          px: 1,
          py: 1,
          display: "flex",
          alignItems: "center",
          background: brand.headerFrom,
          color: "#fff",
        }}
      >
        <IconButton
          size="small"
          onClick={() =>
            setView(new Date(view.getFullYear(), view.getMonth() - 1, 1))
          }
          sx={{ color: "inherit" }}
        >
          <ChevronLeft />
        </IconButton>

        <Typography sx={{ flex: 1, textAlign: "center", fontWeight: 800 }}>
          {monthLabel}
        </Typography>

        <IconButton
          size="small"
          onClick={() =>
            setView(new Date(view.getFullYear(), view.getMonth() + 1, 1))
          }
          sx={{ color: "inherit" }}
        >
          <ChevronRight />
        </IconButton>
      </Box>

      <CardContent sx={{ pt: 1.25 }}>
        {/* Weekday labels */}
        <Box
          sx={{
            display: "grid",
            gridTemplateColumns: "repeat(7,1fr)",
            mb: 1,
          }}
        >
          {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map((d, idx) => (
            <Typography
              key={d}
              variant="caption"
              sx={{
                textAlign: "center",
                fontWeight: 700,
                opacity: 0.9,
                py: 0.5,
                borderRadius: 1,
                bgcolor:
                  idx === 0 || idx === 6 ? "rgba(245, 158, 11, 0.08)" : "transparent",
              }}
            >
              {d}
            </Typography>
          ))}
        </Box>

        {/* Calendar grid */}
        <Box sx={{ display: "grid", gridTemplateColumns: "repeat(7,1fr)", gap: 0.75 }}>
          {weeks.flat().map((cell, i) => {
            const isToday =
              cell.inMonth &&
              isSameDay(
                new Date(today.getFullYear(), today.getMonth(), today.getDate()),
                cell.date
              );
            const isSelected = isSameDay(selected, cell.date);
            const weekIndex = Math.floor(i / 7);
            const dayOfWeek = i % 7;

            // cell background base
            let baseBg = cell.inMonth ? brand.inMonthBg : brand.outMonthBg;
            if (dayOfWeek === 0 || dayOfWeek === 6) baseBg = brand.weekendBg;

            // events for this day
            const evts = events[keyFor(cell.date)] || [];

            return (
              <Box
                key={i}
                onClick={() => handlePick(cell)}
                sx={{
                  position: "relative",
                  aspectRatio: "1/1",
                  display: "grid",
                  placeItems: "center",
                  cursor: "pointer",
                  borderRadius: 2,
                  bgcolor: isSelected ? "success.main" : baseBg,
                  color: isSelected ? "#fff" : (cell.inMonth ? "text.primary" : "text.disabled"),
                  border: "1px solid",
                  borderColor: isSelected ? "success.main" : "rgba(0,0,0,0.06)",
                  transition: "transform .12s ease, box-shadow .12s ease, background .12s ease",
                  "&:hover": {
                    transform: "translateY(-1px)",
                    boxShadow: 3,
                  },
                }}
              >
                {/* Today ring */}
                {isToday && !isSelected && (
                  <Box
                    sx={{
                      position: "absolute",
                      inset: 0,
                      borderRadius: 2,
                      border: "2px solid",
                      borderColor: "primary.main",
                      pointerEvents: "none",
                    }}
                  />
                )}

                <Typography variant="body2" sx={{ fontWeight: 700 }}>
                  {cell.d}
                </Typography>

                {/* Event dots */}
                {evts.length > 0 && (
                  <Box
                    sx={{
                      position: "absolute",
                      bottom: 6,
                      left: "50%",
                      transform: "translateX(-50%)",
                      display: "flex",
                      gap: 0.5,
                    }}
                    onClick={(e) => e.stopPropagation()}
                  >
                    {evts.slice(0, 3).map((eobj, idx) => (
                      <Tooltip key={idx} title={eobj.label}>
                        <Box
                          sx={{
                            width: 7,
                            height: 7,
                            borderRadius: "50%",
                            bgcolor: eobj.color || "primary.main",
                          }}
                        />
                      </Tooltip>
                    ))}
                    {evts.length > 3 && (
                      <Typography variant="caption" sx={{ ml: 0.25, opacity: 0.7 }}>
                        +{evts.length - 3}
                      </Typography>
                    )}
                  </Box>
                )}
              </Box>
            );
          })}
        </Box>
      </CardContent>
    </Card>
  );
}
