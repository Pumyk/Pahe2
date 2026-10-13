import { API_BASE } from './config';

async function getJson(path, params, signal) {
  const query = Object.entries(params)
    .map(([k, v]) => `${encodeURIComponent(k)}=${encodeURIComponent(v)}`)
    .join('&');
  const res = await fetch(`${API_BASE}${path}?${query}`, { signal });
  if (!res.ok) throw new Error(`Request failed (${res.status})`);
  return res.json();
}

// Accept either a bare array or an object wrapping the array.
function toArray(data, ...keys) {
  if (Array.isArray(data)) return data;
  for (const key of keys) {
    if (Array.isArray(data?.[key])) return data[key];
  }
  return [];
}

export async function searchAnime(query, signal) {
  const data = await getJson('/api/search', { q: query }, signal);
  return toArray(data, 'results', 'data', 'anime').map((item) => ({
    session: String(item.session ?? item.id),
    title: item.title ?? item.name ?? 'Untitled',
    poster: item.poster ?? item.image ?? item.cover ?? null,
    synopsis: item.synopsis ?? item.description ?? '',
  }));
}

export async function getEpisodes(session, signal) {
  const data = await getJson('/api/episodes', { session }, signal);
  return toArray(data, 'episodes', 'results', 'data').map((ep, index) => ({
    id: String(ep.session ?? ep.id),
    number: ep.episode ?? ep.number ?? ep.title ?? index + 1,
  }));
}

export async function getSources(episodeId, signal) {
  const data = await getJson('/api/sources', { id: episodeId }, signal);
  return toArray(data, 'sources', 'results', 'data')
    .map((s, index) => ({
      url: s.url ?? s.src ?? s.link ?? s.file,
      label: String(s.quality ?? s.label ?? s.resolution ?? `Source ${index + 1}`),
    }))
    .filter((s) => !!s.url);
}
