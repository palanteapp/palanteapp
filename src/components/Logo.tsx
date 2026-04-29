import React from 'react';
import { PalanteLogo } from './PalanteLogo';

interface LogoProps extends React.ComponentProps<typeof PalanteLogo> {
    variant?: 'gold' | 'sage';
    color?: string;
}

export const Logo: React.FC<LogoProps> = ({
    className = "w-8 h-8",
    variant = 'gold',
    color,
    style,
    ...props
}) => {
    // Default fill based on variant or provided color
    const defaultFill = variant === 'gold' ? '#E5D6A7' : '#355E3B';

    return (
        <PalanteLogo
            fill={color || defaultFill}
            className={className}
            style={style}
            {...props}
        />
    );
};
