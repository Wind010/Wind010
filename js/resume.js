function byId(id) {
  return document.getElementById(id);
}

const THEMES = [
  { id: "man", label: "Linux Man" },
  { id: "terminal", label: "Unix Terminal" },
  { id: "minimal", label: "Modern Minimal" },
  { id: "two-column", label: "Two-Column" },
  { id: "bold-header", label: "Bold Header" },
  { id: "timeline", label: "Timeline" }
];
const DEFAULT_THEME = "man";
let resumeDataCache = null;

const DEFAULT_MANPAGE_TEMPLATE = `
  <header class="man-head">
    <span id="manHeadLeft">JEFF-TONG(1)</span>
    <span id="manHeadCenter">User Commands</span>
    <span id="manHeadRight">JEFF-TONG(1)</span>
  </header>

  <section class="section-name">
    <h2>NAME</h2>
    <p id="nameLine">Loading...</p>
  </section>

  <section class="section-synopsis">
    <h2>SYNOPSIS</h2>
    <p id="synopsisLine">Loading...</p>
  </section>

  <section class="section-description">
    <h2>DESCRIPTION</h2>
    <p id="descriptionLine">Loading...</p>
  </section>

  <section class="section-contact">
    <h2>CONTACT INFORMATION</h2>
    <div id="contactInfo"></div>
  </section>

  <section class="section-skills">
    <h2>TECHNICAL SKILLS</h2>
    <div id="skillsGrid" class="skills-grid"></div>
  </section>

  <section class="section-work">
    <h2>WORK HISTORY</h2>
    <div id="workHistory"></div>
  </section>

  <section class="section-projects">
    <h2>PROJECTS</h2>
    <div id="projects"></div>
  </section>

  <section class="section-education">
    <h2>EDUCATION</h2>
    <div id="education"></div>
  </section>

  <section class="section-languages">
    <h2>LANGUAGES</h2>
    <p id="languagesLine">Loading...</p>
  </section>

  <section class="section-interests">
    <h2>INTERESTS</h2>
    <p id="interestsLine">Loading...</p>
  </section>

  <footer class="man-foot">
    <span id="footerLeft">jefftong.dev</span>
    <span id="footerCenter"></span>
    <span id="footerRight">JEFF-TONG(1)</span>
  </footer>
`;

const DEFAULT_SECTION_TITLES = {
  ".section-name h2": "NAME",
  ".section-synopsis h2": "SYNOPSIS",
  ".section-description h2": "DESCRIPTION",
  ".section-contact h2": "CONTACT INFORMATION",
  ".section-skills h2": "TECHNICAL SKILLS",
  ".section-work h2": "WORK HISTORY",
  ".section-projects h2": "PROJECTS",
  ".section-education h2": "EDUCATION",
  ".section-languages h2": "LANGUAGES",
  ".section-interests h2": "INTERESTS"
};

const MINIMAL_SECTION_TITLES = {
  ".section-name h2": "Name",
  ".section-synopsis h2": "Synopsis",
  ".section-description h2": "About",
  ".section-contact h2": "Contact",
  ".section-skills h2": "Technical Skills",
  ".section-work h2": "Experience",
  ".section-projects h2": "Projects",
  ".section-education h2": "Education",
  ".section-languages h2": "Languages",
  ".section-interests h2": "Interests"
};

const TWO_COLUMN_SECTION_TITLES = {
  ...MINIMAL_SECTION_TITLES,
  ".section-skills h2": "Skills"
};

function getCurrentTheme() {
  return document.body.getAttribute("data-theme") || DEFAULT_THEME;
}

function isSupportedTheme(theme) {
  return THEMES.some((entry) => entry.id === theme);
}

function getThemeFromUrl() {
  const params = new URLSearchParams(window.location.search);
  return params.get("theme");
}

function syncThemeToUrl(theme) {
  const url = new URL(window.location.href);
  if (theme === DEFAULT_THEME) {
    url.searchParams.delete("theme");
  } else {
    url.searchParams.set("theme", theme);
  }
  window.history.replaceState({}, "", url);
}

