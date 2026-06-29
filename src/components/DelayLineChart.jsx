import React from "react";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";

export default function DelayLineChart({ data }) {
  if (!data || data.length === 0) return null;

  
  return (
    <div className="glass-card p-4 h-full">
      <h3 className="text-sm font-heading text-cal-text mb-3">
        Average Delivery Delay
      </h3>

      <div style={{ width: "100%", height: 300 }}>
        <ResponsiveContainer>
          <LineChart data={data}>
            <CartesianGrid strokeDasharray="3 3" opacity={0.2} />
            <XAxis dataKey="date" tick={{ fontSize: 10 }} />
            <YAxis tick={{ fontSize: 10 }} label={{ value: "Hours", angle: -90, position: "insideLeft" }} />
            <Tooltip />

            <Line
              type="monotone"
              dataKey="avgDelay"
              stroke="#4E8055"
              strokeWidth={3}
              dot={{ r: 3 }}
            />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
