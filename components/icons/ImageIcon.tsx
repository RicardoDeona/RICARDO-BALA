
import React from 'react';

const ImageIcon: React.FC<{ className?: string }> = ({ className }) => (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className={className}>
        <path fillRule="evenodd" d="M1.5 6a2.25 2.25 0 012.25-2.25h16.5A2.25 2.25 0 0122.5 6v12a2.25 2.25 0 01-2.25 2.25H3.75A2.25 2.25 0 011.5 18V6zM3 16.06l2.755-2.754a.75.75 0 011.06 0l3.022 3.022a.75.75 0 001.06 0l2.53-2.53a.75.75 0 011.06 0l3.394 3.393V6.75a.75.75 0 00-.75-.75H3.75a.75.75 0 00-.75.75v9.31z" clipRule="evenodd" />
        <path d="M12 11.25a1.5 1.5 0 110-3 1.5 1.5 0 010 3z" />
    </svg>
);

export default ImageIcon;
