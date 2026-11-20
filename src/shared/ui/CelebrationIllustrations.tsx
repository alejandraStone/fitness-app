import Svg, {
  Circle,
  Defs,
  LinearGradient,
  Path,
  Rect,
  Stop,
} from 'react-native-svg';

import { workoutSummaryColors } from './theme';

/**
 * Generic celebratory vector artwork shared by positive-state surfaces.
 *
 * All graphics are bundled with the application and use the workout summary
 * palette, so features can reuse the same visual language without duplicating
 * bitmap assets.
 */

/** Trophy artwork for achievement and recommendation cards. */
export function TrophyIllustration() {
  return (
    <Svg height="100%" viewBox="0 0 80 80" width="100%">
      <Defs>
        <LinearGradient id="trophyLime" x1="0" x2="1" y1="0" y2="1">
          <Stop offset="0" stopColor="#EDF07B" />
          <Stop offset="0.52" stopColor={workoutSummaryColors.action} />
          <Stop offset="1" stopColor="#B9BF24" />
        </LinearGradient>
        <LinearGradient id="trophyBase" x1="0" x2="1" y1="0" y2="1">
          <Stop offset="0" stopColor={workoutSummaryColors.textMuted} />
          <Stop offset="1" stopColor={workoutSummaryColors.text} />
        </LinearGradient>
      </Defs>

      <Circle cx="40" cy="40" fill={workoutSummaryColors.surface} r="40" />
      <Path
        d="M27 22H53V31C53 42.6 47.2 51 40 51C32.8 51 27 42.6 27 31V22Z"
        fill="url(#trophyLime)"
        stroke={workoutSummaryColors.text}
        strokeWidth="1.4"
      />
      <Path
        d="M27 27H20.5C18 27 16 29 16 31.5C16 38.5 21 44 27 44"
        fill="none"
        stroke={workoutSummaryColors.textMuted}
        strokeLinecap="round"
        strokeWidth="4"
      />
      <Path
        d="M53 27H59.5C62 27 64 29 64 31.5C64 38.5 59 44 53 44"
        fill="none"
        stroke={workoutSummaryColors.textMuted}
        strokeLinecap="round"
        strokeWidth="4"
      />
      <Path
        d="M40 39.5L42.2 44L47.1 44.7L43.5 48.1L44.4 53L40 50.7L35.6 53L36.5 48.1L32.9 44.7L37.8 44L40 39.5Z"
        fill={workoutSummaryColors.surface}
        stroke={workoutSummaryColors.text}
        strokeWidth="0.8"
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
        fill={workoutSummaryColors.info}
      />
      <Circle cx="17" cy="18" fill={workoutSummaryColors.accent} r="3" />
    </Svg>
  );
}

/** Circular lime badge with a brown rising trend line. */
export function ProgressBadge() {
  return (
    <Svg height="100%" viewBox="0 0 44 44" width="100%">
      <Defs>
        <LinearGradient id="progressBadge" x1="0" x2="1" y1="0" y2="1">
          <Stop offset="0" stopColor="#E9ED74" />
          <Stop offset="0.55" stopColor={workoutSummaryColors.action} />
          <Stop offset="1" stopColor="#B9BF24" />
        </LinearGradient>
      </Defs>
      <Circle cx="22" cy="22" fill="url(#progressBadge)" r="22" />
      <Path
        d="M12.5 27.5L18.5 21.5L22.5 25.5L30.5 16.8"
        fill="none"
        stroke={workoutSummaryColors.text}
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth="2.7"
      />
      <Path
        d="M25.3 16.8H30.5V22"
        fill="none"
        stroke={workoutSummaryColors.text}
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth="2.7"
      />
      <Circle
        cx="16"
        cy="14"
        fill={workoutSummaryColors.surface}
        opacity="0.45"
        r="8"
      />
    </Svg>
  );
}

/** Decorative sparkle cluster for a positive card corner. */
export function SparkleCluster({ size = 58 }: { size?: number }) {
  return (
    <Svg height={size} viewBox="0 0 58 58" width={size}>
      <Path
        d="M30 6C32.1 13.4 34.3 15.6 41.7 17.7C34.3 19.8 32.1 22 30 29.4C27.9 22 25.7 19.8 18.3 17.7C25.7 15.6 27.9 13.4 30 6Z"
        fill={workoutSummaryColors.action}
      />
      <Path
        d="M47 32C48 35.4 49 36.4 52.4 37.4C49 38.4 48 39.4 47 42.8C46 39.4 45 38.4 41.6 37.4C45 36.4 46 35.4 47 32Z"
        fill={workoutSummaryColors.surface}
      />
      <Circle cx="15" cy="38" fill={workoutSummaryColors.info} r="3.4" />
      <Circle
        cx="50"
        cy="11"
        fill={workoutSummaryColors.text}
        opacity="0.4"
        r="2.6"
      />
    </Svg>
  );
}
