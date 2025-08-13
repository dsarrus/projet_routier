import React, { useState, useEffect, useContext } from "react";
import {
  Box,
  Typography,
  Paper,
  Button,
  TextField,
  List,
  ListItem,
  ListItemText,
  ListItemAvatar,
  Avatar,
  Divider,
  Badge,
  Chip,
  IconButton,
  CircularProgress,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
} from "@mui/material";
import {
  Send,
  Add,
  Close,
  Refresh,
  Notifications,
  Mail,
  Person,
  Group,
} from "@mui/icons-material";
import AuthContext from "../../context/AuthContext";
import axios from "axios";
import { formatDateTime } from "../../utils/dateUtils";

const CommunicationTab = ({ lotId }) => {
  const [activeTab, setActiveTab] = useState(0);
  const [messages, setMessages] = useState([]);
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [showMessageDialog, setShowMessageDialog] = useState(false);
  const { user, token } = useContext(AuthContext);

  const [messageForm, setMessageForm] = useState({
    recipient: "",
    subject: "",
    content: "",
  });

  const [newNotification, setNewNotification] = useState({
    type: "",
    message: "",
    urgency: "normal",
  });

  useEffect(() => {
    fetchMessages();
    fetchNotifications();
  }, [lotId]);

  const fetchMessages = async () => {
    try {
      setLoading(true);
      const res = await axios.get(
        `http://localhost:5000/api/communications/${lotId}/messages`,
        { headers: { "x-auth-token": token } }
      );
      setMessages(res.data);
      setLoading(false);
    } catch (err) {
      setError("Erreur lors du chargement des messages");
      setLoading(false);
    }
  };

  const fetchNotifications = async () => {
    try {
      setLoading(true);
      const res = await axios.get(
        `http://localhost:5000/api/communications/${lotId}/notifications`,
        { headers: { "x-auth-token": token } }
      );
      setNotifications(res.data);
      setLoading(false);
    } catch (err) {
      setError("Erreur lors du chargement des notifications");
      setLoading(false);
    }
  };

  const handleSendMessage = async (e) => {
    e.preventDefault();
    try {
      setLoading(true);
      await axios.post(
        `http://localhost:5000/api/communications/${lotId}/messages`,
        messageForm,
        { headers: { "x-auth-token": token } }
      );
      fetchMessages();
      setShowMessageDialog(false);
      setMessageForm({
        recipient: "",
        subject: "",
        content: "",
      });
    } catch (err) {
      setError("Erreur lors de l'envoi du message");
      setLoading(false);
    }
  };

  const handleSendNotification = async (e) => {
    e.preventDefault();
    try {
      setLoading(true);
      await axios.post(
        `http://localhost:5000/api/communications/${lotId}/notifications`,
        newNotification,
        { headers: { "x-auth-token": token } }
      );
      fetchNotifications();
      setNewNotification({
        type: "",
        message: "",
        urgency: "normal",
      });
    } catch (err) {
      setError("Erreur lors de l'envoi de la notification");
      setLoading(false);
    }
  };

  const handleMarkAsRead = async (notificationId) => {
    try {
      await axios.patch(
        `http://localhost:5000/api/communications/notifications/${notificationId}/read`,
        {},
        { headers: { "x-auth-token": token } }
      );
      fetchNotifications();
    } catch (err) {
      setError("Erreur lors de la mise à jour de la notification");
    }
  };

  return (
    <Box sx={{ p: 3 }}>
      <Typography variant="h5" gutterBottom>
        Communication
      </Typography>

      <Box sx={{ display: "flex", gap: 2, mb: 3 }}>
        <Button
          variant={activeTab === 0 ? "contained" : "outlined"}
          startIcon={<Mail />}
          onClick={() => setActiveTab(0)}
        >
          Messagerie
        </Button>
        <Button
          variant={activeTab === 1 ? "contained" : "outlined"}
          startIcon={<Notifications />}
          onClick={() => setActiveTab(1)}
        >
          Notifications
        </Button>
      </Box>

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
            <Typography variant="h6">Messages</Typography>
            <Button
              variant="contained"
              startIcon={<Add />}
              onClick={() => setShowMessageDialog(true)}
            >
              Nouveau message
            </Button>
          </Box>

          {loading ? (
            <Box sx={{ display: "flex", justifyContent: "center", p: 4 }}>
              <CircularProgress />
            </Box>
          ) : error ? (
            <Typography color="error">{error}</Typography>
          ) : messages.length === 0 ? (
            <Typography>Aucun message</Typography>
          ) : (
            <List>
              {messages.map((message) => (
                <React.Fragment key={message.id}>
                  <ListItem alignItems="flex-start">
                    <ListItemAvatar>
                      <Avatar>
                        {message.sender === user.email ? (
                          <Send color="primary" />
                        ) : (
                          <Mail color="secondary" />
                        )}
                      </Avatar>
                    </ListItemAvatar>
                    <ListItemText
                      primary={
                        <>
                          <Typography
                            component="span"
                            fontWeight="bold"
                            sx={{ mr: 1 }}
                          >
                            {message.subject}
                          </Typography>
                          <Typography component="span" variant="caption">
                            {formatDateTime(message.createdAt)}
                          </Typography>
                        </>
                      }
                      secondary={
                        <>
                          <Typography
                            component="span"
                            sx={{
                              display: "inline-block",
                              mr: 1,
                              fontWeight: message.read ? "normal" : "bold",
                            }}
                          >
                            {message.sender === user.email
                              ? `À: ${message.recipient}`
                              : `De: ${message.sender}`}
                          </Typography>
                          {message.content.substring(0, 100)}...
                        </>
                      }
                    />
                  </ListItem>
                  <Divider variant="inset" component="li" />
                </React.Fragment>
              ))}
            </List>
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
            <Typography variant="h6">Notifications</Typography>
            <Button
              variant="contained"
              startIcon={<Refresh />}
              onClick={fetchNotifications}
            >
              Actualiser
            </Button>
          </Box>

          {loading ? (
            <Box sx={{ display: "flex", justifyContent: "center", p: 4 }}>
              <CircularProgress />
            </Box>
          ) : error ? (
            <Typography color="error">{error}</Typography>
          ) : notifications.length === 0 ? (
            <Typography>Aucune notification</Typography>
          ) : (
            <List>
              {notifications.map((notification) => (
                <React.Fragment key={notification.id}>
                  <ListItem
                    alignItems="flex-start"
                    sx={{
                      bgcolor: notification.read ? "inherit" : "action.hover",
                    }}
                  >
                    <ListItemAvatar>
                      <Badge
                        color="error"
                        variant="dot"
                        invisible={notification.read}
                      >
                        <Avatar>
                          {notification.type === "alert" ? (
                            <Notifications color="error" />
                          ) : (
                            <Notifications color="info" />
                          )}
                        </Avatar>
                      </Badge>
                    </ListItemAvatar>
                    <ListItemText
                      primary={
                        <>
                          <Typography
                            component="span"
                            fontWeight={notification.read ? "normal" : "bold"}
                            sx={{ mr: 1 }}
                          >
                            {notification.message}
                          </Typography>
                          <Chip
                            label={
                              notification.urgency === "high"
                                ? "Urgent"
                                : "Normal"
                            }
                            size="small"
                            color={
                              notification.urgency === "high"
                                ? "error"
                                : "default"
                            }
                          />
                        </>
                      }
                      secondary={formatDateTime(notification.createdAt)}
                    />
                    {!notification.read && (
                      <Button
                        size="small"
                        onClick={() => handleMarkAsRead(notification.id)}
                      >
                        Marquer comme lu
                      </Button>
                    )}
                  </ListItem>
                  <Divider variant="inset" component="li" />
                </React.Fragment>
              ))}
            </List>
          )}
        </Paper>
      )}

      {/* Dialog pour nouveau message */}
      <Dialog
        open={showMessageDialog}
        onClose={() => setShowMessageDialog(false)}
        fullWidth
        maxWidth="sm"
      >
        <DialogTitle>Nouveau message</DialogTitle>
        <DialogContent>
          <Box component="form" sx={{ mt: 2 }}>
            <TextField
              fullWidth
              label="Destinataire"
              value={messageForm.recipient}
              onChange={(e) =>
                setMessageForm({ ...messageForm, recipient: e.target.value })
              }
              sx={{ mb: 2 }}
            />

            <TextField
              fullWidth
              label="Sujet"
              value={messageForm.subject}
              onChange={(e) =>
                setMessageForm({ ...messageForm, subject: e.target.value })
              }
              sx={{ mb: 2 }}
            />

            <TextField
              fullWidth
              label="Message"
              multiline
              rows={6}
              value={messageForm.content}
              onChange={(e) =>
                setMessageForm({ ...messageForm, content: e.target.value })
              }
            />
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setShowMessageDialog(false)}>Annuler</Button>
          <Button
            onClick={handleSendMessage}
            variant="contained"
            disabled={loading}
            endIcon={<Send />}
          >
            Envoyer
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default CommunicationTab;
