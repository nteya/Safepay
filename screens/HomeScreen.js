// screens/HomeScreen.js
import React from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  StatusBar,
  Image,
  ScrollView,
  Dimensions,
} from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { Ionicons, MaterialCommunityIcons, Feather } from "@expo/vector-icons";

const { width } = Dimensions.get("window");

const colors = {
  bg: "#0B0B0F",
  card: "#111218",
  text: "#EAEAF0",
  subtext: "#9BA0AE",
  accent: "#5FE1B9",
  accent2: "#8AB6FF",
};

// ---- Slides (Intro → Problem → Insight → Solution → Flow → Why FNB) ----
const slides = [
  {
    title: "Introducing SafePay",
    body:
      "A smarter eWallet cash-out with a bank-grade evidence path. Built for privacy, built for FNB.",
    image: require("../assets/slide1.png"),
  },
  {
    title: "The Problem",
    body:
      "After ATM cash-out, it’s hard to prove which eWallet funded that withdrawal. Disputes stall and fraud wins.",
    image: require("../assets/slide2.png"),
  },
  {
    title: "Key Insight",
    body:
      "FNB already has ATM logs and CCTV. Sending reference + amount + a short time window enables precise matching.",
    image: require("../assets/slide3.png"),
  },
  {
    title: "SafePay Window",
    body:
      "At pay time we capture only what’s needed. No footage in-app. One-tap report forwards the signals to FNB.",
    image: require("../assets/slide4.png"),
  },
  {
    title: "How It Works",
    body:
      "Pay Now → short watch window → if suspicious, Report → FNB correlates to ATM & CCTV. Evidence stays with the bank.",
    image: require("../assets/slide5.png"),
  },
  {
    title: "Why FNB",
    body:
      "Faster resolutions, lower fraud losses, higher customer trust. Pilot-ready with a clear integration plan.",
    image: require("../assets/slide6.png"),
  },
];

export default function HomeScreen({ navigation }) {
  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor={colors.bg} />
      <LinearGradient colors={[colors.bg, "#0F1426"]} style={StyleSheet.absoluteFill} />

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 120 }}>
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.logo}>
            Safe<Text style={{ color: colors.accent }}>Pay</Text>
          </Text>
          <Text style={styles.tagline}>Send money with confidence.</Text>
          <Text style={styles.subTagline}>
            Every eWallet transaction is verified, timestamped, and protected — so you never lose
            trust in your payments.
          </Text>
        </View>

        {/* Feature Card 1 */}
        <View style={styles.featureCard}>
          <Image source={require("../assets/picture1.png")} style={styles.image} />
          <LinearGradient colors={["rgba(0,0,0,0.25)", "transparent"]} style={styles.overlay} />

          <View style={styles.textOverlayBottomRaised}>
            <Text style={styles.featureTitle}>Smart eWallet Tracking</Text>
            <View style={styles.textPanelSmall}>
              <Text style={styles.featureDesc}>
                SafePay automatically records each withdrawal event, linking it to time and location
                data — protecting both sender and receiver.
              </Text>
            </View>
          </View>

          {/* LEFT: AI Check */}
          <TouchableOpacity
            activeOpacity={0.9}
            onPress={() => navigation.navigate("AICheck")}
            style={styles.aiFab}
          >
            <LinearGradient
              colors={[colors.accent, colors.accent2]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={styles.fabInner}
            >
              <MaterialCommunityIcons name="shield-search" size={20} color="#0A0D0E" />
              <Text style={styles.fabText}>SafeScan AI</Text>
            </LinearGradient>
          </TouchableOpacity>

          {/* RIGHT: eWallet */}
          <TouchableOpacity
            activeOpacity={0.9}
            onPress={() => navigation.navigate("Ewallet")}
            style={styles.fab}
          >
            <LinearGradient
              colors={[colors.accent2, colors.accent]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={styles.fabInner}
            >
              <Ionicons name="cash-outline" size={22} color="#0A0D0E" />
              <Text style={styles.fabText}>eWallet</Text>
            </LinearGradient>
          </TouchableOpacity>
        </View>

        {/* Feature Card 2 */}
        <View style={styles.featureCard}>
          <Image source={require("../assets/picture2.png")} style={styles.image} />
          <LinearGradient colors={["rgba(0,0,0,0.25)", "transparent"]} style={styles.overlay} />
          <View style={styles.textOverlayBottom}>
            <Text style={styles.featureTitle}>Proof You Can Trust</Text>
            <Text style={styles.featureDesc}>
              View verified evidence of each transaction directly in your app. SafePay ensures every
              eWallet transaction has a digital fingerprint.
            </Text>
          </View>
        </View>

        {/* Security Card */}
        <View style={styles.securityCard}>
          <Text style={styles.securityTitle}>Your Safety. Your Control.</Text>
          <Text style={styles.securityBody}>
            All data is encrypted end-to-end and never shared. Only you can access your records.
            SafePay keeps your financial life private and secure.
          </Text>
        </View>

        {/* Trust badges */}
        <View style={styles.trustRow}>
          <View style={styles.trustItem}>
            <Ionicons name="lock-closed-outline" size={22} color={colors.accent} />
            <Text style={styles.trustTitle}>Encrypted</Text>
            <Text style={styles.trustSub}>End-to-end protection</Text>
          </View>
          <View style={styles.trustItem}>
            <MaterialCommunityIcons name="shield-check-outline" size={22} color={colors.accent} />
            <Text style={styles.trustTitle}>Verified</Text>
            <Text style={styles.trustSub}>Timestamped evidence</Text>
          </View>
          <View style={styles.trustItem}>
            <Feather name="eye-off" size={22} color={colors.accent} />
            <Text style={styles.trustTitle}>Private</Text>
            <Text style={styles.trustSub}>Only you can view</Text>
          </View>
        </View>

        {/* CTA */}
        <TouchableOpacity style={styles.btn} onPress={() => navigation.navigate("Transactions")}>
          <Text style={styles.btnText}>View My Transactions</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={{ alignItems: "center", marginTop: 14 }}
          onPress={() => navigation.navigate("Evidence", { txid: "TX-EXAMPLE" })}
        >
          <Text style={styles.linkText}>View Sample Evidence</Text>
        </TouchableOpacity>

        {/* ---- Pitch Slides ---- */}
        <View style={styles.carouselWrap}>
          <ScrollView
            horizontal
            pagingEnabled
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={{ alignItems: "stretch" }}
          >
            {slides.map((s, idx) => (
              <View key={idx} style={[styles.slide, { width }]}>
                <View style={styles.slideCard}>
                  <Image source={s.image} style={styles.slideImage} />
                  <View style={styles.slideBody}>
                    <View style={styles.slideTitleRow}>
                      <Text style={styles.slideTitle}>{s.title}</Text>
                      <Ionicons
                        name="chevron-forward-outline"
                        size={18}
                        color={colors.accent2}
                        style={{ opacity: 0.7 }}
                      />
                    </View>
                    <Text style={styles.slideText}>{s.body}</Text>
                  </View>
                </View>
              </View>
            ))}
          </ScrollView>
        </View>
        {/* ---- end slides ---- */}
      </ScrollView>
    </View>
  );
}

