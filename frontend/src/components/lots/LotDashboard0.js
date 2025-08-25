import React, { useState, useEffect } from "react";
import { useParams, Outlet, Link, useNavigate } from "react-router-dom";
import axios from "axios";
//import "./LotDashboard.css";

const LotDashboard = () => {
  const { lotId } = useParams();
  const [lot, setLot] = useState(null);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchLotData = async () => {
      try {
        const response = await axios.get(
          `http://localhost:5000/api/lots/${lotId}`
        );
        setLot(response.data);
        setLoading(false);
      } catch (err) {
        console.error(err);
        setLoading(false);
        navigate("/lots");
      }
    };
    fetchLotData();
  }, [lotId, navigate]);

  if (loading) return <div>Chargement...</div>;
  if (!lot) return <div>Lot non trouvé</div>;

  return (
    <div className="lot-dashboard">
      <div className="lot-header">
        <h2>
          {lot.number} - {lot.name}
        </h2>
        <p>{lot.description}</p>
        <div className="lot-meta">
          <span>Longueur: {lot.length_km} km</span>
          <span>
            Statut:{" "}
            <span className={`status-badge ${lot.status}`}>{lot.status}</span>
          </span>
        </div>
      </div>

      <nav className="lot-subnav">
        <Link to={`/lots/${lotId}/documents`} className="subnav-link">
          Documents
        </Link>
        <Link to={`/lots/${lotId}/activities`} className="subnav-link">
          Activités
        </Link>
        <Link to={`/lots/${lotId}/communication`} className="subnav-link">
          Communication
        </Link>
        <Link to={`/lots/${lotId}/reports`} className="subnav-link">
          Rapports
        </Link>
      </nav>

      <div className="lot-content">
        <Outlet />
      </div>
    </div>
  );
};

export default LotDashboard;
