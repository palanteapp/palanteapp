import React from 'react';

interface LogoProps extends React.ImgHTMLAttributes<HTMLImageElement> {
    variant?: 'gold' | 'sage';
}

export const Logo: React.FC<LogoProps> = ({
    className = "w-8 h-8",
    variant = 'gold',
    ...props
}) => {
    const logoSrc = variant === 'gold' ? '/logo-gold.png' : '/logo-sage.png';

    return (
        <img
            src={logoSrc}
            alt="Palante Logo"
            className={className}
            style={{
                objectFit: 'contain'
            }}
            {...props}
        />
    );
};
