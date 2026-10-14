"use client"

import React, { useState } from "react"
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  Cell,
} from "recharts"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { DeptScoreChartItem } from "@/lib/dashboard/types"
import { kategoriSkor } from "@/lib/scoring"
import { BarChart3, Table as TableIcon, Award } from "lucide-react"

export interface DeptScoreChartProps {
  data: DeptScoreChartItem[]
  title?: string
  description?: string
}

interface CustomTooltipProps {
  active?: boolean
  payload?: Array<{
    payload: DeptScoreChartItem
  }>
}

function CustomScoreTooltip({ active, payload }: CustomTooltipProps) {
  if (active && payload && payload.length > 0) {
    const item = payload[0].payload
    const category = kategoriSkor(item.score)

    return (
      <div className="rounded-lg border border-border bg-popover p-3 shadow-md text-popover-foreground text-xs space-y-1.5 max-w-[240px]">
        <div className="font-bold text-foreground text-sm border-b pb-1">
          {item.name} ({item.kode})
        </div>
        <div className="flex items-center justify-between gap-3">
          <span className="text-muted-foreground">Rata-rata Skor:</span>
          <span className="font-extrabold text-sm text-foreground">
            {item.score > 0 ? item.score.toFixed(2) : "-"} / 5.00
          </span>
        </div>
        <div className="flex items-center justify-between gap-3">
          <span className="text-muted-foreground">Kategori:</span>
          <Badge
            variant="outline"
            className={`text-[10px] font-semibold px-2 py-0.5 ${category.badgeClass}`}
          >
            {category.kategori}
          </Badge>
        </div>
        <div className="flex items-center justify-between gap-3 text-muted-foreground pt-1 border-t text-[11px]">
          <span>Anggota Dinilai:</span>
          <span className="font-medium text-foreground">
            {item.assessedCount} dari {item.totalMembers}
          </span>
        </div>
      </div>
    )
  }
  return null
}

