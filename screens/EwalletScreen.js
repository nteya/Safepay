// screens/EwalletScreen.js
import React, { useMemo, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  StatusBar,
  TextInput,
  TouchableOpacity,
  Alert,
  Switch,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
} from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { Ionicons } from "@expo/vector-icons";
import { SafeAreaView, useSafeAreaInsets } from "react-native-safe-area-context";

const colors = {
  bg: "#0B0B0F",
  card: "#111218",
  text: "#EAEAF0",
  subtext: "#9BA0AE",
  accent: "#5FE1B9",
  accent2: "#8AB6FF",
  danger: "#FF6B6B",
  warningBg: "rgba(255, 193, 7, 0.14)",
  warningBorder: "rgba(255, 193, 7, 0.45)",
  warningText: "#F3D27A",
};

// --- helpers ---
const formatPhonePretty = (raw) => {
  const digits = raw.replace(/\D/g, "").slice(0, 11);
  if (digits.length <= 3) return digits;
  if (digits.length <= 6) return `${digits.slice(0, 3)} ${digits.slice(3)}`;
  return `${digits.slice(0, 3)} ${digits.slice(3, 6)} ${digits.slice(6)}`;
};
const digitsOnly = (v) => v.replace(/\D/g, "");
const clampMoneyInput = (txt) => {
  let cleaned = txt.replace(/[^0-9.]/g, "");
  const parts = cleaned.split(".");
  if (parts.length > 2) cleaned = parts[0] + "." + parts.slice(1).join("");
  const [whole, dec = ""] = cleaned.split(".");
  const trimmedDec = dec.slice(0, 2);
  return dec.length ? `${whole}.${trimmedDec}` : whole;
};
const parseAmount = (txt) => {
  const n = parseFloat(txt);
  return isNaN(n) ? 0 : n;
};
const formatCurrency = (num) => {
  if (!num || num <= 0) return "";
  const s = num.toFixed(2);
  const [intPart, decPart] = s.split(".");
  // SAFE regex for thousands separators
  const withSep = intPart.replace(/\B(?=(\d{3})+(?!\d))/g, ",");
  return `R ${withSep}.${decPart}`;
};
const looksLikeSAPhone = (digits) => {
  if (!digits) return false;
  const d = digitsOnly(digits);
  return d.length === 10 || d.length === 11; // 0XXXXXXXXX or 27XXXXXXXXX
};
const genReference = () => {
  const tail = Date.now().toString().slice(-6);
  return `EW-${tail}`;
};

