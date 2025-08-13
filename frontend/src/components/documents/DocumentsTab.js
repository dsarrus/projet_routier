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
} from "@mui/material";
import {
  Search,
  Refresh,
  Visibility,
  Download,
  Upload as UploadIcon,
  Add,
  Close,
  ArrowBack,
  Delete,
} from "@mui/icons-material";
import { useSnackbar } from "notistack";
import AuthContext from "../../context/AuthContext";
import axios from "axios";
import DocumentDetails from "./DocumentDetails";
import { formatDate } from "../../utils/dateUtils";

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
  });

  const lotIdToUse = lotId || routeLotId;

  useEffect(() => {
    fetchTypes();
    fetchDocuments();
  }, [lotIdToUse]);

  const fetchTypes = async () => {
    try {
      const res = await axios.get("http://localhost:5000/api/types");
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

      const res = await axios.get(
        `http://localhost:5000/api/documents/${lotIdToUse}/lot`,
        { params, headers: { "x-auth-token": token } }
      );

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
      setState((prev) => ({
        ...prev,
        errorUpload: "Veuillez sélectionner un fichier",
      }));
    }
    if (!state.uploadForm.title) {
      setState((prev) => ({
        ...prev,
        errorUpload: "Veuillez renseigner le titre du fichier",
      }));
      return;
    }

    try {
      setState((prev) => ({ ...prev, loading: true, error: null }));

      const formData = new FormData();
      formData.append("title", state.uploadForm.title);
      formData.append("description", state.uploadForm.description);
      formData.append("type_id", state.uploadForm.type_id);
      formData.append("keywords", state.uploadForm.keywords);
      formData.append("file", state.uploadForm.file);
      formData.append("lot_id", lotIdToUse);

      await axios.post("http://localhost:5000/api/documents", formData, {
        headers: {
          "Content-Type": "multipart/form-data",
          "x-auth-token": token,
        },
      });

      handleUploadDialogClose();
      fetchDocuments();
    } catch (err) {
      setState((prev) => ({
        ...prev,
        loading: false,
        errorUpload:
          err.response?.data?.message ||
          "Erreur lors du téléversement du document",
      }));
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
      const response = await axios.get(
        `http://localhost:5000/api/documents/${docId}/download`,
        {
          responseType: "blob",
          headers: { "x-auth-token": token },
        }
      );

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
      await axios.delete(`http://localhost:5000/api/documents/${docId}`, {
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
    </Box>
  );
};

export default DocumentsTab;
