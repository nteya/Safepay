// screens/EvidenceScreen.js
import React from "react";
import { View, Text, StyleSheet, Image, TouchableOpacity } from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { Ionicons } from "@expo/vector-icons";

const colors = {
  bg: "#0B0B0F",
  text: "#EAEAF0",
  subtext: "#9BA0AE",
  accent: "#5FE1B9",
  accent2: "#8AB6FF",
};

export default function EvidenceScreen({ route, navigation }) {
  // Passed from TransactionsScreen: { clipUrl?, txId?, viewInstructions? }
  const clipUrl =
    route?.params?.clipUrl || "https://placehold.co/600x400?text=ATM+CCTV+Clip";
  const txId = route?.params?.txId || "—";
  const viewInstructions =
    route?.params?.viewInstructions ||
    "CCTV is securely held by the bank. If required, they’ll provide a way to view it (often at a branch) once a case is opened.";

  // In this demo we always show an image. If later you switch to video,
  // plug in an RN video component here.
  const hasRealClip =
    route?.params?.clipUrl && !route.params.clipUrl.includes("placehold.co");

  return (
    <View style={styles.container}>
      <LinearGradient colors={[colors.bg, "#0C1120"]} style={StyleSheet.absoluteFill} />

      <Text style={styles.title}>Transaction Evidence</Text>

      <Image source={{ uri: clipUrl }} style={styles.image} />

      <View style={styles.captionBlock}>
        <View style={styles.rowCenter}>
          <Ionicons name="shield-checkmark-outline" size={14} color={colors.accent} />
          <Text style={styles.captionTitle}>
            {hasRealClip ? "Matched CCTV Clip" : "Demo Evidence Preview"}
          </Text>
        </View>
        <Text style={styles.captionText}>
          {hasRealClip
            ? "This preview is matched to your transaction time window."
            : "This is a demo image to illustrate how a matched ATM clip would appear."}
        </Text>
      </View>

      <View style={styles.infoCard}>
        <View style={styles.row}>
          <Ionicons name="document-text-outline" size={14} color={colors.subtext} />
          <Text style={styles.infoKey}>Transaction</Text>
          <Text style={styles.infoVal}>{txId}</Text>
        </View>

        <View style={[styles.row, { marginTop: 8 }]}>
          <Ionicons name="lock-closed-outline" size={14} color={colors.subtext} />
          <Text style={styles.infoKey}>Access</Text>
          <Text style={styles.infoVal}>
            {viewInstructions}
          </Text>
        </View>
      </View>

      <TouchableOpacity style={styles.btn} onPress={() => navigation.goBack()}>
        <Text style={styles.btnText}>Back</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, alignItems: "center", justifyContent: "center", backgroundColor: colors.bg, paddingHorizontal: 16 },
  title: { color: colors.text, fontSize: 20, fontWeight: "700", marginBottom: 20, textAlign: "center" },
  image: { width: 320, height: 210, borderRadius: 12, marginBottom: 14 },
  captionBlock: {
    alignItems: "center",
    marginBottom: 16,
  },
  rowCenter: { flexDirection: "row", alignItems: "center", gap: 6 },
  captionTitle: { color: colors.text, fontWeight: "700", fontSize: 13.5 },
  captionText: { color: colors.subtext, fontSize: 12.5, textAlign: "center", marginTop: 6, paddingHorizontal: 8 },

  infoCard: {
    width: "100%",
    backgroundColor: "#111218",
    borderRadius: 12,
    padding: 12,
    marginBottom: 18,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.06)",
  },
  row: { flexDirection: "row", alignItems: "center", gap: 8 },
  infoKey: { color: colors.subtext, fontSize: 12.5, width: 90 },
  infoVal: { color: colors.text, fontSize: 12.5, flex: 1, lineHeight: 18 },

  btn: {
    backgroundColor: colors.accent,
    paddingHorizontal: 30,
    paddingVertical: 12,
    borderRadius: 14,
  },
  btnText: { color: "#0B0B0F", fontWeight: "800" },
});
