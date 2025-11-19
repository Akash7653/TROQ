import React, { useEffect, useState } from "react";
import {
  Box,
  AppBar,
  Toolbar,
  Typography,
  Table,
  TableHead,
  TableRow,
  TableCell,
  TableBody,
  TableContainer,
  Paper,
  Button,
  Chip,
  TextField,
  MenuItem,
} from "@mui/material";

import { fetchRequests, assignRequest, updateStatus } from "./api";

export default function Admin() {
  const [requests, setRequests] = useState([]);
  const [filtered, setFiltered] = useState([]);

  const [search, setSearch] = useState("");
  const [filterStatus, setFilterStatus] = useState("All");
  const [filterService, setFilterService] = useState("All");

  async function load() {
    const data = await fetchRequests();
    setRequests(data);
    setFiltered(data);
  }

  useEffect(() => {
    load();
    const id = setInterval(load, 30000);
    return () => clearInterval(id);
  }, []);

  useEffect(() => {
    let data = [...requests];

    if (search.trim() !== "") {
      const s = search.toLowerCase();
      data = data.filter(
        (req) =>
          req.name?.toLowerCase().includes(s) ||
          req.phone?.includes(s) ||
          req.pickup?.toLowerCase().includes(s) ||
          req.drop_location?.toLowerCase().includes(s)
      );
    }

    if (filterStatus !== "All") {
      data = data.filter((r) => r.status === filterStatus);
    }

    if (filterService !== "All") {
      data = data.filter((r) => r.service_type === filterService);
    }

    setFiltered(data);
  }, [search, filterStatus, filterService, requests]);

  const doAssign = async (id) => {
    const name = prompt("Enter driver name");
    if (!name) return;
    await assignRequest(id, name);
    load();
  };

  const markDone = async (id) => {
    await updateStatus(id, "Completed");
    load();
  };

  const getStatusColor = (status) => {
    switch (status) {
      case "Pending":
        return "warning";
      case "Assigned":
        return "info";
      case "Completed":
        return "success";
      default:
        return "default";
    }
  };

  return (
    <>
      {/* TOP BAR — NO LOGOUT BUTTON */}
      <AppBar position="static">
        <Toolbar>
          <Typography variant="h6">TROQ Admin Dashboard</Typography>
        </Toolbar>
      </AppBar>

      <Box sx={{ padding: 3 }}>
        <Typography variant="h5" gutterBottom>
          Requests
        </Typography>

        {/* Search + Filters */}
        <Box sx={{ display: "flex", gap: 2, mb: 3 }}>
          <TextField
            label="Search"
            fullWidth
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />

          <TextField
            label="Status"
            select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
            sx={{ width: 180 }}
          >
            <MenuItem value="All">All</MenuItem>
            <MenuItem value="Pending">Pending</MenuItem>
            <MenuItem value="Assigned">Assigned</MenuItem>
            <MenuItem value="Completed">Completed</MenuItem>
          </TextField>

          <TextField
            label="Service"
            select
            value={filterService}
            onChange={(e) => setFilterService(e.target.value)}
            sx={{ width: 180 }}
          >
            <MenuItem value="All">All</MenuItem>
            <MenuItem value="Driver">Driver</MenuItem>
            <MenuItem value="Airport">Airport</MenuItem>
            <MenuItem value="Logistics">Logistics</MenuItem>
          </TextField>
        </Box>

        {/* TABLE */}
        <TableContainer component={Paper} elevation={3}>
          <Table>
            <TableHead sx={{ background: "#f5f5f5" }}>
              <TableRow>
                <TableCell>ID</TableCell>
                <TableCell>Name</TableCell>
                <TableCell>Phone</TableCell>
                <TableCell>Pickup → Drop</TableCell>
                <TableCell>Date/Time</TableCell>
                <TableCell>Service</TableCell>
                <TableCell>Status</TableCell>
                <TableCell>Assigned</TableCell>
                <TableCell>Actions</TableCell>
              </TableRow>
            </TableHead>

            <TableBody>
              {filtered.map((r) => (
                <TableRow key={r.id}>
                  <TableCell>{r.id}</TableCell>
                  <TableCell>{r.name}</TableCell>
                  <TableCell>{r.phone}</TableCell>
                  <TableCell>
                    {r.pickup} → {r.drop_location}
                  </TableCell>
                  <TableCell>{r.date_time}</TableCell>
                  <TableCell>{r.service_type}</TableCell>

                  <TableCell>
                    <Chip
                      label={r.status}
                      color={getStatusColor(r.status)}
                      variant="outlined"
                    />
                  </TableCell>

                  <TableCell>{r.assigned_to || "-"}</TableCell>

                  <TableCell>
                    <Button
                      onClick={() => doAssign(r.id)}
                      size="small"
                      variant="contained"
                      sx={{ mr: 1 }}
                    >
                      Assign
                    </Button>
                    <Button
                      onClick={() => markDone(r.id)}
                      size="small"
                      color="success"
                      variant="contained"
                    >
                      Done
                    </Button>
                  </TableCell>
                </TableRow>
              ))}

              {filtered.length === 0 && (
                <TableRow>
                  <TableCell colSpan={9} align="center">
                    No matching results
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </TableContainer>
      </Box>
    </>
  );
}
