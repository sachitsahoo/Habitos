import { useDarkMode } from '../context/DarkModeContext';

interface CircularProgressProps {
  percentage: number;
  size?: number;
  strokeWidth?: number;
}

export function CircularProgress({ percentage, size = 120, strokeWidth = 8 }: CircularProgressProps) {
  const { isDark } = useDarkMode();
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (percentage / 100) * circumference;

  return (
    <div className="relative inline-flex items-center justify-center">
      <svg width={size} height={size} className="transform -rotate-90">
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke={isDark ? '#2D3E54' : '#E8E6E0'}
          strokeWidth={strokeWidth}
          fill="none"
        />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke={isDark ? '#7AA897' : '#6B9B8C'}
          strokeWidth={strokeWidth}
          fill="none"
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          className="transition-all duration-500"
          strokeLinecap="round"
        />
      </svg>
      <div className="absolute inset-0 flex items-center justify-center">
        <span className={`font-semibold text-2xl ${
          isDark ? 'text-[#7AA897]' : 'text-[#6B9B8C]'
        }`} style={{ fontFamily: 'var(--font-mono)' }}>
          {Math.round(percentage)}%
        </span>
      </div>
    </div>
  );
}
