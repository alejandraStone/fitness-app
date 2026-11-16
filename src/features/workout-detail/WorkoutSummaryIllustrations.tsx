import { StyleSheet } from 'react-native';
import Svg, {
  Circle,
  Defs,
  Ellipse,
  G,
  LinearGradient,
  Path,
  RadialGradient,
  Rect,
  Stop,
} from 'react-native-svg';

import { colors } from '../../shared/ui/theme';

/**
 * Original vector artwork for the workout summary.
 *
 * The illustrations are bundled with the application so the screen never
 * depends on remote images. They use the same soft, hand-drawn visual language
 * as the approved summary reference.
 */

/** Full-bleed warm wash with botanical corners for the summary screen. */
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
          <Stop offset="0" stopColor="#FFF7F3" />
          <Stop offset="0.5" stopColor="#FBF5F1" />
          <Stop offset="1" stopColor="#FAF1EC" />
        </LinearGradient>
        <RadialGradient cx="0.5" cy="0.5" id="topGlow" r="0.5">
          <Stop offset="0" stopColor="#F8D7D9" stopOpacity="0.85" />
          <Stop offset="0.62" stopColor="#F8D7D9" stopOpacity="0.32" />
          <Stop offset="1" stopColor="#F8D7D9" stopOpacity="0" />
        </RadialGradient>
        <RadialGradient cx="0.5" cy="0.5" id="sideGlow" r="0.5">
          <Stop offset="0" stopColor="#F4DCCF" stopOpacity="0.55" />
          <Stop offset="1" stopColor="#F4DCCF" stopOpacity="0" />
        </RadialGradient>
      </Defs>

      <Rect fill="url(#summaryBackground)" height="844" width="390" />
      <Circle cx="208" cy="96" fill="url(#topGlow)" r="212" />
      <Circle cx="360" cy="412" fill="url(#sideGlow)" r="170" />
      <Circle cx="24" cy="700" fill="url(#sideGlow)" r="150" />

      <G opacity="0.58">
        <Path
          d="M-4 246C28 223 41 197 35 159"
          fill="none"
          stroke="#E3CEC6"
          strokeLinecap="round"
          strokeWidth="2.4"
        />
        <Path
          d="M17 219C30 211 44 213 52 222C42 232 27 231 17 219Z"
          fill="#EBD9D2"
        />
        <Path
          d="M3 195C17 185 32 186 41 195C30 206 14 206 3 195Z"
          fill="#F2E1DA"
        />
        <Path
          d="M15 174C31 166 45 171 51 181C38 189 24 186 15 174Z"
          fill="#EBD9D2"
        />
        <Path
          d="M29 147C44 141 58 146 61 157C48 164 35 160 29 147Z"
          fill="#F2E1DA"
        />
      </G>

      <G opacity="0.55">
        <Path
          d="M394 166C365 143 352 114 361 78"
          fill="none"
          stroke="#E1CBC2"
          strokeLinecap="round"
          strokeWidth="2.4"
        />
        <Path
          d="M371 132C355 123 341 127 334 138C346 148 362 145 371 132Z"
          fill="#EEDCD4"
        />
        <Path
          d="M380 105C364 95 349 99 341 110C354 121 371 118 380 105Z"
          fill="#F3E3DC"
        />
        <Path
          d="M365 82C347 74 333 80 328 92C343 100 358 94 365 82Z"
          fill="#EEDCD4"
        />
      </G>

      <G opacity="0.45">
        <Path
          d="M396 500C365 485 349 459 351 429"
          fill="none"
          stroke="#E3CEC6"
          strokeLinecap="round"
          strokeWidth="2.2"
        />
        <Path
          d="M376 477C360 468 346 472 340 483C352 492 368 489 376 477Z"
          fill="#F1DFD8"
        />
        <Path
          d="M368 451C352 442 338 447 332 458C345 467 361 463 368 451Z"
          fill="#E9D6CE"
        />
        <Path
          d="M359 431C344 424 332 430 328 440C341 447 354 442 359 431Z"
          fill="#F1DFD8"
        />
      </G>

      <G opacity="0.36">
        <Path
          d="M-2 742C26 724 37 701 33 672"
          fill="none"
          stroke="#E2CDC5"
          strokeLinecap="round"
          strokeWidth="2.2"
        />
        <Path
          d="M12 718C26 710 39 713 45 722C35 731 21 729 12 718Z"
          fill="#F0DED7"
        />
        <Path
          d="M7 695C20 687 33 690 39 699C29 708 15 706 7 695Z"
          fill="#E8D4CC"
        />
      </G>
    </Svg>
  );
}

