-- Optional starter content. Safe to run repeatedly because inserts use stable IDs / conflict handling.
insert into public."Profile" (id,name,role,headline,bio,location,email,whatsapp,availability,"yearsExperience","projectsCompleted","clientsSatisfied","avatarUrl","resumeUrl","githubUrl","linkedinUrl","instagramUrl") values
('main','Nama Kamu','Full-stack Developer & UI Designer','Membangun pengalaman digital yang terasa berbeda.','Saya menggabungkan desain yang penuh pertimbangan dengan teknologi modern untuk membantu ide tumbuh menjadi produk digital yang bermanfaat.','Indonesia','halo@example.com','','Terbuka untuk proyek baru',4,32,24,'','','https://github.com/','https://linkedin.com/','https://instagram.com/') on conflict (id) do nothing;
insert into public."Service" (id,title,description,icon,"priceLabel",features,"sortOrder") values
('service-web','Web Development','Website modern, cepat, dan mudah dikembangkan untuk kebutuhan bisnis maupun personal.','code','Mulai dari konsultasi','["Next.js & React","Responsive design","SEO-friendly"]',1),
('service-ui','UI/UX Design','Antarmuka yang rapi, alur yang intuitif, dan detail visual yang membuat produk terasa premium.','palette','Paket sesuai kebutuhan','["Wireframe & prototype","Design system","Mobile-first"]',2),
('service-brand','Digital Branding','Membangun konsistensi visual agar brand lebih mudah dikenali dan dipercaya.','layers','Diskusikan kebutuhan','["Landing page","Visual direction","Optimasi performa"]',3) on conflict (id) do nothing;
insert into public."Project" (id,title,category,description,tags,"coverStyle",featured,"sortOrder") values
('project-commerce','Luma Commerce','Web App','Pengalaman e-commerce minimalis dengan fokus pada katalog produk dan checkout yang ringkas.','["Next.js","TypeScript","Payments"]','violet',true,1),
('project-studio','Forma Studio','Brand Website','Website studio kreatif dengan visual editorial, tipografi tegas, dan transisi yang halus.','["React","Motion","CSS"]','orange',true,2),
('project-insight','Insight Dashboard','Dashboard','Dashboard analitik yang merangkum metrik utama dalam satu antarmuka yang mudah dibaca.','["Next.js","Charts","API"]','blue',false,3) on conflict (id) do nothing;
insert into public."Testimonial" (id,name,role,company,content,rating,"sortOrder") values
('testimonial-1','Nadia Putri','Founder','Luma Studio','Komunikasinya jelas dan proses kerjanya terstruktur. Hasil akhirnya jauh lebih rapi dari yang kami bayangkan.',5,1),
('testimonial-2','Rizky Pratama','Marketing Lead','Growify','Website kami jadi lebih cepat, lebih mudah digunakan, dan terasa konsisten dengan identitas brand.',5,2) on conflict (id) do nothing;
