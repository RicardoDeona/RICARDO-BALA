
import React from 'react';

const SparkIcon: React.FC<{ className?: string }> = ({ className }) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    viewBox="0 0 24 24"
    fill="currentColor"
    className={className}
  >
    <path
      fillRule="evenodd"
      d="M9 4.5a.75.75 0 01.721.544l.813 2.846a3.75 3.75 0 006.063 3.09l2.18-2.18a.75.75 0 011.06 1.06l-2.18 2.18a3.75 3.75 0 00-3.09 6.063l-2.846.813a.75.75 0 01-.966-.966l.813-2.846a3.75 3.75 0 00-6.063-3.09l-2.18 2.18a.75.75 0 01-1.06-1.06l2.18-2.18a3.75 3.75 0 003.09-6.063l2.846-.813A.75.75 0 019 4.5zM12 12a3 3 0 100-6 3 3 0 000 6z"
      clipRule="evenodd"
    />
  </svg>
);

export default SparkIcon;
