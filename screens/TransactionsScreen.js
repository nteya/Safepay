// components/TransactionsScreen.js
import React, { useEffect, useRef, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  StatusBar,
  FlatList,
  TouchableOpacity,
  Alert,
} from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { Ionicons, MaterialCommunityIcons } from "@expo/vector-icons";
import AsyncStorage from "@react-native-async-storage/async-storage";

const STORAGE_KEY = "@safepay:transactions:v1";

const colors = {
  bg: "#0B0B0F",
  card: "#111218",
  text: "#EAEAF0",
  subtext: "#9BA0AE",
  accent: "#5FE1B9",
  accent2: "#8AB6FF",
  warning: "#FFD166",
  danger: "#FF6B6B",
  success: "#4CD964",
  disabled: "#39404F",
};

function formatCurrency(n) {
  if (!n || n <= 0) return "R 0.00";
  const s = Number(n).toFixed(2);
  const [i, d] = s.split(".");
  const withSep = i.replace(/\B(?=(\d{3})+(?!\d))/g, ",");
  return `R ${withSep}.${d}`;
}

function maskPhone(digits) {
  if (!digits) return "—";
  const d = String(digits).replace(/\D/g, "");
  if (d.length < 7) return d;
  return `${d.slice(0, 3)} ${d.slice(3, 6)} ${d.slice(6)}`;
}

function badgeStyle(status) {
  switch (status) {
    case "WITHDRAWN":
      return { bg: "rgba(76,217,100,0.15)", fg: colors.success, label: "Withdrawn" };
    case "REPORTED":
      return { bg: "rgba(255,107,107,0.15)", fg: colors.danger, label: "Reported" };
    case "EVIDENCE_READY":
      return { bg: "rgba(95,225,185,0.18)", fg: colors.accent, label: "Evidence Ready" };
    case "PENDING":
    default:
      return { bg: "rgba(138,182,255,0.18)", fg: colors.accent2, label: "Pending" };
  }
}

// Stable signature to dedupe
const buildSig = (tx) => `${tx.reference}|${Number(tx.amount)}|${tx.phone || ""}`;

