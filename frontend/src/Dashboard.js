import React, { useEffect, useState } from "react";
import {
  Box,
  Grid,
  Paper,
  Typography,
  Button,
  CircularProgress
} from "@mui/material";

import { fetchStats, fetchRecentRequests } from "./api";

export default function Dashboard() {
  const [stats, setStats] = useState(null);
  const [recent, setRecent] = useState([]);
  const [loading, setLoading] = useState(true);

  const reportPath = "/mnt/data/ac238bc0-2c9d-4054-9e30-2027ed26699f.pdf";

  async function load() {
    setLoading(true);
    try {
      const s = await fetchStats();
      setStats(s);

      const r = await fetchRecentRequests();
      setRecent(r);
    } catch (err) {
      console.error(err);
    }
    setLoading(false);
  }

  useEffect(() => {
    load();
    const timer = setInterval(load, 30000);
    return () => clearInterval(timer);
  }, []);

  if (loading && !stats) {
    return (
      <Box sx={{ padding: 3 }}>
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Box sx={{ padding: 3 }}>
      <Typography variant="h4" gutterBottom>
        Dashboard Overview
      </Typography>

      <Box sx={{ display: "flex", gap: 2, mb: 2 }}>
        <Button variant="contained" onClick={load}>Refresh</Button>
        <Button variant="outlined" href={reportPath} target="_blank">
          Download Report (PDF)
        </Button>
      </Box>

      <Grid container spacing={2}>
        {stats && (
          <>
            <Grid item xs={12} sm={6} md={3}>
              <Paper sx={{ padding: 2 }}>
                <Typography>Total Requests</Typography>
                <Typography variant="h5">{stats.total_requests}</Typography>
              </Paper>
            </Grid>

            <Grid item xs={12} sm={6} md={3}>
              <Paper sx={{ padding: 2 }}>
                <Typography>Pending</Typography>
                <Typography variant="h5">{stats.pending}</Typography>
              </Paper>
            </Grid>

            <Grid item xs={12} sm={6} md={3}>
              <Paper sx={{ padding: 2 }}>
                <Typography>Assigned</Typography>
                <Typography variant="h5">{stats.assigned}</Typography>
              </Paper>
            </Grid>

            <Grid item xs={12} sm={6} md={3}>
              <Paper sx={{ padding: 2 }}>
                <Typography>Completed</Typography>
                <Typography variant="h5">{stats.completed}</Typography>
              </Paper>
            </Grid>

            <Grid item xs={12} sm={6} md={3}>
              <Paper sx={{ padding: 2 }}>
                <Typography>Today's Requests</Typography>
                <Typography variant="h5">{stats.today_requests}</Typography>
              </Paper>
            </Grid>
          </>
        )}

        <Grid item xs={12} md={6}>
          <Paper sx={{ padding: 2 }}>
            <Typography variant="h6">Recent Requests</Typography>

            {recent.length === 0 ? (
              <Typography>No recent requests</Typography>
            ) : (
              recent.map((r) => (
                <Box
                  key={r.id}
                  sx={{
                    borderBottom: "1px solid #eee",
                    paddingBottom: "8px",
                    marginBottom: "8px",
                  }}
                >
                  <Typography><strong>#{r.id}</strong> — {r.name}</Typography>
                  <Typography variant="caption">
                    {r.pickup} → {r.drop_location}
                  </Typography>
                </Box>
              ))
            )}
          </Paper>
        </Grid>
      </Grid>
    </Box>
  );
}
