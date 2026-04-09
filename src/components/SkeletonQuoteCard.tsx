import React from 'react';

interface SkeletonQuoteCardProps {
    isDarkMode: boolean;
}

export const SkeletonQuoteCard: React.FC<SkeletonQuoteCardProps> = ({ isDarkMode }) => {
    // SVG Blobs (Same as DashboardQuoteCard for visual consistency)
    const blob1 = "M45.7,-76.3C58.9,-69.3,69.1,-55.9,76.5,-41.8C83.9,-27.7,88.5,-12.9,86.6,1C84.7,14.9,76.3,27.9,67.1,39.6C57.9,51.3,47.9,61.7,35.9,68.5C23.9,75.3,10,78.5,-3.1,77.4C-16.2,76.3,-28.4,70.9,-40.5,63.9C-52.6,56.9,-64.6,48.3,-74.1,36.7C-83.6,25.1,-90.6,10.5,-89.2,-3.4C-87.8,-17.3,-78,-30.5,-67.2,-41.6C-56.4,-52.7,-44.6,-61.7,-32.1,-69.1C-19.6,-76.5,-6.4,-82.3,6.2,-81.4C18.8,-80.5,32.5,-83.3,45.7,-76.3Z";
    const blob2 = "M41.8,-73.4C54.6,-65.1,65.9,-54.6,74.7,-42.2C83.5,-29.8,89.9,-15.5,88.9,-1.4C88,12.7,79.7,26.6,70.1,38.6C60.5,50.6,49.6,60.7,37.3,67C25,73.3,11.3,75.8,-2.1,79.5C-15.5,83.1,-28.6,88,-40.4,84.7C-52.2,81.4,-62.7,69.9,-71.3,57.1C-79.9,44.3,-86.6,30.2,-87.3,15.6C-88,1,-82.7,-14.1,-74.9,-27.3C-67.1,-40.5,-56.8,-51.8,-45.3,-60.7C-33.8,-69.6,-21.1,-76.1,-7.2,-78.9C6.7,-81.7,13.4,-80.8,29,-81.7C44.6,-82.6,29,-81.7,41.8,-73.4Z";
    const blob3 = "M39.6,-66.3C52.1,-58.5,63.6,-50.1,72.4,-39.3C81.2,-28.5,87.3,-15.3,86.6,-1.9C85.9,11.5,78.5,25.1,69.4,37.4C60.3,49.7,49.5,60.7,37.2,68.4C24.9,76.1,11.1,80.5,-2.2,84.3C-15.5,88.1,-28.3,91.3,-40.5,86.8C-52.7,82.3,-64.3,70.1,-73.1,56.5C-81.9,42.9,-87.9,27.9,-87.4,12.5C-86.9,-2.9,-79.9,-18.7,-70.6,-31.8C-61.3,-44.9,-49.7,-55.3,-37.5,-63.3C-25.3,-71.3,-12.7,-76.9,0.5,-77.8C13.7,-78.7,27.1,-74.1,39.6,-66.3Z";

    return (
        <div className="w-full">
            {/* Blob Background Card */}
            <div
                className="relative w-full overflow-hidden rounded-3xl"
                style={{
                    background: '#F5F0EB',
                    padding: '60px 20px',
                    boxShadow: '0 25px 70px -15px rgba(0,0,0,0.2), 0 15px 40px -10px rgba(0,0,0,0.15)'
                }}
            >
                {/* Organic Background Shapes (SVG Blobs) - Identical to Real Card */}
                <div style={{ position: 'absolute', top: '-50px', left: '-80px', width: '300px', height: '300px', opacity: 0.85, transform: 'rotate(15deg)' }}>
                    <svg viewBox="-100 -100 200 200" width="100%" height="100%"><path d={blob1} fill="#8B9D83" /></svg>
                </div>
                <div style={{ position: 'absolute', top: '-35px', right: '-85px', width: '280px', height: '280px', opacity: 0.75, transform: 'rotate(-20deg)' }}>
                    <svg viewBox="-100 -100 200 200" width="100%" height="100%"><path d={blob2} fill="#D4B896" /></svg>
                </div>
                <div style={{ position: 'absolute', top: '30%', right: '-100px', width: '265px', height: '265px', opacity: 0.7, transform: 'rotate(45deg)' }}>
                    <svg viewBox="-100 -100 200 200" width="100%" height="100%"><path d={blob3} fill="#B89B9B" /></svg>
                </div>
                <div style={{ position: 'absolute', bottom: '-70px', left: '-70px', width: '315px', height: '315px', opacity: 0.8, transform: 'rotate(120deg)' }}>
                    <svg viewBox="-100 -100 200 200" width="100%" height="100%"><path d={blob2} fill="#6F7B6D" /></svg>
                </div>
                <div style={{ position: 'absolute', bottom: '-70px', right: '-70px', width: '300px', height: '300px', opacity: 0.7, transform: 'rotate(-45deg)' }}>
                    <svg viewBox="-100 -100 200 200" width="100%" height="100%"><path d={blob1} fill="#C9A876" /></svg>
                </div>

                {/* Centered White Quote Card */}
                <div style={{
                    position: 'relative',
                    zIndex: 10,
                    width: '100%',
                    maxWidth: '500px',
                    margin: '0 auto',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center'
                }}>
                    <div style={{
                        backgroundColor: '#FFFFFF',
                        borderRadius: '30px',
                        padding: '40px 35px 25px',
                        width: '100%',
                        textAlign: 'center',
                        position: 'relative',
                        border: '1px solid rgba(0,0,0,0.02)',
                        boxShadow: '0 20px 60px -10px rgba(0,0,0,0.15), 0 10px 30px -5px rgba(0,0,0,0.1)'
                    }}>
                        {/* Skeleton Text Lines - Pulsing */}
                        <div className="flex flex-col items-center gap-3 w-full mb-8 animate-pulse">
                            <div className={`h-6 rounded-full w-3/4 ${isDarkMode ? 'bg-gray-100' : 'bg-gray-200'}`}></div>
                            <div className={`h-6 rounded-full w-full ${isDarkMode ? 'bg-gray-100' : 'bg-gray-200'}`}></div>
                            <div className={`h-6 rounded-full w-5/6 ${isDarkMode ? 'bg-gray-100' : 'bg-gray-200'}`}></div>
                            <div className={`h-6 rounded-full w-1/2 ${isDarkMode ? 'bg-gray-100' : 'bg-gray-200'}`}></div>
                        </div>

                        {/* Skeleton Author */}
                        <div className="flex justify-center mb-8 animate-pulse">
                            <div className={`h-4 rounded-full w-1/3 ${isDarkMode ? 'bg-gray-100' : 'bg-gray-200'}`}></div>
                        </div>

                        {/* Skeleton Buttons */}
                        <div className="flex items-center justify-center gap-3 pt-4 border-t border-gray-100">
                            <div className={`w-10 h-10 rounded-full animate-pulse ${isDarkMode ? 'bg-gray-100' : 'bg-gray-200'}`}></div>
                            <div className={`w-10 h-10 rounded-full animate-pulse ${isDarkMode ? 'bg-gray-100' : 'bg-gray-200'}`}></div>
                            <div className={`w-10 h-10 rounded-full animate-pulse ${isDarkMode ? 'bg-gray-100' : 'bg-gray-200'}`}></div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};
