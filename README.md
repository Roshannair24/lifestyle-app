# PadosiPro

A mobile app with email + OTP sign-up, login, profile setup and task selection.

| Folder                                   | What it is                                           |
| ---------------------------------------- | ---------------------------------------------------- |
| [pp-native-app/](pp-native-app/)         | Expo (SDK 57) / React Native app                     |
| [pp-server/](pp-server/)                 | Node.js + Express API                                |
| [db/init/](db/init/)                     | SQL scripts that create and seed the Postgres schema |
| [docker-compose.yml](docker-compose.yml) | Postgres 16 and Mailpit (local email inbox)          |

## Prerequisites

- **Node.js 22** and npm
- **Docker Desktop** (or Docker Engine with the Compose plugin)
- To run the app, one of:
  - the **Expo Go** app on a phone that is on the same Wi-Fi network as your machine
  - an Android emulator (Android Studio)
- To build the APK locally: **JDK 17** and the **Android SDK** (installed with Android Studio), with `ANDROID_HOME` set

## Environment variables

Each part of the project has its own `.env` file. Real `.env` files are git-ignored; copy the committed examples and fill them in. Never commit real secrets.

```bash
cp .env.example .env
cp pp-server/.env.example pp-server/.env
cp pp-native-app/.env.example pp-native-app/.env
```

**Root `.env`** (read by Docker Compose)

| Variable            | Required | Description                              |
| ------------------- | -------- | ---------------------------------------- |
| `POSTGRES_USER`     | No       | Database user. Defaults to `padosi`.     |
| `POSTGRES_PASSWORD` | No       | Database password. Defaults to `padosi`. |
| `POSTGRES_DB`       | No       | Database name. Defaults to `padosi`.     |

**`pp-server/.env`**

| Variable         | Required | Description                                                                                                       |
| ---------------- | -------- | ----------------------------------------------------------------------------------------------------------------- |
| `DATABASE_URL`   | Yes      | Postgres connection string. Must match the root `.env` values, e.g. `postgres://USER:PASSWORD@localhost:5432/DB`. |
| `OTP_SECRET`     | Yes      | Secret used to hash email OTP codes. Use a long random string.                                                    |
| `JWT_SECRET`     | Yes      | Secret used to sign login tokens. Use a different long random string.                                             |
| `JWT_EXPIRES_IN` | No       | Token lifetime. Defaults to `7d`.                                                                                 |
| `SMTP_HOST`      | No       | SMTP host for OTP emails. Defaults to `localhost` (Mailpit).                                                      |
| `SMTP_PORT`      | No       | SMTP port. Defaults to `1025` (Mailpit).                                                                          |
| `MAIL_FROM`      | No       | From address on OTP emails.                                                                                       |

**`pp-native-app/.env`**

| Variable              | Required       | Description                                                                                                                                                          |
| --------------------- | -------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `EXPO_PUBLIC_API_URL` | For APK builds | Base URL of the API, no trailing slash. In development you can remove it: the app then uses the Metro host on port 3000, or `10.0.2.2:3000` on the Android emulator. |

## Backend setup

1. Start Postgres and Mailpit from the repo root:

   ```bash
   docker compose up -d
   ```

   On first start, Postgres runs the scripts in [db/init/](db/init/) to create the tables and seed the tasks. They only run when the data volume is empty. To re-run them, reset the database (this deletes all data):

   ```bash
   docker compose down -v
   docker compose up -d
   ```

2. Install and start the API:

   ```bash
   cd pp-server
   npm install
   npm run dev
   ```

   The server checks the database connection, then listens on **http://localhost:3000**. `npm run dev` restarts on file changes; `npm start` runs it without the watcher.

3. Check it is up: open http://localhost:3000 and you should see `Hello World!`.

OTP emails are not sent to real inboxes in development. Mailpit catches them; read the codes at **http://localhost:8025**.

## Run the app

With the backend running:

```bash
cd pp-native-app
npm install
npx expo start
```

Then either:

- scan the QR code with Expo Go (Android) or the Camera app (iOS), or
- press `a` to open it in a running Android emulator.

On a physical phone, the phone must be able to reach your machine on port 3000. Keep both on the same Wi-Fi network and allow port 3000 through your firewall. If the app cannot reach the API, set `EXPO_PUBLIC_API_URL` in `pp-native-app/.env` to `http://<your-LAN-IP>:3000` and restart `npx expo start`.

## Build the APK

The API URL is baked into the APK at build time, so set `EXPO_PUBLIC_API_URL` in `pp-native-app/.env` first. It must be an address the phone can reach: a deployed URL or your machine's LAN IP, not `localhost`.

Release builds on Android block plain `http://` requests. Either point the app at an `https://` API, or allow cleartext traffic by installing `expo-build-properties` (`npx expo install expo-build-properties`) and adding this to `plugins` in [app.json](pp-native-app/app.json):

```json
["expo-build-properties", { "android": { "usesCleartextTraffic": true } }]
```

### Option 1: local build

Requires JDK 17 and the Android SDK.

```bash
cd pp-native-app
npx expo prebuild --platform android
cd android
./gradlew assembleRelease
```

On Windows, use `gradlew.bat assembleRelease`. The first `prebuild` asks for an Android package name (for example `com.yourname.padosipro`) and saves it to `app.json`.

The APK is written to:

```
pp-native-app/android/app/build/outputs/apk/release/app-release.apk
```

This APK is signed with the debug keystore, which is fine for installing on test devices but not for the Play Store.

### Option 2: EAS Build (cloud)

No Android SDK needed, but it requires a free Expo account.

1. Create `pp-native-app/eas.json`:

   ```json
   {
     "build": {
       "preview": {
         "distribution": "internal",
         "android": { "buildType": "apk" }
       }
     }
   }
   ```

2. Build:

   ```bash
   cd pp-native-app
   npx eas-cli@latest login
   npx eas-cli@latest build --platform android --profile preview
   ```

   EAS does not upload your `.env` file. Add `"env": { "EXPO_PUBLIC_API_URL": "https://your-api" }` to the `preview` profile so the build picks up the API URL.

When the build finishes, EAS prints a link to download the APK.

### Install it

Copy the APK to the phone and open it, or with the phone connected over USB:

```bash
adb install app-release.apk
```
## Test with the APK

First run docker compose up --build
then run the apk.


The prebuilt APK in this submission is built with `EXPO_PUBLIC_API_URL=http://10.0.2.2:3000`. `10.0.2.2` is the Android emulator's address for the host machine, so the APK works on **any Android emulator running on the same machine as the backend**, with no rebuild.