"use client";

import { useEffect, useRef, useState } from "react";

const KEY = "my-life-v2-completion-animation";
type Preset = "unicorn" | "confetti" | "stars" | "custom" | "off";
type Preference = { preset: Preset; image?: string };
const DEFAULT: Preference = { preset: "unicorn" };
const VALID: Preset[] = ["unicorn", "confetti", "stars", "custom", "off"];
function readPreference(): Preference {
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return DEFAULT;
    const item = JSON.parse(raw) as Preference;
    if (!VALID.includes(item.preset)) return DEFAULT;
    if (item.preset === "custom" && !(typeof item.image === "string" && /^data:image\/(gif|png|jpeg|webp);base64,/.test(item.image))) return DEFAULT;
    return item;
  } catch { return DEFAULT; }
}
function writePreference(value: Preference) {
  localStorage.setItem(KEY, JSON.stringify(value));
  window.dispatchEvent(new Event("my-life-completion-animation-changed"));
}
function Unicorn() {
  return <div className="ml-v2-unicorn-flight">
    <div className="ml-v2-unicorn-rainbow"><span /><span /><span /><span /><span /></div>
    <div className="ml-v2-unicorn-sparkles"><i>✦</i><i>✧</i><i>✦</i><i>★</i><i>✧</i></div>
    <div className="ml-v2-unicorn-character"><span>🦄</span></div>
  </div>;
}
export function TaskCompletionCelebration({ trigger }: { trigger: number }) {
  const [active, setActive] = useState<number | null>(null);
  const [preference, setPreference] = useState<Preference>(DEFAULT);
  useEffect(() => {
    const sync = () => setPreference(readPreference());
    sync();
    window.addEventListener("my-life-completion-animation-changed", sync);
    window.addEventListener("storage", sync);
    return () => {
      window.removeEventListener("my-life-completion-animation-changed", sync);
      window.removeEventListener("storage", sync);
    };
  }, []);
  useEffect(() => {
    if (!trigger || preference.preset === "off") return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    setActive(trigger);
    const timeout = window.setTimeout(() => setActive(current => current === trigger ? null : current), 3400);
    return () => window.clearTimeout(timeout);
  }, [trigger, preference.preset]);
  if (active === null || preference.preset === "off") return null;
  return <div key={active} className="ml-v2-unicorn-celebration" aria-hidden="true">
    {preference.preset === "unicorn" ? <Unicorn /> : preference.preset === "custom" ?
      <img className="ml-v2-custom-completion-image" src={preference.image} alt="" /> :
      <div className="ml-v2-completion-symbols">{Array.from({ length: 18 }, (_, i) => <span key={i} style={{ animationDelay: `${i * 0.09}s`, left: `${5 + (i * 37) % 90}%` }}>{preference.preset === "confetti" ? ["🎉", "🎊", "✨"][i % 3] : ["⭐", "✨", "🌟"][i % 3]}</span>)}</div>}
  </div>;
}
export function CompletionAnimationSettings() {
  const [preference, setPreference] = useState<Preference>(DEFAULT);
  const [error, setError] = useState("");
  const [preview, setPreview] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  useEffect(() => { setPreference(readPreference()); }, []);
  function save(value: Preference) {
    try { writePreference(value); setPreference(value); setError(""); }
    catch { setError("Cannot save this animation in browser storage. Choose a smaller file."); }
  }
  async function upload(file?: File) {
    if (!file) return;
    if (!["image/gif", "image/png", "image/jpeg", "image/webp"].includes(file.type)) { setError("Choose GIF, PNG, JPG or WebP."); return; }
    if (file.size > 2 * 1024 * 1024) { setError("Choose an image smaller than 2 MB for local storage."); return; }
    try {
      const image = await new Promise<string>((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => typeof reader.result === "string" ? resolve(reader.result) : reject(new Error("Read failed"));
        reader.onerror = () => reject(new Error("Read failed"));
        reader.readAsDataURL(file);
      });
      save({ preset: "custom", image });
    } catch { setError("Unable to load this image."); }
  }
  return <div className="ml-v2-completion-settings">
    <strong>Task completion animation</strong>
    <label htmlFor="ml-v2-completion-preset">Animation</label>
    <select id="ml-v2-completion-preset" value={preference.preset} onChange={event => {
      const preset = event.target.value as Preset;
      if (preset === "custom" && !preference.image) { inputRef.current?.click(); return; }
      save({ ...preference, preset });
    }}>
      <option value="unicorn">Unicorn & rainbow (default)</option>
      <option value="confetti">Confetti</option>
      <option value="stars">Stars</option>
      <option value="custom" disabled={!preference.image}>My uploaded animation</option>
      <option value="off">Disabled</option>
    </select>
    <input ref={inputRef} hidden type="file" accept="image/gif,image/png,image/jpeg,image/webp" onChange={event => { void upload(event.target.files?.[0]); event.target.value = ""; }} />
    <div className="ml-v2-completion-actions">
      <button type="button" onClick={() => inputRef.current?.click()}>Upload GIF / image</button>
      <button type="button" onClick={() => { setPreview(false); window.setTimeout(() => setPreview(true), 0); }} disabled={preference.preset === "off"}>Preview</button>
      <button type="button" onClick={() => { try { localStorage.removeItem(KEY); setPreference(DEFAULT); window.dispatchEvent(new Event("my-life-completion-animation-changed")); setError(""); } catch { setError("Unable to reset animation."); } }}>Reset</button>
    </div>
    {preview && <div className="ml-v2-completion-preview" aria-label="Animation preview"><TaskCompletionCelebration trigger={1} /><button type="button" onClick={() => setPreview(false)}>Close preview</button></div>}
    {error && <span role="alert" className="ml-v2-completion-error">{error}</span>}
    <span className="ml-v2-completion-hint">Your choice is saved on this browser. GIF and animated WebP remain animated. Reduced-motion preferences are respected.</span>
  </div>;
}
