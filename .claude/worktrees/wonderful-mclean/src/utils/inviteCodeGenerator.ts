/**
 * Generate a unique invite code for accountability partners
 */
export const generateInviteCode = (): string => {
    const characters = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'; // Excluding similar-looking characters
    const segments = 2;
    const segmentLength = 4;

    const code = Array.from({ length: segments }, () => {
        return Array.from({ length: segmentLength }, () => {
            return characters.charAt(Math.floor(Math.random() * characters.length));
        }).join('');
    }).join('-');

    return code;
};

/**
 * Validate an invite code format
 */
export const isValidInviteCode = (code: string): boolean => {
    const pattern = /^[A-Z2-9]{4}-[A-Z2-9]{4}$/;
    return pattern.test(code);
};
