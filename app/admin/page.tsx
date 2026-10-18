"use client";

import { useCallback, useEffect, useState, type ChangeEvent, type FormEvent } from "react";
import Link from "next/link";
import {
  ArrowLeft, ArrowUpRight, Check, FileText, FolderKanban, LayoutDashboard, LoaderCircle,
  ImagePlus, LogOut, Mail, MessageSquareQuote, Plus, Save, ShieldCheck, Trash2, UserRound,
} from "lucide-react";
import type { Message, Profile, Project, Service, Testimonial } from "@/lib/portfolio-data";

type Tab = "profile" | "services" | "projects" | "testimonials" | "messages";
type ContentState = { profile: Profile; services: Service[]; projects: Project[]; testimonials: Testimonial[]; messages: Message[] };
type Draft = Record<string, string | number | boolean | string[] | undefined>;

const tabs: { id: Tab; label: string; icon: typeof LayoutDashboard }[] = [
  { id: "profile", label: "Profil", icon: UserRound },
  { id: "services", label: "Layanan", icon: LayoutDashboard },
  { id: "projects", label: "Proyek", icon: FolderKanban },
  { id: "testimonials", label: "Testimoni", icon: MessageSquareQuote },
  { id: "messages", label: "Pesan masuk", icon: Mail },
];

const defaults: Record<Exclude<Tab, "messages">, Draft> = {
  profile: { name: "Nama Kamu", role: "Full-stack Developer & UI Designer", headline: "Membangun pengalaman digital yang terasa berbeda.", bio: "", location: "Indonesia", email: "halo@example.com", whatsapp: "", availability: "Terbuka untuk proyek baru", yearsExperience: 4, projectsCompleted: 0, clientsSatisfied: 0, avatarUrl: "", resumeUrl: "", githubUrl: "", linkedinUrl: "", instagramUrl: "" },
  services: { title: "Layanan baru", description: "", icon: "code", priceLabel: "Diskusikan kebutuhan", features: ["Responsif", "Mudah digunakan"], sortOrder: 1 },
  projects: { title: "Proyek baru", category: "Web App", description: "", imageUrl: "", demoUrl: "", repoUrl: "", tags: ["Next.js"], coverStyle: "violet", featured: false, sortOrder: 1 },
  testimonials: { name: "Nama klien", role: "Jabatan", company: "", content: "", avatarUrl: "", rating: 5, sortOrder: 1 },
};

