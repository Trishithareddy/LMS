import React, { useMemo } from "react";
import { Card, CardContent, Typography, Box } from "@mui/material";
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip as RTooltip,
  Legend,
} from "recharts";

/** ---- Config ---- */
const DEFAULT_HEIGHT = 200;

const COLORS = {
  Completed: "#43a047", // green
  Pending: "#f9a825",   // amber
  Expired: "#e53935",   // red
};

/** ---- Date helpers ---- */
const toDate = (v) => {
  if (!v) return null;
  if (v instanceof Date) return isNaN(v) ? null : v;
  const d = new Date(v);
  return isNaN(d) ? null : d;
};

const monthKey = (dLike) => {
  const d = toDate(dLike);
  if (!d) return null;
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  return `${y}-${m}`;
};

const monthLabel = (key) => {
  if (!key) return "";
  const [y, m] = key.split("-");
  const d = new Date(Number(y), Number(m) - 1, 1);

  // cleaner labels like "Jan", "Feb"
  return d.toLocaleString(undefined, { month: "short" });
};

/** ------------------------------------------------------------------ */
/**  Component                                                          */
/** ------------------------------------------------------------------ */
export default function StudentAssessmentCharts({
  assessments = [],
  height = DEFAULT_HEIGHT,
  title = "Assessments Overview",
}) {






  const byMonth = useMemo(() => {
    const map = new Map();

    for (const a of assessments || []) {

      const key = monthKey(a?.end ?? a?.start);
      if (!key) continue;

      if (!map.has(key)) {
        map.set(key, { key, Completed: 0, Pending: 0, Expired: 0 });
      }

      const bucket = map.get(key);
      const s = String(a?.status || "").trim();

      if (s === "Completed") bucket.Completed += 1;
      else if (s === "Expired") bucket.Expired += 1;
      else bucket.Pending += 1;
    }

    const keys = [...map.keys()].sort();

    const last6 = keys.slice(-6);

    return last6.map((k) => ({
      month: monthLabel(k),
      ...map.get(k),
    }));
  }, [assessments]);

  return (
    <Card sx={{ borderRadius: 3, boxShadow: 3 }}>
      <CardContent>
        <Typography fontWeight={800} sx={{ mb: 2 }}>
          {title}
        </Typography>

        <Box sx={{ height, px: 1 }}>

          {byMonth.length === 0 ? (
            <Box
              sx={{
                height: "100%",
                display: "grid",
                placeItems: "center",
                color: "text.secondary",
              }}
            >
              <Typography variant="body2">
                No data for the last 6 months.
              </Typography>
            </Box>
          ) : (
            <Box
              sx={{
                height,
                display: "flex",
                justifyContent: "center",
              }}
            ><ResponsiveContainer width="100%" height="100%">
                <BarChart
                  data={byMonth}
                  barCategoryGap="15%"
                  barGap={4}
                  margin={{ top: 10, right: 20, left: 10, bottom: 10 }}
                >
                  <CartesianGrid
                    strokeDasharray="2 4"
                    vertical={false}
                    stroke="#e0e0e0"
                  />

                  <XAxis
                    dataKey="month"
                    axisLine={false}
                    tickLine={false}
                    tick={{ fontSize: 12 }}
                    dy={8}
                    padding={{ left: 20, right: 20 }} // 👈 fixes side gaps
                  />

                  <YAxis
                    allowDecimals={false}
                    axisLine={false}
                    tickLine={false}
                    tick={{ fontSize: 12 }}
                    domain={[0, "dataMax + 1"]}
                  />

                  <RTooltip
                    contentStyle={{
                      borderRadius: 8,
                      border: "none",
                      boxShadow: "0 4px 12px rgba(0,0,0,0.1)",
                    }}
                  />

                  <Legend wrapperStyle={{ paddingTop: 10, fontSize: 12 }} />

                  <Bar dataKey="Completed" fill={COLORS.Completed} barSize={26} />
                  <Bar dataKey="Pending" fill={COLORS.Pending} barSize={26} />
                  <Bar dataKey="Expired" fill={COLORS.Expired} barSize={26} />
                </BarChart>
              </ResponsiveContainer>
            </Box>
          )}
        </Box>
      </CardContent>
    </Card>
  );
}