# Building app-release.aab via GitHub Actions (no Android Studio required)

This lets you get a real, signed, downloadable `.aab` file without installing
Android Studio or the Android SDK on your own computer. GitHub's servers do
the building; you just download the result.

---

## Step 1 — Push this project to GitHub

If you haven't already:

```bash
cd MonsoonWatch
git init
git add .
git commit -m "Initial commit"
gh repo create monsoonwatch --private --source=. --push
```

(No `gh` CLI? Create a new repo at github.com, then `git remote add origin <url>` and `git push -u origin main`.)

---

## Step 2 — Generate a signing keystore (one time only)

You need Java installed locally for this one command (or run it in any
online Java sandbox / Replit if you don't have Java on your machine):

```bash
keytool -genkeypair -v \
  -storetype PKCS12 \
  -keystore monsoon-upload-key.keystore \
  -alias monsoon-key-alias \
  -keyalg RSA -keysize 2048 \
  -validity 10000
```

It will ask for a password and some identity details (name, org, country).
**Remember the password** — you'll need it below, and again every time you
update the app in the future. Losing this keystore means you can never
update your app again under the same listing.

---

## Step 3 — Base64-encode the keystore

```bash
base64 -i monsoon-upload-key.keystore | tr -d '\n' > keystore-base64.txt
```

Open `keystore-base64.txt` — it's one long line of text. Copy the whole thing.

---

## Step 4 — Add 4 secrets to your GitHub repo

On GitHub: go to your repo → **Settings** → **Secrets and variables** →
**Actions** → **New repository secret**. Add these four, one at a time:

| Secret name | Value |
|---|---|
| `ANDROID_KEYSTORE_BASE64` | the long text from `keystore-base64.txt` |
| `ANDROID_KEYSTORE_PASSWORD` | the password you set in Step 2 |
| `ANDROID_KEY_ALIAS` | `monsoon-key-alias` |
| `ANDROID_KEY_PASSWORD` | same password (unless you set a separate key password) |

These secrets are encrypted by GitHub and never appear in logs or to other
users — this is the standard, safe way to handle signing credentials in CI.

---

## Step 5 — Run the workflow

Go to your repo's **Actions** tab → select **"Build Android App Bundle (AAB)"**
in the left sidebar → click **"Run workflow"** → **"Run workflow"** (green button).

It takes about 3–5 minutes. You'll see it go from a yellow dot to a green
checkmark when done.

---

## Step 6 — Download the AAB

Click into the finished workflow run → scroll down to **Artifacts** →
click **app-release-aab** to download a zip containing your
`app-release.aab` file. There's also a debug APK artifact you can sideload
onto your own Android phone instantly to test the app before submitting.

---

## Step 7 — Upload to Google Play Console

Unzip the download, then in Play Console go to **Release → Production**
(or **Internal testing**) → **Create new release** → **Upload** → select
`app-release.aab`.

---

## Troubleshooting

**Build fails at `bundleRelease`** — almost always a keystore secret typo.
Re-check that the base64 string has no line breaks and that all 4 secret
values exactly match what you used in Step 2.

**"SDK location not found"** — shouldn't happen with this workflow since
`setup-java` and the React Native Gradle plugin handle SDK installation
automatically, but if you see it, add an `android/local.properties` file
with `sdk.dir=/usr/local/lib/android/sdk` (the path `setup-android` actions
typically use).

**Want CI to run on every commit instead of manually?** It already does —
the workflow triggers on every push to `main`, plus you can always trigger
it by hand from the Actions tab.
