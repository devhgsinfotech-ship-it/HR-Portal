import React, { useState, useEffect } from 'react';
import { APP_CONFIG } from '@/environment';

interface EmployeeAvatarProps {
    url?: string | null;
    name?: string;
    size?: number;
    className?: string;
    style?: React.CSSProperties;
}

export const getAvatarUrl = (photoUrl?: string | null): string | null => {
    if (!photoUrl) return null;
    if (photoUrl.startsWith('http://') || photoUrl.startsWith('https://')) return photoUrl;
    const backendUrl = APP_CONFIG.getBackendUrl();
    const cleanBase = (backendUrl || '').replace(/\/$/, '');
    const cleanPath = photoUrl.startsWith('/') ? photoUrl : `/${photoUrl}`;
    return cleanBase ? `${cleanBase}${cleanPath}` : cleanPath;
};

export const getInitials = (name?: string): string => {
    if (!name || !name.trim()) return 'U';
    const parts = name.trim().split(/\s+/);
    if (parts.length === 1) return parts[0].substring(0, 2).toUpperCase();
    return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
};

const EmployeeAvatar: React.FC<EmployeeAvatarProps> = ({
    url,
    name = '',
    size = 38,
    className = '',
    style = {}
}) => {
    const [imgError, setImgError] = useState(false);
    const resolvedUrl = getAvatarUrl(url);
    const initials = getInitials(name);
    const fontSize = Math.max(11, Math.round(size * 0.38));

    useEffect(() => {
        setImgError(false);
    }, [url]);

    if (!resolvedUrl || imgError) {
        return (
            <span
                className={`avatar rounded-circle bg-primary-subtle text-primary fw-bold d-inline-flex align-items-center justify-content-center flex-shrink-0 user-select-none ${className}`}
                style={{
                    width: `${size}px`,
                    height: `${size}px`,
                    minWidth: `${size}px`,
                    minHeight: `${size}px`,
                    fontSize: `${fontSize}px`,
                    ...style
                }}
                title={name}
            >
                {initials}
            </span>
        );
    }

    return (
        <span
            className={`avatar rounded-circle overflow-hidden flex-shrink-0 d-inline-flex align-items-center justify-content-center border ${className}`}
            style={{
                width: `${size}px`,
                height: `${size}px`,
                minWidth: `${size}px`,
                minHeight: `${size}px`,
                backgroundColor: '#f8f9fa',
                ...style
            }}
            title={name}
        >
            <img
                src={resolvedUrl}
                alt={name}
                className="w-100 h-100 rounded-circle object-fit-cover"
                onError={() => setImgError(true)}
            />
        </span>
    );
};

export default EmployeeAvatar;
