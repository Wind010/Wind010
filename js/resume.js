function byId(id) {
  return document.getElementById(id);
}

const THEMES = [
  { id: "man", label: "Linux Man", iconType: "material", icon: "menu_book" },
  { id: "terminal", label: "Unix Terminal", iconType: "material", icon: "terminal" },
  { id: "lcars", label: "LCARS", iconType: "image", icon: "images/tng.svg" },
  { id: "minimal", label: "Modern Minimal", iconType: "material", icon: "crop_5_4" },
  { id: "two-column", label: "Two-Column", iconType: "material", icon: "view_week" },
  { id: "bold-header", label: "Bold Header", iconType: "material", icon: "title" },
  { id: "timeline", label: "Timeline", iconType: "material", icon: "timeline" }
];
const DEFAULT_THEME = "man";
const LCARS_CLICK_SOUND_URLS = [
  "https://www.thelcars.com/assets/beep1.mp3",
  "https://www.thelcars.com/assets/beep2.mp3",
  "https://www.thelcars.com/assets/beep3.mp3",
  "https://www.thelcars.com/assets/beep4.mp3"
];
let resumeDataCache = null;
let lcarsClickAudioByUrl = {};
let lcarsLastClickAt = 0;

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
    <span id="footerLeft">jeff-tong.dev</span>
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

function useFullResumeFromUrl() {
  const params = new URLSearchParams(window.location.search);
  const full = params.get("full");
  return full === "true";
}

