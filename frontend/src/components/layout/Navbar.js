import React, { useContext } from "react";
import { Link } from "react-router-dom";
import AuthContext from "../../context/AuthContext";

const Navbar = ({ auth }) => {
  return (
    <nav className="navbar">
      <div className="container">
        <Link to="/" className="navbar-brand">
          Gestion des Documents
        </Link>

        <div className="navbar-menu">
          {auth.isAuthenticated ? (
            <>
              <Link to="/documents/type" className="nav-link">
                Types de document
              </Link>
              <Link to="/documents" className="nav-link">
                Documents
              </Link>
              <Link to="/upload" className="nav-link">
                Téléverser
              </Link>
              <button onClick={auth.logout} className="nav-link">
                Déconnexion
              </button>
            </>
          ) : (
            <>
              <Link to="/login" className="nav-link">
                Connexion
              </Link>
              <Link to="/register" className="nav-link">
                Inscription
              </Link>
            </>
          )}
        </div>
      </div>
    </nav>
  );
};

export default Navbar;
