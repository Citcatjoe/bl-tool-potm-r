import React, { useEffect, useState } from 'react';

const AnimatedNumber = ({ value, duration = 500 }) => {
    const [displayValue, setDisplayValue] = useState(0);

    useEffect(() => {
        let startTime;
        let startValue = displayValue;
        const endValue = value;
        
        const step = (timestamp) => {
            if (!startTime) startTime = timestamp;
            const progress = timestamp - startTime;
            const percentage = Math.min(progress / duration, 1);
            
            // Easing function (easeOutQuad) for smoother animation
            const easeOutQuad = (t) => t * (2 - t);
            const easedProgress = easeOutQuad(percentage);
            
            const current = Math.round(startValue + (endValue - startValue) * easedProgress);
            
            setDisplayValue(current);

            if (progress < duration) {
                requestAnimationFrame(step);
            }
        };

        requestAnimationFrame(step);
    }, [value, duration]);

    return <>{displayValue}</>;
};

export default AnimatedNumber;
