import React, { useState, useEffect, useContext } from "react";
import {
  Box,
  Grid,
  Card,
  CardContent,
  Typography,
  Paper,
  List,
  ListItem,
  ListItemText,
  ListItemIcon,
  Chip,
  CircularProgress,
  Alert,
  Tabs,
  Tab,
  AppBar,
  Toolbar,
} from "@mui/material";
import {
  People as UsersIcon,
  Map as MapIcon,
  Description as DocumentsIcon,
  Assignment as LotsIcon,
  Timeline as StatsIcon,
  Security as AdminIcon,
  History as HistoryIcon,
} from "@mui/icons-material";
import { useSnackbar } from "notistack";
import AuthContext from "../../context/AuthContext";
import UserManagement from "./UserManagement";
import MapManagement from "./MapManagement";
import api from "../../services/api";
import "../../Admin.css";

const StatCard = ({ title, value, icon, color = "primary" }) => (
  <Card sx={{ height: "100%" }}>
    <CardContent>
      <Box sx={{ display: "flex", alignItems: "center", mb: 2 }}>
        <Box
          sx={{
            backgroundColor: `${color}.main`,
            color: "white",
            borderRadius: 1,
            p: 1,
            mr: 2,
          }}
        >
          {icon}
        </Box>
        <Box>
          <Typography color="textSecondary" gutterBottom variant="h6">
            {title}
          </Typography>
          <Typography variant="h4" component="div">
            {value}
          </Typography>
        </Box>
      </Box>
    </CardContent>
  </Card>
);

const RecentActivity = ({ activities }) => (
  <Paper sx={{ p: 2 }}>
    <Typography
      variant="h6"
      gutterBottom
      sx={{ display: "flex", alignItems: "center" }}
    >
      <HistoryIcon sx={{ mr: 1 }} />
      Activités Récentes
    </Typography>
    <List dense>
      {activities.map((activity, index) => (
        <ListItem key={index} divider={index < activities.length - 1}>
          <ListItemIcon>
            <Chip
              label={activity.action_type}
              color={
                activity.action_type.includes("create")
                  ? "success"
                  : activity.action_type.includes("update")
                  ? "warning"
                  : activity.action_type.includes("delete")
                  ? "error"
                  : "primary"
              }
              size="small"
            />
          </ListItemIcon>
          <ListItemText
            primary={activity.details}
            secondary={`Par ${activity.username} - ${new Date(
              activity.action_timestamp
            ).toLocaleString()}`}
          />
        </ListItem>
      ))}
    </List>
  </Paper>
);

const AdminDashboard = () => {
  const [activeTab, setActiveTab] = useState(0);
  const [dashboardData, setDashboardData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const { enqueueSnackbar } = useSnackbar();
  const { token } = useContext(AuthContext);

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      const response = await api.get("/api/admin/dashboard", {
        headers: { "x-auth-token": token },
      });
      setDashboardData(response.data);
    } catch (err) {
      console.error("Error fetching dashboard data:", err);
      setError("Erreur lors du chargement des données d'administration");
      enqueueSnackbar("Erreur lors du chargement des données", {
        variant: "error",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleTabChange = (event, newValue) => {
    setActiveTab(newValue);
  };

  if (loading) {
    return (
      <Box
        display="flex"
        justifyContent="center"
        alignItems="center"
        minHeight="400px"
      >
        <CircularProgress />
      </Box>
    );
  }

  if (error) {
    return (
      <Alert severity="error" sx={{ m: 2 }}>
        {error}
      </Alert>
    );
  }

  const { stats, recentActivities } = dashboardData;

  return (
    <Box sx={{ flexGrow: 1 }}>
      <AppBar position="static" color="default" elevation={1}>
        <Toolbar>
          <AdminIcon sx={{ mr: 2 }} />
          <Typography variant="h6" component="div">
            Administration
          </Typography>
        </Toolbar>
      </AppBar>

      <Box sx={{ borderBottom: 1, borderColor: "divider", mb: 3 }}>
        <Tabs value={activeTab} onChange={handleTabChange}>
          <Tab label="Tableau de Bord" />
          <Tab label="Gestion des Utilisateurs" />
          <Tab label="Gestion de la Carte" />
          <Tab label="Configuration" />
        </Tabs>
      </Box>

      {activeTab === 0 && (
        <Box sx={{ p: 3 }}>
          {/* Statistiques */}
          <Grid container spacing={3} sx={{ mb: 4 }}>
            <Grid item xs={12} sm={6} md={3}>
              <StatCard
                title="Utilisateurs Totaux"
                value={stats.totalUsers}
                icon={<UsersIcon />}
                color="primary"
              />
            </Grid>
            <Grid item xs={12} sm={6} md={3}>
              <StatCard
                title="Utilisateurs Actifs"
                value={stats.activeUsers}
                icon={<UsersIcon />}
                color="success"
              />
            </Grid>
            <Grid item xs={12} sm={6} md={3}>
              <StatCard
                title="Sections Routières"
                value={stats.totalSections}
                icon={<MapIcon />}
                color="info"
              />
            </Grid>
            <Grid item xs={12} sm={6} md={3}>
              <StatCard
                title="Documents"
                value={stats.totalDocuments}
                icon={<DocumentsIcon />}
                color="warning"
              />
            </Grid>
          </Grid>

          <Grid container spacing={3}>
            <Grid item xs={12} md={8}>
              <RecentActivity activities={recentActivities} />
            </Grid>
            <Grid item xs={12} md={4}>
              <Paper sx={{ p: 2 }}>
                <Typography
                  variant="h6"
                  gutterBottom
                  sx={{ display: "flex", alignItems: "center" }}
                >
                  <StatsIcon sx={{ mr: 1 }} />
                  Statistiques Rapides
                </Typography>
                <Box sx={{ mt: 2 }}>
                  <Typography variant="body2" gutterBottom>
                    Lots créés: <strong>{stats.totalLots}</strong>
                  </Typography>
                  <Typography variant="body2" gutterBottom>
                    Actions récentes (7j):{" "}
                    <strong>{stats.recentActions}</strong>
                  </Typography>
                  <Typography variant="body2" gutterBottom>
                    Taux d'activité:{" "}
                    <strong>
                      {Math.round((stats.activeUsers / stats.totalUsers) * 100)}
                      %
                    </strong>
                  </Typography>
                </Box>
              </Paper>
            </Grid>
          </Grid>
        </Box>
      )}

      {activeTab === 1 && <UserManagement />}
      {activeTab === 2 && <MapManagement />}
      {activeTab === 3 && (
        <Paper sx={{ p: 3 }}>
          <Typography variant="h6" gutterBottom>
            Configuration du Système
          </Typography>
          <Typography color="textSecondary">
            Module de configuration en cours de développement...
          </Typography>
        </Paper>
      )}
    </Box>
  );
};

export default AdminDashboard;
