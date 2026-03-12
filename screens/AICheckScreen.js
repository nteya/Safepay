// screens/AICheckScreen.js
import React, { useRef, useState, useEffect } from "react";
import {
  View, Text, StyleSheet, StatusBar, TouchableOpacity, TextInput,
  FlatList, KeyboardAvoidingView, Platform, ActivityIndicator, Alert, Linking, Image
} from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { Ionicons, MaterialCommunityIcons, Feather } from "@expo/vector-icons";
import { SafeAreaView, useSafeAreaInsets } from "react-native-safe-area-context";
import AsyncStorage from "@react-native-async-storage/async-storage";
import * as ImagePicker from "expo-image-picker";
import * as ImageManipulator from "expo-image-manipulator";

const colors = {
  bg: "#0B0B0F",
  card: "#111218",
  text: "#EAEAF0",
  subtext: "#9BA0AE",
  accent: "#5FE1B9",
  accent2: "#8AB6FF",
  danger: "#FF6B6B",
  warning: "#FFD166",
  success: "#4CD964",
  stroke: "rgba(255,255,255,0.06)",
};

const QUICK_TEMPLATES = [
  "Is this website legit to buy from?",
  "This seller wants EFT/crypto — safe?",
  "Got a refund SMS/email — real or scam?",
];

const isIOS = Platform.OS === "ios";
const API_BASE_URL = "https://us-central1-strings-e0f81.cloudfunctions.net/api";
const AI_CHECK_URL = `${API_BASE_URL}/ai-check`;

function randomId() {
  return "sess_" + Math.random().toString(36).slice(2) + Date.now().toString(36);
}
const extractUrls = (t = "") => (t.match(/https?:\/\/[^\s)]+/g) || []).slice(0, 3);

