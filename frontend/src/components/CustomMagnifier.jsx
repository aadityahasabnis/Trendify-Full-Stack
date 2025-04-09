import React, { useState, useRef } from 'react';

const CustomMagnifier = ({ src, alt }) => {
    const [isZoomed, setIsZoomed] = useState(false);
    const [backgroundPosition, setBackgroundPosition] = useState('0% 0%');
    const imgRef = useRef(null);

    const handleMouseMove = (e) => {
        const { left, top, width, height } = imgRef.current.getBoundingClientRect();
        const x = ((e.pageX - left) / width) * 100;
        const y = ((e.pageY - top) / height) * 100;
        setBackgroundPosition(`${x}% ${y}%`);
    };

    return (
        <div
            className="relative overflow-hidden"
            onMouseEnter={() => setIsZoomed(true)}
            onMouseLeave={() => setIsZoomed(false)}
            onMouseMove={handleMouseMove}
            style={{
                backgroundImage: `url(${src})`,
                backgroundSize: isZoomed ? '200%' : '100%',
                backgroundPosition: backgroundPosition,
            }}
        >
            <img
                ref={imgRef}
                src={src}
                alt={alt}
                className="w-full h-full object-cover"
            />
        </div>
    );
};

export default CustomMagnifier;
