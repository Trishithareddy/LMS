import React, { useEffect, useMemo, useState } from "react";
import axios from "axios";
import {
  Card, CardContent, Box, Typography, Grid, Chip, Stack, Skeleton
} from "@mui/material";
import {
  ResponsiveContainer, BarChart, Bar, XAxis, YAxis, CartesianGrid, LabelList,
  Tooltip as RTooltip
} from "recharts";
// ✅ reuse the same progress function you have on the student side
// adjust the relative path if needed
//import { calcCourseProgress } from "../../Student/StudentCourse";
import { calcCourseProgress } from "../../Student/StudentComponents/StudentCourse";

/* ----------------- helpers ----------------- */
const API = () => (import.meta.env.VITE_API_URL || "").replace(/\/+$/, "");
const headers = () => {
  const t = localStorage.getItem("token");
  return t ? { Authorization: `Bearer ${t}` } : {};
};
const clamp01 = (n) => Math.max(0, Math.min(100, Math.round(Number(n) || 0)));

function splitTwoLines(name) {
  // "HappyCoder 2.0 Level-4" -> ["HappyCoder 2.0", "Level 4"]
  const s = String(name || "").trim();
  const m = s.match(/level[-\s]*(\d+)/i);
  const level = m?.[1];
  const line1 = s.replace(/[-\s]*level[-\s]*\d+$/i, "").trim() || s;
  const line2 = level ? `Level ${level}` : "";
  return [line1, line2];
}

const TwoLineTick = ({ x, y, payload }) => {
  const raw = String(payload?.value ?? "");
  const [l1, l2] = raw.split("|");
  return (
    <g transform={`translate(${x},${y})`}>
      <text dy={10} textAnchor="middle" fontSize={11} fill="#333">{l1}</text>
      {l2 ? <text dy={24} textAnchor="middle" fontSize={11} fill="#6b7280">{l2}</text> : null}
    </g>
  );
};

const CardShell = ({ children }) => (
  <Card sx={{ borderRadius: 2, height: "100%" }}>
    <CardContent sx={{ py: 1.5, px: 2 }}>{children}</CardContent>
  </Card>
);

