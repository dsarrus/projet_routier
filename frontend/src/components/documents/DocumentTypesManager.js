import React, { useState, useEffect, useContext } from "react";
import axios from "axios";
import AuthContext from "../../context/AuthContext";

const DocumentTypesManager = () => {
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(false);
  const [types, setTypes] = useState([]);
  const [editingType, setEditingType] = useState(null);
  const { token } = useContext(AuthContext);

  // Charger les types existants
  useEffect(() => {
    fetchTypes();
  }, []);

  const fetchTypes = async () => {
    try {
      const res = await axios.get("http://localhost:5000/api/types");
      setTypes(res.data);
    } catch (err) {
      setError("Erreur lors du chargement des types");
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    try {
      if (editingType) {
        // Mise à jour d'un type existant
        await axios.put(
          `http://localhost:5000/api/types/${editingType.id}`,
          { name, description },
          {
            headers: {
              "x-auth-token": token,
              "Content-Type": "application/json",
            },
          }
        );
        setSuccess("Type modifié avec succès");
      } else {
        // Création d'un nouveau type
        await axios.post(
          "http://localhost:5000/api/types",
          { name, description },
          {
            headers: {
              "x-auth-token": token,
              "Content-Type": "application/json",
            },
          }
        );
        setSuccess("Type créé avec succès");
      }

      resetForm();
      fetchTypes();
    } catch (err) {
      setError(err.response?.data?.message || "Erreur lors de l'opération");
    }
  };

  const handleEdit = (type) => {
    setEditingType(type);
    setName(type.name);
    setDescription(type.description || "");
  };

  const handleDelete = async (id) => {
    if (!window.confirm("Supprimer ce type de document ?")) return;

    try {
      await axios.delete(`http://localhost:5000/api/types/${id}`, {
        headers: {
          "x-auth-token": token,
        },
      });
      setSuccess("Type supprimé avec succès");
      fetchTypes();
    } catch (err) {
      setError(err.response?.data?.message || "Erreur lors de la suppression");
    }
  };

  const resetForm = () => {
    setName("");
    setDescription("");
    setEditingType(null);
    setTimeout(() => setSuccess(false), 3000);
  };

  return (
    <div className="document-types-manager">
      <h2>Gestion des types de documents</h2>

      {error && <div className="alert-error">{error}</div>}
      {success && <div className="alert-success">{success}</div>}

      <div className="types-form">
        <h3>{editingType ? "Modifier un type" : "Ajouter un nouveau type"}</h3>
        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label>Nom du type*</label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
            />
          </div>

          <div className="form-group">
            <label>Description</label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
            />
          </div>

          <div className="form-actions">
            <button type="submit" className="btn-primary">
              {editingType ? "Mettre à jour" : "Créer"}
            </button>
            {editingType && (
              <button
                type="button"
                onClick={resetForm}
                className="btn-secondary"
              >
                Annuler
              </button>
            )}
          </div>
        </form>
      </div>

      <div className="types-list">
        <h3>Liste des types existants</h3>
        {types.length === 0 ? (
          <p>Aucun type de document disponible</p>
        ) : (
          <table>
            <thead>
              <tr>
                <th>Nom</th>
                <th>Description</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {types.map((type) => (
                <tr key={type.id}>
                  <td>{type.name}</td>
                  <td>{type.description || "-"}</td>
                  <td className="actions">
                    <button
                      onClick={() => handleEdit(type)}
                      className="btn-edit"
                    >
                      Modifier
                    </button>
                    <button
                      onClick={() => handleDelete(type.id)}
                      className="btn-delete"
                    >
                      Supprimer
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
};

export default DocumentTypesManager;
