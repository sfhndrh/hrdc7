"use client";

import { useEffect, useState } from "react";

import { apiAssetUrl } from "@/lib/api";
import { normalizeProfilePhotoUrl } from "@/lib/profile-photo";

/** Circular profile photo with initials fallback (profile headers). */
export function ProfilePhotoCircle({
  photoUrl,
  fallback,
  alt = "",
  sizeClass = "h-16 w-16 text-lg",
}: {
  photoUrl: string | null | undefined;
  fallback: string;
  alt?: string;
  sizeClass?: string;
}) {
  const [errored, setErrored] = useState(false);
  const normalized = normalizeProfilePhotoUrl(photoUrl);
  const showImage = !!normalized && !errored;

  useEffect(() => {
    setErrored(false);
  }, [normalized]);

  return (
    <div
      className={`grid shrink-0 place-items-center overflow-hidden rounded-full bg-[color:var(--avatar-placeholder-bg)] font-semibold text-[color:var(--avatar-placeholder-text)] ${sizeClass}`}
    >
      {showImage ? (
        <img
          src={apiAssetUrl(normalized)}
          alt={alt}
          className="h-full w-full object-cover"
          onError={() => setErrored(true)}
        />
      ) : (
        fallback
      )}
    </div>
  );
}
