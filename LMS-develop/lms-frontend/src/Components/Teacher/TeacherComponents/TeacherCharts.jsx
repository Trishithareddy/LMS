import React, { useMemo } from "react";
import {
  Box,
  Card,
  CardContent,
  Chip,
  Grid,
  Stack,
  Typography,
} from "@mui/material";
import { useTheme } from "@mui/material/styles";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip as RTooltip,
  XAxis,
  YAxis,
} from "recharts";

const num = (value) => Math.max(0, Number(value) || 0);

const ChartCard = ({ title, children, footer, theme }) => (
  <Card
    elevation={0}
    sx={{
      borderRadius: 1,
      border: 1,
      borderColor: "divider",
      bgcolor: "background.paper",
      height: "100%",
    }}
  >
    <CardContent sx={{ p: 1.75, height: "100%" }}>
      <Typography sx={{ fontWeight: 900, color: "text.primary", mb: 1 }}>
        {title}
      </Typography>
      {children}
      {footer}
    </CardContent>
  </Card>
);

export default function TeacherCharts({
  counts = {},
  updates = [],
  pendingWork = {},
  toolUsage = {},
}) {
  const reviewData = useMemo(() => {
    const toReview = num(counts.projectsToReview);
    const revisions = num(counts.needsRevision);
    const reviewed = Math.max(num(counts.projectSubmissions) - toReview - revisions, 0);
    const theme = useTheme();

    return [
      { name: "To review", value: toReview, color: "#f97316" },
      { name: "Revision", value: revisions, color: "#0284c7" },
      { name: "Reviewed", value: reviewed, color: "#16a34a" },
    ];
  }, [counts]);

  const movementData = useMemo(() => {
    const totals = { project: 0, quiz: 0, announcement: 0 };
    (updates || []).forEach((item) => {
      if (totals[item.type] !== undefined) totals[item.type] += 1;
    });

    return [
      { name: "Projects", value: totals.project, color: "#f97316" },
      { name: "Quizzes", value: totals.quiz, color: "#2563eb" },
      { name: "Notices", value: totals.announcement, color: "#16a34a" },
    ];
  }, [updates]);

  const assignmentData = useMemo(
    () => [
      { name: "Pending", value: num(pendingWork.assignmentReviews), color: "#7c3aed" },
      { name: "Reviewed", value: num(pendingWork.assignmentReviewed), color: "#16a34a" },
      { name: "Corrections", value: num(pendingWork.corrections), color: "#dc2626" },
      { name: "Late", value: num(pendingWork.lateAssignments), color: "#f59e0b" },
    ],
    [pendingWork]
  );

  const toolData = useMemo(
    () => [
      { name: "Assignments", value: num(toolUsage.assignments), color: "#7c3aed" },
      { name: "Quizzes", value: num(toolUsage.quizzes), color: "#2563eb" },
      { name: "QP", value: num(toolUsage.questionPapers), color: "#f97316" },
      { name: "Notices", value: num(toolUsage.notices), color: "#16a34a" },
    ],
    [toolUsage]
  );

  const hasReviewData = reviewData.some((item) => item.value > 0);
  const hasMovementData = movementData.some((item) => item.value > 0);
  const hasAssignmentData = assignmentData.some((item) => item.value > 0);
  const hasToolData = toolData.some((item) => item.value > 0);

  return (
    <Grid container spacing={2} sx={{ height: "100%" }}>
      <Grid item xs={12} md={6}>
        <ChartCard
          title="Project Review Status"
          footer={
            <Stack direction="row" spacing={1} sx={{ flexWrap: "wrap", gap: 1, mt: 1.5 }}>
              {reviewData.map((item) => (
                <Chip
                  key={item.name}
                  size="small"
                  label={`${item.name}: ${item.value}`}
                  sx={{ backgroundColor: `${item.color}18`, color: "text.primary", fontWeight: 800 }}
                />
              ))}
            </Stack>
          }
        >
          {hasReviewData ? (
            <Box sx={{ height: 150 }}>
              <ResponsiveContainer>
                <BarChart data={reviewData} margin={{ top: 8, right: 8, bottom: 0, left: -24 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} />
                  <XAxis dataKey="name" tick={{ fontSize: 11 }} />
                  <YAxis allowDecimals={false} tick={{ fontSize: 11 }} />
                  <RTooltip />
                  <Bar dataKey="value" radius={[6, 6, 0, 0]}>
                    {reviewData.map((entry) => (
                      <Cell key={entry.name} fill={entry.color} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </Box>
          ) : (
            <Box
              sx={{
                height: 150,
                display: "grid",
                placeItems: "center",
                borderRadius: 1,
                backgroundColor: "#f8fafc",
                color: "#64748b",
                textAlign: "center",
                px: 2,
              }}
            >
              <Typography sx={{ fontWeight: 800 }}>No review pressure right now</Typography>
            </Box>
          )}
        </ChartCard>
      </Grid>

      <Grid item xs={12} md={6}>
        <ChartCard
          title="Recent Movement"
          footer={
            <Stack direction="row" spacing={1} sx={{ flexWrap: "wrap", gap: 1, mt: 1.5 }}>
              {movementData.map((item) => (
                <Chip
                  key={item.name}
                  size="small"
                  label={`${item.name}: ${item.value}`}
                  sx={{ backgroundColor: `${item.color}18`, color: "text.primary", fontWeight: 800 }}
                />
              ))}
            </Stack>
          }
        >
          {hasMovementData ? (
            <Box sx={{ height: 150 }}>
              <ResponsiveContainer>
                <PieChart>
                  <RTooltip />
                  <Pie
                    data={movementData}
                    dataKey="value"
                    innerRadius={42}
                    outerRadius={64}
                    paddingAngle={4}
                  >
                    {movementData.map((entry) => (
                      <Cell key={entry.name} fill={entry.color} />
                    ))}
                  </Pie>
                </PieChart>
              </ResponsiveContainer>
            </Box>
          ) : (
            <Box
              sx={{
                height: 150,
                display: "grid",
                placeItems: "center",
                borderRadius: 1,
                bgcolor: "action.hover",
                color: "text.secondary",
                textAlign: "center",
                px: 2,
              }}
            >
              <Typography sx={{ fontWeight: 800 }}>No recent classroom movement</Typography>
            </Box>
          )}
        </ChartCard>
      </Grid>

      <Grid item xs={12} md={6}>
        <ChartCard
          title="Assignment Review Status"
          footer={
            <Stack direction="row" spacing={1} sx={{ flexWrap: "wrap", gap: 1, mt: 1.5 }}>
              {assignmentData.map((item) => (
                <Chip
                  key={item.name}
                  size="small"
                  label={`${item.name}: ${item.value}`}
                  sx={{ backgroundColor: `${item.color}18`, color: "text.primary", fontWeight: 800 }}
                />
              ))}
            </Stack>
          }
        >
          {hasAssignmentData ? (
            <Box sx={{ height: 150 }}>
              <ResponsiveContainer>
                <BarChart
                  data={assignmentData}
                  layout="vertical"
                  margin={{ top: 8, right: 18, bottom: 0, left: 58 }}
                >
                  <CartesianGrid strokeDasharray="3 3" horizontal={false} />
                  <XAxis type="number" allowDecimals={false} tick={{ fontSize: 11 }} />
                  <YAxis dataKey="name" type="category" tick={{ fontSize: 11 }} />
                  <RTooltip />
                  <Bar dataKey="value" radius={[0, 6, 6, 0]}>
                    {assignmentData.map((entry) => (
                      <Cell key={entry.name} fill={entry.color} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </Box>
          ) : (
            <Box
              sx={{
                height: 150,
                display: "grid",
                placeItems: "center",
                borderRadius: 1,
                bgcolor: "action.hover",
                color: "text.secondary",
                textAlign: "center",
                px: 2,
              }}
            >
              <Typography sx={{ fontWeight: 800 }}>No assignment review data yet</Typography>
            </Box>
          )}
        </ChartCard>
      </Grid>

      <Grid item xs={12} md={6}>
        <ChartCard
          title="Teacher Tools Usage"
          footer={
            <Stack direction="row" spacing={1} sx={{ flexWrap: "wrap", gap: 1, mt: 1.5 }}>
              {toolData.map((item) => (
                <Chip
                  key={item.name}
                  size="small"
                  label={`${item.name}: ${item.value}`}
                  sx={{ backgroundColor: `${item.color}18`, color: "text.primary", fontWeight: 800 }}
                />
              ))}
            </Stack>
          }
        >
          {hasToolData ? (
            <Box sx={{ height: 150 }}>
              <ResponsiveContainer>
                <BarChart data={toolData} margin={{ top: 8, right: 8, bottom: 0, left: -24 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} />
                  <XAxis dataKey="name" tick={{ fontSize: 11 }} />
                  <YAxis allowDecimals={false} tick={{ fontSize: 11 }} />
                  <RTooltip />
                  <Bar dataKey="value" radius={[6, 6, 0, 0]}>
                    {toolData.map((entry) => (
                      <Cell key={entry.name} fill={entry.color} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </Box>
          ) : (
            <Box
              sx={{
                height: 150,
                display: "grid",
                placeItems: "center",
                borderRadius: 1,
                backgroundColor: "#f8fafc",
                color: "#64748b",
                textAlign: "center",
                px: 2,
              }}
            >
              <Typography sx={{ fontWeight: 800 }}>No teacher tools used yet</Typography>
            </Box>
          )}
        </ChartCard>
      </Grid>
    </Grid>
  );
}
