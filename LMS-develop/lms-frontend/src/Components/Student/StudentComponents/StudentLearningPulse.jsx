import React, { useMemo } from "react";
import { Box, Card, CardContent, Chip, Grid, Stack, Typography } from "@mui/material";
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
import { useTheme } from "@mui/material/styles";

const num = (value) => Math.max(0, Number(value) || 0);


const ChartCard = ({ title, children, footer }) => (
  <Card
    elevation={0}
    sx={{
      borderRadius: 1,
      border: 1,
      borderColor: "divider",
      bgcolor: "background.paper",
      boxShadow: 2,
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

export default function StudentLearningPulse({
  courses = [],
  assessments = [],
  overviewCounts = {},
  projectSummary = {},
  recentUpdates = [],
}) {

  const theme = useTheme();
  const dark = theme.palette.mode === "dark";

  const courseData = useMemo(() => {
    const list = Array.isArray(courses) ? courses : [];
    return [
      {
        name: "Open",
        value: list.filter((course) => num(course.progress) > 0 && num(course.progress) < 100).length,
        color: "#2563eb",
      },
      {
        name: "Completed",
        value: list.filter((course) => num(course.progress) >= 100).length,
        color: "#16a34a",
      },
      {
        name: "Locked/New",
        value: list.filter((course) => num(course.progress) <= 0).length,
        color: "#94a3b8",
      },
    ];
  }, [courses]);

  const assessmentData = useMemo(
    () => [
      { name: "Pending", value: num(overviewCounts.pendingAssessments), color: "#f97316" },
      { name: "Due Soon", value: num(overviewCounts.dueSoon), color: "#f59e0b" },
      {
        name: "Done",
        value: Math.max((assessments || []).filter((item) => item.status === "Completed").length, 0),
        color: "#16a34a",
      },
    ],
    [assessments, overviewCounts]
  );

  const projectData = useMemo(() => {
    const projects = Array.isArray(projectSummary.projects) ? projectSummary.projects : [];
    return [
      { name: "Reviewed", value: num(projectSummary.reviewed), color: "#16a34a" },
      { name: "Revision", value: num(projectSummary.needsRevision), color: "#dc2626" },
      {
        name: "Submitted",
        value: projects.filter((project) => project.status === "submitted").length,
        color: "#2563eb",
      },
    ];
  }, [projectSummary]);

  const updateMix = useMemo(() => {
    const counts = { project: 0, assessment: 0, announcement: 0 };
    (recentUpdates || []).forEach((item) => {
      if (counts[item.type] !== undefined) counts[item.type] += 1;
    });
    return [
      { name: "Projects", value: counts.project, color: "#f97316" },
      { name: "Tests", value: counts.assessment, color: "#2563eb" },
      { name: "Notices", value: counts.announcement, color: "#16a34a" },
    ];
  }, [recentUpdates]);

  const datasets = [
    { title: "Course Access", data: courseData, type: "donut" },
    { title: "Assessment Status", data: assessmentData, type: "bar" },
    { title: "Project Feedback", data: projectData, type: "bar" },
    { title: "Recent Updates Mix", data: updateMix, type: "donut" },
  ];

  return (
    <Grid container spacing={2}>
      {datasets.map((chart) => {
        const hasData = chart.data.some((item) => item.value > 0);
        return (
          <Grid item xs={12} md={6} key={chart.title}>
            <ChartCard
              title={chart.title}
              footer={
                <Stack direction="row" spacing={1} sx={{ flexWrap: "wrap", gap: 1, mt: 1.5 }}>
                  {chart.data.map((item) => (
                    <Chip
                      key={item.name}
                      size="small"
                      label={`${item.name}: ${item.value}`}
                      sx={{
                        bgcolor: `${item.color}18`,
                        color: "text.primary",
                        fontWeight: 800,
                      }}
                    />
                  ))}
                </Stack>
              }
            >
              {hasData ? (
                <Box sx={{ height: 150 }}>
                  <ResponsiveContainer>
                    {chart.type === "donut" ? (
                      <PieChart>
                        <RTooltip />
                        <Pie
                          data={chart.data}
                          dataKey="value"
                          innerRadius={42}
                          outerRadius={64}
                          paddingAngle={4}
                        >
                          {chart.data.map((entry) => (
                            <Cell key={entry.name} fill={entry.color} />
                          ))}
                        </Pie>
                      </PieChart>
                    ) : (
                      <BarChart data={chart.data} margin={{ top: 8, right: 8, bottom: 0, left: -24 }}>
                        <CartesianGrid
                          stroke={dark ? "#444" : "#d1d5db"}
                          strokeDasharray="3 3"
                          vertical={false}
                        />
                        <XAxis
                          dataKey="name"
                          tick={{
                            fontSize: 11,
                            fill: theme.palette.text.secondary,
                          }}
                        />
                        <YAxis
                          allowDecimals={false}
                          tick={{
                            fontSize: 11,
                            fill: theme.palette.text.secondary,
                          }}
                        />
                        <RTooltip />
                        <Bar dataKey="value" radius={[6, 6, 0, 0]}>
                          {chart.data.map((entry) => (
                            <Cell key={entry.name} fill={entry.color} />
                          ))}
                        </Bar>
                      </BarChart>
                    )}
                  </ResponsiveContainer>
                </Box>
              ) : (
                <Box
                  sx={{
                    height: 150,
                    display: "grid",
                    placeItems: "center",
                    borderRadius: 1,
                    bgcolor: "background.default",
                    color: "text.secondary",
                    textAlign: "center",
                    px: 2,
                  }}
                >
                  <Typography sx={{ fontWeight: 800 }}>No data yet</Typography>
                </Box>
              )}
            </ChartCard>
          </Grid>
        );
      })}
    </Grid>
  );
}
