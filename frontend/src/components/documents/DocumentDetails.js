import React, { useState, useEffect, useContext } from "react";
import { useParams, Link } from "react-router-dom";
import AuthContext from "../../context/AuthContext";
import { saveAs } from "file-saver";
import {
  Box,
  Typography,
  Button,
  CircularProgress,
  Alert,
  Paper,
  Divider,
  Chip,
  TextField,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  IconButton,
  Stack,
} from "@mui/material";
import {
  Download,
  Upload,
  Add,
  Cancel,
  Visibility,
  ArrowBack,
} from "@mui/icons-material";
import { formatDate, dateDiff } from "../../utils/dateUtils"; // Importez vos utilitaires
import api from "../../services/api";

const DocumentDetails = () => {
  const { docId } = useParams();
  const [document, setDocument] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [openVersionDialog, setOpenVersionDialog] = useState(false);
  const [changesDescription, setChangesDescription] = useState("");
  const [file, setFile] = useState(null);
  const { user, token } = useContext(AuthContext);

  useEffect(() => {
    const fetchDocument = async () => {
      try {
        const res = await api.get(`/api/documents/${docId}`, {
          headers: {
            "x-auth-token": token,
          },
        });
        setDocument(res.data);
        setLoading(false);
      } catch (err) {
        setError("Erreur lors du chargement du document");
        setLoading(false);
      }
    };

    fetchDocument();
  }, [docId, token]);

  const handleFileChange = (e) => {
    setFile(e.target.files[0]);
  };

  const handleSubmitVersion = async (e) => {
    e.preventDefault();

    try {
      const formData = new FormData();
      formData.append("file", file);
      formData.append("changes_description", changesDescription);

      await api.put(`/api/documents/${docId}/versions`, formData, {
        headers: {
          "Content-Type": "multipart/form-data",
          "x-auth-token": token,
        },
      });

      // Refresh document details
      const res = await api.get(`/api/documents/${docId}`);
      setDocument(res.data);
      setOpenVersionDialog(false);
      setChangesDescription("");
      setFile(null);
    } catch (err) {
      console.error(err);
      setError("Erreur lors de la création de la nouvelle version");
    }
  };

  const handleDownload = async (documentId, documentTitle) => {
    try {
      const response = await api.get(`/api/documents/${documentId}/download`, {
        responseType: "blob",
        headers: {
          "x-auth-token": token,
        },
      });

      saveAs(response.data, documentTitle || "document");
    } catch (err) {
      console.error("Download error:", err);
      setError("Erreur lors du téléchargement");
    }
  };

  const handleVersionDownload = async (versionId, documentTitle) => {
    try {
      const response = await api.get(
        `/api/documents/${docId}/versions/${versionId}/download`,
        {
          responseType: "blob",
          headers: {
            "x-auth-token": token,
          },
        }
      );
      saveAs(response.data, documentTitle || `version-${versionId}`);
    } catch (err) {
      console.error("Version download error:", err);
      setError("Erreur lors du téléchargement de la version");
    }
  };

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" mt={4}>
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

  if (!document) {
    return (
      <Alert severity="warning" sx={{ m: 2 }}>
        Document non trouvé
      </Alert>
    );
  }

  return (
    <Box sx={{ p: 3 }}>
      <Paper elevation={3} sx={{ p: 3, mb: 3 }}>
        <Stack
          direction="row"
          justifyContent="space-between"
          alignItems="center"
        >
          <Typography variant="h4" component="h1" gutterBottom>
            {document.title}
          </Typography>

          <Stack direction="row" spacing={2}>
            <Button
              variant="contained"
              color="primary"
              startIcon={<Download />}
              onClick={() => handleDownload(docId, document.title)}
            >
              Télécharger
            </Button>

            {user && (
              <Button
                variant="outlined"
                color="secondary"
                startIcon={<Add />}
                onClick={() => setOpenVersionDialog(true)}
              >
                Nouvelle version
              </Button>
            )}
          </Stack>
        </Stack>

        <Divider sx={{ my: 2 }} />

        <Stack spacing={2} sx={{ mb: 3 }}>
          <Stack direction="row" spacing={2}>
            <Chip
              label={document.type_name}
              color="primary"
              variant="outlined"
            />
            <Typography variant="body1">
              <strong>Créé par:</strong> {document.creator}
            </Typography>
          </Stack>

          <Typography variant="body1">
            <strong>Date de création:</strong>{" "}
            {formatDate(document.created_at, "fr-FR", {
              year: "numeric",
              month: "long",
              day: "numeric",
              hour: "2-digit",
              minute: "2-digit",
            })}
          </Typography>

          <Typography variant="body1">
            <strong>Dernière mise à jour:</strong>{" "}
            {formatDate(document.updated_at, "fr-FR", {
              year: "numeric",
              month: "long",
              day: "numeric",
              hour: "2-digit",
              minute: "2-digit",
            })}
          </Typography>
          {/* Exemple d'utilisation de dateDiff */}
          <Typography variant="body2" color="text.secondary">
            {document.versions.length > 0 &&
              `Dernière version ajoutée il y a ${
                dateDiff(new Date(), document.versions[0].created_at).days
              } jours`}
          </Typography>
        </Stack>

        {document.description && (
          <>
            <Typography variant="h6" gutterBottom>
              Description
            </Typography>
            <Typography variant="body1" paragraph>
              {document.description}
            </Typography>
          </>
        )}
      </Paper>

      <Typography variant="h5" gutterBottom sx={{ mt: 4 }}>
        Versions
      </Typography>

      {document.versions.length === 0 ? (
        <Alert severity="info">Aucune version disponible</Alert>
      ) : (
        <TableContainer component={Paper}>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>Version</TableCell>
                <TableCell>Date</TableCell>
                <TableCell>Description des changements</TableCell>
                <TableCell align="right">Actions</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {document.versions.map((version) => (
                <TableRow key={version.id}>
                  <TableCell>v{version.version_number}</TableCell>
                  <TableCell>
                    {formatDate(version.created_at, "fr-FR", {
                      year: "numeric",
                      month: "long",
                      day: "numeric",
                    })}
                  </TableCell>
                  <TableCell>{version.changes_description}</TableCell>
                  <TableCell align="right">
                    <IconButton
                      onClick={() =>
                        handleVersionDownload(
                          version.id,
                          `${document.title}-v${version.version_number}`
                        )
                      }
                      color="primary"
                    >
                      <Download />
                    </IconButton>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      )}

      {/* Dialog for new version */}
      <Dialog
        open={openVersionDialog}
        onClose={() => setOpenVersionDialog(false)}
        fullWidth
        maxWidth="md"
      >
        <DialogTitle>Ajouter une nouvelle version</DialogTitle>
        <DialogContent>
          <Box component="form" onSubmit={handleSubmitVersion} sx={{ pt: 2 }}>
            <TextField
              label="Description des changements"
              multiline
              rows={4}
              fullWidth
              variant="outlined"
              value={changesDescription}
              onChange={(e) => setChangesDescription(e.target.value)}
              required
              sx={{ mb: 3 }}
            />

            <input
              accept="*/*"
              style={{ display: "none" }}
              id="version-file-upload"
              type="file"
              onChange={handleFileChange}
              required
            />
            <label htmlFor="version-file-upload">
              <Button
                variant="outlined"
                component="span"
                startIcon={<Upload />}
                sx={{ mr: 2 }}
              >
                Sélectionner un fichier
              </Button>
            </label>
            {file && (
              <Typography variant="body2" component="span">
                {file.name}
              </Typography>
            )}
          </Box>
        </DialogContent>
        <DialogActions>
          <Button
            onClick={() => setOpenVersionDialog(false)}
            startIcon={<Cancel />}
          >
            Annuler
          </Button>
          <Button
            type="submit"
            variant="contained"
            color="primary"
            startIcon={<Add />}
            onClick={handleSubmitVersion}
          >
            Enregistrer
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default DocumentDetails;
