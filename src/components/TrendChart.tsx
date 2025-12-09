import React, { useState } from 'react';
import { X, TrendingUp } from 'lucide-react';

interface Dataset {
    label: string;
    data: number[];
    color: string;
}

interface TrendChartProps {
    datasets: Dataset[];
    isDarkMode: boolean;
}

export const TrendChart: React.FC<TrendChartProps> = ({ datasets, isDarkMode }) => {
    const [isFullscreen, setIsFullscreen] = useState(false);

    // Find global max for scaling
    const allValues = datasets.flatMap(d => d.data);
    const max = Math.max(...allValues, 1);

    const containerClasses = isFullscreen
        ? `fixed inset-0 z-50 flex flex-col items-center justify-center p-8 animate-fade-in ${isDarkMode ? 'bg-warm-gray-green' : 'bg-ivory'}`
        : `w-full h-64 relative overflow-hidden rounded-card cursor-pointer group`;

    return (
        <div
            className={containerClasses}
            onClick={() => !isFullscreen && setIsFullscreen(true)}
        >
            {/* Close Button for Fullscreen */}
            {isFullscreen && (
                <button
                    onClick={(e) => { e.stopPropagation(); setIsFullscreen(false); }}
                    className={`absolute top-8 right-8 p-4 rounded-full transition-all z-50 ${isDarkMode ? 'bg-white/10 hover:bg-white/20 text-white' : 'bg-sage/10 hover:bg-sage/20 text-sage'}`}
                >
                    <X size={32} />
                </button>
            )}

            {/* Header for Fullscreen */}
            {isFullscreen && (
                <div className="absolute top-12 left-8 md:left-12">
                    <div className="flex items-center gap-4 mb-2">
                        <div className={`p-3 rounded-full ${isDarkMode ? 'bg-white/10' : 'bg-sage/10'}`}>
                            <TrendingUp size={32} className={isDarkMode ? 'text-white' : 'text-sage'} />
                        </div>
                        <h2 className={`text-4xl font-display font-medium ${isDarkMode ? 'text-white' : 'text-warm-gray-green'}`}>Momentum</h2>
                    </div>
                    <p className={`text-sm font-body font-medium uppercase tracking-widest ${isDarkMode ? 'text-white/50' : 'text-warm-gray-green/50'}`}>7 Day Trend</p>
                </div>
            )}

            <div className={`relative w-full ${isFullscreen ? 'h-96 max-w-5xl mt-20' : 'h-full'}`}>
                <svg viewBox="0 0 100 100" preserveAspectRatio="none" className="w-full h-full">
                    {datasets.map((dataset) => {
                        const points = dataset.data.map((val, i) => {
                            const x = (i / (dataset.data.length - 1)) * 100;
                            const y = 100 - (val / max) * 80; // Keep some padding at top
                            return `${x},${y}`;
                        }).join(' ');

                        return (
                            <g key={dataset.label}>
                                {/* Line */}
                                <polyline
                                    points={points}
                                    fill="none"
                                    stroke="currentColor"
                                    strokeWidth={isFullscreen ? "0.5" : "2"}
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                    className={`${dataset.color} transition-all duration-1000`}
                                />

                                {/* Points (Fullscreen only) */}
                                {isFullscreen && dataset.data.map((val, i) => {
                                    const x = (i / (dataset.data.length - 1)) * 100;
                                    const y = 100 - (val / max) * 80;
                                    return (
                                        <circle
                                            key={i}
                                            cx={x}
                                            cy={y}
                                            r="1"
                                            className={`${dataset.color} fill-current`}
                                        />
                                    );
                                })}
                            </g>
                        );
                    })}
                </svg>
            </div>

            {/* Legend */}
            <div className={`absolute bottom-4 left-6 flex gap-4 ${isFullscreen ? 'opacity-100' : 'opacity-0 group-hover:opacity-100'} transition-opacity`}>
                {datasets.map(d => (
                    <div key={d.label} className="flex items-center gap-2">
                        <div className={`w-3 h-3 rounded-full ${d.color.replace('text-', 'bg-')}`}></div>
                        <span className={`text-xs font-bold uppercase tracking-widest ${isDarkMode ? 'text-white/60' : 'text-warm-gray-green/60'}`}>{d.label}</span>
                    </div>
                ))}
            </div>

            {/* Labels */}
            {!isFullscreen && (
                <div className={`absolute top-4 right-6 text-xs font-bold uppercase tracking-widest opacity-0 group-hover:opacity-100 transition-opacity ${isDarkMode ? 'text-white/60' : 'text-warm-gray-green/40'}`}>
                    Tap to Expand
                </div>
            )}
        </div>
    );
};
