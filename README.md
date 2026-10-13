# Anime Streaming App (Expo + React Navigation)

## Structure

```
anime-streaming-app/
├── App.js                      # Stack navigator: Home, Details, Player
├── app.json
├── babel.config.js
├── package.json
└── src/
    ├── api.js                  # fetch helpers + response normalizers
    ├── config.js               # API base URL (handles localhost on devices)
    ├── theme.js                # colors, spacing, radius
    └── screens/
        ├── HomeScreen.js       # search + poster grid
        ├── DetailsScreen.js    # poster, synopsis, episode grid
        └── PlayerScreen.js     # expo-av Video, full screen
```

## Run

```bash
npm install
npx expo install --fix     # aligns package versions with your Expo SDK
npx expo start
```

Or install from scratch into a new Expo project:

```bash
npx expo install @react-navigation/native @react-navigation/native-stack \
  react-native-screens react-native-safe-area-context \
  expo-av expo-constants expo-screen-orientation expo-status-bar
```

## Backend notes

- `localhost` on a phone or emulator points at the device, not your computer.
  `src/config.js` uses your computer's LAN IP (from the Expo dev server) and falls
  back to `10.0.2.2` on the Android emulator. Make the server listen on `0.0.0.0`.
  To hard-code a host, set `OVERRIDE_HOST` in `src/config.js`.
- Plain `http://` is allowed via `app.json` (needed for development builds).
- Responses are normalized in `src/api.js`. Search items need `session` (or `id`),
  `title`, `poster`/`image`; episodes need `session`/`id` and `episode`/`number`;
  sources need `url` and optionally `quality`. Adjust the mappers if your API differs.
- `expo-av` is deprecated in newer Expo SDKs. This project pins SDK 54, where it
  still works. For SDK 55+, switch the player to `expo-video`.
