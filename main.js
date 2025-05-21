let entries = [];
let filteredEntries = [];
let toc = {};
let currentIndex = null;
let tocState = {};
let currentLang = "de";

const LANG = {
  de: {
    toc: "Inhaltsverzeichnis",
    search: "🔍 Suchen... Problem, Kategorie, Subkategorie, Tag ...",
    headline: "PowerShell Cheat Sheet",
    problem: "Problem:",
    explanation: "Erklärung:",
    notfound: "Kein Eintrag gefunden.",
  },
  en: {
    toc: "Table of Contents",
    search: "🔍 Search... Problem, Category, Subcategory, Tag ...",
    headline: "PowerShell Cheat Sheet",
    problem: "Problem:",
    explanation: "Explanation:",
    notfound: "No entry found.",
  },
};

fetch("powershell_cheatsheet_entries.json")
  .then((resp) => resp.json())
  .then((data) => {
    entries = data;
    filteredEntries = data;
    buildTOC(filteredEntries);
    renderTOC();
    showEntry(0);
    updateLangUI();
  });

function switchLang(lang) {
  currentLang = lang;
  document.getElementById("btn-de").classList.toggle("active", lang === "de");
  document.getElementById("btn-en").classList.toggle("active", lang === "en");
  document.getElementById("searchInput").placeholder = LANG[lang].search;
  document.getElementById("toc-title").textContent = LANG[lang].toc;
  document.getElementById("headline").textContent = LANG[lang].headline;
  buildTOC(filteredEntries);
  renderTOC();
  // Nach dem Umschalten explizit nochmal den aktuellen Eintrag neu laden!
  if (filteredEntries.length)
    showEntry(currentIndex !== null ? currentIndex : 0);
}

function updateLangUI() {
  document.getElementById("searchInput").placeholder = LANG[currentLang].search;
  document.getElementById("toc-title").textContent = LANG[currentLang].toc;
  document.getElementById("headline").textContent = LANG[currentLang].headline;
}
function buildTOC(entryList) {
  toc = {};
  tocState = {};
  entryList.forEach((e, i) => {
    let cat =
      typeof e.category === "object"
        ? e.category[currentLang] || Object.values(e.category)[0]
        : e.category;
    let sub =
      e.subcategory && typeof e.subcategory === "object"
        ? e.subcategory[currentLang] || Object.values(e.subcategory)[0]
        : e.subcategory || "Allgemein";
    if (!toc[cat]) toc[cat] = {};
    if (!toc[cat][sub]) toc[cat][sub] = [];
    toc[cat][sub].push(i); // Index für filteredEntries, nicht entries!
  });
  Object.keys(toc).forEach((cat) => {
    if (tocState[cat] === undefined) tocState[cat] = false;
    Object.keys(toc[cat]).forEach((sub) => {
      if (tocState[cat + "|" + sub] === undefined)
        tocState[cat + "|" + sub] = false;
    });
  });
}

function renderTOC() {
  const tocDiv = document.getElementById("toc");
  tocDiv.innerHTML = "";
  Object.keys(toc)
    .sort()
    .forEach((category) => {
      const catOpen = tocState[category];
      tocDiv.innerHTML += `
            <div class="toc-category" onclick="toggleTOC('${category}')">
            <span class="arrow">${catOpen ? "➖" : "➕"}</span> ${category}
            </div>`;
      if (catOpen) {
        const subs = toc[category];
        Object.keys(subs)
          .sort()
          .forEach((sub) => {
            const subKey = category + "|" + sub;
            const subOpen = tocState[subKey];
            tocDiv.innerHTML += `
                    <div class="toc-subcategory" onclick="toggleTOC('${category}','${sub}');event.stopPropagation();">
                        <span class="arrow">${
                          subOpen ? "➖" : "➕"
                        }</span> ${sub}
                    </div>`;
            if (subOpen) {
              tocDiv.innerHTML += `<div class="toc-entries">`;
              subs[sub].forEach((idx) => {
                const selected = idx === currentIndex ? "selected" : "";
                let title =
                  filteredEntries[idx].title &&
                  typeof filteredEntries[idx].title === "object"
                    ? filteredEntries[idx].title[currentLang] ||
                      Object.values(filteredEntries[idx].title)[0]
                    : filteredEntries[idx].title;
                tocDiv.innerHTML += `<div class="toc-entry ${selected}" onclick="showEntry(${idx});event.stopPropagation();">${title}</div>`;
              });
              tocDiv.innerHTML += `</div>`;
            }
          });
      }
    });
}

