import React from 'react';
import Svg, { Rect, Polygon } from 'react-native-svg';

export type FlagIconProps = {
  width?: number;
  height?: number;
  borderRadius?: number;
};

export const VietnamFlagIcon: React.FC<FlagIconProps> = ({
  width = 36,
  height = 24,
  borderRadius = 6,
}) => (
  <Svg width={width} height={height} viewBox="0 0 36 24">
    <Rect width="36" height="24" rx={borderRadius} fill="#DA251D" />
    <Polygon
      points="18,4.5 20.35,10.47 26.9,10.47 21.5,14.3 23.85,20.3 18,16.3 12.15,20.3 14.5,14.3 9.1,10.47 15.65,10.47"
      fill="#FFCD00"
    />
  </Svg>
);
