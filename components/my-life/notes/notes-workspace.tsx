"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import Database from "@tauri-apps/plugin-sql";
import {
  FolderOpen,
  NotebookPen,
  Plus,
  Search,
  Trash2,
} from "lucide-react";

type Note = {
  id: string;
  folderId: string | null;
  title: string;
  content: string;
  createdAt: string;
  updatedAt: string;
};

type Folder = {
  id: string;
  name: string;
  sortOrder: number;
};

type SaveState = "saved" | "saving" | "unsaved" | "error";

function isDesktop() {
  return typeof window !== "undefined" &&
    ("__TAURI_INTERNALS__" in window || "__TAURI__" in window);
}

async function loadNotes(): Promise<{
  notes: Note[];
  folders: Folder[];
}> {
  if (isDesktop()) {
    const db = await Database.load("sqlite:mylife.db");

    const notes = await db.select<Note[]>(
      `SELECT id, folder_id AS folderId, title, content,
              created_at AS createdAt, updated_at AS updatedAt
       FROM notes WHERE deleted_at IS NULL
       ORDER BY updated_at DESC`
    );

    const folders = await db.select<Folder[]>(
      `SELECT id, name, sort_order AS sortOrder
       FROM note_folders WHERE deleted_at IS NULL
       ORDER BY sort_order, name COLLATE NOCASE`
    );

    return { notes, folders };
  }

  const response = await fetch("/api/notes", {
    cache: "no-store",
  });

  if (!response.ok) {
    throw new Error("Notes storage is not available.");
  }

  return response.json();
}

async function saveNote(note: Note): Promise<void> {
  if (isDesktop()) {
    const db = await Database.load("sqlite:mylife.db");

    const existing = await db.select<
      { deleted_at: string | null }[]
    >("SELECT deleted_at FROM notes WHERE id=?", [note.id]);

    if (existing.length && existing[0].deleted_at) {
      throw new Error("This note has been deleted.");
    }

    if (existing.length) {
      await db.execute(
        `UPDATE notes
         SET title=?, content=?, folder_id=?, updated_at=?
         WHERE id=? AND deleted_at IS NULL`,
        [
          note.title,
          note.content,
          note.folderId,
          note.updatedAt,
          note.id,
        ]
      );
    } else {
      await db.execute(
        `INSERT INTO notes
         (id, folder_id, title, content, content_format,
          created_at, updated_at)
         VALUES (?, ?, ?, ?, 'html', ?, ?)`,
        [
          note.id,
          note.folderId,
          note.title,
          note.content,
          note.createdAt,
          note.updatedAt,
        ]
      );
    }

    return;
  }

  const response = await fetch("/api/notes", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      action: "saveNote",
      note: {
        id: note.id,
        folderId: note.folderId,
        title: note.title,
        content: note.content,
      },
    }),
  });

  if (!response.ok) {
    throw new Error("Could not save note.");
  }
}

async function deleteNote(id: string): Promise<void> {
  if (isDesktop()) {
    const db = await Database.load("sqlite:mylife.db");
    const now = new Date().toISOString();

    await db.execute(
      `UPDATE notes SET deleted_at=?, updated_at=?
       WHERE id=? AND deleted_at IS NULL`,
      [now, now, id]
    );

    return;
  }

  const response = await fetch("/api/notes", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ action: "deleteNote", id }),
  });

  if (!response.ok) {
    throw new Error("Could not delete note.");
  }
}

async function saveFolder(folder: Folder): Promise<void> {
  if (isDesktop()) {
    const db = await Database.load("sqlite:mylife.db");
    const now = new Date().toISOString();

    await db.execute(
      `INSERT INTO note_folders
       (id, name, sort_order, created_at, updated_at)
       VALUES (?, ?, ?, ?, ?)`,
      [folder.id, folder.name, folder.sortOrder, now, now]
    );
    return;
  }

  const response = await fetch("/api/notes", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      action: "saveFolder",
      folder,
    }),
  });

  if (!response.ok) {
    throw new Error("Could not create folder.");
  }
}

