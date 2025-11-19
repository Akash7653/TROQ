import React from "react";
import {
  Drawer,
  List,
  ListItemButton,
  ListItemText,
  ListItemIcon,
  Toolbar,
  Box,
} from "@mui/material";

import DashboardIcon from "@mui/icons-material/Dashboard";
import ListIcon from "@mui/icons-material/List";
import PeopleIcon from "@mui/icons-material/People";
import SettingsIcon from "@mui/icons-material/Settings";

export default function Sidebar({ page, setPage }) {
  return (
    <Drawer
      variant="permanent"
      sx={{
        width: 220,
        "& .MuiDrawer-paper": {
          width: 220,
          boxSizing: "border-box",
        },
      }}
    >
      <Toolbar />
      <Box sx={{ overflow: "auto" }}>
        <List>

          <ListItemButton selected={page === "dashboard"} onClick={() => setPage("dashboard")}>
            <ListItemIcon><DashboardIcon /></ListItemIcon>
            <ListItemText primary="Dashboard" />
          </ListItemButton>

          <ListItemButton selected={page === "requests"} onClick={() => setPage("requests")}>
            <ListItemIcon><ListIcon /></ListItemIcon>
            <ListItemText primary="Requests" />
          </ListItemButton>

          <ListItemButton selected={page === "drivers"} onClick={() => setPage("drivers")}>
            <ListItemIcon><PeopleIcon /></ListItemIcon>
            <ListItemText primary="Drivers" />
          </ListItemButton>

          <ListItemButton selected={page === "settings"} onClick={() => setPage("settings")}>
            <ListItemIcon><SettingsIcon /></ListItemIcon>
            <ListItemText primary="Settings" />
          </ListItemButton>

        </List>
      </Box>
    </Drawer>
  );
}
