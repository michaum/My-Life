"use client";

import { useEffect, useRef, useState, type CSSProperties, type DragEvent } from "react";

const KEY = "my-life-v2-smart-wallpaper";
const MAX_BYTES = 15 * 1024 * 1024;

type Wallpaper = {
  image: string;
  position: number;
  zoom: number;
};

const clamp = (value: number, low: number, high: number) =>
  Math.min(high, Math.max(low, value));

function suggestedPosition(canvas: HTMLCanvasElement): number {
  const ctx = canvas.getContext("2d", { willReadFrequently: true });
  if (!ctx) return 50;

  const width = 96;
  const height = 96;
  const sample = document.createElement("canvas");
  sample.width = width;
  sample.height = height;
  const sampleCtx = sample.getContext("2d", { willReadFrequently: true });
  if (!sampleCtx) return 50;

  sampleCtx.drawImage(canvas, 0, 0, width, height);
  const data = sampleCtx.getImageData(0, 0, width, height).data;
  const rows = Array.from({ length: height }, () => 0);

  const luminance = (x: number, y: number) => {
    const index = (y * width + x) * 4;
    return data[index] * 0.2126 +
      data[index + 1] * 0.7152 +
      data[index + 2] * 0.0722;
  };

  for (let y = 1; y < height - 1; y++) {
    for (let x = 1; x < width - 1; x++) {
      const center = luminance(x, y);
      rows[y] += Math.abs(center - luminance(x + 1, y));
      rows[y] += Math.abs(center - luminance(x, y + 1));
    }
  }

  // Favor areas with visual detail rather than large uniform sky regions.
  let bestStart = 0;
  let bestScore = -1;
  const windowHeight = 35;
  for (let start = 0; start <= height - windowHeight; start++) {
    const score = rows.slice(start, start + windowHeight)
      .reduce((sum, value) => sum + value, 0);
    if (score > bestScore) {
      bestScore = score;
      bestStart = start;
    }
  }

  const center = (bestStart + windowHeight / 2) / height;
  return Math.round(clamp(center * 100, 10, 90));
}

async function prepareImage(file: File): Promise<Wallpaper> {
  const type = file.type.toLowerCase();
  if (!["image/jpeg", "image/png", "image/webp"].includes(type)) {
    throw new Error("Choose a JPG, PNG, or WebP image.");
  }
  if (file.size > MAX_BYTES) {
    throw new Error("Image exceeds the 15 MB upload limit.");
  }

  const url = URL.createObjectURL(file);
  try {
    const img = new Image();
    await new Promise<void>((resolve, reject) => {
      img.onload = () => resolve();
      img.onerror = () => reject(new Error("Unable to read this image."));
      img.src = url;
    });

    if (!img.naturalWidth || !img.naturalHeight) {
      throw new Error("Invalid image dimensions.");
    }

    const canvas = document.createElement("canvas");
    const scale = Math.min(1, 1800 / img.naturalWidth, 1200 / img.naturalHeight);
    canvas.width = Math.max(1, Math.round(img.naturalWidth * scale));
    canvas.height = Math.max(1, Math.round(img.naturalHeight * scale));

    const ctx = canvas.getContext("2d");
    if (!ctx) throw new Error("Image processing is unavailable.");

    ctx.fillStyle = "#ffffff";
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    ctx.drawImage(img, 0, 0, canvas.width, canvas.height);

    let quality = 0.83;
    let image = canvas.toDataURL("image/jpeg", quality);
    while (image.length > 2_000_000 && quality > 0.45) {
      quality -= 0.1;
      image = canvas.toDataURL("image/jpeg", quality);
    }
    if (image.length > 2_000_000) {
      throw new Error("Image is too large to save locally.");
    }

    return {
      image,
      position: suggestedPosition(canvas),
      zoom: 100,
    };
  } finally {
    URL.revokeObjectURL(url);
  }
}

