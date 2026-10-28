import { useMemo, useState, type ReactNode } from 'react';
import type { StyleProp, ViewStyle } from 'react-native';
import {
  Animated,
  Keyboard,
  KeyboardAvoidingView,
  Modal,
  PanResponder,
  Platform,
  ScrollView,
  StyleSheet,
  useWindowDimensions,
  View,
} from 'react-native';
import { Dialog, Portal, Text } from 'react-native-paper';
import {
  SafeAreaView,
  useSafeAreaInsets,
} from 'react-native-safe-area-context';

import { colors, radii, spacing } from './theme';

export interface SheetScaffoldProps {
  title: string;
  onClose: () => void;
  children: ReactNode;
  /** Actions shown outside the scroll area. Omit when the content owns them. */
  footer?: ReactNode;
  /** Optional action shown to the left of the title, such as Cancel. */
  headerLeft?: ReactNode;
  /** Optional action shown to the right of the title, such as Save. */
  headerRight?: ReactNode;
  /** Prevents dismissal while an operation is running. */
  dismissable?: boolean;
  /**
   * Embedded sheets keep the surrounding draft alive. Route sheets use the
   * native formSheet presentation on iOS and Android instead.
   */
  embedded?: boolean;
  /** Lets native formSheet measure a short sheet instead of filling a detent. */
  fitToContents?: boolean;
  scrollable?: boolean;
  contentStyle?: StyleProp<ViewStyle>;
}

/**
 * Shared presentation for S1–S5.
 *
 * Native route sheets are rendered by Expo Router's formSheet presentation.
 * Embedded sheets use a full-height modal below the top safe area so they cover
 * the draft and remain drag-dismissible. Web uses a centered Paper dialog
 * because native stack formSheet is not available there; this is the documented
 * web-only fallback.
 */