/** Hero illustration: a rose dumbbell with a completed check and confetti. */
export function CompletedWorkoutIllustration() {
  return (
    <Svg height="100%" viewBox="0 0 280 190" width="100%">
      <Defs>
        <RadialGradient cx="0.5" cy="0.5" id="dumbbellBlob" r="0.5">
          <Stop offset="0" stopColor="#F7CDD0" stopOpacity="0.95" />
          <Stop offset="0.64" stopColor="#F7CDD0" stopOpacity="0.5" />
          <Stop offset="1" stopColor="#F7CDD0" stopOpacity="0" />
        </RadialGradient>
        <LinearGradient id="outerPlate" x1="0" x2="1" y1="0" y2="1">
          <Stop offset="0" stopColor="#E98C9A" />
          <Stop offset="0.48" stopColor="#C95D75" />
          <Stop offset="1" stopColor="#9E3452" />
        </LinearGradient>
        <LinearGradient id="innerPlate" x1="0" x2="1" y1="0" y2="1">
          <Stop offset="0" stopColor="#F2A9B3" />
          <Stop offset="0.55" stopColor="#CD667D" />
          <Stop offset="1" stopColor="#AE3D59" />
        </LinearGradient>
        <LinearGradient id="barbell" x1="0" x2="1" y1="0" y2="0">
          <Stop offset="0" stopColor="#A93C58" />
          <Stop offset="0.45" stopColor="#D97A8C" />
          <Stop offset="0.7" stopColor="#C55C74" />
          <Stop offset="1" stopColor="#A53753" />
        </LinearGradient>
      </Defs>

      <Circle cx="142" cy="92" fill="url(#dumbbellBlob)" r="104" />
      <Ellipse cx="140" cy="148" fill="#D9AEB5" opacity="0.22" rx="82" ry="12" />

      <G transform="rotate(-11 140 92)">
        <Rect
          fill="url(#outerPlate)"
          height="82"
          rx="16"
          width="38"
          x="48"
          y="51"
        />
        <Rect
          fill="url(#innerPlate)"
          height="61"
          rx="11"
          width="24"
          x="83"
          y="62"
        />
        <Rect
          fill="url(#barbell)"
          height="12"
          rx="6"
          width="74"
          x="103"
          y="86"
        />
        <Rect
          fill="url(#innerPlate)"
          height="61"
          rx="11"
          width="24"
          x="173"
          y="62"
        />
        <Rect
          fill="url(#outerPlate)"
          height="82"
          rx="16"
          width="38"
          x="194"
          y="51"
        />

        <Rect
          fill="#9D3552"
          height="29"
          rx="3.5"
          width="7"
          x="99"
          y="78"
        />
        <Rect
          fill="#9D3552"
          height="29"
          rx="3.5"
          width="7"
          x="174"
          y="78"
        />

        <Rect
          fill="#FFFFFF"
          height="54"
          opacity="0.24"
          rx="4"
          width="7"
          x="58"
          y="65"
        />
        <Rect
          fill="#FFFFFF"
          height="54"
          opacity="0.18"
          rx="4"
          width="7"
          x="204"
          y="65"
        />
        <Rect
          fill="#FFFFFF"
          height="3"
          opacity="0.35"
          rx="1.5"
          width="61"
          x="110"
          y="89"
        />
      </G>

      <Circle cx="218" cy="136" fill="#FFFFFF" r="27" />
      <Circle
        cx="218"
        cy="136"
        fill="none"
        r="27"
        stroke="#EBDEE3"
        strokeWidth="1.2"
      />
      <Path
        d="M207 136.5L214.4 144L229.5 127.5"
        fill="none"
        stroke={colors.primary}
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth="4.4"
      />

      <Path
        d="M86 38C88.5 45.3 90.7 47.5 98 50C90.7 52.5 88.5 54.7 86 62C83.5 54.7 81.3 52.5 74 50C81.3 47.5 83.5 45.3 86 38Z"
        fill={colors.primary}
        opacity="0.75"
      />
      <Path
        d="M238 58C239.6 62.4 241 63.8 245.4 65.4C241 67 239.6 68.4 238 72.8C236.4 68.4 235 67 230.6 65.4C235 63.8 236.4 62.4 238 58Z"
        fill={colors.coral}
      />
      <Circle cx="254" cy="88" fill={colors.positive} r="4.2" />
      <Rect
        fill={colors.coral}
        height="15"
        rx="3"
        transform="rotate(32 75 120)"
        width="5"
        x="72.5"
        y="112.5"
      />
      <Rect
        fill={colors.primary}
        height="12"
        opacity="0.7"
        rx="2.5"
        transform="rotate(-28 250 111)"
        width="4.5"
        x="247.75"
        y="105"
      />
      <Circle cx="62" cy="84" fill="#F2B7BD" r="3.2" />
    </Svg>
  );
}

