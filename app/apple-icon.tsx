import { ImageResponse } from "next/og";

/**
 * iOS / apple-touch-icon (home-screen bookmark). Same brand mark as app/icon
 * at the 180×180 size Apple expects; iOS applies its own rounded mask.
 */
export const size = { width: 180, height: 180 };
export const contentType = "image/png";

export default function AppleIcon() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          background: "linear-gradient(135deg, #8b5cf6 0%, #9333ea 100%)",
          color: "#ffffff",
          fontSize: 96,
          fontWeight: 700,
          letterSpacing: -4,
          fontFamily: "sans-serif",
        }}
      >
        IK
      </div>
    ),
    { ...size },
  );
}
