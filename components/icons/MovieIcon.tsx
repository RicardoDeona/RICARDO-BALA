
import React from 'react';

const MovieIcon: React.FC<{ className?: string }> = ({ className }) => (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className={className}>
        <path d="M4.5 4.5a3 3 0 00-3 3v9a3 3 0 003 3h15a3 3 0 003-3v-9a3 3 0 00-3-3h-15z" />
        <path fillRule="evenodd" d="M6.75 5.25a.75.75 0 01.75-.75H9a.75.75 0 01.75.75v.018l.008.002.02.005.028.007.05.013.044.011.05.013.044.012.05.012.066.016.05.012.066.015.05.012.066.015.05.012.066.015.05.012.066.015a1.5 1.5 0 01.52.285.75.75 0 01-.84 1.241A.75.75 0 0011.25 6H9.75V5.25zM15 5.25a.75.75 0 01.75-.75h1.5a.75.75 0 01.75.75v10.5a.75.75 0 01-.75.75h-1.5a.75.75 0 01-.75-.75V5.25z" clipRule="evenodd" />
    </svg>
);

export default MovieIcon;