export function SmartWallpaper() {
  const [saved, setSaved] = useState<Wallpaper | null>(null);
  const [draft, setDraft] = useState<Wallpaper | null>(null);
  const [open, setOpen] = useState(false);
  const [dragging, setDragging] = useState(false);
  const [error, setError] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);
  const dragDepth = useRef(0);

  useEffect(() => {
    try {
      const raw = localStorage.getItem(KEY);
      if (raw) {
        const parsed = JSON.parse(raw) as Wallpaper;
        if (typeof parsed.image === "string" &&
            parsed.image.startsWith("data:image/jpeg;base64,") &&
            Number.isFinite(parsed.position) &&
            Number.isFinite(parsed.zoom)) {
          setSaved({
            image: parsed.image,
            position: clamp(parsed.position, 0, 100),
            zoom: clamp(parsed.zoom, 100, 200),
          });
        }
      }
    } catch {
      // Keep the original wallpaper when stored settings are invalid.
    }
  }, []);

  const current = open ? draft : saved;

  const variables = current
    ? ({
        "--ml-wallpaper-image": `url("${current.image}")`,
        "--ml-wallpaper-position": `${current.position}%`,
        "--ml-wallpaper-zoom": `${current.zoom}%`,
      } as CSSProperties)
    : ({} as CSSProperties);

  useEffect(() => {
    const workspace = document.querySelector<HTMLElement>(".ml-v2-workspace");
    if (!workspace) return;
    if (current) {
      workspace.style.setProperty("--ml-wallpaper-image", `url("${current.image}")`);
      workspace.style.setProperty("--ml-wallpaper-position", `${current.position}%`);
      workspace.style.setProperty("--ml-wallpaper-zoom", `${current.zoom}%`);
    } else {
      workspace.style.removeProperty("--ml-wallpaper-image");
      workspace.style.removeProperty("--ml-wallpaper-position");
      workspace.style.removeProperty("--ml-wallpaper-zoom");
    }
    return () => {
      workspace.style.removeProperty("--ml-wallpaper-image");
      workspace.style.removeProperty("--ml-wallpaper-position");
      workspace.style.removeProperty("--ml-wallpaper-zoom");
    };
  }, [current]);

  async function load(file?: File) {
    if (!file) return;
    setError("");
    try {
      setDraft(await prepareImage(file));
      setOpen(true);
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Image failed to load.");
      setOpen(true);
    }
  }

  function save() {
    if (!draft) return;
    try {
      localStorage.setItem(KEY, JSON.stringify(draft));
      setSaved(draft);
      setOpen(false);
      setError("");
    } catch {
      setError("Browser storage is full. Try a smaller image.");
    }
  }

  function reset() {
    try {
      localStorage.removeItem(KEY);
      setSaved(null);
      setDraft(null);
      setOpen(false);
      setError("");
    } catch {
      setError("Could not reset saved wallpaper.");
    }
  }

  function drop(event: DragEvent<HTMLDivElement>) {
    event.preventDefault();
    event.stopPropagation();
    dragDepth.current = 0;
    setDragging(false);
    const file = Array.from(event.dataTransfer.files).find((item) =>
      ["image/jpeg", "image/png", "image/webp"].includes(item.type)
    );
    void load(file || event.dataTransfer.files[0]);
  }

  return (
    <>
      <div
        className={`ml-v2-wallpaper-layer${dragging ? " is-dragging" : ""}`}
        style={variables}
        onDragEnter={(event) => {
          if (!event.dataTransfer.types.includes("Files")) return;
          event.preventDefault();
          dragDepth.current += 1;
          setDragging(true);
        }}
        onDragOver={(event) => {
          if (event.dataTransfer.types.includes("Files")) event.preventDefault();
        }}
        onDragLeave={(event) => {
          event.preventDefault();
          dragDepth.current = Math.max(0, dragDepth.current - 1);
          if (dragDepth.current === 0) setDragging(false);
        }}
        onDrop={drop}
      >
        {dragging && <div className="ml-v2-wallpaper-drop-hint">Drop image to change wallpaper</div>}
        <button
          type="button"
          className="ml-v2-standard-button ml-v2-wallpaper-edit-button"
          onClick={() => {
            setDraft(saved ? { ...saved } : null);
            setError("");
            setOpen(true);
          }}
        >
          Edit Wallpaper
        </button>
      </div>

      <input
        ref={inputRef}
        type="file"
        accept="image/jpeg,image/png,image/webp"
        hidden
        onChange={(event) => {
          void load(event.target.files?.[0]);
          event.target.value = "";
        }}
      />

      {open && (
        <div className="ml-v2-wallpaper-dialog-backdrop" role="presentation">
          <section
            className="ml-v2-wallpaper-dialog"
            role="dialog"
            aria-modal="true"
            aria-label="Wallpaper editor"
          >
            <div className="ml-v2-wallpaper-dialog-heading">
              <h2>Smart Wallpaper Editor</h2>
              <button type="button" onClick={() => setOpen(false)} aria-label="Close editor">×</button>
            </div>

            <p>Choose a photo, then adjust how it appears in your header.</p>

            <div
              className="ml-v2-wallpaper-preview"
              style={draft ? ({
                backgroundImage: `linear-gradient(to bottom, transparent 0%, transparent 55%, white 100%), url("${draft.image}")`,
                backgroundPosition: `center top, center ${draft.position}%`,
                backgroundSize: `100% 100%, ${draft.zoom}% auto`,
              }) : undefined}
            >
              {!draft && <span>Original mountain wallpaper</span>}
            </div>

            {draft && (
              <div className="ml-v2-wallpaper-sliders">
                <label>
                  Vertical position: {draft.position}%
                  <input type="range" min="0" max="100" value={draft.position}
                    onChange={(event) => setDraft({ ...draft, position: Number(event.target.value) })} />
                </label>
                <label>
                  Zoom: {draft.zoom}%
                  <input type="range" min="100" max="200" step="5" value={draft.zoom}
                    onChange={(event) => setDraft({ ...draft, zoom: Number(event.target.value) })} />
                </label>
              </div>
            )}

            {error && <p className="ml-v2-wallpaper-error" role="alert">{error}</p>}

            <div className="ml-v2-wallpaper-actions">
              <button type="button" onClick={() => inputRef.current?.click()}>Choose Image</button>
              <button type="button" onClick={reset}>Reset to Default</button>
              <button type="button" onClick={() => setOpen(false)}>Cancel</button>
              <button type="button" disabled={!draft} onClick={save}>Save Wallpaper</button>
            </div>
          </section>
        </div>
      )}
    </>
  );
}
