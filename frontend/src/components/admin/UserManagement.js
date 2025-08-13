import React, { useState, useEffect, useContext } from "react";
import {
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  TextField,
  Select,
  MenuItem,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  FormControl,
  InputLabel,
  Switch,
  FormControlLabel,
  Chip,
  IconButton,
} from "@mui/material";
import { Add, Edit, LockReset, Search, Close } from "@mui/icons-material";
import AuthContext from "../../context/AuthContext";
import axios from "axios";
import { useSnackbar } from "notistack";

const UserManagement = () => {
  const { enqueueSnackbar, closeSnackbar } = useSnackbar();
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [roleFilter, setRoleFilter] = useState("all");
  const [openDialog, setOpenDialog] = useState(false);
  const [currentUser, setCurrentUser] = useState(null);
  const { token } = useContext(AuthContext);
  const [errors, setErrors] = useState({
    username: "",
    email: "",
    password: "",
    general: "",
  });

  const showSnackbar = (message, variant = "success") => {
    enqueueSnackbar(message, {
      variant,
      action: (key) => (
        <IconButton
          size="small"
          color="inherit"
          onClick={() => closeSnackbar(key)}
        >
          <Close fontSize="small" />
        </IconButton>
      ),
    });
  };

  const fetchUsers = async () => {
    try {
      const response = await axios.get(
        "http://localhost:5000/api/admin/users",
        {
          params: {
            search: searchTerm,
            role: roleFilter === "all" ? null : roleFilter,
          },
          headers: { "x-auth-token": token },
        }
      );
      setUsers(response.data);
    } catch (err) {
      console.error("Error fetching users:", err);
      showSnackbar("Erreur lors du chargement des utilisateurs", "error");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, [searchTerm, roleFilter]);

  const validateForm = () => {
    let valid = true;
    const newErrors = {
      username: "",
      email: "",
      password: "",
      general: "",
    };

    if (!currentUser.username) {
      newErrors.username = "Le nom d'utilisateur est requis";
      valid = false;
    }

    if (!currentUser.email) {
      newErrors.email = "L'email est requis";
      valid = false;
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(currentUser.email)) {
      newErrors.email = "Email invalide";
      valid = false;
    }

    if (!currentUser.id && !currentUser.tempPassword) {
      newErrors.password = "Le mot de passe temporaire est requis";
      valid = false;
    } else if (
      currentUser.tempPassword &&
      currentUser.tempPassword.length < 8
    ) {
      newErrors.password =
        "Le mot de passe doit contenir au moins 8 caractères";
      valid = false;
    }

    setErrors(newErrors);
    return valid;
  };

  const handleEditUser = (user) => {
    setCurrentUser(user);
    setOpenDialog(true);
  };

  const handleResetPassword = async (userId) => {
    const newPassword = prompt(
      "Entrez le nouveau mot de passe (min 8 caractères):"
    );

    if (!newPassword || newPassword.length < 8) {
      showSnackbar(
        "Le mot de passe doit contenir au moins 8 caractères",
        "error"
      );
      return;
    }

    try {
      await axios.post(
        `http://localhost:5000/api/admin/users/${userId}/reset-password`,
        { newPassword },
        { headers: { "x-auth-token": token } }
      );
      showSnackbar("Mot de passe réinitialisé avec succès");
    } catch (err) {
      console.error("Error resetting password:", err);
      showSnackbar(
        err.response?.data?.message || "Erreur lors de la réinitialisation",
        "error"
      );
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!validateForm()) {
      showSnackbar("Veuillez corriger les erreurs dans le formulaire", "error");
      return;
    }

    try {
      if (currentUser.id) {
        // Update existing user
        await axios.put(
          `http://localhost:5000/api/admin/users/${currentUser.id}`,
          currentUser,
          { headers: { "x-auth-token": token } }
        );
        showSnackbar("Utilisateur mis à jour avec succès");
      } else {
        // Create new user
        await axios.post(
          "http://localhost:5000/api/admin/users",
          { ...currentUser, password: currentUser.tempPassword },
          { headers: { "x-auth-token": token } }
        );
        showSnackbar("Utilisateur créé avec succès");
      }
      fetchUsers();
      setOpenDialog(false);
    } catch (err) {
      console.error("Error saving user:", err);
      const errorMsg =
        err.response?.data?.message || "Erreur lors de la sauvegarde";

      if (err.response?.data?.errors) {
        setErrors((prev) => ({
          ...prev,
          ...err.response.data.errors.reduce((acc, error) => {
            acc[error.field] = error.message;
            return acc;
          }, {}),
        }));
      }

      showSnackbar(errorMsg, "error");
    }
  };

  return (
    <Paper sx={{ p: 3 }}>
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          marginBottom: 20,
        }}
      >
        <div style={{ display: "flex", gap: 10 }}>
          <TextField
            label="Rechercher"
            variant="outlined"
            size="small"
            InputProps={{ startAdornment: <Search /> }}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
          <FormControl size="small" sx={{ minWidth: 120 }}>
            <InputLabel>Rôle</InputLabel>
            <Select
              value={roleFilter}
              label="Rôle"
              onChange={(e) => setRoleFilter(e.target.value)}
            >
              <MenuItem value="all">Tous</MenuItem>
              <MenuItem value="admin">Admin</MenuItem>
              <MenuItem value="user">Utilisateur</MenuItem>
            </Select>
          </FormControl>
        </div>
        <Button
          variant="contained"
          startIcon={<Add />}
          onClick={() => {
            setCurrentUser({
              username: "",
              email: "",
              role: "user",
              is_active: true,
              tempPassword: "",
            });
            setOpenDialog(true);
          }}
        >
          Nouvel utilisateur
        </Button>
      </div>

      <TableContainer component={Paper}>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>Nom</TableCell>
              <TableCell>Email</TableCell>
              <TableCell>Rôle</TableCell>
              <TableCell>Statut</TableCell>
              <TableCell>Actions</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {users.map((user) => (
              <TableRow key={user.id}>
                <TableCell>{user.username}</TableCell>
                <TableCell>{user.email}</TableCell>
                <TableCell>
                  <Chip
                    label={user.role}
                    color={user.role === "admin" ? "primary" : "default"}
                    size="small"
                  />
                </TableCell>
                <TableCell>
                  <Chip
                    label={user.is_active ? "Actif" : "Inactif"}
                    color={user.is_active ? "success" : "error"}
                    size="small"
                  />
                </TableCell>
                <TableCell>
                  <Button
                    size="small"
                    startIcon={<Edit />}
                    onClick={() => handleEditUser(user)}
                    sx={{ mr: 1 }}
                  >
                    Modifier
                  </Button>
                  <Button
                    size="small"
                    startIcon={<LockReset />}
                    onClick={() => handleResetPassword(user.id)}
                    color="secondary"
                  >
                    Réinit. MDP
                  </Button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>

      <Dialog open={openDialog} onClose={() => setOpenDialog(false)}>
        <DialogTitle>
          {currentUser?.id ? "Modifier utilisateur" : "Nouvel utilisateur"}
        </DialogTitle>
        <DialogContent>
          <form onSubmit={handleSubmit} style={{ marginTop: 10 }}>
            {errors.general && (
              <div style={{ color: "red", marginBottom: 15 }}>
                {errors.general}
              </div>
            )}

            <TextField
              label="Nom d'utilisateur"
              fullWidth
              margin="normal"
              value={currentUser?.username || ""}
              onChange={(e) =>
                setCurrentUser({ ...currentUser, username: e.target.value })
              }
              error={!!errors.username}
              helperText={errors.username}
              required
            />
            <TextField
              label="Email"
              fullWidth
              margin="normal"
              type="email"
              value={currentUser?.email || ""}
              onChange={(e) =>
                setCurrentUser({ ...currentUser, email: e.target.value })
              }
              error={!!errors.email}
              helperText={errors.email}
              required
            />
            <FormControl fullWidth margin="normal">
              <InputLabel>Rôle</InputLabel>
              <Select
                value={currentUser?.role || "user"}
                label="Rôle"
                onChange={(e) =>
                  setCurrentUser({ ...currentUser, role: e.target.value })
                }
              >
                <MenuItem value="admin">Administrateur</MenuItem>
                <MenuItem value="user">Utilisateur</MenuItem>
              </Select>
            </FormControl>
            <FormControlLabel
              control={
                <Switch
                  checked={currentUser?.is_active || false}
                  onChange={(e) =>
                    setCurrentUser({
                      ...currentUser,
                      is_active: e.target.checked,
                    })
                  }
                />
              }
              label="Compte actif"
              sx={{ mt: 2 }}
            />
            {!currentUser?.id && (
              <TextField
                label="Mot de passe temporaire"
                fullWidth
                margin="normal"
                type="password"
                value={currentUser?.tempPassword || ""}
                onChange={(e) =>
                  setCurrentUser({
                    ...currentUser,
                    tempPassword: e.target.value,
                  })
                }
                error={!!errors.password}
                helperText={errors.password}
                required
              />
            )}
            <DialogActions sx={{ mt: 2 }}>
              <Button onClick={() => setOpenDialog(false)}>Annuler</Button>
              <Button type="submit" variant="contained">
                Enregistrer
              </Button>
            </DialogActions>
          </form>
        </DialogContent>
      </Dialog>
    </Paper>
  );
};

export default UserManagement;
