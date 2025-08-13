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
} from "@mui/icons-material";
import AuthContext from "../../context/AuthContext";
import axios from "axios";
import { formatDate, formatDateTime } from "../../utils/dateUtils";

const ActivitiesTab = ({ lotId }) => {
  const { enqueueSnackbar } = useSnackbar();
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
  const actionButtonStyle = {
    "&:hover": {
      backgroundColor: "rgba(0, 0, 0, 0.04)",
    },
  };

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
    nextSteps: "",
  });

  useEffect(() => {
    fetchActivities();
    fetchMeetings();
  }, [lotId]);

  const fetchActivities = async () => {
    try {
      setLoading(true);
      const res = await axios.get(
        `http://localhost:5000/api/lots/${lotId}/activities`,
        { headers: { "x-auth-token": token } }
      );
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
      const res = await axios.get(
        `http://localhost:5000/api/lots/${lotId}/meetings`,
        { headers: { "x-auth-token": token } }
      );
      setMeetings(res.data);
      setLoading(false);
    } catch (err) {
      setError("Erreur lors du chargement des réunions");
      setLoading(false);
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
        ? `http://localhost:5000/api/activities/${editingActivity}`
        : `http://localhost:5000/api/activities/${lotId}`;

      const method = editingActivity ? "put" : "post";

      await axios[method](url, activityForm, {
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
        ? `http://localhost:5000/api/meetings/${editingMeeting}`
        : `http://localhost:5000/api/meetings/${lotId}`;

      const method = editingMeeting ? "put" : "post";
      await axios[method](url, meetingForm, {
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
      await axios.post(
        `http://localhost:5000/api/meetings/${pvForm.meetingId}/pv`,
        {
          content: pvForm.content,
          decisions: pvForm.decisions,
          nextSteps: pvForm.nextSteps,
        },
        { headers: { "x-auth-token": token } }
      );

      enqueueSnackbar("PV enregistré avec succès", { variant: "success" });
      fetchMeetings();
      setShowPVDialog(false);
      setPvForm({
        meetingId: "",
        content: "",
        decisions: "",
        nextSteps: "",
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

  const handleSendInvitations = async (meetingId) => {
    try {
      setLoading(true);
      await axios.post(
        `http://localhost:5000/api/meetings/${meetingId}/send-invitations`,
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

      await axios.delete(`http://localhost:5000/api/activities/${activityId}`, {
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
      await axios.delete(`http://localhost:5000/api/meetings/${meetingId}`, {
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
                          sx={{ ...actionButtonStyle, mr: 1 }}
                        >
                          <Edit />
                        </IconButton>
                        <IconButton
                          onClick={() => handleDeleteActivity(activity.id)}
                          color="error"
                        >
                          <Delete />
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
                        {formatDateTime(meeting.date, meeting.time)}
                      </TableCell>
                      <TableCell>{meeting.location}</TableCell>
                      <TableCell>
                        {meeting.participants.length} participants
                      </TableCell>
                      <TableCell>
                        {meeting.pv ? (
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
                        {!meeting.pv && (
                          <>
                            <IconButton
                              onClick={() => handleEditMeeting(meeting)}
                              color="primary"
                              sx={{ ...actionButtonStyle, mr: 1 }}
                            >
                              <Edit />
                            </IconButton>
                            <IconButton
                              onClick={() => handleDeleteMeeting(meeting.id)}
                              color="error"
                              sx={{ mr: 1 }}
                            >
                              <Delete />
                            </IconButton>
                          </>
                        )}
                        {!meeting.invitationsSent && (
                          <Button
                            size="small"
                            startIcon={<Send />}
                            onClick={() => handleSendInvitations(meeting.id)}
                            sx={{ mr: 1 }}
                          >
                            Envoyer invitations
                          </Button>
                        )}
                        {!meeting.pv && (
                          <Button
                            size="small"
                            startIcon={<Edit />}
                            onClick={() => {
                              setPvForm({ ...pvForm, meetingId: meeting.id });
                              setShowPVDialog(true);
                            }}
                          >
                            Rédiger PV
                          </Button>
                        )}
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

            <TextField
              fullWidth
              label="Participants (emails séparés par des virgules)"
              value={meetingForm.participants.join(",")}
              onChange={(e) =>
                setMeetingForm({
                  ...meetingForm,
                  participants: e.target.value.split(","),
                })
              }
              sx={{ mb: 2 }}
            />

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

      {/* Dialog pour PV de réunion */}
      <Dialog
        open={showPVDialog}
        onClose={() => setShowPVDialog(false)}
        fullWidth
        maxWidth="md"
      >
        <DialogTitle>Procès-verbal de réunion</DialogTitle>
        <DialogContent>
          <Box component="form" sx={{ mt: 2 }}>
            <TextField
              fullWidth
              label="Contenu de la réunion"
              multiline
              rows={6}
              value={pvForm.content}
              onChange={(e) =>
                setPvForm({ ...pvForm, content: e.target.value })
              }
              sx={{ mb: 2 }}
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
              value={pvForm.nextSteps}
              onChange={(e) =>
                setPvForm({ ...pvForm, nextSteps: e.target.value })
              }
            />
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setShowPVDialog(false)}>Annuler</Button>
          <Button
            onClick={handlePVSubmit}
            variant="contained"
            disabled={loading}
          >
            Enregistrer PV
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default ActivitiesTab;
