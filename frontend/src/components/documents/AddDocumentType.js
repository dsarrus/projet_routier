import React, { useState, useContext } from "react";
import axios from "axios";
import AuthContext from "../../context/AuthContext";

const AddDocumentType = () => {
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(false);
  const { token } = useContext(AuthContext);

  const handleSubmit = async (e) => {
    e.preventDefault();

    try {
      const res = await axios.post(
        "http://localhost:5000/api/types",
        { name, description },
        {
          headers: {
            "x-auth-token": token,
            "Content-Type": "application/json",
          },
        }
      );

      setSuccess(true);
      setName("");
      setDescription("");
      setError(null);

      // Réinitialiser le message de succès après 3 secondes
      setTimeout(() => setSuccess(false), 3000);
    } catch (err) {
      setError(
        err.response?.data?.message || "Erreur lors de la création du type"
      );
      setSuccess(false);
    }
  };

  return (
    <div className="add-type-form">
      <h2>Ajouter un nouveau type de document</h2>

      {error && <div className="alert-error">{error}</div>}
      {success && (
        <div className="alert-success">Type de document créé avec succès!</div>
      )}

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

        <button type="submit" className="btn-primary">
          Créer le type
        </button>
      </form>
    </div>
  );
};

export default AddDocumentType;
