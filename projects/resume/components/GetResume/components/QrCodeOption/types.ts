/** The drawing of the QR code, as `qrCodeArtwork.json` stores it. */
export interface QrCodeArtwork {
  /** SVG path data: one closed sub-path per horizontal run of dark squares, one unit a square. */
  path: string
  /** Squares along one side, the quiet zone around the code included. */
  unitsPerSide: number
}