export default function TransactionsScreen({ route, navigation }) {
  // lastTx includes: bank, amount, reference, phone, trackWithSafePay, windowMins,
  // plus demo extras: recipientName, fromMasked
  const incoming = route?.params?.lastTx;

  const [items, setItems] = useState([]);
  const [loaded, setLoaded] = useState(false); // <- gate insert until storage loaded
  const [reporting, setReporting] = useState({});
  const [syncing, setSyncing] = useState({});

  // ----- Persistence -----
  const loadItems = async () => {
    try {
      const raw = await AsyncStorage.getItem(STORAGE_KEY);
      if (!raw) return [];
      const parsed = JSON.parse(raw);
      return Array.isArray(parsed) ? parsed : [];
    } catch {
      return [];
    }
  };
  const saveItems = async (next) => {
    try {
      await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(next));
    } catch {}
  };

  // Load once
  useEffect(() => {
    (async () => {
      const cached = await loadItems();
      setItems(cached);
      setLoaded(true);
    })();
  }, []);

  // Save whenever items change (after load)
  useEffect(() => {
    if (!loaded) return;
    saveItems(items);
  }, [items, loaded]);

  // Upsert helper
  const upsertItem = (item) => {
    setItems((prev) => {
      const idx = prev.findIndex((x) => x.id === item.id);
      if (idx === -1) return [item, ...prev];
      const copy = [...prev];
      copy[idx] = { ...copy[idx], ...item };
      return copy;
    });
  };

  // Insert new record AFTER storage is loaded (fixes race)
  useEffect(() => {
    if (!loaded || !incoming) return;
    const sig = buildSig(incoming);
    const exists = items.some((x) => x.sig === sig);
    if (exists) return;

    const now = Date.now();
    const newItem = {
      id: `tx_${now}`,
      sig,
      bank: incoming.bank || "FNB",
      amount: incoming.amount,
      reference: incoming.reference,
      phone: incoming.phone || null,
      status: "PENDING",
      createdAt: now,
      windowMins: typeof incoming.windowMins === "number" ? incoming.windowMins : 10,
      trackWithSafePay: !!incoming.trackWithSafePay,
      // demo extras
      recipientName: incoming.recipientName || null,
      fromMasked: incoming.fromMasked || null,
      // case/evidence
      caseId: null,
      reportedAt: null,
      lastSyncedAt: null,
      evidence: null,
    };
    setItems((prev) => [newItem, ...prev]);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [incoming, loaded]); // only re-run when new params arrive and storage is ready

  // ----- Demo helpers -----
  const makeCaseId = (item) => {
    const last4 = (item?.reference || "").slice(-4).padStart(4, "0");
    const ts = Date.now().toString(36).toUpperCase();
    return `FNB-${last4}-${ts}`;
  };

  const onReport = (item) => {
    if (item.status === "REPORTED" || item.status === "EVIDENCE_READY") {
      Alert.alert("Already Reported", `Case ID: ${item.caseId || "N/A"}`);
      return;
    }
    Alert.alert(
      "Report to FNB",
      "We’ll open a case using your eWallet details so the bank can retrieve ATM footage in your time window. (Demo — offline)",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Report",
          style: "destructive",
          onPress: () => {
            setReporting((r) => ({ ...r, [item.id]: true }));
            const caseId = makeCaseId(item);
            const reportedAt = Date.now();
            upsertItem({ ...item, status: "REPORTED", caseId, reportedAt });
            setReporting((r) => ({ ...r, [item.id]: false }));
            Alert.alert("Reported", `Case opened with FNB (demo).\n\nCase ID: ${caseId}`);
          },
        },
      ]
    );
  };

  const onSync = async (item) => {
    setSyncing((s) => ({ ...s, [item.id]: true }));
    try {
      const now = Date.now();
      const ageMs = now - item.createdAt;
      const windowMs = item.windowMins * 60 * 1000;

      let newStatus = item.status;
      let evidence = item.evidence;

      if (item.status === "PENDING" && ageMs > windowMs) {
        newStatus = "WITHDRAWN";
        evidence = {
          ...(item.evidence || {}),
          clipUrl: "https://placehold.co/600x400?text=ATM+CCTV+Clip",
        };
      }

      upsertItem({ ...item, status: newStatus, evidence, lastSyncedAt: now });

      if (newStatus !== item.status) {
        Alert.alert("Status Updated", `This transaction is now ${newStatus}.`);
      } else {
        Alert.alert("Up to Date", "No changes available offline.");
      }
    } finally {
      setSyncing((s) => ({ ...s, [item.id]: false }));
    }
  };

  const renderItem = ({ item }) => {
    const b = badgeStyle(item.status);
    const isReporting = !!reporting[item.id];
    const isSyncing = !!syncing[item.id];
    const canReport = !isReporting && (item.status === "PENDING" || item.status === "WITHDRAWN");
    const hasClip = !!item?.evidence?.clipUrl;

    return (
      <View style={styles.card}>
        <View style={styles.rowBetween}>
          <View style={{ flexDirection: "row", alignItems: "center", gap: 8 }}>
            <MaterialCommunityIcons name="bank-outline" size={18} color={colors.subtext} />
            <Text style={styles.bank}>{item.bank || "FNB"}</Text>
          </View>
          <View style={[styles.badge, { backgroundColor: b.bg }]}>
            <Text style={{ color: b.fg, fontSize: 12, fontWeight: "700" }}>{b.label}</Text>
          </View>
        </View>

        <View style={styles.amountRow}>
          <Text style={styles.amount}>{formatCurrency(item.amount)}</Text>
        </View>

        <View style={styles.kvRow}>
          <Text style={styles.kKey}>Reference</Text>
          <Text style={styles.kVal}>{item.reference}</Text>
        </View>
        <View style={styles.kvRow}>
          <Text style={styles.kKey}>Recipient</Text>
          <Text style={styles.kVal}>
            {item.recipientName ? `${item.recipientName} • ${maskPhone(item.phone)}` : maskPhone(item.phone)}
          </Text>
        </View>
        {item.fromMasked && (
          <View style={styles.kvRow}>
            <Text style={styles.kKey}>From</Text>
            <Text style={styles.kVal}>{item.fromMasked}</Text>
          </View>
        )}

        <View style={styles.windowRow}>
          <Ionicons name="time-outline" size={14} color={colors.subtext} />
          <Text style={styles.windowText}>Matching window: created ± {item.windowMins} min</Text>
        </View>

        {item.status !== "PENDING" && !!item.caseId && (
          <View style={styles.reportMeta}>
            <Ionicons name="document-text-outline" size={14} color={colors.subtext} />
            <Text style={styles.reportMetaText}>
              Case ID: <Text style={{ color: colors.text, fontWeight: "700" }}>{item.caseId}</Text>
            </Text>
          </View>
        )}

        {!!item.lastSyncedAt && (
          <View style={styles.syncedRow}>
            <Ionicons name="cloud-done-outline" size={14} color={colors.subtext} />
            <Text style={styles.syncedText}>Last synced {new Date(item.lastSyncedAt).toLocaleString()}</Text>
          </View>
        )}

        <View style={styles.actionsRow}>
          <TouchableOpacity
            style={[styles.primaryBtn, !canReport && styles.primaryBtnDisabled]}
            onPress={() => canReport && onReport(item)}
            activeOpacity={canReport ? 0.8 : 1}
          >
            <Ionicons name="alert-circle-outline" size={16} color={canReport ? "#0B0B0F" : "#1B1F2A"} />
            <Text style={[styles.primaryBtnText, !canReport && styles.primaryBtnTextDisabled]}>
              {isReporting
                ? "Reporting…"
                : item.status === "REPORTED" || item.status === "EVIDENCE_READY"
                ? "Reported"
                : "Report to FNB"}
            </Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.ghostBtn} onPress={() => onSync(item)} activeOpacity={0.8}>
            <Ionicons name="refresh-outline" size={16} color={colors.accent} />
            <Text style={styles.ghostBtnText}>{isSyncing ? "Syncing…" : "Sync Status"}</Text>
          </TouchableOpacity>

          {hasClip && (
            <TouchableOpacity
              style={styles.ghostBtn}
              onPress={() => navigation.navigate("Evidence", { clipUrl: item.evidence.clipUrl, txId: item.id })}
              activeOpacity={0.8}
            >
              <Ionicons name="videocam-outline" size={16} color={colors.accent2} />
              <Text style={[styles.ghostBtnText, { color: colors.accent2 }]}>View Evidence</Text>
            </TouchableOpacity>
          )}
        </View>
      </View>
    );
  };

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor={colors.bg} />
      <LinearGradient colors={[colors.bg, "#0C1120"]} style={StyleSheet.absoluteFill} />

      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
          <Ionicons name="chevron-back" size={22} color={colors.text} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Transactions</Text>
        <View style={{ width: 22 }} />
      </View>

      {items.length === 0 ? (
        <View style={styles.empty}>
          <Ionicons name="file-tray-outline" size={28} color={colors.subtext} />
          <Text style={styles.emptyText}>No transactions yet.</Text>
          <Text style={styles.emptySub}>Use “Pay Now” to create an eWallet.</Text>
        </View>
      ) : (
        <FlatList
          data={items}
          keyExtractor={(it) => it.id}
          renderItem={renderItem}
          contentContainerStyle={{ padding: 16, paddingBottom: 24 }}
          ItemSeparatorComponent={() => <View style={{ height: 12 }} />}
          showsVerticalScrollIndicator={false}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.bg },
  header: {
    height: 56,
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
  headerTitle: {
    flex: 1,
    textAlign: "center",
    color: colors.text,
    fontSize: 17,
    fontWeight: "700",
  },

  card: {
    backgroundColor: colors.card,
    borderRadius: 16,
    padding: 14,
    shadowColor: "#000",
    shadowOpacity: 0.25,
    shadowRadius: 14,
    elevation: 8,
  },

  rowBetween: { flexDirection: "row", alignItems: "center", justifyContent: "space-between" },
  bank: { color: colors.subtext, fontSize: 13, fontWeight: "600" },
  badge: { paddingVertical: 6, paddingHorizontal: 10, borderRadius: 999 },

  amountRow: { marginTop: 6, marginBottom: 8 },
  amount: { color: colors.text, fontSize: 22, fontWeight: "800" },

  kvRow: { flexDirection: "row", justifyContent: "space-between", marginTop: 6 },
  kKey: { color: colors.subtext, fontSize: 12.5 },
  kVal: { color: colors.text, fontSize: 13.5, fontWeight: "700" },

  windowRow: { flexDirection: "row", alignItems: "center", gap: 6, marginTop: 10 },
  windowText: { color: colors.subtext, fontSize: 11.5 },

  reportMeta: { flexDirection: "row", alignItems: "center", gap: 6, marginTop: 8 },
  reportMetaText: { color: colors.subtext, fontSize: 12 },

  actionsRow: { flexDirection: "row", gap: 10, marginTop: 12, flexWrap: "wrap" },
  primaryBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    backgroundColor: colors.accent,
    borderRadius: 12,
    paddingVertical: 10,
    paddingHorizontal: 14,
  },
  primaryBtnDisabled: { backgroundColor: colors.disabled },
  primaryBtnText: { color: "#0B0B0F", fontWeight: "800", fontSize: 13 },
  primaryBtnTextDisabled: { color: "#1B1F2A" },

  ghostBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    borderRadius: 12,
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderWidth: 1,
    borderColor: "rgba(95, 225, 185, 0.35)",
  },
  ghostBtnText: { color: colors.accent, fontWeight: "700", fontSize: 13 },

  syncedRow: { flexDirection: "row", alignItems: "center", gap: 6, marginTop: 8 },
  syncedText: { color: colors.subtext, fontSize: 11.5 },

  empty: { flex: 1, alignItems: "center", justifyContent: "center", padding: 24 },
  emptyText: { color: colors.text, fontSize: 16, fontWeight: "700", marginTop: 10 },
  emptySub: { color: colors.subtext, fontSize: 13, marginTop: 4, textAlign: "center" },
});

