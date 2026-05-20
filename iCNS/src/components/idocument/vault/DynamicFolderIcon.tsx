// Icône de dossier macOS animée (style backoffice-web gabon-diplomatie).
// Le nombre de feuilles affichées dépend du compteur de documents. Les
// feuilles s'élèvent au hover (parent .group:hover) pour matérialiser
// l'ouverture du dossier.
//
// 3 jeux de couleurs prédéfinis :
//   - default (jaune iCNS, dossier métier)
//   - blue (système "Mes Documents")
//   - gray (système "Brouillons")

import { memo } from "react";

const FOLDER_COLORS = {
  default: {
    back: "#F2C744",
    front: "#FBD87C",
    sheets: ["#FFEAC5", "#FFF7E6", "#FFFFFF"],
  },
  blue: {
    back: "#3B82F6",
    front: "#60A5FA",
    sheets: ["#DBEAFE", "#EFF6FF", "#FFFFFF"],
  },
  gray: {
    back: "#71717A",
    front: "#A1A1AA",
    sheets: ["#E4E4E7", "#F4F4F5", "#FFFFFF"],
  },
} as const;

export type FolderColorScheme = keyof typeof FOLDER_COLORS;

interface DynamicFolderIconProps {
  /** Nombre de documents dans le dossier (0–3 feuilles affichées). */
  count?: number;
  /** Taille en pixels (carré). */
  size?: number;
  className?: string;
  ariaLabel?: string;
  colorScheme?: FolderColorScheme;
}

function DynamicFolderIconImpl({
  count = 0,
  size = 72,
  className,
  ariaLabel = "Dossier",
  colorScheme = "default",
}: DynamicFolderIconProps) {
  const colors = FOLDER_COLORS[colorScheme];
  const sheetsCount = Math.min(Math.max(count, 0), 3);

  // Configurations des 3 feuilles (positions, rotations, déplacement au hover).
  const sheetConfigs = [
    { x: 62, y: 148, w: 300, h: 200, rotate: -3, fill: colors.sheets[0], hoverY: -18 },
    { x: 42, y: 168, w: 300, h: 200, rotate: 0, fill: colors.sheets[1], hoverY: -14 },
    { x: 52, y: 158, w: 290, h: 195, rotate: 3, fill: colors.sheets[2], hoverY: -22 },
  ];

  const visibleSheets =
    sheetsCount === 0
      ? []
      : sheetsCount === 1
        ? [sheetConfigs[1]]
        : sheetsCount === 2
          ? [sheetConfigs[0], sheetConfigs[1]]
          : sheetConfigs;

  return (
    <svg
      role="img"
      aria-label={ariaLabel}
      viewBox="0 0 512 512"
      xmlns="http://www.w3.org/2000/svg"
      width={size}
      height={size}
      className={`drop-shadow-md transition-transform duration-200 ease-out group-hover:scale-110 ${className ?? ""}`}
    >
      {/* Onglet arrière du dossier */}
      <path
        d="m214.2 107-40.2-29.9c-9.5-7-20.9-10.8-32.7-10.8h-110.2c-16.6 0-30 13.4-30 30v349.5h404.1c15.2 0 27.4-12.3 27.4-27.4v-270.6c0-16.6-13.4-30-30-30h-155.6c-11.8 0-23.3-3.8-32.8-10.8z"
        fill={colors.back}
      />
      {/* Feuilles intermédiaires — s'élèvent au hover via translate Y */}
      {visibleSheets.map((sheet, i) => (
        <rect
          key={i}
          x={sheet.x}
          y={sheet.y}
          width={sheet.w}
          height={sheet.h}
          rx={15}
          fill={sheet.fill}
          className="transition-transform duration-300 ease-out group-hover:[transform:translateY(var(--sheet-hover))_rotate(var(--sheet-rotate))]"
          style={
            {
              "--sheet-hover": `${sheet.hoverY}px`,
              "--sheet-rotate": `${sheet.rotate}deg`,
              transform: `rotate(${sheet.rotate}deg)`,
              transformBox: "fill-box",
              transformOrigin: "center bottom",
            } as React.CSSProperties
          }
        />
      ))}
      {/* Pochette avant du dossier */}
      <path
        d="m85.2 220.1-84.1 225.6h410.8c12.5 0 23.7-7.8 28.1-19.5l69-185.2c7.3-19.6-7.2-40.5-28.1-40.5h-367.6c-12.5.1-23.7 7.8-28.1 19.6z"
        fill={colors.front}
      />
    </svg>
  );
}

export const DynamicFolderIcon = memo(DynamicFolderIconImpl);
