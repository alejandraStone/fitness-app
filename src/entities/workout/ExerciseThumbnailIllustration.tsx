import Svg, {
  Circle,
  Defs,
  G,
  LinearGradient,
  Path,
  Rect,
  Stop,
} from "react-native-svg";

import { workoutSummaryColors } from "../../shared/ui/theme";

/** Miniature dumbbell artwork used by an exercise row in a workout summary. */
export function ExerciseThumbnailIllustration() {
  return (
    <Svg height="100%" viewBox="0 0 64 64" width="100%">
      <Defs>
        <LinearGradient id="thumbnailBackground" x1="0" x2="1" y1="0" y2="1">
          <Stop offset="0" stopColor={workoutSummaryColors.accentSoft} />
          <Stop offset="0.55" stopColor={workoutSummaryColors.surface} />
          <Stop offset="1" stopColor={workoutSummaryColors.infoSoft} />
        </LinearGradient>
        <LinearGradient id="thumbnailDumbbell" x1="0" x2="1" y1="0" y2="0">
          <Stop offset="0" stopColor="#E9ED74" />
          <Stop offset="1" stopColor={workoutSummaryColors.action} />
        </LinearGradient>
      </Defs>

      <Rect fill="url(#thumbnailBackground)" height="64" rx="18" width="64" />
      <G transform="rotate(-14 32 32)">
        <Rect
          fill={workoutSummaryColors.textMuted}
          height="5"
          rx="2.5"
          width="24"
          x="20"
          y="29.5"
        />
        <Rect
          fill="url(#thumbnailDumbbell)"
          height="20"
          rx="4"
          width="7"
          x="14.5"
          y="22"
        />
        <Rect
          fill={workoutSummaryColors.accent}
          height="16"
          rx="3"
          width="5.5"
          x="21"
          y="24"
        />
        <Rect
          fill="url(#thumbnailDumbbell)"
          height="20"
          rx="4"
          width="7"
          x="42.5"
          y="22"
        />
        <Rect
          fill={workoutSummaryColors.accent}
          height="16"
          rx="3"
          width="5.5"
          x="37.5"
          y="24"
        />
      </G>
      <Path
        d="M47 14C48 16.4 48.6 17 51 18C48.6 19 48 19.6 47 22C46 19.6 45.4 19 43 18C45.4 17 46 16.4 47 14Z"
        fill={workoutSummaryColors.surface}
      />
    </Svg>
  );
}
