import React, { useState, useEffect, useContext } from "react";
import { useParams, Link, useNavigate } from "react-router-dom";
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
  Typography,
  Box,
  IconButton,
  CircularProgress,
  Chip,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  DialogContentText,
  List,
  ListItem,
  ListItemText,
  Divider,
} from "@mui/material";
import {
  Search,
  Refresh,
  Visibility,
  Download,
  Upload as UploadIcon,
  Add,
  Edit,
  Close,
  ArrowBack,
  Delete,
} from "@mui/icons-material";
import { useSnackbar } from "notistack";
import AuthContext from "../../context/AuthContext";
import DocumentDetails from "./DocumentDetails";
import { formatDate } from "../../utils/dateUtils";
import api from "../../services/api";

const DocumentsTab = ({ lotId }) => {
  const { enqueueSnackbar } = useSnackbar();
  const { id: routeLotId, docId } = useParams();
  const navigate = useNavigate();
  const { user, token } = useContext(AuthContext);
  const [state, setState] = useState({
    documents: [],
    filteredDocuments: [],
    types: [],
    loading: true,
    error: null,
    errorUpload: null,
    searchTerm: "",
    selectedType: "",
    fromDate: "",
    toDate: "",
    showUploadDialog: false,
    selectedDocument: null,
    uploadForm: {
      title: "",
      description: "",
      type_id: "",
      keywords: "",
      file: null,
    },
    showTypeDialog: false,
    typeForm: {
      name: "",
      description: "",
    },
    editingType: null,
  });

  const lotIdToUse = lotId || routeLotId;

  useEffect(() => {
    fetchTypes();
    fetchDocuments();
  }, [lotIdToUse]);

  const fetchTypes = async () => {
    try {
      const res = await api.get("/api/types");
      setState((prev) => ({
        ...prev,
        types: res.data,
        uploadForm: {
          ...prev.uploadForm,
          type_id: res.data.length > 0 ? res.data[0].id : "",
        },
      }));
    } catch (err) {
      setState((prev) => ({
        ...prev,
        error: "Erreur lors du chargement des types de documents",
      }));
    }
  };

  const fetchDocuments = async () => {
    if (!lotIdToUse) return;

    try {
      setState((prev) => ({ ...prev, loading: true }));
      const params = {
        search: state.searchTerm,
        type: state.selectedType,
        fromDate: state.fromDate,
        toDate: state.toDate,
      };

      const res = await api.get(`/api/documents/${lotIdToUse}/lot`, {
        params,
        headers: { "x-auth-token": token },
      });

      setState((prev) => ({
        ...prev,
        documents: res.data,
        filteredDocuments: res.data,
        loading: false,
        error: null,
      }));
    } catch (err) {
      setState((prev) => ({
        ...prev,
        loading: false,
        error: "Erreur lors du chargement des documents",
      }));
    }
  };

  const handleUploadDialogOpen = () => {
    setState((prev) => ({ ...prev, showUploadDialog: true }));
  };

  const handleUploadDialogClose = () => {
    setState((prev) => ({
      ...prev,
      showUploadDialog: false,
      uploadForm: {
        title: "",
        description: "",
        type_id: state.types.length > 0 ? state.types[0].id : "",
        keywords: "",
        file: null,
      },
    }));
  };

  const handleUploadFormChange = (e) => {
    const { name, value } = e.target;
    setState((prev) => ({
      ...prev,
      uploadForm: {
        ...prev.uploadForm,
        [name]: value,
      },
    }));
  };

  const handleFileChange = (e) => {
    setState((prev) => ({
      ...prev,
      uploadForm: {
        ...prev.uploadForm,
        file: e.target.files[0],
      },
    }));
  };

  const handleUploadSubmit = async (e) => {
    e.preventDefault();

    if (!state.uploadForm.file) {
      enqueueSnackbar("Veuillez sélectionner un fichier", {
        variant: "error",
      });
      return;
    }
    if (!state.uploadForm.title) {
      enqueueSnackbar("Veuillez renseigner le titre du fichier", {
        variant: "error",
      });
      return;
    }

    try {
      setState((prev) => ({ ...prev, loading: true }));

      const formData = new FormData();
      formData.append("title", state.uploadForm.title);
      formData.append("description", state.uploadForm.description);
      formData.append("type_id", state.uploadForm.type_id);
      formData.append("keywords", state.uploadForm.keywords);
      formData.append("file", state.uploadForm.file);
      formData.append("lot_id", lotIdToUse);

      await api.post("/api/documents", formData, {
        headers: {
          "Content-Type": "multipart/form-data",
          "x-auth-token": token,
        },
      });

      enqueueSnackbar("Document téléversé avec succès", { variant: "success" });
      handleUploadDialogClose();
      fetchDocuments();
    } catch (err) {
      enqueueSnackbar(
        err.response?.data?.message || "Erreur lors du téléversement",
        { variant: "error" }
      );
    } finally {
      setState((prev) => ({ ...prev, loading: false }));
    }
  };

  const handleSearchChange = (e) => {
    setState((prev) => ({ ...prev, searchTerm: e.target.value }));
  };

  const handleTypeChange = (e) => {
    setState((prev) => ({ ...prev, selectedType: e.target.value }));
  };

  const handleDateChange = (field) => (e) => {
    setState((prev) => ({ ...prev, [field]: e.target.value }));
  };

  const handleResetFilters = () => {
    setState((prev) => ({
      ...prev,
      searchTerm: "",
      selectedType: "",
      fromDate: "",
      toDate: "",
    }));
    fetchDocuments();
  };

  const handleDocumentClick = (docId) => {
    navigate(`/lots/${lotIdToUse}/documents/${docId}`);
  };

  const handleDownload = async (docId, e) => {
    e.stopPropagation();
    try {
      const response = await api.get(`/api/documents/${docId}/download`, {
        responseType: "blob",
        headers: { "x-auth-token": token },
      });

      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement("a");
      link.href = url;
      link.setAttribute("download", `document-${docId}`);
      document.body.appendChild(link);
      link.click();
      link.remove();
    } catch (err) {
      setState((prev) => ({
        ...prev,
        error: "Erreur lors du téléchargement",
      }));
    }
  };
  // Fonction pour supprimer un document
  const handleDeleteDocument = async (docId, e) => {
    e.stopPropagation();

    if (!window.confirm("Êtes-vous sûr de vouloir supprimer ce document ?")) {
      return;
    }

    try {
      await api.delete(`/api/documents/${docId}`, {
        headers: { "x-auth-token": token },
      });

      enqueueSnackbar("Document supprimé avec succès", { variant: "success" });
      fetchDocuments();
    } catch (err) {
      console.error("Error deleting document:", err);
      enqueueSnackbar(
        err.response?.data?.message || "Erreur lors de la suppression",
        { variant: "error" }
      );
    }
  };

  const handleCloseDetails = () => {
    navigate(`/lots/${lotIdToUse}/documents`);
  };

  if (docId) {
    return (
      <Box sx={{ p: 3 }}>
        <Button
          startIcon={<ArrowBack />}
          onClick={handleCloseDetails}
          sx={{ mb: 2 }}
        >
          Retour à la liste
        </Button>
        <DocumentDetails id={docId} />
      </Box>
    );
  }

  // Gestion des types de documents
  const handleTypeDialogOpen = () => {
    setState((prev) => ({ ...prev, showTypeDialog: true }));
  };

  const handleTypeDialogClose = () => {
    setState((prev) => ({
      ...prev,
      showTypeDialog: false,
      editingType: null,
      typeForm: {
        name: "",
        description: "",
      },
    }));
  };

  const handleTypeFormChange = (e) => {
    const { name, value } = e.target;
    setState((prev) => ({
      ...prev,
      typeForm: {
        ...prev.typeForm,
        [name]: value,
      },
    }));
  };

  const handleEditType = (type) => {
    setState((prev) => ({
      ...prev,
      showTypeDialog: true,
      editingType: type,
      typeForm: {
        name: type.name,
        description: type.description || "",
      },
    }));
  };

  const handleSubmitType = async (e) => {
    e.preventDefault();
    setState((prev) => ({ ...prev, loading: true }));
    try {
      if (state.editingType) {
        await api.put(`/api/types/${state.editingType.id}`, state.typeForm, {
          headers: { "x-auth-token": token },
        });
        enqueueSnackbar("Type mis à jour avec succès", { variant: "success" });
      } else {
        await api.post("/api/types", state.typeForm, {
          headers: { "x-auth-token": token },
        });
        enqueueSnackbar("Type créé avec succès", { variant: "success" });
      }
      fetchTypes();
      handleTypeDialogClose();
    } catch (err) {
      enqueueSnackbar(
        err.response?.data?.message || "Erreur lors de l'opération",
        { variant: "error" }
      );
    } finally {
      setState((prev) => ({ ...prev, loading: false }));
    }
  };

  const handleDeleteType = async (typeId) => {
    try {
      await api.delete(`/api/types/${typeId}`, {
        headers: { "x-auth-token": token },
      });
      enqueueSnackbar("Type supprimé avec succès", { variant: "success" });
      fetchTypes();
    } catch (err) {
      enqueueSnackbar(
        err.response?.data?.message || "Erreur lors de la suppression",
        { variant: "error" }
      );
    }
  };

  return (
    <Box sx={{ p: 3 }}>
      <Typography variant="h5" gutterBottom>
        Gestion des Documents
      </Typography>
      {/* Filtres de recherche */}
      <Paper sx={{ p: 3, mb: 3 }}>
        <Box
          component="form"
          onSubmit={(e) => {
            e.preventDefault();
            fetchDocuments();
          }}
        >
          <TextField
            fullWidth
            label="Rechercher"
            variant="outlined"
            value={state.searchTerm}
            onChange={handleSearchChange}
            InputProps={{
              startAdornment: <Search sx={{ mr: 1 }} />,
            }}
            sx={{ mb: 2 }}
          />

          <Box
            sx={{
              display: "flex",
              gap: 2,
              flexWrap: "wrap",
              mb: 2,
            }}
          >
            <Select
              value={state.selectedType}
              onChange={handleTypeChange}
              displayEmpty
              sx={{ minWidth: 200 }}
            >
              <MenuItem value="">Tous les types</MenuItem>
              {state.types.map((type) => (
                <MenuItem key={type.id} value={type.id}>
                  {type.name}
                </MenuItem>
              ))}
            </Select>

            <TextField
              label="À partir du"
              type="date"
              InputLabelProps={{ shrink: true }}
              value={state.fromDate}
              onChange={handleDateChange("fromDate")}
              sx={{ minWidth: 180 }}
            />

            <TextField
              label="Jusqu'au"
              type="date"
              InputLabelProps={{ shrink: true }}
              value={state.toDate}
              onChange={handleDateChange("toDate")}
              sx={{ minWidth: 180 }}
            />
          </Box>

          <Box sx={{ display: "flex", gap: 2 }}>
            <Button type="submit" variant="contained" startIcon={<Search />}>
              Rechercher
            </Button>
            <Button
              variant="outlined"
              onClick={handleResetFilters}
              startIcon={<Refresh />}
            >
              Réinitialiser
            </Button>
            {user && (
              <Button
                variant="contained"
                color="success"
                startIcon={<UploadIcon />}
                onClick={handleUploadDialogOpen}
                sx={{ ml: "auto" }}
              >
                Nouveau document
              </Button>
            )}
            {user?.role === "admin" && (
              <Button
                variant="outlined"
                color="secondary"
                onClick={handleTypeDialogOpen}
                startIcon={<Add />}
              >
                Gérer les types
              </Button>
            )}
          </Box>
        </Box>
      </Paper>
      {/* Dialog pour l'upload */}
      <Dialog
        open={state.showUploadDialog}
        onClose={handleUploadDialogClose}
        fullWidth
        maxWidth="md"
      >
        <DialogTitle>Ajouter un nouveau document</DialogTitle>
        <DialogContent>
          <Box component="form" sx={{ mt: 2 }}>
            <TextField
              fullWidth
              label="Titre"
              name="title"
              value={state.uploadForm.title}
              onChange={handleUploadFormChange}
              required
              sx={{ mb: 2 }}
            />

            <TextField
              fullWidth
              label="Description"
              name="description"
              value={state.uploadForm.description}
              onChange={handleUploadFormChange}
              multiline
              rows={3}
              sx={{ mb: 2 }}
            />

            <Select
              fullWidth
              label="Type de document"
              name="type_id"
              value={state.uploadForm.type_id}
              onChange={handleUploadFormChange}
              required
              sx={{ mb: 2 }}
            >
              {state.types.map((type) => (
                <MenuItem key={type.id} value={type.id}>
                  {type.name}
                </MenuItem>
              ))}
            </Select>

            <TextField
              fullWidth
              label="Mots-clés (séparés par des virgules)"
              name="keywords"
              value={state.uploadForm.keywords}
              onChange={handleUploadFormChange}
              sx={{ mb: 2 }}
            />

            <Button
              variant="contained"
              component="label"
              fullWidth
              sx={{ mb: 2 }}
            >
              Sélectionner un fichier
              <input type="file" hidden onChange={handleFileChange} required />
            </Button>
            {state.uploadForm.file && (
              <Typography variant="body2">
                Fichier sélectionné: {state.uploadForm.file.name}
              </Typography>
            )}
            {state.errorUpload && (
              <Typography color="error" sx={{ p: 2 }}>
                {state.errorUpload}
              </Typography>
            )}
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleUploadDialogClose}>Annuler</Button>
          <Button
            onClick={handleUploadSubmit}
            variant="contained"
            disabled={state.loading}
            startIcon={state.loading ? <CircularProgress size={20} /> : null}
          >
            {state.loading ? "En cours..." : "Téléverser"}
          </Button>
        </DialogActions>
      </Dialog>
      {/* Liste des documents */}
      <Paper sx={{ p: 2 }}>
        {state.loading ? (
          <Box sx={{ display: "flex", justifyContent: "center", p: 4 }}>
            <CircularProgress />
          </Box>
        ) : state.error ? (
          <Typography color="error" sx={{ p: 2 }}>
            {state.error}
          </Typography>
        ) : state.filteredDocuments.length === 0 ? (
          <Typography sx={{ p: 2 }}>Aucun document trouvé</Typography>
        ) : (
          <TableContainer>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell>Titre</TableCell>
                  <TableCell>Type</TableCell>
                  <TableCell>Statut</TableCell>
                  <TableCell>Créé par</TableCell>
                  <TableCell>Date</TableCell>
                  <TableCell>Actions</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {state.filteredDocuments.map((doc) => (
                  <TableRow
                    key={doc.id}
                    hover
                    onClick={() => handleDocumentClick(doc.id)}
                    sx={{ cursor: "pointer" }}
                  >
                    <TableCell>{doc.title}</TableCell>
                    <TableCell>
                      <Chip label={doc.type_name} size="small" />
                    </TableCell>
                    <TableCell>
                      <Chip
                        label={doc.status || "Non spécifié"}
                        color={
                          doc.status === "Approuvé" ? "success" : "default"
                        }
                        size="small"
                      />
                    </TableCell>
                    <TableCell>{doc.creator}</TableCell>
                    <TableCell>{formatDate(doc.created_at)}</TableCell>
                    <TableCell>
                      <IconButton
                        onClick={(e) => handleDownload(doc.id, e)}
                        color="primary"
                      >
                        <Download />
                      </IconButton>
                      <IconButton
                        onClick={(e) => handleDocumentClick(doc.id, e)}
                        color="secondary"
                      >
                        <Visibility />
                      </IconButton>
                      {user?.role === "admin" && (
                        <IconButton
                          onClick={(e) => handleDeleteDocument(doc.id, e)}
                          color="error"
                        >
                          <Delete />
                        </IconButton>
                      )}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        )}
      </Paper>
      {/* Ajoutez ce nouveau Dialog pour la gestion des types*/}
      <Dialog
        open={state.showTypeDialog}
        onClose={handleTypeDialogClose}
        fullWidth
        maxWidth="sm"
      >
        <DialogTitle>
          {state.editingType ? "Modifier le type" : "Ajouter un nouveau type"}
        </DialogTitle>
        <DialogContent>
          <Box component="form" onSubmit={handleSubmitType} sx={{ mt: 2 }}>
            <TextField
              fullWidth
              label="Nom du type"
              name="name"
              value={state.typeForm.name}
              onChange={handleTypeFormChange}
              required
              sx={{ mb: 2 }}
            />
            <TextField
              fullWidth
              label="Description"
              name="description"
              value={state.typeForm.description}
              onChange={handleTypeFormChange}
              multiline
              rows={3}
              sx={{ mb: 2 }}
            />
          </Box>

          {state.types.length > 0 && (
            <>
              <Divider sx={{ my: 2 }} />
              <Typography variant="h6" gutterBottom>
                Types existants
              </Typography>
              <List dense>
                {state.types.map((type) => (
                  <ListItem
                    key={type.id}
                    secondaryAction={
                      <>
                        <IconButton
                          edge="end"
                          onClick={() => handleEditType(type)}
                          sx={{ mr: 1 }}
                        >
                          <Edit />
                        </IconButton>
                        <IconButton
                          edge="end"
                          onClick={() => handleDeleteType(type.id)}
                          color="error"
                        >
                          <Delete />
                        </IconButton>
                      </>
                    }
                  >
                    <ListItemText
                      primary={type.name}
                      secondary={type.description || "Aucune description"}
                    />
                  </ListItem>
                ))}
              </List>
            </>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={handleTypeDialogClose}>Annuler</Button>
          <Button
            onClick={handleSubmitType}
            variant="contained"
            color="primary"
            disabled={state.loading}
          >
            {state.loading ? (
              <CircularProgress size={24} />
            ) : state.editingType ? (
              "Mettre à jour"
            ) : (
              "Créer"
            )}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default DocumentsTab;
