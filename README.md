# templar.red — the Templar Lend website

The public site: what Templar Lend is, what Templar Wallet is, and its documentation.
Italian first, English beside it. No app: the lending app is not published yet.

| Page | Italian | English |
|---|---|---|
| Templar Lend | `site/index.html` | `site/en/index.html` |
| Templar Wallet | `site/wallet/index.html` | `site/en/wallet/index.html` |
| Documentation | `site/wallet/docs/index.html` | `site/en/wallet/docs/index.html` |

Everything else is in `site/assets/` (one stylesheet per page family, two small scripts, the fonts
and the screenshots), `site/_astro/` (the two React islands: the tilting wallet showcase on the landing and the
phone carousel on the wallet page, plus their stylesheet) and `404.html`, `robots.txt`, `sitemap.xml`, `CNAME`,
`.nojekyll`.

**The pages are not edited here.** They are built with Astro from `LendingPage/` in the private monorepo
(`npm run build` there), and its `dist/` is copied into `site/` as it is
(`rsync -a --delete --exclude .DS_Store dist/ ../templar-site/site/`). A change made in this folder is lost at
the next copy.

## How it goes online

A push to `main` runs `.github/workflows/pages.yml`: it checks that every page and every local
reference exists, then uploads one folder to GitHub Pages. No build step here, no dependencies.

**The site is open:** `PUBLISH_DIR` in that workflow is `site`, so the whole site is on the server.
To close it again behind the holding page in `soon/` (its font, its mark and a `robots.txt` that asks
not to be indexed): set `PUBLISH_DIR: soon` and push. Nothing else changes.

The custom domain is **templar.red**, kept in `site/CNAME` and in Settings → Pages.

## Where the downloads point

The buttons on the wallet page link to the latest release of
[0xB4LdW1n/TemplarWallet](https://github.com/0xB4LdW1n/TemplarWallet), by version-less name:

```
https://github.com/0xB4LdW1n/TemplarWallet/releases/latest/download/TemplarWallet-macos.dmg
                                                                   TemplarWallet-windows-x64-setup.exe
                                                                   TemplarWallet-windows-x64.zip
                                                                   TemplarWallet-linux-x64.tar.gz
                                                                   TemplarWallet-android-arm64.apk
                                                                   SHA256SUMS.txt
```

`/releases/latest` skips drafts and pre-releases, so those links start working with the first
`vX.Y.Z` tag on the wallet repository and keep pointing at the newest version after that. Until
then they answer 404 — that is the only thing on the site waiting for something.

## Working on it

Preview exactly what Pages serves:

```bash
cd site && python3 -m http.server 8765     # then http://127.0.0.1:8765/
```

The pages are hand-written HTML; the wallet page's drawn device, its tour and the download
switcher live in `site/assets/js/wallet.js` and `site/assets/css/wallet.css`. Keep the Italian and
the English page in step: they are two files with the same structure and the same ids.
