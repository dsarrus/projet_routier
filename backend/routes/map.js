// routes/map.js
const express = require("express");
const router = express.Router();
const authenticate = require("../middleware/authenticate");

module.exports = (pool) => {
  // @route   GET /api/map/sections
  // @desc    Récupérer toutes les sections routières avec filtres
  // @access  Private
  router.get("/sections", authenticate, async (req, res) => {
    try {
      const {
        status,
        lot,
        region,
        start_date,
        end_date,
        page = 1,
        limit = 100,
      } = req.query;

      let query = `
        SELECT 
          sr.id,
          sr.name,
          sr.description,
          sr.lot_id,
          l.name as lot_name,
          sr.status,
          sr.coordinates,
          sr.length_km,
          sr.region,
          sr.last_inspection,
          sr.next_inspection,
          sr.progress_percentage,
          sr.created_at,
          sr.updated_at,
          COALESCE(
            json_agg(
              DISTINCT jsonb_build_object(
                'id', di.id,
                'type', di.type,
                'date', di.inspection_date,
                'status', di.status
              )
            ) FILTER (WHERE di.id IS NOT NULL), '[]'
          ) as inspections
        FROM road_sections sr
        LEFT JOIN lots l ON sr.lot_id = l.id
        LEFT JOIN document_inspections di ON sr.id = di.section_id
      `;

      const whereConditions = [];
      const queryParams = [];
      let paramCount = 0;

      // Filtres
      if (status && status !== "tous") {
        paramCount++;
        whereConditions.push(`sr.status = $${paramCount}`);
        queryParams.push(status);
      }

      if (lot && lot !== "tous") {
        paramCount++;
        whereConditions.push(`l.name = $${paramCount}`);
        queryParams.push(lot);
      }

      if (region) {
        paramCount++;
        whereConditions.push(`sr.region = $${paramCount}`);
        queryParams.push(region);
      }

      if (start_date) {
        paramCount++;
        whereConditions.push(`sr.last_inspection >= $${paramCount}`);
        queryParams.push(start_date);
      }

      if (end_date) {
        paramCount++;
        whereConditions.push(`sr.last_inspection <= $${paramCount}`);
        queryParams.push(end_date);
      }

      if (whereConditions.length > 0) {
        query += ` WHERE ${whereConditions.join(" AND ")}`;
      }

      query += ` GROUP BY sr.id, l.name ORDER BY sr.name`;

      // Pagination
      const offset = (page - 1) * limit;
      paramCount++;
      query += ` LIMIT $${paramCount}`;
      queryParams.push(limit);

      paramCount++;
      query += ` OFFSET $${paramCount}`;
      queryParams.push(offset);

      const result = await pool.query(query, queryParams);

      // Formatage des données pour la carte
      const sections = result.rows.map((section) => ({
        id: section.id,
        name: section.name,
        description: section.description,
        lot: section.lot_name,
        status: section.status,
        coordinates: section.coordinates
          ? JSON.parse(section.coordinates)
          : null,
        length: section.length_km,
        region: section.region,
        lastInspection: section.last_inspection,
        nextInspection: section.next_inspection,
        progress: section.progress_percentage,
        inspections: section.inspections,
        createdAt: section.created_at,
        updatedAt: section.updated_at,
      }));

      // Récupérer le total pour la pagination
      let countQuery = `SELECT COUNT(*) FROM road_sections sr LEFT JOIN lots l ON sr.lot_id = l.id`;
      if (whereConditions.length > 0) {
        countQuery += ` WHERE ${whereConditions.join(" AND ")}`;
      }

      const countResult = await pool.query(
        countQuery,
        queryParams.slice(0, -2)
      ); // Remove LIMIT and OFFSET params
      const total = parseInt(countResult.rows[0].count);

      res.json({
        sections,
        pagination: {
          page: parseInt(page),
          limit: parseInt(limit),
          total,
          pages: Math.ceil(total / limit),
        },
      });
    } catch (error) {
      console.error("Error fetching road sections:", error);
      res.status(500).json({
        message: "Erreur lors de la récupération des sections routières",
        error:
          process.env.NODE_ENV === "development" ? error.message : undefined,
      });
    }
  });

  // @route   GET /api/map/sections/:id
  // @desc    Récupérer une section routière spécifique
  // @access  Private
  router.get("/sections/:id", authenticate, async (req, res) => {
    try {
      const { id } = req.params;

      const query = `
        SELECT 
          sr.*,
          l.name as lot_name,
          COALESCE(
            json_agg(
              DISTINCT jsonb_build_object(
                'id', di.id,
                'type', di.type,
                'date', di.inspection_date,
                'status', di.status,
                'inspector', di.inspector_name,
                'notes', di.notes
              )
            ) FILTER (WHERE di.id IS NOT NULL), '[]'
          ) as inspections,
          COALESCE(
            json_agg(
              DISTINCT jsonb_build_object(
                'id', d.id,
                'name', d.name,
                'type', d.type,
                'upload_date', d.upload_date
              )
            ) FILTER (WHERE d.id IS NOT NULL), '[]'
          ) as documents
        FROM road_sections sr
        LEFT JOIN lots l ON sr.lot_id = l.id
        LEFT JOIN document_inspections di ON sr.id = di.section_id
        LEFT JOIN documents d ON sr.id = d.section_id
        WHERE sr.id = $1
        GROUP BY sr.id, l.name
      `;

      const result = await pool.query(query, [id]);

      if (result.rows.length === 0) {
        return res
          .status(404)
          .json({ message: "Section routière non trouvée" });
      }

      const section = result.rows[0];
      const formattedSection = {
        ...section,
        coordinates: section.coordinates
          ? JSON.parse(section.coordinates)
          : null,
        inspections: section.inspections,
        documents: section.documents,
      };

      res.json(formattedSection);
    } catch (error) {
      console.error("Error fetching road section:", error);
      res.status(500).json({
        message: "Erreur lors de la récupération de la section routière",
        error:
          process.env.NODE_ENV === "development" ? error.message : undefined,
      });
    }
  });

  // @route   GET /api/map/sections/:id/geodata
  // @desc    Récupérer les données géospatiales d'une section
  // @access  Private
  router.get("/sections/:id/geodata", authenticate, async (req, res) => {
    try {
      const { id } = req.params;

      const query = `
        SELECT 
          coordinates,
          geojson_data,
          bounding_box
        FROM road_sections 
        WHERE id = $1
      `;

      const result = await pool.query(query, [id]);

      if (result.rows.length === 0) {
        return res
          .status(404)
          .json({ message: "Données géospatiales non trouvées" });
      }

      const geodata = result.rows[0];
      res.json({
        coordinates: geodata.coordinates
          ? JSON.parse(geodata.coordinates)
          : null,
        geojson: geodata.geojson_data ? JSON.parse(geodata.geojson_data) : null,
        boundingBox: geodata.bounding_box
          ? JSON.parse(geodata.bounding_box)
          : null,
      });
    } catch (error) {
      console.error("Error fetching geodata:", error);
      res.status(500).json({
        message: "Erreur lors de la récupération des données géospatiales",
        error:
          process.env.NODE_ENV === "development" ? error.message : undefined,
      });
    }
  });

  // @route   POST /api/map/sections
  // @desc    Créer une nouvelle section routière
  // @access  Private (Admin seulement)
  router.post("/sections", authenticate, async (req, res) => {
    try {
      const {
        name,
        description,
        lot_id,
        status,
        coordinates,
        length_km,
        region,
        progress_percentage,
      } = req.body;

      // Vérifier les permissions admin
      if (req.user.role !== "admin") {
        return res.status(403).json({ message: "Accès non autorisé" });
      }

      const query = `
        INSERT INTO road_sections (
          name, description, lot_id, status, coordinates, 
          length_km, region, progress_percentage, created_by
        ) 
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
        RETURNING *
      `;

      const values = [
        name,
        description,
        lot_id,
        status || "inconnu",
        coordinates ? JSON.stringify(coordinates) : null,
        length_km,
        region,
        progress_percentage || 0,
        req.user.id,
      ];

      const result = await pool.query(query, values);
      const newSection = result.rows[0];

      // Journaliser l'action
      await pool.query(
        `INSERT INTO user_actions (user_id, action_type, details) 
         VALUES ($1, $2, $3)`,
        [req.user.id, "create_section", `Création de la section: ${name}`]
      );

      res.status(201).json({
        message: "Section routière créée avec succès",
        section: {
          ...newSection,
          coordinates: newSection.coordinates
            ? JSON.parse(newSection.coordinates)
            : null,
        },
      });
    } catch (error) {
      console.error("Error creating road section:", error);
      res.status(500).json({
        message: "Erreur lors de la création de la section routière",
        error:
          process.env.NODE_ENV === "development" ? error.message : undefined,
      });
    }
  });

  // @route   PUT /api/map/sections/:id
  // @desc    Mettre à jour une section routière
  // @access  Private (Admin seulement)
  router.put("/sections/:id", authenticate, async (req, res) => {
    try {
      const { id } = req.params;
      const {
        name,
        description,
        lot_id,
        status,
        coordinates,
        length_km,
        region,
        progress_percentage,
        last_inspection,
        next_inspection,
      } = req.body;

      // Vérifier les permissions admin
      if (req.user.role !== "admin") {
        return res.status(403).json({ message: "Accès non autorisé" });
      }

      // Vérifier si la section existe
      const checkQuery = "SELECT * FROM road_sections WHERE id = $1";
      const checkResult = await pool.query(checkQuery, [id]);

      if (checkResult.rows.length === 0) {
        return res
          .status(404)
          .json({ message: "Section routière non trouvée" });
      }

      const updateQuery = `
        UPDATE road_sections 
        SET 
          name = COALESCE($1, name),
          description = COALESCE($2, description),
          lot_id = COALESCE($3, lot_id),
          status = COALESCE($4, status),
          coordinates = COALESCE($5, coordinates),
          length_km = COALESCE($6, length_km),
          region = COALESCE($7, region),
          progress_percentage = COALESCE($8, progress_percentage),
          last_inspection = COALESCE($9, last_inspection),
          next_inspection = COALESCE($10, next_inspection),
          updated_at = CURRENT_TIMESTAMP
        WHERE id = $11
        RETURNING *
      `;

      const values = [
        name,
        description,
        lot_id,
        status,
        coordinates ? JSON.stringify(coordinates) : null,
        length_km,
        region,
        progress_percentage,
        last_inspection,
        next_inspection,
        id,
      ];

      const result = await pool.query(updateQuery, values);
      const updatedSection = result.rows[0];

      // Journaliser l'action
      await pool.query(
        `INSERT INTO user_actions (user_id, action_type, details) 
         VALUES ($1, $2, $3)`,
        [
          req.user.id,
          "update_section",
          `Mise à jour de la section: ${updatedSection.name}`,
        ]
      );

      res.json({
        message: "Section routière mise à jour avec succès",
        section: {
          ...updatedSection,
          coordinates: updatedSection.coordinates
            ? JSON.parse(updatedSection.coordinates)
            : null,
        },
      });
    } catch (error) {
      console.error("Error updating road section:", error);
      res.status(500).json({
        message: "Erreur lors de la mise à jour de la section routière",
        error:
          process.env.NODE_ENV === "development" ? error.message : undefined,
      });
    }
  });

  // @route   DELETE /api/map/sections/:id
  // @desc    Supprimer une section routière
  // @access  Private (Admin seulement)
  router.delete("/sections/:id", authenticate, async (req, res) => {
    try {
      const { id } = req.params;

      // Vérifier les permissions admin
      if (req.user.role !== "admin") {
        return res.status(403).json({ message: "Accès non autorisé" });
      }

      // Vérifier si la section existe
      const checkQuery = "SELECT * FROM road_sections WHERE id = $1";
      const checkResult = await pool.query(checkQuery, [id]);

      if (checkResult.rows.length === 0) {
        return res
          .status(404)
          .json({ message: "Section routière non trouvée" });
      }

      const sectionName = checkResult.rows[0].name;

      // Supprimer la section
      const deleteQuery = "DELETE FROM road_sections WHERE id = $1";
      await pool.query(deleteQuery, [id]);

      // Journaliser l'action
      await pool.query(
        `INSERT INTO user_actions (user_id, action_type, details) 
         VALUES ($1, $2, $3)`,
        [
          req.user.id,
          "delete_section",
          `Suppression de la section: ${sectionName}`,
        ]
      );

      res.json({ message: "Section routière supprimée avec succès" });
    } catch (error) {
      console.error("Error deleting road section:", error);
      res.status(500).json({
        message: "Erreur lors de la suppression de la section routière",
        error:
          process.env.NODE_ENV === "development" ? error.message : undefined,
      });
    }
  });

  // @route   GET /api/map/stats
  // @desc    Récupérer les statistiques pour la carte
  // @access  Private
  router.get("/stats", authenticate, async (req, res) => {
    try {
      const statsQuery = `
        SELECT 
          COUNT(*) as total_sections,
          SUM(length_km) as total_length,
          COUNT(*) FILTER (WHERE status = 'bon') as good_condition,
          COUNT(*) FILTER (WHERE status = 'moyen') as fair_condition,
          COUNT(*) FILTER (WHERE status = 'mauvais') as poor_condition,
          COUNT(*) FILTER (WHERE last_inspection >= CURRENT_DATE - INTERVAL '30 days') as recently_inspected,
          AVG(progress_percentage) as avg_progress
        FROM road_sections
      `;

      const regionsQuery = `
        SELECT 
          region,
          COUNT(*) as section_count,
          SUM(length_km) as total_length
        FROM road_sections 
        WHERE region IS NOT NULL
        GROUP BY region
        ORDER BY section_count DESC
      `;

      const lotsQuery = `
        SELECT 
          l.name as lot_name,
          COUNT(sr.id) as section_count,
          SUM(sr.length_km) as total_length,
          AVG(sr.progress_percentage) as avg_progress
        FROM lots l
        LEFT JOIN road_sections sr ON l.id = sr.lot_id
        GROUP BY l.id, l.name
        ORDER BY l.name
      `;

      const [statsResult, regionsResult, lotsResult] = await Promise.all([
        pool.query(statsQuery),
        pool.query(regionsQuery),
        pool.query(lotsQuery),
      ]);

      const stats = statsResult.rows[0];
      const regions = regionsResult.rows;
      const lots = lotsResult.rows;

      res.json({
        overview: {
          totalSections: parseInt(stats.total_sections),
          totalLength: parseFloat(stats.total_length) || 0,
          goodCondition: parseInt(stats.good_condition),
          fairCondition: parseInt(stats.fair_condition),
          poorCondition: parseInt(stats.poor_condition),
          recentlyInspected: parseInt(stats.recently_inspected),
          averageProgress: parseFloat(stats.avg_progress) || 0,
        },
        regions,
        lots,
      });
    } catch (error) {
      console.error("Error fetching map stats:", error);
      res.status(500).json({
        message: "Erreur lors de la récupération des statistiques",
        error:
          process.env.NODE_ENV === "development" ? error.message : undefined,
      });
    }
  });

  // @route   GET /api/map/sections/stats/overview
  // @desc    Récupérer les statistiques par type et performance
  router.get("/sections/stats/overview", authenticate, async (req, res) => {
    try {
      const statsQuery = `
      SELECT 
        type,
        performance_level,
        COUNT(*) as count,
        SUM(length_km) as total_length,
        AVG(progress_percentage) as avg_progress
      FROM road_sections 
      GROUP BY type, performance_level
      ORDER BY type, performance_level
    `;

      const regionStatsQuery = `
      SELECT 
        region,
        type,
        COUNT(*) as section_count
      FROM road_sections 
      WHERE region IS NOT NULL
      GROUP BY region, type
      ORDER BY region, type
    `;

      const [statsResult, regionStatsResult] = await Promise.all([
        pool.query(statsQuery),
        pool.query(regionStatsQuery),
      ]);

      res.json({
        typeStats: statsResult.rows,
        regionStats: regionStatsResult.rows,
      });
    } catch (error) {
      console.error("Error fetching overview stats:", error);
      res.status(500).json({
        message: "Erreur lors de la récupération des statistiques",
        error:
          process.env.NODE_ENV === "development" ? error.message : undefined,
      });
    }
  });

  return router;
};
