import React, { useState, useEffect } from "react";
import { useParams } from "react-router-dom";
import { Tabs, Tab, Box } from "@mui/material";
import DocumentsTab from "../documents/DocumentsTab";
import ActivitiesTab from "../activites/ActivitiesTab";
import CommunicationTab from "../communication/CommunicationTab";
import axios from "axios";

const LotDashboard = () => {
  const { id } = useParams();
  const [lot, setLot] = useState(null);
  const [tabValue, setTabValue] = useState(0);

  useEffect(() => {
    fetchLotData();
  }, []);

  const fetchLotData = async () => {
    if (!id) return;
    try {
      const response = await axios.get(`http://localhost:5000/api/lots/${id}`);
      setLot(response.data);
    } catch (err) {
      console.error(err);
    }
  };

  const handleTabChange = (event, newValue) => {
    setTabValue(newValue);
  };

  return (
    <div className="lot-dashboard">
      <h2>
        Gestion du {lot?.number} - {lot?.name}
      </h2>

      <Box sx={{ borderBottom: 1, borderColor: "divider" }}>
        <Tabs value={tabValue} onChange={handleTabChange}>
          <Tab label="Documents" />
          <Tab label="Activités" />
          <Tab label="Communication" />
          <Tab label="Rapports" />
        </Tabs>
      </Box>

      <div className="tab-content">
        {tabValue === 0 && <DocumentsTab lotId={id} />}
        {tabValue === 1 && <ActivitiesTab lotId={id} />}
        {tabValue === 2 && <CommunicationTab lotId={id} />}
      </div>
    </div>
  );
};

export default LotDashboard;
