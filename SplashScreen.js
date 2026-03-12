// SplashScreen.js
import React, { useEffect, useRef } from "react";
import { View, Text, StyleSheet, Animated, Easing, StatusBar, Dimensions } from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import Svg, { Polygon } from "react-native-svg";

const colors = {
  bg: "#0B0B0F",
  text: "#EAEAF0",
  subtext: "#9BA0AE",
  accent: "#5FE1B9",
  accent2: "#8AB6FF",
};

const SIZE = 132;               // badge diameter
const DURATION = 6000;          // total splash time (ms)  ← 6 seconds
const ENTER_DURATION = 900;     // initial reveal
const SLIDE_DURATION = 650;     // tagline slide
const PULSE_DURATION = 1500;    // badge pulse loop
const SWEEP_DURATION = 1700;    // light sweep across badge
const PROGRESS_DURATION = 5600; // progress bar fill (slightly under total)
const HEX_SIZE = SIZE * 0.60;   // inner hex size (relative to badge)

export default function SplashScreen({ navigation }) {
  // Entrance
  const fade = useRef(new Animated.Value(0)).current;
  const scale = useRef(new Animated.Value(0.85)).current;
  const slide = useRef(new Animated.Value(18)).current;

  // Badge motion
  const pulse = useRef(new Animated.Value(0)).current;
  const sweep = useRef(new Animated.Value(0)).current;

  // Progress
  const progress = useRef(new Animated.Value(0)).current;

  // Hex pop (centered shape)
  const hexScale = useRef(new Animated.Value(0.8)).current;
  const hexOpacity = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    // Staggered entrance
    Animated.sequence([
      Animated.parallel([
        Animated.timing(fade, { toValue: 1, duration: ENTER_DURATION, easing: Easing.out(Easing.cubic), useNativeDriver: true }),
        Animated.spring(scale, { toValue: 1, friction: 6, tension: 80, useNativeDriver: true }),
      ]),
      Animated.timing(slide, { toValue: 0, duration: SLIDE_DURATION, easing: Easing.out(Easing.cubic), useNativeDriver: true }),
    ]).start();

    // Gentle badge pulse
    Animated.loop(
      Animated.sequence([
        Animated.timing(pulse, { toValue: 1, duration: PULSE_DURATION, easing: Easing.inOut(Easing.quad), useNativeDriver: true }),
        Animated.timing(pulse, { toValue: 0, duration: PULSE_DURATION, easing: Easing.inOut(Easing.quad), useNativeDriver: true }),
      ])
    ).start();

    // Light sweep across the badge
    Animated.loop(
      Animated.sequence([
        Animated.timing(sweep, { toValue: 1, duration: SWEEP_DURATION, easing: Easing.inOut(Easing.quad), useNativeDriver: true }),
        Animated.timing(sweep, { toValue: 0, duration: 300, useNativeDriver: true }), // quick reset
        Animated.delay(600),
      ])
    ).start();

    // Progress bar
    Animated.timing(progress, {
      toValue: 1,
      duration: PROGRESS_DURATION,
      easing: Easing.out(Easing.cubic),
      useNativeDriver: false, // width changes layout
    }).start();

    // Hex pop (centered, intentional)
    Animated.parallel([
      Animated.timing(hexOpacity, { toValue: 1, duration: 700, easing: Easing.out(Easing.cubic), useNativeDriver: true }),
      Animated.spring(hexScale, { toValue: 1, friction: 6, tension: 80, useNativeDriver: true }),
    ]).start();

    // Navigate after 6s
    const timeout = setTimeout(() => navigation.replace("Home"), DURATION);
    return () => clearTimeout(timeout);
  }, []);

  // Interpolations
  const pulseScale = pulse.interpolate({ inputRange: [0, 1], outputRange: [1, 1.06] });
  const pulseOpacity = pulse.interpolate({ inputRange: [0, 1], outputRange: [0.35, 0.6] });
  const sweepTranslate = sweep.interpolate({ inputRange: [0, 1], outputRange: [-SIZE, SIZE] });

  const { width: SCREEN_W } = Dimensions.get("window");
  const progressWidth = progress.interpolate({ inputRange: [0, 1], outputRange: [0, SCREEN_W - 36] });

  // Helper: centered hexagon points for the SVG
  const hexPoints = (() => {
    const s = HEX_SIZE;
    const r = (s / 2) * 0.92;         // radius
    const cx = s / 2, cy = s / 2;     // center
    const pts = [];
    for (let i = 0; i < 6; i++) {
      const angle = (Math.PI / 3) * i - Math.PI / 6; // flat-top hex
      const x = cx + r * Math.cos(angle);
      const y = cy + r * Math.sin(angle);
      pts.push(`${x},${y}`);
    }
    return pts.join(" ");
  })();

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" />
      <LinearGradient colors={[colors.bg, "#0C1120"]} style={StyleSheet.absoluteFill} />
      <LinearGradient
        pointerEvents="none"
        colors={["rgba(138,182,255,0.15)", "transparent"]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 0 }}
        style={styles.topSweep}
      />

      {/* Emblem + centered hex */}
      <Animated.View style={{ transform: [{ scale }] }}>
        <Animated.View style={{ opacity: pulseOpacity, transform: [{ scale: pulseScale }] }}>
          <View style={styles.badgeWrap}>
            {/* Outer glow */}
            <View style={styles.glow} />

            {/* Badge core (relative for overlays) */}
            <LinearGradient
              colors={[colors.accent2, colors.accent]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={styles.badge}
            >
              {/* CENTERED HEXAGON — crisp & intentional */}
              <Animated.View
                style={{
                  position: "absolute",
                  width: HEX_SIZE,
                  height: HEX_SIZE,
                  top: (SIZE - HEX_SIZE) / 2,
                  left: (SIZE - HEX_SIZE) / 2,
                  opacity: hexOpacity,
                  transform: [{ scale: hexScale }],
                }}
              >
                <Svg width={HEX_SIZE} height={HEX_SIZE}>
                  <Polygon
                    points={hexPoints}
                    fill="rgba(255,255,255,0.06)"
                    stroke="rgba(10,13,14,0.35)"
                    strokeWidth={2}
                  />
                </Svg>
              </Animated.View>

              {/* Tick */}
              <Text style={styles.tick}>✓</Text>

              {/* Light sweep overlay (clipped to circle) */}
              <Animated.View
                pointerEvents="none"
                style={[
                  styles.sweepOverlay,
                  { transform: [{ translateX: sweepTranslate }, { rotate: "20deg" }] },
                ]}
              >
                <LinearGradient
                  colors={["rgba(255,255,255,0.00)", "rgba(255,255,255,0.35)", "rgba(255,255,255,0.00)"]}
                  start={{ x: 0, y: 0.5 }}
                  end={{ x: 1, y: 0.5 }}
                  style={{ flex: 1 }}
                />
              </Animated.View>
            </LinearGradient>
          </View>
        </Animated.View>
      </Animated.View>

      {/* Branding */}
      <Animated.View style={{ opacity: fade, transform: [{ translateY: slide }], alignItems: "center", marginTop: 26 }}>
        <Text style={styles.wordmark}>
          Safe<Text style={{ color: colors.accent }}>Pay</Text>
        </Text>
        <Text style={styles.tagline}>Banking-grade evidence for ATM withdrawals</Text>
      </Animated.View>

      {/* Bottom reassurance + progress */}
      <Animated.View style={[styles.strip, { opacity: fade, transform: [{ translateY: slide }] }]}>
        <Text style={styles.stripText}>No facial recognition. You control what you share.</Text>
        <View style={styles.progressTrack}>
          <Animated.View style={[styles.progressFill, { width: progressWidth }]} />
        </View>
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, alignItems: "center", justifyContent: "center", backgroundColor: colors.bg },
  topSweep: { position: "absolute", top: 0, height: 110, left: 0, right: 0 },

  badgeWrap: { width: SIZE, height: SIZE, alignItems: "center", justifyContent: "center" },
  glow: {
    position: "absolute",
    width: SIZE * 1.4,
    height: SIZE * 1.4,
    borderRadius: (SIZE * 1.4) / 2,
    backgroundColor: "rgba(95,225,185,0.35)",
  },
  badge: {
    width: SIZE,
    height: SIZE,
    borderRadius: SIZE / 2,
    alignItems: "center",
    justifyContent: "center",
    shadowColor: colors.accent,
    shadowOpacity: 0.55,
    shadowRadius: 24,
    shadowOffset: { width: 0, height: 8 },
    elevation: 12,
    overflow: "hidden",       // clip sweep to circle
    position: "relative",     // anchor hex overlay
  },
  tick: { fontSize: 56, color: "#0A0D0E", fontWeight: "900" },

  sweepOverlay: {
    position: "absolute",
    width: SIZE,
    height: SIZE * 0.6,
    opacity: 0.5,
  },

  wordmark: { color: colors.text, fontSize: 40, fontWeight: "800", letterSpacing: 0.5 },
  tagline: { marginTop: 8, color: colors.subtext, fontSize: 14, letterSpacing: 0.3, textAlign: "center" },

  strip: {
    position: "absolute",
    bottom: 28,
    left: 18,
    right: 18,
    backgroundColor: "#0F1218",
    borderRadius: 14,
    paddingVertical: 12,
    paddingHorizontal: 14,
    alignItems: "center",
  },
  stripText: { color: "#8B92A1", fontSize: 12, marginBottom: 8 },
  progressTrack: {
    height: 4,
    width: "100%",
    borderRadius: 999,
    backgroundColor: "#151A21",
    overflow: "hidden",
  },
  progressFill: {
    height: "100%",
    borderRadius: 999,
    backgroundColor: colors.accent,
  },
});
