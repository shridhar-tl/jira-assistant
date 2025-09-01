import classNames from "classnames";
import { useState } from "react";

function Image(props) {
  const { src, fallback } = props;
  const [fb, setFallback] = useState({});

  if (!src || getPathName(src).length < 3) {
    return fallback || null;
  }

  const { alt = "", className, title } = props;

  const useFallbackEl = (el) => setFallback({ src, fallback: true });

  if (fallback && fb.fallback && fb.src === src) {
    return fallback;
  }

  return (
    <img
      src={src}
      alt={alt}
      title={title}
      onError={useFallbackEl}
      className={classNames("img-x16", className)}
    />
  );
}

export default Image;

function getPathName(src) {
  try {
    return new URL(src).pathname;
  } catch {
    return "";
  }
}
