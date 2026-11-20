import { StyleSheet } from "react-native";
import Svg, {
  Circle,
  Defs,
  Ellipse,
  G,
  LinearGradient,
  Path,
  Rect,
  Stop,
} from "react-native-svg";

import { workoutSummaryColors } from "../../shared/ui/theme";

/**
 * Original vector artwork for the workout summary.
 *
 * The illustrations are bundled with the application so the screen never
 * depends on remote images. They follow the screen-scoped beige, cream, lime,
 * lavender and sky-blue palette. Energy comes from geometric rings, speed
 * arcs and confetti, never from organic lavender stains.
 */

/** Full-bleed beige wash with geometric rings and botanical line art. */
export function WorkoutSummaryBackdrop() {
  return (
    <Svg
      height="100%"
      pointerEvents="none"
      preserveAspectRatio="xMidYMid slice"
      style={StyleSheet.absoluteFill}
      viewBox="0 0 390 844"
      width="100%"
    >
      <Defs>
        <LinearGradient id="summaryBackground" x1="0" x2="0" y1="0" y2="1">
          <Stop offset="0" stopColor="#F6F0E8" />
          <Stop offset="0.55" stopColor="#F1EAE0" />
          <Stop offset="1" stopColor="#EBE0D3" />
        </LinearGradient>
      </Defs>

      <Rect fill="url(#summaryBackground)" height="844" width="390" />
      <Circle
        cx="392"
        cy="34"
        fill="none"
        r="118"
        stroke={workoutSummaryColors.border}
        strokeWidth="1.4"
      />
      <Circle
        cx="12"
        cy="806"
        fill="none"
        r="122"
        stroke={workoutSummaryColors.info}
        strokeOpacity="0.4"
        strokeWidth="2.4"
      />
      <Circle
        cx="12"
        cy="806"
        fill="none"
        r="96"
        stroke={workoutSummaryColors.border}
        strokeWidth="1.2"
      />

      <G
        opacity="0.5"
        stroke={workoutSummaryColors.border}
        strokeLinecap="round"
        strokeWidth="1.6"
      >
        <Path d="M-8 210L46 184" />
        <Path d="M-4 232L58 200" />
        <Path d="M2 254L64 222" />
      </G>

      <G
        fill="none"
        stroke={workoutSummaryColors.border}
        strokeLinecap="round"
        strokeWidth="1.7"
      >
        <Path d="M-4 246C28 223 41 197 35 159" />
        <Path d="M17 219C30 211 44 213 52 222C42 232 27 231 17 219Z" />
        <Path d="M3 195C17 185 32 186 41 195C30 206 14 206 3 195Z" />
        <Path d="M15 174C31 166 45 171 51 181C38 189 24 186 15 174Z" />
        <Path d="M29 147C44 141 58 146 61 157C48 164 35 160 29 147Z" />
      </G>

      <G
        fill="none"
        stroke={workoutSummaryColors.border}
        strokeLinecap="round"
        strokeWidth="1.7"
      >
        <Path d="M394 166C365 143 352 114 361 78" />
        <Path d="M371 132C355 123 341 127 334 138C346 148 362 145 371 132Z" />
        <Path d="M380 105C364 95 349 99 341 110C354 121 371 118 380 105Z" />
        <Path d="M365 82C347 74 333 80 328 92C343 100 358 94 365 82Z" />
      </G>

      <G
        fill="none"
        stroke={workoutSummaryColors.border}
        strokeLinecap="round"
        strokeWidth="1.5"
      >
        <Path d="M396 500C365 485 349 459 351 429" />
        <Path d="M376 477C360 468 346 472 340 483C352 492 368 489 376 477Z" />
        <Path d="M368 451C352 442 338 447 332 458C345 467 361 463 368 451Z" />
        <Path d="M359 431C344 424 332 430 328 440C341 447 354 442 359 431Z" />
      </G>

      <G
        fill="none"
        stroke={workoutSummaryColors.border}
        strokeLinecap="round"
        strokeWidth="1.5"
      >
        <Path d="M-2 742C26 724 37 701 33 672" />
        <Path d="M12 718C26 710 39 713 45 722C35 731 21 729 12 718Z" />
        <Path d="M7 695C20 687 33 690 39 699C29 708 15 706 7 695Z" />
      </G>

      <Path
        d="M330 168C331.4 172.4 332.8 173.8 337.2 175.2C332.8 176.6 331.4 178 330 182.4C328.6 178 327.2 176.6 322.8 175.2C327.2 173.8 328.6 172.4 330 168Z"
        fill={workoutSummaryColors.action}
      />
      <Circle cx="57" cy="300" fill={workoutSummaryColors.info} r="4" />
      <Circle
        cx="352"
        cy="636"
        fill={workoutSummaryColors.text}
        opacity="0.24"
        r="3"
      />
      <Circle
        cx="64"
        cy="520"
        fill="none"
        r="7"
        stroke={workoutSummaryColors.info}
        strokeOpacity="0.65"
        strokeWidth="2"
      />
      <Rect
        fill={workoutSummaryColors.action}
        height="12"
        rx="3"
        transform="rotate(34 70 112)"
        width="4"
        x="68"
        y="106"
      />
    </Svg>
  );
}

/** Hero illustration: a lime and lavender dumbbell with a completed check. */