const RADIUS = 18;

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.bg },

  header: { alignItems: "center", paddingTop: 60, paddingHorizontal: 24, marginBottom: 20 },
  logo: { color: colors.text, fontSize: 32, fontWeight: "800" },
  tagline: { color: colors.accent, fontSize: 18, marginTop: 8, fontWeight: "700", textAlign: "center" },
  subTagline: { color: colors.subtext, fontSize: 14, textAlign: "center", marginTop: 6, lineHeight: 20 },

  featureCard: {
    width: width - 32,
    height: 230,
    borderRadius: RADIUS,
    marginHorizontal: 16,
    marginBottom: 24,
    overflow: "hidden",
    backgroundColor: colors.card,
    elevation: 8,
    shadowColor: "#000",
    shadowOpacity: 0.4,
    shadowRadius: 12,
    position: "relative",
  },
  image: { width: "100%", height: "100%", resizeMode: "cover" },
  overlay: { ...StyleSheet.absoluteFillObject, borderRadius: RADIUS },

  // Bottom overlays
  textOverlayBottom: { position: "absolute", bottom: 16, left: 14, right: 14 },
  textOverlayBottomRaised: { position: "absolute", bottom: 72, left: 14, right: 14 },

  featureTitle: { color: colors.text, fontSize: 18, fontWeight: "700", marginBottom: 6 },

  textPanelSmall: {
    borderRadius: 12,
    paddingVertical: 10,
    paddingHorizontal: 10,
    backgroundColor: "rgba(5, 7, 10, 0.66)",
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.06)",
  },
  featureDesc: { color: colors.subtext, fontSize: 13, lineHeight: 18 },

  aiFab: { position: "absolute", left: 14, bottom: 10 },
  fab: { position: "absolute", right: 14, bottom: 10 },
  fabInner: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 999,
    shadowColor: colors.accent,
    shadowOpacity: 0.45,
    shadowRadius: 14,
    shadowOffset: { width: 0, height: 6 },
    elevation: 12,
  },
  fabText: { color: "#0A0D0E", fontWeight: "800" },

  securityCard: { backgroundColor: colors.card, marginHorizontal: 16, borderRadius: RADIUS, padding: 20, marginTop: 6 },
  securityTitle: { color: colors.text, fontWeight: "700", fontSize: 17, marginBottom: 8 },
  securityBody: { color: colors.subtext, fontSize: 13.5, lineHeight: 20 },

  trustRow: {
    marginTop: 18,
    marginHorizontal: 16,
    backgroundColor: "#0F1218",
    borderRadius: RADIUS,
    paddingVertical: 12,
    paddingHorizontal: 12,
    flexDirection: "row",
    justifyContent: "space-between",
  },
  trustItem: { width: (width - 32 - 24) / 3, alignItems: "center" },
  trustTitle: { color: colors.text, fontSize: 12.5, fontWeight: "700", marginTop: 6 },
  trustSub: { color: colors.subtext, fontSize: 11, textAlign: "center", marginTop: 2 },

  btn: {
    marginTop: 26,
    marginHorizontal: 16,
    backgroundColor: colors.accent,
    borderRadius: 14,
    paddingVertical: 14,
    alignItems: "center",
    elevation: 8,
  },
  btnText: { color: "#0B0B0F", fontWeight: "800", fontSize: 15 },
  linkText: { color: colors.accent2, fontSize: 14, fontWeight: "600" },

  // ---- Slides styles ----
  carouselWrap: { marginTop: 26 },
  slide: { alignItems: "center" },
  slideCard: {
    width: width - 32,
    backgroundColor: colors.card,
    borderRadius: RADIUS,
    overflow: "hidden",
    elevation: 8,
    shadowColor: "#000",
    shadowOpacity: 0.35,
    shadowRadius: 12,
  },
  slideImage: { width: "100%", height: 170, resizeMode: "cover", backgroundColor: "#0E1118" },
  slideBody: { padding: 14, borderTopWidth: 1, borderTopColor: "rgba(255,255,255,0.06)" },
  slideTitleRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 6,
  },
  slideTitle: { color: colors.text, fontSize: 16, fontWeight: "800" },
  slideText: { color: colors.subtext, fontSize: 13.5, lineHeight: 19 },
});

