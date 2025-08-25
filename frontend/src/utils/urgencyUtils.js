// utils/urgencyUtils.js
export const getUrgencyConfig = (urgency) => {
  const configs = {
    low: {
      label: "Faible",
      icon: "📋",
      color: "default",
      bgColor: "#e8f5e8",
    },
    normal: {
      label: "Normal",
      icon: "📨",
      color: "primary",
      bgColor: "#e3f2fd",
    },
    medium: {
      label: "Moyen",
      icon: "⚠️",
      color: "warning",
      bgColor: "#fff3e0",
    },
    high: {
      label: "Urgent",
      icon: "🚨",
      color: "error",
      bgColor: "#ffebee",
    },
  };

  return configs[urgency] || configs.normal;
};

export const urgencyOptions = [
  { value: "low", label: "📋 Faible", color: "default" },
  { value: "normal", label: "📨 Normal", color: "primary" },
  { value: "medium", label: "⚠️ Moyen", color: "warning" },
  { value: "high", label: "🚨 Urgent", color: "error" },
];