window.toggleTOC = function (category, subcategory) {
  if (subcategory === undefined) {
    tocState[category] = !tocState[category];
  } else {
    tocState[category + "|" + subcategory] =
      !tocState[category + "|" + subcategory];
  }
  renderTOC();
};

function showEntry(idx) {
  currentIndex = idx;
  renderTOC();
  // document.getElementById('searchInput').value = "";
  // Immer aus filteredEntries rendern!
  renderEntry(filteredEntries[idx]);
}

function renderEntry(entry) {
  const sheet = document.getElementById("cheatsheet");
  if (!entry) {
    sheet.innerHTML = `<div class="entry"><b>${LANG[currentLang].notfound}</b></div>`;
    return;
  }
  let codes = "";
  if (Array.isArray(entry.solution)) {
    codes = entry.solution
      .map((sol) => {
        // When solution is HTML, render as actual HTML content
        if (sol.language === "html") {
          return `<div class="code-block">
            ${
              sol.description
                ? `<div class="code-description">${
                    typeof sol.description === "object"
                      ? sol.description[currentLang] ||
                        Object.values(sol.description)[0]
                      : sol.description
                  }</div>`
                : ""
            }
            <div class="html-block">${sol.code}</div>
          </div>`;
        }
        // For other languages, render as code block
        return `<div class="code-block">
            ${
              sol.description
                ? `<div class="code-description">${
                    typeof sol.description === "object"
                      ? sol.description[currentLang] ||
                        Object.values(sol.description)[0]
                      : sol.description
                  }</div>`
                : ""
            }
            <pre class="code-pre">
                <button class="copy-btn" onclick="copyCode(this)">Copy</button>
                <code class="${sol.language}">${(sol.code || "").replace(
          /</g,
          "&lt;"
        )}</code>
            </pre>
        </div>`;
      })
      .join("");
  } else if (entry.solution && entry.solution.code) {
    // Handle single solution similarly with HTML check
    if (entry.solution.language === "html") {
      codes = `<div class="code-block">
          ${
            entry.solution.description
              ? `<div class="code-description">${
                  typeof entry.solution.description === "object"
                    ? entry.solution.description[currentLang] ||
                      Object.values(entry.solution.description)[0]
                    : entry.solution.description
                }</div>`
              : ""
          }
          <div class="html-block">${entry.solution.code}</div>
        </div>`;
    } else {
      codes = `<div class="code-block">
          ${
            entry.solution.description
              ? `<div class="code-description">${
                  typeof entry.solution.description === "object"
                    ? entry.solution.description[currentLang] ||
                      Object.values(entry.solution.description)[0]
                    : entry.solution.description
                }</div>`
              : ""
          }
          <pre class="code-pre">
              <button class="copy-btn" onclick="copyCode(this)">Copy</button>
              <code class="${entry.solution.language}">${(
        entry.solution.code || ""
      ).replace(/</g, "&lt;")}</code>
          </pre>
      </div>`;
    }
  }

  let category =
    entry.category && typeof entry.category === "object"
      ? entry.category[currentLang] || Object.values(entry.category)[0]
      : entry.category || "";
  let subcategory =
    entry.subcategory && typeof entry.subcategory === "object"
      ? entry.subcategory[currentLang] || Object.values(entry.subcategory)[0]
      : entry.subcategory || "";
  let title =
    entry.title && typeof entry.title === "object"
      ? entry.title[currentLang] || Object.values(entry.title)[0]
      : entry.title;
  let problem =
    entry.problem && typeof entry.problem === "object"
      ? entry.problem[currentLang] || Object.values(entry.problem)[0]
      : entry.problem;
  let explanation =
    entry.explanation && typeof entry.explanation === "object"
      ? entry.explanation[currentLang] || Object.values(entry.explanation)[0]
      : entry.explanation;

  // Convert newlines to HTML breaks
  explanation = explanation.replace(/\n/g, "<br>");

  sheet.innerHTML = `
        <div class="entry">
            <div>
                <span class="category">${category}</span>
                <span class="subcategory">${subcategory}</span>
            </div>
            <h2>${title}</h2>
            <div class="tags">${(entry.tags || [])
              .map((tag) => `<span class="tag">${tag}</span>`)
              .join(" ")}</div>
            <p><b>${LANG[currentLang].problem}</b> ${problem}</p>
            <p><b>${LANG[currentLang].explanation}</b> ${explanation}</p>
            <div class="multi-codes">${codes}</div>
        </div>
    `;
  document
    .querySelectorAll("pre code")
    .forEach((el) => hljs.highlightElement(el));
}