const fields: Record<Exclude<Tab, "messages">, { key: string; label: string; kind?: "textarea" | "number" | "select" | "tags"; options?: string[]; hint?: string }[]> = {
  profile: [
    { key: "name", label: "Nama yang ditampilkan" }, { key: "role", label: "Profesi / role" }, { key: "headline", label: "Headline beranda" },
    { key: "bio", label: "Tentang saya", kind: "textarea" }, { key: "location", label: "Lokasi" }, { key: "email", label: "Email" },
    { key: "whatsapp", label: "Nomor WhatsApp (opsional)" }, { key: "availability", label: "Status ketersediaan" },
    { key: "yearsExperience", label: "Tahun pengalaman", kind: "number" }, { key: "projectsCompleted", label: "Jumlah proyek", kind: "number" }, { key: "clientsSatisfied", label: "Jumlah klien", kind: "number" },
    { key: "avatarUrl", label: "Foto profil hero", hint: "Upload file foto atau gunakan URL. Kosongkan untuk monogram." }, { key: "resumeUrl", label: "URL CV (opsional)" },
    { key: "githubUrl", label: "URL GitHub" }, { key: "linkedinUrl", label: "URL LinkedIn" }, { key: "instagramUrl", label: "URL Instagram" },
  ],
  services: [
    { key: "title", label: "Nama layanan" }, { key: "description", label: "Deskripsi", kind: "textarea" },
    { key: "icon", label: "Ikon", kind: "select", options: ["code", "palette", "layers", "rocket", "workflow", "monitor"] },
    { key: "priceLabel", label: "Label harga" }, { key: "features", label: "Fitur (pisahkan dengan koma)", kind: "tags", hint: "Contoh: Responsive design, SEO, Maintenance" }, { key: "sortOrder", label: "Urutan tampil", kind: "number" },
  ],
  projects: [
    { key: "title", label: "Nama proyek" }, { key: "category", label: "Kategori" }, { key: "description", label: "Deskripsi", kind: "textarea" },
    { key: "imageUrl", label: "Gambar cover proyek", hint: "Upload gambar cover atau gunakan URL. Jika kosong, preview abstrak akan digunakan." }, { key: "demoUrl", label: "URL demo" }, { key: "repoUrl", label: "URL repositori" },
    { key: "tags", label: "Teknologi / tag (pisahkan dengan koma)", kind: "tags" }, { key: "coverStyle", label: "Warna preview", kind: "select", options: ["violet", "orange", "blue", "green", "pink"] },
    { key: "featured", label: "Tandai sebagai proyek unggulan", kind: "select", options: ["true", "false"] }, { key: "sortOrder", label: "Urutan tampil", kind: "number" },
  ],
  testimonials: [
    { key: "name", label: "Nama klien" }, { key: "role", label: "Jabatan" }, { key: "company", label: "Perusahaan" }, { key: "content", label: "Isi testimoni", kind: "textarea" },
    { key: "avatarUrl", label: "Foto klien", hint: "Upload file foto klien atau gunakan URL foto (opsional)." }, { key: "rating", label: "Rating (1–5)", kind: "number" }, { key: "sortOrder", label: "Urutan tampil", kind: "number" },
  ],
};

function toDraft(item: Record<string, unknown>): Draft {
  const draft: Draft = {};
  for (const [key, value] of Object.entries(item)) {
    if (key === "createdAt" || key === "updatedAt") continue;
    if (Array.isArray(value)) draft[key] = value.map(String).join(", ");
    else if (typeof value === "string" || typeof value === "number" || typeof value === "boolean" || value === undefined) draft[key] = value as string | number | boolean | undefined;
  }
  return draft;
}

function displayName(tab: Tab, item: Record<string, unknown>) {
  if (tab === "profile") return String(item.name ?? "Profil saya");
  if (tab === "services" || tab === "projects") return String(item.title ?? "Tanpa judul");
  if (tab === "testimonials") return String(item.name ?? "Testimoni");
  return String(item.name ?? "Pesan masuk");
}

