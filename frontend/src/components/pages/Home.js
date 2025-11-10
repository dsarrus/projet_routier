import React, { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
  Box,
  Typography,
  Grid,
  Card,
  CardContent,
  Button,
  Chip,
  CircularProgress,
  Alert,
  Container,
  alpha,
  useTheme,
  CardActionArea,
  Stack,
} from "@mui/material";
import { styled } from "@mui/material/styles";
import {
  Map as MapIcon,
  Assessment,
  Article,
  Group,
  ContactMail,
  Phone,
  Email,
  LocationOn,
  ArrowForward,
  TrendingUp,
  DirectionsCar,
  Public,
  Engineering,
} from "@mui/icons-material";
import api from "../../services/api";

// Composants stylisés
const HeroSection = styled(Box)(({ theme }) => ({
  background: `linear-gradient(135deg, ${theme.palette.primary.main} 0%, ${theme.palette.primary.dark} 100%)`,
  color: "white",
  padding: theme.spacing(12, 0),
  textAlign: "center",
  position: "relative",
  overflow: "hidden",
  "&::before": {
    content: '""',
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    background: "url('/api/placeholder/1200/600') center/cover",
    opacity: 0.1,
  },
}));

const FeatureCard = styled(Card)(({ theme }) => ({
  height: "100%",
  display: "flex",
  flexDirection: "column",
  alignItems: "center",
  textAlign: "center",
  padding: theme.spacing(4),
  transition: "all 0.3s ease-in-out",
  border: `1px solid ${alpha(theme.palette.primary.main, 0.1)}`,
  "&:hover": {
    transform: "translateY(-8px)",
    boxShadow: theme.shadows[8],
    border: `1px solid ${alpha(theme.palette.primary.main, 0.3)}`,
  },
}));

const Section = styled(Box)(({ theme }) => ({
  padding: theme.spacing(8, 0),
}));

const StatusChip = styled(Chip)(({ theme, status }) => {
  const statusColors = {
    actif: theme.palette.success,
    "en travaux": theme.palette.warning,
    "en attente": theme.palette.error,
    default: theme.palette.grey,
  };

  const color = statusColors[status] || statusColors.default;

  return {
    marginTop: theme.spacing(1),
    backgroundColor: color.light,
    color: color.contrastText,
    fontWeight: "bold",
  };
});

const LotCard = styled(Card)(({ theme }) => ({
  height: "100%",
  display: "flex",
  flexDirection: "column",
  transition: "all 0.3s ease-in-out",
  border: `1px solid ${theme.palette.divider}`,
  "&:hover": {
    transform: "translateY(-4px)",
    boxShadow: theme.shadows[8],
  },
}));

const StatsCard = styled(Card)(({ theme }) => ({
  padding: theme.spacing(3),
  textAlign: "center",
  background: `linear-gradient(135deg, ${alpha(
    theme.palette.primary.main,
    0.1
  )} 0%, ${alpha(theme.palette.secondary.main, 0.1)} 100%)`,
}));

const ContactItem = styled(Box)(({ theme }) => ({
  display: "flex",
  alignItems: "flex-start",
  marginBottom: theme.spacing(3),
}));

