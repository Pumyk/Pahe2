import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  TextInput,
  FlatList,
  Image,
  Pressable,
  ActivityIndicator,
  StyleSheet,
  useWindowDimensions,
} from 'react-native';

import { searchAnime } from '../api';
import { colors, spacing, radius } from '../theme';

const GAP = spacing.md;
const MIN_CARD_WIDTH = 140;

export default function HomeScreen({ navigation }) {
  const { width } = useWindowDimensions();
  const [query, setQuery] = useState('');
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // Responsive grid: as many columns as fit at the minimum card width.
  const numColumns = Math.max(2, Math.floor((width - GAP) / (MIN_CARD_WIDTH + GAP)));
  const cardWidth = (width - GAP * (numColumns + 1)) / numColumns;

  // Debounced search; cancels in-flight requests when the query changes.
  useEffect(() => {
    const trimmed = query.trim();
    if (trimmed.length < 2) {
      setResults([]);
      setError(null);
      setLoading(false);
      return;
    }

    const controller = new AbortController();
    const timer = setTimeout(async () => {
      setLoading(true);
      setError(null);
      try {
        const data = await searchAnime(trimmed, controller.signal);
        setResults(data);
      } catch (e) {
        if (e.name !== 'AbortError') {
          setResults([]);
          setError(e.message || 'Something went wrong.');
        }
      } finally {
        if (!controller.signal.aborted) setLoading(false);
      }
    }, 400);

    return () => {
      clearTimeout(timer);
      controller.abort();
    };
  }, [query]);

  const renderItem = ({ item }) => (
    <Pressable
      style={({ pressed }) => [
        styles.card,
        { width: cardWidth },
        pressed && styles.cardPressed,
      ]}
      onPress={() =>
        navigation.navigate('Details', {
          session: item.session,
          title: item.title,
          poster: item.poster,
          synopsis: item.synopsis,
        })
      }
    >
      {item.poster ? (
        <Image
          source={{ uri: item.poster }}
          style={[styles.poster, { width: cardWidth, height: cardWidth * 1.45 }]}
          resizeMode="cover"
        />
      ) : (
        <View
          style={[styles.poster, styles.posterFallback, { width: cardWidth, height: cardWidth * 1.45 }]}
        />
      )}
      <Text style={styles.cardTitle} numberOfLines={2}>
        {item.title}
      </Text>
    </Pressable>
  );

  const renderEmpty = () => {
    if (loading) return null;
    let message = 'Search for an anime by title.';
    if (error) message = `${error}\nCheck that the server is running and reachable.`;
    else if (query.trim().length >= 2) message = `No results for “${query.trim()}”.`;
    return (
      <View style={styles.empty}>
        <Text style={[styles.emptyText, error && { color: colors.danger }]}>{message}</Text>
      </View>
    );
  };

  return (
    <View style={styles.container}>
      <View style={styles.searchWrap}>
        <TextInput
          style={styles.input}
          value={query}
          onChangeText={setQuery}
          placeholder="Search anime"
          placeholderTextColor={colors.muted}
          returnKeyType="search"
          autoCapitalize="none"
          autoCorrect={false}
          clearButtonMode="while-editing"
        />
      </View>

      {loading && (
        <View style={styles.spinner}>
          <ActivityIndicator size="large" color={colors.accent} />
        </View>
      )}

      <FlatList
        key={numColumns} // FlatList needs a new key when numColumns changes
        data={results}
        keyExtractor={(item) => item.session}
        renderItem={renderItem}
        numColumns={numColumns}
        columnWrapperStyle={{ gap: GAP, paddingHorizontal: GAP }}
        contentContainerStyle={styles.listContent}
        ListEmptyComponent={renderEmpty}
        keyboardShouldPersistTaps="handled"
        keyboardDismissMode="on-drag"
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  searchWrap: { padding: GAP },
  input: {
    backgroundColor: colors.surface,
    color: colors.text,
    borderRadius: radius.md,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    fontSize: 16,
  },
  spinner: { paddingVertical: spacing.lg },
  listContent: { paddingBottom: spacing.xl, rowGap: GAP, flexGrow: 1 },
  card: { marginBottom: spacing.xs },
  cardPressed: { opacity: 0.75 },
  poster: { borderRadius: radius.md, backgroundColor: colors.surface },
  posterFallback: { backgroundColor: colors.surfaceRaised },
  cardTitle: {
    color: colors.text,
    fontSize: 14,
    fontWeight: '600',
    marginTop: spacing.sm,
  },
  empty: { paddingHorizontal: spacing.xl, paddingTop: spacing.xl, alignItems: 'center' },
  emptyText: { color: colors.muted, fontSize: 15, textAlign: 'center', lineHeight: 22 },
});
