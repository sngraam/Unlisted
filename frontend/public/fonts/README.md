# Local interface fonts

These original WOFF2 binaries are served locally by `next/font/local` in `app/layout.tsx`. No third-party font requests are needed at runtime. Filenames follow the requested project naming; the embedded font families are unchanged.

| File                          | Family and axes                                            | Official source                                                                                                                                 |
| ----------------------------- | ---------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------- |
| `inter-variable.woff2`        | Inter Variable, normal, weight 100–900, optical size 14–32 | [Inter](https://github.com/rsms/inter/blob/353b61b9f4430d5f420d56605a6e7993e0941470/docs/font-files/InterVariable.woff2)                        |
| `inter-variable-italic.woff2` | Inter Variable, italic, weight 100–900, optical size 14–32 | [Inter](https://github.com/rsms/inter/blob/353b61b9f4430d5f420d56605a6e7993e0941470/docs/font-files/InterVariable-Italic.woff2)                 |
| `paper-mono-variable.woff2`   | Paper Mono, normal, weight 100–800                         | [Paper Mono](https://github.com/paper-design/paper-mono/blob/9fbc4d9877798252494ad517a5db9ee89f4fd972/fonts/webfonts/PaperMono%5Bwght%5D.woff2) |

Downloaded 2026-09-13. FontTools verified the variable axes and WOFF2 headers. Preserve `Inter-LICENSE.txt` and `PaperMono-OFL.txt` alongside the fonts when redistributing.

Typography is controlled by `--font-sans` and `--font-mono` in `app/globals.css`. Body text and controls use Inter; SKU identifiers, small section labels, table headings and numeric metrics use Paper Mono. Italic Inter is used for semantic emphasis; do not synthesize italics or bold weights.