export function SheetScaffold({
  title,
  onClose,
  children,
  footer,
  headerLeft,
  headerRight,
  dismissable = true,
  embedded = false,
  fitToContents = false,
  scrollable = true,
  contentStyle,
}: SheetScaffoldProps) {
  const { height } = useWindowDimensions();
  const insets = useSafeAreaInsets();
  const maximumScrollHeight = fitToContents ? height * 0.8 : undefined;
  const [translateY] = useState(() => new Animated.Value(0));
  const panResponder = useMemo(
    () =>
      PanResponder.create({
        onStartShouldSetPanResponder: () => dismissable,
        onMoveShouldSetPanResponder: (_, gesture) =>
          dismissable &&
          gesture.dy > 4 &&
          Math.abs(gesture.dy) > Math.abs(gesture.dx),
        onPanResponderGrant: () => {
          translateY.stopAnimation();
        },
        onPanResponderMove: (_, gesture) => {
          translateY.setValue(Math.max(0, gesture.dy));
        },
        onPanResponderRelease: (_, gesture) => {
          if (dismissable && (gesture.dy > 80 || gesture.vy > 0.7)) {
            Keyboard.dismiss();
            Animated.timing(translateY, {
              duration: 180,
              toValue: height,
              useNativeDriver: true,
            }).start(({ finished }) => {
              if (finished) {
                onClose();
              }
            });
            return;
          }

          Animated.spring(translateY, {
            bounciness: 0,
            toValue: 0,
            useNativeDriver: true,
          }).start();
        },
        onPanResponderTerminate: () => {
          Animated.spring(translateY, {
            bounciness: 0,
            toValue: 0,
            useNativeDriver: true,
          }).start();
        },
      }),
    [dismissable, height, onClose, translateY],
  );
  const hasHeaderActions = headerLeft !== undefined || headerRight !== undefined;
  const iosFormSheetHeaderInset =
    !embedded && Platform.OS === 'ios' ? styles.iosFormSheetHeaderInset : null;
  const headerTitle = (
    <Text
      accessibilityRole="header"
      adjustsFontSizeToFit={hasHeaderActions}
      minimumFontScale={0.8}
      numberOfLines={hasHeaderActions ? 1 : undefined}
      style={
        hasHeaderActions
          ? styles.headerTitle
          : [styles.title, iosFormSheetHeaderInset]
      }
      variant="titleLarge"
    >
      {title}
    </Text>
  );
  const header = hasHeaderActions ? (
    <View style={[styles.headerRow, iosFormSheetHeaderInset]}>
      <View style={styles.headerSide}>{headerLeft}</View>
      {headerTitle}
      <View style={[styles.headerSide, styles.headerSideRight]}>
        {headerRight}
      </View>
    </View>
  ) : (
    headerTitle
  );

  if (Platform.OS === 'web') {
    return (
      <Portal>
        <Dialog
          dismissable={dismissable}
          onDismiss={onClose}
          style={styles.webDialog}
          visible
        >
          {hasHeaderActions ? (
            header
          ) : (
            <Dialog.Title accessibilityRole="header" style={styles.title}>
              {title}
            </Dialog.Title>
          )}
          {scrollable ? (
            <Dialog.Content style={styles.webContent}>
              <ScrollView
                contentContainerStyle={[styles.content, contentStyle]}
                keyboardShouldPersistTaps="handled"
                style={{ maxHeight: Math.max(240, height * 0.55) }}
              >
                {children}
              </ScrollView>
            </Dialog.Content>
          ) : (
            <Dialog.Content style={styles.webContent}>
              {children}
            </Dialog.Content>
          )}
          {footer !== undefined ? (
            <Dialog.Actions style={styles.webActions}>
              {footer}
            </Dialog.Actions>
          ) : null}
        </Dialog>
      </Portal>
    );
  }

  const content = (
    <>
      {embedded ? (
        <View style={styles.handleArea} {...panResponder.panHandlers}>
          <View style={styles.handle} />
        </View>
      ) : null}
      {header}
      {scrollable ? (
        <ScrollView
          contentContainerStyle={[styles.content, contentStyle]}
          keyboardShouldPersistTaps="handled"
          style={[
            styles.scroll,
            maximumScrollHeight === undefined
              ? null
              : { maxHeight: maximumScrollHeight },
          ]}
        >
          {children}
        </ScrollView>
      ) : (
        <View style={[styles.content, contentStyle]}>{children}</View>
      )}
      {footer !== undefined ? (
        <View style={styles.footer}>{footer}</View>
      ) : null}
    </>
  );

  if (embedded) {
    // Lift the dock above the keyboard. Keeping the keyboard handler inside
    // the sheet would shrink it instead and leave its fields behind the keyboard.
    // The full-height frame starts at the top safe inset, covering the draft
    // while keeping the grabber clear of the iPhone notch.
    return (
      <Modal
        animationType="slide"
        onRequestClose={() => {
          if (dismissable) {
            onClose();
          }
        }}
        transparent
        visible
      >
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
          style={styles.modalRoot}
        >
          <View pointerEvents="none" style={styles.backdropScrim} />
          <View style={[styles.sheetDock, { paddingTop: insets.top }]}>
            <Animated.View
              style={[
                styles.embeddedSheetFrame,
                { transform: [{ translateY }] },
              ]}
            >
              <SafeAreaView edges={['bottom']} style={styles.embeddedSheet}>
                {content}
              </SafeAreaView>
            </Animated.View>
          </View>
        </KeyboardAvoidingView>
      </Modal>
    );
  }

  return (
    <SafeAreaView
      edges={['bottom']}
      style={[styles.nativeSheet, fitToContents && styles.fitSheet]}
    >
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        style={[styles.keyboard, fitToContents && styles.keyboardFlexible]}
      >
        {content}
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

/** Horizontal action row used in sheet footers on every platform. */
export function SheetFooter({ children }: { children: ReactNode }) {
  return <View style={styles.footerRow}>{children}</View>;
}

const styles = StyleSheet.create({
  nativeSheet: {
    flex: 1,
    backgroundColor: colors.surface,
  },
  fitSheet: {
    flex: 0,
  },
  keyboard: {
    flex: 1,
  },
  keyboardFlexible: {
    flex: 0,
    flexShrink: 1,
  },
  title: {
    color: colors.text,
    fontWeight: '800',
    letterSpacing: -0.3,
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.lg,
    paddingBottom: spacing.sm,
  },
  headerRow: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: spacing.xs,
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.lg,
    paddingBottom: spacing.sm,
  },
  iosFormSheetHeaderInset: {
    // iOS draws the native grabber above the sheet content.
    paddingTop: spacing.xxl,
  },
  headerTitle: {
    color: colors.text,
    flex: 1,
    fontWeight: '800',
    letterSpacing: -0.3,
    textAlign: 'center',
  },
  headerSide: {
    justifyContent: 'center',
    minWidth: 60,
  },
  headerSideRight: {
    alignItems: 'flex-end',
  },
  scroll: {
    flex: 1,
  },
  content: {
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing.lg,
    gap: spacing.md,
  },
  footer: {
    borderTopWidth: 1,
    borderTopColor: colors.border,
    padding: spacing.lg,
    gap: spacing.sm,
  },
  footerRow: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    flexWrap: 'wrap',
    gap: spacing.sm,
  },
  modalRoot: {
    flex: 1,
  },
  sheetDock: {
    flex: 1,
    justifyContent: 'flex-end',
  },
  backdropScrim: {
    position: 'absolute',
    top: 0,
    right: 0,
    bottom: 0,
    left: 0,
    backgroundColor: colors.scrim,
    opacity: colors.scrimOpacity,
  },
  embeddedSheetFrame: {
    flex: 1,
    borderTopLeftRadius: radii.xl,
    borderTopRightRadius: radii.xl,
    backgroundColor: colors.surface,
    overflow: 'hidden',
  },
  embeddedSheet: {
    flex: 1,
    backgroundColor: colors.surface,
  },
  handleArea: {
    alignItems: 'center',
    height: 32,
    justifyContent: 'flex-start',
    paddingTop: spacing.sm,
  },
  handle: {
    width: 40,
    height: 4,
    borderRadius: radii.pill,
    backgroundColor: colors.border,
  },
  webDialog: {
    maxHeight: '88%',
    borderRadius: radii.xl,
    backgroundColor: colors.surface,
  },
  webContent: {
    paddingHorizontal: spacing.lg,
    paddingTop: 0,
    paddingBottom: 0,
  },
  webActions: {
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing.lg,
  },
});