export function DeptScoreChart({
  data,
  title = "Rata-rata Skor per Departemen",
  description = "Diurutkan dari rata-rata capaian tertinggi ke terendah (Skala Likert 1–5)",
}: DeptScoreChartProps) {
  const [viewMode, setViewMode] = useState<"chart" | "table">("chart")

  return (
    <Card className="border-border shadow-xs">
      <CardHeader className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 pb-2 px-4 sm:px-6">
        <div>
          <div className="flex items-center gap-2">
            <BarChart3 className="size-4 text-emerald-600 dark:text-emerald-400" aria-hidden="true" />
            <CardTitle className="text-base font-bold">{title}</CardTitle>
          </div>
          <CardDescription className="text-xs mt-1">{description}</CardDescription>
        </div>

        {/* View Switcher untuk Aksesibilitas WCAG & Keyboard Navigation */}
        <div className="flex items-center gap-1 self-end sm:self-auto">
          <Button
            variant={viewMode === "chart" ? "default" : "outline"}
            size="sm"
            onClick={() => setViewMode("chart")}
            className="h-7 text-xs px-2.5 gap-1.5"
            aria-label="Tampilkan tampilan grafik batang"
          >
            <BarChart3 className="size-3.5" aria-hidden="true" />
            <span>Grafik</span>
          </Button>
          <Button
            variant={viewMode === "table" ? "default" : "outline"}
            size="sm"
            onClick={() => setViewMode("table")}
            className="h-7 text-xs px-2.5 gap-1.5"
            aria-label="Tampilkan tampilan tabel data"
          >
            <TableIcon className="size-3.5" aria-hidden="true" />
            <span>Tabel</span>
          </Button>
        </div>
      </CardHeader>

      <CardContent className="px-2 sm:px-6 pb-4 pt-2">
        {data.length === 0 ? (
          <div className="py-12 text-center text-xs text-muted-foreground">
            Belum ada data penilaian pada periode ini.
          </div>
        ) : viewMode === "chart" ? (
          <div
            className="w-full h-[320px] sm:h-[360px]"
            role="img"
            aria-label={`Grafik batang rata-rata skor 14 departemen dengan tema emerald (capaian target) dan oren (perlu pembinaan). Peringkat tertinggi: ${data[0]?.name} dengan skor ${data[0]?.score}.`}
          >
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={data}
                margin={{ top: 20, right: 10, left: -20, bottom: 45 }}
              >
                <defs>
                  <linearGradient id="scoreEmeraldGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="var(--chart-1, #10b981)" stopOpacity={1} />
                    <stop offset="100%" stopColor="var(--chart-1, #059669)" stopOpacity={0.85} />
                  </linearGradient>
                  <linearGradient id="scoreOrangeGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="var(--chart-2, #f97316)" stopOpacity={1} />
                    <stop offset="100%" stopColor="var(--chart-2, #ea580c)" stopOpacity={0.85} />
                  </linearGradient>
                </defs>
                <CartesianGrid
                  strokeDasharray="3 3"
                  className="stroke-muted/50"
                  vertical={false}
                />
                <XAxis
                  dataKey="kode"
                  angle={-35}
                  textAnchor="end"
                  interval={0}
                  tick={{ fontSize: 11, fill: "currentColor" }}
                  className="text-muted-foreground"
                  height={50}
                />
                <YAxis
                  domain={[0, 5]}
                  ticks={[1, 2, 3, 4, 5]}
                  tick={{ fontSize: 11, fill: "currentColor" }}
                  className="text-muted-foreground"
                />
                <Tooltip
                  content={<CustomScoreTooltip />}
                  cursor={{ fill: "rgba(16, 185, 129, 0.08)" }}
                />
                <Bar
                  dataKey="score"
                  fill="url(#scoreEmeraldGradient)"
                  radius={[5, 5, 0, 0]}
                  name="Rata-rata Skor"
                >
                  {data.map((entry) => {
                    const isTargetMet = entry.score >= 3.5
                    return (
                      <Cell
                        key={`cell-${entry.id}`}
                        fill={isTargetMet ? "url(#scoreEmeraldGradient)" : "url(#scoreOrangeGradient)"}
                        className="transition-opacity hover:opacity-85"
                      />
                    )
                  })}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        ) : (
          <div className="overflow-x-auto rounded-md border border-border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-12 text-center">No</TableHead>
                  <TableHead>Departemen</TableHead>
                  <TableHead className="text-right">Skor Rata-rata</TableHead>
                  <TableHead>Kategori</TableHead>
                  <TableHead className="text-right">Kelengkapan</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {data.map((d, idx) => {
                  const cat = kategoriSkor(d.score)
                  return (
                    <TableRow key={d.id}>
                      <TableCell className="text-center font-bold text-xs text-muted-foreground">
                        {idx + 1}
                      </TableCell>
                      <TableCell>
                        <div className="font-semibold text-xs sm:text-sm text-foreground">
                          {d.name}
                        </div>
                        <div className="text-[11px] text-muted-foreground">
                          Kode: {d.kode}
                        </div>
                      </TableCell>
                      <TableCell className="text-right font-extrabold text-sm text-foreground">
                        {d.score > 0 ? d.score.toFixed(2) : "-"}
                      </TableCell>
                      <TableCell>
                        <Badge
                          variant="outline"
                          className={`text-xs font-semibold ${cat.badgeClass}`}
                        >
                          {cat.kategori}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right text-xs text-muted-foreground">
                        {d.assessedCount} / {d.totalMembers}
                      </TableCell>
                    </TableRow>
                  )
                })}
              </TableBody>
            </Table>
          </div>
        )}

        <div className="mt-3 flex flex-wrap items-center justify-between gap-2 text-[11px] text-muted-foreground px-2">
          <div className="flex items-center gap-1.5">
            <Award className="size-3.5 text-emerald-600 dark:text-emerald-400" aria-hidden="true" />
            <span>Skala penilaian resmi: 1 (Sangat Kurang) hingga 5 (Sangat Baik).</span>
          </div>
          <div className="flex items-center gap-3 font-medium">
            <div className="flex items-center gap-1.5">
              <span className="size-2.5 rounded-full bg-emerald-600 dark:bg-emerald-500 inline-block shrink-0" aria-hidden="true" />
              <span>Target Baik (≥ 3.50)</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="size-2.5 rounded-full bg-orange-500 dark:bg-orange-400 inline-block shrink-0" aria-hidden="true" />
              <span>Perlu Pembinaan (&lt; 3.50)</span>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
