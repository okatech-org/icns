import { useMemo } from "react";
import type { ThreatIndicator } from "@/types/dgss";
import { MapPin } from "lucide-react";

interface ThreatHeatmapProps {
  threats: ThreatIndicator[];
}

export const ThreatHeatmap = ({ threats }: ThreatHeatmapProps) => {
  const locationData = useMemo(() => {
    const locationMap = new Map<string, { count: number; critical: number; high: number; elevated: number; guarded: number; low: number }>();
    
    threats.forEach((threat) => {
      const location = threat.location || "Non spécifié";
      const current = locationMap.get(location) || { count: 0, critical: 0, high: 0, elevated: 0, guarded: 0, low: 0 };
      
      current.count += 1;
      if (threat.level === "critical") current.critical += 1;
      else if (threat.level === "high") current.high += 1;
      else if (threat.level === "elevated") current.elevated += 1;
      else if (threat.level === "guarded") current.guarded += 1;
      else current.low += 1;
      
      locationMap.set(location, current);
    });
    
    return Array.from(locationMap.entries())
      .map(([location, data]) => ({
        location,
        ...data,
        intensity: (data.critical * 5 + data.high * 4 + data.elevated * 3 + data.guarded * 2 + data.low) / data.count
      }))
      .sort((a, b) => b.intensity - a.intensity);
  }, [threats]);

  const getIntensityColor = (intensity: number) => {
    if (intensity >= 3.5) return "bg-red-500/20 border-red-500 text-red-500";
    if (intensity >= 2.5) return "bg-orange-500/20 border-orange-500 text-orange-500";
    if (intensity >= 1.5) return "bg-yellow-500/20 border-yellow-500 text-yellow-500";
    return "bg-green-500/20 border-green-500 text-green-500";
  };

  const getIntensitySize = (intensity: number) => {
    if (intensity >= 3.5) return "text-2xl";
    if (intensity >= 2.5) return "text-xl";
    if (intensity >= 1.5) return "text-lg";
    return "text-base";
  };

  return (
    <div className="neu-card p-6">
      <div className="flex items-center gap-3 mb-6">
        <div className="neu-raised w-10 h-10 rounded-lg flex items-center justify-center">
          <MapPin className="w-5 h-5 text-primary" />
        </div>
        <div>
          <h3 className="text-lg font-semibold">Carte de Chaleur des Menaces</h3>
          <p className="text-sm text-muted-foreground">Distribution géographique par intensité</p>
        </div>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
        {locationData.map(({ location, count, critical, high, elevated, guarded, low, intensity }) => (
          <div
            key={location}
            className={`neu-inset p-4 rounded-lg border-2 transition-all hover:scale-105 ${getIntensityColor(intensity)}`}
          >
            <div className="flex flex-col items-center text-center gap-2">
              <MapPin className={`${getIntensitySize(intensity)} opacity-80`} />
              <div className="font-semibold text-sm truncate w-full">{location}</div>
              <div className="text-2xl font-bold">{count}</div>
              <div className="text-xs opacity-70 space-y-1 w-full">
                {critical > 0 && <div>🔴 {critical} critique{critical > 1 ? 's' : ''}</div>}
                {high > 0 && <div>🟠 {high} élevée{high > 1 ? 's' : ''}</div>}
                {elevated > 0 && <div>🟡 {elevated} modérée{elevated > 1 ? 's' : ''}</div>}
                {guarded > 0 && <div>🔵 {guarded} surveillée{guarded > 1 ? 's' : ''}</div>}
                {low > 0 && <div>🟢 {low} faible{low > 1 ? 's' : ''}</div>}
              </div>
            </div>
          </div>
        ))}
      </div>

      {locationData.length === 0 && (
        <div className="text-center py-12 text-muted-foreground">
          <MapPin className="w-12 h-12 mx-auto mb-4 opacity-30" />
          <p>Aucune donnée de localisation disponible</p>
        </div>
      )}

      <div className="mt-6 flex items-center justify-center gap-6 text-xs">
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 rounded-full bg-red-500" />
          <span>Critique</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 rounded-full bg-orange-500" />
          <span>Élevé</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 rounded-full bg-yellow-500" />
          <span>Moyen</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 rounded-full bg-green-500" />
          <span>Faible</span>
        </div>
      </div>
    </div>
  );
};
