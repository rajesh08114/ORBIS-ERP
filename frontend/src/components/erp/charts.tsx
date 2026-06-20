"use client";

import { Area, AreaChart, Bar, BarChart, CartesianGrid, Legend, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { dashboardSeries } from "@/mocks/erp-data";

export function RevenueChart() {
  return (
    <Card className="min-h-80 shadow-sm border-[var(--border)]">
      <CardHeader className="pb-2">
        <CardTitle className="text-base font-bold">Revenue Throughput</CardTitle>
        <span className="text-xs text-[var(--muted)]">Monthly digital twin signal (USD millions)</span>
      </CardHeader>
      <CardContent className="h-64">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={dashboardSeries} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
            <defs>
              <linearGradient id="revenue" x1="0" x2="0" y1="0" y2="1">
                <stop offset="5%" stopColor="var(--chart-1)" stopOpacity={0.3} />
                <stop offset="95%" stopColor="var(--chart-1)" stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid stroke="var(--border)" strokeDasharray="3 3" vertical={false} />
            <XAxis dataKey="month" stroke="var(--muted)" fontSize={11} tickLine={false} />
            <YAxis stroke="var(--muted)" fontSize={11} tickLine={false} axisLine={false} />
            <Tooltip 
              contentStyle={{ background: "var(--surface)", border: "1px solid var(--border)", borderRadius: 8, fontSize: 12 }} 
              labelStyle={{ fontWeight: "bold", color: "var(--foreground)" }}
            />
            <Area dataKey="revenue" stroke="var(--chart-1)" fill="url(#revenue)" strokeWidth={2.5} name="Revenue" />
          </AreaChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
}

export function OperationsBarChart() {
  return (
    <Card className="min-h-80 shadow-sm border-[var(--border)]">
      <CardHeader className="pb-2">
        <CardTitle className="text-base font-bold">Operations Health</CardTitle>
        <span className="text-xs text-[var(--muted)]">Inventory and production alignment index</span>
      </CardHeader>
      <CardContent className="h-64">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={dashboardSeries} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
            <CartesianGrid stroke="var(--border)" strokeDasharray="3 3" vertical={false} />
            <XAxis dataKey="month" stroke="var(--muted)" fontSize={11} tickLine={false} />
            <YAxis stroke="var(--muted)" fontSize={11} tickLine={false} axisLine={false} />
            <Tooltip 
              contentStyle={{ background: "var(--surface)", border: "1px solid var(--border)", borderRadius: 8, fontSize: 12 }}
              labelStyle={{ fontWeight: "bold", color: "var(--foreground)" }}
            />
            <Legend verticalAlign="top" height={36} iconType="circle" fontSize={11} wrapperStyle={{ fontSize: 11 }} />
            <Bar dataKey="inventory" fill="var(--chart-2)" radius={[4, 4, 0, 0]} name="Inventory" />
            <Bar dataKey="production" fill="var(--chart-4)" radius={[4, 4, 0, 0]} name="Production" />
          </BarChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
}
