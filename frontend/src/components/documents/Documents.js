import React, { useState, useEffect, useContext } from "react";
import { Link } from "react-router-dom";
import AuthContext from "../../context/AuthContext";
import axios from "axios";

const Documents = () => {
  const [documents, setDocuments] = useState([]);
  const [types, setTypes] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedType, setSelectedType] = useState("");
  const [fromDate, setFromDate] = useState("");
  const [toDate, setToDate] = useState("");
  const [loading, setLoading] = useState(true);
  const { user } = useContext(AuthContext);

  useEffect(() => {
    fetchTypes();
    fetchDocuments();
  }, []);

  const fetchTypes = async () => {
    try {
      const res = await axios.get("http://localhost:5000/api/types");
      setTypes(res.data);
    } catch (err) {
      console.error(err);
    }
  };

  const fetchDocuments = async () => {
    try {
      setLoading(true);
      const params = {};
      if (searchTerm) params.search = searchTerm;
      if (selectedType) params.type = selectedType;
      if (fromDate) params.fromDate = fromDate;
      if (toDate) params.toDate = toDate;

      const res = await axios.get("http://localhost:5000/api/documents", {
        params,
      });
      setDocuments(res.data);
      setLoading(false);
    } catch (err) {
      console.error(err);
      setLoading(false);
    }
  };

  const handleSearch = (e) => {
    e.preventDefault();
    fetchDocuments();
  };

  const handleReset = () => {
    setSearchTerm("");
    setSelectedType("");
    setFromDate("");
    setToDate("");
    fetchDocuments();
  };

  return (
    <div>
      <h2>Gestion des Documents</h2>

      <div className="search-form">
        <form onSubmit={handleSearch}>
          <div className="form-group">
            <input
              type="text"
              placeholder="Rechercher par titre, description ou mots-clés"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>

          <div className="form-row">
            <div className="form-group">
              <label>Type de document</label>
              <select
                value={selectedType}
                onChange={(e) => setSelectedType(e.target.value)}
              >
                <option value="">Tous les types</option>
                {types.map((type) => (
                  <option key={type.id} value={type.id}>
                    {type.name}
                  </option>
                ))}
              </select>
            </div>

            <div className="form-group">
              <label>À partir du</label>
              <input
                type="date"
                value={fromDate}
                onChange={(e) => setFromDate(e.target.value)}
              />
            </div>

            <div className="form-group">
              <label>Jusqu'au</label>
              <input
                type="date"
                value={toDate}
                onChange={(e) => setToDate(e.target.value)}
              />
            </div>
          </div>

          <div className="form-actions">
            <button type="submit" className="btn-primary">
              Rechercher
            </button>
            <button
              type="button"
              onClick={handleReset}
              className="btn-secondary"
            >
              Réinitialiser
            </button>
          </div>
        </form>
      </div>

      <div className="documents-list">
        {loading ? (
          <p>Chargement...</p>
        ) : documents.length === 0 ? (
          <p>Aucun document trouvé</p>
        ) : (
          <table>
            <thead>
              <tr>
                <th>Titre</th>
                <th>Type</th>
                <th>Créé par</th>
                <th>Date de création</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {documents.map((doc) => (
                <tr key={doc.id}>
                  <td>{doc.title}</td>
                  <td>{doc.type_name}</td>
                  <td>{doc.creator}</td>
                  <td>{new Date(doc.created_at).toLocaleDateString()}</td>
                  <td>
                    <Link to={`/documents/${doc.id}`} className="btn-link">
                      Voir
                    </Link>
                    <a
                      href={`/api/documents/${doc.id}/download`}
                      className="btn-link"
                      download
                    >
                      Télécharger
                    </a>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {user && (
        <div className="upload-link">
          <Link to="/upload" className="btn-primary">
            Téléverser un nouveau document
          </Link>
        </div>
      )}
    </div>
  );
};

export default Documents;
