const { Router } = require("express");
const jwt = require("jsonwebtoken");
const bcrypt = require("bcryptjs");

module.exports = (pool) => {
  const router = Router();
  // Middleware admin seulement
  const isAdmin = async (req, res, next) => {
    const token = req.header("x-auth-token");
    if (!token) return next(); // Continue without user if no token
    try {
      const decoded = jwt.verify(token, process.env.JWT_SECRET);

      const user = await pool.query("SELECT role FROM users WHERE id = $1", [
        decoded.id,
      ]);

      if (user.rows[0]?.role !== "admin") {
        return res.status(403).json({ message: "Accès refusé" });
      }
      next();
    } catch (err) {
      console.error(err);
      res.status(500).json({ message: "Erreur serveur" });
    }
  };

  // Route principale d'administration
  router.get("/dashboard", isAdmin, async (req, res) => {
    try {
      // Statistiques pour le dashboard admin
      const statsQuery = `
        SELECT 
          (SELECT COUNT(*) FROM users) as total_users,
          (SELECT COUNT(*) FROM users WHERE is_active = true) as active_users,
          (SELECT COUNT(*) FROM road_sections) as total_sections,
          (SELECT COUNT(*) FROM documents) as total_documents,
          (SELECT COUNT(*) FROM project_lots) as total_lots,
          (SELECT COUNT(*) FROM user_actions WHERE created_at >= CURRENT_DATE - INTERVAL '7 days') as recent_actions
      `;

      const statsResult = await pool.query(statsQuery);
      const stats = statsResult.rows[0];

      // Activités récentes
      const activitiesQuery = `
        SELECT 
          ua.action_type,
          ua.details,
          ua.created_at,
          u.username
        FROM user_actions ua
        LEFT JOIN users u ON ua.user_id = u.id
        ORDER BY ua.created_at DESC
        LIMIT 10
      `;

      const activitiesResult = await pool.query(activitiesQuery);

      res.json({
        stats: {
          totalUsers: parseInt(stats.total_users),
          activeUsers: parseInt(stats.active_users),
          totalSections: parseInt(stats.total_sections),
          totalDocuments: parseInt(stats.total_documents),
          totalLots: parseInt(stats.total_lots),
          recentActions: parseInt(stats.recent_actions),
        },
        recentActivities: activitiesResult.rows,
      });
    } catch (error) {
      console.error("Error fetching admin dashboard:", error);
      res.status(500).json({
        message: "Erreur lors de la récupération des données d'administration",
        error:
          process.env.NODE_ENV === "development" ? error.message : undefined,
      });
    }
  });

  return router;
};
