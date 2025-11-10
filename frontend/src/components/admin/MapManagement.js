import React, { useState, useEffect, useContext } from "react";
import {
  Box,
  Paper,
  Typography,
  Grid,
  Card,
  CardContent,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Chip,
  IconButton,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Switch,
  FormControlLabel,
  Stepper,
  Step,
  StepLabel,
  Alert,
  Tooltip,
  Avatar,
  LinearProgress,
  Divider,
} from "@mui/material";
import {
  Add,
  Edit,
  Delete,
  Map as MapIcon,
  Construction,
  CheckCircle,
  Visibility,
  LocationOn,
  Straighten,
  CalendarToday,
  Speed,
  Public,
} from "@mui/icons-material";
import { useSnackbar } from "notistack";
import AuthContext from "../../context/AuthContext";
import api from "../../services/api";

// Liste des régions de Madagascar
const REGIONS_MADAGASCAR = [
  "Analamanga",
  "Vakinankaratra",
  "Itasy",
  "Bongolava",
  "Menabe",
  "Melaky",
  "Alaotra-Mangoro",
  "Atsinanana",
  "Analanjirofo",
  "Boeny",
  "Sofia",
  "Betsiboka",
  "Diana",
  "Sava",
  "Anosy",
  "Androy",
  "Atsimo-Andrefana",
  "Ihorombe",
  "Haute Matsiatra",
  "Amoron'i Mania",
  "Vatovavy-Fitovinany",
  "Atsimo-Atsinanana",
];

const STATUS_OPTIONS = [
  {
    value: "excellent",
    label: "Excellent",
    color: "success",
    icon: <CheckCircle />,
  },
  { value: "bon", label: "Bon", color: "success", icon: <CheckCircle /> },
  { value: "moyen", label: "Moyen", color: "warning", icon: <Visibility /> },
  {
    value: "mauvais",
    label: "Mauvais",
    color: "error",
    icon: <Construction />,
  },
  {
    value: "critique",
    label: "Critique",
    color: "error",
    icon: <Construction />,
  },
  { value: "inconnu", label: "Inconnu", color: "default", icon: <MapIcon /> },
];

