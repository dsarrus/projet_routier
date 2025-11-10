import React, { useState, useEffect, useContext } from "react";
import { Link } from "react-router-dom";
import {
  Box,
  Container,
  Typography,
  Grid,
  Card,
  CardContent,
  Button,
  Chip,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Stack,
  IconButton,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Alert,
  CircularProgress,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
} from "@mui/material";
import {
  Download,
  Visibility,
  PictureAsPdf,
  Assessment,
  FilterList,
  Search,
  CalendarToday,
  Straighten,
  Speed,
  Public,
} from "@mui/icons-material";
import { useSnackbar } from "notistack";
import AuthContext from "../../context/AuthContext";
import api from "../../services/api";

const ReportsPage = () => {
  const [lots, setLots] = useState([]);
  const [filteredLots, setFilteredLots] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [filters, setFilters] = useState({
    search: "",
    status: "tous",
    region: "toutes",
  });
  const [selectedLot, setSelectedLot] = useState(null);
  const [reportDialogOpen, setReportDialogOpen] = useState(false);
  const { enqueueSnackbar } = useSnackbar();
  const { token } = useContext(AuthContext);

  useEffect(() => {
    fetchLots();
  }, []);

  useEffect(() => {
    filterLots();
  }, [lots, filters]);

  const fetchLots = async () => {
    try {
      const response = await api.get("/api/lots");
      setLots(response.data);
      setFilteredLots(response.data);
    } catch (err) {
      setError("Erreur lors du chargement des lots");
      enqueueSnackbar("Erreur lors du chargement des données", {
        variant: "error",
      });
    } finally {
      setLoading(false);
    }
  };

  const filterLots = () => {
    let filtered = lots;

    if (filters.search) {
      filtered = filtered.filter(
        (lot) =>
          lot.name.toLowerCase().includes(filters.search.toLowerCase()) ||
          lot.number.toLowerCase().includes(filters.search.toLowerCase())
      );
    }

    if (filters.status !== "tous") {
      filtered = filtered.filter((lot) => lot.status === filters.status);
    }

    if (filters.region !== "toutes") {
      filtered = filtered.filter((lot) => lot.region === filters.region);
    }

    setFilteredLots(filtered);
  };

  const handleFilterChange = (filterName, value) => {
    setFilters((prev) => ({
      ...prev,
      [filterName]: value,
    }));
  };

  const handleViewDetails = (lot) => {
    setSelectedLot(lot);
    setReportDialogOpen(true);
  };

  const handleGenerateReport = async (lotId, format = "pdf") => {
    try {
      enqueueSnackbar(`Génération du rapport ${format} en cours...`, {
        variant: "info",
      });
      // Simuler la génération du rapport
      setTimeout(() => {
        enqueueSnackbar(`Rapport ${format} généré avec succès`, {
          variant: "success",
        });
      }, 2000);
    } catch (err) {
      enqueueSnackbar("Erreur lors de la génération du rapport", {
        variant: "error",
      });
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case "actif":
        return "success";
      case "en travaux":
        return "warning";
      case "en attente":
        return "error";
      case "terminé":
        return "info";
      default:
        return "default";
    }
  };

  const regions = [
    "toutes",
    "Analamanga",
    "Vakinankaratra",
    "Itasy",
    "Boeny",
    "Diana",
    "Sava",
    "Anosy",
  ];

  if (loading) {
    return (
      <Box
        display="flex"
        justifyContent="center"
        alignItems="center"
        minHeight="400px"
      >
        <Stack alignItems="center" spacing={2}>
          <CircularProgress size={60} />
          <Typography variant="h6" color="text.secondary">
            Chargement des rapports...
          </Typography>
        </Stack>
      </Box>
    );
  }

  return (
    <Container maxWidth="lg" sx={{ py: 4 }}>
      {/* En-tête */}
      <Box sx={{ mb: 4 }}>
        <Typography variant="h3" component="h1" gutterBottom fontWeight="bold">
          📊 Rapports de Suivi
        </Typography>
        <Typography variant="h6" color="text.secondary">
          Consultez et générez les rapports détaillés pour chaque projet routier
        </Typography>
      </Box>

      {/* Filtres */}
      <Card sx={{ mb: 4, p: 3 }}>
        <Stack direction="row" spacing={2} alignItems="center" sx={{ mb: 3 }}>
          <FilterList color="primary" />
          <Typography variant="h6">Filtres</Typography>
        </Stack>

        <Grid container spacing={3}>
          <Grid item xs={12} md={4}>
            <TextField
              fullWidth
              label="Rechercher un projet"
              value={filters.search}
              onChange={(e) => handleFilterChange("search", e.target.value)}
              InputProps={{
                startAdornment: (
                  <Search sx={{ color: "text.secondary", mr: 1 }} />
                ),
              }}
            />
          </Grid>
          <Grid item xs={12} md={4}>
            <FormControl fullWidth>
              <InputLabel>Statut</InputLabel>
              <Select
                value={filters.status}
                label="Statut"
                onChange={(e) => handleFilterChange("status", e.target.value)}
              >
                <MenuItem value="tous">Tous les statuts</MenuItem>
                <MenuItem value="actif">Actif</MenuItem>
                <MenuItem value="en travaux">En travaux</MenuItem>
                <MenuItem value="en attente">En attente</MenuItem>
                <MenuItem value="terminé">Terminé</MenuItem>
              </Select>
            </FormControl>
          </Grid>
          <Grid item xs={12} md={4}>
            <FormControl fullWidth>
              <InputLabel>Région</InputLabel>
              <Select
                value={filters.region}
                label="Région"
                onChange={(e) => handleFilterChange("region", e.target.value)}
              >
                {regions.map((region) => (
                  <MenuItem key={region} value={region}>
                    {region === "toutes" ? "Toutes les régions" : region}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          </Grid>
        </Grid>
      </Card>

      {/* Statistiques */}
      <Grid container spacing={3} sx={{ mb: 4 }}>
        <Grid item xs={12} sm={6} md={3}>
          <Card sx={{ textAlign: "center", p: 2, bgcolor: "primary.50" }}>
            <Typography variant="h4" fontWeight="bold" color="primary">
              {lots.length}
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Projets Totaux
            </Typography>
          </Card>
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <Card sx={{ textAlign: "center", p: 2, bgcolor: "success.50" }}>
            <Typography variant="h4" fontWeight="bold" color="success.main">
              {lots.filter((l) => l.status === "actif").length}
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Projets Actifs
            </Typography>
          </Card>
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <Card sx={{ textAlign: "center", p: 2, bgcolor: "warning.50" }}>
            <Typography variant="h4" fontWeight="bold" color="warning.main">
              {lots.filter((l) => l.status === "en travaux").length}
            </Typography>
            <Typography variant="body2" color="text.secondary">
              En Travaux
            </Typography>
          </Card>
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <Card sx={{ textAlign: "center", p: 2, bgcolor: "info.50" }}>
            <Typography variant="h4" fontWeight="bold" color="info.main">
              {lots.filter((l) => l.status === "terminé").length}
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Terminés
            </Typography>
          </Card>
        </Grid>
      </Grid>

      {/* Tableau des lots */}
      <Card>
        <CardContent sx={{ p: 0 }}>
          <TableContainer>
            <Table>
              <TableHead sx={{ bgcolor: "grey.50" }}>
                <TableRow>
                  <TableCell sx={{ fontWeight: "bold" }}>Projet</TableCell>
                  <TableCell sx={{ fontWeight: "bold" }}>Numéro</TableCell>
                  <TableCell sx={{ fontWeight: "bold" }}>Région</TableCell>
                  <TableCell sx={{ fontWeight: "bold" }}>Longueur</TableCell>
                  <TableCell sx={{ fontWeight: "bold" }}>Statut</TableCell>
                  <TableCell sx={{ fontWeight: "bold" }}>
                    Dernier Rapport
                  </TableCell>
                  <TableCell sx={{ fontWeight: "bold" }}>Actions</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {filteredLots.map((lot) => (
                  <TableRow key={lot.id} hover>
                    <TableCell>
                      <Typography variant="subtitle1" fontWeight="600">
                        {lot.name}
                      </Typography>
                    </TableCell>
                    <TableCell>
                      <Chip
                        label={lot.number}
                        variant="outlined"
                        size="small"
                      />
                    </TableCell>
                    <TableCell>
                      <Box sx={{ display: "flex", alignItems: "center" }}>
                        <Public
                          sx={{ fontSize: 16, mr: 1, color: "text.secondary" }}
                        />
                        {lot.region || "Non spécifié"}
                      </Box>
                    </TableCell>
                    <TableCell>
                      <Box sx={{ display: "flex", alignItems: "center" }}>
                        <Straighten
                          sx={{ fontSize: 16, mr: 1, color: "text.secondary" }}
                        />
                        {lot.length_km || "N/A"} km
                      </Box>
                    </TableCell>
                    <TableCell>
                      <Chip
                        label={lot.status}
                        color={getStatusColor(lot.status)}
                        size="small"
                      />
                    </TableCell>
                    <TableCell>
                      <Box sx={{ display: "flex", alignItems: "center" }}>
                        <CalendarToday
                          sx={{ fontSize: 16, mr: 1, color: "text.secondary" }}
                        />
                        {lot.last_report_date || "Aucun rapport"}
                      </Box>
                    </TableCell>
                    <TableCell>
                      <Stack direction="row" spacing={1}>
                        <IconButton
                          size="small"
                          color="primary"
                          onClick={() => handleViewDetails(lot)}
                          title="Voir détails"
                        >
                          <Visibility />
                        </IconButton>
                        <IconButton
                          size="small"
                          color="secondary"
                          onClick={() => handleGenerateReport(lot.id, "pdf")}
                          title="Télécharger PDF"
                        >
                          <PictureAsPdf />
                        </IconButton>
                        <Button
                          variant="outlined"
                          size="small"
                          startIcon={<Assessment />}
                          component={Link}
                          to={`/lots/${lot.id}`}
                        >
                          Suivi
                        </Button>
                      </Stack>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>

          {filteredLots.length === 0 && (
            <Box sx={{ p: 4, textAlign: "center" }}>
              <Assessment
                sx={{ fontSize: 60, color: "text.secondary", mb: 2 }}
              />
              <Typography variant="h6" color="text.secondary">
                Aucun projet ne correspond aux filtres
              </Typography>
            </Box>
          )}
        </CardContent>
      </Card>

      {/* Dialog de détail du lot */}
      <Dialog
        open={reportDialogOpen}
        onClose={() => setReportDialogOpen(false)}
        maxWidth="md"
        fullWidth
      >
        <DialogTitle>📋 Rapport Détaillé - {selectedLot?.name}</DialogTitle>
        <DialogContent>
          {selectedLot && (
            <Grid container spacing={3} sx={{ mt: 1 }}>
              <Grid item xs={12} sm={6}>
                <Typography variant="subtitle1" fontWeight="600">
                  Numéro:
                </Typography>
                <Typography variant="body1">{selectedLot.number}</Typography>
              </Grid>
              <Grid item xs={12} sm={6}>
                <Typography variant="subtitle1" fontWeight="600">
                  Statut:
                </Typography>
                <Chip
                  label={selectedLot.status}
                  color={getStatusColor(selectedLot.status)}
                  size="small"
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <Typography variant="subtitle1" fontWeight="600">
                  Longueur:
                </Typography>
                <Typography variant="body1">
                  {selectedLot.length_km || "N/A"} km
                </Typography>
              </Grid>
              <Grid item xs={12} sm={6}>
                <Typography variant="subtitle1" fontWeight="600">
                  Région:
                </Typography>
                <Typography variant="body1">
                  {selectedLot.region || "Non spécifié"}
                </Typography>
              </Grid>
              <Grid item xs={12}>
                <Typography variant="subtitle1" fontWeight="600">
                  Description:
                </Typography>
                <Typography variant="body1">
                  {selectedLot.description || "Aucune description disponible"}
                </Typography>
              </Grid>
            </Grid>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setReportDialogOpen(false)}>Fermer</Button>
          <Button
            variant="contained"
            startIcon={<PictureAsPdf />}
            onClick={() => handleGenerateReport(selectedLot?.id, "pdf")}
          >
            Générer PDF
          </Button>
        </DialogActions>
      </Dialog>
    </Container>
  );
};

export default ReportsPage;
