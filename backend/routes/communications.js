const { Router } = require("express");
const jwt = require("jsonwebtoken");

module.exports = (pool) => {
  const router = Router();

  const authenticate = (req, res, next) => {
    const token = req.header("x-auth-token");
    if (!token)
      return res
        .status(401)
        .json({ message: "No token, authorization denied" });

    try {
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      req.user = decoded;
      next();
    } catch (err) {
      res.status(401).json({ message: "Token is not valid" });
    }
  };

  // Envoyer un message
  router.post("/:lotId/messages", authenticate, async (req, res) => {
    try {
      const { lotId } = req.params;
      const { recipientId, subject, content } = req.body;

      const newMessage = await pool.query(
        `INSERT INTO messages (
          lot_id, sender_id, recipient_id, subject, content
        ) VALUES ($1, $2, $3, $4, $5) RETURNING *`,
        [lotId, req.user.id, recipientId, subject, content]
      );

      res.status(201).json(newMessage.rows[0]);
    } catch (err) {
      console.error(err.message);
      res.status(500).send("Server error");
    }
  });

  // Envoyer une notification
  router.post("/:lotId/notifications", authenticate, async (req, res) => {
    try {
      const { lotId } = req.params;
      const { userId, type, message, urgency } = req.body;

      const newNotification = await pool.query(
        `INSERT INTO notifications (
          lot_id, user_id, type, message, urgency
        ) VALUES ($1, $2, $3, $4, $5) RETURNING *`,
        [lotId, userId, type, message, urgency]
      );

      res.status(201).json(newNotification.rows[0]);
    } catch (err) {
      console.error(err.message);
      res.status(500).send("Server error");
    }
  });

  // Obtenir les messages d'un lot
  router.get("/:lotId/messages", authenticate, async (req, res) => {
    try {
      const { lotId } = req.params;
      const { userId } = req.query;

      let query = `SELECT m.*, 
                  u1.username as sender_name,
                  u2.username as recipient_name
                  FROM messages m
                  JOIN users u1 ON m.sender_id = u1.id
                  LEFT JOIN users u2 ON m.recipient_id = u2.id
                  WHERE m.lot_id = $1`;

      const params = [lotId];

      if (userId) {
        query += ` AND (m.recipient_id = $2 OR m.sender_id = $2)`;
        params.push(userId);
      }

      query += " ORDER BY m.created_at DESC";

      const messages = await pool.query(query, params);
      res.json(messages.rows);
    } catch (err) {
      console.error(err.message);
      res.status(500).send("Server error");
    }
  });

  // Obtenir les notifications d'un lot
  router.get("/:lotId/notifications", authenticate, async (req, res) => {
    try {
      const { lotId } = req.params;
      const { userId, unreadOnly } = req.query;

      let query = `SELECT n.*, u.username as user_name
                  FROM notifications n
                  LEFT JOIN users u ON n.user_id = u.id
                  WHERE n.lot_id = $1`;

      const params = [lotId];

      if (userId) {
        query += ` AND n.user_id = $${params.length + 1}`;
        params.push(userId);
      }

      if (unreadOnly === "true") {
        query += ` AND n.read = FALSE`;
      }

      query += " ORDER BY n.created_at DESC";

      const notifications = await pool.query(query, params);
      res.json(notifications.rows);
    } catch (err) {
      console.error(err.message);
      res.status(500).send("Server error");
    }
  });

  // Marquer une notification comme lue
  router.patch("/notifications/:id/read", authenticate, async (req, res) => {
    try {
      const { id } = req.params;

      await pool.query("UPDATE notifications SET read = TRUE WHERE id = $1", [
        id,
      ]);

      res.json({ message: "Notification marquée comme lue" });
    } catch (err) {
      console.error(err.message);
      res.status(500).send("Server error");
    }
  });

  return router;
};