// STEP 18F.23I.39G-R2 - Select existing note from Overview.
export function MyLifeNotesWorkspace({
  initialNoteId = null,
}: {
  initialNoteId?: string | null;
}) {
  const [notes, setNotes] = useState<Note[]>([]);
  const [folders, setFolders] = useState<Folder[]>([]);
  const [creatingFolder, setCreatingFolder] = useState(false);
  const [folderName, setFolderName] = useState("");
  const [selectedFolderId, setSelectedFolderId] = useState<string | null>(null);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [saveState, setSaveState] = useState<SaveState>("saved");
  const [error, setError] = useState("");
  const [storageReady, setStorageReady] = useState(false);

  const notesRef = useRef<Note[]>([]);
  const pendingRef = useRef<Note | null>(null);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const savingRef = useRef(false);
  const selectedRef = useRef<string | null>(null);

  const updateNotes = useCallback((next: Note[]) => {
    notesRef.current = next;
    setNotes(next);
  }, []);

  const persist = useCallback(async () => {
    if (savingRef.current || !pendingRef.current) return;

    savingRef.current = true;
    setSaveState("saving");

    const note = pendingRef.current;
    pendingRef.current = null;

    try {
      await saveNote(note);

      if (!pendingRef.current) {
        setSaveState("saved");
        setError("");
      }
    } catch (cause) {
      pendingRef.current = pendingRef.current ?? note;
      setSaveState("error");
      setError(
        cause instanceof Error ? cause.message : "Saving failed."
      );
    } finally {
      savingRef.current = false;

      if (pendingRef.current) {
        if (timerRef.current) clearTimeout(timerRef.current);

        timerRef.current = setTimeout(() => {
          void persist();
        }, 1500);
      }
    }
  }, []);

  useEffect(() => {
    let cancelled = false;

    async function initialize() {
      try {
        const result = await loadNotes();
        if (cancelled) return;

        updateNotes(result.notes);
        setFolders(result.folders);

        // Select only a note that exists in the loaded data.
        if (
          initialNoteId &&
          result.notes.some((note) => note.id === initialNoteId)
        ) {
          selectedRef.current = initialNoteId;
          setSelectedId(initialNoteId);
          setSelectedFolderId(null);
          setSearch("");
        }

        setStorageReady(true);
        setError("");
      } catch {
        if (!cancelled) {
          setStorageReady(false);
          setError(
            "Notes storage is not ready. Database migrations must be applied first."
          );
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    void initialize();

    return () => {
      cancelled = true;
    };
  }, [updateNotes]);

  useEffect(() => {
    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, []);

  const selected = notes.find((note) => note.id === selectedId) ?? null;

  const filtered = notes.filter((note) => {
    if (selectedFolderId !== null && note.folderId !== selectedFolderId) {
      return false;
    }

    const term = search.trim().toLowerCase();
    return !term ||
      note.title.toLowerCase().includes(term) ||
      note.content.toLowerCase().includes(term);
  });

  function scheduleSave(note: Note) {
    pendingRef.current = note;
    setSaveState("unsaved");

    if (timerRef.current) clearTimeout(timerRef.current);

    timerRef.current = setTimeout(() => {
      void persist();
    }, 900);
  }

  function editSelected(field: "title" | "content", value: string) {
    if (!selected || busy) return;

    const updated = {
      ...selected,
      [field]: value,
      updatedAt: new Date().toISOString(),
    };

    updateNotes(
      notesRef.current.map((note) =>
        note.id === updated.id ? updated : note
      )
    );

    scheduleSave(updated);
  }

  async function flushPending() {
    if (timerRef.current) clearTimeout(timerRef.current);

    if (savingRef.current) return false;

    if (pendingRef.current) {
      const note = pendingRef.current;
      pendingRef.current = null;
      savingRef.current = true;
      setSaveState("saving");

      try {
        await saveNote(note);
        setSaveState("saved");
        setError("");
      } catch {
        pendingRef.current = note;
        setSaveState("error");
        setError("Could not save changes. Please retry.");
        return false;
      } finally {
        savingRef.current = false;
      }
    }

    return true;
  }

  async function selectNote(id: string) {
    if (busy || savingRef.current) return;
    if (!(await flushPending())) return;

    selectedRef.current = id;
    setSelectedId(id);
    setSaveState("saved");
  }

  async function selectFolder(folderId: string | null) {
    if (busy || savingRef.current || !storageReady) return;
    if (!(await flushPending())) return;

    setSelectedFolderId(folderId);
    setSearch("");
    selectedRef.current = null;
    setSelectedId(null);
    setSaveState("saved");
  }

  async function moveSelectedToFolder(folderId: string | null) {
    if (!selected || busy || savingRef.current) return;
    if (selected.folderId === folderId) return;
    if (!(await flushPending())) return;

    const current = notesRef.current.find((note) => note.id === selected.id);
    if (!current) return;

    const updatedNote: Note = {
      ...current,
      folderId,
      updatedAt: new Date().toISOString(),
    };

    setBusy(true);
    setSaveState("saving");

    try {
      await saveNote(updatedNote);

      updateNotes(notesRef.current.map((note) =>
        note.id === updatedNote.id ? updatedNote : note
      ));

      if (
        selectedFolderId !== null &&
        updatedNote.folderId !== selectedFolderId
      ) {
        selectedRef.current = null;
        setSelectedId(null);
      }

      setSaveState("saved");
      setError("");
    } catch {
      setSaveState("error");
      setError("Could not move note. Please try again.");
    } finally {
      setBusy(false);
    }
  }

  async function createFolder() {
    if (!storageReady || loading || busy || savingRef.current) return;

    const name = folderName.trim();
    if (!name) return;

    if (name.length > 100) {
      setError("Folder names must be 100 characters or fewer.");
      return;
    }

    if (folders.some((folder) =>
      folder.name.toLowerCase() === name.toLowerCase()
    )) {
      setError("A folder with that name already exists.");
      return;
    }

    if (!(await flushPending())) return;

    const folder: Folder = {
      id: crypto.randomUUID(),
      name,
      sortOrder: folders.length,
    };

    setBusy(true);

    try {
      await saveFolder(folder);
      setFolders((current) => [...current, folder]);
      setFolderName("");
      setCreatingFolder(false);
      setError("");
    } catch {
      setError("Could not create folder. Please try again.");
    } finally {
      setBusy(false);
    }
  }

  async function createNote() {
    if (!storageReady || busy || savingRef.current) return;
    if (!(await flushPending())) return;

    setBusy(true);

    const now = new Date().toISOString();
    const note: Note = {
      id: crypto.randomUUID(),
      folderId: selectedFolderId,
      title: "",
      content: "",
      createdAt: now,
      updatedAt: now,
    };

    try {
      await saveNote(note);
      updateNotes([note, ...notesRef.current]);
      selectedRef.current = note.id;
      setSelectedId(note.id);
      setSaveState("saved");
      setError("");
    } catch {
      setError("Could not create note. Please check Notes storage.");
    } finally {
      setBusy(false);
    }
  }

  async function removeSelected() {
    if (!selected || busy || savingRef.current) return;

    if (!window.confirm("Delete this note?")) return;

    if (timerRef.current) clearTimeout(timerRef.current);
    pendingRef.current = null;

    setBusy(true);

    try {
      await deleteNote(selected.id);

      updateNotes(
        notesRef.current.filter((note) => note.id !== selected.id)
      );

      selectedRef.current = null;
      setSelectedId(null);
      setSaveState("saved");
      setError("");
    } catch {
      setError("Could not delete note.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <section className="ml-v2-notes-workspace" aria-label="Notes workspace">
      <div className="ml-v2-notes-layout">
        <aside className="ml-v2-notes-folders" aria-label="Note folders">
          <div className="ml-v2-notes-panel-heading">
            <strong>Folders</strong>
            <button
              type="button"
              onClick={() => setCreatingFolder((current) => !current)}
              disabled={!storageReady || loading || busy || savingRef.current}
              title="Create a folder"
              className="ml-v2-icon-button"
              aria-label="New folder"
            >
              <Plus size={18} />
            </button>
          </div>

          {creatingFolder && (
            <form
              onSubmit={(event) => {
                event.preventDefault();
                void createFolder();
              }}
              style={{ display: "grid", gap: 8, marginBottom: 14 }}
            >
              <input
                type="text"
                value={folderName}
                onChange={(event) => setFolderName(event.target.value)}
                placeholder="Folder name"
                aria-label="Folder name"
                maxLength={100}
                autoFocus
                style={{
                  width: "100%",
                  minWidth: 0,
                  padding: "9px 10px",
                  border: "1px solid #ded6ee",
                  borderRadius: 9,
                }}
              />
              <div style={{ display: "flex", gap: 8 }}>
                <button
                  type="submit"
                  className="ml-v2-add-button"
                  disabled={!folderName.trim() || busy}
                >
                  Create
                </button>
                <button
                  type="button"
                  className="ml-v2-notes-secondary-button"
                  onClick={() => {
                    setCreatingFolder(false);
                    setFolderName("");
                  }}
                >
                  Cancel
                </button>
              </div>
            </form>
          )}

          <div className="ml-v2-notes-folder-list">
            <button
              type="button"
              className={
                "ml-v2-nav-item ml-v2-notes-folder-entry" +
                (selectedFolderId === null ? " is-active" : "")
              }
              onClick={() => void selectFolder(null)}
              disabled={!storageReady || loading || busy || savingRef.current}
              aria-pressed={selectedFolderId === null}
            >
              <FolderOpen size={18} />
              <span>All Notes ({notes.length})</span>
            </button>

            {folders.map((folder) => (
              <button
                type="button"
                className={
                  "ml-v2-nav-item ml-v2-notes-folder-entry" +
                  (selectedFolderId === folder.id ? " is-active" : "")
                }
                key={folder.id}
                onClick={() => void selectFolder(folder.id)}
                disabled={!storageReady || loading || busy || savingRef.current}
                aria-pressed={selectedFolderId === folder.id}
              >
                <FolderOpen size={17} />
                <span>
                  {folder.name} ({notes.filter(
                    (note) => note.folderId === folder.id
                  ).length})
                </span>
              </button>
            ))}
          </div>

          {!folders.length && (
            <p className="ml-v2-notes-muted">
              Your folders will appear here.
            </p>
          )}
        </aside>

        <div className="ml-v2-notes-main">
          <div className="ml-v2-notes-main-actions">
            <button
              type="button"
              onClick={() => void createNote()}
              className="ml-v2-add-button"
              disabled={!storageReady || loading || busy || savingRef.current}
            >
              <Plus size={17} />
              New Note
            </button>
          </div>

          <label className="ml-v2-notes-search">
            <Search size={17} />
            <input
              type="search"
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Search your notes..."
              aria-label="Search notes"
              style={{
                flex: 1,
                border: 0,
                outline: "none",
                background: "transparent",
                minWidth: 0,
              }}
            />
          </label>

          {error && (
            <p role="alert" style={{ color: "#b42318", marginTop: 12 }}>
              {error}
            </p>
          )}

          {loading ? (
            <p className="ml-v2-notes-muted">Loading Notes...</p>
          ) : !storageReady ? (
            <div className="ml-v2-notes-empty">
              <div className="ml-v2-notes-empty-icon">
                <NotebookPen size={31} />
              </div>
              <h2>Notes storage is not ready</h2>
              <p>
                The Notes editor is installed. Database setup is required
                before creating or saving notes.
              </p>
            </div>
          ) : (
            <div className="ml-v2-notes-editor-layout">
              <div className="ml-v2-notes-list" aria-label="Saved notes">
                {filtered.map((note) => (
                  <button
                    type="button"
                    key={note.id}
                    className={
                      "ml-v2-notes-list-item" +
                      (selectedId === note.id ? " is-selected" : "")
                    }
                    onClick={() => void selectNote(note.id)}
                    disabled={busy || savingRef.current}
                  >
                    <strong>{note.title || "Untitled Note"}</strong>
                    <span>
                      {note.content.replace(/<[^>]*>/g, "").slice(0, 90) ||
                        "Empty note"}
                    </span>
                  </button>
                ))}

                {!filtered.length && (
                  <p className="ml-v2-notes-muted">
                    {search ? "No matching notes." : "No notes yet."}
                  </p>
                )}
              </div>

              {selected ? (
                <div className="ml-v2-notes-editor">
                  <div className="ml-v2-notes-editor-top">
                    <label
                      className="ml-v2-notes-move-label"
                      title="Move note to folder"
                    >
                      Folder
                      <select
                        aria-label="Move note to folder"
                        value={selected.folderId ?? ""}
                        onChange={(event) =>
                          void moveSelectedToFolder(event.target.value || null)
                        }
                        disabled={busy || savingRef.current}
                      >
                        <option value="">All Notes / Unfiled</option>
                        {folders.map((folder) => (
                          <option key={folder.id} value={folder.id}>
                            {folder.name}
                          </option>
                        ))}
                      </select>
                    </label>
                    <span aria-live="polite">
                      {saveState === "saved" && "Saved"}
                      {saveState === "saving" && "Saving..."}
                      {saveState === "unsaved" && "Unsaved changes"}
                      {saveState === "error" && "Save failed"}
                    </span>

                    {saveState === "error" && (
                      <button
                        type="button"
                        onClick={() => void flushPending()}
                      >
                        Retry Save
                      </button>
                    )}

                    <button
                      type="button"
                      onClick={() => void removeSelected()}
                      disabled={busy || savingRef.current}
                      title="Delete note"
                      aria-label="Delete note"
                    >
                      <Trash2 size={17} />
                    </button>
                  </div>

                  <input
                    className="ml-v2-notes-title-input"
                    aria-label="Note title"
                    placeholder="Untitled Note"
                    value={selected.title}
                    onChange={(event) =>
                      editSelected("title", event.target.value)
                    }
                    maxLength={250}
                  />

                  <textarea
                    className="ml-v2-notes-content-input"
                    aria-label="Note content"
                    placeholder="Start writing your note..."
                    value={selected.content}
                    onChange={(event) =>
                      editSelected("content", event.target.value)
                    }
                    maxLength={500000}
                  />
                </div>
              ) : (
                <div className="ml-v2-notes-empty">
                  <div className="ml-v2-notes-empty-icon">
                    <NotebookPen size={31} />
                  </div>
                  <h2>Your Notes workspace is ready</h2>
                  <p>
                    Create a new note or select an existing note to begin.
                  </p>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </section>
  );
}