const Home = () => {
  const [lots, setLots] = useState([]);
  const [stats, setStats] = useState(null);
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(true);
  const theme = useTheme();
  const navigate = useNavigate();

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [lotsRes] = await Promise.all([api.get("/api/lots")]);

      setLots(lotsRes.data);

      // Stats par défaut en attendant l'API
      setStats({
        totalKm: lotsRes.data.reduce(
          (sum, lot) => sum + (lot.length_km || 0),
          0
        ),
        activeLots: lotsRes.data.filter((lot) => lot.status === "actif").length,
        completedReports: 24,
        teamMembers: 8,
      });

      setLoading(false);
    } catch (err) {
      setLoading(false);
      setError("Erreur lors du chargement des données");
      console.error("Erreur:", err);
    }
  };

  const features = [
    {
      icon: <MapIcon sx={{ fontSize: 48 }} />,
      title: "Carte Interactive",
      description:
        "Visualisez l'ensemble du réseau routier sous surveillance avec nos cartes dynamiques et interactives",
      path: "/carte",
      color: theme.palette.primary.main,
    },
    {
      icon: <Assessment sx={{ fontSize: 48 }} />,
      title: "Suivi & Rapports",
      description:
        "Accédez aux dashboards actualisés et aux rapports détaillés d'avancement des travaux",
      path: "/rapports",
      color: theme.palette.secondary.main,
    },
    {
      icon: <Article sx={{ fontSize: 48 }} />,
      title: "Actualités",
      description:
        "Restez informé des dernières nouvelles et développements du projet",
      path: "/actualites",
      color: theme.palette.info.main,
    },
  ];

  // Fonction pour naviguer vers la carte
  const handleExploreMap = () => {
    navigate("/carte");
  };

  // Fonction pour naviguer vers les rapports
  const handleViewReports = () => {
    navigate("/rapports");
  };

  if (loading) {
    return (
      <Box
        display="flex"
        justifyContent="center"
        alignItems="center"
        minHeight="60vh"
      >
        <Stack alignItems="center" spacing={2}>
          <CircularProgress size={60} />
          <Typography variant="h6" color="text.secondary">
            Chargement des données...
          </Typography>
        </Stack>
      </Box>
    );
  }

  if (error) {
    return (
      <Container maxWidth="lg" sx={{ my: 4 }}>
        <Alert
          severity="error"
          action={
            <Button color="inherit" size="small" onClick={fetchData}>
              Réessayer
            </Button>
          }
        >
          {error}
        </Alert>
      </Container>
    );
  }

  return (
    <Box sx={{ bgcolor: "background.default" }}>
      {/* Section Hero */}
      <HeroSection>
        <Container maxWidth="lg" sx={{ position: "relative", zIndex: 1 }}>
          <Typography
            variant="h2"
            component="h1"
            gutterBottom
            fontWeight="bold"
            sx={{
              fontSize: { xs: "2.5rem", md: "3.5rem" },
              textShadow: "2px 2px 4px rgba(0,0,0,0.3)",
            }}
          >
            MSV Madagascar
          </Typography>
          <Typography
            variant="h4"
            component="h2"
            gutterBottom
            sx={{
              fontSize: { xs: "1.5rem", md: "2.125rem" },
              mb: 3,
              opacity: 0.95,
            }}
          >
            Suivi Intelligent du Réseau Routier
          </Typography>
          <Typography
            variant="h6"
            component="p"
            sx={{
              mb: 4,
              opacity: 0.9,
              maxWidth: "600px",
              mx: "auto",
            }}
          >
            Transparence, Résultats, Impact - Un système innovant pour le suivi
            et la vérification des infrastructures routières
          </Typography>
          <Stack
            direction={{ xs: "column", sm: "row" }}
            spacing={2}
            justifyContent="center"
            sx={{ mt: 4 }}
          >
            <Button
              variant="contained"
              color="secondary"
              size="large"
              endIcon={<ArrowForward />}
              onClick={handleExploreMap}
              sx={{
                px: 4,
                py: 1.5,
                fontSize: "1.1rem",
              }}
            >
              Explorer la Carte
            </Button>
            <Button
              variant="outlined"
              color="inherit"
              size="large"
              onClick={handleViewReports}
              sx={{
                px: 4,
                py: 1.5,
                fontSize: "1.1rem",
                borderWidth: 2,
                "&:hover": { borderWidth: 2 },
              }}
            >
              Voir les Rapports
            </Button>
          </Stack>
        </Container>
      </HeroSection>

      <Container maxWidth="lg">
        {/* Section Statistiques */}
        {stats && (
          <Section>
            <Grid container spacing={3}>
              <Grid item xs={12} sm={6} md={3}>
                <StatsCard>
                  <DirectionsCar color="primary" sx={{ fontSize: 40, mb: 1 }} />
                  <Typography
                    variant="h4"
                    component="div"
                    fontWeight="bold"
                    gutterBottom
                  >
                    {stats.totalKm}km
                  </Typography>
                  <Typography variant="body1" color="text.secondary">
                    Kilomètres surveillés
                  </Typography>
                </StatsCard>
              </Grid>
              <Grid item xs={12} sm={6} md={3}>
                <StatsCard>
                  <TrendingUp color="success" sx={{ fontSize: 40, mb: 1 }} />
                  <Typography
                    variant="h4"
                    component="div"
                    fontWeight="bold"
                    gutterBottom
                  >
                    {stats.activeLots}
                  </Typography>
                  <Typography variant="body1" color="text.secondary">
                    Lots actifs
                  </Typography>
                </StatsCard>
              </Grid>
              <Grid item xs={12} sm={6} md={3}>
                <StatsCard>
                  <Assessment color="info" sx={{ fontSize: 40, mb: 1 }} />
                  <Typography
                    variant="h4"
                    component="div"
                    fontWeight="bold"
                    gutterBottom
                  >
                    {stats.completedReports}
                  </Typography>
                  <Typography variant="body1" color="text.secondary">
                    Rapports générés
                  </Typography>
                </StatsCard>
              </Grid>
              <Grid item xs={12} sm={6} md={3}>
                <StatsCard>
                  <Engineering color="warning" sx={{ fontSize: 40, mb: 1 }} />
                  <Typography
                    variant="h4"
                    component="div"
                    fontWeight="bold"
                    gutterBottom
                  >
                    {stats.teamMembers}
                  </Typography>
                  <Typography variant="body1" color="text.secondary">
                    Experts mobilisés
                  </Typography>
                </StatsCard>
              </Grid>
            </Grid>
          </Section>
        )}

        {/* Section Présentation */}
        <Section>
          <Typography
            variant="h3"
            component="h2"
            gutterBottom
            textAlign="center"
            sx={{ mb: 3 }}
          >
            Mission de Surveillance et Vérification
          </Typography>
          <Typography
            variant="h6"
            textAlign="center"
            color="text.secondary"
            sx={{
              mb: 6,
              maxWidth: "800px",
              mx: "auto",
              lineHeight: 1.6,
            }}
          >
            Le MSV (Mission de Surveillance et Vérification) pour un marché à
            Obligation de Résultats (MROR) sur une partie du réseau bitumé de
            Madagascar - 2025/074/CS MROR/AR/2025
          </Typography>

          {/* Features Grid */}
          <Grid container spacing={4}>
            {features.map((feature, index) => (
              <Grid item xs={12} sm={6} md={4} key={index}>
                <Link
                  to={feature.path}
                  style={{
                    textDecoration: "none",
                    display: "block",
                    height: "100%",
                  }}
                >
                  <FeatureCard>
                    <Box
                      sx={{
                        color: feature.color,
                        mb: 2,
                      }}
                    >
                      {feature.icon}
                    </Box>
                    <Typography
                      variant="h5"
                      component="h3"
                      gutterBottom
                      fontWeight="600"
                    >
                      {feature.title}
                    </Typography>
                    <Typography
                      variant="body1"
                      color="text.secondary"
                      sx={{
                        flexGrow: 1,
                        mb: 2,
                      }}
                    >
                      {feature.description}
                    </Typography>
                    <Button
                      endIcon={<ArrowForward />}
                      sx={{
                        color: feature.color,
                      }}
                    >
                      Explorer
                    </Button>
                  </FeatureCard>
                </Link>
              </Grid>
            ))}
          </Grid>
        </Section>

        {/* Section Lots Routiers */}
        <Section sx={{ bgcolor: "grey.50", borderRadius: 2, p: 4 }}>
          <Typography
            variant="h3"
            component="h2"
            gutterBottom
            textAlign="center"
          >
            Projets Routiers
          </Typography>
          <Typography
            variant="h6"
            color="text.secondary"
            textAlign="center"
            sx={{ mb: 6 }}
          >
            Sélectionnez un projet routier pour accéder au détail du suivi et
            aux rapports
          </Typography>

          {lots.length === 0 ? (
            <Box textAlign="center" py={6}>
              <Public sx={{ fontSize: 60, color: "text.secondary", mb: 2 }} />
              <Typography variant="h6" color="text.secondary">
                Aucun lot disponible pour le moment
              </Typography>
            </Box>
          ) : (
            <Grid container spacing={3}>
              {lots.map((lot) => (
                <Grid item xs={12} sm={6} md={4} key={lot.id}>
                  <Link
                    to={`/lots/${lot.id}`}
                    style={{ textDecoration: "none" }}
                  >
                    <LotCard>
                      <CardActionArea sx={{ p: 2, height: "100%" }}>
                        <CardContent>
                          <Stack
                            direction="row"
                            justifyContent="space-between"
                            alignItems="flex-start"
                            mb={2}
                          >
                            <Typography
                              variant="h5"
                              component="h3"
                              fontWeight="600"
                            >
                              {lot.number}
                            </Typography>
                            <StatusChip
                              label={lot.status}
                              status={lot.status.toLowerCase()}
                            />
                          </Stack>
                          <Typography
                            variant="h6"
                            component="h4"
                            color="primary"
                            gutterBottom
                          >
                            {lot.name}
                          </Typography>
                          <Typography
                            variant="body1"
                            color="text.secondary"
                            paragraph
                          >
                            {lot.description ||
                              "Section routière sous surveillance MSV"}
                          </Typography>
                          <Stack
                            direction="row"
                            justifyContent="space-between"
                            alignItems="center"
                          >
                            <Typography variant="body2" fontWeight="600">
                              {lot.length_km || "N/A"} km
                            </Typography>
                            <Typography variant="body2" color="text.secondary">
                              Voir détails →
                            </Typography>
                          </Stack>
                        </CardContent>
                      </CardActionArea>
                    </LotCard>
                  </Link>
                </Grid>
              ))}
            </Grid>
          )}
        </Section>

        {/* Section Équipe et Contact */}
        <Section>
          <Grid container spacing={6}>
            <Grid item xs={12} md={6}>
              <Typography variant="h3" component="h2" gutterBottom>
                Notre Équipe
              </Typography>
              <Typography variant="body1" color="text.secondary" paragraph>
                Une équipe d'experts dédiés au suivi et à la vérification des
                infrastructures routières de Madagascar.
              </Typography>
              <Typography variant="body1" paragraph>
                Nos ingénieurs, techniciens et analystes travaillent ensemble
                pour assurer la transparence et l'efficacité du projet.
              </Typography>
              <Box sx={{ mt: 4 }}>
                <Group
                  sx={{ fontSize: 120, opacity: 0.1, color: "primary.main" }}
                />
              </Box>
            </Grid>

            <Grid item xs={12} md={6}>
              <Typography variant="h3" component="h2" gutterBottom>
                Contact
              </Typography>

              <ContactItem>
                <LocationOn color="primary" sx={{ mr: 2, mt: 0.5 }} />
                <Box>
                  <Typography variant="h6" gutterBottom>
                    Adresse
                  </Typography>
                  <Typography variant="body1" color="text.secondary">
                    Lot IVC 87 Antsakaviro
                    <br />
                    Antananarivo 101, Madagascar
                  </Typography>
                </Box>
              </ContactItem>

              <ContactItem>
                <Email color="primary" sx={{ mr: 2, mt: 0.5 }} />
                <Box>
                  <Typography variant="h6" gutterBottom>
                    Email
                  </Typography>
                  <Typography variant="body1" color="text.secondary">
                    contact@msv-madagascar.mg
                  </Typography>
                </Box>
              </ContactItem>

              <ContactItem>
                <Phone color="primary" sx={{ mr: 2, mt: 0.5 }} />
                <Box>
                  <Typography variant="h6" gutterBottom>
                    Téléphone
                  </Typography>
                  <Typography variant="body1" color="text.secondary">
                    +261 20 22 123 45
                  </Typography>
                </Box>
              </ContactItem>

              <Button
                variant="contained"
                size="large"
                sx={{ mt: 3 }}
                startIcon={<ContactMail />}
              >
                Nous Contacter
              </Button>
            </Grid>
          </Grid>
        </Section>
      </Container>

      {/* Footer */}
      <Box
        component="footer"
        sx={{
          py: 4,
          px: 2,
          mt: 4,
          backgroundColor: (theme) =>
            theme.palette.mode === "light"
              ? theme.palette.grey[100]
              : theme.palette.grey[900],
          borderTop: `1px solid ${theme.palette.divider}`,
        }}
      >
        <Container maxWidth="lg">
          <Typography variant="body2" color="text.secondary" align="center">
            © 2025 MSV Madagascar - Mission de Surveillance et Vérification du
            Réseau Routier | Tous droits réservés
          </Typography>
        </Container>
      </Box>
    </Box>
  );
};

export default Home;
