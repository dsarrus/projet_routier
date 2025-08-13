/**
 * Utilitaires pour la manipulation des dates
 */

/**
 * Formatte une date au format local (fr-FR par défaut)
 * @param {string|Date} date - Date à formatter
 * @param {string} locale - Locale à utiliser (default: 'fr-FR')
 * @param {Object} options - Options de formatage
 * @returns {string} Date formatée
 */
export const formatDate = (
  date,
  locale = "fr-FR",
  options = {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }
) => {
  if (!date) return "";

  const dateObj = typeof date === "string" ? new Date(date) : date;

  if (isNaN(dateObj.getTime())) {
    console.error("Invalid date:", date);
    return "";
  }

  return new Intl.DateTimeFormat(locale, options).format(dateObj);
};

/**
 * Formatte une date et heure au format local
 * @param {string|Date} date - Date à formatter
 * @param {string} time - Heure à formatter (optionnel si date contient déjà l'heure)
 * @param {string} locale - Locale à utiliser (default: 'fr-FR')
 * @returns {string} Date et heure formatées
 */
export const formatDateTime = (date, time = null, locale = "fr-FR") => {
  if (!date) return "";

  let dateObj;
  if (typeof date === "string") {
    // Si on reçoit une date et heure séparées
    if (time) {
      dateObj = new Date(`${date}T${time}`);
    } else {
      dateObj = new Date(date);
    }
  } else {
    dateObj = date;
  }

  if (isNaN(dateObj.getTime())) {
    console.error("Invalid date:", date, time);
    return "";
  }

  return new Intl.DateTimeFormat(locale, {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  }).format(dateObj);
};

/**
 * Convertit une date en format ISO sans le décalage horaire
 * @param {Date} date
 * @returns {string} Date au format YYYY-MM-DD
 */
export const toISODateString = (date) => {
  if (!date) return "";

  const dateObj = typeof date === "string" ? new Date(date) : date;

  if (isNaN(dateObj.getTime())) {
    console.error("Invalid date:", date);
    return "";
  }

  const year = dateObj.getFullYear();
  const month = String(dateObj.getMonth() + 1).padStart(2, "0");
  const day = String(dateObj.getDate()).padStart(2, "0");

  return `${year}-${month}-${day}`;
};

/**
 * Calcule la différence entre deux dates
 * @param {Date|string} date1 - Date la plus récente
 * @param {Date|string} date2 - Date la plus ancienne
 * @returns {Object} { days, hours, minutes, seconds }
 */
export const dateDiff = (date1, date2) => {
  const d1 = typeof date1 === "string" ? new Date(date1) : date1;
  const d2 = typeof date2 === "string" ? new Date(date2) : date2;

  if (isNaN(d1.getTime()) || isNaN(d2.getTime())) {
    console.error("Invalid dates:", date1, date2);
    return null;
  }

  const diff = Math.abs(d1 - d2);
  const seconds = Math.floor(diff / 1000);
  const minutes = Math.floor(seconds / 60);
  const hours = Math.floor(minutes / 60);
  const days = Math.floor(hours / 24);

  return {
    days,
    hours: hours % 24,
    minutes: minutes % 60,
    seconds: seconds % 60,
  };
};

/**
 * Vérifie si une date est dans le passé
 * @param {Date|string} date
 * @returns {boolean}
 */
export const isPastDate = (date) => {
  const dateObj = typeof date === "string" ? new Date(date) : date;
  return dateObj < new Date();
};

/**
 * Ajoute des jours à une date
 * @param {Date|string} date - Date de départ
 * @param {number} days - Nombre de jours à ajouter
 * @returns {Date} Nouvelle date
 */
export const addDays = (date, days) => {
  const dateObj = typeof date === "string" ? new Date(date) : date;
  const result = new Date(dateObj);
  result.setDate(result.getDate() + days);
  return result;
};

/**
 * Formate une durée en texte lisible
 * @param {number} seconds - Durée en secondes
 * @returns {string} Durée formatée (ex: "2j 5h 30min")
 */
export const formatDuration = (seconds) => {
  if (!seconds) return "0min";

  const days = Math.floor(seconds / (3600 * 24));
  const hours = Math.floor((seconds % (3600 * 24)) / 3600);
  const mins = Math.floor((seconds % 3600) / 60);

  const parts = [];
  if (days > 0) parts.push(`${days}j`);
  if (hours > 0) parts.push(`${hours}h`);
  if (mins > 0 || parts.length === 0) parts.push(`${mins}min`);

  return parts.join(" ");
};

export const DATE_FORMATS = {
  SHORT_DATE: { year: "numeric", month: "numeric", day: "numeric" },
  LONG_DATE: { year: "numeric", month: "long", day: "numeric" },
  FULL_DATETIME: {
    year: "numeric",
    month: "long",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  },
  TIME_ONLY: { hour: "2-digit", minute: "2-digit" },
};

export default {
  formatDate,
  formatDateTime,
  toISODateString,
  dateDiff,
  isPastDate,
  addDays,
  formatDuration,
};
