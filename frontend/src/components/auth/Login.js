import React, { useState, useContext } from "react";
import { useNavigate, Link } from "react-router-dom";
import {
  Container,
  Paper,
  TextField,
  Button,
  Typography,
  Box,
  Alert,
  CircularProgress,
  InputAdornment,
  IconButton,
} from "@mui/material";
import {
  Visibility,
  VisibilityOff,
  Login as LoginIcon,
} from "@mui/icons-material";
import { useSnackbar } from "notistack";
import AuthContext from "../../context/AuthContext";

const Login = ({ login }) => {
  const [formData, setFormData] = useState({
    username: "",
    password: "",
    showPassword: false,
  });
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const { enqueueSnackbar } = useSnackbar();

  const { username, password, showPassword } = formData;

  const onChange = (e) =>
    setFormData({ ...formData, [e.target.name]: e.target.value });

  const handleClickShowPassword = () => {
    setFormData({ ...formData, showPassword: !showPassword });
  };

  const handleMouseDownPassword = (event) => {
    event.preventDefault();
  };

  const onSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      await login(formData);
      enqueueSnackbar("Connexion réussie!", {
        variant: "success",
        autoHideDuration: 3000,
        anchorOrigin: {
          vertical: "top",
          horizontal: "right",
        },
      });
      navigate("/documents");
    } catch (err) {
      const errorMessage =
        err.response?.data?.message || "Identifiants incorrects";
      setError(errorMessage);
      enqueueSnackbar(errorMessage, {
        variant: "error",
        autoHideDuration: 4000,
        anchorOrigin: {
          vertical: "top",
          horizontal: "right",
        },
      });
      setLoading(false);
    }
  };

  return (
    <Container component="main" maxWidth="sm">
      <Box
        sx={{
          marginTop: 8,
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
        }}
      >
        <Paper elevation={6} sx={{ padding: 4, width: "100%" }}>
          <Box
            sx={{
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
            }}
          >
            <LoginIcon
              sx={{ fontSize: 40, marginBottom: 2, color: "primary.main" }}
            />
            <Typography component="h1" variant="h4" gutterBottom>
              Connexion
            </Typography>

            {error && (
              <Alert severity="error" sx={{ width: "100%", marginBottom: 2 }}>
                {error}
              </Alert>
            )}

            <Box
              component="form"
              onSubmit={onSubmit}
              sx={{ mt: 1, width: "100%" }}
            >
              <TextField
                margin="normal"
                required
                fullWidth
                id="username"
                label="Nom d'utilisateur"
                name="username"
                value={username}
                onChange={onChange}
                autoComplete="username"
                autoFocus
                disabled={loading}
              />
              <TextField
                margin="normal"
                required
                fullWidth
                name="password"
                label="Mot de passe"
                type={showPassword ? "text" : "password"}
                id="password"
                value={password}
                onChange={onChange}
                autoComplete="current-password"
                disabled={loading}
                InputProps={{
                  endAdornment: (
                    <InputAdornment position="end">
                      <IconButton
                        aria-label="toggle password visibility"
                        onClick={handleClickShowPassword}
                        onMouseDown={handleMouseDownPassword}
                        edge="end"
                      >
                        {showPassword ? <VisibilityOff /> : <Visibility />}
                      </IconButton>
                    </InputAdornment>
                  ),
                }}
              />
              <Button
                type="submit"
                fullWidth
                variant="contained"
                sx={{ mt: 3, mb: 2, py: 1.5 }}
                disabled={loading}
                startIcon={
                  loading ? <CircularProgress size={20} /> : <LoginIcon />
                }
              >
                {loading ? "Connexion en cours..." : "Se connecter"}
              </Button>
              <Box sx={{ textAlign: "center" }}>
                <Link to="/register" style={{ textDecoration: "none" }}>
                  <Typography variant="body2" color="primary">
                    Pas encore de compte? S'inscrire
                  </Typography>
                </Link>
              </Box>
            </Box>
          </Box>
        </Paper>
      </Box>
    </Container>
  );
};

export default Login;
