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
  Legend,
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
import { DeptCompletionChartItem } from "@/lib/dashboard/types"
import { CheckCircle2, AlertCircle, BarChart2, Table as TableIcon } from "lucide-react"

export interface CompletionChartProps {
  data: DeptCompletionChartItem[]
  title?: string
  description?: string
}

interface CustomCompletionTooltipProps {
  active?: boolean
  payload?: Array<{
    name: string
    value: number
    payload: DeptCompletionChartItem
  }>
}

function CustomCompletionTooltip({ active, payload }: CustomCompletionTooltipProps) {
  if (active && payload && payload.length > 0) {
    const item = payload[0].payload

    return (
      <div className="rounded-lg border border-border bg-popover p-3 shadow-md text-popover-foreground text-xs space-y-1.5 max-w-[240px]">
        <div className="font-bold text-foreground text-sm border-b pb-1">
          {item.name} ({item.kode})
        </div>
        <div className="space-y-1">
          <div className="flex items-center justify-between gap-3 text-emerald-600 dark:text-emerald-400 font-semibold">
            <span>Selesai Dinilai:</span>
            <span>
              {item.completedPercent}% ({item.completedCount} orang)
            </span>
          </div>
          <div className="flex items-center justify-between gap-3 text-orange-600 dark:text-orange-400 font-semibold">
            <span>Belum Selesai:</span>
            <span>
              {item.incompletePercent}% ({item.totalMembers - item.completedCount} orang)
            </span>
          </div>
        </div>
        <div className="pt-1 border-t text-[11px] text-muted-foreground flex justify-between">
          <span>Total Anggota:</span>
          <span className="font-bold text-foreground">{item.totalMembers} orang</span>
        </div>
      </div>
    )
  }
  return null
}

export function CompletionChart({
  data,
  title = "Persentase Penyelesaian per Departemen",
  description = "Tingkat kelengkapan penilaian anggota per departemen pada periode berjalan",
}: CompletionChartProps) {
  const [viewMode, setViewMode] = useState<"chart" | "table">("chart")

  return (
    <Card className="border-border shadow-xs">
      <CardHeader className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 pb-2 px-4 sm:px-6">
        <div>
          <div className="flex items-center gap-2">
            <CheckCircle2 className="size-4 text-emerald-600 dark:text-emerald-400" aria-hidden="true" />
            <CardTitle className="text-base font-bold">{title}</CardTitle>
          </div>
          <CardDescription className="text-xs mt-1">{description}</CardDescription>
        </div>

        {/* View Switcher */}
        <div className="flex items-center gap-1 self-end sm:self-auto">
          <Button
            variant={viewMode === "chart" ? "default" : "outline"}
            size="sm"
            onClick={() => setViewMode("chart")}
            className="h-7 text-xs px-2.5 gap-1.5"
            aria-label="Tampilkan tampilan grafik batang penyelesaian"
          >
            <BarChart2 className="size-3.5" aria-hidden="true" />
            <span>Grafik</span>
          </Button>
          <Button
            variant={viewMode === "table" ? "default" : "outline"}
            size="sm"
            onClick={() => setViewMode("table")}
            className="h-7 text-xs px-2.5 gap-1.5"
            aria-label="Tampilkan tampilan tabel penyelesaian"
          >
            <TableIcon className="size-3.5" aria-hidden="true" />
            <span>Tabel</span>
          </Button>
        </div>
      </CardHeader>

      <CardContent className="px-2 sm:px-6 pb-4 pt-2">
        {data.length === 0 ? (
          <div className="py-12 text-center text-xs text-muted-foreground">
            Belum ada data departemen pada periode ini.
          </div>
        ) : viewMode === "chart" ? (
          <div
            className="w-full h-[320px] sm:h-[360px]"
            role="img"
            aria-label="Grafik batang persentase penyelesaian per departemen: segmen hijau emerald untuk bagian selesai dan segmen oren untuk bagian belum selesai."
          >
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={data}
                margin={{ top: 20, right: 10, left: -20, bottom: 45 }}
              >
                <defs>
                  <linearGradient id="completionEmeraldGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="var(--chart-1, #10b981)" stopOpacity={1} />
                    <stop offset="100%" stopColor="var(--chart-1, #059669)" stopOpacity={0.88} />
                  </linearGradient>
                  <linearGradient id="completionOrangeGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="var(--chart-2, #f97316)" stopOpacity={1} />
                    <stop offset="100%" stopColor="var(--chart-2, #ea580c)" stopOpacity={0.88} />
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
                  domain={[0, 100]}
                  ticks={[0, 25, 50, 75, 100]}
                  unit="%"
                  tick={{ fontSize: 11, fill: "currentColor" }}
                  className="text-muted-foreground"
                />
                <Tooltip
                  content={<CustomCompletionTooltip />}
                  cursor={{ fill: "rgba(16, 185, 129, 0.08)" }}
                />
                <Legend
                  verticalAlign="top"
                  align="right"
                  wrapperStyle={{ paddingBottom: 10, fontSize: 11 }}
                  formatter={(value) => (
                    <span className="text-foreground font-medium">{value}</span>
                  )}
                />
                {/* Segmen Hijau Emerald untuk Selesai */}
                <Bar
                  dataKey="completedPercent"
                  stackId="completion"
                  name="Selesai Dinilai (%)"
                  fill="url(#completionEmeraldGradient)"
                  radius={[0, 0, 0, 0]}
                />
                {/* Segmen Oren untuk Belum Selesai */}
                <Bar
                  dataKey="incompletePercent"
                  stackId="completion"
                  name="Belum Selesai (%)"
                  fill="url(#completionOrangeGradient)"
                  radius={[4, 4, 0, 0]}
                />
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
                  <TableHead className="text-right">Selesai</TableHead>
                  <TableHead className="text-right">Belum Selesai</TableHead>
                  <TableHead className="text-center">Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {data.map((d, idx) => {
                  const isDone = d.completedPercent === 100
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
                          {d.completedCount} dari {d.totalMembers} anggota
                        </div>
                      </TableCell>
                      <TableCell className="text-right font-extrabold text-xs sm:text-sm text-emerald-600 dark:text-emerald-400">
                        {d.completedPercent}%
                      </TableCell>
                      <TableCell className="text-right font-extrabold text-xs sm:text-sm text-orange-600 dark:text-orange-400">
                        {d.incompletePercent}%
                      </TableCell>
                      <TableCell className="text-center">
                        {isDone ? (
                          <Badge className="bg-emerald-700 text-white text-xs font-semibold">
                            Lengkap
                          </Badge>
                        ) : (
                          <Badge className="bg-orange-700 text-white text-xs font-semibold">
                            Belum Lengkap
                          </Badge>
                        )}
                      </TableCell>
                    </TableRow>
                  )
                })}
              </TableBody>
            </Table>
          </div>
        )}

        <div className="mt-3 flex items-center justify-between text-[11px] text-muted-foreground px-2">
          <div className="flex items-center gap-1.5">
            <AlertCircle className="size-3.5 text-orange-500" aria-hidden="true" />
            <span>Segmen oren menandakan sisa anggota yang belum di-submit atau memerlukan revisi.</span>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
