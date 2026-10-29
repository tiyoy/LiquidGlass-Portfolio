"use client";

import {
  useEffect,
  useMemo,
  useState,
  type FormEvent,
  type ReactNode,
} from "react";
import {
  ArrowDownRight,
  ArrowRight,
  ArrowUpRight,
  CheckCircle2,
  Code2,
  Github,
  Globe2,
  House,
  Layers3,
  Linkedin,
  Mail,
  MapPin,
  MessageCircle,
  MonitorSmartphone,
  Palette,
  PanelsTopLeft,
  Rocket,
  Send,
  ShieldCheck,
  Sparkles,
  Star,
  UserRound,
  Workflow,
  Instagram,
} from "lucide-react";
import dynamic from "next/dynamic";
import {
  initialData,
  type Project,
  type Service,
  type SiteData,
} from "@/lib/portfolio-data";
import {
  buildLanyardArt,
  revokeLanyardArt,
  type LanyardArt,
} from "@/lib/lanyard-art";
import LoadingScreen from "@/components/LoadingScreen";
import { computeLoaderTarget, isLoaderComplete } from "@/lib/loader-progress";

// Lanyard 3D (three.js) dimuat belakangan & hanya di browser, supaya halaman tetap cepat tampil.
const Lanyard = dynamic(() => import("./Lanyard"), { ssr: false });

const wait = (ms: number) =>
  new Promise<void>((resolve) => setTimeout(resolve, ms));

const navItems = [
  { id: "home", label: "Beranda", icon: House },
  { id: "about", label: "Tentang Saya", icon: UserRound },
  { id: "services", label: "Layanan", icon: Layers3 },
  { id: "portfolio", label: "Portofolio", icon: PanelsTopLeft },
  { id: "testimonials", label: "Testimoni", icon: MessageCircle },
];

const serviceIcon = (name: string) => {
  if (name === "palette") return Palette;
  if (name === "layers") return Layers3;
  if (name === "rocket") return Rocket;
  if (name === "workflow") return Workflow;
  if (name === "monitor") return MonitorSmartphone;
  return Code2;
};

const projectThemes: Record<string, string> = {
  violet: "preview-violet",
  orange: "preview-orange",
  blue: "preview-blue",
  green: "preview-green",
  pink: "preview-pink",
};

function ProjectPreview({ project }: { project: Project }) {
  if (project.imageUrl) {
    return (
      <div
        className="project-image"
        style={{
          backgroundImage: `linear-gradient(180deg, transparent, rgba(8, 10, 24, .15)), url("${project.imageUrl.replaceAll('"', "")}")`,
        }}
        role="img"
        aria-label={`Preview ${project.title}`}
      />
    );
  }
  return (
    <div
      className={`project-preview ${projectThemes[project.coverStyle] ?? "preview-violet"}`}
      aria-label={`Ilustrasi ${project.title}`}
    >
      <div className="preview-window">
        <div className="preview-top">
          <i />
          <i />
          <i />
          <span>{project.category.toLowerCase().replaceAll(" ", "-")}.app</span>
        </div>
        <div className="preview-content">
          <div className="preview-sidebar">
            <b />
            <i />
            <i />
            <i />
            <i />
          </div>
          <div className="preview-main">
            <div className="preview-eyebrow">DIGITAL EXPERIENCE</div>
            <div className="preview-heading">{project.title}</div>
            <div className="preview-lines">
              <i />
              <i />
              <i />
            </div>
            <div className="preview-tiles">
              <i />
              <i />
              <i />
            </div>
          </div>
        </div>
      </div>
      <span className="preview-orb" />
      <span className="preview-orb preview-orb-two" />
    </div>
  );
}

function GlassSectionTitle({
  eyebrow,
  title,
  description,
}: {
  eyebrow: string;
  title: ReactNode;
  description?: string;
}) {
  return (
    <div className="section-title">
      <span className="eyebrow">
        <span className="eyebrow-dot" />
        {eyebrow}
      </span>
      <h2>{title}</h2>
      {description && <p>{description}</p>}
    </div>
  );
}

