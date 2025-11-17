import React from "react";
import { PieChart, Pie, Cell, Legend, Tooltip } from "recharts";

const COLORS = ["#4CAF50", "#F44336"]; // GREEN = On-Time, RED = Delayed

export default function DeliveryPieChart({ analytics }) {
  if (!analytics) return null;

  const data = [
    { name: "On Time", value: analytics.onTime },
    { name: "Delayed", value: analytics.delayed },
  ];

  return (
    <div className="glass-card p-4 flex flex-col items-center ">
      <h3 className="text-sm font-heading text-cal-text mb-3">
        Delivery Performance
      </h3>

      <PieChart width={280} height={260}>
        <Pie
          data={data}
          dataKey="value"
          nameKey="name"
          cx="50%"
          cy="50%"
          innerRadius={60}
          outerRadius={90}
          paddingAngle={3}
        >
          {data.map((entry, index) => (
            <Cell key={index} fill={COLORS[index]} />
          ))}
        </Pie>

        <Tooltip />
        <Legend verticalAlign="bottom" height={36} />
      </PieChart>
    </div>
  );
}
