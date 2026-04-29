import React from 'react';

interface PalanteLogoProps {
    className?: string;
    fill?: string;
    style?: React.CSSProperties;
}

export const PalanteLogo: React.FC<PalanteLogoProps> = ({ className = "h-10 w-auto", fill, style }) => {
    // Map fill color roughly to the correct static png asset
    let src = "/logo-gold.png";
    if (fill?.toLowerCase() === '#415d43' || fill?.toLowerCase() === '#4e5c4c' || fill?.toLowerCase() === '#5a6351') {
        src = "/logo-sage.png";
    } else if (fill === '#FFFFFF' || fill === 'white') {
        src = "/logo-light.png";
    } else if (fill === '#2E3B2B') {
        src = "/logo-dark.png";
    }

    return (
        <img
            src={src}
            alt="Palante Logo"
            className={className}
            style={{ ...style, objectFit: 'contain' }}
        />
    );
};
