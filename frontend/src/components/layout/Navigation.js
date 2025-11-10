import React, { useContext } from "react";
import { Link, NavLink } from "react-router-dom";
import AuthContext from "../../context/AuthContext";
import "./Navigation.css";

const Navigation = () => {
  const { user, isAuthenticated, logout } = useContext(AuthContext);
  console.log(user?.role);

  return (
    <nav className="main-navigation">
      <div className="nav-container">
        <Link to="/" className="nav-brand">
          MSV + MROR
        </Link>

        <div className="nav-links">
          {isAuthenticated ? (
            <>
              <NavLink to="/" className="nav-link">
                Accueil
              </NavLink>
              {user && user.role === "admin" && (
                <NavLink to="/admin" className="nav-link">
                  Administration
                </NavLink>
              )}
              <button onClick={logout} className="nav-button">
                Déconnexion
              </button>
            </>
          ) : (
            <>
              <NavLink to="/login" className="nav-link">
                Connexion
              </NavLink>
              <NavLink to="/register" className="nav-link">
                Inscription
              </NavLink>
            </>
          )}
        </div>
      </div>
    </nav>
  );
};

export default Navigation;
