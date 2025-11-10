import React, { useState, useEffect, useRef, useCallback } from "react";
import {
  Box,
  Paper,
  Typography,
  Grid,
  Card,
  CardContent,
  Chip,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Switch,
  FormControlLabel,
  Alert,
  CircularProgress,
  Tabs,
  Tab,
  IconButton,
} from "@mui/material";
import { styled } from "@mui/material/styles";
import {
  FilterList as FilterIcon,
  Layers as LayersIcon,
  Construction as ConstructionIcon,
  CheckCircle as VerifiedIcon,
  Visibility as MonitoredIcon,
  ZoomIn,
  ZoomOut,
  MyLocation,
  Close,
} from "@mui/icons-material";

// Import correct de MapLibre
import Map, {
  Marker,
  Popup,
  NavigationControl,
  ScaleControl,
  FullscreenControl,
} from "@vis.gl/react-maplibre";
import "maplibre-gl/dist/maplibre-gl.css";

// Styles personnalisés
const MapContainer = styled(Box)(({ theme }) => ({
  height: "600px",
  width: "100%",
  borderRadius: theme.shape.borderRadius,
  overflow: "hidden",
  boxShadow: theme.shadows[3],
  position: "relative",
}));

const MapWrapper = styled("div")({
  width: "100%",
  height: "100%",
  position: "relative",
});

const ControlPanel = styled(Paper)(({ theme }) => ({
  position: "absolute",
  top: 80,
  right: 10,
  zIndex: 500,
  padding: theme.spacing(2),
  minWidth: 280,
  maxWidth: 300,
  backgroundColor: "rgba(255, 255, 255, 0.98)",
  maxHeight: "calc(100% - 100px)",
  overflowY: "auto",
  border: `1px solid ${theme.palette.divider}`,
}));

const Legend = styled(Paper)(({ theme }) => ({
  position: "absolute",
  bottom: 10,
  left: 10,
  zIndex: 500,
  padding: theme.spacing(1.5),
  backgroundColor: "rgba(255, 255, 255, 0.98)",
  minWidth: 180,
  border: `1px solid ${theme.palette.divider}`,
}));

const MapControls = styled(Box)(({ theme }) => ({
  position: "absolute",
  top: 10,
  left: 10,
  zIndex: 500,
  display: "flex",
  flexDirection: "column",
  gap: theme.spacing(1),
}));

const FloatingFilterButton = styled(IconButton)(({ theme }) => ({
  position: "absolute",
  top: 10,
  right: 50,
  zIndex: 500,
  backgroundColor: "white",
  boxShadow: theme.shadows[3],
  "&:hover": {
    backgroundColor: theme.palette.grey[100],
  },
}));

const StatusIndicator = styled(Box)(({ status, theme }) => ({
  width: 12,
  height: 12,
  borderRadius: "50%",
  marginRight: theme.spacing(1),
  border: "2px solid white",
  boxShadow: "0 1px 2px rgba(0,0,0,0.2)",
  backgroundColor:
    status === "surveillé"
      ? theme.palette.info.main
      : status === "travaux_en_cours"
      ? theme.palette.warning.main
      : status === "vérifié"
      ? theme.palette.success.main
      : theme.palette.grey[400],
}));

// Configuration de la carte
const initialViewState = {
  longitude: 47.5079,
  latitude: -18.8792,
  zoom: 6,
};

// Style de carte simplifié avec seulement OpenStreetMap
const mapStyle = {
  version: 8,
  sources: {
    osm: {
      type: "raster",
      tiles: ["https://a.tile.openstreetmap.org/{z}/{x}/{y}.png"],
      tileSize: 256,
      attribution: "© OpenStreetMap Contributors",
    },
  },
  layers: [
    {
      id: "osm",
      type: "raster",
      source: "osm",
      minzoom: 0,
      maxzoom: 22,
    },
  ],
};

