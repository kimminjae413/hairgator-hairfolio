import React, { useMemo } from 'react';
import { DesignerStats, Hairstyle } from '../types';

interface AnalyticsDashboardProps {
  stats: DesignerStats;
  portfolio: Hairstyle[];
}

const findTopStyle = (
  statsMap: { [url: string]: number },
  portfolio: Hairstyle[]
): { style: Hairstyle | null; count: number } => {
  if (!statsMap || Object.keys(statsMap).length === 0) {
    return { style: null, count: 0 };
  }

  const topUrl = Object.entries(statsMap).reduce((a, b) => (b[1] > a[1] ? b : a))[0];
  const topStyle = portfolio.find((img) => img.url === topUrl) || null;
  const topCount = statsMap[topUrl];

  return { style: topStyle, count: topCount };
};

const StatCard: React.FC<{ title: string; children: React.ReactNode; className?: string }> = ({ title, children, className = '' }) => (
  <div className={`bg-white p-6 rounded-xl shadow-md ${className}`}>
    <h3 className="text-lg font-semibold text-gray-500 mb-4">{title}</h3>
    {children}
  </div>
);

const AnalyticsDashboard: React.FC<AnalyticsDashboardProps> = ({ stats, portfolio }) => {
  const topViewed = useMemo(() => findTopStyle(stats.styleViews, portfolio), [stats.styleViews, portfolio]);
  const topBooked = useMemo(() => findTopStyle(stats.bookings, portfolio), [stats.bookings, portfolio]);
  
  const totalStyleViews = useMemo(() => Object.values(stats.styleViews || {}).reduce((sum, count) => sum + count, 0), [stats.styleViews]);
  const totalBookings = useMemo(() => Object.values(stats.bookings || {}).reduce((sum, count) => sum + count, 0), [stats.bookings]);

  const hasData = stats.visits > 0 || totalStyleViews > 0;

  if (!hasData) {
    return (
      <div className="text-center py-16 text-gray-500">
        <h2 className="text-2xl font-bold text-gray-700">No Analytics Data Yet</h2>
        <p className="mt-2">Share your portfolio with clients to start seeing statistics here.</p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      <StatCard title="Portfolio Overview" className="lg:col-span-3">
        <div className="flex flex-col sm:flex-row justify-around text-center gap-6">
            <div>
                <p className="text-5xl font-bold text-indigo-600">{stats.visits}</p>
                <p className="text-sm text-gray-500 mt-1">Total Visits</p>
            </div>
            <div className="border-l border-gray-200 hidden sm:block"></div>
            <div>
                <p className="text-5xl font-bold text-indigo-600">{totalStyleViews}</p>
                <p className="text-sm text-gray-500 mt-1">Style Try-ons</p>
            </div>
            <div className="border-l border-gray-200 hidden sm:block"></div>
            <div>
                <p className="text-5xl font-bold text-green-600">{totalBookings}</p>
                <p className="text-sm text-gray-500 mt-1">Bookings</p>
            </div>
        </div>
      </StatCard>
      
      <StatCard title="Most Popular Style" className="lg:col-span-2">
        {topViewed.style ? (
          <div className="flex items-center gap-4">
            <img src={topViewed.style.url} alt={topViewed.style.name} className="w-24 h-24 rounded-md object-cover" />
            <div>
              <p className="font-bold text-gray-800 text-lg">{topViewed.style.name}</p>
              <p className="text-4xl font-bold text-indigo-600">{topViewed.count} <span className="text-xl text-gray-500 font-medium">views</span></p>
            </div>
          </div>
        ) : (
          <p className="text-gray-500 h-full flex items-center justify-center">No style views yet.</p>
        )}
      </StatCard>
      
      <StatCard title="Top Booking Driver">
        {topBooked.style ? (
          <div className="flex flex-col items-center justify-center text-center h-full">
            <img src={topBooked.style.url} alt={topBooked.style.name} className="w-24 h-24 rounded-md object-cover mb-3" />
            <div>
              <p className="font-bold text-gray-800">{topBooked.style.name}</p>
              <p className="text-3xl font-bold text-green-600">{topBooked.count} <span className="text-lg text-gray-500 font-medium">bookings</span></p>
            </div>
          </div>
        ) : (
          <p className="text-gray-500 h-full flex items-center justify-center">No bookings tracked yet.</p>
        )}
      </StatCard>
    </div>
  );
};

export default AnalyticsDashboard;
