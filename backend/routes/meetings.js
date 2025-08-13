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

  // Planifier une réunion
  router.post("/:lotId", authenticate, async (req, res) => {
    try {
      const { lotId } = req.params;
      const { title, date, time, location, participants, agenda } = req.body;

      const newMeeting = await pool.query(
        `INSERT INTO meetings (
          lot_id, title, date, time, location, participants, agenda, created_by
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8) RETURNING *`,
        [lotId, title, date, time, location, participants, agenda, req.user.id]
      );

      res.status(201).json(newMeeting.rows[0]);
    } catch (err) {
      console.error(err.message);
      res.status(500).send("Server error");
    }
  });

  // Envoyer les invitations
  router.post(
    "/:meetingId/send-invitations",
    authenticate,
    async (req, res) => {
      try {
        const { meetingId } = req.params;

        await pool.query(
          "UPDATE meetings SET invitations_sent = TRUE WHERE id = $1",
          [meetingId]
        );

        res.json({ message: "Invitations envoyées avec succès" });
      } catch (err) {
        console.error(err.message);
        res.status(500).send("Server error");
      }
    }
  );

  // Créer un PV de réunion
  // POST /api/meetings/:meetingId/pv
  router.post("/:meetingId/pv", authenticate, async (req, res) => {
    try {
      const { meetingId } = req.params;
      const { content, decisions, nextSteps } = req.body;

      // 1. Vérifier que la réunion existe
      const meeting = await pool.query(
        "SELECT id FROM meetings WHERE id = $1",
        [meetingId]
      );

      if (meeting.rows.length === 0) {
        return res.status(404).json({ message: "Réunion non trouvée" });
      }

      // 2. Créer le PV
      const result = await pool.query(
        `INSERT INTO meeting_minutes (
          meeting_id, 
          content, 
          decisions, 
          next_steps,
          created_by
        ) VALUES ($1, $2, $3, $4, $5) 
        RETURNING *`,
        [meetingId, content, decisions, nextSteps, req.user.id]
      );

      // 3. Marquer la réunion comme ayant un PV
      await pool.query("UPDATE meetings SET has_minutes = TRUE WHERE id = $1", [
        meetingId,
      ]);

      res.status(201).json(result.rows[0]);
    } catch (err) {
      console.error(err);
      res.status(500).json({ message: "Erreur serveur" });
    }
  });

  // Obtenir les réunions d'un lot
  router.get("/:lotId", authenticate, async (req, res) => {
    try {
      const { lotId } = req.params;
      const { upcomingOnly } = req.query;

      let query = `SELECT m.*, u.username as creator, 
                  (SELECT COUNT(*) FROM meeting_minutes WHERE meeting_id = m.id) as has_minutes
                  FROM meetings m
                  JOIN users u ON m.created_by = u.id
                  WHERE m.lot_id = $1`;

      const params = [lotId];

      if (upcomingOnly === "true") {
        query += ` AND m.date >= CURRENT_DATE`;
      }

      query += " ORDER BY m.date, m.time";

      const meetings = await pool.query(query, params);
      res.json(meetings.rows);
    } catch (err) {
      console.error(err.message);
      res.status(500).send("Server error");
    }
  });

  return router;
};