function copyCode(btn) {
  const code = btn.parentElement.querySelector("code").innerText;
  navigator.clipboard.writeText(code);
  btn.textContent = "✓ Kopiert!";
  setTimeout(() => (btn.textContent = "Copy"), 1200);
}

// Suche & Inhaltsverzeichnis kombinieren
document.getElementById("searchInput").addEventListener("input", function (e) {
  const value = e.target.value.toLowerCase();
  if (!value.trim()) {
    filteredEntries = entries;
    buildTOC(filteredEntries);
    renderTOC();
    showEntry(currentIndex || 0);
    return;
  }
  filteredEntries = entries.filter(
    (entry) =>
      (typeof entry.title === "object"
        ? entry.title.de + " " + entry.title.en
        : entry.title
      )
        .toLowerCase()
        .includes(value) ||
      (typeof entry.problem === "object"
        ? entry.problem.de + " " + entry.problem.en
        : entry.problem
      )
        .toLowerCase()
        .includes(value) ||
      (typeof entry.category === "object"
        ? entry.category.de + " " + entry.category.en
        : entry.category
      )
        .toLowerCase()
        .includes(value) ||
      (typeof entry.subcategory === "object"
        ? entry.subcategory.de + " " + entry.subcategory.en
        : entry.subcategory || ""
      )
        .toLowerCase()
        .includes(value) ||
      (entry.tags || []).join(" ").toLowerCase().includes(value)
  );
  buildTOC(filteredEntries);
  renderTOC();
  showEntry(filteredEntries.length ? 0 : null);
});
document.getElementById('toc-toggle').addEventListener('click', () => {
    document.querySelector('.sidebar').classList.toggle('open');
    document.body.classList.toggle('toc-open');
});

document.addEventListener('click', (e) => {
    if (!document.body.classList.contains('toc-open')) return;

    const sidebar = document.querySelector('.sidebar');
    const toggle = document.getElementById('toc-toggle');

    // Wenn Klick innerhalb von Sidebar oder TOC-Pfeilen/Submenüs → nichts tun
    if (sidebar.contains(e.target) || toggle.contains(e.target)) return;

    // Sonst Sidebar schließen
    sidebar.classList.remove('open');
    document.body.classList.remove('toc-open');
});

function showEntry(idx) {
    currentIndex = idx;
    renderTOC();
    document.getElementById('searchInput').value = "";
    renderEntry(filteredEntries[idx]);

    // Mobile: Sidebar schließen
    if (window.innerWidth <= 800) {
        document.querySelector('.sidebar').classList.remove('open');
        document.body.classList.remove('toc-open');
    }
}
