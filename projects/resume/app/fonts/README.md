# Fonts

The two font files the site serves, committed so that `yarn build` needs nothing from Google Fonts. `app/layout.tsx` loads them with `next/font/local`.

| Folder            | Font           | Version | Weight axis of the file | Range in `layout.tsx` | Bytes  |
| ----------------- | -------------- | ------- | ----------------------- | --------------------- | ------ |
| `ibm-plex-sans/`  | IBM Plex Sans  | 3.201   | 100 to 700              | `400 700`             | 40,240 |
| `jetbrains-mono/` | JetBrains Mono | 2.211   | 100 to 800              | `100 800`             | 40,480 |

Only the Latin subsets are here, because they are the only subsets that cover a character on the page. A visitor who types Greek or Cyrillic into the email field sees a system font there.

## Source

Each `latin.woff2` is Google Fonts' Latin subset, byte for byte. It was copied on 2026-11-03 from `out/_next/static/media` after a clean build of commit `520dfda`, where `next/font/google` (Next 15.3.4) had downloaded it. The version in the table is the one in the file's own name table.

| File                         | SHA-256                                                            |
| ---------------------------- | ------------------------------------------------------------------ |
| `ibm-plex-sans/latin.woff2`  | `056e4e2459f57a0033c8c9c844ff19d6e42ac8602027803d4345823bcc939818` |
| `jetbrains-mono/latin.woff2` | `1e06740a02a443fb7f3eeda8fcaa685a0f6c620e3f01e6666e847295469ce3ad` |

## License

Both fonts are published under the SIL Open Font License 1.1. Each folder's `OFL.txt` is the copy in the `google/fonts` repository (`ofl/ibmplexsans/OFL.txt` and `ofl/jetbrainsmono/OFL.txt`), with the copyright notice on its first line. The publishers state the same license: `LICENSE.txt` in `IBM/plex` is identical, and `OFL.txt` in `JetBrains/JetBrainsMono` differs only in its FAQ link and its whitespace.

The files state their own copyright notices:

- IBM Plex Sans: `Copyright 2019 IBM Corp. All rights reserved.`
- JetBrains Mono: `Copyright 2020 The JetBrains Mono Project Authors (https://github.com/JetBrains/JetBrainsMono)`

IBM's license reserves the font name "Plex", and a modified version may not use a reserved name. Do not subset or edit `ibm-plex-sans/latin.woff2` in place: a changed file would need a different name.