const MapManagement = () => {
  const [sections, setSections] = useState([]);
  const [lots, setLots] = useState([]);
  const [openDialog, setOpenDialog] = useState(false);
  const [currentSection, setCurrentSection] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activeStep, setActiveStep] = useState(0);
  const { enqueueSnackbar } = useSnackbar();
  const { token } = useContext(AuthContext);

  useEffect(() => {
    fetchSections();
    fetchLots();
  }, []);

  const fetchSections = async () => {
    try {
      const response = await api.get("/api/map/sections", {
        headers: { "x-auth-token": token },
      });
      setSections(response.data.sections);
    } catch (err) {
      console.error("Error fetching sections:", err);
      enqueueSnackbar("Erreur lors du chargement des sections", {
        variant: "error",
      });
    } finally {
      setLoading(false);
    }
  };

  const fetchLots = async () => {
    try {
      const response = await api.get("/api/lots");
      setLots(response.data);
    } catch (err) {
      console.error("Error fetching lots:", err);
    }
  };

  const handleCreateSection = () => {
    setCurrentSection({
      name: "",
      description: "",
      lot_id: "",
      status: "inconnu",
      coordinates: null,
      length_km: 0,
      region: "",
      progress_percentage: 0,
      last_inspection: new Date().toISOString().split("T")[0],
      next_inspection: "",
      type: "route_nationale",
      traffic_level: "moyen",
    });
    setActiveStep(0);
    setOpenDialog(true);
  };

  const handleEditSection = (section) => {
    setCurrentSection({
      ...section,
      last_inspection:
        section.lastInspection || new Date().toISOString().split("T")[0],
    });
    setActiveStep(0);
    setOpenDialog(true);
  };

  const handleDeleteSection = async (sectionId) => {
    if (!window.confirm("Êtes-vous sûr de vouloir supprimer cette section ?")) {
      return;
    }

    try {
      await api.delete(`/api/map/sections/${sectionId}`, {
        headers: { "x-auth-token": token },
      });
      enqueueSnackbar("Section supprimée avec succès", { variant: "success" });
      fetchSections();
    } catch (err) {
      console.error("Error deleting section:", err);
      enqueueSnackbar("Erreur lors de la suppression", { variant: "error" });
    }
  };

  const handleNextStep = () => {
    setActiveStep((prev) => prev + 1);
  };

  const handlePrevStep = () => {
    setActiveStep((prev) => prev - 1);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (currentSection.id) {
        await api.put(
          `/api/map/sections/${currentSection.id}`,
          currentSection,
          {
            headers: { "x-auth-token": token },
          }
        );
        enqueueSnackbar("Section mise à jour avec succès", {
          variant: "success",
        });
      } else {
        await api.post("/api/map/sections", currentSection, {
          headers: { "x-auth-token": token },
        });
        enqueueSnackbar("Section créée avec succès", { variant: "success" });
      }
      setOpenDialog(false);
      setActiveStep(0);
      fetchSections();
    } catch (err) {
      console.error("Error saving section:", err);
      enqueueSnackbar("Erreur lors de la sauvegarde", { variant: "error" });
    }
  };

  const getStatusColor = (status) => {
    const statusOption = STATUS_OPTIONS.find((opt) => opt.value === status);
    return statusOption ? statusOption.color : "default";
  };

  const getStatusIcon = (status) => {
    const statusOption = STATUS_OPTIONS.find((opt) => opt.value === status);
    return statusOption ? statusOption.icon : <MapIcon />;
  };

  const getProgressColor = (progress) => {
    if (progress >= 80) return "success";
    if (progress >= 50) return "warning";
    return "error";
  };

  const steps = [
    "Informations de base",
    "Caractéristiques techniques",
    "Localisation",
  ];

  const renderStepContent = (step) => {
    switch (step) {
      case 0:
        return (
          <Grid container spacing={3}>
            <Grid item xs={12}>
              <TextField
                label="Nom de la section *"
                fullWidth
                value={currentSection?.name || ""}
                onChange={(e) =>
                  setCurrentSection({
                    ...currentSection,
                    name: e.target.value,
                  })
                }
                required
                helperText="Ex: RN1 - Antananarivo à Antsirabe"
              />
            </Grid>
            <Grid item xs={12}>
              <TextField
                label="Description"
                fullWidth
                multiline
                rows={3}
                value={currentSection?.description || ""}
                onChange={(e) =>
                  setCurrentSection({
                    ...currentSection,
                    description: e.target.value,
                  })
                }
                helperText="Description détaillée de la section routière"
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <FormControl fullWidth required>
                <InputLabel>Lot</InputLabel>
                <Select
                  value={currentSection?.lot_id || ""}
                  label="Lot"
                  onChange={(e) =>
                    setCurrentSection({
                      ...currentSection,
                      lot_id: e.target.value,
                    })
                  }
                >
                  {lots.map((lot) => (
                    <MenuItem key={lot.id} value={lot.id}>
                      {lot.name}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12} sm={6}>
              <FormControl fullWidth>
                <InputLabel>Type de route</InputLabel>
                <Select
                  value={currentSection?.type || "route_nationale"}
                  label="Type de route"
                  onChange={(e) =>
                    setCurrentSection({
                      ...currentSection,
                      type: e.target.value,
                    })
                  }
                >
                  <MenuItem value="route_nationale">Route Nationale</MenuItem>
                  <MenuItem value="route_regionale">Route Régionale</MenuItem>
                  <MenuItem value="route_departementale">
                    Route Départementale
                  </MenuItem>
                  <MenuItem value="route_communale">Route Communale</MenuItem>
                </Select>
              </FormControl>
            </Grid>
          </Grid>
        );

      case 1:
        return (
          <Grid container spacing={3}>
            <Grid item xs={12} sm={6}>
              <FormControl fullWidth>
                <InputLabel>Statut</InputLabel>
                <Select
                  value={currentSection?.status || "inconnu"}
                  label="Statut"
                  onChange={(e) =>
                    setCurrentSection({
                      ...currentSection,
                      status: e.target.value,
                    })
                  }
                >
                  {STATUS_OPTIONS.map((option) => (
                    <MenuItem key={option.value} value={option.value}>
                      <Box sx={{ display: "flex", alignItems: "center" }}>
                        {option.icon}
                        <Box sx={{ ml: 1 }}>{option.label}</Box>
                      </Box>
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12} sm={6}>
              <FormControl fullWidth>
                <InputLabel>Niveau de trafic</InputLabel>
                <Select
                  value={currentSection?.traffic_level || "moyen"}
                  label="Niveau de trafic"
                  onChange={(e) =>
                    setCurrentSection({
                      ...currentSection,
                      traffic_level: e.target.value,
                    })
                  }
                >
                  <MenuItem value="faible">Faible</MenuItem>
                  <MenuItem value="moyen">Moyen</MenuItem>
                  <MenuItem value="eleve">Élevé</MenuItem>
                  <MenuItem value="tres_eleve">Très élevé</MenuItem>
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12} sm={4}>
              <TextField
                label="Longueur (km) *"
                type="number"
                fullWidth
                value={currentSection?.length_km || 0}
                onChange={(e) =>
                  setCurrentSection({
                    ...currentSection,
                    length_km: parseFloat(e.target.value),
                  })
                }
                InputProps={{
                  startAdornment: (
                    <Straighten sx={{ color: "text.secondary", mr: 1 }} />
                  ),
                }}
              />
            </Grid>
            <Grid item xs={12} sm={4}>
              <TextField
                label="Progression (%)"
                type="number"
                fullWidth
                value={currentSection?.progress_percentage || 0}
                onChange={(e) =>
                  setCurrentSection({
                    ...currentSection,
                    progress_percentage: parseInt(e.target.value),
                  })
                }
                inputProps={{ min: 0, max: 100 }}
                InputProps={{
                  startAdornment: (
                    <Speed sx={{ color: "text.secondary", mr: 1 }} />
                  ),
                }}
              />
            </Grid>
            <Grid item xs={12} sm={4}>
              <TextField
                label="Dernière inspection"
                type="date"
                fullWidth
                value={currentSection?.last_inspection || ""}
                onChange={(e) =>
                  setCurrentSection({
                    ...currentSection,
                    last_inspection: e.target.value,
                  })
                }
                InputProps={{
                  startAdornment: (
                    <CalendarToday sx={{ color: "text.secondary", mr: 1 }} />
                  ),
                }}
              />
            </Grid>
          </Grid>
        );

      case 2:
        return (
          <Grid container spacing={3}>
            <Grid item xs={12}>
              <FormControl fullWidth>
                <InputLabel>Région *</InputLabel>
                <Select
                  value={currentSection?.region || ""}
                  label="Région"
                  onChange={(e) =>
                    setCurrentSection({
                      ...currentSection,
                      region: e.target.value,
                    })
                  }
                  required
                >
                  {REGIONS_MADAGASCAR.map((region) => (
                    <MenuItem key={region} value={region}>
                      <Box sx={{ display: "flex", alignItems: "center" }}>
                        <Public sx={{ mr: 1, color: "text.secondary" }} />
                        {region}
                      </Box>
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12}>
              <Alert severity="info" sx={{ mb: 2 }}>
                Format des coordonnées : {"{"}"longitude": number, "latitude":
                number{"}"}
              </Alert>
              <TextField
                label="Coordonnées (JSON)"
                fullWidth
                multiline
                rows={4}
                placeholder={`{\n  "longitude": 47.5079,\n  "latitude": -18.8792\n}`}
                value={
                  currentSection?.coordinates
                    ? JSON.stringify(currentSection.coordinates, null, 2)
                    : ""
                }
                onChange={(e) => {
                  try {
                    const coords = e.target.value
                      ? JSON.parse(e.target.value)
                      : null;
                    setCurrentSection({
                      ...currentSection,
                      coordinates: coords,
                    });
                  } catch (err) {
                    // Ignorer les erreurs de parsing pendant la saisie
                  }
                }}
                InputProps={{
                  startAdornment: (
                    <LocationOn
                      sx={{
                        color: "text.secondary",
                        mr: 1,
                        alignSelf: "flex-start",
                        mt: 1,
                      }}
                    />
                  ),
                }}
              />
            </Grid>
            {currentSection?.coordinates && (
              <Grid item xs={12}>
                <Alert severity="success">
                  Coordonnées valides : {currentSection.coordinates.longitude},{" "}
                  {currentSection.coordinates.latitude}
                </Alert>
              </Grid>
            )}
          </Grid>
        );

      default:
        return null;
    }
  };

  const StatCard = ({ icon, title, value, subtitle, color = "primary" }) => (
    <Card
      sx={{
        height: "100%",
        transition: "all 0.3s ease",
        "&:hover": { transform: "translateY(-4px)", boxShadow: 3 },
      }}
    >
      <CardContent>
        <Box sx={{ display: "flex", alignItems: "center", mb: 2 }}>
          <Avatar sx={{ bgcolor: `${color}.main`, mr: 2 }}>{icon}</Avatar>
          <Box>
            <Typography color="textSecondary" variant="overline">
              {title}
            </Typography>
            <Typography variant="h5" component="div">
              {value}
            </Typography>
            {subtitle && (
              <Typography variant="body2" color="textSecondary">
                {subtitle}
              </Typography>
            )}
          </Box>
        </Box>
      </CardContent>
    </Card>
  );

  return (
    <Box sx={{ p: 3 }}>
      {/* En-tête avec statistiques */}
      <Box sx={{ mb: 4 }}>
        <Typography
          variant="h4"
          gutterBottom
          sx={{
            fontWeight: "bold",
            background: "linear-gradient(45deg, #1976d2, #00bcd4)",
            backgroundClip: "text",
            WebkitBackgroundClip: "text",
            color: "transparent",
          }}
        >
          🗺️ Gestion de la Carte
        </Typography>
        <Typography variant="body1" color="text.secondary" sx={{ mb: 3 }}>
          Gérez les sections routières et visualisez les statistiques en temps
          réel
        </Typography>

        <Grid container spacing={3} sx={{ mb: 4 }}>
          <Grid item xs={12} sm={6} md={3}>
            <StatCard
              icon={<MapIcon />}
              title="Sections Total"
              value={sections.length}
              subtitle="Routes gérées"
              color="primary"
            />
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <StatCard
              icon={<CheckCircle />}
              title="En Bon État"
              value={
                sections.filter(
                  (s) => s.status === "bon" || s.status === "excellent"
                ).length
              }
              subtitle="Sections optimales"
              color="success"
            />
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <StatCard
              icon={<Construction />}
              title="À Surveiller"
              value={
                sections.filter(
                  (s) => s.status === "mauvais" || s.status === "critique"
                ).length
              }
              subtitle="Nécessitent attention"
              color="error"
            />
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <StatCard
              icon={<Straighten />}
              title="Longueur Totale"
              value={`${sections
                .reduce((sum, section) => sum + (section.length || 0), 0)
                .toFixed(1)} km`}
              subtitle="Réseau routier"
              color="info"
            />
          </Grid>
        </Grid>
      </Box>

      {/* Section principale */}
      <Grid container spacing={3}>
        <Grid item xs={12}>
          <Card elevation={3}>
            <CardContent sx={{ p: 0 }}>
              <Box sx={{ p: 3, borderBottom: 1, borderColor: "divider" }}>
                <Box
                  sx={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                  }}
                >
                  <Typography variant="h6" sx={{ fontWeight: "bold" }}>
                    Sections Routières
                  </Typography>
                  <Button
                    variant="contained"
                    startIcon={<Add />}
                    onClick={handleCreateSection}
                    size="large"
                  >
                    Nouvelle Section
                  </Button>
                </Box>
              </Box>

              <TableContainer>
                <Table>
                  <TableHead>
                    <TableRow sx={{ backgroundColor: "grey.50" }}>
                      <TableCell sx={{ fontWeight: "bold" }}>Section</TableCell>
                      <TableCell sx={{ fontWeight: "bold" }}>Région</TableCell>
                      <TableCell sx={{ fontWeight: "bold" }}>Statut</TableCell>
                      <TableCell sx={{ fontWeight: "bold" }}>
                        Longueur
                      </TableCell>
                      <TableCell sx={{ fontWeight: "bold" }}>
                        Progression
                      </TableCell>
                      <TableCell sx={{ fontWeight: "bold" }}>
                        Dernière Inspection
                      </TableCell>
                      <TableCell sx={{ fontWeight: "bold" }}>Actions</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {sections.map((section) => (
                      <TableRow
                        key={section.id}
                        sx={{
                          "&:hover": { backgroundColor: "action.hover" },
                          transition: "background-color 0.2s",
                        }}
                      >
                        <TableCell>
                          <Box>
                            <Typography
                              variant="subtitle2"
                              sx={{ fontWeight: "bold" }}
                            >
                              {section.name}
                            </Typography>
                            <Typography variant="body2" color="text.secondary">
                              {section.lot}
                            </Typography>
                          </Box>
                        </TableCell>
                        <TableCell>
                          <Chip
                            label={section.region}
                            size="small"
                            variant="outlined"
                          />
                        </TableCell>
                        <TableCell>
                          <Chip
                            icon={getStatusIcon(section.status)}
                            label={
                              STATUS_OPTIONS.find(
                                (opt) => opt.value === section.status
                              )?.label || section.status
                            }
                            color={getStatusColor(section.status)}
                            size="small"
                            variant="filled"
                          />
                        </TableCell>
                        <TableCell>
                          <Box sx={{ display: "flex", alignItems: "center" }}>
                            <Straighten
                              sx={{
                                color: "text.secondary",
                                mr: 1,
                                fontSize: 20,
                              }}
                            />
                            <Typography variant="body2">
                              {section.length} km
                            </Typography>
                          </Box>
                        </TableCell>
                        <TableCell sx={{ minWidth: 150 }}>
                          <Box sx={{ display: "flex", alignItems: "center" }}>
                            <Box sx={{ width: "100%", mr: 1 }}>
                              <LinearProgress
                                variant="determinate"
                                value={section.progress}
                                color={getProgressColor(section.progress)}
                                sx={{ height: 8, borderRadius: 4 }}
                              />
                            </Box>
                            <Typography variant="body2" sx={{ minWidth: 35 }}>
                              {section.progress}%
                            </Typography>
                          </Box>
                        </TableCell>
                        <TableCell>
                          <Typography variant="body2" color="text.secondary">
                            {section.lastInspection
                              ? new Date(
                                  section.lastInspection
                                ).toLocaleDateString()
                              : "N/A"}
                          </Typography>
                        </TableCell>
                        <TableCell>
                          <Box sx={{ display: "flex", gap: 1 }}>
                            <Tooltip title="Modifier">
                              <IconButton
                                size="small"
                                onClick={() => handleEditSection(section)}
                                color="primary"
                              >
                                <Edit />
                              </IconButton>
                            </Tooltip>
                            <Tooltip title="Supprimer">
                              <IconButton
                                size="small"
                                onClick={() => handleDeleteSection(section.id)}
                                color="error"
                              >
                                <Delete />
                              </IconButton>
                            </Tooltip>
                          </Box>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TableContainer>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Dialog amélioré avec stepper */}
      <Dialog
        open={openDialog}
        onClose={() => {
          setOpenDialog(false);
          setActiveStep(0);
        }}
        maxWidth="md"
        fullWidth
        PaperProps={{
          sx: { borderRadius: 2 },
        }}
      >
        <DialogTitle
          sx={{
            borderBottom: 1,
            borderColor: "divider",
            bgcolor: "primary.main",
            color: "white",
          }}
        >
          <Typography variant="h6" sx={{ fontWeight: "bold" }}>
            {currentSection?.id
              ? "✏️ Modifier la Section"
              : "🆕 Nouvelle Section Routière"}
          </Typography>
        </DialogTitle>

        <Stepper activeStep={activeStep} sx={{ p: 3 }}>
          {steps.map((label) => (
            <Step key={label}>
              <StepLabel>{label}</StepLabel>
            </Step>
          ))}
        </Stepper>

        <DialogContent sx={{ p: 3 }}>
          <form onSubmit={handleSubmit}>{renderStepContent(activeStep)}</form>
        </DialogContent>

        <DialogActions sx={{ p: 3, borderTop: 1, borderColor: "divider" }}>
          <Box
            sx={{ flex: 1, display: "flex", justifyContent: "space-between" }}
          >
            <Button
              onClick={handlePrevStep}
              disabled={activeStep === 0}
              variant="outlined"
            >
              Précédent
            </Button>

            <Box sx={{ display: "flex", gap: 1 }}>
              <Button
                onClick={() => {
                  setOpenDialog(false);
                  setActiveStep(0);
                }}
                variant="outlined"
              >
                Annuler
              </Button>

              {activeStep === steps.length - 1 ? (
                <Button onClick={handleSubmit} variant="contained" size="large">
                  {currentSection?.id ? "Mettre à jour" : "Créer la Section"}
                </Button>
              ) : (
                <Button onClick={handleNextStep} variant="contained">
                  Suivant
                </Button>
              )}
            </Box>
          </Box>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default MapManagement;