// Données simulées
const mockSections = [
  {
    id: 1,
    name: "RN1 - Antananarivo à Antsirabe",
    type: "surveillé",
    region: "Analamanga",
    performance: "élevée",
    coordinates: { longitude: 47.5079, latitude: -18.8792 },
    length: 45.2,
    lastInspection: "2024-01-15",
    progress: 85,
    travauxType: null,
    description: "Section sous surveillance continue - Bon état",
  },
  {
    id: 2,
    name: "RN2 - Toamasina Côte Est",
    type: "surveillé",
    region: "Atsinanana",
    performance: "moyenne",
    coordinates: { longitude: 49.3958, latitude: -18.1443 },
    length: 32.7,
    lastInspection: "2024-01-10",
    progress: 60,
    travauxType: null,
    description: "Surveillance renforcée - État moyen",
  },
  {
    id: 3,
    name: "RN7 - Fianarantsoa Réhabilitation",
    type: "travaux_en_cours",
    region: "Haute Matsiatra",
    performance: "faible",
    coordinates: { longitude: 47.0857, latitude: -21.4536 },
    length: 28.9,
    lastInspection: "2024-01-08",
    progress: 30,
    travauxType: "réhabilitation",
    description: "Travaux de réhabilitation en cours",
  },
  {
    id: 4,
    name: "RN4 - Mahajanga Entretien",
    type: "travaux_en_cours",
    region: "Boeny",
    performance: "moyenne",
    coordinates: { longitude: 46.3167, latitude: -15.7167 },
    length: 52.1,
    lastInspection: "2024-01-12",
    progress: 90,
    travauxType: "entretien",
    description: "Opérations d'entretien routier",
  },
  {
    id: 5,
    name: "RN6 - Ambanja",
    type: "vérifié",
    region: "Diana",
    performance: "élevée",
    coordinates: { longitude: 48.45, latitude: -13.6833 },
    length: 25.3,
    lastInspection: "2024-01-20",
    progress: 95,
    travauxType: null,
    description: "Section vérifiée - Performance excellente",
  },
];

// Composant de marqueur personnalisé
const CustomMarker = ({ type, onClick }) => {
  const getMarkerColor = () => {
    switch (type) {
      case "surveillé":
        return "#2196f3";
      case "travaux_en_cours":
        return "#ff9800";
      case "vérifié":
        return "#4caf50";
      default:
        return "#9e9e9e";
    }
  };

  const getMarkerIcon = () => {
    switch (type) {
      case "surveillé":
        return "👁️";
      case "travaux_en_cours":
        return "🔧";
      case "vérifié":
        return "✅";
      default:
        return "📍";
    }
  };

  return (
    <Box
      onClick={onClick}
      sx={{
        cursor: "pointer",
        background: getMarkerColor(),
        width: 28,
        height: 28,
        borderRadius: "50%",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        color: "white",
        fontSize: "14px",
        fontWeight: "bold",
        border: "2px solid white",
        boxShadow: "0 2px 4px rgba(0,0,0,0.3)",
        transform: "translate(-50%, -50%)",
        "&:hover": {
          transform: "translate(-50%, -50%) scale(1.1)",
        },
      }}
    >
      {getMarkerIcon()}
    </Box>
  );
};

