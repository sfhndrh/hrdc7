"use client";

import { useEffect, useState } from "react";

import { apiAssetUrl } from "@/lib/api";

/**
 * Square avatar used inside admin tables. Renders the supplied profile photo
 * (with a graceful fallback to letter/initials text if the image fails to
 * load or no URL is provided).
 */
export function AdminAvatar({
  src,
  alt,
  fallback,
}: {
  src: string | null | undefined;
  alt: string;
  fallback: string;
}) {
  const [errored, setErrored] = useState(false);
  const showImage = !!src && !errored;

  useEffect(() => {
    setErrored(false);
  }, [src]);

  return (
    <span
      className="grid h-10 w-10 shrink-0 place-items-center overflow-hidden rounded-lg bg-sky-100 text-sm font-semibold text-sky-700 shadow-sm"
      aria-hidden={!showImage || undefined}
    >
      {showImage ? (
        <img
          src={apiAssetUrl(src)}
          alt={alt}
          className="h-full w-full object-cover"
          onError={() => setErrored(true)}
        />
      ) : (
        fallback
      )}
    </span>
  );
}
