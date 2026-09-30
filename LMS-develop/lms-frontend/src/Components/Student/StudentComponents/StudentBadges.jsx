import React, { useEffect, useState } from "react";
import {
    Box,
    Typography,
    Grid,
    Card,
    CardContent,
    Avatar,
    Button,
    Stack,
} from "@mui/material";
import axios from "axios";

const API = import.meta.env.VITE_API_URL;
const FRONTEND_URL = import.meta.env.VITE_FRONTEND_URL;


const VERIFY_URL = `${FRONTEND_URL}/verify`;

export default function StudentBadges() {
    const [badges, setBadges] = useState([]);
    const token = localStorage.getItem("token");

    useEffect(() => {
        const fetchBadges = async () => {
            const res = await axios.get(
                `${API}/api/badges/user-badges/me`,
                { headers: { Authorization: `Bearer ${token}` } }
            );
            setBadges(res.data || []);
        };
        fetchBadges();
    }, []);

    if (!badges.length) {
        return (
            <Typography align="center" sx={{ mt: 5 }}>
                No badges earned yet.
            </Typography>
        );
    }

    return (
        <Box sx={{ p: 3 }}>
            <Typography variant="h4" sx={{ mb: 3 }}>
                🏅 My Badges
            </Typography>

            <Grid container spacing={3}>
                {badges.map((b) => (
                    <Grid item xs={12} sm={6} md={4} key={b._id}>
                        <Card elevation={3}>
                            <CardContent
                                sx={{
                                    textAlign: "center",
                                    display: "flex",
                                    flexDirection: "column",
                                    gap: 0.6,
                                }}
                            >

                                <Avatar
                                    src={`${API}${b.badgeId?.iconUrl}`}
                                    sx={{ width: 80, height: 80, mx: "auto", mb: 2 }}
                                />

                                <Typography variant="h6">
                                    {b.badgeId?.title}
                                </Typography>

                                <Typography variant="body2" color="text.secondary">
                                    {b.badgeId?.description}
                                </Typography>
                                <Typography variant="caption" sx={{ mt: 1 }}>
                                    Badge Number: <b>{b.verifyCode}</b>
                                </Typography>



                                <Box sx={{ mt: 1 }}>
                                    <Typography variant="caption" display="block">
                                        Awarded on: {new Date(b.awardedAt).toLocaleDateString()}
                                    </Typography>

                                    <Typography variant="caption" display="block">
                                        Academic Year: <b>{b.academicYear || "—"}</b>
                                    </Typography>

                                    {/* <Typography
                                        variant="caption"
                                        //color="primary"
                                        display="block"
                                        sx={{ mt: 0.5 }}
                                    >
                                        badgeNumber: <b>{b.badgeNumber}</b>
                                    </Typography>  */}
                                </Box>

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
                                        href={`${API}/api/badges/download/${b.badgeNumber}`}
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
                                </Stack>

                            </CardContent>
                        </Card>
                    </Grid>
                ))}
            </Grid>
        </Box>
    );
}
