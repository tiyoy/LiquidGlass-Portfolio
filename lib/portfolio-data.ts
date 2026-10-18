export type Profile = {
  id?: string;
  name: string;
  role: string;
  headline: string;
  bio: string;
  location: string;
  email: string;
  whatsapp: string;
  availability: string;
  yearsExperience: number;
  projectsCompleted: number;
  clientsSatisfied: number;
  avatarUrl: string;
  resumeUrl: string;
  githubUrl: string;
  linkedinUrl: string;
  instagramUrl: string;
};

export type Service = {
  id: string;
  title: string;
  description: string;
  icon: string;
  priceLabel: string;
  features: string[];
  sortOrder: number;
};

export type Project = {
  id: string;
  title: string;
  category: string;
  description: string;
  imageUrl: string;
  demoUrl: string;
  repoUrl: string;
  tags: string[];
  coverStyle: string;
  featured: boolean;
  sortOrder: number;
};

export type Testimonial = {
  id: string;
  name: string;
  role: string;
  company: string;
  content: string;
  avatarUrl: string;
  rating: number;
  sortOrder: number;
};

export type Message = {
  id: string;
  name: string;
  email: string;
  service: string;
  message: string;
  read: boolean;
  createdAt: string;
};

export type SiteData = {
  profile: Profile;
  services: Service[];
  projects: Project[];
  testimonials: Testimonial[];
};

export const initialData: SiteData = {
  profile: {
    name: "Nama Kamu",
    role: "Full-stack Developer & UI Designer",
    headline: "Membangun pengalaman digital yang terasa berbeda.",
    bio: "Saya menggabungkan desain yang penuh pertimbangan dengan teknologi modern untuk membantu ide tumbuh menjadi produk digital yang bermanfaat.",
    location: "Indonesia",
    email: "halo@example.com",
    whatsapp: "",
    availability: "Terbuka untuk proyek baru",
    yearsExperience: 4,
    projectsCompleted: 32,
    clientsSatisfied: 24,
    avatarUrl: "",
    resumeUrl: "",
    githubUrl: "https://github.com/",
    linkedinUrl: "https://linkedin.com/",
    instagramUrl: "https://instagram.com/",
  },
  services: [
    { id: "service-web", title: "Web Development", description: "Website modern, cepat, dan mudah dikembangkan untuk kebutuhan bisnis maupun personal.", icon: "code", priceLabel: "Mulai dari konsultasi", features: ["Next.js & React", "Responsive design", "SEO-friendly"], sortOrder: 1 },
    { id: "service-ui", title: "UI/UX Design", description: "Antarmuka yang rapi, alur yang intuitif, dan detail visual yang membuat produk terasa premium.", icon: "palette", priceLabel: "Paket sesuai kebutuhan", features: ["Wireframe & prototype", "Design system", "Mobile-first"], sortOrder: 2 },
    { id: "service-brand", title: "Digital Branding", description: "Membangun konsistensi visual agar brand lebih mudah dikenali dan dipercaya.", icon: "layers", priceLabel: "Diskusikan kebutuhan", features: ["Landing page", "Visual direction", "Optimasi performa"], sortOrder: 3 },
  ],
  projects: [
    { id: "project-commerce", title: "Luma Commerce", category: "Web App", description: "Pengalaman e-commerce minimalis dengan fokus pada katalog produk dan checkout yang ringkas.", imageUrl: "", demoUrl: "", repoUrl: "", tags: ["Next.js", "TypeScript", "Payments"], coverStyle: "violet", featured: true, sortOrder: 1 },
    { id: "project-studio", title: "Forma Studio", category: "Brand Website", description: "Website studio kreatif dengan visual editorial, tipografi tegas, dan transisi yang halus.", imageUrl: "", demoUrl: "", repoUrl: "", tags: ["React", "Motion", "CSS"], coverStyle: "orange", featured: true, sortOrder: 2 },
    { id: "project-insight", title: "Insight Dashboard", category: "Dashboard", description: "Dashboard analitik yang merangkum metrik utama dalam satu antarmuka yang mudah dibaca.", imageUrl: "", demoUrl: "", repoUrl: "", tags: ["Next.js", "Charts", "API"], coverStyle: "blue", featured: false, sortOrder: 3 },
  ],
  testimonials: [
    { id: "testimonial-1", name: "Nadia Putri", role: "Founder", company: "Luma Studio", content: "Komunikasinya jelas dan proses kerjanya terstruktur. Hasil akhirnya jauh lebih rapi dari yang kami bayangkan.", avatarUrl: "", rating: 5, sortOrder: 1 },
    { id: "testimonial-2", name: "Rizky Pratama", role: "Marketing Lead", company: "Growify", content: "Website kami jadi lebih cepat, lebih mudah digunakan, dan terasa konsisten dengan identitas brand.", avatarUrl: "", rating: 5, sortOrder: 2 },
  ],
};

export function asStringArray(value: unknown): string[] {
  if (Array.isArray(value)) return value.map((item) => String(item));
  if (typeof value === "string") {
    try {
      const parsed: unknown = JSON.parse(value);
      if (Array.isArray(parsed)) return parsed.map((item) => String(item));
    } catch {
      return value.split(",").map((item) => item.trim()).filter(Boolean);
    }
  }
  return [];
}
