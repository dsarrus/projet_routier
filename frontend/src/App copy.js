import React from "react";
import { Routes, Route, Navigate } from "react-router-dom";
import AuthContext from "./context/AuthContext";
import Navigation from "./components/layout/Navigation";
import Home from "./components/pages/Home";
import Login from "./components/auth/Login";
import Register from "./components/auth/Register";
import LotDashboard from "./components/lots/LotDashboard";
import Documents from "./components/documents/Documents";
import DocumentDetails from "./components/documents/DocumentDetails";
import UploadDocument from "./components/documents/UploadDocument";
import AddDocumentType from "./components/documents/AddDocumentType";
import DocumentTypesManager from "./components/documents/DocumentTypesManager";

function App() {
  return (
    <AuthContext.Consumer>
      {(auth) => (
        <div className="app-container">
          <Navigation />
          <main className="main-content">
            <Routes>
              <Route path="/" element={<Home />} />
              <Route
                path="/login"
                element={
                  auth.isAuthenticated ? (
                    <Navigate to="/" />
                  ) : (
                    <Login login={auth.login} />
                  )
                }
              />
              <Route
                path="/register"
                element={
                  auth.isAuthenticated ? (
                    <Navigate to="/" />
                  ) : (
                    <Register register={auth.register} />
                  )
                }
              />
              <Route
                path="/lots/:id"
                element={
                  auth.isAuthenticated ? (
                    <LotDashboard />
                  ) : (
                    <Navigate to="/login" />
                  )
                }
              />
              <Route
                path="/documents/:id"
                element={
                  auth.isAuthenticated ? (
                    <DocumentDetails />
                  ) : (
                    <Navigate to="/login" />
                  )
                }
              />
              <Route
                path="/documents"
                element={
                  auth.isAuthenticated ? (
                    <Documents />
                  ) : (
                    <Navigate to="/login" />
                  )
                }
              />
              <Route
                path="/documents/:id"
                element={
                  auth.isAuthenticated ? (
                    <DocumentDetails />
                  ) : (
                    <Navigate to="/login" />
                  )
                }
              />
              <Route
                path="/upload"
                element={
                  auth.isAuthenticated ? (
                    <UploadDocument />
                  ) : (
                    <Navigate to="/login" />
                  )
                }
              />
              <Route
                path="/add-type"
                element={
                  auth.isAuthenticated ? (
                    <AddDocumentType />
                  ) : (
                    <Navigate to="/login" />
                  )
                }
              />
              <Route
                path="/documents/type"
                element={
                  auth.isAuthenticated ? (
                    <DocumentTypesManager />
                  ) : (
                    <Navigate to="/login" />
                  )
                }
              />
            </Routes>
          </main>
          <footer className="app-footer">
            <p>© 2023 Gestion des Lots Routiers</p>
          </footer>
        </div>
      )}
    </AuthContext.Consumer>
  );
}

export default App;
