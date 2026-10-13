import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  FlatList,
  Image,
  Pressable,
  ActivityIndicator,
  StyleSheet,
  useWindowDimensions,
} from 'react-native';

import { getEpisodes } from '../api';
import { colors, spacing, radius } from '../theme';

const GAP = spacing.sm;
const PADDING = spacing.lg;
const MIN_BUTTON_WIDTH = 56;

export default function DetailsScreen({ route, navigation }) {
  const { session, title, poster, synopsis } = route.params;
  const { width } = useWindowDimensions();

  const [episodes, setEpisodes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [reloadKey, setReloadKey] = useState(0);

  const numColumns = Math.max(4, Math.floor((width - PADDING * 2 + GAP) / (MIN_BUTTON_WIDTH + GAP)));
  const buttonWidth = (width - PADDING * 2 - GAP * (numColumns - 1)) / numColumns;

  useEffect(() => {
    const controller = new AbortController();
    setLoading(true);
    setError(null);

    getEpisodes(session, controller.signal)
      .then(setEpisodes)
      .catch((e) => {
        if (e.name !== 'AbortError') setError(e.message || 'Could not load episodes.');
      })
      .finally(() => {
        if (!controller.signal.aborted) setLoading(false);
      });

    return () => controller.abort();
  }, [session, reloadKey]);

  const header = (
    <View>
      <View style={styles.hero}>
        {poster ? (
          <Image source={{ uri: poster }} style={styles.poster} resizeMode="cover" />
        ) : (
          <View style={[styles.poster, { backgroundColor: colors.surfaceRaised }]} />
        )}
        <View style={styles.heroText}>
          <Text style={styles.title}>{title}</Text>
          {!loading && !error && (
            <Text style={styles.meta}>
              {episodes.length} {episodes.length === 1 ? 'episode' : 'episodes'}
            </Text>
          )}
        </View>
      </View>

      <Text style={styles.sectionTitle}>Synopsis</Text>
      <Text style={styles.synopsis}>
        {synopsis ? synopsis : 'No synopsis available for this title.'}
      </Text>

      <Text style={styles.sectionTitle}>Episodes</Text>
      {loading && <ActivityIndicator style={styles.spinner} size="large" color={colors.accent} />}
      {error && (
        <View style={styles.errorBox}>
          <Text style={styles.errorText}>{error}</Text>
          <Pressable style={styles.retry} onPress={() => setReloadKey((k) => k + 1)}>
            <Text style={styles.retryText}>Try again</Text>
          </Pressable>
        </View>
      )}
    </View>
  );

  return (
    <FlatList
      key={numColumns}
      data={episodes}
      keyExtractor={(item) => item.id}
      numColumns={numColumns}
      ListHeaderComponent={header}
      columnWrapperStyle={{ gap: GAP, paddingHorizontal: PADDING }}
      contentContainerStyle={styles.content}
      style={styles.container}
      renderItem={({ item }) => (
        <Pressable
          style={({ pressed }) => [
            styles.episodeButton,
            { width: buttonWidth },
            pressed && styles.episodePressed,
          ]}
          onPress={() =>
            navigation.navigate('Player', {
              episodeId: item.id,
              title,
              episodeNumber: item.number,
            })
          }
        >
          <Text style={styles.episodeText}>{item.number}</Text>
        </Pressable>
      )}
    />
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  content: { paddingBottom: spacing.xl * 2, rowGap: GAP },
  hero: { flexDirection: 'row', padding: PADDING, gap: spacing.lg },
  poster: { width: 120, height: 174, borderRadius: radius.md, backgroundColor: colors.surface },
  heroText: { flex: 1, justifyContent: 'flex-end' },
  title: { color: colors.text, fontSize: 22, fontWeight: '700', lineHeight: 28 },
  meta: { color: colors.muted, fontSize: 14, marginTop: spacing.xs },
  sectionTitle: {
    color: colors.text,
    fontSize: 17,
    fontWeight: '700',
    paddingHorizontal: PADDING,
    marginTop: spacing.sm,
    marginBottom: spacing.sm,
  },
  synopsis: {
    color: colors.muted,
    fontSize: 15,
    lineHeight: 23,
    paddingHorizontal: PADDING,
    marginBottom: spacing.lg,
  },
  spinner: { marginVertical: spacing.xl },
  errorBox: { paddingHorizontal: PADDING, paddingBottom: spacing.lg, alignItems: 'flex-start' },
  errorText: { color: colors.danger, fontSize: 15, marginBottom: spacing.md },
  retry: {
    backgroundColor: colors.surfaceRaised,
    borderRadius: radius.sm,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.sm,
  },
  retryText: { color: colors.text, fontWeight: '600' },
  episodeButton: {
    height: 48,
    borderRadius: radius.sm,
    backgroundColor: colors.surface,
    alignItems: 'center',
    justifyContent: 'center',
  },
  episodePressed: { backgroundColor: colors.accent },
  episodeText: { color: colors.text, fontSize: 15, fontWeight: '600' },
});
