// A click-to-play YouTube embed.
//
// A normal <iframe> pulls well over a megabyte of YouTube's JavaScript on page
// load, whether or not anyone watches. This shows the video's thumbnail (~30KB)
// and only loads the real player once it's clicked — which keeps pages that
// receive paid traffic fast, since slow landing pages cost money.

import React, { useState } from "react";

export default function YouTubeEmbed({ id, title = "Video", caption }) {
  const [playing, setPlaying] = useState(false);
  const [thumb, setThumb] = useState(`https://img.youtube.com/vi/${id}/maxresdefault.jpg`);

  if (!id) return null;

  return (
    <figure style={figureStyle}>
      <div style={frameStyle}>
        {playing ? (
          <iframe
            style={mediaStyle}
            // nocookie means nothing is set until someone actually plays it
            src={`https://www.youtube-nocookie.com/embed/${id}?autoplay=1&rel=0`}
            title={title}
            frameBorder="0"
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
            allowFullScreen
          />
        ) : (
          <button
            type="button"
            onClick={() => setPlaying(true)}
            style={buttonStyle}
            aria-label={`Play: ${title}`}
          >
            <img
              src={thumb}
              alt=""
              style={mediaStyle}
              loading="lazy"
              // maxresdefault doesn't exist for every video; fall back quietly
              onError={() => setThumb(`https://img.youtube.com/vi/${id}/hqdefault.jpg`)}
            />
            <span style={playBadgeStyle} aria-hidden="true">▶</span>
          </button>
        )}
      </div>
      {caption && <figcaption style={captionStyle}>{caption}</figcaption>}
    </figure>
  );
}

const figureStyle = { margin: 0 };

const frameStyle = {
  position: "relative",
  width: "100%",
  aspectRatio: "16 / 9",
  background: "#111827",
  borderRadius: "8px",
  overflow: "hidden",
};

const mediaStyle = {
  width: "100%",
  height: "100%",
  objectFit: "cover",
  display: "block",
  border: "none",
};

const buttonStyle = {
  width: "100%",
  height: "100%",
  padding: 0,
  border: "none",
  background: "none",
  cursor: "pointer",
  display: "block",
  position: "relative",
};

const playBadgeStyle = {
  position: "absolute",
  top: "50%",
  left: "50%",
  transform: "translate(-50%, -50%)",
  width: "4rem",
  height: "4rem",
  borderRadius: "999px",
  background: "rgba(17,24,39,0.78)",
  color: "white",
  fontSize: "1.5rem",
  lineHeight: "4rem",
  textAlign: "center",
  pointerEvents: "none",
};

const captionStyle = {
  marginTop: "0.6rem",
  color: "#6b7280",
  fontSize: "0.9rem",
  textAlign: "center",
};
