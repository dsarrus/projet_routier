import React, { useState, useEffect, useContext } from "react";
import { useSnackbar } from "notistack";
import {
  Box,
  Typography,
  Tabs,
  Tab,
  Paper,
  Button,
  TextField,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Chip,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  MenuItem,
  Select,
  InputLabel,
  FormControl,
  Divider,
  IconButton,
  CircularProgress,
} from "@mui/material";
import {
  Add,
  CalendarToday,
  Send,
  Delete,
  Edit,
  Close,
  Refresh,
  Visibility,
} from "@mui/icons-material";
import AuthContext from "../../context/AuthContext";
import { formatDate, formatDateTime } from "../../utils/dateUtils";
import api from "../../services/api";

const ActivitiesTab = ({ lotId }) => {
  const { enqueueSnackbar } = useSnackbar();
  const [viewingPV, setViewingPV] = useState(null);
  const [showViewPVDialog, setShowViewPVDialog] = useState(false);
  const [activeTab, setActiveTab] = useState(0);
  const [activities, setActivities] = useState([]);
  const [meetings, setMeetings] = useState([]);
  const [editingActivity, setEditingActivity] = useState(null);
  const [editingMeeting, setEditingMeeting] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [showActivityDialog, setShowActivityDialog] = useState(false);
  const [showMeetingDialog, setShowMeetingDialog] = useState(false);
  const [showPVDialog, setShowPVDialog] = useState(false);
  const { user, token } = useContext(AuthContext);

  const [usualParticipants, setUsualParticipants] = useState([]);
  const [showParticipantDialog, setShowParticipantDialog] = useState(false);
  const [newParticipant, setNewParticipant] = useState({
    email: "",
    name: "",
    role: "",
  });
  const [activityForm, setActivityForm] = useState({
    date: new Date().toISOString().split("T")[0],
    weather: "",
    workforce: "",
    incidents: "",
    observations: "",
  });

  const [meetingForm, setMeetingForm] = useState({
    title: "",
    date: "",
    time: "",
    location: "",
    participants: [],
    agenda: "",
  });

  const [pvForm, setPvForm] = useState({
    meetingId: "",
    content: "",
    decisions: "",
    next_steps: "",
  });

  useEffect(() => {
    fetchActivities();
    fetchMeetings();
    fetchUsualParticipants();
  }, [lotId]);

  const fetchActivities = async () => {
    try {
      setLoading(true);
      const res = await api.get(`/api/lots/${lotId}/activities`, {
        headers: { "x-auth-token": token },
      });
      setActivities(res.data);
      setLoading(false);
    } catch (err) {
      setError("Erreur lors du chargement des activités");
      setLoading(false);
    }
  };

  const fetchMeetings = async () => {
    try {
      setLoading(true);
      const res = await api.get(`/api/lots/${lotId}/meetings`, {
        headers: { "x-auth-token": token },
      });
      setMeetings(res.data);
      setLoading(false);
    } catch (err) {
      setError("Erreur lors du chargement des réunions");
      setLoading(false);
    }
  };

  const fetchUsualParticipants = async () => {
    try {
      const res = await api.get(`/api/meetings/${lotId}/usual-participants`, {
        headers: { "x-auth-token": token },
      });
      setUsualParticipants(res.data);
    } catch (err) {
      console.error("Failed to fetch usual participants", err);
    }
  };

  const validateActivityForm = () => {
    const errors = [];
    if (!activityForm.date) errors.push("La date est requise");
    if (!activityForm.weather) errors.push("La météo est requise");
    if (!activityForm.workforce) errors.push("Les effectifs sont requis");
    return errors;
  };

  const validateMeetingForm = () => {
    const errors = [];
    if (!meetingForm.title) errors.push("Le titre est requis");
    if (!meetingForm.date) errors.push("La date est requise");
    if (!meetingForm.time) errors.push("L'heure est requise");
    if (!meetingForm.location) errors.push("Le lieu est requis");
    return errors;
  };

  const validatePVForm = () => {
    const errors = [];
    if (!pvForm.content) errors.push("Le contenu est requis");
    if (!pvForm.decisions) errors.push("Le contenu des decisions est requis");
    if (!pvForm.next_steps)
      errors.push("Le contenu des prochaines étapes est requis");
    return errors;
  };

  const handleActivitySubmit = async (e) => {
    e.preventDefault();

    const errors = validateActivityForm();
    if (errors.length > 0) {
      errors.forEach((error) => enqueueSnackbar(error, { variant: "error" }));
      return;
    }

    try {
      setLoading(true);
      const url = editingActivity
        ? `/api/activities/${editingActivity}`
        : `/api/activities/${lotId}`;

      const method = editingActivity ? "put" : "post";

      await api[method](url, activityForm, {
        headers: { "x-auth-token": token },
      });

      enqueueSnackbar(
        editingActivity
          ? "Activité mise à jour avec succès"
          : "Activité enregistrée avec succès",
        { variant: "success" }
      );

      fetchActivities();
      setShowActivityDialog(false);
      setActivityForm({
        date: new Date().toISOString().split("T")[0],
        weather: "",
        workforce: "",
        incidents: "",
        observations: "",
      });
      setEditingActivity(null);
    } catch (err) {
      enqueueSnackbar(
        err.response?.data?.message || "Erreur lors de l'enregistrement",
        { variant: "error" }
      );
    } finally {
      setLoading(false);
    }
  };

  const handleMeetingSubmit = async (e) => {
    e.preventDefault();

    const errors = validateMeetingForm();
    if (errors.length > 0) {
      errors.forEach((error) => enqueueSnackbar(error, { variant: "error" }));
      return;
    }

    try {
      setLoading(true);
      const url = editingMeeting
        ? `/api/meetings/${editingMeeting}`
        : `/api/meetings/${lotId}`;

      const method = editingMeeting ? "put" : "post";
      await api[method](url, meetingForm, {
        headers: { "x-auth-token": token },
      });

      enqueueSnackbar(
        editingMeeting
          ? "Planification de réunion mise à jour avec succès"
          : "Réunion planifiée avec succès",
        { variant: "success" }
      );
      fetchMeetings();
      setShowMeetingDialog(false);
      setMeetingForm({
        title: "",
        date: "",
        time: "",
        location: "",
        participants: [],
        agenda: "",
      });
      setEditingMeeting(null);
    } catch (err) {
      enqueueSnackbar(
        err.response?.data?.message || "Erreur lors de la planification",
        { variant: "error" }
      );
    } finally {
      setLoading(false);
    }
  };

  const handlePVSubmit = async (e) => {
    e.preventDefault();

    const errors = validatePVForm();
    if (errors.length > 0) {
      errors.forEach((error) => enqueueSnackbar(error, { variant: "error" }));
      return;
    }

    try {
      setLoading(true);

      // Vérifier si le PV existe déjà (édition)
      console.log(meetings);
      const meeting = meetings.find((m) => m.id === pvForm.meetingId);
      console.log(meeting);
      const method = meeting.has_minutes ? "put" : "post";

      await api[method](
        `/api/meetings/${pvForm.meetingId}/pv`,
        {
          content: pvForm.content,
          decisions: pvForm.decisions,
          next_steps: pvForm.next_steps,
        },
        { headers: { "x-auth-token": token } }
      );

      enqueueSnackbar(
        meeting?.has_minutes
          ? "PV mis à jour avec succès"
          : "PV enregistré avec succès",
        { variant: "success" }
      );

      fetchMeetings();
      setShowPVDialog(false);
      setPvForm({
        meetingId: "",
        content: "",
        decisions: "",
        next_steps: "",
      });
    } catch (err) {
      enqueueSnackbar(
        err.response?.data?.message || "Erreur lors de l'enregistrement",
        { variant: "error" }
      );
    } finally {
      setLoading(false);
    }
  };
  // Fonction pour afficher un PV existant
  const handleViewPV = async (meetingId) => {
    try {
      const res = await api.get(`/api/meetings/${meetingId}/pv`, {
        headers: { "x-auth-token": token },
      });
      setViewingPV(res.data);
      setShowViewPVDialog(true);
    } catch (err) {
      enqueueSnackbar(
        err.response?.data?.message || "Erreur lors du chargement du PV",
        { variant: "error" }
      );
    }
  };

  // Fonction pour éditer un PV existant
  const handleEditPV = async (meeting) => {
    try {
      const res = await api.get(`/api/meetings/${meeting.id}/pv`, {
        headers: { "x-auth-token": token },
      });
      const pv = res.data;

      setPvForm({
        meetingId: meeting.id,
        content: pv.content || "",
        decisions: pv.decisions || "",
        next_steps: pv.next_steps || "",
      });
      setShowPVDialog(true);
    } catch (err) {
      enqueueSnackbar(
        err.response?.data?.message || "Erreur lors du chargement du PV",
        { variant: "error" }
      );
    }
  };

  // Fonction pour supprimer un PV
  const handleDeletePV = async (meetingId) => {
    try {
      const confirm = window.confirm(
        "Êtes-vous sûr de vouloir supprimer ce PV ?"
      );
      if (!confirm) return;

      await api.delete(`/api/meetings/${meetingId}/pv`, {
        headers: { "x-auth-token": token },
      });

      enqueueSnackbar("PV supprimé avec succès", { variant: "success" });
      fetchMeetings();
    } catch (err) {
      enqueueSnackbar(
        err.response?.data?.message || "Erreur lors de la suppression",
        { variant: "error" }
      );
    }
  };
  const handleSendInvitations = async (meetingId) => {
    try {
      setLoading(true);
      await api.post(
        `/api/meetings/${meetingId}/send-invitations`,
        {},
        { headers: { "x-auth-token": token } }
      );

      enqueueSnackbar("Invitations envoyées avec succès", {
        variant: "success",
      });
      fetchMeetings();
    } catch (err) {
      enqueueSnackbar(err.response?.data?.message || "Erreur lors de l'envoi", {
        variant: "error",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleEditActivity = (activity) => {
    setActivityForm({
      date: activity.date.split("T")[0],
      weather: activity.weather,
      workforce: activity.workforce,
      incidents: activity.incidents,
      observations: activity.observations,
    });
    setEditingActivity(activity.id);
    setShowActivityDialog(true);
  };

  const handleDeleteActivity = async (activityId) => {
    try {
      const confirm = window.confirm(
        "Êtes-vous sûr de vouloir supprimer cette activité ?"
      );
      if (!confirm) return;

      await api.delete(`/api/activities/${activityId}`, {
        headers: { "x-auth-token": token },
      });
      enqueueSnackbar("Activité supprimée avec succès", { variant: "success" });
      fetchActivities();
    } catch (err) {
      enqueueSnackbar(
        err.response?.data?.message || "Erreur lors de la suppression",
        { variant: "error" }
      );
    }
  };

  const handleEditMeeting = (meeting) => {
    setMeetingForm({
      title: meeting.title,
      date: meeting.date.split("T")[0],
      time: meeting.time,
      location: meeting.location,
      participants: meeting.participants,
      agenda: meeting.agenda,
    });
    setEditingMeeting(meeting.id);
    setShowMeetingDialog(true);
  };

  const handleDeleteMeeting = async (meetingId) => {
    try {
      const confirm = window.confirm(
        "Êtes-vous sûr de vouloir supprimer cette réunion ?"
      );
      if (!confirm) return;
      await api.delete(`/api/meetings/${meetingId}`, {
        headers: { "x-auth-token": token },
      });
      enqueueSnackbar("Réunion supprimée avec succès", { variant: "success" });
      fetchMeetings();
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
        Activités du chantier
      </Typography>

      <Tabs
        value={activeTab}
        onChange={(e, newValue) => setActiveTab(newValue)}
        sx={{ mb: 3 }}
      >
        <Tab label="Journal de chantier" />
        <Tab label="Gestion des réunions" />
      </Tabs>

      {activeTab === 0 && (
        <Paper sx={{ p: 3, mb: 3 }}>
          <Box
            sx={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              mb: 3,
            }}
          >
            <Typography variant="h6">Journal quotidien</Typography>
            <Button
              variant="contained"
              startIcon={<Add />}
              onClick={() => setShowActivityDialog(true)}
            >
              Nouvelle entrée
            </Button>
          </Box>

          {loading ? (
            <Box sx={{ display: "flex", justifyContent: "center", p: 4 }}>
              <CircularProgress />
            </Box>
          ) : error ? (
            <Typography color="error">{error}</Typography>
          ) : activities.length === 0 ? (
            <Typography>Aucune activité enregistrée</Typography>
          ) : (
            <TableContainer>
              <Table>
                <TableHead>
                  <TableRow>
                    <TableCell>Date</TableCell>
                    <TableCell>Météo</TableCell>
                    <TableCell>Effectifs</TableCell>
                    <TableCell>Incidents</TableCell>
                    <TableCell>Observations</TableCell>
                    <TableCell>Créé par</TableCell>
                    <TableCell>Action</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {activities.map((activity) => (
                    <TableRow key={activity.id}>
                      <TableCell>{formatDate(activity.date)}</TableCell>
                      <TableCell>
                        <Chip label={activity.weather} size="small" />
                      </TableCell>
                      <TableCell>{activity.workforce}</TableCell>
                      <TableCell>
                        {activity.incidents || "Aucun incident"}
                      </TableCell>
                      <TableCell sx={{ maxWidth: 300 }}>
                        {activity.observations || "Aucune observation"}
                      </TableCell>
                      <TableCell>{activity.creator_name}</TableCell>
                      <TableCell>
                        <IconButton
                          onClick={() => handleEditActivity(activity)}
                          color="primary"
                          size="small"
                          sx={{ mr: 1 }}
                        >
                          <Edit fontSize="small" />
                        </IconButton>
                        <IconButton
                          onClick={() => handleDeleteActivity(activity.id)}
                          color="error"
                          size="small"
                        >
                          <Delete fontSize="small" />
                        </IconButton>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          )}
        </Paper>
      )}

      {activeTab === 1 && (
        <Paper sx={{ p: 3 }}>
          <Box
            sx={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              mb: 3,
            }}
          >
            <Typography variant="h6">Réunions de chantier</Typography>
            <Button
              variant="contained"
              startIcon={<Add />}
              onClick={() => setShowMeetingDialog(true)}
            >
              Planifier une réunion
            </Button>
          </Box>

          {loading ? (
            <Box sx={{ display: "flex", justifyContent: "center", p: 4 }}>
              <CircularProgress />
            </Box>
          ) : error ? (
            <Typography color="error">{error}</Typography>
          ) : meetings.length === 0 ? (
            <Typography>Aucune réunion planifiée</Typography>
          ) : (
            <TableContainer>
              <Table>
                <TableHead>
                  <TableRow>
                    <TableCell>Titre</TableCell>
                    <TableCell>Date</TableCell>
                    <TableCell>Lieu</TableCell>
                    <TableCell>Participants</TableCell>
                    <TableCell>PV</TableCell>
                    <TableCell>Actions</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {meetings.map((meeting) => (
                    <TableRow key={meeting.id}>
                      <TableCell>{meeting.title}</TableCell>
                      <TableCell>
                        {formatDate(meeting.date)} {meeting.time}
                      </TableCell>
                      <TableCell>{meeting.location}</TableCell>
                      <TableCell>
                        {meeting.participants?.length || 0} participants
                      </TableCell>
                      <TableCell>
                        {meeting.has_minutes ? (
                          <Chip
                            label="Disponible"
                            color="success"
                            size="small"
                          />
                        ) : (
                          <Chip label="En attente" size="small" />
                        )}
                      </TableCell>
                      <TableCell>
                        <Box
                          sx={{
                            display: "flex",
                            flexDirection: "column",
                            gap: 1,
                          }}
                        >
                          {/* Boutons d'édition et suppression toujours visibles */}
                          <Box sx={{ display: "flex", gap: 0.5 }}>
                            <IconButton
                              onClick={() => handleEditMeeting(meeting)}
                              color="primary"
                              size="small"
                            >
                              <Edit fontSize="small" />
                            </IconButton>
                            <IconButton
                              onClick={() => handleDeleteMeeting(meeting.id)}
                              color="error"
                              size="small"
                            >
                              <Delete fontSize="small" />
                            </IconButton>
                          </Box>

                          {/* Bouton d'envoi d'invitations - seulement si pas encore envoyées */}
                          {!meeting.invitations_sent && (
                            <Button
                              size="small"
                              startIcon={<Send />}
                              onClick={() => handleSendInvitations(meeting.id)}
                              variant="outlined"
                              sx={{ mt: 0.5 }}
                            >
                              Envoyer invitations
                            </Button>
                          )}

                          {/* Gestion du PV */}
                          {meeting.has_minutes ? (
                            <Box
                              sx={{
                                display: "flex",
                                gap: 0.5,
                                mt: 0.5,
                                flexWrap: "wrap",
                              }}
                            >
                              <Button
                                size="small"
                                startIcon={<Visibility />}
                                onClick={() => handleViewPV(meeting.id)}
                                variant="outlined"
                              >
                                Voir PV
                              </Button>
                              <Button
                                size="small"
                                startIcon={<Edit />}
                                onClick={() => handleEditPV(meeting)}
                                variant="outlined"
                              >
                                Modifier PV
                              </Button>
                              <Button
                                size="small"
                                startIcon={<Delete />}
                                onClick={() => handleDeletePV(meeting.id)}
                                variant="outlined"
                                color="error"
                              >
                                Supprimer PV
                              </Button>
                            </Box>
                          ) : (
                            <Button
                              size="small"
                              startIcon={<Add />}
                              onClick={() => {
                                setPvForm({ ...pvForm, meetingId: meeting.id });
                                setShowPVDialog(true);
                              }}
                              variant="contained"
                              sx={{ mt: 0.5 }}
                            >
                              Rédiger PV
                            </Button>
                          )}
                        </Box>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          )}
        </Paper>
      )}

      {/* Dialog pour nouvelle activité */}
      <Dialog
        open={showActivityDialog}
        onClose={() => setShowActivityDialog(false)}
        fullWidth
        maxWidth="sm"
      >
        <DialogTitle>Nouvelle entrée journalière</DialogTitle>
        <DialogContent>
          <Box component="form" sx={{ mt: 2 }}>
            <TextField
              fullWidth
              label="Date"
              type="date"
              value={activityForm.date}
              onChange={(e) =>
                setActivityForm({ ...activityForm, date: e.target.value })
              }
              InputLabelProps={{ shrink: true }}
              sx={{ mb: 2 }}
              required
              error={!activityForm.date}
              helperText={!activityForm.date && "Ce champ est requis"}
            />

            <FormControl
              fullWidth
              sx={{ mb: 2 }}
              required
              error={!activityForm.weather}
            >
              <InputLabel>Météo</InputLabel>
              <Select
                value={activityForm.weather}
                label="Météo"
                onChange={(e) =>
                  setActivityForm({ ...activityForm, weather: e.target.value })
                }
              >
                <MenuItem value="Ensoleillé">Ensoleillé</MenuItem>
                <MenuItem value="Nuageux">Nuageux</MenuItem>
                <MenuItem value="Pluvieux">Pluvieux</MenuItem>
                <MenuItem value="Neige">Neige</MenuItem>
                <MenuItem value="Venteux">Venteux</MenuItem>
              </Select>
              {!activityForm.weather && (
                <Typography variant="caption" color="error">
                  Ce champ est requis
                </Typography>
              )}
            </FormControl>

            <TextField
              fullWidth
              label="Effectifs (nombre)"
              type="number"
              value={activityForm.workforce}
              onChange={(e) =>
                setActivityForm({ ...activityForm, workforce: e.target.value })
              }
              sx={{ mb: 2 }}
              required
              error={!activityForm.workforce}
              helperText={!activityForm.workforce && "Ce champ est requis"}
            />

            <TextField
              fullWidth
              label="Incidents"
              multiline
              rows={2}
              value={activityForm.incidents}
              onChange={(e) =>
                setActivityForm({ ...activityForm, incidents: e.target.value })
              }
              sx={{ mb: 2 }}
            />

            <TextField
              fullWidth
              label="Observations"
              multiline
              rows={3}
              value={activityForm.observations}
              onChange={(e) =>
                setActivityForm({
                  ...activityForm,
                  observations: e.target.value,
                })
              }
            />
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setShowActivityDialog(false)}>Annuler</Button>
          <Button
            onClick={handleActivitySubmit}
            variant="contained"
            disabled={loading}
          >
            {loading ? <CircularProgress size={24} /> : "Enregistrer"}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Dialog pour nouvelle réunion */}
      <Dialog
        open={showMeetingDialog}
        onClose={() => setShowMeetingDialog(false)}
        fullWidth
        maxWidth="sm"
      >
        <DialogTitle>Planifier une réunion</DialogTitle>
        <DialogContent>
          <Box component="form" sx={{ mt: 2 }}>
            <TextField
              fullWidth
              label="Titre de la réunion"
              value={meetingForm.title}
              onChange={(e) =>
                setMeetingForm({ ...meetingForm, title: e.target.value })
              }
              sx={{ mb: 2 }}
            />

            <Box sx={{ display: "flex", gap: 2, mb: 2 }}>
              <TextField
                fullWidth
                label="Date"
                type="date"
                value={meetingForm.date}
                onChange={(e) =>
                  setMeetingForm({ ...meetingForm, date: e.target.value })
                }
                InputLabelProps={{ shrink: true }}
              />

              <TextField
                fullWidth
                label="Heure"
                type="time"
                value={meetingForm.time}
                onChange={(e) =>
                  setMeetingForm({ ...meetingForm, time: e.target.value })
                }
                InputLabelProps={{ shrink: true }}
              />
            </Box>

            <TextField
              fullWidth
              label="Lieu"
              value={meetingForm.location}
              onChange={(e) =>
                setMeetingForm({ ...meetingForm, location: e.target.value })
              }
              sx={{ mb: 2 }}
            />

            <FormControl fullWidth sx={{ mb: 2 }}>
              <InputLabel>Participants</InputLabel>
              <Select
                multiple
                value={meetingForm.participants}
                onChange={(e) =>
                  setMeetingForm({
                    ...meetingForm,
                    participants: e.target.value,
                  })
                }
                renderValue={(selected) => selected.join(", ")}
              >
                {usualParticipants.map((participant) => (
                  <MenuItem key={participant.email} value={participant.email}>
                    {participant.name} ({participant.email}) -{" "}
                    {participant.role}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>

            <Button
              onClick={() => setShowParticipantDialog(true)}
              startIcon={<Add />}
            >
              Ajouter un participant habituel
            </Button>

            <TextField
              fullWidth
              label="Ordre du jour"
              multiline
              rows={4}
              value={meetingForm.agenda}
              onChange={(e) =>
                setMeetingForm({ ...meetingForm, agenda: e.target.value })
              }
            />
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setShowMeetingDialog(false)}>Annuler</Button>
          <Button
            onClick={handleMeetingSubmit}
            variant="contained"
            disabled={loading}
          >
            Planifier
          </Button>
        </DialogActions>
      </Dialog>
      <Dialog
        open={showParticipantDialog}
        onClose={() => setShowParticipantDialog(false)}
      >
        <DialogTitle>Ajouter un participant habituel</DialogTitle>
        <DialogContent>
          <TextField
            fullWidth
            label="Email"
            value={newParticipant.email}
            onChange={(e) =>
              setNewParticipant({ ...newParticipant, email: e.target.value })
            }
            sx={{ mb: 2 }}
          />
          <TextField
            fullWidth
            label="Nom"
            value={newParticipant.name}
            onChange={(e) =>
              setNewParticipant({ ...newParticipant, name: e.target.value })
            }
            sx={{ mb: 2 }}
          />
          <TextField
            fullWidth
            label="Rôle"
            value={newParticipant.role}
            onChange={(e) =>
              setNewParticipant({ ...newParticipant, role: e.target.value })
            }
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setShowParticipantDialog(false)}>
            Annuler
          </Button>
          <Button
            onClick={async () => {
              await api.post(
                `/api/meetings/${lotId}/usual-participants`,
                newParticipant,
                { headers: { "x-auth-token": token } }
              );
              fetchUsualParticipants();
              setShowParticipantDialog(false);
              setNewParticipant({ email: "", name: "", role: "" });
            }}
            variant="contained"
          >
            Ajouter
          </Button>
        </DialogActions>
      </Dialog>
      {/* Dialog pour créer/éditer un PV */}
      <Dialog
        open={showPVDialog}
        onClose={() => setShowPVDialog(false)}
        fullWidth
        maxWidth="md"
      >
        <DialogTitle>
          {meetings.find((m) => m.id === pvForm.meetingId)?.has_minutes
            ? "Modifier le procès-verbal"
            : "Rédiger le procès-verbal"}
        </DialogTitle>
        <DialogContent>
          <Box component="form" sx={{ mt: 2 }}>
            <Typography variant="subtitle1" gutterBottom>
              Réunion: {meetings.find((m) => m.id === pvForm.meetingId)?.title}
            </Typography>

            <TextField
              fullWidth
              label="Contenu de la réunion *"
              multiline
              rows={6}
              value={pvForm.content}
              onChange={(e) =>
                setPvForm({ ...pvForm, content: e.target.value })
              }
              sx={{ mb: 2 }}
              required
              error={!pvForm.content}
              helperText={!pvForm.content && "Ce champ est requis"}
            />

            <TextField
              fullWidth
              label="Décisions prises"
              multiline
              rows={3}
              value={pvForm.decisions}
              onChange={(e) =>
                setPvForm({ ...pvForm, decisions: e.target.value })
              }
              sx={{ mb: 2 }}
            />

            <TextField
              fullWidth
              label="Prochaines étapes"
              multiline
              rows={3}
              value={pvForm.next_steps}
              onChange={(e) =>
                setPvForm({ ...pvForm, next_steps: e.target.value })
              }
            />
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setShowPVDialog(false)}>Annuler</Button>
          <Button
            onClick={handlePVSubmit}
            variant="contained"
            disabled={loading || !pvForm.content}
          >
            {loading ? (
              <CircularProgress size={24} />
            ) : meetings.find((m) => m.id === pvForm.meetingId)?.has_minutes ? (
              "Modifier "
            ) : (
              "Enregistrer"
            )}
          </Button>
        </DialogActions>
      </Dialog>
      {/* Dialog pour visualiser un PV */}
      <Dialog
        open={showViewPVDialog}
        onClose={() => setShowViewPVDialog(false)}
        fullWidth
        maxWidth="md"
      >
        <DialogTitle>
          Procès-verbal - {viewingPV?.meeting_title}
          <IconButton
            onClick={() => setShowViewPVDialog(false)}
            sx={{ position: "absolute", right: 8, top: 8 }}
          >
            <Close />
          </IconButton>
        </DialogTitle>
        <DialogContent>
          {viewingPV && (
            <Box sx={{ mt: 2 }}>
              <Typography variant="h6" gutterBottom>
                Contenu de la réunion
              </Typography>
              <Paper sx={{ p: 2, mb: 2, backgroundColor: "grey.50" }}>
                <Typography>{viewingPV.content}</Typography>
              </Paper>

              {viewingPV.decisions && (
                <>
                  <Typography variant="h6" gutterBottom>
                    Décisions prises
                  </Typography>
                  <Paper sx={{ p: 2, mb: 2, backgroundColor: "grey.50" }}>
                    <Typography>{viewingPV.decisions}</Typography>
                  </Paper>
                </>
              )}

              {viewingPV.next_steps && (
                <>
                  <Typography variant="h6" gutterBottom>
                    Prochaines étapes
                  </Typography>
                  <Paper sx={{ p: 2, backgroundColor: "grey.50" }}>
                    <Typography>{viewingPV.next_steps}</Typography>
                  </Paper>
                </>
              )}

              <Box
                sx={{ mt: 3, display: "flex", justifyContent: "space-between" }}
              >
                <Typography variant="body2" color="text.secondary">
                  Créé le: {formatDateTime(viewingPV.created_at)}
                </Typography>
                {viewingPV.updated_at !== viewingPV.created_at && (
                  <Typography variant="body2" color="text.secondary">
                    Modifié le: {formatDateTime(viewingPV.updated_at)}
                  </Typography>
                )}
              </Box>
            </Box>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setShowViewPVDialog(false)}>Fermer</Button>
          {viewingPV && (
            <Button
              onClick={() => {
                setShowViewPVDialog(false);
                handleEditPV({ id: viewingPV.meeting_id, pv: viewingPV });
              }}
              variant="contained"
            >
              Modifier le PV
            </Button>
          )}
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default ActivitiesTab;
