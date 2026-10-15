
// =====================================
// OPS PORTAL V4
// SMART SEARCH COMMAND CENTER
// Read-only search across existing modules
// =====================================

const Dashboard = {
    clockTimer: null,
    initialized: false,
    searchTimer: null,

    searchSources: [
        {
            label: "IP Management",
            key: "IP",
            storage: () => OPS.STORAGE.IP,
            link: "modules/IP/ip.html"
        },
        {
            label: "QC Operations",
            key: "QC",
            storage: () => OPS.STORAGE.QC,
            link: "modules/QC/qc.html"
        },
        {
            label: "PLC Work",
            key: "PLC",
            storage: () => OPS.STORAGE.PLC,
            link: "modules/PLC/plc.html"
        },
        {
            label: "Computer Knowledge",
            key: "COMPUTER",
            storage: () => OPS.STORAGE.COMPUTER,
            link: "modules/Knowledge/Computer/computer.html"
        },
        {
            label: "Camera Knowledge",
            key: "CAMERA",
            storage: () => OPS.STORAGE.CAMERA,
            link: "modules/Knowledge/Camera/camera.html"
        },
        {
            label: "SPSS Knowledge",
            key: "SPSS",
            storage: () => OPS.STORAGE.SPSS,
            link: "modules/Knowledge/SPSS/spss.html"
        },
        {
            label: "CPS Knowledge",
            key: "CPS",
            storage: () => OPS.STORAGE.CPS,
            link: "modules/Knowledge/CPS/cps.html"
        }
    ],

    // =====================================
    // INITIALIZE
    // =====================================

    init() {
        if (this.initialized) return;

        try {
            if (typeof OPS === "undefined" || !OPS.checkIndex()) {
                return;
            }

            this.initialized = true;

            this.loadUser();
            this.loadClock();
            this.loadStatistics();
            this.loadRecent();
            this.createSmartSearch();
            this.bind();

        } catch (error) {
            console.error("DASHBOARD INIT ERROR", error);
        }
    },

    // =====================================
    // USER
    // =====================================

    loadUser() {
        const box = document.getElementById("username-display");
        const greeting = document.getElementById("greeting");

        try {
            if (box) {
                box.textContent =
                    sessionStorage.getItem("OPS_LOGIN") || "User";
            }
        } catch (error) {
            if (box) box.textContent = "User";
        }

        if (greeting) {
            const hour = new Date().getHours();

            greeting.textContent =
                hour < 12
                    ? "Good Morning"
                    : hour < 18
                        ? "Good Afternoon"
                        : "Good Evening";
        }
    },

    // =====================================
    // LIVE CLOCK
    // =====================================

    loadClock() {
        const clock = document.getElementById("clock");
        const today = document.getElementById("today");

        const update = () => {
            const now = new Date();

            if (clock) {
                clock.textContent = now.toLocaleTimeString();
            }

            if (today) {
                today.textContent = now.toLocaleDateString("en-US", {
                    weekday: "long",
                    year: "numeric",
                    month: "long",
                    day: "numeric"
                });
            }
        };

        if (this.clockTimer !== null) {
            clearInterval(this.clockTimer);
        }

        update();
        this.clockTimer = setInterval(update, 1000);
    },

    // =====================================
    // READ-ONLY DATA ACCESS
    // =====================================

    readList(storageKey) {
        try {
            const value = OPS.load(storageKey);

            if (!Array.isArray(value)) {
                return {
                    ok: false,
                    items: []
                };
            }

            return {
                ok: true,
                items: value
            };

        } catch (error) {
            console.error("OPS SEARCH READ ERROR", error);

            return {
                ok: false,
                items: []
            };
        }
    },

    getSourceData() {
        return this.searchSources.map(source => {
            let storageKey;

            try {
                storageKey = source.storage();
            } catch (error) {
                return {
                    source,
                    ok: false,
                    items: []
                };
            }

            const result = this.readList(storageKey);

            return {
                source,
                ok: result.ok,
                items: result.items
            };
        });
    },

    // =====================================
    // STATISTICS
    // =====================================

    loadStatistics() {
        const sourceData = this.getSourceData();

        const countFor = key => {
            const entry = sourceData.find(
                item => item.source.key === key
            );

            return entry && entry.ok ? entry.items.length : 0;
        };

        this.setValue("stat-ip", countFor("IP"));
        this.setValue("stat-qc", countFor("QC"));
        this.setValue("stat-plc", countFor("PLC"));

        const knowledgeCount = [
            "COMPUTER",
            "CAMERA",
            "SPSS",
            "CPS"
        ].reduce((total, key) => total + countFor(key), 0);

        this.setValue("stat-knowledge", knowledgeCount);

        return sourceData.every(item => item.ok);
    },

    setValue(id, value) {
        const element = document.getElementById(id);

        if (element) {
            element.textContent = String(value);
        }
    },

    // =====================================
    // SYSTEM STATUS
    // =====================================

    checkSystemHealth() {
        const status = document.querySelector(".status-online");
        const storage = document.getElementById("storage-status");

        let storageAvailable = false;

        try {
            storageAvailable = Boolean(window.localStorage);
        } catch (error) {
            storageAvailable = false;
        }

        const dataReadable = this.loadStatistics();
        const healthy = storageAvailable && dataReadable;

        if (storage) {
            storage.textContent = storageAvailable
                ? "Ready"
                : "Unavailable";
        }

        if (status) {
            const label = Array.from(status.childNodes).find(
                node => node.nodeType === Node.TEXT_NODE &&
                    node.textContent.trim()
            );

            if (label) {
                label.textContent = healthy
                    ? " Healthy"
                    : " Check Required";
            }

            status.classList.toggle("status-online", healthy);
            status.classList.toggle("status-warning", !healthy);
        }

        return healthy;
    },

    // =====================================
    // SMART SEARCH UI
    // Injected into Dashboard without editing HTML
    // =====================================

    createSmartSearch() {
        if (document.getElementById("ops-smart-search")) return;

        const main = document.querySelector("main");

        if (!main) return;

        const section = document.createElement("section");

        section.id = "ops-smart-search";
        section.className = "ops-card";

        const heading = document.createElement("div");
        heading.className = "mb-4";

        const title = document.createElement("h2");
        title.className = "text-2xl font-bold";
        title.textContent = "Smart Search";

        const description = document.createElement("p");
        description.className = "text-slate-300 mt-2";
        description.textContent =
            "Search existing IP, QC, PLC and Knowledge records.";

        heading.append(title, description);

        const form = document.createElement("form");
        form.id = "ops-search-form";
        form.className = "flex flex-col sm:flex-row gap-3";

        const input = document.createElement("input");
        input.id = "ops-search-input";
        input.type = "search";
        input.name = "q";
        input.placeholder = "Search equipment, title, IP, error...";
        input.autocomplete = "off";
        input.setAttribute("aria-label", "Search OPS records");

        const button = document.createElement("button");
        button.type = "submit";
        button.className = "dashboard-btn px-5 py-3 font-semibold";
        button.textContent = "Search";

        form.append(input, button);

        const hint = document.createElement("p");
        hint.className = "text-slate-400 text-sm mt-3";
        hint.textContent =
            "Search runs locally in your browser. It does not change saved records.";

        const results = document.createElement("div");
        results.id = "ops-search-results";
        results.className = "mt-5 space-y-3";
        results.setAttribute("aria-live", "polite");

        section.append(heading, form, hint, results);

        const firstSection = main.querySelector("section");

        if (firstSection) {
            main.insertBefore(section, firstSection);
        } else {
            main.prepend(section);
        }

        form.addEventListener("submit", event => {
            event.preventDefault();
            this.performSearch(input.value);
        });

        input.addEventListener("input", () => {
            if (this.searchTimer !== null) {
                clearTimeout(this.searchTimer);
            }

            this.searchTimer = setTimeout(() => {
                const query = input.value.trim();

                if (query.length >= 2) {
                    this.performSearch(query);
                } else {
                    this.showSearchMessage(
                        query.length === 0
                            ? "Enter a keyword to search."
                            : "Enter at least 2 characters."
                    );
                }
            }, 250);
        });

        this.showSearchMessage("Enter a keyword to search.");
    },

    // =====================================
    // SEARCH HELPERS
    // =====================================

    normalizeText(value) {
        return String(value ?? "")
            .normalize("NFKC")
            .toLocaleLowerCase()
            .trim();
    },

    getSearchableText(value) {
        if (value === null || value === undefined) {
            return "";
        }

        if (typeof value === "string" ||
            typeof value === "number" ||
            typeof value === "boolean") {
            return String(value);
        }

        if (Array.isArray(value)) {
            return value
                .map(item => this.getSearchableText(item))
                .join(" ");
        }

        if (typeof value === "object") {
            return Object.entries(value)
                .map(([key, item]) => `${key} ${this.getSearchableText(item)}`)
                .join(" ");
        }

        return "";
    },

    getRecordTitle(record) {
        if (!record || typeof record !== "object") {
            return "Saved Record";
        }

        return String(
            record.title ??
            record.name ??
            record.hostname ??
            record.ip ??
            record.address ??
            record.machine ??
            record.equipment ??
            record.id ??
            "Saved Record"
        );
    },

    getRecordDetail(record) {
        if (!record || typeof record !== "object") {
            return "";
        }

        const fields = [
            "detail",
            "description",
            "ip",
            "address",
            "hostname",
            "machine",
            "equipment",
            "problem",
            "error",
            "solution",
            "status",
            "date",
            "createdAt"
        ];

        return fields
            .filter(key => record[key] !== undefined &&
                record[key] !== null &&
                String(record[key]).trim() !== "")
            .map(key => `${key}: ${String(record[key])}`)
            .join(" • ");
    },

    // =====================================
    // RUN SEARCH
    // =====================================

    performSearch(rawQuery) {
        const query = this.normalizeText(rawQuery);
        const resultsBox = document.getElementById("ops-search-results");

        if (!resultsBox) return;

        if (query.length < 2) {
            this.showSearchMessage("Enter at least 2 characters.");
            return;
        }

        const sources = this.getSourceData();
        const matches = [];

        sources.forEach(entry => {
            if (!entry.ok) return;

            entry.items.forEach(record => {
                const searchable = this.normalizeText(
                    this.getSearchableText(record)
                );

                if (searchable.includes(query)) {
                    matches.push({
                        source: entry.source,
                        record
                    });
                }
            });
        });

        this.renderSearchResults(matches, resultsBox, sources);
    },

    // =====================================
    // RENDER SEARCH RESULTS SAFELY
    // Use textContent, never inject stored text as HTML
    // =====================================

    renderSearchResults(matches, box, sources) {
        box.replaceChildren();

        const summary = document.createElement("p");
        summary.className = "text-slate-300 text-sm mb-3";
        summary.textContent = `${matches.length} matching record(s) found.`;
        box.appendChild(summary);

        if (matches.length === 0) {
            const empty = document.createElement("div");
            empty.className = "glass-panel p-4";
            empty.textContent =
                "No matching records. Try another keyword.";
            box.appendChild(empty);
            return;
        }

        matches.slice(0, 30).forEach(match => {
            const card = document.createElement("article");
            card.className = "glass-panel p-4";

            const top = document.createElement("div");
            top.className = "flex flex-wrap items-center justify-between gap-2";

            const title = document.createElement("h3");
            title.className = "font-bold";
            title.textContent = this.getRecordTitle(match.record);

            const badge = document.createElement("span");
            badge.className = "text-sm text-cyan-300";
            badge.textContent = match.source.label;

            top.append(title, badge);

            const detail = document.createElement("p");
            detail.className = "text-slate-300 text-sm mt-2";
            detail.textContent =
                this.getRecordDetail(match.record) || "No additional details.";

            card.append(top, detail);
            box.appendChild(card);
        });

        if (matches.length > 30) {
            const limit = document.createElement("p");
            limit.className = "text-slate-400 text-sm";
            limit.textContent =
                `Showing first 30 of ${matches.length} results.`;
            box.appendChild(limit);
        }

        const unreadable = sources.filter(source => !source.ok);

        if (unreadable.length > 0) {
            const note = document.createElement("p");
            note.className = "text-amber-300 text-sm mt-3";
            note.textContent =
                "Some data sources could not be read. Results may be incomplete.";
            box.appendChild(note);
        }
    },

    showSearchMessage(message) {
        const box = document.getElementById("ops-search-results");

        if (!box) return;

        const notice = document.createElement("div");
        notice.className = "glass-panel p-4 text-slate-300";
        notice.textContent = message;

        box.replaceChildren(notice);
    },

    // =====================================
    // RECENT ACTIVITY
    // =====================================

    loadRecent() {
        const box = document.getElementById("recent-list");

        if (!box) return;

        const qc = this.readList(OPS.STORAGE.QC);
        const plc = this.readList(OPS.STORAGE.PLC);

        const data = [...qc.items, ...plc.items];

        data.sort((a, b) => {
            const aId = Number(a.id) || 0;
            const bId = Number(b.id) || 0;
            return bId - aId;
        });

        const recent = data.slice(0, 5);

        if (recent.length === 0) {
            box.innerHTML = OPS.ui.empty("No Recent Activity");
            return;
        }

        box.innerHTML = recent.map(item => OPS.ui.listCard({
            id: item.id,
            title: item.title || "Untitled Activity",
            detail: item.detail || "",
            status: OPS.ui.badge(item.status || "Open", "success"),
            date: item.date || item.createdAt || "-"
        })).join("");
    },

    // =====================================
    // MODULE QUICK CARD
    // =====================================

    renderModules() {
        const box = document.getElementById("module-area");

        if (!box) return;

        const modules = [
            {
                icon: "IP",
                title: "IP Management",
                detail: "QC / RTG Network",
                link: "modules/IP/ip.html"
            },
            {
                icon: "QC",
                title: "QC Operations",
                detail: "Work Log System",
                link: "modules/QC/qc.html"
            },
            {
                icon: "PLC",
                title: "PLC Work",
                detail: "Machine Problem",
                link: "modules/PLC/plc.html"
            },
            {
                icon: "KB",
                title: "Knowledge Center",
                detail: "Computer / Camera / SPSS / CPS",
                link: "modules/Knowledge/knowledge.html"
            }
        ];

        box.innerHTML = modules.map(item => OPS.ui.card({
            icon: item.icon,
            title: item.title,
            subtitle: item.detail
        })).join("");

        box.querySelectorAll(".ops-card").forEach((card, index) => {
            card.addEventListener("click", () => {
                window.location.href = modules[index].link;
            });
        });
    },

    // =====================================
    // EVENTS
    // =====================================

    bind() {
        const logout = document.getElementById("logout-btn");

        if (logout) {
            logout.onclick = () => OPS.logout();
        }
    },

    // =====================================
    // REFRESH
    // =====================================

    refresh() {
        this.loadStatistics();
        this.loadRecent();
    },

    safeRun(fn) {
        try {
            fn();
        } catch (error) {
            console.error("DASHBOARD ERROR", error);
        }
    }
};

// =====================================
// INITIALIZE
// =====================================

document.addEventListener("DOMContentLoaded", () => {
    Dashboard.safeRun(() => Dashboard.init());
});

// =====================================
// KNOWLEDGE POPUP
// =====================================

function openKnowledgePopup() {
    const popup = document.getElementById("knowledge-popup");

    if (popup) {
        popup.classList.remove("hidden");
    }
}

function closeKnowledgePopup() {
    const popup = document.getElementById("knowledge-popup");

    if (popup) {
        popup.classList.add("hidden");
    }
}

document.addEventListener("keydown", event => {
    if (event.key === "Escape") {
        closeKnowledgePopup();
    }
});

document.addEventListener("visibilitychange", () => {
    if (!document.hidden && Dashboard.initialized) {
        Dashboard.safeRun(() => Dashboard.refresh());
    }
});