export default function EwalletScreen({ navigation }) {
  const insets = useSafeAreaInsets();

  // FROM (mocked default)
  const [fromAccount] = useState({
    bank: "FNB",
    name: "Demo Cheque Account",
    masked: "•••• 1234",
  });

  // TO (recipient)
  const [toName, setToName] = useState("");
  const [toSurname, setToSurname] = useState("");
  const [toPhone, setToPhone] = useState("");

  // amount
  const [amountRaw, setAmountRaw] = useState("");
  const [amountDisplay, setAmountDisplay] = useState("");
  const [amountFocused, setAmountFocused] = useState(false);

  // safepay toggle
  const [trackWithSafePay, setTrackWithSafePay] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  // banner
  const [showComingSoon, setShowComingSoon] = useState(true);

  // derived
  const numericAmount = useMemo(() => parseAmount(amountRaw), [amountRaw]);
  const toPhoneDigits = useMemo(() => digitsOnly(toPhone), [toPhone]);

  // validation
  const nameOk = toName.trim().length >= 2;
  const surnameOk = toSurname.trim().length >= 2;
  const phoneOk = looksLikeSAPhone(toPhoneDigits);
  const amtOk = numericAmount > 0;
  const isValid = nameOk && surnameOk && phoneOk && amtOk;

  const onAmountFocus = () => {
    setAmountFocused(true);
    setAmountDisplay("");
  };
  const onAmountBlur = () => {
    setAmountFocused(false);
    setAmountDisplay(formatCurrency(numericAmount));
  };

  const onExplainBeta = () => {
    Alert.alert(
      "eWallet (Beta)",
      "Full bank-side automation is coming soon. You can still test today:\n\n• Create a demo eWallet with SafePay ON\n• It appears in Transactions\n• If anything looks suspicious, open it and tap “Report to FNB”\n\nWe never ask for PIN/OTP and we don’t store camera footage."
    );
  };

  const onPayNow = async () => {
    if (!isValid || submitting) return;

    const ref = genReference();
    const prettyAmt = formatCurrency(numericAmount);
    const prettyPhone = toPhone || "—";

    Alert.alert(
      "Confirm eWallet Payment",
      `From: ${fromAccount.name} ${fromAccount.masked}\nTo: ${toName.trim()} ${toSurname.trim()}\nCell: ${prettyPhone}\nAmount: ${prettyAmt}\nSafePay: ${trackWithSafePay ? "ON" : "OFF"}`,
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Pay Now",
          onPress: async () => {
            try {
              setSubmitting(true);

              Alert.alert(
                "SafePay Window",
                "This payment is captured with a short time window for ATM matching. If anything seems off, open the transaction and tap ‘Report to FNB’. The bank handles CCTV and investigation."
              );

              navigation.navigate("Transactions", {
                lastTx: {
                  bank: "FNB",
                  amount: numericAmount,
                  reference: ref,
                  phone: toPhoneDigits || null,
                  trackWithSafePay,
                  windowMins: 10,
                  backendInit: false, // demo only
                  recipientName: `${toName.trim()} ${toSurname.trim()}`,
                  fromMasked: `${fromAccount.name} ${fromAccount.masked}`,
                },
              });
            } finally {
              setSubmitting(false);
            }
          },
        },
      ]
    );
  };

  return (
    <KeyboardAvoidingView
      style={{ flex: 1, backgroundColor: colors.bg }}
      behavior={Platform.OS === "ios" ? "padding" : undefined}
    >
      <StatusBar barStyle="light-content" backgroundColor={colors.bg} />
      <LinearGradient colors={[colors.bg, "#0C1120"]} style={StyleSheet.absoluteFill} />

      {/* Top safe area */}
      <SafeAreaView edges={["top"]} style={{ backgroundColor: "transparent" }}>
        {/* Header bar */}
        <View style={[styles.header, { paddingTop: Math.max(insets.top ? 0 : 0, 0) }]}>
          <TouchableOpacity
            onPress={() => navigation.goBack()}
            style={styles.backBtn}
            hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
            disabled={submitting}
          >
            <Ionicons name="chevron-back" size={22} color={colors.text} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>New eWallet</Text>
          <View style={{ width: 22 }} />
        </View>

        {/* Coming soon banner */}
        {showComingSoon && (
          <View style={styles.bannerWrap}>
            <View style={styles.banner}>
              <View style={{ flexDirection: "row", alignItems: "center" }}>
                <View style={styles.badge}>
                  <Text style={styles.badgeText}>COMING SOON</Text>
                </View>
                <Text style={styles.bannerText}>
                  eWallet automation is coming soon — but you can test it today.
                </Text>
              </View>

              <View style={styles.bannerActions}>
                <TouchableOpacity onPress={onExplainBeta} style={styles.bannerBtn}>
                  <Text style={styles.bannerBtnText}>Learn more</Text>
                </TouchableOpacity>
                <TouchableOpacity onPress={() => setShowComingSoon(false)} style={styles.bannerDismiss}>
                  <Ionicons name="close" size={16} color={colors.subtext} />
                </TouchableOpacity>
              </View>
            </View>
          </View>
        )}
      </SafeAreaView>

      <ScrollView
        contentContainerStyle={{ paddingBottom: 40 }}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        {/* FROM account (readonly demo) */}
        <View style={[styles.card, { paddingVertical: 12 }]}>
          <View style={styles.bankBadge}>
            <Ionicons name="wallet-outline" size={16} color="#0B0B0F" />
            <Text style={styles.bankBadgeText}>From Account</Text>
          </View>
          <Text style={styles.infoNote}>
            {fromAccount.bank} • {fromAccount.name} • {fromAccount.masked}
          </Text>
        </View>

        {/* TO (recipient) */}
        <View style={styles.card}>
          <Text style={styles.labelStrong}>To (Recipient)</Text>

          <Text style={styles.label}>Name *</Text>
          <TextInput
            value={toName}
            onChangeText={setToName}
            placeholder="e.g., Nomsa"
            placeholderTextColor="#6E7483"
            style={[styles.input, !nameOk && toName.length > 0 && styles.inputWarn]}
            editable={!submitting}
            returnKeyType="next"
          />

        <Text style={styles.label}>Surname *</Text>
          <TextInput
            value={toSurname}
            onChangeText={setToSurname}
            placeholder="e.g., Dlamini"
            placeholderTextColor="#6E7483"
            style={[styles.input, !surnameOk && toSurname.length > 0 && styles.inputWarn]}
            editable={!submitting}
            returnKeyType="next"
          />

          <Text style={styles.label}>Cellphone Number *</Text>
          <TextInput
            value={toPhone}
            onChangeText={(t) => setToPhone(formatPhonePretty(t))}
            placeholder="e.g., 082 123 4567"
            placeholderTextColor="#6E7483"
            keyboardType="phone-pad"
            style={[styles.input, !!toPhone && !looksLikeSAPhone(toPhoneDigits) && styles.inputWarn]}
            editable={!submitting}
            returnKeyType="done"
          />
          {!!toPhone && !looksLikeSAPhone(toPhoneDigits) && (
            <Text style={{ color: colors.danger, fontSize: 12, marginTop: -6, marginBottom: 8 }}>
              Enter a 10-digit local (0XXXXXXXXX) or 11-digit 27XXXXXXXXX number.
            </Text>
          )}
        </View>

        {/* Amount */}
        <View style={styles.card}>
          <Text style={styles.labelStrong}>Amount *</Text>
          <TextInput
            value={amountFocused ? amountRaw : amountDisplay}
            onChangeText={(t) => setAmountRaw(clampMoneyInput(t))}
            onFocus={onAmountFocus}
            onBlur={onAmountBlur}
            placeholder="e.g., 500 or 500.50"
            placeholderTextColor="#6E7483"
            keyboardType="decimal-pad"
            style={[styles.input, !amtOk && styles.inputWarn]}
            inputMode="decimal"
            returnKeyType="next"
            editable={!submitting}
          />
        </View>

        {/* SafePay toggle card */}
        <View style={styles.card}>
          <View style={styles.row}>
            <View style={{ flex: 1 }}>
              <Text style={styles.labelStrong}>Track with SafePay</Text>
              <Text style={styles.mini}>
                SafePay adds a short “watch window” to your eWallet. If anything seems off, you can
                report it in one tap and the bank will use your details to find the matching ATM
                event. We never ask for PIN/OTP and we don’t store CCTV.
              </Text>
            </View>
            <Switch
              value={trackWithSafePay}
              onValueChange={setTrackWithSafePay}
              thumbColor={trackWithSafePay ? "#0A0D0E" : "#ccc"}
              trackColor={{ false: "#3a3d45", true: colors.accent }}
              disabled={submitting}
            />
          </View>
        </View>

        {/* CTA */}
        <TouchableOpacity
          style={[styles.sendBtn, (!isValid || submitting) && styles.sendBtnDisabled]}
          onPress={onPayNow}
          activeOpacity={0.9}
          disabled={!isValid || submitting}
        >
          {submitting ? <ActivityIndicator /> : <Text style={styles.sendText}>Pay Now</Text>}
        </TouchableOpacity>

        {/* Reassurance */}
        <View style={styles.footerNote}>
          <Ionicons name="lock-closed-outline" size={14} color={colors.subtext} />
          <Text style={styles.footerNoteText}>
            We never store PINs or OTPs. Camera footage remains with the bank. Your data is
            encrypted and access-controlled.
          </Text>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  header: {
    minHeight: 56,
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 12,
  },
  backBtn: {
    width: 40,
    height: 40,
    borderRadius: 10,
    alignItems: "center",
    justifyContent: "center",
  },
  headerTitle: { flex: 1, textAlign: "center", color: colors.text, fontSize: 17, fontWeight: "700" },

  bannerWrap: {
    paddingHorizontal: 16,
    paddingBottom: 8,
  },
  banner: {
    backgroundColor: colors.warningBg,
    borderColor: colors.warningBorder,
    borderWidth: 1,
    borderRadius: 14,
    paddingVertical: 10,
    paddingHorizontal: 12,
  },
  badge: {
    backgroundColor: "rgba(255,193,7,0.25)",
    borderColor: colors.warningBorder,
    borderWidth: 1,
    borderRadius: 999,
    paddingVertical: 4,
    paddingHorizontal: 8,
    marginRight: 8,
  },
  badgeText: { color: colors.warningText, fontSize: 11, fontWeight: "800", letterSpacing: 0.3 },
  bannerText: { color: colors.text, flex: 1, fontSize: 12.5 },
  bannerActions: {
    marginTop: 8,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  bannerBtn: {
    paddingVertical: 6,
    paddingHorizontal: 8,
  },
  bannerBtnText: { color: colors.subtext, textDecorationLine: "underline", fontSize: 12.5 },
  bannerDismiss: {
    padding: 6,
    borderRadius: 8,
  },

  card: {
    backgroundColor: colors.card,
    marginHorizontal: 16,
    marginTop: 14,
    borderRadius: 16,
    padding: 14,
    shadowColor: "#000",
    shadowOpacity: 0.25,
    shadowRadius: 14,
    elevation: 8,
  },

  bankBadge: {
    alignSelf: "flex-start",
    flexDirection: "row",
    gap: 6,
    backgroundColor: colors.accent,
    borderRadius: 999,
    paddingVertical: 6,
    paddingHorizontal: 10,
  },
  bankBadgeText: { color: "#0B0B0F", fontWeight: "800", fontSize: 12.5, letterSpacing: 0.2 },
  infoNote: { color: colors.subtext, fontSize: 12, marginTop: 8, lineHeight: 18 },

  label: { color: colors.subtext, marginBottom: 6, fontSize: 13 },
  labelStrong: { color: colors.text, fontSize: 15, fontWeight: "700", marginBottom: 6 },

  input: {
    backgroundColor: "#0F1218",
    color: colors.text,
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 12,
    fontSize: 14,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.06)",
  },
  inputWarn: { borderColor: "rgba(255, 107, 107, 0.55)" },

  row: { flexDirection: "row", alignItems: "center", gap: 12 },

  mini: { color: colors.subtext, fontSize: 12, marginTop: 4 },

  sendBtn: {
    marginTop: 18,
    marginHorizontal: 16,
    backgroundColor: colors.accent,
    borderRadius: 14,
    paddingVertical: 14,
    alignItems: "center",
    elevation: 8,
  },
  sendBtnDisabled: { backgroundColor: "#2A2F38" },
  sendText: { color: "#0B0B0F", fontWeight: "800", fontSize: 15 },

  footerNote: {
    marginTop: 12,
    marginHorizontal: 16,
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  footerNoteText: { color: colors.subtext, fontSize: 11, flex: 1 },
});