/* ----------------- main component ----------------- */
export default function TeacherCompletionAndProjects({ updates }) {
  const [loading, setLoading] = useState(true);
  const [courseBars, setCourseBars] = useState([]); // [{xLabel, tooltip, completion}]
  const [projWeeklyBars, setProjWeeklyBars] = useState([]); // [{day, count}]
  const [projUniqueCount, setProjUniqueCount] = useState(0);

  useEffect(() => {
    (async () => {
      try {
        const base = API();
        // 1) students with their courses (we just added _id in backend)
        const r = await axios.get(`${base}/teacher/getStudentsByTeacherId`, { headers: headers() });
        const rows = Array.isArray(r?.data) ? r.data : Array.isArray(r?.data?.students) ? r.data.students : [];

        // Build a map: courseId -> { name, studentIds: Set }
        const courseMap = new Map();
        rows.forEach(st => {
          const sid = st?._id; // mongo _id (string)
          (st?.courses || []).forEach(c => {
            const cid = c?._id;
            if (!cid || !sid) return;
            if (!courseMap.has(cid)) courseMap.set(cid, { name: c?.name || "Course", sidSet: new Set() });
            courseMap.get(cid).sidSet.add(String(sid));
          });
        });

        // Compute completion using calcCourseProgress(studentId, courseId)
        // Throttle concurrency; also cap total pairs to avoid huge loads
        const COURSE_LIMIT = 8;        // top N courses by enrollment to display
        const CONCURRENCY = 6;         // parallel progress checks
        const pairs = [];

        // Pick top courses by enrollment size
        const ranked = [...courseMap.entries()]
          .map(([cid, v]) => ({ courseId: cid, name: v.name, sids: [...v.sidSet] }))
          .sort((a, b) => b.sids.length - a.sids.length)
          .slice(0, COURSE_LIMIT);

        ranked.forEach(c => {
          c.sids.forEach(sid => pairs.push({ sid, cid: c.courseId, cname: c.name }));
        });

        // Concurrency runner
        let i = 0, done = 0;
        const results = [];
        const buckets = new Map(ranked.map(c => [c.courseId, { name: c.name, total: c.sids.length, completed: 0 }]));

        async function worker() {
          while (i < pairs.length) {
            const idx = i++;
            const { sid, cid } = pairs[idx];
            try {
              const pct = await calcCourseProgress(sid, cid);
              if ((Number(pct) || 0) >= 100) {
                const b = buckets.get(cid);
                if (b) b.completed += 1;
              }
            } catch {
              // ignore errors, treat as not completed
            } finally {
              done++;
            }
          }
        }
        await Promise.all([...Array(Math.min(CONCURRENCY, pairs.length || 1))].map(worker));

        // Build bar data
        const bars = ranked.map(({ courseId, name }) => {
          const b = buckets.get(courseId) || { total: 0, completed: 0, name };
          const completion = b.total ? clamp01((b.completed * 100) / b.total) : 0;
          const [l1, l2] = splitTwoLines(name);
          return {
            xLabel: l2 ? `${l1}|${l2}` : l1,
            tooltip: name,
            completion
          };
        });

        setCourseBars(bars);
      } catch (e) {
        setCourseBars([]);
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  // 2) Project submitters this week (unique)
  useEffect(() => {
    const arr = Array.isArray(updates) ? updates : [];
    const start = new Date(); // start of 7-day window
    start.setHours(0, 0, 0, 0);
    start.setDate(start.getDate() - 6); // last 7 days including today

    // build 7 days
    const days = [...Array(7)].map((_, k) => {
      const d = new Date(start);
      d.setDate(start.getDate() + k);
      const key = d.toISOString().slice(0, 10);
      return { key, day: d.toLocaleDateString([], { weekday: "short" }), students: new Set() };
    });
    const byKey = Object.fromEntries(days.map(d => [d.key, d]));

    arr.forEach(u => {
      if (u.type !== "project") return;
      const dt = new Date(u.when || Date.now());
      const key = dt.toISOString().slice(0, 10);
      const id = u.studentId || u.studentName; // prefer id; fallback to name
      if (!id) return;
      if (byKey[key]) byKey[key].students.add(String(id));
    });

    const bars = days.map(d => ({ day: d.day, count: d.students.size }));
    const uniq = new Set(arr.filter(u => u.type === "project" && (new Date(u.when) >= start)).map(u => String(u.studentId || u.studentName))).size;

    setProjWeeklyBars(bars);
    setProjUniqueCount(uniq);
  }, [updates]);

  if (loading) {
    return (
      <Grid container spacing={1.5} sx={{ mb: 2 }}>
        <Grid item xs={12}><Skeleton variant="rounded" height={260} /></Grid>
        <Grid item xs={12}><Skeleton variant="rounded" height={240} /></Grid>
      </Grid>
    );
  }

  return (
    <Grid container spacing={1.5} sx={{ mb: 2 }}>
      {/* Completion per Course (%) */}
      <Grid item xs={12}>
        <CardShell>
          <Box sx={{ display: "flex", alignItems: "center", justifyContent: "space-between", mb: .5 }}>
            <Typography fontWeight={700}>Completion per Course (%)</Typography>
            <Chip size="small" variant="outlined" label={`${courseBars.length} courses`} />
          </Box>
          <Box sx={{ height: 260 }}>
            <ResponsiveContainer>
              <BarChart data={courseBars} margin={{ top: 8, right: 8, left: -8, bottom: 12 }}>
                <defs>
                  <linearGradient id="barGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#14b8a6" />
                    <stop offset="100%" stopColor="#0284c7" />
                  </linearGradient>
                </defs>
                <CartesianGrid vertical={false} strokeDasharray="3 3" />
                <XAxis dataKey="xLabel" tick={<TwoLineTick />} height={44} interval={0} />
                <YAxis domain={[0, 100]} tickFormatter={(v) => `${v}%`} width={36} />
                <RTooltip
                  formatter={(v) => [`${v}%`, "Completion"]}
                  labelFormatter={(label, payload) => payload?.[0]?.payload?.tooltip || label}
                />
                <Bar dataKey="completion" radius={[6,6,0,0]} fill="url(#barGrad)">
                  <LabelList dataKey="completion" position="top" formatter={(v)=>`${v}%`} />
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </Box>
        </CardShell>
      </Grid>

      {/* Project submitters this week (unique) */}
      <Grid item xs={12}>
        <CardShell>
          <Box sx={{ display: "flex", alignItems: "center", justifyContent: "space-between", mb: .5 }}>
            <Typography fontWeight={700}>Project submitters (unique, this week)</Typography>
            <Chip size="small" color="success" label={`${projUniqueCount} students`} />
          </Box>
          <Box sx={{ height: 240 }}>
            <ResponsiveContainer>
              <BarChart data={projWeeklyBars} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
                <CartesianGrid vertical={false} strokeDasharray="3 3" />
                <XAxis dataKey="day" />
                <YAxis allowDecimals={false} width={32} />
                <RTooltip formatter={(v)=>[String(v), "Unique students"]} />
                <Bar dataKey="count" radius={[6,6,0,0]} fill="#10b981">
                  <LabelList dataKey="count" position="top" />
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </Box>
        </CardShell>
      </Grid>
    </Grid>
  );
}
