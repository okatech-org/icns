import { useMemo } from "react";
import { LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, Area, AreaChart } from "recharts";
import type { ThreatIndicator, SurveillanceTarget } from "@/types/dgss";
import { TrendingUp, Activity } from "lucide-react";

interface ThreatTrendsProps {
  threats: ThreatIndicator[];
  targets: SurveillanceTarget[];
}

export const ThreatTrends = ({ threats, targets }: ThreatTrendsProps) => {
  const timeSeriesData = useMemo(() => {
    const last30Days = Array.from({ length: 30 }, (_, i) => {
      const date = new Date();
      date.setDate(date.getDate() - (29 - i));
      return date.toISOString().split('T')[0];
    });

    return last30Days.map(date => {
      const dayThreats = threats.filter(t => t.timestamp?.startsWith(date));
      
      return {
        date: new Date(date).toLocaleDateString('fr-FR', { day: '2-digit', month: 'short' }),
        total: dayThreats.length,
        critical: dayThreats.filter(t => t.level === 'critical').length,
        high: dayThreats.filter(t => t.level === 'high').length,
        elevated: dayThreats.filter(t => t.level === 'elevated').length,
        guarded: dayThreats.filter(t => t.level === 'guarded').length,
        low: dayThreats.filter(t => t.level === 'low').length,
      };
    });
  }, [threats]);

  const threatTypeData = useMemo(() => {
    const typeMap = new Map<string, number>();
    
    threats.forEach(threat => {
      const type = threat.type || "Non spécifié";
      typeMap.set(type, (typeMap.get(type) || 0) + 1);
    });

    return Array.from(typeMap.entries())
      .map(([type, count]) => ({ type, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 8);
  }, [threats]);

  const targetStatusData = useMemo(() => {
    const statusCounts = {
      active: targets.filter(t => t.status === 'active').length,
      inactive: targets.filter(t => t.status === 'inactive').length,
      under_review: targets.filter(t => t.status === 'under_review').length,
      neutralized: targets.filter(t => t.status === 'neutralized').length,
    };

    return [
      { status: 'Actif', count: statusCounts.active, fill: 'hsl(var(--chart-1))' },
      { status: 'Inactif', count: statusCounts.inactive, fill: 'hsl(var(--chart-2))' },
      { status: 'En révision', count: statusCounts.under_review, fill: 'hsl(var(--chart-3))' },
      { status: 'Neutralisé', count: statusCounts.neutralized, fill: 'hsl(var(--chart-4))' },
    ].filter(d => d.count > 0);
  }, [targets]);

  return (
    <div className="space-y-6">
      {/* Timeline des menaces */}
      <div className="neu-card p-6">
        <div className="flex items-center gap-3 mb-6">
          <div className="neu-raised w-10 h-10 rounded-lg flex items-center justify-center">
            <TrendingUp className="w-5 h-5 text-primary" />
          </div>
          <div>
            <h3 className="text-lg font-semibold">Évolution des Menaces (30 derniers jours)</h3>
            <p className="text-sm text-muted-foreground">Tendance par niveau de criticité</p>
          </div>
        </div>

        <ResponsiveContainer width="100%" height={300}>
          <AreaChart data={timeSeriesData}>
            <defs>
              <linearGradient id="colorCritical" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="hsl(0, 84%, 60%)" stopOpacity={0.8}/>
                <stop offset="95%" stopColor="hsl(0, 84%, 60%)" stopOpacity={0}/>
              </linearGradient>
              <linearGradient id="colorHigh" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="hsl(25, 95%, 53%)" stopOpacity={0.8}/>
                <stop offset="95%" stopColor="hsl(25, 95%, 53%)" stopOpacity={0}/>
              </linearGradient>
              <linearGradient id="colorElevated" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="hsl(45, 93%, 47%)" stopOpacity={0.8}/>
                <stop offset="95%" stopColor="hsl(45, 93%, 47%)" stopOpacity={0}/>
              </linearGradient>
              <linearGradient id="colorGuarded" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="hsl(217, 91%, 60%)" stopOpacity={0.8}/>
                <stop offset="95%" stopColor="hsl(217, 91%, 60%)" stopOpacity={0}/>
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" className="opacity-30" />
            <XAxis dataKey="date" className="text-xs" />
            <YAxis className="text-xs" />
            <Tooltip 
              contentStyle={{ 
                backgroundColor: 'hsl(var(--background))',
                border: '1px solid hsl(var(--border))',
                borderRadius: '8px',
                boxShadow: '0 4px 12px rgba(0,0,0,0.15)'
              }}
            />
            <Legend />
            <Area 
              type="monotone" 
              dataKey="critical" 
              stackId="1"
              stroke="hsl(0, 84%, 60%)" 
              fillOpacity={1}
              fill="url(#colorCritical)"
              name="Critique"
            />
            <Area 
              type="monotone" 
              dataKey="high" 
              stackId="1"
              stroke="hsl(25, 95%, 53%)" 
              fillOpacity={1}
              fill="url(#colorHigh)"
              name="Élevé"
            />
            <Area 
              type="monotone" 
              dataKey="elevated" 
              stackId="1"
              stroke="hsl(45, 93%, 47%)" 
              fillOpacity={1}
              fill="url(#colorElevated)"
              name="Modéré"
            />
            <Area 
              type="monotone" 
              dataKey="guarded" 
              stackId="1"
              stroke="hsl(217, 91%, 60%)" 
              fillOpacity={1}
              fill="url(#colorGuarded)"
              name="Surveillé"
            />
            <Area 
              type="monotone" 
              dataKey="low" 
              stackId="1"
              stroke="hsl(142, 76%, 36%)" 
              fill="hsl(142, 76%, 36%)"
              fillOpacity={0.6}
              name="Faible"
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Distribution par type de menace */}
        <div className="neu-card p-6">
          <div className="flex items-center gap-3 mb-6">
            <div className="neu-raised w-10 h-10 rounded-lg flex items-center justify-center">
              <Activity className="w-5 h-5 text-primary" />
            </div>
            <div>
              <h3 className="text-lg font-semibold">Types de Menaces</h3>
              <p className="text-sm text-muted-foreground">Distribution par catégorie</p>
            </div>
          </div>

          <ResponsiveContainer width="100%" height={250}>
            <BarChart data={threatTypeData}>
              <CartesianGrid strokeDasharray="3 3" className="opacity-30" />
              <XAxis 
                dataKey="type" 
                className="text-xs"
                angle={-45}
                textAnchor="end"
                height={80}
              />
              <YAxis className="text-xs" />
              <Tooltip 
                contentStyle={{ 
                  backgroundColor: 'hsl(var(--background))',
                  border: '1px solid hsl(var(--border))',
                  borderRadius: '8px',
                  boxShadow: '0 4px 12px rgba(0,0,0,0.15)'
                }}
              />
              <Bar 
                dataKey="count" 
                fill="hsl(var(--primary))" 
                radius={[8, 8, 0, 0]}
                name="Nombre de menaces"
              />
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Statut des cibles */}
        <div className="neu-card p-6">
          <div className="flex items-center gap-3 mb-6">
            <div className="neu-raised w-10 h-10 rounded-lg flex items-center justify-center">
              <Activity className="w-5 h-5 text-primary" />
            </div>
            <div>
              <h3 className="text-lg font-semibold">Statut des Cibles</h3>
              <p className="text-sm text-muted-foreground">Répartition par état</p>
            </div>
          </div>

          <ResponsiveContainer width="100%" height={250}>
            <BarChart data={targetStatusData} layout="vertical">
              <CartesianGrid strokeDasharray="3 3" className="opacity-30" />
              <XAxis type="number" className="text-xs" />
              <YAxis dataKey="status" type="category" className="text-xs" width={100} />
              <Tooltip 
                contentStyle={{ 
                  backgroundColor: 'hsl(var(--background))',
                  border: '1px solid hsl(var(--border))',
                  borderRadius: '8px',
                  boxShadow: '0 4px 12px rgba(0,0,0,0.15)'
                }}
              />
              <Bar 
                dataKey="count" 
                radius={[0, 8, 8, 0]}
                name="Nombre de cibles"
              />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
};