function getFilteredWorkHistory(work) {
  const roles = normalizeList(work);
  const requiredRoles = [
    (job) => job && job.name === "CVS Health",
    (job) => job && job.name === "UglyEgg.AI",
    (job) => job && job.name === "Starbucks Coffee Company",
    (job) => job && job.name === "BECU",
    (job) => job && job.name === "Agilysys" && job.position === "Principal Software Development Engineer",
    (job) => job && job.name === "Microsoft" && job.position === "Build and Tools Engineer"
  ];

  const selected = [];
  requiredRoles.forEach((matcher) => {
    const found = roles.find(matcher);
    if (found) {
      selected.push(found);
    }
  });

  return selected.length ? selected : roles;
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

function syncFullToUrl(enabled) {
  const url = new URL(window.location.href);
  if (enabled) {
    url.searchParams.set("full", "true");
  } else {
    url.searchParams.delete("full");
  }
  window.history.replaceState({}, "", url);
}

function updateFullToggleButton() {
  const toggle = byId("fullToggle");
  if (!toggle) {
    return;
  }

  const enabled = useFullResumeFromUrl();
  toggle.textContent = enabled ? "Full: On" : "Full: Off";
  toggle.title = enabled ? "Full resume" : "Brief resume";
  toggle.setAttribute("aria-label", enabled ? "Full resume" : "Brief resume");
  toggle.classList.toggle("active", enabled);
}

function toggleFullResumeMode() {
  const next = !useFullResumeFromUrl();
  syncFullToUrl(next);
  updateFullToggleButton();
  loadResume();
}

function initFullToggle() {
  const toggle = byId("fullToggle");
  if (!toggle) {
    return;
  }

  updateFullToggleButton();
  toggle.addEventListener("click", () => {
    toggleFullResumeMode();
  });
}

function toggleThemeFlyoutFromLcars() {
  const dock = document.querySelector(".theme-dock");
  if (!(dock instanceof HTMLElement)) {
    return;
  }

  const flyout = dock.querySelector(".theme-flyout");

  const setOpen = (open) => {
    dock.classList.toggle("lcars-menu-open", open);
    if (flyout instanceof HTMLElement) {
      if (open) {
        flyout.style.setProperty("opacity", "1", "important");
        flyout.style.setProperty("visibility", "visible", "important");
        flyout.style.setProperty("transform", "translateY(0)", "important");
        flyout.style.setProperty("pointer-events", "auto", "important");
      } else {
        flyout.style.removeProperty("opacity");
        flyout.style.removeProperty("visibility");
        flyout.style.removeProperty("transform");
        flyout.style.removeProperty("pointer-events");
      }
    }
  };

  const isOpen = dock.classList.contains("lcars-menu-open");
  if (isOpen) {
    setOpen(false);
    return;
  }

  setOpen(true);
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

function renderThemeOption(theme) {
  const iconHtml = theme.iconType === "image"
    ? `<img class="theme-option-icon theme-option-icon-svg" src="${escapeHtml(theme.icon)}" alt="" aria-hidden="true">`
    : `<span class="material-symbols-outlined theme-option-icon" aria-hidden="true">${escapeHtml(theme.icon)}</span>`;

  return `
    <button class="theme-option" data-theme-option="${escapeHtml(theme.id)}" type="button">
      ${iconHtml}
      <span>${escapeHtml(theme.label)}</span>
    </button>
  `;
}

function populateThemeMenu() {
  const flyout = document.querySelector(".theme-flyout");
  if (!(flyout instanceof HTMLElement)) {
    return;
  }

  flyout.innerHTML = THEMES.map((theme) => renderThemeOption(theme)).join("");
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
  populateThemeMenu();

  const requestedTheme = getThemeFromUrl();
  const initialTheme = isSupportedTheme(requestedTheme) ? requestedTheme : DEFAULT_THEME;
  setTheme(initialTheme);

  document.querySelectorAll(".theme-option").forEach((button) => {
    button.addEventListener("click", () => {
      setTheme(button.dataset.themeOption || DEFAULT_THEME);
    });
  });
}

function initThemeTouchMenu() {
  const dock = document.querySelector(".theme-dock");
  if (!(dock instanceof HTMLElement)) {
    return;
  }

  const supportsTouchLikeInput = window.matchMedia("(hover: none)").matches
    || window.matchMedia("(pointer: coarse)").matches;
  if (!supportsTouchLikeInput) {
    return;
  }

  document.addEventListener("click", (event) => {
    const target = event.target;
    if (!(target instanceof Element)) {
      return;
    }

    if (getCurrentTheme() === "lcars") {
      dock.classList.remove("touch-menu-open");
      return;
    }

    if (target.closest(".theme-option")) {
      dock.classList.remove("touch-menu-open");
      return;
    }

    if (target.closest(".theme-flyout")) {
      return;
    }

    if (target.closest(".theme-dock")) {
      dock.classList.toggle("touch-menu-open");
      return;
    }

    dock.classList.remove("touch-menu-open");
  });
}

function getLcarsClickAudio() {
  const randomIndex = Math.floor(Math.random() * LCARS_CLICK_SOUND_URLS.length);
  const url = LCARS_CLICK_SOUND_URLS[randomIndex];
  if (!lcarsClickAudioByUrl[url]) {
    const audio = new Audio(url);
    audio.preload = "auto";
    lcarsClickAudioByUrl[url] = audio;
  }
  return lcarsClickAudioByUrl[url];
}

function playLcarsClickSound() {
  if (getCurrentTheme() !== "lcars") {
    return;
  }

  const now = performance.now();
  if (now - lcarsLastClickAt < 35) {
    return;
  }
  lcarsLastClickAt = now;

  const audio = getLcarsClickAudio();
  if (!audio) {
    return;
  }

  audio.currentTime = 0;
  audio.play().catch(() => {});
}

function initLcarsClickSound() {
  document.addEventListener("pointerdown", (event) => {
    const target = event.target;
    if (!(target instanceof Element)) {
      return;
    }

    const interactive = target.closest("button, #main_nav a, .theme-option, .full-toggle");
    if (!interactive) {
      return;
    }

    playLcarsClickSound();
  }, { passive: true });
}

function initLcarsSectionNav() {
  document.addEventListener("click", (event) => {
    const target = event.target;
    if (!(target instanceof Element)) {
      return;
    }

    const link = target.closest("#main_nav a");
    if (!link) {
      return;
    }

    const href = link.getAttribute("href") || "";
    if (!href.startsWith("#") || href.length < 2) {
      return;
    }

    const section = document.querySelector(href);
    if (!(section instanceof Element)) {
      return;
    }

    event.preventDefault();

    const header = document.getElementById("main_header");
    const headerOffset = header ? header.getBoundingClientRect().height + 12 : 12;
    const sectionTop = section.getBoundingClientRect().top + window.scrollY;
    const scrollTop = Math.max(0, sectionTop - headerOffset);

    window.scrollTo({
      top: scrollTop,
      behavior: "auto"
    });
  });
}

function initLcarsHeaderControls() {
  document.addEventListener("click", (event) => {
    const target = event.target;
    if (!(target instanceof Element) || getCurrentTheme() !== "lcars") {
      return;
    }

    const viewportBtn = target.closest("#viewport-btn");
    if (viewportBtn) {
      toggleFullResumeMode();
      return;
    }

    const optionsBtn = target.closest("#menu-btn");
    if (optionsBtn) {
      toggleThemeFlyoutFromLcars();
      return;
    }

    const dock = document.querySelector(".theme-dock");
    if (!(dock instanceof HTMLElement)) {
      return;
    }

    if (!target.closest(".theme-dock")) {
      dock.classList.remove("lcars-menu-open");
      const flyout = dock.querySelector(".theme-flyout");
      if (flyout instanceof HTMLElement) {
        flyout.style.removeProperty("opacity");
        flyout.style.removeProperty("visibility");
        flyout.style.removeProperty("transform");
        flyout.style.removeProperty("pointer-events");
      }
    }
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

function renderLinkedText(text, url) {
  const safeText = escapeHtml(text || "");
  if (!url) {
    return safeText;
  }
  return `<a href="${escapeHtml(url)}" target="_blank" rel="noopener noreferrer">${safeText}</a>`;
}

function renderDateRangeLine(startDate, endDate) {
  return escapeHtml(formatDateRange(startDate, endDate));
}

function renderCompanyWithLocation(name, location, fallback = "Company") {
  const company = escapeHtml(name || fallback);
  return `${company}${location ? ` • ${escapeHtml(location)}` : ""}`;
}

function renderHighlightsList(highlights, { linkify = true, ulClass = "" } = {}) {
  const items = normalizeList(highlights);
  if (!items.length) {
    return "";
  }

  const classAttr = ulClass ? ` class="${escapeHtml(ulClass)}"` : "";
  const formatter = linkify ? linkifyText : escapeHtml;
  return `<ul${classAttr}>${items.map((h) => `<li>${formatter(h)}</li>`).join("")}</ul>`;
}

function buildContactItems(basics) {
  const profiles = normalizeList(basics.profiles);
  const github = pickProfile(profiles, "github");
  const linkedin = pickProfile(profiles, "linkedin");
  const location = basics.location || {};
  const items = [];

  if (basics.email) {
    items.push({
      text: basics.email,
      url: `mailto:${basics.email}`
    });
  }

  if (github && github.url) {
    items.push({
      text: `GitHub: ${github.username || github.url}`,
      url: github.url
    });
  }

  if (linkedin && linkedin.url) {
    items.push({
      text: `LinkedIn: ${linkedin.username || linkedin.url}`,
      url: linkedin.url
    });
  }

  const locationText = [location.city, location.region].filter(Boolean).join(", ");
  if (locationText) {
    items.push({ text: locationText });
  }

  return items;
}

function renderContactItem(item) {
  if (item.url) {
    return `<a href="${escapeHtml(item.url)}" target="_blank" rel="noopener noreferrer">${escapeHtml(item.text)}</a>`;
  }
  return escapeHtml(item.text);
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
  if (getCurrentTheme() === "man") {
    byId("skillsGrid").innerHTML = `
      <div class="skills-list">
        ${skills
          .map((skill) => `
            <div class="skill-item">
              <dt>${escapeHtml(skill.name || "Skill")}</dt>
              <dd>${escapeHtml(normalizeList(skill.keywords).filter(Boolean).join(", ") || "N/A")}</dd>
            </div>
          `)
          .join("")}
      </div>
    `;
    return;
  }

  if (getCurrentTheme() === "terminal") {
    byId("skillsGrid").innerHTML = skills
      .map((skill) => {
        const values = normalizeList(skill.keywords).filter(Boolean).join(", ") || "N/A";
        return `<div class="skill-row"><span class="skill-name">${escapeHtml(skill.name || "Skill")}</span><span class="skill-values">${escapeHtml(values)}</span></div>`;
      })
      .join("");
    return;
  }

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
      const company = job.name || "COMPANY";
      const role = job.position || "Role";
      const companyText = escapeHtml(company);
      const roleText = escapeHtml(role);
      const dateLine = renderDateRangeLine(job.startDate, job.endDate);
      const highlightsHtml = renderHighlightsList(job.highlights, { linkify: false });
      return `
        <article class="job fade-in">
          <div class="item-head">
            <div class="item-title"><span class="item-company-inline">${companyText}</span><span class="item-title-sep"> - </span><span class="item-role">${roleText}</span></div>
            <div class="item-dates">${dateLine}</div>
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
      const titleHtml = renderLinkedText(project.name || "Project", project.url);
      const highlightsHtml = renderHighlightsList(project.highlights);

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
      const dateLine = renderDateRangeLine(edu.startDate, edu.endDate);
      return `
        <article class="edu fade-in">
          <div class="item-head">
            <div class="item-title">${escapeHtml(edu.institution || "Institution")}</div>
            <div class="item-dates">${dateLine}</div>
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
          .map((p) => {
            const network = escapeHtml(p.network || "Profile");
            const value = escapeHtml(p.username || p.url || "");
            const link = p.url
              ? `<a href="${escapeHtml(p.url)}" target="_blank" rel="noopener noreferrer">${value}</a>`
              : value;
            return `<div class="contact-item">${network}: ${link}</div>`;
          })
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
                <div class="dates">${renderDateRangeLine(job.startDate, job.endDate)}</div>
              </div>
              <div class="company">${renderCompanyWithLocation(job.name, job.location)}</div>
              ${job.summary ? `<p class="job-summary">${escapeHtml(job.summary)}</p>` : ""}
              ${renderHighlightsList(job.highlights, { ulClass: "highlights" })}
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
  const contactItems = buildContactItems(basics);

  return `
    <div class="resume-header">
      <div class="header-content">
        <h1>${escapeHtml(basics.name || "")}</h1>
        <div class="subtitle">${escapeHtml(basics.label || "")}</div>
        <div class="contact">${contactItems.map((item) => renderContactItem(item)).join(" • ")}</div>
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
                  <div class="company">${renderCompanyWithLocation(job.name, job.location)}</div>
                </div>
                <div class="dates">${renderDateRangeLine(job.startDate, job.endDate)}</div>
              </div>
              ${job.summary ? `<p class="job-summary">${escapeHtml(job.summary)}</p>` : ""}
              ${renderHighlightsList(job.highlights, { ulClass: "highlights" })}
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
  const contactItems = buildContactItems(basics);

  return `
    <header class="resume-header">
      <h1>${escapeHtml(basics.name || "")}</h1>
      <div class="subtitle">${escapeHtml(basics.label || "")}</div>
      <div class="contact">
        ${contactItems.map((item) => `<span>${renderContactItem(item)}</span>`).join("<span>•</span>")}
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
                  <div class="company">${renderCompanyWithLocation(job.name, job.location)}</div>
                </div>
                <div class="dates">${renderDateRangeLine(job.startDate, job.endDate)}</div>
              </div>
              ${job.summary ? `<p class="job-summary">${escapeHtml(job.summary)}</p>` : ""}
              ${renderHighlightsList(job.highlights, { ulClass: "highlights" })}
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

function renderLcars(data) {
  const basics = data.basics || {};
  const work = normalizeList(data.work);
  const education = normalizeList(data.education);
  const skills = normalizeList(data.skills);
  const projects = normalizeList(data.projects);
  const contactItems = buildContactItems(basics);
  const currentTime = new Date().toLocaleTimeString("en-US", {
    hour: "2-digit",
    minute: "2-digit",
    hour12: false
  });

  return `
    <div class="container lcars-shell">
      <div class="topbar">
        <div class="time_wrapper">
          <span></span>
          <time>${escapeHtml(currentTime)}</time>
        </div>
      </div>

      <header id="main_header" class="lcars-header">
        <div class="header_inner">
          <hgroup class="lcars-title-wrap">
            <h1>${escapeHtml(basics.name || "")}</h1>
            <h2>${escapeHtml(basics.label || "Software Engineer")} <span>|</span> LCARS <span>|</span> Resume</h2>
          </hgroup>

          <div class="menu-btn_wrapper">
            <button id="viewport-btn" type="button">
              <span class="material-symbols-outlined lcars-btn-icon" aria-hidden="true">view_in_ar</span>
              <span>View Port</span>
            </button>
            <button id="menu-btn" type="button">
              <span class="material-symbols-outlined lcars-btn-icon" aria-hidden="true">menu</span>
              <span>Options</span>
            </button>
          </div>

          <nav id="main_nav" class="open_nav" aria-label="LCARS Sections">
            <ul>
              <li><a href="#lcars-transmission"><span>Transmission</span></a></li>
              <li><a href="#lcars-mission-brief"><span>Mission Brief</span></a></li>
              <li><a href="#lcars-service-record"><span>Service Record</span></a></li>
              <li><a href="#lcars-capabilities"><span>Capabilities</span></a></li>
              <li><a href="#lcars-education"><span>Education</span></a></li>
              <li><a href="#lcars-projects"><span>Projects</span></a></li>
            </ul>
          </nav>
        </div>
      </header>

      <main class="lcars-main-area">
        <div class="lcars-frame">
          <div class="content_wrapper">
            <div class="content_container">
              <article id="lcars-transmission" class="lcars-article">
                <header><h2>Transmission</h2></header>
                <div class="article_content contact-grid">
                  ${contactItems.map((item) => `<span>${renderContactItem(item)}</span>`).join("")}
                </div>
                <footer><div class="footer_bar"></div></footer>
              </article>

              <article id="lcars-mission-brief" class="lcars-article">
                <header><h2>Mission Brief</h2></header>
                <div class="article_content">
                  <p>${escapeHtml(basics.summary || "")}</p>
                </div>
                <footer><div class="footer_bar"></div></footer>
              </article>

              <div class="lcars-grid">
                <article id="lcars-service-record" class="lcars-article lcars-main-record">
                  <header><h2>Service Record</h2></header>
                  <div class="article_content">
                    ${work
                      .map((job) => `
                        <article class="lcars-job">
                          <div class="job-top">
                            <h3>${escapeHtml(job.position || "Role")}</h3>
                            <div class="dates">${renderDateRangeLine(job.startDate, job.endDate)}</div>
                          </div>
                          <div class="company">${renderCompanyWithLocation(job.name, job.location)}</div>
                          ${job.summary ? `<p class="job-summary">${escapeHtml(job.summary)}</p>` : ""}
                          ${renderHighlightsList(job.highlights, { ulClass: "highlights" })}
                        </article>
                      `)
                      .join("")}
                  </div>
                  <footer><div class="footer_bar"></div></footer>
                </article>

                <div class="lcars-side-stack">
                  <article id="lcars-capabilities" class="lcars-article">
                    <header><h3>Capabilities</h3></header>
                    <div class="article_content">
                      ${skills
                        .map((skill) => `
                          <div class="skill-group">
                            <h3>${escapeHtml(skill.name || "Skill")}</h3>
                            <p>${escapeHtml(normalizeList(skill.keywords).join(" • "))}</p>
                          </div>
                        `)
                        .join("")}
                    </div>
                    <footer><div class="footer_bar"></div></footer>
                  </article>

                  <article id="lcars-education" class="lcars-article">
                    <header><h3>Education</h3></header>
                    <div class="article_content">
                      ${renderTwoColumnEducation(education)}
                    </div>
                    <footer><div class="footer_bar"></div></footer>
                  </article>

                  <article id="lcars-projects" class="lcars-article">
                    <header><h3>Projects</h3></header>
                    <div class="article_content">
                      ${projects
                        .slice(0, 4)
                        .map((project) => {
                          const titleHtml = renderLinkedText(project.name || "Project", project.url);
                          const dateLine = renderDateRangeLine(project.startDate, project.endDate);
                          const highlightsHtml = renderHighlightsList(project.highlights, { ulClass: "highlights" });

                          return `
                            <article class="lcars-project">
                              <h3>${titleHtml}</h3>
                              ${dateLine ? `<p class="project-dates">${dateLine}</p>` : ""}
                              ${project.description ? `<p>${linkifyText(project.description)}</p>` : ""}
                              ${highlightsHtml}
                            </article>
                          `;
                        })
                        .join("")}
                    </div>
                    <footer><div class="footer_bar"></div></footer>
                  </article>
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>

      <footer id="main_footer">
        <div class="main_footer_content">
          <p>Inspired by this <a href="https://codepen.io/RobinMartin/pen/abbEpGy">CodePen</a></p>
          <p>Engineering profile in LCARS visual format.</p>
        </div>
      </footer>
    </div>
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

  const profileSlug = profile.toLowerCase().replaceAll(/\s+/g, "-");
  byId("nameLine").innerHTML = `<strong>${escapeHtml(profileSlug)}</strong> - ${escapeHtml(basics.label || "Engineer")}`;
  byId("synopsisLine").textContent = `jtong [--role=${basics.label || "engineer"}] [--location=${city}] [--focus=full-stack]`;
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
  const useFull = useFullResumeFromUrl();
  const primarySource = "resume_full.json";
  const fallbackSource = "resume.json";

  try {
    let response = await fetch(primarySource, { cache: "no-store" });
    if (!response.ok) {
      response = await fetch(fallbackSource, { cache: "no-store" });
    }

    if (!response.ok) {
      throw new Error(`Unable to load ${primarySource} (${response.status})`);
    }

    resumeDataCache = await response.json();
    if (!useFull && resumeDataCache && Array.isArray(resumeDataCache.work)) {
      resumeDataCache.work = getFilteredWorkHistory(resumeDataCache.work);
    }
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

const THEME_RENDERERS = new Map([
  ["two-column", { className: "resume two-column", render: renderTwoColumn }],
  ["bold-header", { className: "resume bold-header", render: renderBoldHeader }],
  ["timeline", { className: "resume timeline", render: renderTimeline }],
  ["lcars", { className: "resume lcars", render: renderLcars }]
]);

function renderCurrentTheme() {
  if (!resumeDataCache) {
    return;
  }

  const container = document.querySelector("main");
  if (!container) {
    return;
  }

  const theme = getCurrentTheme();
  const renderer = THEME_RENDERERS.get(theme);
  if (renderer) {
    container.className = renderer.className;
    container.innerHTML = renderer.render(resumeDataCache);
    return;
  }

  renderDefaultTheme(resumeDataCache);
}

initTheme();
initThemeTouchMenu();
initFullToggle();
initLcarsClickSound();
initLcarsSectionNav();
initLcarsHeaderControls();
loadResume();
