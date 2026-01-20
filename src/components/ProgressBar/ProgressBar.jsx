import React, { useEffect, useState } from 'react';

const ProgressBar = ({ gridMode, percentage }) => {
    const [width, setWidth] = useState(0);

    useEffect(() => {
        // Small delay to ensure the transition happens after mount
        const timer = requestAnimationFrame(() => {
            setWidth(percentage);
        });
        return () => cancelAnimationFrame(timer);
    }, [percentage]);

    return (
        <div 
            className={`progressBar absolute bottom-0 left-0 fill-brand ${gridMode ? 'h-2' : 'h-1.5'} transition-all duration-[1500ms] ease-out`}
            style={{ width: `${width}%` }}
        ></div>
    );
};

export default ProgressBar;
