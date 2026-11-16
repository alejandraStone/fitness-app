import Svg, {
  Circle,
  Defs,
  LinearGradient,
  Path,
  Rect,
  Stop,
} from 'react-native-svg';

import { colors } from './theme';

/**
 * Generic celebratory vector artwork shared by positive-state surfaces.
 *
 * All graphics are bundled with the application and use the design-system
 * palette, so features can reuse the same visual language without duplicating
 * bitmap assets.
 */

/** Trophy artwork for achievement and recommendation cards. */
export function TrophyIllustration() {
  return (
    <Svg height="100%" viewBox="0 0 80 80" width="100%">
      <Defs>
        <LinearGradient id="trophyGold" x1="0" x2="1" y1="0" y2="1">
          <Stop offset="0" stopColor="#F8CC5F" />
          <Stop offset="0.52" stopColor="#E8A72F" />
          <Stop offset="1" stopColor="#C98218" />
        </LinearGradient>
        <LinearGradient id="trophyBase" x1="0" x2="1" y1="0" y2="1">
          <Stop offset="0" stopColor="#8C61E9" />
          <Stop offset="1" stopColor="#6030C7" />
        </LinearGradient>
      </Defs>

      <Circle cx="40" cy="40" fill={colors.peach} r="40" />
      <Path
        d="M27 22H53V31C53 42.6 47.2 51 40 51C32.8 51 27 42.6 27 31V22Z"
        fill="url(#trophyGold)"
      />
      <Path
        d="M27 27H20.5C18 27 16 29 16 31.5C16 38.5 21 44 27 44"
        fill="none"
        stroke="#D99A2A"
        strokeLinecap="round"
        strokeWidth="4"
      />
      <Path
        d="M53 27H59.5C62 27 64 29 64 31.5C64 38.5 59 44 53 44"
        fill="none"
        stroke="#D99A2A"
        strokeLinecap="round"
        strokeWidth="4"
      />
      <Path
        d="M40 39.5L42.2 44L47.1 44.7L43.5 48.1L44.4 53L40 50.7L35.6 53L36.5 48.1L32.9 44.7L37.8 44L40 39.5Z"
        fill="#FFF8E3"
      />
      <Rect
        fill="url(#trophyBase)"
        height="8"
        rx="3"
        width="9"
        x="35.5"
        y="50"
      />
      <Rect
        fill="url(#trophyBase)"
        height="6"
        rx="3"
        width="25"
        x="27.5"
        y="57.5"
      />
      <Path
        d="M65 16C66.1 19.3 67.1 20.3 70.4 21.4C67.1 22.5 66.1 23.5 65 26.8C63.9 23.5 62.9 22.5 59.6 21.4C62.9 20.3 63.9 19.3 65 16Z"
        fill={colors.coral}
      />
      <Circle cx="17" cy="18" fill={colors.positive} r="3" />
    </Svg>
  );
}

/** Circular violet badge with a rising trend line. */
export function ProgressBadge() {
  return (
    <Svg height="100%" viewBox="0 0 44 44" width="100%">
      <Defs>
        <LinearGradient id="progressBadge" x1="0" x2="1" y1="0" y2="1">
          <Stop offset="0" stopColor="#9067F4" />
          <Stop offset="0.55" stopColor="#7137E1" />
          <Stop offset="1" stopColor="#5A1FBE" />
        </LinearGradient>
      </Defs>
      <Circle cx="22" cy="22" fill="url(#progressBadge)" r="22" />
      <Path
        d="M12.5 27.5L18.5 21.5L22.5 25.5L30.5 16.8"
        fill="none"
        stroke="#FFFFFF"
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth="2.7"
      />
      <Path
        d="M25.3 16.8H30.5V22"
        fill="none"
        stroke="#FFFFFF"
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth="2.7"
      />
      <Circle cx="16" cy="14" fill="#FFFFFF" opacity="0.22" r="8" />
    </Svg>
  );
}

/** Decorative sparkle cluster for a positive card corner. */
export function SparkleCluster({ size = 58 }: { size?: number }) {
  return (
    <Svg height={size} viewBox="0 0 58 58" width={size}>
      <Path
        d="M30 6C32.1 13.4 34.3 15.6 41.7 17.7C34.3 19.8 32.1 22 30 29.4C27.9 22 25.7 19.8 18.3 17.7C25.7 15.6 27.9 13.4 30 6Z"
        fill={colors.primary}
        opacity="0.7"
      />
      <Path
        d="M47 32C48 35.4 49 36.4 52.4 37.4C49 38.4 48 39.4 47 42.8C46 39.4 45 38.4 41.6 37.4C45 36.4 46 35.4 47 32Z"
        fill={colors.coral}
      />
      <Circle cx="15" cy="38" fill={colors.positive} r="3.4" />
      <Circle cx="50" cy="11" fill={colors.primarySoftStrong} r="2.6" />
    </Svg>
  );
}