const InteractiveMap = () => {
  const [sections, setSections] = useState([]);
  const [filteredSections, setFilteredSections] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [activeTab, setActiveTab] = useState(0);
  const [selectedSection, setSelectedSection] = useState(null);
  const [viewState, setViewState] = useState(initialViewState);
  const [mapLoaded, setMapLoaded] = useState(false);
  const [filtersOpen, setFiltersOpen] = useState(false);
  const mapRef = useRef();

  const [filters, setFilters] = useState({
    region: "toutes",
    type: "tous",
    travauxType: "tous",
    performance: "tous",
    showMarkers: true,
  });

  const regions = [
    "toutes",
    "Analamanga",
    "Atsinanana",
    "Haute Matsiatra",
    "Boeny",
    "Diana",
    "Vakinankaratra",
    "Itasy",
    "Anosy",
  ];
  const types = ["tous", "surveillé", "travaux_en_cours", "vérifié"];
  const travauxTypes = ["tous", "réhabilitation", "entretien", "construction"];
  const performances = ["tous", "élevée", "moyenne", "faible"];

  useEffect(() => {
    const loadSections = async () => {
      try {
        setLoading(true);
        setTimeout(() => {
          setSections(mockSections);
          setFilteredSections(mockSections);
          setLoading(false);
        }, 1000);
      } catch (err) {
        setError("Erreur lors du chargement des données cartographiques");
        setLoading(false);
      }
    };

    loadSections();
  }, []);

  useEffect(() => {
    let filtered = sections;

    if (filters.region !== "toutes") {
      filtered = filtered.filter(
        (section) => section.region === filters.region
      );
    }

    if (filters.type !== "tous") {
      filtered = filtered.filter((section) => section.type === filters.type);
    }

    if (filters.travauxType !== "tous") {
      filtered = filtered.filter(
        (section) => section.travauxType === filters.travauxType
      );
    }

    if (filters.performance !== "tous") {
      filtered = filtered.filter(
        (section) => section.performance === filters.performance
      );
    }

    setFilteredSections(filtered);
  }, [filters, sections]);

  const handleFilterChange = (filterName, value) => {
    setFilters((prev) => ({
      ...prev,
      [filterName]: value,
    }));
  };

  const handleTabChange = (event, newValue) => {
    setActiveTab(newValue);
    switch (newValue) {
      case 0:
        setFilters((prev) => ({ ...prev, type: "tous" }));
        break;
      case 1:
        setFilters((prev) => ({ ...prev, type: "surveillé" }));
        break;
      case 2:
        setFilters((prev) => ({ ...prev, type: "travaux_en_cours" }));
        break;
      case 3:
        setFilters((prev) => ({ ...prev, type: "vérifié" }));
        break;
      default:
        break;
    }
  };

  const getPerformanceColor = (performance) => {
    switch (performance) {
      case "élevée":
        return "success";
      case "moyenne":
        return "warning";
      case "faible":
        return "error";
      default:
        return "default";
    }
  };

  const getTypeColor = (type) => {
    switch (type) {
      case "surveillé":
        return "info";
      case "travaux_en_cours":
        return "warning";
      case "vérifié":
        return "success";
      default:
        return "default";
    }
  };

  const handleZoomIn = () => {
    setViewState((prev) => ({
      ...prev,
      zoom: Math.min(prev.zoom + 1, 18),
    }));
  };

  const handleZoomOut = () => {
    setViewState((prev) => ({
      ...prev,
      zoom: Math.max(prev.zoom - 1, 1),
    }));
  };

  const handleResetView = () => {
    setViewState(initialViewState);
  };

  const handleMapLoad = () => {
    setMapLoaded(true);
  };

  // Utilisation de useCallback pour éviter les re-renders infinis
  const handleMove = useCallback(
    (newViewState) => {
      // Only update if viewState actually changed (e.g., shallow comparison)
      if (
        newViewState.latitude !== viewState.latitude ||
        newViewState.longitude !== viewState.longitude ||
        newViewState.zoom !== viewState.zoom
      ) {
        setViewState(newViewState);
      }
    },
    [viewState]
  ); // Only re-create if viewState itself changes

  const toggleFilters = () => {
    setFiltersOpen(!filtersOpen);
  };

  if (loading) {
    return (
      <Box
        display="flex"
        justifyContent="center"
        alignItems="center"
        height={400}
      >
        <CircularProgress />
        <Typography variant="body1" sx={{ ml: 2 }}>
          Chargement de la carte...
        </Typography>
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

  return (
    <Box sx={{ p: 3 }}>
      <Typography variant="h4" component="h1" gutterBottom>
        Carte Interactive GIS - Surveillance Routière
      </Typography>
      <Typography variant="body1" color="text.secondary" sx={{ mb: 4 }}>
        Visualisation des sections surveillées, travaux en cours et résultats
        vérifiés
      </Typography>

      <Paper sx={{ mb: 3 }}>
        <Tabs value={activeTab} onChange={handleTabChange} centered>
          <Tab icon={<LayersIcon />} label="Toutes les sections" />
          <Tab icon={<MonitoredIcon />} label="Sections surveillées" />
          <Tab icon={<ConstructionIcon />} label="Travaux en cours" />
          <Tab icon={<VerifiedIcon />} label="Résultats vérifiés" />
        </Tabs>
      </Paper>

      <Grid container spacing={3}>
        <Grid item xs={12} md={9}>
          <MapContainer>
            <MapWrapper>
              <Map
                ref={mapRef}
                initialViewState={initialViewState}
                viewState={viewState}
                onMove={handleMove}
                onLoad={handleMapLoad}
                mapStyle={mapStyle}
                style={{
                  width: 1150,
                  height: "100%",
                  borderRadius: "8px",
                }}
                dragPan={true}
                scrollZoom={true}
                doubleClickZoom={true}
                touchZoomRotate={true}
              >
                <NavigationControl position="top-right" />
                <ScaleControl />
                <FullscreenControl />

                {/* Marqueurs des sections */}
                {filters.showMarkers &&
                  filteredSections.map((section) => (
                    <Marker
                      key={section.id}
                      longitude={section.coordinates.longitude}
                      latitude={section.coordinates.latitude}
                      onClick={() => setSelectedSection(section)}
                    >
                      <CustomMarker type={section.type} />
                    </Marker>
                  ))}

                {selectedSection && (
                  <Popup
                    longitude={selectedSection.coordinates.longitude}
                    latitude={selectedSection.coordinates.latitude}
                    onClose={() => setSelectedSection(null)}
                    closeButton={true}
                    closeOnClick={false}
                    anchor="top"
                  >
                    <Box sx={{ minWidth: 250, maxWidth: 300 }}>
                      <Typography variant="h6" gutterBottom>
                        {selectedSection.name}
                      </Typography>
                      <Typography variant="body2" gutterBottom>
                        {selectedSection.description}
                      </Typography>
                      <Box
                        sx={{
                          display: "flex",
                          gap: 1,
                          flexWrap: "wrap",
                          my: 1,
                        }}
                      >
                        <Chip
                          label={selectedSection.type.replace("_", " ")}
                          color={getTypeColor(selectedSection.type)}
                          size="small"
                        />
                        <Chip
                          label={`Performance: ${selectedSection.performance}`}
                          color={getPerformanceColor(
                            selectedSection.performance
                          )}
                          size="small"
                        />
                        {selectedSection.travauxType && (
                          <Chip
                            label={`Travaux: ${selectedSection.travauxType}`}
                            color="secondary"
                            size="small"
                          />
                        )}
                      </Box>
                      <Typography variant="body2" gutterBottom>
                        <strong>Région:</strong> {selectedSection.region}
                      </Typography>
                      <Typography variant="body2" gutterBottom>
                        <strong>Longueur:</strong> {selectedSection.length} km
                      </Typography>
                      <Typography variant="body2" gutterBottom>
                        <strong>Dernière inspection:</strong>{" "}
                        {selectedSection.lastInspection}
                      </Typography>
                      <Typography variant="body2">
                        <strong>Progression:</strong> {selectedSection.progress}
                        %
                      </Typography>
                    </Box>
                  </Popup>
                )}
              </Map>

              <FloatingFilterButton onClick={toggleFilters}>
                <FilterIcon />
              </FloatingFilterButton>

              {filtersOpen && (
                <ControlPanel elevation={3}>
                  <Box
                    sx={{
                      display: "flex",
                      justifyContent: "space-between",
                      alignItems: "center",
                      mb: 2,
                    }}
                  >
                    <Typography
                      variant="h6"
                      sx={{ display: "flex", alignItems: "center" }}
                    >
                      <FilterIcon sx={{ mr: 1 }} />
                      Filtres
                    </Typography>
                    <IconButton size="small" onClick={toggleFilters}>
                      <Close />
                    </IconButton>
                  </Box>

                  <FormControl fullWidth size="small" sx={{ mb: 2 }}>
                    <InputLabel>Région</InputLabel>
                    <Select
                      value={filters.region}
                      label="Région"
                      onChange={(e) =>
                        handleFilterChange("region", e.target.value)
                      }
                    >
                      {regions.map((region) => (
                        <MenuItem key={region} value={region}>
                          {region === "toutes" ? "Toutes les régions" : region}
                        </MenuItem>
                      ))}
                    </Select>
                  </FormControl>

                  <FormControl fullWidth size="small" sx={{ mb: 2 }}>
                    <InputLabel>Type de section</InputLabel>
                    <Select
                      value={filters.type}
                      label="Type de section"
                      onChange={(e) =>
                        handleFilterChange("type", e.target.value)
                      }
                    >
                      {types.map((type) => (
                        <MenuItem key={type} value={type}>
                          {type === "tous"
                            ? "Tous les types"
                            : type.replace("_", " ")}
                        </MenuItem>
                      ))}
                    </Select>
                  </FormControl>

                  <FormControl fullWidth size="small" sx={{ mb: 2 }}>
                    <InputLabel>Type de travaux</InputLabel>
                    <Select
                      value={filters.travauxType}
                      label="Type de travaux"
                      onChange={(e) =>
                        handleFilterChange("travauxType", e.target.value)
                      }
                    >
                      {travauxTypes.map((type) => (
                        <MenuItem key={type} value={type}>
                          {type === "tous" ? "Tous les types" : type}
                        </MenuItem>
                      ))}
                    </Select>
                  </FormControl>

                  <FormControl fullWidth size="small" sx={{ mb: 2 }}>
                    <InputLabel>Niveau de performance</InputLabel>
                    <Select
                      value={filters.performance}
                      label="Niveau de performance"
                      onChange={(e) =>
                        handleFilterChange("performance", e.target.value)
                      }
                    >
                      {performances.map((perf) => (
                        <MenuItem key={perf} value={perf}>
                          {perf === "tous" ? "Tous les niveaux" : perf}
                        </MenuItem>
                      ))}
                    </Select>
                  </FormControl>

                  <FormControlLabel
                    control={
                      <Switch
                        checked={filters.showMarkers}
                        onChange={(e) =>
                          handleFilterChange("showMarkers", e.target.checked)
                        }
                      />
                    }
                    label="Afficher les marqueurs"
                  />
                </ControlPanel>
              )}

              <MapControls>
                <Paper elevation={3}>
                  <Box sx={{ display: "flex", flexDirection: "column" }}>
                    <IconButton onClick={handleZoomIn} size="small">
                      <ZoomIn />
                    </IconButton>
                    <IconButton onClick={handleZoomOut} size="small">
                      <ZoomOut />
                    </IconButton>
                    <IconButton onClick={handleResetView} size="small">
                      <MyLocation />
                    </IconButton>
                  </Box>
                </Paper>
              </MapControls>

              <Legend elevation={3}>
                <Typography variant="subtitle2" gutterBottom>
                  Légende
                </Typography>
                <Typography
                  variant="caption"
                  display="block"
                  gutterBottom
                  sx={{ mt: 1 }}
                >
                  Types de sections:
                </Typography>
                <Box sx={{ display: "flex", alignItems: "center", mb: 1 }}>
                  <StatusIndicator status="surveillé" />
                  <Typography variant="body2" fontSize="0.75rem">
                    Surveillé
                  </Typography>
                </Box>
                <Box sx={{ display: "flex", alignItems: "center", mb: 1 }}>
                  <StatusIndicator status="travaux_en_cours" />
                  <Typography variant="body2" fontSize="0.75rem">
                    Travaux
                  </Typography>
                </Box>
                <Box sx={{ display: "flex", alignItems: "center", mb: 1 }}>
                  <StatusIndicator status="vérifié" />
                  <Typography variant="body2" fontSize="0.75rem">
                    Vérifié
                  </Typography>
                </Box>
              </Legend>
            </MapWrapper>
          </MapContainer>
        </Grid>

        <Grid item xs={12} md={3}>
          <Paper elevation={3} sx={{ p: 2, mb: 2 }}>
            <Typography variant="h6" gutterBottom>
              Vue d'ensemble
            </Typography>
            <Box sx={{ mb: 2 }}>
              <Typography variant="body2" color="text.secondary">
                Sections affichées: {filteredSections.length}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Longueur totale:{" "}
                {filteredSections
                  .reduce((sum, section) => sum + section.length, 0)
                  .toFixed(1)}{" "}
                km
              </Typography>
            </Box>
            <Typography variant="body2" color="text.secondary">
              Surveillées:{" "}
              {filteredSections.filter((s) => s.type === "surveillé").length}
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Travaux en cours:{" "}
              {
                filteredSections.filter((s) => s.type === "travaux_en_cours")
                  .length
              }
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Vérifiées:{" "}
              {filteredSections.filter((s) => s.type === "vérifié").length}
            </Typography>
          </Paper>

          <Paper elevation={3} sx={{ p: 2 }}>
            <Typography variant="h6" gutterBottom>
              Sections Récentes
            </Typography>
            {filteredSections.slice(0, 4).map((section) => (
              <Card key={section.id} sx={{ mb: 1 }}>
                <CardContent sx={{ p: 1.5 }}>
                  <Typography variant="body2" gutterBottom noWrap>
                    {section.name}
                  </Typography>
                  <Box sx={{ display: "flex", gap: 0.5, flexWrap: "wrap" }}>
                    <Chip
                      label={section.type.replace("_", " ")}
                      color={getTypeColor(section.type)}
                      size="small"
                    />
                    <Chip
                      label={section.performance}
                      color={getPerformanceColor(section.performance)}
                      size="small"
                    />
                  </Box>
                </CardContent>
              </Card>
            ))}
          </Paper>
        </Grid>
      </Grid>
    </Box>
  );
};

export default InteractiveMap;
