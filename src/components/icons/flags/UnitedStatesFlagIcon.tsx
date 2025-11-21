import React from 'react';
import Svg, { Rect, G, Circle } from 'react-native-svg';

import type { FlagIconProps } from './VietnamFlagIcon';

export const UnitedStatesFlagIcon: React.FC<FlagIconProps> = ({
  width = 36,
  height = 24,
  borderRadius = 6,
}) => {
  const stripeHeight = 24 / 13;

  return (
    <Svg width={width} height={height} viewBox="0 0 36 24">
      <Rect width="36" height="24" rx={borderRadius} fill="#FFFFFF" />
      {Array.from({ length: 13 }).map((_, index) => (
        <Rect
          key={index}
          x={0}
          y={index * stripeHeight}
          width={36}
          height={stripeHeight}
          fill={index % 2 === 0 ? '#B22234' : 'transparent'}
        />
      ))}
      <Rect width={16} height={stripeHeight * 7} rx={borderRadius / 1.5} fill="#3C3B6E" />
      <G>
        {Array.from({ length: 6 }).map((_, row) =>
          Array.from({ length: row % 2 === 0 ? 6 : 5 }).map((__, col) => {
            const offsetX = row % 2 === 0 ? 1.5 : 3.5;
            const cx = offsetX + col * 2.5;
            const cy = 1.2 + row * 2;
            return <Circle key={`${row}-${col}`} cx={cx} cy={cy} r={0.4} fill="#FFFFFF" />;
          }),
        )}
      </G>
    </Svg>
  );
};