export default function AICheckScreen({ navigation }) {
  const insets = useSafeAreaInsets();

  const [messages, setMessages] = useState([
    {
      id: "m0",
      role: "ai",
      type: "ai",
      text:
        "Hi — I’m SafeScan. Describe your situation and I’ll help you assess the risk before you pay. Share what you’re buying, the amount, and what concerns you. You can also attach a screenshot.",
      ts: Date.now(),
    },
  ]);
  const [input, setInput] = useState("");
  const [sending, setSending] = useState(false);
  const listRef = useRef(null);
  const inputRef = useRef(null);
  const sessionRef = useRef(null);

  useEffect(() => {
    (async () => {
      try {
        const existing = await AsyncStorage.getItem("safepay_session");
        if (existing) sessionRef.current = existing;
        else {
          const id = randomId();
          await AsyncStorage.setItem("safepay_session", id);
          sessionRef.current = id;
        }
      } catch {
        sessionRef.current = randomId();
      }
    })();
  }, []);

  const canSend = !sending && input.trim().length > 0;
  const scrollToEnd = () =>
    requestAnimationFrame(() => listRef.current?.scrollToEnd({ animated: true }));

  async function analyzeServerSide(payload) {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 25000);
    try {
      const r = await fetch(AI_CHECK_URL, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
        signal: controller.signal,
      });
      if (!r.ok) throw new Error(`Server responded ${r.status}`);
      return await r.json();
    } finally {
      clearTimeout(timeout);
    }
  }

  const pushAI = (text) => {
    setMessages((m) => [
      ...m,
      {
        id: `a_${Date.now()}`,
        role: "ai",
        type: "ai",
        text,
        result: { urls: extractUrls(text) },
        ts: Date.now(),
      },
    ]);
  };

  const onSend = async () => {
    if (!canSend) return;

    const userMsg = {
      id: `u_${Date.now()}`,
      role: "user",
      type: "text",
      text: input.trim(),
      ts: Date.now(),
    };
    setMessages((m) => [...m, userMsg]);
    setInput("");
    setTimeout(scrollToEnd, 50);

    setSending(true);
    try {
      const resp = await analyzeServerSide({
        text: userMsg.text,
        sessionId: sessionRef.current,
      });
      const msg = resp?.message || "I’m here to help. Tell me more about what seems off.";
      pushAI(msg);
    } catch (err) {
      pushAI(
        "I couldn’t reach the servers. Share the key details (item, price, how they want you to pay) and I’ll try again."
      );
    } finally {
      setSending(false);
      setTimeout(scrollToEnd, 60);
    }
  };

  // ---------- Image helper ----------
  async function pickAndSendImage() {
    try {
      const perm = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (perm.status !== "granted") {
        Alert.alert("Permission needed", "Please allow photo access to attach screenshots.");
        return;
      }
      const res = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        quality: 0.8,
        base64: false,
      });
      if (res.canceled) return;

      const asset = res.assets[0];
      // Downscale to max 1600px and convert to JPEG base64
      const manipulated = await ImageManipulator.manipulateAsync(
        asset.uri,
        [{ resize: { width: Math.min(asset.width || 1600, 1600) } }],
        { compress: 0.8, format: ImageManipulator.SaveFormat.JPEG, base64: true }
      );

      const fileMsg = {
        id: `f_${Date.now()}`,
        role: "user",
        type: "file-image",
        text: "Attached image",
        previewUri: `data:image/jpeg;base64,${manipulated.base64}`,
        ts: Date.now(),
      };
      setMessages((m) => [...m, fileMsg]);
      setTimeout(scrollToEnd, 30);

      setSending(true);
      const resp = await analyzeServerSide({
        sessionId: sessionRef.current,
        file: {
          kind: "image",
          mime: "image/jpeg",
          base64: manipulated.base64,
        },
      });
      pushAI(resp?.message || "I read the screenshot. Share more details if needed.");
    } catch (e) {
      Alert.alert("Error", "Could not process image. Try another file or take a clearer screenshot.");
    } finally {
      setSending(false);
      setTimeout(scrollToEnd, 60);
    }
  }

  const Header = () => (
    <View style={[styles.header, { paddingTop: Math.max(0, insets.top * 0.2) }]}>
      <TouchableOpacity style={styles.hBtn} onPress={() => navigation.goBack()}>
        <Ionicons name="chevron-back" size={22} color={colors.text} />
      </TouchableOpacity>
      <View style={{ flex: 1, alignItems: "center" }}>
        <Text style={styles.hTitle}>SafeScan AI</Text>
        <Text style={styles.hSub}>Payment & Scam Safety</Text>
      </View>
      <View style={styles.hBtn} />
    </View>
  );

  const AICard = ({ item }) => {
    const urls = item.result?.urls ?? [];
    const hasBullets = /^(\s*(•|-|—|\d+\.)\s+.+\n?)+/m.test(item.text);
    const bulletLines = hasBullets
      ? item.text
          .split("\n")
          .map((line) => {
            const m = line.match(/^\s*(•|-|—|\d+\.)\s+(.+)$/);
            return m ? m[2] : null;
          })
          .filter(Boolean)
      : [];

    return (
      <View style={[styles.row, { justifyContent: "flex-start" }]}>
        <View style={styles.aiAvatar}>
          <MaterialCommunityIcons name="shield-search" size={18} color={colors.accent} />
        </View>
        <LinearGradient colors={["#0E231B", "#0A0F10"]} style={[styles.aiBubble, styles.shadowLg]}>
          <View style={styles.scoreRow}>
            <View
              style={[
                styles.levelPill,
                { borderColor: colors.success, backgroundColor: "rgba(95,225,185,0.08)" },
              ]}
            >
              <Feather name="check-circle" size={12} color={colors.accent} />
              <Text style={[styles.levelText, { color: colors.accent }]}>GUIDANCE</Text>
            </View>
          </View>

          {hasBullets
            ? bulletLines.map((ln, idx) => (
                <Text key={idx} style={styles.reasonText}>
                  • {ln}
                </Text>
              ))
            : <Text style={styles.aiAdvice}>{item.text}</Text>}

          {!!urls.length && (
            <View style={styles.linkRow}>
              {urls.map((u, i) => (
                <Text
                  key={i}
                  style={styles.urlText}
                  numberOfLines={1}
                  onPress={() => Linking.openURL(u)}
                >
                  {u}
                </Text>
              ))}
            </View>
          )}

          <Text style={styles.disclaimer}>
            I’ll only request links or screenshots when they materially help the assessment.
          </Text>
        </LinearGradient>
      </View>
    );
  };

  const renderMessage = ({ item }) => {
    if (item.role === "ai") return <AICard item={item} />;
    if (item.type === "file-image") {
      return (
        <View style={[styles.row, { justifyContent: "flex-end" }]}>
          <View style={[styles.userBubble, styles.shadowMd]}>
            <Text style={[styles.msgText, { marginBottom: 6 }]}>Image attached</Text>
            <Image source={{ uri: item.previewUri }} style={{ width: 160, height: 90, borderRadius: 8 }} />
          </View>
        </View>
      );
    }
    return (
      <View style={[styles.row, { justifyContent: "flex-end" }]}>
        <View style={[styles.userBubble, styles.shadowMd]}>
          <Text style={styles.msgText}>{item.text}</Text>
        </View>
      </View>
    );
  };

  const ListFooter = (
    <View style={{ paddingTop: 8 }}>
      <View style={[styles.quickRow, { paddingBottom: 8 }]}>
        {QUICK_TEMPLATES.map((t) => (
          <TouchableOpacity
            key={t}
            style={styles.quickChip}
            onPress={() => {
              setInput(t);
              setTimeout(scrollToEnd, 40);
              inputRef.current?.focus();
            }}
          >
            <Text style={styles.quickText}>{t}</Text>
          </TouchableOpacity>
        ))}
      </View>
      <View style={{ height: 8 }} />
    </View>
  );

  const inputBar = (
    <View
      style={[
        styles.inputBar,
        { paddingBottom: isIOS ? Math.max(18, insets.bottom + 10) : Math.max(12, insets.bottom + 8) },
      ]}
    >
      {/* Image picker only */}
      <TouchableOpacity style={styles.iconBtn} onPress={pickAndSendImage}>
        <Ionicons name="image-outline" size={20} color={colors.accent} />
      </TouchableOpacity>

      <TextInput
        ref={inputRef}
        value={input}
        onChangeText={setInput}
        placeholder="Describe the situation (what, price, what feels off)…"
        placeholderTextColor={colors.subtext}
        style={styles.textInput}
        multiline
        textAlignVertical="top"
        editable={!sending}
        onFocus={() => setTimeout(scrollToEnd, 80)}
      />
      <TouchableOpacity
        onPress={onSend}
        activeOpacity={canSend ? 0.85 : 1}
        style={[styles.sendBtn, (!canSend || sending) && { opacity: 0.4 }]}
      >
        {sending ? (
          <ActivityIndicator size="small" color={colors.accent} />
        ) : (
          <Ionicons name="arrow-up-circle" size={28} color={colors.accent} />
        )}
      </TouchableOpacity>
    </View>
  );

  const bottomSpacerHeight = Math.max(0, insets.bottom - 6);

  return (
    <SafeAreaView style={styles.container} edges={["top", "bottom"]}>
      <StatusBar translucent={false} barStyle="light-content" backgroundColor={colors.bg} />
      <LinearGradient colors={[colors.bg, "#0F1426"]} style={StyleSheet.absoluteFill} />

      <Header />

      <KeyboardAvoidingView
        style={{ flex: 1 }}
        enabled={isIOS}
        behavior={isIOS ? "padding" : undefined}
        keyboardVerticalOffset={0}
      >
        <FlatList
          ref={listRef}
          data={messages}
          keyExtractor={(it) => it.id}
          renderItem={renderMessage}
          style={{ flex: 1 }}
          contentContainerStyle={{ paddingHorizontal: 14, paddingTop: 8, paddingBottom: 12 }}
          ListFooterComponent={ListFooter}
          showsVerticalScrollIndicator={false}
          onContentSizeChange={scrollToEnd}
          keyboardDismissMode={isIOS ? "interactive" : "on-drag"}
          keyboardShouldPersistTaps="handled"
          scrollEventThrottle={16}
        />

        {inputBar}

        <View style={{ height: bottomSpacerHeight }} />
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const RADIUS = 16;

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.bg },

  header: {
    height: 56,
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 12,
  },
  hBtn: { width: 40, height: 40, alignItems: "center", justifyContent: "center" },
  hTitle: { color: colors.text, fontWeight: "800", fontSize: 16, letterSpacing: 0.3 },
  hSub: { color: colors.subtext, fontSize: 11, marginTop: 2 },

  row: { flexDirection: "row", alignItems: "flex-end", marginBottom: 10 },
  aiAvatar: {
    width: 28,
    height: 28,
    borderRadius: 999,
    backgroundColor: "#0E151E",
    alignItems: "center",
    justifyContent: "center",
    marginRight: 8,
    borderWidth: 1,
    borderColor: colors.stroke,
  },

  userBubble: {
    backgroundColor: colors.card,
    borderWidth: 1,
    borderColor: colors.stroke,
    maxWidth: "78%",
    padding: 10,
    borderRadius: RADIUS,
  },

  msgText: { color: colors.text, fontSize: 14, lineHeight: 19 },

  aiBubble: {
    flex: 1,
    padding: 12,
    borderRadius: RADIUS,
    borderWidth: 1,
    borderColor: colors.stroke,
  },
  scoreRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    marginBottom: 8,
  },
  levelPill: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    borderWidth: 1,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 999,
  },
  levelText: { fontSize: 11, fontWeight: "800" },

  reasonText: { color: colors.subtext, fontSize: 12, marginBottom: 2 },
  linkRow: { marginBottom: 6, gap: 6 },
  urlText: { color: colors.accent2, fontSize: 12, textDecorationLine: "underline" },
  aiAdvice: { color: colors.text, fontSize: 14, lineHeight: 19, marginTop: 4 },
  disclaimer: { color: colors.subtext, fontSize: 10.5, marginTop: 8 },

  inputBar: {
    flexDirection: "row",
    alignItems: "flex-end",
    backgroundColor: "#0E1118",
    borderTopWidth: 1,
    borderTopColor: colors.stroke,
    paddingHorizontal: 10,
    paddingTop: 8,
  },
  iconBtn: {
    width: 36,
    height: 36,
    borderRadius: 10,
    alignItems: "center",
    justifyContent: "center",
    marginRight: 6,
    borderWidth: 1,
    borderColor: colors.stroke,
    backgroundColor: "#0D1016",
  },
  textInput: {
    flex: 1,
    color: colors.text,
    maxHeight: 120,
    paddingVertical: 8,
    paddingHorizontal: 10,
    backgroundColor: colors.card,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.stroke,
    fontSize: 14,
  },
  sendBtn: {
    marginLeft: 8,
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: "center",
    justifyContent: "center",
  },

  quickRow: {
    paddingHorizontal: 10,
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
  },
  quickChip: {
    backgroundColor: "#0E151E",
    borderWidth: 1,
    borderColor: colors.stroke,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 999,
  },
  quickText: { color: colors.subtext, fontSize: 12 },

  shadowMd: {
    shadowColor: "#000",
    shadowOpacity: 0.35,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 6 },
    elevation: 6,
  },
  shadowLg: {
    shadowColor: "#000",
    shadowOpacity: 0.45,
    shadowRadius: 16,
    shadowOffset: { width: 0, height: 10 },
    elevation: 10,
  },
});
