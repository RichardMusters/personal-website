import { ImageResponse } from "next/og";

export const size = {
  width: 64,
  height: 64,
};

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
          background: "#101214",
        }}
      >
        <div
          style={{
            width: 44,
            height: 44,
            borderRadius: "50%",
            background: "#a8d8c8",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            color: "#1a2426",
            fontSize: 20,
            fontWeight: 700,
            letterSpacing: -1,
            fontFamily: "system-ui, sans-serif",
          }}
        >
          RM
        </div>
      </div>
    ),
    size
  );
}