export default function PortfolioApp() {
  const [data, setData] = useState<SiteData>(initialData);
  const [active, setActive] = useState("home");
  const [filter, setFilter] = useState("Semua");
  const [formStatus, setFormStatus] = useState<{
    kind: "success" | "error";
    text: string;
  } | null>(null);
  const [sending, setSending] = useState(false);
  const [form, setForm] = useState({
    name: "",
    email: "",
    service: "",
    message: "",
    website: "",
  });
  const [lanyardArt, setLanyardArt] = useState<LanyardArt | null>(null);

  // --- Status loading screen: setiap tahap bernilai true kalau benar-benar sudah selesai ---
  const [fontsReady, setFontsReady] = useState(false);
  const [dataReady, setDataReady] = useState(false);
  const [imageProgress, setImageProgress] = useState<{
    done: number;
    total: number;
  } | null>(null);
  const [chunkReady, setChunkReady] = useState(false);
  const [artFor, setArtFor] = useState<SiteData["profile"] | null>(null);
  const [lanyardReady, setLanyardReady] = useState(false);
  const [forceDone, setForceDone] = useState(false);
  const [loaderGone, setLoaderGone] = useState(false);
  // Kartu lanyard sudah dibuat dari data profil yang sekarang (bukan data bawaan sebelum database terbaca)
  const artReady = artFor !== null && artFor === data.profile;
  // Lanyard baru dipasang setelah data final + kartunya siap, supaya "frame pertama" = tampilan final.
  const lanyardVisible =
    lanyardArt !== null && (loaderGone || (dataReady && artReady));

  // 1) Font situs
  useEffect(() => {
    let alive = true;
    const loading = Promise.all([
      document.fonts.load("800 32px Manrope"),
      document.fonts.load("600 16px 'DM Sans'"),
      document.fonts.load("500 14px 'DM Mono'"),
    ])
      .then(() => document.fonts.ready)
      .catch(() => undefined);
    Promise.race([loading, wait(5000)]).then(() => {
      if (alive) setFontsReady(true);
    });
    return () => {
      alive = false;
    };
  }, []);

  // 2) Kode lanyard 3D (three.js) mulai diunduh sejak awal, paralel dengan proses lain
  useEffect(() => {
    let alive = true;
    import("./Lanyard")
      .then(() => {
        if (alive) setChunkReady(true);
      })
      .catch(() => {
        if (alive) {
          setChunkReady(true);
          setLanyardReady(true);
        }
      });
    return () => {
      alive = false;
    };
  }, []);

  // Pengaman: kalau ada tahap yang macet (jaringan sangat lambat), layar tetap dibuka setelah 20 detik.
  useEffect(() => {
    const timer = window.setTimeout(() => setForceDone(true), 20000);
    return () => window.clearTimeout(timer);
  }, []);

  // Pengaman lanyard: kalau sinyal "siap" dari komponen Lanyard tidak datang, anggap siap setelah 3 detik.
  useEffect(() => {
    if (!lanyardVisible || lanyardReady) return;
    const timer = window.setTimeout(() => setLanyardReady(true), 3000);
    return () => window.clearTimeout(timer);
  }, [lanyardVisible, lanyardReady]);

  // 3) Gambar dari database (cover proyek & foto testimoni) dimuat dan di-decode sampai selesai.
  //    Foto profil dimuat saat kartu lanyard dibuat (buildLanyardArt menunggu fotonya).
  useEffect(() => {
    if (!dataReady) return;
    const urls = Array.from(
      new Set(
        [
          ...data.projects.map((project) => project.imageUrl),
          ...data.testimonials.map((item) => item.avatarUrl),
        ].filter((url): url is string => Boolean(url)),
      ),
    );
    let alive = true;
    let done = 0;
    queueMicrotask(() => {
      if (alive) setImageProgress({ done: 0, total: urls.length });
    });
    urls.forEach((url) => {
      const image = new Image();
      const finish = () => {
        if (!alive) return;
        done += 1;
        setImageProgress({ done, total: urls.length });
      };
      image.onload = () => {
        (image.decode ? image.decode() : Promise.resolve())
          .catch(() => undefined)
          .then(finish);
      };
      image.onerror = finish;
      image.src = url;
    });
    return () => {
      alive = false;
    };
  }, [dataReady, data.projects, data.testimonials]);

  // Gambar kartu & tali lanyard dibuat dari data profil, jadi ikut berubah saat profil diubah di admin.
  useEffect(() => {
    let cancelled = false;
    let made: LanyardArt | null = null;
    const profileData = data.profile;
    buildLanyardArt(profileData)
      .then((art) => {
        if (cancelled) {
          revokeLanyardArt(art);
          return;
        }
        made = art;
        setLanyardArt(art);
        setArtFor(profileData);
      })
      .catch(() => {
        // Kartu gagal dibuat: loading screen tidak menunggu lanyard.
        if (!cancelled) {
          setArtFor(profileData);
          setLanyardReady(true);
        }
      });
    return () => {
      cancelled = true;
      revokeLanyardArt(made);
    };
  }, [data.profile]);

  useEffect(() => {
    const selector =
      ".section-title, .about-story, .stat-card, .principle-card, .service-card, .project-card, .testimonial-card, .contact-form, .contact-copy";
    const nodes = Array.from(document.querySelectorAll<HTMLElement>(selector));
    if (!nodes.length) return;
    if (
      window.matchMedia("(prefers-reduced-motion: reduce)").matches ||
      !("IntersectionObserver" in window)
    ) {
      nodes.forEach((node) => node.classList.add("is-visible"));
      return;
    }
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add("is-visible");
            observer.unobserve(entry.target);
          }
        });
      },
      { threshold: 0.12, rootMargin: "0px 0px -40px 0px" },
    );
    nodes.forEach((node, index) => {
      node.classList.add("motion-reveal");
      node.style.setProperty("--motion-delay", `${(index % 3) * 85}ms`);
      observer.observe(node);
    });
    return () => observer.disconnect();
  }, [data.services, data.projects, data.testimonials]);

  useEffect(() => {
    const controller = new AbortController();
    fetch("/api/site-data", { cache: "no-store", signal: controller.signal })
      .then(async (response) => {
        if (!response.ok) throw new Error("Data belum dimuat");
        return response.json() as Promise<SiteData>;
      })
      .then((nextData) => {
        if (nextData.profile)
          setData({
            ...initialData,
            ...nextData,
            services: nextData.services ?? [],
            projects: nextData.projects ?? [],
            testimonials: nextData.testimonials ?? [],
          });
      })
      .catch(() => {
        /* Keep demo content visible when the database is not set up yet. */
      })
      .finally(() => {
        if (!controller.signal.aborted) setDataReady(true);
      });
    return () => controller.abort();
  }, []);

  useEffect(() => {
    const nodes = navItems
      .map((item) => document.getElementById(item.id))
      .filter(Boolean) as HTMLElement[];
    if (!nodes.length) return;
    const observer = new IntersectionObserver(
      (entries) => {
        const visible = entries
          .filter((entry) => entry.isIntersecting)
          .sort((a, b) => b.intersectionRatio - a.intersectionRatio)[0];
        if (visible) setActive(visible.target.id);
      },
      { rootMargin: "-24% 0px -55% 0px", threshold: [0.05, 0.2, 0.45] },
    );
    nodes.forEach((node) => observer.observe(node));
    return () => observer.disconnect();
  }, []);

  const categories = useMemo(
    () => [
      "Semua",
      ...Array.from(
        new Set(
          data.projects.map((project) => project.category).filter(Boolean),
        ),
      ),
    ],
    [data.projects],
  );
  const filteredProjects = useMemo(
    () =>
      filter === "Semua"
        ? data.projects
        : data.projects.filter((project) => project.category === filter),
    [data.projects, filter],
  );
  const profile = data.profile;

  async function submitContact(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSending(true);
    setFormStatus(null);
    try {
      const response = await fetch("/api/messages", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      const result = (await response.json()) as {
        ok?: boolean;
        message?: string;
        error?: string;
      };
      if (!response.ok) throw new Error(result.error ?? "Pesan gagal dikirim.");
      setFormStatus({
        kind: "success",
        text: "Pesan terkirim. Terima kasih sudah menghubungi saya!",
      });
      setForm({ name: "", email: "", service: "", message: "", website: "" });
    } catch (error) {
      setFormStatus({
        kind: "error",
        text:
          error instanceof Error
            ? error.message
            : "Terjadi kesalahan. Silakan coba kembali.",
      });
    } finally {
      setSending(false);
    }
  }

  const loaderState = {
    fonts: fontsReady,
    data: dataReady,
    images: imageProgress,
    chunk: chunkReady,
    art: artReady,
    lanyard: lanyardReady,
    forced: forceDone,
  };
  const loaderTarget = computeLoaderTarget(loaderState);
  const loaderComplete = isLoaderComplete(loaderState);

  return (
    <>
      {!loaderGone && (
        <LoadingScreen
          target={loaderTarget}
          complete={loaderComplete}
          onDone={() => setLoaderGone(true)}
        />
      )}
      <main className="site-shell">
        <div className="ambient ambient-one" />
        <div className="ambient ambient-two" />
        <div className="ambient ambient-three" />
        <header className="topbar">
          <a
            href="#home"
            className="brand-mark"
            aria-label="Kembali ke beranda"
          >
            <span className="brand-symbol">
              {profile.name
                .split(" ")
                .map((part) => part[0])
                .slice(0, 2)
                .join("")
                .toUpperCase()}
            </span>
            <span className="brand-copy">
              <b>{profile.name}</b>
              <small>PERSONAL PORTFOLIO</small>
            </span>
          </a>
          <div className="topbar-right">
            <span className="availability">
              <span />
              {profile.availability}
            </span>
            <a href="#contact" className="top-contact">
              Mari ngobrol <ArrowUpRight size={14} />
            </a>
          </div>
        </header>

        <div className="page-content">
          <section className="hero-section section-anchor" id="home">
            <div className="hero-copy">
              <div className="hero-kicker glass-pill">
                <Sparkles size={14} />
                <span>DESIGN-MINDED DEVELOPER</span>
                <span className="kicker-line" />
              </div>
              <h1>
                Halo, saya{" "}
                <span className="gradient-text">
                  {profile.name.split(" ")[0]}.
                </span>
                <br />
                Saya merancang{" "}
                <span className="hero-italic">digital things</span>
                <br />
                yang <span className="underlined-word">bermakna.</span>
              </h1>
              <p className="hero-lede">
                {profile.headline} {profile.bio}
              </p>
              <div className="hero-actions">
                <a className="button button-primary" href="#portfolio">
                  Jelajahi karya <ArrowUpRight size={16} />
                </a>
                <a className="button button-glass" href="#contact">
                  <Mail size={16} /> Hubungi saya
                </a>
              </div>
              <div className="hero-proof">
                <div className="avatar-stack">
                  <span>✦</span>
                  <span>✳</span>
                  <span>✺</span>
                </div>
                <div>
                  <div className="proof-stars">
                    <Star size={12} fill="currentColor" />
                    <Star size={12} fill="currentColor" />
                    <Star size={12} fill="currentColor" />
                    <Star size={12} fill="currentColor" />
                    <Star size={12} fill="currentColor" />
                  </div>
                  <p>
                    <b>{profile.clientsSatisfied}+ klien</b> puas bekerja sama
                  </p>
                </div>
                <span className="proof-divider" />
                <div className="proof-mini">
                  <b>{profile.projectsCompleted}+</b>
                  <small>proyek dibuat</small>
                </div>
              </div>
            </div>
            <div className="hero-visual">
              <div className="visual-glow" />
              <div className="orbit orbit-one" />
              <div className="orbit orbit-two" />
              <div className="floating-note note-top glass-panel">
                <span className="note-icon">
                  <CheckCircle2 size={17} />
                </span>
                <div>
                  <b>Pixel perfect</b>
                  <small>Detail matters</small>
                </div>
              </div>
              <div className="floating-note note-bottom glass-panel">
                <span className="note-icon note-icon-blue">
                  <Workflow size={18} />
                </span>
                <div>
                  <b>End-to-end</b>
                  <small>Idea to launch</small>
                </div>
              </div>
              <div className="visual-caption">
                <span>01 / 05</span>
                <i />
                <span>
                  SCROLL TO EXPLORE <ArrowDownRight size={13} />
                </span>
              </div>
            </div>
            <div className="hero-lanyard">
              {lanyardArt && lanyardVisible && (
                <Lanyard
                  frontImage={lanyardArt.front}
                  backImage={lanyardArt.back}
                  strapImage={lanyardArt.strap}
                  cardColor="#0c0e24"
                  strapColor="#6f5cf0"
                  finish="glossy"
                  metal="silver"
                  size={0.8}
                  strapLength={0.08}
                  strapWidth={0.8}
                  onReady={() => setLanyardReady(true)}
                  style={{
                    position: "absolute",
                    inset: 0,
                    width: "auto",
                    height: "auto",
                  }}
                />
              )}
              <span className="hero-lanyard-hint">
                Tarik, putar & klik kartu untuk membaliknya
              </span>
            </div>
            <div className="hero-bottom-line">
              <span>BASED IN {profile.location.toUpperCase()}</span>
              <span className="line-fill" />
              <span>
                CRAFTED WITH INTENTION <Sparkles size={12} />
              </span>
            </div>
          </section>

          <section className="about-section section-anchor" id="about">
            <GlassSectionTitle
              eyebrow="SEDIKIT TENTANG SAYA"
              title={
                <>
                  Bukan cuma tentang kode.
                  <br />
                  <span className="muted-gradient">
                    Tentang dampak yang dibuat.
                  </span>
                </>
              }
              description="Saya percaya solusi digital terbaik lahir saat estetika, teknologi, dan kebutuhan manusia bertemu di titik yang tepat."
            />
            <div className="about-grid">
              <div className="about-story glass-panel">
                <div className="about-stamp">
                  <Sparkles size={23} />
                  <span>
                    ABOUT
                    <br />
                    MY JOURNEY
                  </span>
                </div>
                <p className="story-lead">
                  Saya adalah partner kreatif untuk ide yang ingin tumbuh
                  menjadi sesuatu yang nyata.
                </p>
                <p className="story-body">
                  {profile.bio} Mulai dari merancang pengalaman pengguna hingga
                  membangun sistem yang andal, saya suka mengubah persoalan
                  kompleks menjadi solusi yang sederhana dan elegan.
                </p>
                <div className="story-footer">
                  <span className="signature">Let&apos;s make it happen.</span>
                  <div className="story-footer-links">
                    {profile.resumeUrl && (
                      <a
                        href={profile.resumeUrl}
                        className="text-link"
                        target="_blank"
                        rel="noreferrer"
                      >
                        Lihat CV <ArrowUpRight size={15} />
                      </a>
                    )}
                    <a href="#contact" className="text-link">
                      Kenali saya lebih jauh <ArrowUpRight size={15} />
                    </a>
                  </div>
                </div>
              </div>
              <div className="about-side">
                <div className="stats-grid">
                  <div className="stat-card glass-panel">
                    <span className="stat-symbol">✳</span>
                    <b>
                      {profile.yearsExperience}
                      <em>+</em>
                    </b>
                    <small>Tahun pengalaman</small>
                  </div>
                  <div className="stat-card glass-panel">
                    <span className="stat-symbol stat-blue">↗</span>
                    <b>
                      {profile.projectsCompleted}
                      <em>+</em>
                    </b>
                    <small>Proyek selesai</small>
                  </div>
                  <div className="stat-card glass-panel stat-wide">
                    <div className="stat-wide-icon">
                      <ShieldCheck size={21} />
                    </div>
                    <div>
                      <b>
                        {profile.clientsSatisfied}
                        <em>+</em>
                      </b>
                      <small>Klien dan tim yang percaya</small>
                    </div>
                    <span className="stat-spark">✦</span>
                  </div>
                </div>
                <div className="principle-card glass-panel">
                  <span className="principle-icon">
                    <Globe2 size={17} />
                  </span>
                  <div>
                    <b>Curious by nature.</b>
                    <p>
                      Selalu belajar, bereksperimen, dan berkembang bersama
                      teknologi.
                    </p>
                  </div>
                  <span className="principle-arrow">
                    <ArrowUpRight size={15} />
                  </span>
                </div>
              </div>
            </div>
          </section>

          <section className="services-section section-anchor" id="services">
            <GlassSectionTitle
              eyebrow="APA YANG SAYA KERJAKAN"
              title={
                <>
                  Layanan yang dirancang
                  <br />
                  <span className="muted-gradient">
                    untuk membawa ide lebih jauh.
                  </span>
                </>
              }
              description="Dari strategi dan visual sampai implementasi, semua dibuat dengan tujuan yang jelas."
            />
            <div className="services-grid">
              {data.services.map((service: Service, index) => {
                const Icon = serviceIcon(service.icon);
                return (
                  <article
                    className={`service-card glass-panel service-card-${index % 3}`}
                    key={service.id}
                  >
                    <div className="service-card-head">
                      <span className="service-icon">
                        <Icon size={22} />
                      </span>
                      <span className="service-index">
                        0{index + 1} / SERVICE
                      </span>
                    </div>
                    <h3>{service.title}</h3>
                    <p>{service.description}</p>
                    <ul>
                      {service.features.map((feature) => (
                        <li key={feature}>
                          <CheckCircle2 size={14} />
                          {feature}
                        </li>
                      ))}
                    </ul>
                    <div className="service-card-bottom">
                      <span>{service.priceLabel}</span>
                      <a
                        href="#contact"
                        aria-label={`Tanya layanan ${service.title}`}
                      >
                        <ArrowUpRight size={17} />
                      </a>
                    </div>
                  </article>
                );
              })}
            </div>
            <div className="service-note glass-panel">
              <span className="note-glint">
                <Sparkles size={18} />
              </span>
              <p>
                Punya kebutuhan yang lebih spesifik?{" "}
                <b>Kita bisa rancang solusi yang pas.</b>
              </p>
              <a href="#contact">
                Ceritakan idemu <ArrowRight size={15} />
              </a>
            </div>
          </section>

          <section className="portfolio-section section-anchor" id="portfolio">
            <div className="portfolio-heading">
              <GlassSectionTitle
                eyebrow="KARYA PILIHAN"
                title={
                  <>
                    Ide yang berubah jadi
                    <br />
                    <span className="muted-gradient">pengalaman nyata.</span>
                  </>
                }
                description="Beberapa eksplorasi dan proyek yang merepresentasikan cara saya memecahkan masalah."
              />
              <a
                href="#contact"
                className="button button-glass desktop-see-all"
              >
                Punya proyek serupa? <ArrowUpRight size={15} />
              </a>
            </div>
            <div
              className="filter-row"
              role="group"
              aria-label="Filter kategori proyek"
            >
              {categories.map((category) => (
                <button
                  key={category}
                  type="button"
                  className={`filter-chip ${filter === category ? "active" : ""}`}
                  onClick={() => setFilter(category)}
                >
                  {category}
                </button>
              ))}
              <span className="project-count">
                {filteredProjects.length.toString().padStart(2, "0")} PROJECTS
              </span>
            </div>
            <div className="projects-grid">
              {filteredProjects.map((project, index) => (
                <article
                  key={project.id}
                  className={`project-card glass-panel ${index === 0 ? "project-featured" : ""}`}
                >
                  <div className="project-cover">
                    <ProjectPreview project={project} />
                    <span className="project-category">{project.category}</span>
                    {project.featured && (
                      <span className="project-featured-label">✦ FEATURED</span>
                    )}
                    <span className="project-number">0{index + 1}</span>
                  </div>
                  <div className="project-info">
                    <div className="project-title-row">
                      <div>
                        <h3>{project.title}</h3>
                        <p>{project.description}</p>
                      </div>
                      <a
                        className="project-open"
                        href={project.demoUrl || project.repoUrl || "#contact"}
                        target={
                          project.demoUrl || project.repoUrl
                            ? "_blank"
                            : undefined
                        }
                        rel="noreferrer"
                        aria-label={`Lihat detail ${project.title}`}
                      >
                        <ArrowUpRight size={18} />
                      </a>
                    </div>
                    <div className="tag-row">
                      {project.tags.map((tag) => (
                        <span key={tag}>{tag}</span>
                      ))}
                    </div>
                  </div>
                </article>
              ))}
            </div>
            {filteredProjects.length === 0 && (
              <div className="empty-state glass-panel">
                Belum ada proyek pada kategori ini. Tambahkan melalui dashboard
                admin.
              </div>
            )}
            <div className="portfolio-footer">
              <span>SESUATU YANG MENARIK DIMULAI DARI IDE KECIL.</span>
              <a href="#contact">
                Mari buat sesuatu <ArrowUpRight size={15} />
              </a>
            </div>
          </section>

          <section
            className="testimonials-section section-anchor"
            id="testimonials"
          >
            <GlassSectionTitle
              eyebrow="KATA MEREKA"
              title={
                <>
                  Kolaborasi yang baik,
                  <br />
                  <span className="muted-gradient">hasil yang terasa.</span>
                </>
              }
              description="Hubungan kerja yang positif sama pentingnya dengan hasil akhir yang berkualitas."
            />
            <div className="testimonials-grid">
              {data.testimonials.map((item, index) => (
                <article className="testimonial-card glass-panel" key={item.id}>
                  <div className="quote-top">
                    <span className="quote-mark">“</span>
                    <span
                      className="rating-stars"
                      aria-label={`${item.rating} dari 5 bintang`}
                    >
                      {Array.from({ length: item.rating }, (_, i) => (
                        <Star size={13} key={i} fill="currentColor" />
                      ))}
                    </span>
                  </div>
                  <p className="quote-content">{item.content}</p>
                  <div className="testimonial-person">
                    <div
                      className={`testimonial-avatar avatar-${index % 3}`}
                      style={
                        item.avatarUrl
                          ? {
                              backgroundImage: `linear-gradient(145deg, rgba(12, 15, 30, .05), rgba(12, 15, 30, .18)), url("${item.avatarUrl.replaceAll('"', "")}")`,
                              backgroundSize: "cover",
                              backgroundPosition: "center",
                            }
                          : undefined
                      }
                    >
                      {!item.avatarUrl &&
                        item.name
                          .split(" ")
                          .map((part) => part[0])
                          .slice(0, 2)
                          .join("")
                          .toUpperCase()}
                    </div>
                    <div>
                      <b>{item.name}</b>
                      <span>
                        {item.role}
                        {item.company ? ` · ${item.company}` : ""}
                      </span>
                    </div>
                    <CheckCircle2 className="verified-icon" size={17} />
                  </div>
                </article>
              ))}
            </div>
            {data.testimonials.length === 0 && (
              <div className="empty-state glass-panel">
                Testimoni akan ditampilkan di sini setelah ditambahkan dari
                admin.
              </div>
            )}
          </section>

          <div className="contact-page section-anchor" id="contact">
            <section className="contact-section">
              <div className="contact-orb contact-orb-one" />
              <div className="contact-orb contact-orb-two" />
              <div className="contact-copy">
                <span className="eyebrow">
                  <span className="eyebrow-dot" />
                  LANGKAH SELANJUTNYA
                </span>
                <h2>
                  Ide bagus layak
                  <br />
                  jadi <span className="gradient-text">kenyataan.</span>
                </h2>
                <p>
                  Ceritakan sedikit tentang proyek atau ide yang sedang kamu
                  siapkan. Kita mulai dari percakapan sederhana.
                </p>
                <div className="contact-detail">
                  <span className="contact-detail-icon">
                    <Mail size={17} />
                  </span>
                  <div>
                    <small>EMAIL SAYA</small>
                    <a href={`mailto:${profile.email}`}>{profile.email}</a>
                  </div>
                  <ArrowUpRight size={15} />
                </div>
                <div className="contact-detail">
                  <span className="contact-detail-icon">
                    <MapPin size={17} />
                  </span>
                  <div>
                    <small>LOKASI</small>
                    <b>{profile.location} · Remote friendly</b>
                  </div>
                </div>
                {profile.whatsapp && (
                  <a
                    className="contact-detail whatsapp-detail"
                    href={`https://wa.me/${profile.whatsapp.replace(/\D/g, "")}`}
                    target="_blank"
                    rel="noreferrer"
                  >
                    <span className="contact-detail-icon">
                      <MessageCircle size={17} />
                    </span>
                    <div>
                      <small>WHATSAPP</small>
                      <b>Diskusi lewat WhatsApp</b>
                    </div>
                    <ArrowUpRight size={15} />
                  </a>
                )}
                <div className="social-row">
                  <a
                    href={profile.githubUrl || "https://github.com/"}
                    target="_blank"
                    rel="noreferrer"
                    aria-label="GitHub"
                  >
                    <Github size={17} />
                  </a>
                  <a
                    href={profile.linkedinUrl || "https://linkedin.com/"}
                    target="_blank"
                    rel="noreferrer"
                    aria-label="LinkedIn"
                  >
                    <Linkedin size={17} />
                  </a>
                  <a
                    href={profile.instagramUrl || "https://instagram.com/"}
                    target="_blank"
                    rel="noreferrer"
                    aria-label="Instagram"
                  >
                    <Instagram size={17} />
                  </a>
                </div>
              </div>
              <form
                className="contact-form glass-panel"
                onSubmit={submitContact}
              >
                <div className="form-top">
                  <div>
                    <span className="form-step">01 — LET&apos;S TALK</span>
                    <h3>Kirim pesan</h3>
                  </div>
                  <span className="form-spark">
                    <Send size={18} />
                  </span>
                </div>
                <div className="form-grid">
                  <label>
                    Nama lengkap
                    <input
                      required
                      minLength={2}
                      maxLength={100}
                      value={form.name}
                      onChange={(event) =>
                        setForm({ ...form, name: event.target.value })
                      }
                      placeholder="Nama kamu"
                    />
                  </label>
                  <label>
                    Email aktif
                    <input
                      type="email"
                      required
                      maxLength={160}
                      value={form.email}
                      onChange={(event) =>
                        setForm({ ...form, email: event.target.value })
                      }
                      placeholder="nama@email.com"
                    />
                  </label>
                </div>
                <label className="form-label">
                  Layanan yang diminati
                  <select
                    value={form.service}
                    onChange={(event) =>
                      setForm({ ...form, service: event.target.value })
                    }
                  >
                    <option value="">Pilih layanan (opsional)</option>
                    {data.services.map((service) => (
                      <option value={service.title} key={service.id}>
                        {service.title}
                      </option>
                    ))}
                  </select>
                </label>
                <label className="form-label">
                  Ceritakan idemu
                  <textarea
                    required
                    minLength={10}
                    maxLength={3000}
                    rows={4}
                    value={form.message}
                    onChange={(event) =>
                      setForm({ ...form, message: event.target.value })
                    }
                    placeholder="Sedikit cerita tentang proyek yang ingin kamu bangun..."
                  />
                </label>
                <div className="honeypot" aria-hidden="true">
                  <label>
                    Jangan isi kolom ini
                    <input
                      tabIndex={-1}
                      autoComplete="off"
                      value={form.website}
                      onChange={(event) =>
                        setForm({ ...form, website: event.target.value })
                      }
                    />
                  </label>
                </div>
                {formStatus && (
                  <div
                    className={`form-status ${formStatus.kind}`}
                    role="status"
                  >
                    {formStatus.text}
                  </div>
                )}
                <button
                  className="button button-primary submit-button"
                  type="submit"
                  disabled={sending}
                >
                  {sending ? "Mengirim pesan..." : "Kirim pesan"}
                  <ArrowUpRight size={16} />
                </button>
                <p className="privacy-note">
                  <ShieldCheck size={12} /> Informasi kamu hanya digunakan untuk
                  membalas pesan ini.
                </p>
              </form>
            </section>
          </div>
        </div>

        <footer className="site-footer">
          <a href="#home" className="footer-brand">
            <span className="brand-symbol">
              {profile.name
                .split(" ")
                .map((part) => part[0])
                .slice(0, 2)
                .join("")
                .toUpperCase()}
            </span>
            <b>{profile.name}</b>
          </a>
          <span>
            © {new Date().getFullYear()} · Dibuat dengan niat baik dan secangkir
            kopi.
          </span>
          <a href="/admin" className="admin-shortcut">
            Admin <ArrowUpRight size={12} />
          </a>
        </footer>

        <nav className="bottom-nav" aria-label="Navigasi utama">
          {navItems.map((item) => {
            const Icon = item.icon;
            return (
              <a
                key={item.id}
                href={`#${item.id}`}
                className={`nav-item ${active === item.id ? "active" : ""}`}
                aria-current={active === item.id ? "location" : undefined}
              >
                <span className="nav-icon">
                  <Icon
                    size={19}
                    strokeWidth={active === item.id ? 2.2 : 1.7}
                  />
                </span>
                <span className="nav-label">{item.label}</span>
                {active === item.id && <span className="nav-indicator" />}
              </a>
            );
          })}
        </nav>
      </main>
    </>
  );
}
