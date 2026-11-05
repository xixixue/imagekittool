import { ImageResponse } from "next/og";

/**
 * Browser tab favicon (app router icon). Branded "IK" monogram on the same
 * violet→purple gradient as the navbar logo, so the tab shows the site mark
 * instead of the browser's default globe. Renders to PNG at build time.
 */
export const size = { width: 32, height: 32 };
export const contentType = "image/png";

export default function Icon() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          borderRadius: 8,
          background: "linear-gradient(135deg, #8b5cf6 0%, #9333ea 100%)",
          color: "#ffffff",
          fontSize: 16,
          fontWeight: 700,
          letterSpacing: -1,
          fontFamily: "sans-serif",
        }}
      >
        IK
      </div>
    ),
    { ...size },
  );
}
