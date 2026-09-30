import React, { useEffect, useState } from "react";
import { useSearchParams } from "react-router-dom";
import axios from "axios";
import {
    Box,
    Typography,
    Card,
    CardContent,
    Avatar,
    Button,
    TextField,
    CircularProgress,
} from "@mui/material";

const API = import.meta.env.VITE_API_URL;

export default function VerifyBadge() {
    const [params] = useSearchParams();
    const [verifyCode, setVerifyCode] = useState("");
    const [name, setName] = useState("");
    const [data, setData] = useState(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");

    const handleVerify = async () => {
        if (!verifyCode) {
            setError("Enter verification code");
            return;
        }


        setLoading(true);
        setError("");
        setData(null);

        try {
            const params = { verifyCode };
            if (name.trim()) params.name = name;

            const res = await axios.get(`${API}/api/badges/verify`, { params });

            setData(res.data);
        } catch {
            setError("❌ Badge not found or invalid");
        } finally {
            setLoading(false);
        }
    };


    return (
        <Box sx={{ maxWidth: 420, mx: "auto", mt: 6 }}>
            <Card>
                <CardContent sx={{ textAlign: "center" }}>
                    <Typography variant="h6" sx={{ mb: 2 }}>
                        🔍 Verify Badge
                    </Typography>

                    <TextField
                        label="Verification Code"
                        fullWidth
                        value={verifyCode}
                        onChange={(e) => setVerifyCode(e.target.value)}
                        sx={{ mb: 2 }}
                    />


                    <Typography variant="caption">OR</Typography>

                    <TextField
                        label="Name"
                        fullWidth
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        sx={{ my: 2 }}
                    />

                    <Button
                        variant="contained"
                        fullWidth
                        onClick={handleVerify}
                        disabled={loading}
                    >
                        Verify
                    </Button>

                    {loading && <CircularProgress sx={{ mt: 2 }} />}

                    {error && (
                        <Typography color="error" sx={{ mt: 2 }}>
                            {error}
                        </Typography>
                    )}
                </CardContent>
            </Card>

            {data && (
                <Card sx={{ mt: 3 }}>
                    <CardContent sx={{ textAlign: "center" }}>
                        <Avatar
                            src={`${API}${data.badge.iconUrl}`}
                            sx={{ width: 90, height: 90, mx: "auto", mb: 2 }}
                        />

                        <Typography variant="h6">{data.badge.title}</Typography>
                        <Typography color="text.secondary">
                            {data.badge.description}
                        </Typography>

                        <Typography sx={{ mt: 2 }}>
                            👤 Awarded To: <b>{data.userName}</b>
                        </Typography>

                        <Typography>
                            📅 Awarded On:{" "}
                            {new Date(data.awardedAt).toLocaleDateString()}
                        </Typography>

                        <Typography
                            sx={{
                                mt: 1.5,
                                display: "inline-flex",
                                alignItems: "center",
                                gap: 0.8,
                                px: 1.5,
                                py: 0.5,
                                borderRadius: 2,
                                backgroundColor: "rgba(46, 125, 50, 0.08)", // soft green
                                color: "success.dark",
                                fontWeight: 600,
                                fontSize: 14,
                            }}
                        >
                            🏫 Awarded By:
                            <span style={{ color: "#2e7d32", fontWeight: 700 }}>
                                Super Teacher EduroForms
                            </span>
                        </Typography>

                        {/* <Typography sx={{ mt: 1 }}>
                            🔐 Badge Number: <b>{data.badgeNumber}</b>
                        </Typography> */}

                    </CardContent>
                </Card>
            )}
        </Box>
    );
}
