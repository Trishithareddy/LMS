import React, { useMemo, useState } from "react";
import {
  Card, CardContent, Box, Typography, Stack, Chip, Grid,
  FormControl, InputLabel, Select, MenuItem
} from "@mui/material";
import {
  ResponsiveContainer, PieChart, Pie, Cell, Tooltip as RTooltip,
  BarChart, Bar, XAxis, YAxis, CartesianGrid, LabelList,
  RadialBarChart, RadialBar
} from "recharts";

const clamp01 = (n) => Math.max(0, Math.min(100, Math.round(Number(n) || 0)));
const OVERVIEW_H = 260;

/* ---------- parse "… Level 4" into two lines ---------- */
function splitCourseLabel(full) {
  const s = String(full || "").trim();
  const m = s.match(/level[-\s]*(\d+)/i);
  const levelNum = m?.[1];
  const line1 = s.replace(/[-\s]*level[-\s]*\d+$/i, "").trim() || s;
  const line2 = levelNum ? `Level ${levelNum}` : "";
  return { line1, line2 };
}

function useStats(courses) {
  return useMemo(() => {
    const list = Array.isArray(courses) ? courses : [];
    const total = list.length;
    const completed = list.filter(c => (c.progress || 0) >= 100).length;
    const inProgress = list.filter(c => (c.progress || 0) > 0 && (c.progress || 0) < 100).length;
    const notStarted = list.filter(c => !c.progress || c.progress <= 0).length;

    const avg = total === 0
      ? 0
      : clamp01(list.reduce((s, c) => s + (Number(c.progress) || 0), 0) / total);

    const topBars = [...list]
      .sort((a, b) => (b.progress || 0) - (a.progress || 0))
      .slice(0, 6)
      .map(c => {
        const name = c?.name || "Course";
        const { line1, line2 } = splitCourseLabel(name);
        return {
          xLabel: line2 ? `${line1}|${line2}` : line1,
          tooltip: name,
          progress: clamp01(c.progress || 0)
        };
      });

    return {
      dist: [
        { name: "Completed", value: completed, color: "#43a047" },
        { name: "In Progress", value: inProgress, color: "#0288d1" },
        { name: "Not Started", value: notStarted, color: "#bdbdbd" },
      ],
      avg, topBars, total
    };
  }, [courses]);
}

/* ---------- tighter card shell ---------- */
const CardShell = ({ children }) => (
  <Card sx={{ borderRadius: 2, height: '100%', display: 'flex', flexDirection: 'column' }}>
    <CardContent sx={{ py: 1.5, px: 2, display: 'flex', flexDirection: 'column', flex: 1 }}>
      {children}
    </CardContent>
  </Card>
);

/* ---------- Donut (kept for future use) ---------- */
function CourseCompletionDonut({ dist, total }) {
  const sum = dist.reduce((s, d) => s + d.value, 0);
  return (
    <CardShell>
      <Box sx={{ display: "flex", alignItems: "center", justifyContent: "space-between", mb: .5 }}>
        <Typography fontWeight={700}>Course Completion</Typography>
        <Chip size="small" label={`${total} courses`} variant="outlined" />
      </Box>

      <Box sx={{ height: 180 }}>
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <RTooltip formatter={(v, n) => [`${v}`, n]} />
            <Pie data={dist} dataKey="value" nameKey="name" innerRadius={52} outerRadius={78} paddingAngle={4} stroke="none">
              {dist.map((d, i) => <Cell key={i} fill={d.color} />)}
            </Pie>
          </PieChart>
        </ResponsiveContainer>
      </Box>

      <Stack direction="row" spacing={1} sx={{ mt: .5, flexWrap: "wrap" }}>
        {dist.map(({ name, value, color }) => (
          <Chip key={name} size="small" label={`${name}: ${value}`} sx={{ bgcolor: `${color}20`, color }} />
        ))}
        <Chip size="small" label={`Total: ${sum}`} variant="outlined" />
      </Stack>
    </CardShell>
  );
}