function ImageUploadField({
  label,
  fieldKey,
  value,
  onChange,
  folder,
  aspect = "portrait",
  uploadLabel = "Upload gambar",
  changeLabel = "Ganti gambar",
  hint = "JPG, PNG, atau WebP · Maksimal 10 MB.",
  fallbackLabel = "Atau gunakan URL gambar",
  fallbackPlaceholder = "https://contoh.com/gambar.jpg",
}: {
  label: string;
  fieldKey: string;
  value: Draft[string];
  onChange: (key: string, value: string) => void;
  folder: "profile" | "projects" | "testimonials";
  aspect?: "portrait" | "landscape" | "square";
  uploadLabel?: string;
  changeLabel?: string;
  hint?: string;
  fallbackLabel?: string;
  fallbackPlaceholder?: string;
}) {
  const [processing, setProcessing] = useState(false);
  const [uploadError, setUploadError] = useState("");
  const imageValue = typeof value === "string" ? value : "";
  const isEmbeddedImage = imageValue.startsWith("data:image/");

  async function handleFile(event: ChangeEvent<HTMLInputElement>) {
    const file = event.currentTarget.files?.[0];
    event.currentTarget.value = "";
    if (!file) return;
    setUploadError("");
    if (!["image/jpeg", "image/png", "image/webp"].includes(file.type)) {
      setUploadError("Gunakan file JPG, PNG, atau WebP.");
      return;
    }
    if (file.size > 10 * 1024 * 1024) {
      setUploadError("Ukuran file maksimal 10 MB.");
      return;
    }

    setProcessing(true);
    try {
      const maxW = aspect === "landscape" ? 1600 : 960;
      const maxH = aspect === "landscape" ? 1100 : aspect === "square" ? 960 : 1200;

      const bitmap = await createImageBitmap(file);
      const scale = Math.min(1, maxW / bitmap.width, maxH / bitmap.height);
      const canvas = document.createElement("canvas");
      canvas.width = Math.max(1, Math.round(bitmap.width * scale));
      canvas.height = Math.max(1, Math.round(bitmap.height * scale));
      const context = canvas.getContext("2d");
      if (!context) throw new Error("Browser tidak dapat memproses gambar ini.");

      const isPng = file.type === "image/png";
      if (!isPng) {
        context.fillStyle = "#0c0f1e";
        context.fillRect(0, 0, canvas.width, canvas.height);
      }
      context.drawImage(bitmap, 0, 0, canvas.width, canvas.height);
      bitmap.close();

      const outputMime = isPng ? "image/png" : "image/jpeg";
      const quality = isPng ? undefined : 0.86;

      const blob = await new Promise<Blob>((resolve, reject) =>
        canvas.toBlob((result) => (result ? resolve(result) : reject(new Error("Gambar gagal dikompresi."))), outputMime, quality)
      );

      const ext = isPng ? "png" : "jpg";
      const fileName = `${folder}-${Date.now()}.${ext}`;

      const form = new FormData();
      form.append("file", new File([blob], fileName, { type: outputMime }));
      form.append("folder", folder);

      const response = await fetch("/api/admin/upload", { method: "POST", body: form });
      const result = await response.json();
      if (!response.ok) throw new Error(result.error ?? "Upload ke Storage gagal.");
      onChange(fieldKey, result.url);
    } catch (error) {
      setUploadError(error instanceof Error ? error.message : "Gambar gagal diproses.");
    } finally {
      setProcessing(false);
    }
  }

  const previewClass = `avatar-upload-preview ${aspect === "landscape" ? "is-landscape" : aspect === "square" ? "is-square" : ""}`;

  return (
    <div className="admin-field field-full avatar-upload-field">
      <span>{label}</span>
      <div className="avatar-upload-control">
        <div className={previewClass}>
          {imageValue ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={imageValue} alt={`Pratinjau ${label}`} />
          ) : aspect === "landscape" ? (
            <FolderKanban size={28} />
          ) : (
            <UserRound size={28} />
          )}
        </div>
        <div className="avatar-upload-actions">
          <label className={`avatar-upload-select ${processing ? "is-busy" : ""}`}>
            <input type="file" accept="image/jpeg,image/png,image/webp" onChange={handleFile} disabled={processing} />
            {processing ? <span className="upload-spinner" /> : <ImagePlus size={15} />}
            {processing ? "Memproses gambar..." : imageValue ? changeLabel : uploadLabel}
          </label>
          {imageValue && (
            <button
              className="avatar-remove-button"
              type="button"
              onClick={() => {
                onChange(fieldKey, "");
                setUploadError("");
              }}
            >
              Hapus gambar
            </button>
          )}
          <small>{hint}</small>
        </div>
      </div>
      <label className="avatar-url-fallback">
        <span>{fallbackLabel}</span>
        <input
          type="url"
          value={isEmbeddedImage ? "" : imageValue}
          onChange={(event) => onChange(fieldKey, event.target.value)}
          placeholder={fallbackPlaceholder}
        />
      </label>
      {uploadError && <small className="avatar-upload-error" role="alert">{uploadError}</small>}
    </div>
  );
}