export function CompletedWorkoutIllustration() {
  return (
    <Svg width="100%" height="100%" viewBox="0 0 280 190">
      <Defs>
        {/* Lime plate */}
        <LinearGradient id="limePlate" x1="0" y1="0" x2="1" y2="1">
          <Stop offset="0" stopColor="#F0F29A" />
          <Stop offset="0.45" stopColor="#E9ED74" />
          <Stop offset="1" stopColor="#B2B81F" />
        </LinearGradient>

        {/* Lavender plate */}
        <LinearGradient id="lavenderPlate" x1="0" y1="0" x2="1" y2="1">
          <Stop offset="0" stopColor="#F0EDFF" />
          <Stop offset="0.5" stopColor={workoutSummaryColors.accent} />
          <Stop offset="1" stopColor="#9383E8" />
        </LinearGradient>

        {/* Metallic bar */}
        <LinearGradient id="metalBar" x1="0" y1="0" x2="0" y2="1">
          <Stop offset="0" stopColor="#B9A5A0" />
          <Stop offset="0.35" stopColor="#6A3330" />
          <Stop offset="0.65" stopColor="#44302F" />
          <Stop offset="1" stopColor="#2D2426" />
        </LinearGradient>

        {/* Dark plate sides */}
        <LinearGradient id="plateEdge" x1="0" y1="0" x2="1" y2="0">
          <Stop offset="0" stopColor="#77717D" />
          <Stop offset="0.5" stopColor="#38333F" />
          <Stop offset="1" stopColor="#25232D" />
        </LinearGradient>
      </Defs>

      {/* Subtle background geometry */}
      <Circle
        cx="137"
        cy="89"
        r="76"
        fill={workoutSummaryColors.action}
        opacity="0.045"
      />

      <Circle
        cx="137"
        cy="89"
        r="76"
        fill="none"
        stroke={workoutSummaryColors.border}
        strokeWidth="1"
        strokeDasharray="2 7"
        opacity="0.8"
      />

      <Path
        d="M56 46 A94 94 0 0 1 218 43"
        fill="none"
        stroke={workoutSummaryColors.accent}
        strokeWidth="2"
        strokeLinecap="round"
        opacity="0.6"
      />

      {/* Ground shadow */}
      <Ellipse
        cx="137"
        cy="151"
        rx="82"
        ry="8"
        fill={workoutSummaryColors.text}
        opacity="0.13"
      />

      {/* Barbell */}
      <G transform="rotate(-12 140 90)">
        {/* Bar shaft */}
        <Rect
          x="65"
          y="85"
          width="150"
          height="11"
          rx="5"
          fill="url(#metalBar)"
        />

        <Path
          d="M105 87H176"
          stroke="#FFFFFF"
          strokeWidth="1.2"
          opacity="0.35"
          strokeLinecap="round"
        />

        {/* Left outer disc */}
        <Rect
          x="38"
          y="45"
          width="34"
          height="90"
          rx="9"
          fill="url(#limePlate)"
        />

        <Rect
          x="43"
          y="51"
          width="7"
          height="78"
          rx="3"
          fill="#FFFFFF"
          opacity="0.28"
        />

        <Rect
          x="60"
          y="53"
          width="7"
          height="74"
          rx="3"
          fill="#899025"
          opacity="0.35"
        />

        {/* Left inner disc */}
        <Rect
          x="74"
          y="57"
          width="21"
          height="66"
          rx="7"
          fill="url(#lavenderPlate)"
        />

        <Rect
          x="78"
          y="63"
          width="4"
          height="54"
          rx="2"
          fill="#FFFFFF"
          opacity="0.5"
        />

        {/* Right inner disc */}
        <Rect
          x="185"
          y="57"
          width="21"
          height="66"
          rx="7"
          fill="url(#lavenderPlate)"
        />

        <Rect
          x="198"
          y="63"
          width="4"
          height="54"
          rx="2"
          fill="#FFFFFF"
          opacity="0.35"
        />

        {/* Right outer disc */}
        <Rect
          x="208"
          y="45"
          width="34"
          height="90"
          rx="9"
          fill="url(#limePlate)"
        />

        <Rect
          x="213"
          y="51"
          width="7"
          height="78"
          rx="3"
          fill="#FFFFFF"
          opacity="0.28"
        />

        <Rect
          x="230"
          y="53"
          width="7"
          height="74"
          rx="3"
          fill="#899025"
          opacity="0.35"
        />

        {/* Collars */}
        <Rect
          x="96"
          y="76"
          width="7"
          height="29"
          rx="2"
          fill="url(#plateEdge)"
        />

        <Rect
          x="177"
          y="76"
          width="7"
          height="29"
          rx="2"
          fill="url(#plateEdge)"
        />

        {/* Fine collar details */}
        <Path
          d="M98 80V101 M181 80V101"
          stroke="#FFFFFF"
          strokeWidth="1"
          opacity="0.3"
        />
      </G>

      {/* Completion badge */}
      <Circle
        cx="215"
        cy="137"
        r="27"
        fill={workoutSummaryColors.surface}
        stroke={workoutSummaryColors.border}
        strokeWidth="1.3"
      />

      <Circle cx="215" cy="137" r="21" fill={workoutSummaryColors.action} />

      <Path
        d="M205 137L212 144L225 130"
        fill="none"
        stroke={workoutSummaryColors.onAction}
        strokeWidth="3.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />

      {/* Small controlled accents */}
      <Path
        d="M63 34L67 42L75 46L67 50L63 58L59 50L51 46L59 42Z"
        fill={workoutSummaryColors.accent}
        opacity="0.9"
      />

      <Circle cx="235" cy="58" r="3" fill={workoutSummaryColors.info} />

      <Circle cx="49" cy="112" r="2.5" fill={workoutSummaryColors.action} />

      <Path
        d="M241 105L247 99"
        stroke={workoutSummaryColors.info}
        strokeWidth="2"
        strokeLinecap="round"
      />
    </Svg>
  );
}
