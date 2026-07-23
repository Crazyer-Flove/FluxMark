import React, { useState, useMemo } from 'react';
import { 
  BarChart, Bar, PieChart, Pie, Cell, XAxis, YAxis, Tooltip, 
  ResponsiveContainer, CartesianGrid 
} from 'recharts';
import { BarChart3, PieChartIcon, Layers, ChevronUp, ChevronDown, Award, Hash } from 'lucide-react';

interface OutlineItem {
  id: string;
  text: string;
  level: number;
  pos?: number;
}

interface DocumentOutlineStatsProps {
  outline: OutlineItem[];
  onSelectLevelFilter?: (level: number | null) => void;
  selectedLevelFilter?: number | null;
  onScrollToHeading?: (pos: number, id: string) => void;
}

const LEVEL_COLORS: Record<number, { main: string; name: string }> = {
  1: { main: '#3b82f6', name: '一级标题 (H1)' },
  2: { main: '#10b981', name: '二级标题 (H2)' },
  3: { main: '#8b5cf6', name: '三级标题 (H3)' },
  4: { main: '#f59e0b', name: '四级标题 (H4)' },
  5: { main: '#ec4899', name: '五级标题 (H5)' },
  6: { main: '#64748b', name: '六级标题 (H6)' },
};

export const DocumentOutlineStats: React.FC<DocumentOutlineStatsProps> = ({
  outline,
  onSelectLevelFilter,
  selectedLevelFilter = null,
  onScrollToHeading,
}) => {
  const [isExpanded, setIsExpanded] = useState<boolean>(true);
  const [chartType, setChartType] = useState<'bar' | 'pie'>('bar');
  const [levelHeadingIndices, setLevelHeadingIndices] = useState<Record<number, number>>({});

  const handleLevelClick = (level: number) => {
    // 1. Toggle filter if filter handler provided
    if (onSelectLevelFilter) {
      onSelectLevelFilter(selectedLevelFilter === level ? null : level);
    }

    // 2. Find matching headings for this level
    const targetHeadings = outline.filter(item => item.level === level && item.pos !== undefined);
    if (targetHeadings.length === 0) return;

    // 3. Cycle through headings of this level on consecutive clicks
    const currentIndex = levelHeadingIndices[level] ?? 0;
    const targetHeading = targetHeadings[currentIndex % targetHeadings.length];
    const nextIndex = (currentIndex + 1) % targetHeadings.length;

    setLevelHeadingIndices(prev => ({
      ...prev,
      [level]: nextIndex,
    }));

    // 4. Scroll to heading in editor
    if (onScrollToHeading && targetHeading.pos !== undefined) {
      onScrollToHeading(targetHeading.pos, targetHeading.id);
    }
  };

  // Compute distribution
  const statsData = useMemo(() => {
    const counts: Record<number, number> = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0, 6: 0 };
    
    outline.forEach(item => {
      if (item.level >= 1 && item.level <= 6) {
        counts[item.level] = (counts[item.level] || 0) + 1;
      }
    });

    const barData = [1, 2, 3, 4, 5, 6].map(level => ({
      level,
      levelLabel: `H${level}`,
      name: LEVEL_COLORS[level].name,
      count: counts[level],
      color: LEVEL_COLORS[level].main,
    }));

    const pieData = barData
      .filter(item => item.count > 0)
      .map(item => ({
        ...item,
        value: item.count,
      }));

    const totalHeadings = outline.length;
    const maxLevel = outline.length > 0 ? Math.max(...outline.map(o => o.level)) : 0;
    
    let dominantLevel = 1;
    let maxCount = 0;
    Object.entries(counts).forEach(([lvl, cnt]) => {
      if (cnt > maxCount) {
        maxCount = cnt;
        dominantLevel = Number(lvl);
      }
    });

    return {
      barData,
      pieData,
      totalHeadings,
      maxLevel,
      dominantLevel: maxCount > 0 ? dominantLevel : null,
      dominantCount: maxCount,
    };
  }, [outline]);

  if (outline.length === 0) {
    return null;
  }

  return (
    <div className="mt-auto border-t border-[var(--border)] bg-[var(--bg-primary)] shadow-sm shrink-0 transition-all select-none">
      {/* Header Bar */}
      <div 
        onClick={() => setIsExpanded(!isExpanded)}
        className="px-3 py-2 flex items-center justify-between cursor-pointer hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors"
      >
        <div className="flex items-center gap-2">
          <div className="p-1 rounded-md bg-blue-50 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400">
            <BarChart3 size={13} />
          </div>
          <span className="text-xs font-bold text-[var(--text-primary)]">结构分布统计</span>
          <span className="text-[10px] font-mono font-semibold px-1.5 py-0.5 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-500">
            {statsData.totalHeadings} 标题
          </span>
        </div>

        <div className="flex items-center gap-1 text-slate-400">
          <button 
            type="button"
            className="p-0.5 hover:bg-slate-200 dark:hover:bg-slate-700 rounded transition-colors"
          >
            {isExpanded ? <ChevronDown size={14} /> : <ChevronUp size={14} />}
          </button>
        </div>
      </div>

      {/* Expanded Content */}
      {isExpanded && (
        <div className="p-3 pt-0 space-y-2.5">
          {/* Controls & Quick Filter */}
          <div className="flex items-center justify-between bg-slate-50 dark:bg-slate-800/60 p-1 rounded-lg border border-slate-200/60 dark:border-slate-700/60 text-[11px]">
            <span className="text-[10px] font-medium text-slate-500 dark:text-slate-400 pl-1 flex items-center gap-1">
              <Layers size={11} /> 图表:
            </span>
            <div className="flex items-center gap-1 bg-white dark:bg-slate-900 p-0.5 rounded border border-slate-200/80 dark:border-slate-700">
              <button
                type="button"
                onClick={() => setChartType('bar')}
                className={`px-2 py-0.5 rounded text-[10px] font-medium transition-all flex items-center gap-1 cursor-pointer ${
                  chartType === 'bar'
                    ? 'bg-blue-500 text-white shadow-xs'
                    : 'text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-slate-200'
                }`}
              >
                <BarChart3 size={11} /> 柱状图
              </button>
              <button
                type="button"
                onClick={() => setChartType('pie')}
                className={`px-2 py-0.5 rounded text-[10px] font-medium transition-all flex items-center gap-1 cursor-pointer ${
                  chartType === 'pie'
                    ? 'bg-blue-500 text-white shadow-xs'
                    : 'text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-slate-200'
                }`}
              >
                <PieChartIcon size={11} /> 饼图
              </button>
            </div>
          </div>

          {/* Recharts Canvas */}
          <div className="h-32 w-full bg-slate-50/50 dark:bg-slate-900/40 rounded-xl p-1.5 border border-slate-100 dark:border-slate-800 flex items-center justify-center">
            {chartType === 'bar' ? (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart 
                  data={statsData.barData} 
                  margin={{ top: 8, right: 8, left: -28, bottom: 0 }}
                  onClick={(state: any) => {
                    if (state && state.activePayload && state.activePayload.length > 0) {
                      const lvl = state.activePayload[0].payload.level;
                      handleLevelClick(lvl);
                    }
                  }}
                >
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" opacity={0.5} />
                  <XAxis 
                    dataKey="levelLabel" 
                    tick={{ fontSize: 9, fill: '#64748b' }} 
                    axisLine={false} 
                    tickLine={false} 
                  />
                  <YAxis 
                    allowDecimals={false} 
                    tick={{ fontSize: 8, fill: '#94a3b8' }} 
                    axisLine={false} 
                    tickLine={false} 
                  />
                  <Tooltip 
                    cursor={{ fill: 'rgba(59, 130, 246, 0.08)' }}
                    content={({ active, payload }) => {
                      if (active && payload && payload.length) {
                        const data = payload[0].payload;
                        return (
                          <div className="bg-slate-900 text-white p-2 rounded-lg text-xs shadow-xl border border-slate-700">
                            <p className="font-bold flex items-center gap-1.5">
                              <span className="w-2 h-2 rounded-full" style={{ backgroundColor: data.color }} />
                              {data.name}
                            </p>
                            <p className="text-[11px] text-slate-300 mt-1">
                              数量: <span className="font-bold text-white font-mono">{data.count}</span> 个
                              {statsData.totalHeadings > 0 && (
                                <span className="text-slate-400 ml-1">
                                  ({Math.round((data.count / statsData.totalHeadings) * 100)}%)
                                </span>
                              )}
                            </p>
                            <p className="text-[9px] text-blue-400 mt-1">点击按层级筛选并自动定位文档位置</p>
                          </div>
                        );
                      }
                      return null;
                    }}
                  />
                  <Bar 
                    dataKey="count" 
                    radius={[4, 4, 0, 0]} 
                    cursor="pointer"
                  >
                    {statsData.barData.map((entry) => (
                      <Cell 
                        key={`cell-${entry.level}`} 
                        fill={entry.level === selectedLevelFilter ? '#2563eb' : entry.color} 
                        opacity={selectedLevelFilter === null || selectedLevelFilter === entry.level ? 1 : 0.35}
                        onClick={() => handleLevelClick(entry.level)}
                      />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={statsData.pieData}
                    cx="50%"
                    cy="50%"
                    innerRadius={22}
                    outerRadius={44}
                    paddingAngle={3}
                    dataKey="value"
                    onClick={(entry: any) => {
                      if (entry && entry.level) {
                        handleLevelClick(entry.level);
                      }
                    }}
                    cursor="pointer"
                  >
                    {statsData.pieData.map((entry) => (
                      <Cell 
                        key={`pie-cell-${entry.level}`} 
                        fill={entry.color} 
                        opacity={selectedLevelFilter === null || selectedLevelFilter === entry.level ? 1 : 0.35}
                        stroke="#fff"
                        strokeWidth={1}
                        className="cursor-pointer transition-opacity hover:opacity-80"
                        onClick={() => handleLevelClick(entry.level)}
                      />
                    ))}
                  </Pie>
                  <Tooltip 
                    content={({ active, payload }) => {
                      if (active && payload && payload.length) {
                        const data = payload[0].payload;
                        return (
                          <div className="bg-slate-900 text-white p-2 rounded-lg text-xs shadow-xl border border-slate-700">
                            <p className="font-bold flex items-center gap-1.5">
                              <span className="w-2 h-2 rounded-full" style={{ backgroundColor: data.color }} />
                              {data.name}
                            </p>
                            <p className="text-[11px] text-slate-300 mt-1">
                              数量: <span className="font-bold text-white font-mono">{data.count}</span> 个
                              ({Math.round((data.count / statsData.totalHeadings) * 100)}%)
                            </p>
                            <p className="text-[9px] text-blue-400 mt-1 flex items-center gap-1">
                              <span>🎯 点击扇区自动跳转定位至该层级标题</span>
                            </p>
                          </div>
                        );
                      }
                      return null;
                    }}
                  />
                </PieChart>
              </ResponsiveContainer>
            )}
          </div>

          {/* Level Badges & Quick Filtering */}
          <div className="flex flex-wrap gap-1">
            {statsData.barData.map((item) => (
              <button
                key={item.level}
                type="button"
                onClick={() => handleLevelClick(item.level)}
                className={`px-1.5 py-0.5 rounded text-[10px] font-mono flex items-center gap-1 border transition-all cursor-pointer ${
                  selectedLevelFilter === item.level
                    ? 'bg-blue-600 text-white border-blue-600 font-bold shadow-xs'
                    : item.count > 0
                    ? 'bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-700 hover:border-blue-400'
                    : 'bg-slate-50 dark:bg-slate-900 text-slate-400 dark:text-slate-600 border-transparent opacity-60'
                }`}
                title={`点击筛选或取消筛选 H${item.level} 标题 (${item.count} 个)`}
              >
                <span className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: item.color }} />
                <span>H{item.level}:</span>
                <span className="font-bold">{item.count}</span>
              </button>
            ))}
            {selectedLevelFilter !== null && (
              <button
                type="button"
                onClick={() => onSelectLevelFilter && onSelectLevelFilter(null)}
                className="px-1.5 py-0.5 rounded text-[10px] font-sans text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-950/60 hover:bg-blue-100 border border-blue-200 dark:border-blue-800 cursor-pointer"
              >
                清除筛选
              </button>
            )}
          </div>

          {/* Key Indicators Footer */}
          <div className="grid grid-cols-2 gap-2 text-[11px] pt-1 border-t border-slate-100 dark:border-slate-800/80">
            <div className="flex items-center gap-1.5 text-slate-500 dark:text-slate-400">
              <Hash size={12} className="text-slate-400" />
              <span>最高深度:</span>
              <span className="font-mono font-bold text-slate-800 dark:text-slate-200">
                H{statsData.maxLevel || '-'}
              </span>
            </div>
            <div className="flex items-center gap-1.5 text-slate-500 dark:text-slate-400">
              <Award size={12} className="text-slate-400" />
              <span>核心层级:</span>
              <span className="font-mono font-bold text-slate-800 dark:text-slate-200">
                {statsData.dominantLevel ? `H${statsData.dominantLevel}` : '-'}
              </span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
