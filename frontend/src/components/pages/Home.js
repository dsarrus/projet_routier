import React, { useState, useEffect } from "react";
import axios from "axios";
import { Link } from "react-router-dom";
import {
  Box,
  Typography,
  Grid,
  Card,
  CardContent,
  Chip,
  CircularProgress,
  Alert,
  Paper,
} from "@mui/material";
import { styled } from "@mui/material/styles";

const StatusChip = styled(Chip)(({ theme, status }) => ({
  marginTop: theme.spacing(1),
  backgroundColor:
    status === "actif"
      ? theme.palette.success.light
      : status === "en travaux"
      ? theme.palette.warning.light
      : theme.palette.error.light,
  color: theme.palette.getContrastText(
    status === "actif"
      ? theme.palette.success.light
      : status === "en travaux"
      ? theme.palette.warning.light
      : theme.palette.error.light
  ),
}));

const LotCard = styled(Card)(({ theme }) => ({
  height: "100%",
  display: "flex",
  flexDirection: "column",
  transition: "transform 0.3s ease-in-out",
  "&:hover": {
    transform: "scale(1.03)",
    boxShadow: theme.shadows[6],
  },
}));

const Home = () => {
  const [lots, setLots] = useState([]);
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchLots();
  }, []);

  const fetchLots = async () => {
    try {
      const res = await axios.get("http://localhost:5000/api/lots");
      setLots(res.data);
      setLoading(false);
    } catch (err) {
      setLoading(false);
      setError("Erreur lors du chargement des lots");
    }
  };

  if (loading)
    return (
      <Box display="flex" justifyContent="center" mt={4}>
        <CircularProgress />
      </Box>
    );

  if (error)
    return (
      <Box mx={2} my={4}>
        <Alert severity="error">{error}</Alert>
      </Box>
    );

  return (
    <Box sx={{ p: 3 }}>
      <Paper elevation={0} sx={{ p: 3, mb: 4 }}>
        <Typography variant="h3" component="h1" gutterBottom>
          Gestion des Lots Routiers
        </Typography>
        <Typography variant="subtitle1" color="text.secondary">
          Sélectionnez un lot pour voir les détails
        </Typography>
      </Paper>

      <Grid container spacing={3}>
        {lots.map((lot) => (
          <Grid item xs={12} sm={6} md={4} key={lot.id}>
            <Link to={`/lots/${lot.id}`} style={{ textDecoration: "none" }}>
              <LotCard>
                <CardContent>
                  <Typography variant="h5" component="h3" gutterBottom>
                    {lot.number}
                  </Typography>
                  <Typography variant="h6" component="h4" color="primary">
                    {lot.name}
                  </Typography>
                  <Typography variant="body1" sx={{ mt: 1 }}>
                    {lot.length_km} km
                  </Typography>
                  <StatusChip
                    label={lot.status}
                    status={lot.status.toLowerCase()}
                    size="small"
                  />
                </CardContent>
              </LotCard>
            </Link>
          </Grid>
        ))}
      </Grid>
    </Box>
  );
};

export default Home;
