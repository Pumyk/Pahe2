import React, { useCallback, useEffect, useState } from 'react';
import {
  View,
  Text,
  Pressable,
  ActivityIndicator,
  ScrollView,
  StyleSheet,
} from 'react-native';
import { Video, ResizeMode } from 'expo-av';
import * as ScreenOrientation from 'expo-screen-orientation';
import { StatusBar } from 'expo-status-bar';

import { getSources } from '../api';
import { colors, spacing, radius } from '../theme';

export default function PlayerScreen({ route, navigation }) {
  const { episodeId, title, episodeNumber } = route.params;

  const [sources, setSources] = useState([]);
  const [selected, setSelected] = useState(0);
  const [loading, setLoading] = useState(true);
  const [buffering, setBuffering] = useState(true);
  const [error, setError] = useState(null);
  const [reloadKey, setReloadKey] = useState(0);

  // Landscape while watching, back to portrait on exit.
  useEffect(() => {
    ScreenOrientation.lockAsync(ScreenOrientation.OrientationLock.LANDSCAPE).catch(() => {});
    return () => {
      ScreenOrientation.lockAsync(ScreenOrientation.OrientationLock.PORTRAIT_UP).catch(() => {});
    };
  }, []);

  useEffect(() => {
    const controller = new AbortController();
    setLoading(true);
    setError(null);

    getSources(episodeId, controller.signal)
      .then((list) => {
        if (list.length === 0) throw new Error('No streams found for this episode.');
        setSources(list);
        setSelected(0);
      })
      .catch((e) => {
        if (e.name !== 'AbortError') setError(e.message || 'Could not load the stream.');
      })
      .finally(() => {
        if (!controller.signal.aborted) setLoading(false);
      });

    return () => controller.abort();
  }, [episodeId, reloadKey]);

  const onPlaybackStatusUpdate = useCallback((status) => {
    if (status.isLoaded) setBuffering(status.isBuffering);
  }, []);

  const current = sources[selected];

  return (
    <View style={styles.container}>
      <StatusBar hidden />

      {current && !error && (
        <Video
          key={current.url} // remount when switching quality
          style={StyleSheet.absoluteFill}
          source={{ uri: current.url }}
          useNativeControls
          resizeMode={ResizeMode.CONTAIN}
          shouldPlay
          onPlaybackStatusUpdate={onPlaybackStatusUpdate}
          onError={() => setError('This stream could not be played. Try another quality.')}
        />
      )}

      {(loading || (buffering && current && !error)) && (
        <View style={styles.center} pointerEvents="none">
          <ActivityIndicator size="large" color={colors.accent} />
        </View>
      )}

      {error && (
        <View style={styles.center}>
          <Text style={styles.errorText}>{error}</Text>
          <View style={styles.row}>
            <Pressable
              style={styles.button}
              onPress={() => {
                setError(null);
                setBuffering(true);
                setReloadKey((k) => k + 1);
              }}
            >
              <Text style={styles.buttonText}>Try again</Text>
            </Pressable>
            <Pressable style={styles.button} onPress={() => navigation.goBack()}>
              <Text style={styles.buttonText}>Go back</Text>
            </Pressable>
          </View>
        </View>
      )}

      {/* Top overlay: back button + title + quality picker */}
      <View style={styles.topBar} pointerEvents="box-none">
        <Pressable style={styles.back} onPress={() => navigation.goBack()} hitSlop={12}>
          <Text style={styles.backText}>Back</Text>
        </Pressable>
        <Text style={styles.topTitle} numberOfLines={1}>
          {title} · Episode {episodeNumber}
        </Text>
      </View>

      {sources.length > 1 && (
        <ScrollView
          horizontal
          style={styles.qualityBar}
          contentContainerStyle={styles.qualityContent}
          showsHorizontalScrollIndicator={false}
        >
          {sources.map((s, i) => (
            <Pressable
              key={`${s.url}-${i}`}
              style={[styles.chip, i === selected && styles.chipActive]}
              onPress={() => {
                setError(null);
                setBuffering(true);
                setSelected(i);
              }}
            >
              <Text style={[styles.chipText, i === selected && styles.chipTextActive]}>
                {s.label}
              </Text>
            </Pressable>
          ))}
        </ScrollView>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#000' },
  center: {
    ...StyleSheet.absoluteFillObject,
    alignItems: 'center',
    justifyContent: 'center',
    padding: spacing.xl,
  },
  errorText: { color: colors.text, fontSize: 16, textAlign: 'center', marginBottom: spacing.lg },
  row: { flexDirection: 'row', gap: spacing.md },
  button: {
    backgroundColor: colors.surfaceRaised,
    borderRadius: radius.sm,
    paddingHorizontal: spacing.xl,
    paddingVertical: spacing.md,
  },
  buttonText: { color: colors.text, fontWeight: '600' },
  topBar: {
    position: 'absolute',
    top: spacing.md,
    left: spacing.lg,
    right: spacing.lg,
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
  },
  back: {
    backgroundColor: 'rgba(22,19,31,0.75)',
    borderRadius: radius.sm,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
  },
  backText: { color: colors.text, fontWeight: '600' },
  topTitle: { flex: 1, color: colors.text, fontSize: 15, fontWeight: '600' },
  qualityBar: { position: 'absolute', top: 56, left: 0, right: 0, maxHeight: 44 },
  qualityContent: { paddingHorizontal: spacing.lg, gap: spacing.sm },
  chip: {
    backgroundColor: 'rgba(22,19,31,0.75)',
    borderRadius: 999,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs + 2,
  },
  chipActive: { backgroundColor: colors.accent },
  chipText: { color: colors.text, fontSize: 13, fontWeight: '600' },
  chipTextActive: { color: colors.accentText },
});
