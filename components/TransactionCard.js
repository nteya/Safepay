// components/transectioncard.js
import React from "react";
import { TouchableOpacity, View, Text, StyleSheet } from "react-native";

const colors = { card: "#111218", text: "#EAEAF0", subtext: "#9BA0AE", accent: "#5FE1B9" };

export default function TransectionCard({ txid, amount, time, onPress }) {
  return (
    <TouchableOpacity onPress={onPress} style={styles.card} activeOpacity={0.85}>
      <View style={{ flex: 1 }}>
        <Text style={styles.txid}>{txid}</Text>
        <Text style={styles.sub}>{time}</Text>
      </View>
      <Text style={styles.amount}>{amount}</Text>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  card: { backgroundColor: colors.card, borderRadius: 14, padding: 16, marginBottom: 12, flexDirection: "row", alignItems: "center" },
  txid: { color: colors.text, fontWeight: "700" },
  sub: { color: colors.subtext, marginTop: 2, fontSize: 12 },
  amount: { color: colors.accent, fontWeight: "800" },
});