function applySectionTitles(theme) {
  const titleMap = theme === "two-column"
    ? TWO_COLUMN_SECTION_TITLES
    : (theme === "minimal" ? MINIMAL_SECTION_TITLES : DEFAULT_SECTION_TITLES);
  Object.entries(titleMap).forEach(([selector, value]) => {
    const heading = document.querySelector(selector);
    if (heading) {
      heading.textContent = value;
    }
  });
}

function setTheme(theme) {
  const next = isSupportedTheme(theme) ? theme : DEFAULT_THEME;
  document.body.setAttribute("data-theme", next);
  syncThemeToUrl(next);
  applySectionTitles(next);

  const label = byId("themeLabel");
  const found = THEMES.find((entry) => entry.id === next);
  if (label && found) {
    label.textContent = `Theme: ${found.label}`;
  }

  document.querySelectorAll(".theme-option").forEach((button) => {
    button.classList.toggle("active", button.dataset.themeOption === next);
  });

  if (resumeDataCache) {
    renderCurrentTheme();
  }
}

function initTheme() {
  const requestedTheme = getThemeFromUrl();
  const initialTheme = isSupportedTheme(requestedTheme) ? requestedTheme : DEFAULT_THEME;
  setTheme(initialTheme);

  document.querySelectorAll(".theme-option").forEach((button) => {
    button.addEventListener("click", () => {
      setTheme(button.dataset.themeOption || DEFAULT_THEME);
    });
  });
}

function escapeHtml(value) {
  return String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");
}

