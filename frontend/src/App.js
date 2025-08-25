import React from "react";
import { Routes, Route, Navigate } from "react-router-dom";
import { SnackbarProvider } from "notistack";
import AuthContext from "./context/AuthContext";
import Navigation from "./components/layout/Navigation";
import Home from "./components/pages/Home";
import Login from "./components/auth/Login";
import Register from "./components/auth/Register";
import LotDashboard from "./components/lots/LotDashboard";
import DocumentsTab from "./components/documents/DocumentsTab"; // Remplace Documents
import DocumentDetails from "./components/documents/DocumentDetails";
import UserManagement from "./components/admin/UserManagement";

function App() {
  return (
    <SnackbarProvider
      maxSnack={3}
      anchorOrigin={{
        vertical: "top",
        horizontal: "right",
      }}
      autoHideDuration={3000}
      dense
      preventDuplicate
    >
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

                {/* Routes pour les lots */}
                <Route
                  path="/lots/:id"
                  element={
                    auth.isAuthenticated ? (
                      <LotDashboard />
                    ) : (
                      <Navigate to="/login" />
                    )
                  }
                >
                  <Route path="documents" element={<DocumentsTab />} />
                  <Route
                    path="documents/:docId"
                    element={<DocumentDetails />}
                  />
                </Route>

                {/* Routes globales pour les documents */}
                <Route
                  path="/documents"
                  element={
                    auth.isAuthenticated ? (
                      <Navigate to="/lots" /> // Redirige vers la liste des lots
                    ) : (
                      <Navigate to="/login" />
                    )
                  }
                />

                {/* Routes d'administration */}
                <Route
                  path="/admin"
                  element={
                    auth.isAuthenticated && auth.user.role === "admin" ? (
                      <UserManagement />
                    ) : (
                      <Navigate to="/login" />
                    )
                  }
                />
              </Routes>
            </main>
            <footer className="app-footer">
              <p>© {new Date().getFullYear()} Gestion des Lots Routiers</p>
            </footer>
          </div>
        )}
      </AuthContext.Consumer>
    </SnackbarProvider>
  );
}

export default App;
