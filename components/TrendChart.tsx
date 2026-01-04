import React from 'react';
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from 'recharts';

interface Point {
  time: string;
  score: number;
}

interface Props {
  data: Point[];
}

/**
 * TrendChart: Line chart showing DQS trend over time.
 * Uses Recharts for responsive visualization.
 */
export const TrendChart: React.FC<Props> = ({ data }) => {
  return (
    <section
      className="card rounded-xl p-5 shadow"
      style={{ background: '#fff', border: '1px solid #e2e8f0' }}
    >
      <h3 className="section-title">DQS Trend</h3>
      <p className="mb-3 text-xs" style={{ color: '#64748b' }}>
        Score history over time
      </p>
      <div style={{ width: '100%', height: 180 }}>
        <ResponsiveContainer>
          <LineChart data={data}>
            <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
            <XAxis dataKey="time" tick={{ fontSize: 11, fill: '#64748b' }} />
            <YAxis domain={[0, 100]} tick={{ fontSize: 11, fill: '#64748b' }} />
            <Tooltip
              contentStyle={{ background: '#fff', border: '1px solid #e2e8f0', borderRadius: 8 }}
              labelStyle={{ color: '#1e293b', fontWeight: 600 }}
            />
            <Line
              type="monotone"
              dataKey="score"
              stroke="#1229D0"
              strokeWidth={3}
              dot={{ r: 4, fill: '#1229D0' }}
              activeDot={{ r: 6 }}
            />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </section>
  );
};

export default TrendChart;
