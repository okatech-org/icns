import React from "react";
import { TrendingUp as TrendingUpIcon, Calendar, FileText, Award, AlertTriangle, Clock, CheckCircle } from "lucide-react";

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

type StatCardProps = {
  title: string;
  value: string | number;
  subtitle?: string;
  icon: React.ComponentType<any>;
  color: string;
  trend?: string;
  theme: ThemeConfig;
};

export const StatCard = React.memo<StatCardProps>(({ title, value, subtitle, icon: Icon, color, trend, theme }) => {
  return (
    <div
      className="p-4 md:p-6"
      style={{
        position: "relative",
        backgroundColor: theme.bgCard,
        border: `1px solid ${theme.border}`,
        borderRadius: "16px",
        boxShadow: theme.shadow,
        transition: "all 0.3s ease",
        cursor: "pointer",
      }}
      onMouseEnter={(e) => (e.currentTarget.style.transform = "translateY(-4px)")}
      onMouseLeave={(e) => (e.currentTarget.style.transform = "translateY(0)")}
    >
      <div style={{ position: "absolute", top: 16, right: 16, width: 40, height: 40, borderRadius: 12, backgroundColor: `${color}20`, display: "flex", alignItems: "center", justifyContent: "center" }}>
        <Icon size={20} />
      </div>
      <p style={{ color: theme.textSecondary, fontSize: "14px", marginBottom: "8px", fontWeight: 500 }}>{title}</p>
      <h2 style={{ color: theme.text, fontSize: "32px", fontWeight: 700, marginBottom: "4px" }}>{value}</h2>
      {subtitle && <p style={{ color: theme.textTertiary, fontSize: "13px" }}>{subtitle}</p>}
      {
        trend && (
          <div style={{ display: "flex", alignItems: "center", marginTop: "8px", gap: "4px" }}>
            <TrendingUpIcon size={16} style={{ color: theme.success }} />
            <span style={{ color: theme.success, fontSize: "13px", fontWeight: 500 }}>{trend}</span>
          </div>
        )
      }
    </div >
  );
});

StatCard.displayName = "StatCard";

type CircularProgressProps = {
  percentage: number;
  label: string;
  color: string;
  theme: ThemeConfig;
};

export const CircularProgress = React.memo<CircularProgressProps>(({ percentage, label, color, theme }) => {
  const radius = 80;
  const strokeWidth = 12;
  const normalizedRadius = radius - strokeWidth * 2;
  const circumference = normalizedRadius * 2 * Math.PI;
  const strokeDashoffset = circumference - (percentage / 100) * circumference;

  return (
    <div style={{ textAlign: "center" }}>
      <svg height={radius * 2} width={radius * 2} style={{ transform: "rotate(-90deg)" }}>
        <circle stroke={theme.bgTertiary} fill="transparent" strokeWidth={strokeWidth} r={normalizedRadius} cx={radius} cy={radius} />
        <circle
          stroke={color}
          fill="transparent"
          strokeWidth={strokeWidth}
          strokeDasharray={`${circumference} ${circumference}`}
          style={{ strokeDashoffset, transition: "stroke-dashoffset 0.5s ease" }}
          strokeLinecap="round"
          r={normalizedRadius}
          cx={radius}
          cy={radius}
        />
      </svg>
      <div style={{ marginTop: "-110px", fontSize: "32px", fontWeight: 700, color: theme.text }}>{percentage}%</div>
      <p style={{ marginTop: "70px", color: theme.textSecondary, fontSize: "14px", fontWeight: 500 }}>{label}</p>
    </div>
  );
});

CircularProgress.displayName = "CircularProgress";

type TimelineItemProps = {
  title: string;
  time: string;
  status: "completed" | "pending" | "urgent";
  theme: ThemeConfig;
};

export const TimelineItem = React.memo<TimelineItemProps>(({ title, time, status, theme }) => {
  const getIcon = () => {
    switch (status) {
      case "completed":
        return <CheckCircle size={16} />;
      case "pending":
        return <Clock size={16} />;
      case "urgent":
        return <AlertTriangle size={16} />;
      default:
        return <Calendar size={16} />;
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

TimelineItem.displayName = "TimelineItem";

type SectionCardProps = {
  title: string;
  children: React.ReactNode;
  theme: ThemeConfig;
  right?: React.ReactNode;
};

export const SectionCard = React.memo<SectionCardProps>(({ title, children, theme, right }) => {
  return (
    <div
      className="p-4 md:p-6"
      style={{
        backgroundColor: theme.bgCard,
        borderRadius: "16px",
        boxShadow: theme.shadow,
        border: `1px solid ${theme.border}`,
      }}
    >
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "20px" }}>
        <h3 style={{ fontSize: "18px", fontWeight: 600, color: theme.text }}>{title}</h3>
        {right}
      </div>
      {children}
    </div >
  );
});

SectionCard.displayName = "SectionCard";