/* ---------- Radial ---------- */
function AverageRadial({ avg, height = OVERVIEW_H }) {
  const data = [{ name: "avg", value: avg, fill: "#10b981" }];
  return (
    <CardShell>
      <Typography fontWeight={700} sx={{ mb: .5 }}>Average Progress</Typography>
      <Box sx={{ height, position: "relative" }}>
        <ResponsiveContainer width="100%" height="100%">
          <RadialBarChart data={data} innerRadius="70%" outerRadius="100%" startAngle={90} endAngle={-270}>
            <RadialBar minAngle={15} background clockWise dataKey="value" />
          </RadialBarChart>
        </ResponsiveContainer>
        <Box sx={{ position: "absolute", inset: 0, display: "grid", placeItems: "center" }}>
          <Typography variant="h5" fontWeight={900}>{avg}%</Typography>
        </Box>
      </Box>
    </CardShell>
  );
}

/* ---------- custom two-line tick ---------- */
const TwoLineTick = ({ x, y, payload }) => {
  const raw = String(payload?.value ?? "");
  const [line1, line2] = raw.split("|");
  return (
    <g transform={`translate(${x},${y})`}>
      <text dy={10} textAnchor="middle" fontSize={11} fill="#333">{line1}</text>
      {line2 ? <text dy={24} textAnchor="middle" fontSize={11} fill="#6b7280">{line2}</text> : null}
    </g>
  );
};

/* ---------- Bar (kept for future use) ---------- */
function TopCoursesBar({ bars }) {
  return (
    <CardShell>
      <Typography fontWeight={700} sx={{ mb: .5 }}>My Activity (by course %)</Typography>
      <Box sx={{ height: 220 }}>
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={bars} margin={{ top: 8, right: 8, left: -12, bottom: 12 }}>
            <defs>
              <linearGradient id="barGrad" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#14b8a6" />
                <stop offset="100%" stopColor="#0284c7" />
              </linearGradient>
            </defs>
            <CartesianGrid vertical={false} strokeDasharray="3 3" />
            <XAxis dataKey="xLabel" tick={<TwoLineTick />} height={44} interval={0} />
            <YAxis domain={[0, 100]} tickFormatter={(v) => `${v}%`} width={36} />
            <RTooltip formatter={(v) => [`${v}%`, "Progress"]} />
            <Bar dataKey="progress" radius={[6, 6, 0, 0]} fill="url(#barGrad)">
              <LabelList dataKey="progress" position="top" formatter={(v) => `${v}%`} />
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </Box>
    </CardShell>
  );
}

/* =====================
   Main component + TWO “Total” dropdowns
   ===================== */
export default function StudentProgressCharts({ courses, embedded = false, fullHeight = false }) {
  const stats = useStats(courses);

  // Two independent "Total" dropdowns
  const [leftTotal, setLeftTotal] = useState(6);
  const [rightTotal, setRightTotal] = useState(12);

  // Example options – keep/modify as you like
  const totalOptions = [
    { value: 3, label: "Last 3" },
    { value: 6, label: "Last 6" },
    { value: 12, label: "Last 12" },
  ];

  if (embedded) return <AverageRadial avg={stats.avg} height={OVERVIEW_H} />;

  return (
    <>
      {/* Row with two same-name dropdowns */}
      <Grid container spacing={2} sx={{ mb: 2 }}>
        <Grid item xs={12} sm={6} md={3}>
          <FormControl fullWidth size="small">
            <InputLabel>Total</InputLabel>
            <Select
              label="Total"
              value={leftTotal}
              onChange={(e) => setLeftTotal(e.target.value)}
            >
              {totalOptions.map(o => (
                <MenuItem key={o.value} value={o.value}>{o.label}</MenuItem>
              ))}
            </Select>
          </FormControl>
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <FormControl fullWidth size="small">
            <InputLabel>Total</InputLabel>
            <Select
              label="Total"
              value={rightTotal}
              onChange={(e) => setRightTotal(e.target.value)}
            >
              {totalOptions.map(o => (
                <MenuItem key={o.value} value={o.value}>{o.label}</MenuItem>
              ))}
            </Select>
          </FormControl>
        </Grid>
      </Grid>

      {/* Your charts (unchanged) */}
      <Grid container spacing={1.5} sx={{ mb: 2 }}>
        <Grid item xs={12} md={6}>
          <AverageRadial avg={stats.avg} />
        </Grid>
        {/* You can place another chart on the right */}
        {/* <Grid item xs={12} md={6}>
          <TopCoursesBar bars={stats.topBars} />
        </Grid> */}
      </Grid>
    </>
  );
}


