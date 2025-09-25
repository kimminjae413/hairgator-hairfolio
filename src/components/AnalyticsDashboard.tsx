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
  const totalTrialResults = useMemo(() => stats.trialResults?.length || 0, [stats.trialResults]);

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
    <div className="space-y-6">
      {/* Portfolio Overview */}
      <StatCard title="Portfolio Overview" className="">
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
                <p className="text-5xl font-bold text-purple-600">{totalTrialResults}</p>
                <p className="text-sm text-gray-500 mt-1">Client Results</p>
            </div>
            <div className="border-l border-gray-200 hidden sm:block"></div>
            <div>
                <p className="text-5xl font-bold text-green-600">{totalBookings}</p>
                <p className="text-sm text-gray-500 mt-1">Bookings</p>
            </div>
        </div>
      </StatCard>

      {/* Recent Client Try-ons */}
      {stats.trialResults && stats.trialResults.length > 0 && (
        <StatCard title="Recent Client Try-ons" className="">
          <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-6 gap-3">
            {stats.trialResults.slice(0, 12).map((trial, index) => (
              <div key={index} className="relative group">
                <div className="aspect-square rounded-lg overflow-hidden bg-gray-100 shadow-sm hover:shadow-md transition-all duration-200 cursor-pointer"
                     onClick={() => window.open(trial.resultUrl, '_blank')}
                >
                  <img 
                    src={trial.resultUrl} 
                    alt={`Client try-on: ${trial.styleName || 'Unknown style'}`}
                    className="w-full h-full object-cover transition-transform duration-200 group-hover:scale-105"
                    loading="lazy"
                    onError={(e) => {
                      const target = e.target as HTMLImageElement;
                      target.src = 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjAwIiBoZWlnaHQ9IjIwMCIgdmlld0JveD0iMCAwIDIwMCAyMDAiIGZpbGw9Im5vbmUiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+CjxyZWN0IHdpZHRoPSIyMDAiIGhlaWdodD0iMjAwIiBmaWxsPSIjRjNGNEY2Ii8+CjxwYXRoIGQ9Ik0xMDAgNzBMMTMwIDEzMEg3MEwxMDAgNzBaIiBmaWxsPSIjOUM5Q0EzIi8+Cjx0ZXh0IHg9IjEwMCIgeT0iMTYwIiB0ZXh0LWFuY2hvcj0ibWlkZGxlIiBmb250LXNpemU9IjEyIiBmaWxsPSIjOUM5Q0EzIj5JbWFnZSBub3QgZm91bmQ8L3RleHQ+Cjwvc3ZnPg==';
                    }}
                  />
                  
                  {/* Overlay */}
                  <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-30 transition-opacity duration-200 rounded-lg flex items-center justify-center">
                    <svg className="w-6 h-6 text-white opacity-0 group-hover:opacity-100 transition-opacity duration-200" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                    </svg>
                  </div>
                  
                  {/* Style name badge */}
                  {trial.styleName && (
                    <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 to-transparent p-2 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
                      <p className="text-white text-xs font-medium text-center truncate">
                        {trial.styleName}
                      </p>
                    </div>
                  )}
                  
                  {/* Timestamp badge */}
                  <div className="absolute top-2 right-2 bg-black/60 text-white text-xs px-2 py-1 rounded opacity-0 group-hover:opacity-100 transition-opacity duration-200">
                    {new Date(trial.timestamp).toLocaleDateString('ko-KR', {
                      month: 'short',
                      day: 'numeric'
                    })}
                  </div>
                </div>
              </div>
            ))}
          </div>
          
          {stats.trialResults.length > 12 && (
            <div className="mt-4 text-center">
              <p className="text-sm text-gray-500">
                {stats.trialResults.length - 12}개의 추가 결과가 있습니다. 최근 12개만 표시됩니다.
              </p>
            </div>
          )}
          
          {stats.trialResults.length === 0 && (
            <div className="text-center py-8 text-gray-500">
              <svg className="w-12 h-12 mx-auto mb-3 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
              <p>아직 고객 체험 결과가 없습니다</p>
              <p className="text-xs mt-1">고객이 헤어스타일을 체험하면 여기에 표시됩니다</p>
            </div>
          )}
        </StatCard>
      )}

      {/* Performance Stats Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <StatCard title="Most Popular Style">
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
    </div>
  );
};

export default AnalyticsDashboard;
