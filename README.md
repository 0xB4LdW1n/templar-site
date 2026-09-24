# templar.red — the Templar Lend website

The public site: what Templar Lend is, what Templar Wallet is, and its documentation.
Italian first, English beside it. No app: the lending app is not published yet.

| Page | Italian | English |
|---|---|---|
| Templar Lend | `site/index.html` | `site/en/index.html` |
| Templar Wallet | `site/wallet/index.html` | `site/en/wallet/index.html` |
| Documentation | `site/wallet/docs/index.html` | `site/en/wallet/docs/index.html` |

Everything else is in `site/assets/` (one stylesheet per page family, two small scripts, the fonts
and the screenshots) plus `404.html`, `robots.txt`, `sitemap.xml`, `CNAME` and `.nojekyll`.

## How it goes online

A push to `main` runs `.github/workflows/pages.yml`: it checks that every page and every local
reference exists, then uploads `site/` to GitHub Pages. No build step, no dependencies.

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