function linkifyText(value) {
  const text = String(value || "");
  const urlRegex = /https?:\/\/[^\s<>"]+/g;
  let lastIndex = 0;
  let html = "";

  for (const match of text.matchAll(urlRegex)) {
    const index = match.index || 0;
    const url = match[0];
    html += escapeHtml(text.slice(lastIndex, index));
    html += `<a href="${escapeHtml(url)}" target="_blank" rel="noopener noreferrer">${escapeHtml(url)}</a>`;
    lastIndex = index + url.length;
  }

  html += escapeHtml(text.slice(lastIndex));
  return html;
}

function formatDate(raw) {
  if (!raw) {
    return "Present";
  }
  const parsed = new Date(raw);
  if (Number.isNaN(parsed.getTime())) {
    return raw;
  }
  return parsed.toLocaleDateString("en-US", { month: "short", year: "numeric" });
}

function formatDateRange(startDate, endDate) {
  const start = startDate ? formatDate(startDate) : "";
  const end = endDate ? formatDate(endDate) : "Present";
  if (!start && !endDate) {
    return "";
  }
  if (!start) {
    return end;
  }
  return `${start} - ${end}`;
}

function normalizeList(field) {
  if (!field) {
    return [];
  }
  if (Array.isArray(field)) {
    return field;
  }
  return [field];
}

function pickProfile(profiles, networkName) {
  return profiles.find((p) => String(p.network || "").toLowerCase() === networkName.toLowerCase());
}

function getUniqueProfileValues(profiles) {
  const seen = new Set();
  return normalizeList(profiles)
    .map((profile) => (profile && (profile.username || profile.url || "") ? String(profile.username || profile.url).trim() : ""))
    .filter(Boolean)
    .filter((value) => {
      const key = value.toLowerCase();
      if (seen.has(key)) {
        return false;
      }
      seen.add(key);
      return true;
    });
}

function buildContactParts(basics) {
  const location = basics.location || {};
  return [
    basics.email || "",
    ...getUniqueProfileValues(basics.profiles),
    [location.city, location.region].filter(Boolean).join(", ")
  ].filter(Boolean);
}

function renderContact(resume) {
  const basics = resume.basics || {};
  const location = basics.location || {};
  const profiles = normalizeList(basics.profiles);
  const github = pickProfile(profiles, "github");
  const linkedin = pickProfile(profiles, "linkedin");

  const lines = [
    ["Email", basics.email || "N/A", "email"],
    ["GitHub", github && github.url ? `<a href="${escapeHtml(github.url)}" target="_blank" rel="noopener noreferrer">${escapeHtml(github.username || github.url)}</a>` : "N/A", "github"],
    ["LinkedIn", linkedin && linkedin.url ? `<a href="${escapeHtml(linkedin.url)}" target="_blank" rel="noopener noreferrer">${escapeHtml(linkedin.username || linkedin.url)}</a>` : "N/A", "linkedin"],
    ["Website", basics.url ? `<a href="${escapeHtml(basics.url)}" target="_blank" rel="noopener noreferrer">${escapeHtml(basics.url)}</a>` : "N/A", "website"],
    ["Location", [location.city, location.region].filter(Boolean).join(", ") || "N/A", "location"]
  ];

  byId("contactInfo").innerHTML = lines
    .map(([label, value, key]) => `<div class="info-row info-${escapeHtml(key)}"><span class="label">${escapeHtml(label)}:</span><span>${value}</span></div>`)
    .join("");
}

function renderSkills(resume) {
  const skills = normalizeList(resume.skills);
  byId("skillsGrid").innerHTML = skills
    .map((skill) => {
      const keywordTokens = normalizeList(skill.keywords)
        .filter(Boolean)
        .map((keyword) => `<span class="skill-token">${escapeHtml(keyword)}</span>`)
        .join("");

      return `<div class="skill-row"><span class="skill-name">${escapeHtml(skill.name || "Skill")}</span><span class="skill-values">${keywordTokens || '<span class="skill-token">N/A</span>'}</span></div>`;
    })
    .join("");
}

function renderWork(resume) {
  const work = normalizeList(resume.work);
  byId("workHistory").innerHTML = work
    .map((job) => {
      const highlights = normalizeList(job.highlights);
      const company = job.name || "COMPANY";
      const role = job.position || "Role";
      const companyText = escapeHtml(company);
      const roleText = escapeHtml(role);
      const dateLine = formatDateRange(job.startDate, job.endDate);
      const highlightsHtml = highlights.length
        ? `<ul>${highlights.map((h) => `<li>${escapeHtml(h)}</li>`).join("")}</ul>`
        : "";
      return `
        <article class="job fade-in">
          <div class="item-head">
            <div class="item-title"><span class="item-company-inline">${companyText}</span><span class="item-title-sep"> - </span><span class="item-role">${roleText}</span></div>
            <div class="item-dates">${escapeHtml(dateLine)}</div>
          </div>
          <div class="item-company">${companyText}</div>
          <p class="item-summary">${escapeHtml(job.summary || "")}</p>
          ${highlightsHtml}
        </article>
      `;
    })
    .join("");
}

function renderProjects(resume) {
  const projects = normalizeList(resume.projects);
  byId("projects").innerHTML = projects
    .map((project) => {
      const highlights = normalizeList(project.highlights);
      const projectName = escapeHtml(project.name || "Project");
      const titleHtml = project.url
        ? `<a href="${escapeHtml(project.url)}" target="_blank" rel="noopener noreferrer">${projectName}</a>`
        : projectName;
      const highlightsHtml = highlights.length
        ? `<ul>${highlights.map((h) => `<li>${linkifyText(h)}</li>`).join("")}</ul>`
        : "";

      return `
        <article class="project fade-in">
          <div class="item-head">
            <div class="item-title">${titleHtml}</div>
            <div class="item-dates"></div>
          </div>
          <p class="item-summary">${linkifyText(project.description || "")}</p>
          ${highlightsHtml}
        </article>
      `;
    })
    .join("");
}

function renderEducation(resume) {
  const education = normalizeList(resume.education);
  byId("education").innerHTML = education
    .map((edu) => {
      const title = `${edu.studyType || "Program"}${edu.area ? `, ${edu.area}` : ""}`;
      const dateLine = formatDateRange(edu.startDate, edu.endDate);
      return `
        <article class="edu fade-in">
          <div class="item-head">
            <div class="item-title">${escapeHtml(edu.institution || "Institution")}</div>
            <div class="item-dates">${escapeHtml(dateLine)}</div>
          </div>
          <p class="item-summary">${escapeHtml(title)}</p>
        </article>
      `;
    })
    .join("");
}

function renderTwoColumnEducation(education) {
  return groupEducationByInstitution(education)
    .map((school) => {
      return `
        <div class="school">
          <h3>${escapeHtml(school.institution || "Institution")}</h3>
          <div class="dates">${escapeHtml(formatDateRange(school.startDate, school.endDate))}</div>
          <ul>
            ${school.degrees.map((degree) => `<li><strong>${escapeHtml(degree.studyType || "Program")}</strong>${degree.area ? `, ${escapeHtml(degree.area)}` : ""}</li>`).join("")}
          </ul>
        </div>
      `;
    })
    .join("");
}

function groupEducationByInstitution(education) {
  const grouped = {};
  normalizeList(education).forEach((entry) => {
    const institution = entry.institution || "Institution";
    if (!grouped[institution]) {
      grouped[institution] = {
        institution,
        startDate: entry.startDate,
        endDate: entry.endDate,
        degrees: []
      };
    }

    grouped[institution].degrees.push({
      studyType: entry.studyType,
      area: entry.area
    });
  });

  return Object.values(grouped);
}

function renderTwoColumn(data) {
  const basics = data.basics || {};
  const work = normalizeList(data.work);
  const education = normalizeList(data.education);
  const skills = normalizeList(data.skills);
  const profiles = normalizeList(basics.profiles);
  const location = basics.location || {};

  return `
    <aside class="sidebar">
      <header class="resume-header">
        <h1>${escapeHtml(basics.name || "")}</h1>
        <div class="subtitle">${escapeHtml(basics.label || "")}</div>
      </header>

      <section class="contact">
        <h2>Contact</h2>
        ${basics.email ? `<div class="contact-item">${escapeHtml(basics.email)}</div>` : ""}
        ${profiles
          .map((p) => `<div class="contact-item">${escapeHtml(p.network || "Profile")}: ${escapeHtml(p.username || p.url || "")}</div>`)
          .join("")}
        ${(location.city || location.region)
          ? `<div class="contact-item">${escapeHtml([location.city, location.region].filter(Boolean).join(", "))}</div>`
          : ""}
      </section>

      <section class="skills">
        <h2>Skills</h2>
        ${skills
          .map((skill) => `
            <div class="skill-group">
              <h3>${escapeHtml(skill.name || "Skill")}</h3>
              <div class="skill-tags">
                ${normalizeList(skill.keywords)
                  .filter(Boolean)
                  .map((k) => `<span class="tag skill-token">${escapeHtml(k)}</span>`)
                  .join("")}
              </div>
            </div>
          `)
          .join("")}
      </section>

      <section class="education">
        <h2>Education</h2>
        ${renderTwoColumnEducation(education)}
      </section>
    </aside>

    <main class="main-content">
      <section class="summary">
        <p>${escapeHtml(basics.summary || "")}</p>
      </section>

      <section class="experience">
        <h2>Experience</h2>
        ${work
          .map((job) => `
            <div class="job">
              <div class="job-header">
                <h3>${escapeHtml(job.position || "Role")}</h3>
                <div class="dates">${escapeHtml(formatDate(job.startDate))} - ${escapeHtml(job.endDate ? formatDate(job.endDate) : "Present")}</div>
              </div>
              <div class="company">${escapeHtml(job.name || "Company")}${job.location ? ` • ${escapeHtml(job.location)}` : ""}</div>
              ${job.summary ? `<p class="job-summary">${escapeHtml(job.summary)}</p>` : ""}
              ${normalizeList(job.highlights).length
                ? `
                  <ul class="highlights">
                    ${normalizeList(job.highlights).map((h) => `<li>${linkifyText(h)}</li>`).join("")}
                  </ul>
                `
                : ""}
            </div>
          `)
          .join("")}
      </section>
    </main>
  `;
}

function renderBoldHeader(data) {
  const basics = data.basics || {};
  const work = normalizeList(data.work);
  const education = normalizeList(data.education);
  const skills = normalizeList(data.skills);
  const contactParts = buildContactParts(basics);

  return `
    <div class="resume-header">
      <div class="header-content">
        <h1>${escapeHtml(basics.name || "")}</h1>
        <div class="subtitle">${escapeHtml(basics.label || "")}</div>
        <div class="contact">${escapeHtml(contactParts.join(" • "))}</div>
      </div>
    </div>

    <section class="summary">
      <p>${escapeHtml(basics.summary || "")}</p>
    </section>

    <div class="two-col-layout">
      <div class="col-main">
        <section class="experience">
          <h2>Experience</h2>
          ${work.map((job) => `
            <div class="job">
              <div class="job-header">
                <div>
                  <h3>${escapeHtml(job.position || "Role")}</h3>
                  <div class="company">${escapeHtml(job.name || "Company")}${job.location ? ` • ${escapeHtml(job.location)}` : ""}</div>
                </div>
                <div class="dates">${escapeHtml(formatDate(job.startDate))} - ${escapeHtml(job.endDate ? formatDate(job.endDate) : "Present")}</div>
              </div>
              ${job.summary ? `<p class="job-summary">${escapeHtml(job.summary)}</p>` : ""}
              ${normalizeList(job.highlights).length > 0 ? `
                <ul class="highlights">
                  ${normalizeList(job.highlights).map((h) => `<li>${linkifyText(h)}</li>`).join("")}
                </ul>
              ` : ""}
            </div>
          `).join("")}
        </section>
      </div>

      <div class="col-side">
        <section class="skills">
          <h2>Skills</h2>
          ${skills.map((skill) => `
            <div class="skill-group">
              <h3>${escapeHtml(skill.name || "Skill")}</h3>
              <p>${escapeHtml(normalizeList(skill.keywords).join(", "))}</p>
            </div>
          `).join("")}
        </section>

        <section class="education">
          <h2>Education</h2>
          ${renderTwoColumnEducation(education)}
        </section>
      </div>
    </div>
  `;
}

function renderTimeline(data) {
  const basics = data.basics || {};
  const work = normalizeList(data.work);
  const education = normalizeList(data.education);
  const skills = normalizeList(data.skills);
  const contactParts = buildContactParts(basics);

  return `
    <header class="resume-header">
      <h1>${escapeHtml(basics.name || "")}</h1>
      <div class="subtitle">${escapeHtml(basics.label || "")}</div>
      <div class="contact">
        ${contactParts.map((part) => `<span>${escapeHtml(part)}</span>`).join("<span>•</span>")}
      </div>
    </header>

    <section class="summary">
      <p>${escapeHtml(basics.summary || "")}</p>
    </section>

    <section class="skills">
      <h2>Technical Skills</h2>
      <div class="skills-inline">
        ${skills.map((skill) => {
          const tokens = normalizeList(skill.keywords);
          const preview = tokens.slice(0, 3).join(", ");
          const suffix = tokens.length > 3 ? "..." : "";
          return `<span class="skill-pill"><strong>${escapeHtml(skill.name || "Skill")}:</strong> ${escapeHtml(preview)}${suffix}</span>`;
        }).join("")}
      </div>
    </section>

    <section class="experience">
      <h2>Experience</h2>
      <div class="timeline-container">
        ${work.map((job) => `
          <div class="timeline-item">
            <div class="timeline-marker"></div>
            <div class="timeline-content">
              <div class="job-header">
                <div>
                  <h3>${escapeHtml(job.position || "Role")}</h3>
                  <div class="company">${escapeHtml(job.name || "Company")}${job.location ? ` • ${escapeHtml(job.location)}` : ""}</div>
                </div>
                <div class="dates">${escapeHtml(formatDate(job.startDate))} - ${escapeHtml(job.endDate ? formatDate(job.endDate) : "Present")}</div>
              </div>
              ${job.summary ? `<p class="job-summary">${escapeHtml(job.summary)}</p>` : ""}
              ${normalizeList(job.highlights).length > 0 ? `
                <ul class="highlights">
                  ${normalizeList(job.highlights).map((h) => `<li>${linkifyText(h)}</li>`).join("")}
                </ul>
              ` : ""}
            </div>
          </div>
        `).join("")}
      </div>
    </section>

    <section class="education">
      <h2>Education</h2>
      ${renderTwoColumnEducation(education)}
    </section>
  `;
}

function renderMeta(resume) {
  const basics = resume.basics || {};
  const profile = basics.name || "resume";
  const slug = profile.toUpperCase().replaceAll(/[^A-Z0-9]+/g, "-").replaceAll(/^-|-$/g, "") || "RESUME";
  const city = (basics.location && basics.location.city) || "unknown";
  const updatedLabel = new Date().toLocaleDateString("en-US", { month: "long", year: "numeric" });
  const profiles = normalizeList(basics.profiles);
  const github = pickProfile(profiles, "github");
  const linkedin = pickProfile(profiles, "linkedin");
  const locationParts = [basics.location && basics.location.city, basics.location && basics.location.region].filter(Boolean);
  const compactContact = [
    basics.email || "",
    github && (github.username || github.url) ? `GitHub: ${github.username || github.url}` : "",
    linkedin && (linkedin.username || linkedin.url) ? `LinkedIn: ${linkedin.username || linkedin.url}` : "",
    locationParts.join(", ")
  ].filter(Boolean).join(" • ");

  byId("manHeadLeft").textContent = `${slug}(1)`;
  byId("manHeadRight").textContent = `${slug}(1)`;
  byId("footerRight").textContent = `${slug}(1)`;
  byId("footerCenter").textContent = updatedLabel;

  const container = document.querySelector(".manpage");
  const contactSection = document.querySelector(".section-contact");
  if (container) {
    container.setAttribute("data-profile", profile);
    container.setAttribute("data-role", basics.label || "Engineer");
    container.setAttribute("data-updated", updatedLabel);
    container.setAttribute("data-contact", compactContact);
  }
  if (contactSection) {
    contactSection.setAttribute("data-role", basics.label || "Engineer");
  }

  byId("nameLine").textContent = `${profile.toLowerCase().replaceAll(/\s+/g, "-")} - ${basics.label || "Engineer"}`;
  byId("synopsisLine").textContent = `${profile} [--role=${basics.label || "engineer"}] [--location=${city}] [--focus=full-stack]`;
  byId("descriptionLine").textContent = basics.summary || "";

  const languages = normalizeList(resume.languages)
    .map((item) => (typeof item === "string" ? item : item.language || ""))
    .filter(Boolean);
  const interests = normalizeList(resume.interests)
    .map((item) => (typeof item === "string" ? item : item.name || ""))
    .filter(Boolean);

  byId("languagesLine").textContent = languages.length ? languages.join(", ") : "N/A";
  byId("interestsLine").textContent = interests.length ? interests.join(", ") : "N/A";
}

async function loadResume() {
  try {
    const response = await fetch("resume.json", { cache: "no-store" });
    if (!response.ok) {
      throw new Error(`Unable to load resume.json (${response.status})`);
    }

    resumeDataCache = await response.json();
    renderCurrentTheme();
  } catch (error) {
    const container = document.querySelector("main");
    container.innerHTML = `<p>Failed to render resume: ${escapeHtml(error.message)}</p>`;
  }
}

function renderDefaultTheme(resume) {
  const container = document.querySelector("main");
  container.className = "manpage";
  container.innerHTML = DEFAULT_MANPAGE_TEMPLATE;

  renderMeta(resume);
  renderContact(resume);
  renderSkills(resume);
  renderWork(resume);
  renderProjects(resume);
  renderEducation(resume);
  applySectionTitles(getCurrentTheme());
}

function renderCurrentTheme() {
  if (!resumeDataCache) {
    return;
  }

  const container = document.querySelector("main");
  if (!container) {
    return;
  }

  const theme = getCurrentTheme();
  if (theme === "two-column") {
    container.className = "resume two-column";
    container.innerHTML = renderTwoColumn(resumeDataCache);
    return;
  }

  if (theme === "bold-header") {
    container.className = "resume bold-header";
    container.innerHTML = renderBoldHeader(resumeDataCache);
    return;
  }

  if (theme === "timeline") {
    container.className = "resume timeline";
    container.innerHTML = renderTimeline(resumeDataCache);
    return;
  }

  renderDefaultTheme(resumeDataCache);
}

initTheme();
loadResume();
