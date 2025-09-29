import React, { useMemo, useState } from 'react';
import { DesignerStats, Hairstyle } from '../types';

interface AnalyticsDashboardProps {
  stats: DesignerStats;
  portfolio: Hairstyle[];
}

type DatePreset = '7days' | '30days' | '90days' | 'all' | 'custom';

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
  const [datePreset, setDatePreset] = useState<DatePreset>('30days');
  const [customStartDate, setCustomStartDate] = useState('');
  const [customEndDate, setCustomEndDate] = useState('');
  const [showCustomDatePicker, setShowCustomDatePicker] = useState(false);

  const dateRange = useMemo(() => {
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    
    let startDate: Date;
    let endDate = today;

    switch (datePreset) {
      case '7days':
        startDate = new Date(today);
        startDate.setDate(startDate.getDate() - 7);
        break;
      case '30days':
        startDate = new Date(today);
        startDate.setDate(startDate.getDate() - 30);
        break;
      case '90days':
        startDate = new Date(today);
        startDate.setDate(startDate.getDate() - 90);
        break;
      case 'custom':
        if (customStartDate && customEndDate) {
          startDate = new Date(customStartDate);
          endDate = new Date(customEndDate);
        } else {
          startDate = new Date(today);
          startDate.setDate(startDate.getDate() - 30);
        }
        break;
      case 'all':
      default:
        startDate = new Date(2020, 0, 1);
        break;
    }

    return { startDate, endDate };
  }, [datePreset, customStartDate, customEndDate]);

  const filteredTrialResults = useMemo(() => {
    if (!stats.trialResults) return [];
    
    return stats.trialResults.filter(trial => {
      const trialDate = new Date(trial.timestamp);
      return trialDate >= dateRange.startDate && trialDate <= dateRange.endDate;
    });
  }, [stats.trialResults, dateRange]);

  const filteredStats = useMemo(() => {
    if (datePreset === 'all' || !stats.trialResults || stats.trialResults.length === 0) {
      return stats;
    }

    const styleViews: { [url: string]: number } = {};
    
    filteredTrialResults.forEach(trial => {
      styleViews[trial.styleUrl] = (styleViews[trial.styleUrl] || 0) + 1;
    });

    return {
      ...stats,
      styleViews,
    };
  }, [stats, filteredTrialResults, datePreset]);

  const topViewed = useMemo(() => findTopStyle(filteredStats.styleViews, portfolio), [filteredStats.styleViews, portfolio]);
  const topBooked = useMemo(() => findTopStyle(filteredStats.bookings, portfolio), [filteredStats.bookings, portfolio]);
  
  const totalStyleViews = useMemo(() => Object.values(filteredStats.styleViews || {}).reduce((sum, count) => sum + count, 0), [filteredStats.styleViews]);
  const totalBookings = useMemo(() => Object.values(filteredStats.bookings || {}).reduce((sum, count) => sum + count, 0), [filteredStats.bookings]);
  const totalTrialResults = useMemo(() => filteredTrialResults.length, [filteredTrialResults]);

  const hasData = stats.visits > 0 || totalStyleViews > 0;

  const handlePresetChange = (preset: DatePreset) => {
    setDatePreset(preset);
    if (preset !== 'custom') {
      setShowCustomDatePicker(false);
    } else {
      setShowCustomDatePicker(true);
      if (!customStartDate || !customEndDate) {
        const today = new Date().toISOString().split('T')[0];
        const monthAgo = new Date();
        monthAgo.setDate(monthAgo.getDate() - 30);
        const monthAgoStr = monthAgo.toISOString().split('T')[0];
        
        setCustomStartDate(monthAgoStr);
        setCustomEndDate(today);
      }
    }
  };

  const getDateRangeText = () => {
    const options: Intl.DateTimeFormatOptions = { year: 'numeric', month: 'short', day: 'numeric' };
    const start = dateRange.startDate.toLocaleDateString('ko-KR', options);
    const end = dateRange.endDate.toLocaleDateString('ko-KR', options);
    
    if (datePreset === 'all') return '전체 기간';
    return `${start} ~ ${end}`;
  };

  return (
    <div className="space-y-6">
      <div className="bg-gradient-to-r from-indigo-50 to-purple-50 rounded-xl p-6 border border-indigo-100">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <h3 className="text-lg font-semibold text-gray-800 mb-1 flex items-center gap-2">
              <svg className="w-5 h-5 text-indigo-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
              기간 선택
            </h3>
            <p className="text-sm text-gray-600">{getDateRangeText()}</p>
          </div>

          <div className="flex flex-wrap gap-2">
            {['7days', '30days', '90days', 'all', 'custom'].map((preset) => (
              <button
                key={preset}
                onClick={() => handlePresetChange(preset as DatePreset)}
                className={`px-4 py-2 rounded-lg font-medium text-sm transition-all duration-200 ${
                  datePreset === preset
                    ? 'bg-indigo-600 text-white shadow-lg'
                    : 'bg-white text-gray-700 hover:bg-gray-100 border border-gray-200'
                }`}
              >
                {preset === '7days' && '최근 7일'}
                {preset === '30days' && '최근 30일'}
                {preset === '90days' && '최근 90일'}
                {preset === 'all' && '전체'}
                {preset === 'custom' && (
                  <>
                    <svg className="w-4 h-4 inline mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                    </svg>
                    직접 선택
                  </>
                )}
              </button>
            ))}
          </div>
        </div>

        {showCustomDatePicker && (
          <div className="mt-4 pt-4 border-t border-indigo-200">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label htmlFor="start-date" className="block text-sm font-medium text-gray-700 mb-2">
                  시작 날짜
                </label>
                <input
                  id="start-date"
                  type="date"
                  value={customStartDate}
                  onChange={(e) => setCustomStartDate(e.target.value)}
                  max={customEndDate || new Date().toISOString().split('T')[0]}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>
              <div>
                <label htmlFor="end-date" className="block text-sm font-medium text-gray-700 mb-2">
                  종료 날짜
                </label>
                <input
                  id="end-date"
                  type="date"
                  value={customEndDate}
                  onChange={(e) => setCustomEndDate(e.target.value)}
                  min={customStartDate}
                  max={new Date().toISOString().split('T')[0]}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>
            </div>
          </div>
        )}
      </div>

      {!hasData && (
        <div className="bg-white rounded-xl shadow-md p-12 text-center">
          <div className="max-w-md mx-auto">
            <div className="w-20 h-20 mx-auto mb-6 bg-indigo-100 rounded-full flex items-center justify-center">
              <svg className="w-10 h-10 text-indigo-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
              </svg>
            </div>
            <h2 className="text-2xl font-bold text-gray-800 mb-3">아직 분석 데이터가 없습니다</h2>
            <p className="text-gray-600 mb-6">
              포트폴리오를 공유하면 방문자와 체험 데이터가 여기에 표시됩니다.
            </p>
            <div className="bg-indigo-50 rounded-lg p-4 text-left">
              <h3 className="font-semibold text-indigo-900 mb-2 flex items-center gap-2">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                데이터 수집 시작하기
              </h3>
              <ul className="text-sm text-indigo-800 space-y-1">
                <li>• Your Styles 탭에서 Share 버튼 클릭</li>
                <li>• QR 코드 또는 링크를 고객에게 공유</li>
                <li>• 고객이 스타일을 체험하면 데이터 수집 시작!</li>
              </ul>
            </div>
          </div>
        </div>
      )}

      {hasData && (
        <StatCard title="Portfolio Overview">
          <div className="flex flex-col sm:flex-row justify-around text-center gap-6">
            <div>
              <p className="text-5xl font-bold text-indigo-600">{stats.visits}</p>
              <p className="text-sm text-gray-500 mt-1">Total Visits</p>
              <p className="text-xs text-gray-400">전체 기간</p>
            </div>
            <div className="border-l border-gray-200 hidden sm:block"></div>
            <div>
              <p className="text-5xl font-bold text-indigo-600">{totalStyleViews}</p>
              <p className="text-sm text-gray-500 mt-1">Style Try-ons</p>
              <p className="text-xs text-gray-400">{datePreset === 'all' ? '전체 기간' : '선택 기간'}</p>
            </div>
            <div className="border-l border-gray-200 hidden sm:block"></div>
            <div>
              <p className="text-5xl font-bold text-purple-600">{totalTrialResults}</p>
              <p className="text-sm text-gray-500 mt-1">Client Results</p>
              <p className="text-xs text-gray-400">{datePreset === 'all' ? '전체 기간' : '선택 기간'}</p>
            </div>
            <div className="border-l border-gray-200 hidden sm:block"></div>
            <div>
              <p className="text-5xl font-bold text-green-600">{totalBookings}</p>
              <p className="text-sm text-gray-500 mt-1">Bookings</p>
              <p className="text-xs text-gray-400">전체 기간</p>
            </div>
          </div>
        </StatCard>
      )}

      {hasData && totalStyleViews > 0 && (
        <StatCard title={`Recent Client Try-ons (${datePreset === 'all' ? '전체' : '선택 기간'})`}>
          {filteredTrialResults && filteredTrialResults.length > 0 ? (
            <>
              <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-6 gap-3">
                {filteredTrialResults.slice(0, 12).map((trial, index) => (
                  <div key={index} className="relative group">
                    <div 
                      className="aspect-square rounded-lg overflow-hidden bg-gray-100 shadow-sm hover:shadow-md transition-all duration-200 cursor-pointer"
                      onClick={() => window.open(trial.resultUrl, '_blank')}
                    >
                      <img 
                        src={trial.resultUrl} 
                        alt={`Client try-on: ${trial.styleName || 'Unknown style'}`}
                        className="w-full h-full object-cover transition-transform duration-200 group-hover:scale-105"
                        loading="lazy"
                      />
                      
                      <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-30 transition-opacity duration-200 rounded-lg flex items-center justify-center">
                        <svg className="w-6 h-6 text-white opacity-0 group-hover:opacity-100 transition-opacity duration-200" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                        </svg>
                      </div>
                      
                      {trial.styleName && (
                        <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 to-transparent p-2 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
                          <p className="text-white text-xs font-medium text-center truncate">
                            {trial.styleName}
                          </p>
                        </div>
                      )}
                      
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
              
              {filteredTrialResults.length > 12 && (
                <div className="mt-4 text-center">
                  <p className="text-sm text-gray-500">
                    {filteredTrialResults.length - 12}개의 추가 결과가 있습니다. 최근 12개만 표시됩니다.
                  </p>
                </div>
              )}
            </>
          ) : (
            <div className="text-center py-8 text-gray-500">
              <svg className="w-12 h-12 mx-auto mb-3 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
              <p>선택한 기간에 체험 결과가 없습니다</p>
              <p className="text-xs mt-1">다른 기간을 선택해보세요</p>
            </div>
          )}
        </StatCard>
      )}

      {hasData && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <StatCard title={`Most Popular Style (${datePreset === 'all' ? '전체' : '선택 기간'})`}>
            {topViewed.style ? (
              <div className="flex items-center gap-4">
                <img src={topViewed.style.url} alt={topViewed.style.name} className="w-24 h-24 rounded-md object-cover" />
                <div>
                  <p className="font-bold text-gray-800 text-lg">{topViewed.style.name}</p>
                  <p className="text-4xl font-bold text-indigo-600">{topViewed.count} <span className="text-xl text-gray-500 font-medium">views</span></p>
                </div>
              </div>
            ) : (
              <p className="text-gray-500 h-full flex items-center justify-center">선택한 기간에 데이터가 없습니다.</p>
            )}
          </StatCard>
          
          <StatCard title="Top Booking Driver (전체 기간)">
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
      )}
    </div>
  );
};

export default AnalyticsDashboard;
