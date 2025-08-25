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
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Tabs,
  Tab,
  Alert,
  Card,
  CardContent,
  CardActions,
  Checkbox,
  ListItemIcon,
  ListItemButton,
} from "@mui/material";
import {
  Send,
  Add,
  Refresh,
  Notifications,
  Mail,
  Reply,
  Forward,
  ArrowBack,
  Inbox,
  Outbox,
  MarkEmailRead,
  People,
} from "@mui/icons-material";
import AuthContext from "../../context/AuthContext";
import api from "../../services/api";
import { formatDateTime, formatRelativeTime } from "../../utils/dateUtils";

const CommunicationTab = ({ lotId }) => {
  const [activeMainTab, setActiveMainTab] = useState(0);
  const [activeMessageTab, setActiveMessageTab] = useState(0);
  const [messages, setMessages] = useState({
    received: [],
    sent: [],
  });
  const [notifications, setNotifications] = useState([]);
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState({
    received: false,
    sent: false,
    notifications: false,
    users: false,
    sending: false,
  });
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);
  const [showMessageDialog, setShowMessageDialog] = useState(false);
  const [showRecipientDialog, setShowRecipientDialog] = useState(false);
  const [selectedMessage, setSelectedMessage] = useState(null);
  const [dialogMode, setDialogMode] = useState("new");
  const { user, token } = useContext(AuthContext);

  const [messageForm, setMessageForm] = useState({
    recipientIds: [],
    subject: "",
    content: "",
    urgency: "normal",
  });

  const [selectedRecipients, setSelectedRecipients] = useState([]);

  useEffect(() => {
    fetchUsers();
    fetchMessages();
    fetchNotifications();
  }, [lotId]);

  const fetchUsers = async () => {
    try {
      setLoading((prev) => ({ ...prev, users: true }));
      const res = await api.get(`/api/users`, {
        headers: { "x-auth-token": token },
      });
      setUsers(res.data.filter((u) => u.id !== user.id));
      setLoading((prev) => ({ ...prev, users: false }));
    } catch (err) {
      setError("Erreur lors du chargement des utilisateurs");
      setLoading((prev) => ({ ...prev, users: false }));
    }
  };

  const fetchMessages = async () => {
    try {
      setLoading((prev) => ({ ...prev, received: true, sent: true }));

      const res = await api.get(`/api/communications/${lotId}/messages`, {
        params: { userId: user.id },
        headers: { "x-auth-token": token },
      });

      const receivedMessages = res.data.filter(
        (msg) => msg.recipient_id === user.id
      );
      const sentMessages = res.data.filter((msg) => msg.sender_id === user.id);

      setMessages({
        received: receivedMessages,
        sent: sentMessages,
      });

      setLoading((prev) => ({ ...prev, received: false, sent: false }));
    } catch (err) {
      setError("Erreur lors du chargement des messages");
      setLoading((prev) => ({ ...prev, received: false, sent: false }));
    }
  };

  const fetchNotifications = async () => {
    try {
      setLoading((prev) => ({ ...prev, notifications: true }));
      const res = await api.get(`/api/communications/${lotId}/notifications`, {
        params: { userId: user.id, unreadOnly: false },
        headers: { "x-auth-token": token },
      });
      setNotifications(res.data);
      setLoading((prev) => ({ ...prev, notifications: false }));
    } catch (err) {
      setError("Erreur lors du chargement des notifications");
      setLoading((prev) => ({ ...prev, notifications: false }));
    }
  };

  const handleSendMessage = async (e) => {
    e.preventDefault();
    try {
      setLoading((prev) => ({ ...prev, sending: true }));

      // Envoyer le message à chaque destinataire
      const sendPromises = messageForm.recipientIds.map((recipientId) =>
        api.post(
          `/api/communications/${lotId}/messages`,
          {
            ...messageForm,
            recipientId: recipientId,
          },
          {
            headers: { "x-auth-token": token },
          }
        )
      );

      await Promise.all(sendPromises);

      setSuccess(
        dialogMode === "reply"
          ? "Réponse envoyée avec succès"
          : dialogMode === "forward"
          ? "Message transféré avec succès"
          : `Message envoyé à ${messageForm.recipientIds.length} destinataire(s)`
      );

      fetchMessages();
      fetchNotifications();

      setShowMessageDialog(false);
      setShowRecipientDialog(false);
      setMessageForm({
        recipientIds: [],
        subject: "",
        content: "",
        urgency: "normal",
      });
      setSelectedRecipients([]);
      setDialogMode("new");
      setError(null);
    } catch (err) {
      setError(
        err.response?.data?.message || "Erreur lors de l'envoi du message"
      );
    } finally {
      setLoading((prev) => ({ ...prev, sending: false }));
    }
  };

  const handleReply = (message) => {
    setSelectedMessage(message);
    setDialogMode("reply");
    setMessageForm({
      recipientIds: [message.sender_id],
      subject: `Re: ${message.subject}`,
      content: `\n\n--- Message original ---\nDe: ${
        message.sender_name
      }\nDate: ${formatDateTime(message.created_at)}\n\n${message.content}\n`,
      urgency: "normal",
    });
    setShowMessageDialog(true);
  };

  const handleForward = (message) => {
    setSelectedMessage(message);
    setDialogMode("forward");
    setMessageForm({
      recipientIds: [],
      subject: `TR: ${message.subject}`,
      content: `\n\n--- Message transféré ---\nDe: ${message.sender_name}\nÀ: ${
        message.recipient_name
      }\nDate: ${formatDateTime(message.created_at)}\n\n${message.content}\n`,
      urgency: "normal",
    });
    setShowMessageDialog(true);
  };

  const handleToggleRecipient = (recipientId) => {
    setSelectedRecipients((prev) =>
      prev.includes(recipientId)
        ? prev.filter((id) => id !== recipientId)
        : [...prev, recipientId]
    );
  };

  const handleSelectAllRecipients = () => {
    if (selectedRecipients.length === users.length) {
      setSelectedRecipients([]);
    } else {
      setSelectedRecipients(users.map((user) => user.id));
    }
  };

  const handleConfirmRecipients = () => {
    setMessageForm((prev) => ({
      ...prev,
      recipientIds: selectedRecipients,
    }));
    setShowRecipientDialog(false);
  };

  const handleMarkAsRead = async (notificationId) => {
    try {
      await api.patch(
        `/api/communications/notifications/${notificationId}/read`,
        {},
        { headers: { "x-auth-token": token } }
      );
      fetchNotifications();
    } catch (err) {
      setError("Erreur lors de la mise à jour de la notification");
    }
  };

  const handleViewMessage = (message) => {
    setSelectedMessage(message);
  };

  const handleNewMessage = () => {
    setDialogMode("new");
    setMessageForm({
      recipientIds: [],
      subject: "",
      content: "",
      urgency: "normal",
    });
    setSelectedRecipients([]);
    setShowMessageDialog(true);
  };

  const handleCloseDialog = () => {
    setShowMessageDialog(false);
    setShowRecipientDialog(false);
    setSelectedMessage(null);
    setDialogMode("new");
    setMessageForm({
      recipientIds: [],
      subject: "",
      content: "",
      urgency: "normal",
    });
    setSelectedRecipients([]);
  };

  const getUnreadCount = () => {
    return notifications.filter((n) => !n.read).length;
  };

  const getReceivedUnreadCount = () => {
    return messages.received.filter((m) => m.has_unread_notification).length;
  };

  const getUrgencyColor = (urgency) => {
    switch (urgency) {
      case "high":
        return "error";
      case "medium":
        return "warning";
      case "low":
        return "info";
      default:
        return "default";
    }
  };

  const getDialogTitle = () => {
    switch (dialogMode) {
      case "reply":
        return "Répondre au message";
      case "forward":
        return "Transférer le message";
      default:
        return "Nouveau message";
    }
  };

  const getRecipientNames = () => {
    return messageForm.recipientIds
      .map((recipientId) => {
        const recipient = users.find((u) => u.id === recipientId);
        return recipient
          ? `${recipient.username} (${recipient.email})`
          : "Destinataire inconnu";
      })
      .join(", ");
  };

  const markMessageAsRead = async (messageId) => {
    try {
      const notification = notifications.find(
        (n) => n.related_message_id === messageId
      );
      if (notification && !notification.read) {
        await handleMarkAsRead(notification.id);
      }
    } catch (err) {
      console.error("Erreur lors du marquage comme lu:", err);
    }
  };

  return (
    <Box sx={{ p: 3 }}>
      <Typography variant="h5" gutterBottom>
        Communication - Lot #{lotId}
      </Typography>

      {error && (
        <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError(null)}>
          {error}
        </Alert>
      )}

      {success && (
        <Alert
          severity="success"
          sx={{ mb: 2 }}
          onClose={() => setSuccess(null)}
        >
          {success}
        </Alert>
      )}

      <Tabs
        value={activeMainTab}
        onChange={(e, newValue) => setActiveMainTab(newValue)}
        sx={{ mb: 3 }}
      >
        <Tab icon={<Mail />} label="Messagerie" />
        <Tab
          icon={
            <Badge badgeContent={getUnreadCount()} color="error">
              <Notifications />
            </Badge>
          }
          label="Notifications"
        />
      </Tabs>

      {activeMainTab === 0 && (
        <Box>
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
                onClick={handleNewMessage}
                disabled={loading.users}
              >
                Nouveau message
              </Button>
            </Box>

            <Tabs
              value={activeMessageTab}
              onChange={(e, newValue) => setActiveMessageTab(newValue)}
              sx={{ mb: 2 }}
            >
              <Tab
                icon={
                  <Badge badgeContent={getReceivedUnreadCount()} color="error">
                    <Inbox />
                  </Badge>
                }
                label="Boîte de réception"
              />
              <Tab icon={<Outbox />} label="Messages envoyés" />
            </Tabs>

            {activeMessageTab === 0 && (
              <>
                {loading.received ? (
                  <Box sx={{ display: "flex", justifyContent: "center", p: 4 }}>
                    <CircularProgress />
                  </Box>
                ) : messages.received.length === 0 ? (
                  <Alert severity="info">Aucun message reçu</Alert>
                ) : (
                  <List>
                    {messages.received.map((message) => (
                      <React.Fragment key={message.id}>
                        <ListItem
                          alignItems="flex-start"
                          button
                          onClick={() => {
                            handleViewMessage(message);
                            markMessageAsRead(message.id);
                          }}
                          sx={{
                            bgcolor: message.has_unread_notification
                              ? "action.hover"
                              : "inherit",
                            "&:hover": { bgcolor: "action.selected" },
                          }}
                        >
                          <ListItemAvatar>
                            <Avatar sx={{ bgcolor: "secondary.main" }}>
                              {message.has_unread_notification ? (
                                <Mail />
                              ) : (
                                <MarkEmailRead />
                              )}
                            </Avatar>
                          </ListItemAvatar>
                          <ListItemText
                            primary={
                              <Box
                                sx={{
                                  display: "flex",
                                  justifyContent: "space-between",
                                  alignItems: "center",
                                }}
                              >
                                <Typography
                                  variant="subtitle1"
                                  sx={{
                                    fontWeight: message.has_unread_notification
                                      ? "bold"
                                      : "normal",
                                  }}
                                >
                                  {message.subject}
                                </Typography>
                                <Box
                                  sx={{
                                    display: "flex",
                                    alignItems: "center",
                                    gap: 1,
                                  }}
                                >
                                  <Chip
                                    label={message.urgency}
                                    size="small"
                                    color={getUrgencyColor(message.urgency)}
                                    variant="outlined"
                                  />
                                  <Typography
                                    variant="caption"
                                    color="text.secondary"
                                  >
                                    {formatRelativeTime(message.created_at)}
                                  </Typography>
                                </Box>
                              </Box>
                            }
                            secondary={
                              <>
                                <Typography
                                  variant="body2"
                                  color="text.secondary"
                                  sx={{ mb: 1 }}
                                >
                                  De: {message.sender_name}
                                </Typography>
                                <Typography variant="body2" noWrap>
                                  {message.content.substring(0, 100)}...
                                </Typography>
                              </>
                            }
                          />
                        </ListItem>
                        <Divider />
                      </React.Fragment>
                    ))}
                  </List>
                )}
              </>
            )}

            {activeMessageTab === 1 && (
              <>
                {loading.sent ? (
                  <Box sx={{ display: "flex", justifyContent: "center", p: 4 }}>
                    <CircularProgress />
                  </Box>
                ) : messages.sent.length === 0 ? (
                  <Alert severity="info">Aucun message envoyé</Alert>
                ) : (
                  <List>
                    {messages.sent.map((message) => (
                      <React.Fragment key={message.id}>
                        <ListItem
                          alignItems="flex-start"
                          button
                          onClick={() => handleViewMessage(message)}
                          sx={{
                            "&:hover": { bgcolor: "action.selected" },
                          }}
                        >
                          <ListItemAvatar>
                            <Avatar sx={{ bgcolor: "primary.main" }}>
                              <Send />
                            </Avatar>
                          </ListItemAvatar>
                          <ListItemText
                            primary={
                              <Box
                                sx={{
                                  display: "flex",
                                  justifyContent: "space-between",
                                  alignItems: "center",
                                }}
                              >
                                <Typography variant="subtitle1">
                                  {message.subject}
                                </Typography>
                                <Box
                                  sx={{
                                    display: "flex",
                                    alignItems: "center",
                                    gap: 1,
                                  }}
                                >
                                  <Chip
                                    label={message.urgency}
                                    size="small"
                                    color={getUrgencyColor(message.urgency)}
                                    variant="outlined"
                                  />
                                  <Typography
                                    variant="caption"
                                    color="text.secondary"
                                  >
                                    {formatRelativeTime(message.created_at)}
                                  </Typography>
                                </Box>
                              </Box>
                            }
                            secondary={
                              <>
                                <Typography
                                  variant="body2"
                                  color="text.secondary"
                                  sx={{ mb: 1 }}
                                >
                                  À: {message.recipient_name}
                                </Typography>
                                <Typography variant="body2" noWrap>
                                  {message.content.substring(0, 100)}...
                                </Typography>
                              </>
                            }
                          />
                        </ListItem>
                        <Divider />
                      </React.Fragment>
                    ))}
                  </List>
                )}
              </>
            )}
          </Paper>

          {/* Dialog pour nouveau message/réponse/transfert */}
          <Dialog
            open={showMessageDialog}
            onClose={handleCloseDialog}
            fullWidth
            maxWidth="md"
          >
            <DialogTitle>
              <Box sx={{ display: "flex", alignItems: "center" }}>
                {dialogMode !== "new" && (
                  <IconButton onClick={handleCloseDialog} sx={{ mr: 1 }}>
                    <ArrowBack />
                  </IconButton>
                )}
                {getDialogTitle()}
              </Box>
            </DialogTitle>
            <DialogContent>
              <Box component="form" sx={{ mt: 2 }}>
                <FormControl fullWidth sx={{ mb: 2 }}>
                  <Button
                    variant="outlined"
                    startIcon={<People />}
                    onClick={() => setShowRecipientDialog(true)}
                    sx={{ justifyContent: "flex-start", textAlign: "left" }}
                  >
                    {messageForm.recipientIds.length === 0
                      ? "Sélectionner les destinataires"
                      : `${messageForm.recipientIds.length} destinataire(s) sélectionné(s)`}
                  </Button>
                </FormControl>

                {messageForm.recipientIds.length > 0 && (
                  <Alert severity="info" sx={{ mb: 2 }}>
                    <strong>Destinataires :</strong> {getRecipientNames()}
                  </Alert>
                )}

                {dialogMode === "reply" && (
                  <Alert severity="info" sx={{ mb: 2 }}>
                    Réponse à: {getRecipientNames()}
                  </Alert>
                )}

                <TextField
                  fullWidth
                  label="Sujet"
                  value={messageForm.subject}
                  onChange={(e) =>
                    setMessageForm({ ...messageForm, subject: e.target.value })
                  }
                  sx={{ mb: 2 }}
                  required
                />
                <TextField
                  fullWidth
                  label="Message"
                  multiline
                  rows={8}
                  value={messageForm.content}
                  onChange={(e) =>
                    setMessageForm({ ...messageForm, content: e.target.value })
                  }
                  sx={{ mb: 2 }}
                  required
                  placeholder={
                    dialogMode === "new" ? "Rédigez votre message..." : ""
                  }
                />

                <FormControl fullWidth sx={{ mb: 2 }}>
                  <InputLabel>Urgence</InputLabel>
                  <Select
                    value={messageForm.urgency}
                    label="Urgence"
                    onChange={(e) =>
                      setMessageForm({
                        ...messageForm,
                        urgency: e.target.value,
                      })
                    }
                  >
                    <MenuItem value="low">📋 Faible</MenuItem>
                    <MenuItem value="normal">📨 Normal</MenuItem>
                    <MenuItem value="medium">⚠️ Moyen</MenuItem>
                    <MenuItem value="high">🚨 Urgent</MenuItem>
                  </Select>
                </FormControl>
              </Box>
            </DialogContent>
            <DialogActions>
              <Button onClick={handleCloseDialog}>Annuler</Button>
              <Button
                onClick={handleSendMessage}
                variant="contained"
                disabled={
                  loading.sending ||
                  messageForm.recipientIds.length === 0 ||
                  !messageForm.subject ||
                  !messageForm.content
                }
                endIcon={<Send />}
              >
                {loading.sending ? <CircularProgress size={20} /> : "Envoyer"}
              </Button>
            </DialogActions>
          </Dialog>

          {/* Dialog pour sélection des destinataires */}
          <Dialog
            open={showRecipientDialog}
            onClose={() => setShowRecipientDialog(false)}
            fullWidth
            maxWidth="sm"
          >
            <DialogTitle>
              <Box
                sx={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                }}
              >
                Sélection des destinataires
                <Chip
                  label={`${selectedRecipients.length} sélectionné(s)`}
                  color="primary"
                  variant="outlined"
                />
              </Box>
            </DialogTitle>
            <DialogContent>
              <Box sx={{ mt: 2 }}>
                <ListItemButton onClick={handleSelectAllRecipients}>
                  <ListItemIcon>
                    <Checkbox
                      edge="start"
                      checked={selectedRecipients.length === users.length}
                      indeterminate={
                        selectedRecipients.length > 0 &&
                        selectedRecipients.length < users.length
                      }
                    />
                  </ListItemIcon>
                  <ListItemText primary="Sélectionner tous" />
                </ListItemButton>
                <Divider sx={{ my: 1 }} />

                <List sx={{ maxHeight: 400, overflow: "auto" }}>
                  {users.map((user) => (
                    <ListItem key={user.id} disablePadding>
                      <ListItemButton
                        onClick={() => handleToggleRecipient(user.id)}
                      >
                        <ListItemIcon>
                          <Checkbox
                            edge="start"
                            checked={selectedRecipients.includes(user.id)}
                          />
                        </ListItemIcon>
                        <ListItemText
                          primary={user.username}
                          secondary={user.email}
                        />
                      </ListItemButton>
                    </ListItem>
                  ))}
                </List>
              </Box>
            </DialogContent>
            <DialogActions>
              <Button onClick={() => setShowRecipientDialog(false)}>
                Annuler
              </Button>
              <Button
                onClick={handleConfirmRecipients}
                variant="contained"
                disabled={selectedRecipients.length === 0}
              >
                Confirmer ({selectedRecipients.length})
              </Button>
            </DialogActions>
          </Dialog>

          {/* Dialog pour voir un message */}
          <Dialog
            open={!!selectedMessage}
            onClose={() => setSelectedMessage(null)}
            fullWidth
            maxWidth="md"
          >
            {selectedMessage && (
              <>
                <DialogTitle>
                  <Box
                    sx={{
                      display: "flex",
                      justifyContent: "space-between",
                      alignItems: "center",
                    }}
                  >
                    <Typography variant="h6">
                      {selectedMessage.subject}
                    </Typography>
                    <Chip
                      label={selectedMessage.urgency}
                      color={getUrgencyColor(selectedMessage.urgency)}
                      variant="outlined"
                    />
                  </Box>
                </DialogTitle>
                <DialogContent>
                  <Box sx={{ mb: 2 }}>
                    <Typography variant="body2" color="text.secondary">
                      <strong>De:</strong> {selectedMessage.sender_name}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      <strong>À:</strong> {selectedMessage.recipient_name}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      <strong>Date:</strong>{" "}
                      {formatDateTime(selectedMessage.created_at)}
                    </Typography>
                  </Box>
                  <Divider sx={{ my: 2 }} />
                  <Typography
                    variant="body1"
                    sx={{ whiteSpace: "pre-wrap", lineHeight: 1.6 }}
                  >
                    {selectedMessage.content}
                  </Typography>
                </DialogContent>
                <DialogActions>
                  <Button
                    startIcon={<Reply />}
                    onClick={() => handleReply(selectedMessage)}
                    variant="outlined"
                  >
                    Répondre
                  </Button>
                  <Button
                    startIcon={<Forward />}
                    onClick={() => handleForward(selectedMessage)}
                    variant="outlined"
                  >
                    Transférer
                  </Button>
                  <Button onClick={() => setSelectedMessage(null)}>
                    Fermer
                  </Button>
                </DialogActions>
              </>
            )}
          </Dialog>
        </Box>
      )}

      {activeMainTab === 1 && (
        <Box>
          <Paper sx={{ p: 3, mb: 3 }}>
            <Box
              sx={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                mb: 3,
              }}
            >
              <Typography variant="h6">
                Notifications
                {getUnreadCount() > 0 && (
                  <Chip
                    label={`${getUnreadCount()} non lues`}
                    color="error"
                    size="small"
                    sx={{ ml: 2 }}
                  />
                )}
              </Typography>
              <Button
                variant="contained"
                startIcon={<Refresh />}
                onClick={fetchNotifications}
                disabled={loading.notifications}
              >
                Actualiser
              </Button>
            </Box>

            {loading.notifications ? (
              <Box sx={{ display: "flex", justifyContent: "center", p: 4 }}>
                <CircularProgress />
              </Box>
            ) : notifications.length === 0 ? (
              <Alert severity="info">Aucune notification</Alert>
            ) : (
              <List>
                {notifications.map((notification) => (
                  <Card
                    key={notification.id}
                    sx={{
                      mb: 2,
                      borderLeft: 4,
                      borderColor: getUrgencyColor(notification.urgency),
                      bgcolor: notification.read ? "inherit" : "action.hover",
                    }}
                  >
                    <CardContent>
                      <Box
                        sx={{
                          display: "flex",
                          justifyContent: "space-between",
                          alignItems: "flex-start",
                          mb: 1,
                        }}
                      >
                        <Typography
                          variant="subtitle1"
                          sx={{
                            fontWeight: notification.read ? "normal" : "bold",
                          }}
                        >
                          {notification.message}
                        </Typography>
                        <Chip
                          label={notification.urgency}
                          size="small"
                          color={getUrgencyColor(notification.urgency)}
                        />
                      </Box>
                      <Typography
                        variant="body2"
                        color="text.secondary"
                        sx={{ mb: 1 }}
                      >
                        Type: {notification.type} | Créé par:{" "}
                        {notification.user_name} |{" "}
                        {formatDateTime(notification.created_at)}
                      </Typography>
                      {notification.related_message_subject && (
                        <Typography
                          variant="body2"
                          color="primary"
                          sx={{ fontStyle: "italic" }}
                        >
                          Sujet du message:{" "}
                          {notification.related_message_subject}
                        </Typography>
                      )}
                    </CardContent>
                    <CardActions>
                      {!notification.read && (
                        <Button
                          size="small"
                          startIcon={<MarkEmailRead />}
                          onClick={() => handleMarkAsRead(notification.id)}
                        >
                          Marquer comme lu
                        </Button>
                      )}
                    </CardActions>
                  </Card>
                ))}
              </List>
            )}
          </Paper>
        </Box>
      )}
    </Box>
  );
};

export default CommunicationTab;