function Field({ field, value, onChange }: { field: { key: string; label: string; kind?: string; options?: string[]; hint?: string }; value: string | number | boolean | string[] | undefined; onChange: (key: string, value: string | number | boolean) => void }) {
  const displayValue = field.kind === "tags" ? (Array.isArray(value) ? value.join(", ") : String(value ?? "")) : String(value ?? "");
  return <label className={`admin-field ${field.kind === "textarea" ? "field-full" : ""}`}><span>{field.label}</span>{field.kind === "textarea" ? <textarea value={displayValue} rows={4} onChange={(event) => onChange(field.key, event.target.value)} /> : field.kind === "select" ? <select value={displayValue} onChange={(event) => onChange(field.key, field.key === "featured" ? event.target.value === "true" : event.target.value)}>{(field.options ?? []).map((option) => <option value={option} key={option}>{field.key === "featured" ? (option === "true" ? "Ya, unggulan" : "Tidak") : option}</option>)}</select> : <input type={field.kind === "number" ? "number" : "text"} value={displayValue} onChange={(event) => onChange(field.key, field.kind === "number" ? Number(event.target.value) : event.target.value)} />}{field.hint && <small>{field.hint}</small>}</label>;
}

export default function AdminPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [authenticated, setAuthenticated] = useState(false);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [content, setContent] = useState<ContentState | null>(null);
  const [tab, setTab] = useState<Tab>("projects");
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [draft, setDraft] = useState<Draft>(defaults.projects);
  const [isNew, setIsNew] = useState(false);

  const reloadContent = useCallback(async () => {
    setLoading(true);
    try {
      const response = await fetch("/api/admin/content", { cache: "no-store" });
      const result = await response.json();
      if (!response.ok) throw new Error(result.error ?? "Tidak dapat memuat dashboard.");
      setContent(result as ContentState);
      setAuthenticated(true);
      const collection = tab === "messages" ? result.messages : tab === "profile" ? [result.profile] : result[tab];
      const first = Array.isArray(collection) ? collection[0] : collection;
      if (first) {
        setSelectedId(first.id ?? "main");
        setDraft(toDraft(first as Record<string, unknown>));
        setIsNew(false);
      } else if (tab !== "messages" && tab !== "profile") {
        setSelectedId(null);
        setDraft(defaults[tab]);
        setIsNew(true);
      }
      setError("");
    } catch (err) {
      if (err instanceof Error && err.message.includes("Sesi admin")) setAuthenticated(false);
      setError(err instanceof Error ? err.message : "Terjadi kesalahan.");
    } finally {
      setLoading(false);
    }
  }, [tab]);

  useEffect(() => {
    let cancelled = false;
    fetch("/api/admin/content", { cache: "no-store" }).then(async (response) => {
      if (!response.ok) return;
      const result = await response.json() as ContentState;
      if (cancelled) return;
      setContent(result);
      setAuthenticated(true);
      const initialTab: Tab = "projects";
      const list = result[initialTab];
      if (list[0]) { setSelectedId(list[0].id); setDraft(toDraft(list[0] as unknown as Record<string, unknown>)); }
    }).catch(() => {}).finally(() => { if (!cancelled) setLoading(false); });
    return () => { cancelled = true; };
  }, []);

  function selectTab(nextTab: Tab) {
    setTab(nextTab);
    setNotice(""); setError("");
    if (!content) return;
    if (nextTab === "messages") { setSelectedId(null); setDraft({}); setIsNew(false); return; }
    if (nextTab === "profile") { setSelectedId("main"); setDraft(toDraft(content.profile as unknown as Record<string, unknown>)); setIsNew(false); return; }
    const first = content[nextTab][0] as unknown as Record<string, unknown> | undefined;
    if (first) { setSelectedId(String(first.id)); setDraft(toDraft(first)); setIsNew(false); }
    else { setSelectedId(null); setDraft(defaults[nextTab]); setIsNew(true); }
  }

  function selectRecord(item: Record<string, unknown>) {
    setSelectedId(String(item.id ?? "main")); setDraft(toDraft(item)); setIsNew(false); setNotice(""); setError("");
  }

  function addNew() {
    if (tab === "messages" || tab === "profile") return;
    setSelectedId(null); setDraft({ ...defaults[tab] }); setIsNew(true); setNotice(""); setError("");
  }

  function updateDraft(key: string, value: string | number | boolean) {
    setDraft((current) => ({ ...current, [key]: value }));
  }

  async function login(event: FormEvent<HTMLFormElement>) {
    event.preventDefault(); setBusy(true); setError("");
    try {
      const response = await fetch("/api/admin/login", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ email, password }) });
      const result = await response.json();
      if (!response.ok) throw new Error(result.error ?? "Login gagal.");
      setAuthenticated(true); setPassword(""); await reloadContent();
    } catch (err) { setError(err instanceof Error ? err.message : "Login gagal."); }
    finally { setBusy(false); }
  }

  async function saveDraft(event: FormEvent<HTMLFormElement>) {
    event.preventDefault(); if (tab === "messages") return;
    setBusy(true); setError(""); setNotice("");
    const bodyDraft: Record<string, unknown> = { ...draft };
    if (tab === "services" && typeof bodyDraft.features === "string") bodyDraft.features = bodyDraft.features.split(",").map((part) => part.trim()).filter(Boolean);
    if (tab === "projects" && typeof bodyDraft.tags === "string") bodyDraft.tags = bodyDraft.tags.split(",").map((part) => part.trim()).filter(Boolean);
    if (selectedId && !isNew && tab !== "profile") bodyDraft.id = selectedId;
    try {
      const response = await fetch("/api/admin/content", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ type: tab, data: bodyDraft }) });
      const result = await response.json();
      if (!response.ok) throw new Error(result.error ?? "Konten gagal disimpan.");
      setNotice("Perubahan berhasil disimpan.");
      await reloadContent();
    } catch (err) { setError(err instanceof Error ? err.message : "Konten gagal disimpan."); }
    finally { setBusy(false); }
  }

  async function deleteRecord(id: string, type = tab) {
    if (!window.confirm("Hapus data ini? Tindakan ini tidak bisa dibatalkan.")) return;
    setBusy(true); setError(""); setNotice("");
    try {
      const response = await fetch("/api/admin/content", { method: "DELETE", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ type, id }) });
      const result = await response.json();
      if (!response.ok) throw new Error(result.error ?? "Data gagal dihapus.");
      setNotice("Data berhasil dihapus."); await reloadContent();
    } catch (err) { setError(err instanceof Error ? err.message : "Data gagal dihapus."); }
    finally { setBusy(false); }
  }

  async function logout() {
    await fetch("/api/admin/login", { method: "DELETE" });
    setAuthenticated(false); setContent(null); setNotice(""); setError("");
  }

  const selectedItems = content && tab !== "profile" && tab !== "messages" ? content[tab] : [];
  const currentTypeLabel = tabs.find((item) => item.id === tab)?.label ?? "Dashboard";

  if (!authenticated) {
    return <main className="admin-login-page"><div className="admin-login-glow" /><Link href="/" className="admin-back-link"><ArrowLeft size={15} /> Kembali ke portofolio</Link><form className="admin-login-card glass-panel" onSubmit={login}><div className="admin-login-logo"><ShieldCheck size={24} /></div><span className="admin-overline">PRIVATE WORKSPACE</span><h1>Selamat datang<br />di <span>dashboard.</span></h1><p>Masuk untuk memperbarui profil, karya, layanan, dan testimoni yang tampil di website.</p><label className="admin-field"><span>Email admin Supabase</span><input type="email" value={email} onChange={(event) => setEmail(event.target.value)} placeholder="admin@example.com" required autoComplete="username" /></label><label className="admin-field"><span>Password admin</span><input type="password" value={password} onChange={(event) => setPassword(event.target.value)} placeholder="Masukkan password" required autoComplete="current-password" /></label>{error && <div className="admin-alert error">{error}</div>}<button className="admin-primary-button" type="submit" disabled={busy}>{busy ? <LoaderCircle size={16} className="spin" /> : <ShieldCheck size={16} />}{busy ? "Memeriksa..." : "Masuk dashboard"}<ArrowUpRight size={15} /></button><div className="admin-login-foot"><ShieldCheck size={13} /> Login dikelola Supabase Auth dengan cookie sesi.</div></form></main>;
  }

  return <main className="admin-app"><aside className="admin-sidebar"><Link href="/" className="admin-sidebar-brand"><span className="brand-symbol">LG</span><span><b>Liquid Glass</b><small>PORTFOLIO CMS</small></span></Link><div className="admin-sidebar-label">WORKSPACE</div><nav className="admin-side-nav">{tabs.map((item) => { const Icon = item.icon; const count = item.id === "messages" ? (content?.messages.length ?? 0) : 0; return <button key={item.id} type="button" className={tab === item.id ? "selected" : ""} onClick={() => selectTab(item.id)}><Icon size={17} /><span>{item.label}</span>{count > 0 && <i>{count}</i>}</button>; })}</nav><div className="admin-sidebar-bottom"><div className="admin-status"><span /><div><b>Database aktif</b><small>Supabase · PostgreSQL</small></div></div><button type="button" className="admin-logout" onClick={logout}><LogOut size={15} /> Keluar</button><Link href="/" className="admin-view-site"><ArrowLeft size={14} /> Lihat website</Link></div></aside>
    <section className="admin-main"><header className="admin-topbar"><div><span className="admin-overline">CONTENT MANAGEMENT</span><h1>{tab === "profile" ? "Profil pribadi" : currentTypeLabel}</h1></div><Link href="/" target="_blank" className="admin-open-site">Buka website <ArrowUpRight size={14} /></Link></header>
      {loading && <div className="admin-loading"><LoaderCircle size={20} className="spin" /> Memuat data...</div>}
      {!loading && error && <div className="admin-alert error">{error}</div>}
      {!loading && notice && <div className="admin-alert success"><Check size={15} />{notice}</div>}
      {!loading && content && tab === "messages" && <div className="admin-messages-list">{content.messages.length ? content.messages.map((message) => <article className="admin-message-card glass-panel" key={message.id}><div className="message-avatar">{message.name.split(" ").map((word) => word[0]).slice(0, 2).join("").toUpperCase()}</div><div className="message-main"><div className="message-heading"><div><h3>{message.name}</h3><a href={`mailto:${message.email}`}>{message.email}</a></div><span>{new Date(message.createdAt).toLocaleString("id-ID", { dateStyle: "medium", timeStyle: "short" })}</span></div>{message.service && <span className="message-service">{message.service}</span>}<p>{message.message}</p><div className="message-actions"><a href={`mailto:${message.email}?subject=${encodeURIComponent("Re: Pesan dari portofolio")}`}><Mail size={14} /> Balas email</a><button type="button" onClick={() => deleteRecord(message.id, "messages")}><Trash2 size={14} /> Hapus</button></div></div></article>) : <div className="admin-empty glass-panel"><Mail size={23} /><b>Belum ada pesan masuk</b><span>Pesan dari formulir kontak akan tampil di sini.</span></div>}</div>}
      {!loading && content && tab !== "messages" && <div className="admin-content-layout"><div className="admin-records glass-panel"><div className="admin-records-head"><div><span className="admin-overline">DAFTAR KONTEN</span><b>{tab === "profile" ? "Profil utama" : `${selectedItems.length} item tersimpan`}</b></div>{tab !== "profile" && <button type="button" onClick={addNew} aria-label="Tambah konten"><Plus size={17} /></button>}</div>{tab === "profile" ? <button type="button" className="admin-record selected" onClick={() => selectTab("profile")}><span className="record-dot" /><span><b>{content.profile.name}</b><small>Informasi pribadi & tautan</small></span></button> : selectedItems.map((item) => <button type="button" className={`admin-record ${selectedId === item.id && !isNew ? "selected" : ""}`} key={item.id} onClick={() => selectRecord(item as unknown as Record<string, unknown>)}><span className="record-dot" /><span><b>{displayName(tab, item as unknown as Record<string, unknown>)}</b><small>{tab === "projects" ? (item as Project).category : tab === "services" ? (item as Service).priceLabel : `${(item as Testimonial).rating}/5 rating`}</small></span><ArrowUpRight size={13} /></button>)}{tab !== "profile" && selectedItems.length === 0 && <div className="records-empty">Belum ada data. Tekan + untuk menambahkan.</div>}</div>
      <form className="admin-editor glass-panel" onSubmit={saveDraft}><div className="admin-editor-head"><div><span className="admin-overline">{isNew ? "BUAT KONTEN BARU" : "EDITOR KONTEN"}</span><h2>{isNew ? "Tambah item" : tab === "profile" ? "Detail profil" : "Edit konten"}</h2></div>{!isNew && tab !== "profile" && <button className="admin-delete-top" type="button" aria-label="Hapus item" onClick={() => selectedId && deleteRecord(selectedId)}><Trash2 size={16} /></button>}</div><div className="admin-fields-grid">{fields[tab as Exclude<Tab, "messages">].map((field) => {
        if (tab === "profile" && field.key === "avatarUrl") {
          return (
            <ImageUploadField
              key={field.key}
              fieldKey={field.key}
              label="Foto profil hero"
              value={draft[field.key]}
              onChange={updateDraft}
              folder="profile"
              aspect="portrait"
              uploadLabel="Upload foto profil"
              changeLabel="Ganti foto profil"
              hint="JPG, PNG, atau WebP · Maksimal 10 MB. Foto akan dioptimasi otomatis."
              fallbackLabel="Atau gunakan URL foto profil"
              fallbackPlaceholder="https://contoh.com/foto.jpg"
            />
          );
        }
        if (tab === "projects" && field.key === "imageUrl") {
          return (
            <ImageUploadField
              key={field.key}
              fieldKey={field.key}
              label="Gambar cover proyek"
              value={draft[field.key]}
              onChange={updateDraft}
              folder="projects"
              aspect="landscape"
              uploadLabel="Upload gambar cover"
              changeLabel="Ganti gambar cover"
              hint="JPG, PNG, atau WebP · Rekomendasi rasio 16:9. Gambar akan dioptimasi otomatis."
              fallbackLabel="Atau gunakan URL gambar cover"
              fallbackPlaceholder="https://contoh.com/project-cover.jpg"
            />
          );
        }
        if (tab === "testimonials" && field.key === "avatarUrl") {
          return (
            <ImageUploadField
              key={field.key}
              fieldKey={field.key}
              label="Foto klien testimoni"
              value={draft[field.key]}
              onChange={updateDraft}
              folder="testimonials"
              aspect="square"
              uploadLabel="Upload foto klien"
              changeLabel="Ganti foto klien"
              hint="JPG, PNG, atau WebP · Rekomendasi rasio 1:1. Foto akan dioptimasi otomatis."
              fallbackLabel="Atau gunakan URL foto klien"
              fallbackPlaceholder="https://contoh.com/client.jpg"
            />
          );
        }
        return <Field key={field.key} field={field} value={draft[field.key]} onChange={updateDraft} />;
      })}</div><div className="admin-editor-footer"><span><ShieldCheck size={13} /> Perubahan disimpan ke database</span><button className="admin-primary-button" type="submit" disabled={busy}>{busy ? <LoaderCircle size={15} className="spin" /> : <Save size={15} />}{busy ? "Menyimpan..." : "Simpan perubahan"}</button></div></form></div>}
      <div className="admin-help-note"><FileText size={15} /><span>Perubahan konten akan tampil di website setelah berhasil disimpan. Pastikan URL gambar dan tautan yang dimasukkan valid.</span></div>
    </section></main>;
}
