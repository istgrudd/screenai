import {
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  Radar,
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip as RTooltip,
  Cell,
} from "recharts";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { CHART_COLORS } from "@/lib/chartColors";

/**
 * Competency Radar + Score Breakdown charts for a set of dimension scores.
 * Reused by the recruiter candidate detail, the demo submission detail, and
 * (compact) the public demo result. Mobile-first: charts stack on small
 * screens and stay inside a ResponsiveContainer so there is no horizontal
 * overflow.
 *
 * @param {Array<{dimension_name: string, score: number, weight?: number}>} scores
 * @param {number} [height=260] chart height in px
 * @param {boolean} [compact=false] tighter headers/labels for the demo result
 */
export default function DimensionCharts({ scores, height = 260, compact = false }) {
  if (!scores || scores.length === 0) return null;

  const radarData = scores.map((s) => ({
    dimension: s.dimension_name,
    score: Number(s.score),
    fullMark: 100,
  }));

  const barData = scores.map((s, i) => ({
    name: s.dimension_name,
    score: Number(s.score),
    weight: s.weight != null ? Math.round(s.weight * 100) : null,
    fill: CHART_COLORS[i % CHART_COLORS.length],
  }));

  // Shorten long axis labels so they don't overflow on narrow phones.
  const shorten = (v) => (v && v.length > 16 ? v.slice(0, 15) + "…" : v);

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className={compact ? "text-sm" : "text-base"}>
            Competency Radar
          </CardTitle>
        </CardHeader>
        <CardContent className="px-1 sm:px-4">
          <ResponsiveContainer width="100%" height={height}>
            <RadarChart data={radarData} outerRadius="70%">
              <PolarGrid stroke="hsl(var(--border))" />
              <PolarAngleAxis
                dataKey="dimension"
                tick={{ fontSize: 10, fill: "hsl(var(--muted-foreground))" }}
                tickFormatter={shorten}
              />
              <PolarRadiusAxis angle={90} domain={[0, 100]} tick={{ fontSize: 9 }} />
              <Radar
                dataKey="score"
                stroke="hsl(217, 91%, 60%)"
                fill="hsl(217, 91%, 60%)"
                fillOpacity={0.2}
                strokeWidth={2}
              />
            </RadarChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="pb-2">
          <CardTitle className={compact ? "text-sm" : "text-base"}>
            Score Breakdown
          </CardTitle>
        </CardHeader>
        <CardContent className="px-1 sm:px-4">
          <ResponsiveContainer width="100%" height={height}>
            <BarChart data={barData} layout="vertical" margin={{ left: 8, right: 8 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
              <XAxis type="number" domain={[0, 100]} tick={{ fontSize: 10 }} />
              <YAxis
                dataKey="name"
                type="category"
                width={88}
                tick={{ fontSize: 10 }}
                tickFormatter={shorten}
              />
              <RTooltip
                contentStyle={{
                  backgroundColor: "hsl(var(--card))",
                  border: "1px solid hsl(var(--border))",
                  borderRadius: "8px",
                  fontSize: "12px",
                }}
                formatter={(value) => [`${Number(value).toFixed(1)}`, "Score"]}
              />
              <Bar dataKey="score" radius={[0, 4, 4, 0]} barSize={18}>
                {barData.map((entry, idx) => (
                  <Cell key={idx} fill={entry.fill} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>
    </div>
  );
}
