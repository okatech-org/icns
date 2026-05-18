import React from "react";
import { FileText, Users, Award, Activity } from "lucide-react";

type ThemeConfig = {
  primary: string;
  primaryGold: string;
  primaryBlue: string;
  bg: string;
  bgSecondary: string;
  bgTertiary: string;
  bgCard: string;
  text: string;
  textSecondary: string;
  textTertiary: string;
  border: string;
  borderMedium: string;
  success: string;
  warning: string;
  danger: string;
  info: string;
  shadow: string;
  shadowLg: string;
};

type ActivityItemProps = {
  type: "decree" | "meeting" | "nomination" | "other";
  title: string;
  time: string;
  status: "completed" | "pending" | "urgent" | "info";
  theme: ThemeConfig;
};

export const ActivityItem = React.memo<ActivityItemProps>(({ type, title, time, status, theme }) => {
  const getIcon = () => {
    switch (type) {
      case "decree":
        return <FileText size={16} />;
      case "meeting":
        return <Users size={16} />;
      case "nomination":
        return <Award size={16} />;
      default:
        return <Activity size={16} />;
    }
  };

  const getStatusColor = () => {
    switch (status) {
      case "completed":
        return theme.success;
      case "pending":
        return theme.warning;
      case "urgent":
        return theme.danger;
      default:
        return theme.info;
    }
  };

  return (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        padding: "12px 16px",
        backgroundColor: theme.bgSecondary,
        borderRadius: "8px",
        marginBottom: "8px",
        transition: "all 0.2s ease",
        cursor: "pointer",
      }}
      onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = theme.bgTertiary)}
      onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = theme.bgSecondary)}
    >
      <div
        style={{
          width: "32px",
          height: "32px",
          borderRadius: "8px",
          backgroundColor: `${getStatusColor()}20`,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          marginRight: "12px",
        }}
      >
        {React.cloneElement(getIcon(), { style: { color: getStatusColor() } })}
      </div>
      <div style={{ flex: 1 }}>
        <div style={{ color: theme.text, fontSize: "14px", fontWeight: 500 }}>{title}</div>
        <div style={{ color: theme.textTertiary, fontSize: "12px", marginTop: "2px" }}>{time}</div>
      </div>
      <div style={{ width: "8px", height: "8px", borderRadius: "50%", backgroundColor: getStatusColor() }} />
    </div>
  );
});

ActivityItem.displayName = "ActivityItem";
