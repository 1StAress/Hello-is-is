
/* =========================================
   OPS PORTAL V4 — COMMAND CENTER
   Smart Search + Dashboard
   Safe mode: reads existing data only
   ========================================= */

"use strict";

const Dashboard = {
    clockTimer: null,
    initialized: false,

    searchSources: [
        {
            label: "IP Management",
            key: "IP",
            route: "ip"
        },
        {
            label: "QC Operations",
            key: "QC",
            route: "qc"
        },
        {
            label: "PLC Work",
            key: "PLC",
            route: "plc"
        },
        {
            label: "Computer",
            key: "COMPUTER",
            route: "computer"
        },
        {
            label: "Camera",
            key: "CAMERA",
            route: "camera"
        },
        {
            label: "SPSS",
            key: "SPSS",
            route: "spss"
        },
        {
            label: "CPS",
            key: "CPS",
            route: "cps"
        }
    ],

    init() {
        if (this.initialized) return;

        if (
            typeof OPS === "undefined" ||
            !OPS.checkIndex()
        ) {
            return;
        }

        this.initialized = true;

        try {
            this.loadUser();
            this.loadClock();
            this.createSmartSearch();
            this.refresh();
            this.bind();
        } catch (error) {
            console.error("Dashboard initialization error:", error);
        }
    },

    /* -----------------------------------------
       USER
       ----------------------------------------- */

    loadUser() {
        const username = document.getElementById("username-display");
        const greeting = document.getElementById("greeting");

        if (username) {
            username.textContent =
                sessionStorage.getItem("OPS_LOGIN") || "User";
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

    /* -----------------------------------------
       LIVE CLOCK
       ----------------------------------------- */

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

    /* -----------------------------------------
       READ EXISTING DATA
       Never writes or clears Local Storage.
       ----------------------------------------- */

    readList(key) {
        if (!key) {
            return {
                ok: false,
                data: []
            };
        }

        try {
            const value = OPS.load(key);

            if (Array.isArray(value)) {
                return {
                    ok: true,
                    data: value
                };
            }

            return {
                ok: false,
                data: []
            };
        } catch (error) {
            console.error("Data read error:", key, error);

            return {
                ok: false,
                data: []
            };
        }
    },

    /* -----------------------------------------
       STATISTICS
       ----------------------------------------- */

    loadStatistics() {
        const sources = [
            ["stat-ip", OPS.STORAGE.IP],
            ["stat-qc", OPS.STORAGE.QC],
            ["stat-plc", OPS.STORAGE.PLC],
            ["stat-knowledge-computer", OPS.STORAGE.COMPUTER],
            ["stat-knowledge-camera", OPS.STORAGE.CAMERA],
            ["stat-knowledge-spss", OPS.STORAGE.SPSS],
            ["stat-knowledge-cps", OPS.STORAGE.CPS]
        ];

        const results = {};

        sources.forEach(([id, key]) => {
            results[id] = this.readList(key);
            this.setValue(id, results[id].data.length);
        });

        const knowledgeIds = [
            "stat-knowledge-computer",
            "stat-knowledge-camera",
            "stat-knowledge-spss",
            "stat-knowledge-cps"
        ];

        const knowledgeCount = knowledgeIds.reduce(
            (total, id) => total + results[id].data.length,
            0
        );

        this.setValue("stat-knowledge", knowledgeCount);

        return Object.values(results).every(item => item.ok);
    },

    setValue(id, value) {
        const element = document.getElementById(id);

        if (element) {
            element.textContent = String(value);
        }
    },

    /* -----------------------------------------
       SYSTEM STATUS
       ----------------------------------------- */

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

            storage.classList.toggle(
                "status-error",
                !storageAvailable
            );
        }

        if (status) {
            status.classList.toggle("status-online", healthy);
            status.classList.toggle("status-warning", !healthy);

            status.setAttribute(
                "aria-label",
                healthy
                    ? "System data checks passed"
                    : "System requires checking"
            );

            Array.from(status.childNodes).forEach(node => {
                if (node.nodeType === Node.TEXT_NODE) {
                    node.textContent = healthy
                        ? " Operational"
                        : " Check Required";
                }
            });
        }

        return healthy;
    },

    /* -----------------------------------------
       SMART SEARCH UI
       ----------------------------------------- */

    createSmartSearch() {
        const main = document.querySelector("main");

        if (!main) return;

        // Avoid creating duplicate search panels.
        if (document.getElementById("ops-smart-search")) {
            return;
        }

        const section = document.createElement("section");
        section.id = "ops-smart-search";
        section.className = "ops-card";
        section.style.cssText = [
            "padding:24px",
            "border-radius:20px",
            "margin-bottom:24px"
        ].join(";");

        const heading = document.createElement("div");
        heading.className = "mb-4";

        const title = document.createElement("h2");
        title.className = "text-2xl font-bold";
        title.textContent = "OPS Smart Search";

        const subtitle = document.createElement("p");
        subtitle.className = "text-slate-300 mt-2";
        subtitle.textContent =
            "Search saved records across IP, QC, PLC and Knowledge.";

        heading.append(title, subtitle);

        const searchBox = document.createElement("div");
        searchBox.className = "flex flex-col md:flex-row gap-3 mt-5";

        const input = document.createElement("input");
        input.id = "ops-search-input";
        input.type = "search";
        input.autocomplete = "off";
        input.placeholder =
            "Search IP address, machine, error, title...";
        input.setAttribute("aria-label", "Search OPS records");
        input.className =
            "w-full rounded-xl px-4 py-3 text-white bg-slate-900 border border-cyan-500/40 outline-none";

        const button = document.createElement("button");
        button.id = "ops-search-button";
        button.type = "button";
        button.textContent = "Search";
        button.className =
            "rounded-xl px-6 py-3 font-bold bg-cyan-500 text-slate-950 hover:bg-cyan-300 transition";

        searchBox.append(input, button);

        const message = document.createElement("p");
        message.id = "ops-search-message";
        message.className = "text-sm text-slate-300 mt-4";
        message.textContent = "Enter a keyword to begin searching.";

        const results = document.createElement("div");
        results.id = "ops-search-results";
        results.className = "mt-4 space-y-3";

        section.append(heading, searchBox, message, results);

        // Place search just after the hero section when possible.
        const hero = main.querySelector("section");

        if (hero && hero.nextSibling) {
            main.insertBefore(section, hero.nextSibling);
        } else {
            main.prepend(section);
        }

        button.addEventListener("click", () => {
            this.runSearch(input.value);
        });

        input.addEventListener("keydown", event => {
            if (event.key === "Enter") {
                this.runSearch(input.value);
            }
        });

        input.addEventListener("input", () => {
            if (!input.value.trim()) {
                message.textContent =
                    "Enter a keyword to begin searching.";
                results.replaceChildren();
            }
        });
    },

    /* -----------------------------------------
       SEARCH HELPERS
       ----------------------------------------- */

    normalize(value) {
        return String(value ?? "")
            .toLocaleLowerCase()
            .trim();
    },

    searchableText(value, depth = 0) {
        if (depth > 6 || value === null || value === undefined) {
            return "";
        }

        if (
            typeof value === "string" ||
            typeof value === "number" ||
            typeof value === "boolean"
        ) {
            return String(value);
        }

        if (Array.isArray(value)) {
            return value
                .map(item => this.searchableText(item, depth + 1))
                .join(" ");
        }

        if (typeof value === "object") {
            return Object.entries(value)
                .map(([key, item]) =>
                    key + " " + this.searchableText(item, depth + 1)
                )
                .join(" ");
        }

        return "";
    },

    displayTitle(record) {
        if (!record || typeof record !== "object") {
            return "Saved Record";
        }

        return String(
            record.title ||
            record.name ||
            record.ip ||
            record.ipAddress ||
            record.hostname ||
            record.machine ||
            record.device ||
            record.id ||
            "Saved Record"
        );
    },

    displayDetails(record) {
        if (!record || typeof record !== "object") {
            return String(record ?? "");
        }

        return Object.entries(record)
            .filter(([key, value]) =>
                !["password", "token", "secret"].includes(
                    key.toLowerCase()
                ) &&
                value !== null &&
                value !== undefined &&
                typeof value !== "object"
            )
            .slice(0, 8)
            .map(([key, value]) => `${key}: ${String(value)}`)
            .join(" • ");
    },

    /* -----------------------------------------
       RUN SMART SEARCH
       ----------------------------------------- */

    runSearch(rawQuery) {
        const query = this.normalize(rawQuery);
        const message = document.getElementById("ops-search-message");
        const resultsBox = document.getElementById("ops-search-results");

        if (!message || !resultsBox) return;

        resultsBox.replaceChildren();

        if (!query) {
            message.textContent = "Please enter a keyword.";
            return;
        }

        const matches = [];
        let readableSources = 0;

        this.searchSources.forEach(source => {
            const key = OPS.STORAGE[source.key];

            if (!key) return;

            const result = this.readList(key);

            if (!result.ok) return;

            readableSources++;

            result.data.forEach(record => {
                const text = this.searchableText(record);

                if (this.normalize(text).includes(query)) {
                    matches.push({
                        source: source,
                        record: record
                    });
                }
            });
        });

        if (matches.length === 0) {
            message.textContent = readableSources === 0
                ? "Unable to read the configured data sources. Check the browser console."
                : "No matching records found. Try another keyword.";

            return;
        }

        const visibleMatches = matches.slice(0, 30);

        message.textContent =
            `${matches.length} matching record(s) found` +
            (matches.length > 30 ? " — showing first 30." : ".");

        visibleMatches.forEach(({ source, record }) => {
            const card = document.createElement("article");
            card.className = "ops-card";
            card.style.cssText =
                "padding:16px;border-radius:14px;overflow-wrap:anywhere;";

            const top = document.createElement("div");
            top.className =
                "flex flex-col md:flex-row md:items-center md:justify-between gap-2";

            const title = document.createElement("h3");
            title.className = "font-bold text-lg";
            title.textContent = this.displayTitle(record);

            const category = document.createElement("span");
            category.className = "text-cyan-300 text-sm";
            category.textContent = source.label;

            top.append(title, category);

            const details = document.createElement("p");
            details.className = "text-slate-300 text-sm mt-3";
            details.textContent = this.displayDetails(record) ||
                "No additional details.";

            const openButton = document.createElement("button");
            openButton.type = "button";
            openButton.className =
                "mt-3 rounded-lg px-4 py-2 text-sm font-semibold bg-cyan-500/20 text-cyan-200 hover:bg-cyan-500/30";
            openButton.textContent = `Open ${source.label}`;

            openButton.addEventListener("click", () => {
                if (typeof OPS.go === "function") {
                    OPS.go(source.route);
                }
            });

            card.append(top, details, openButton);
            resultsBox.appendChild(card);
        });
    },

    /* -----------------------------------------
       RECENT ACTIVITY
       ----------------------------------------- */

    loadRecent() {
        const box = document.getElementById("recent-list");

        if (!box) return;

        const qc = this.readList(OPS.STORAGE.QC).data;
        const plc = this.readList(OPS.STORAGE.PLC).data;

        const recent = [...qc, ...plc]
            .sort((a, b) =>
                (Number(b.id) || 0) - (Number(a.id) || 0)
            )
            .slice(0, 5);

        box.replaceChildren();

        if (recent.length === 0) {
            const empty = document.createElement("div");
            empty.className =
                "ops-card text-center text-slate-400";
            empty.textContent = "No Recent Activity";
            box.appendChild(empty);
            return;
        }

        recent.forEach(item => {
            const card = document.createElement("div");
            card.className = "ops-card";
            card.style.cssText = "padding:16px;border-radius:14px;";

            const title = document.createElement("h3");
            title.className = "font-bold";
            title.textContent = item.title || "Untitled Activity";

            const detail = document.createElement("p");
            detail.className = "text-slate-300 text-sm mt-2";
            detail.textContent = item.detail || "";

            const meta = document.createElement("p");
            meta.className = "text-slate-400 text-xs mt-2";
            meta.textContent =
                `${item.status || "Open"} • ${item.date || item.createdAt || "-"}`;

            card.append(title, detail, meta);
            box.appendChild(card);
        });
    },

    /* -----------------------------------------
       EVENTS
       ----------------------------------------- */

    bind() {
        const logout = document.getElementById("logout-btn");

        if (logout) {
            logout.onclick = () => {
                OPS.logout();
            };
        }
    },

    /* -----------------------------------------
       REFRESH
       ----------------------------------------- */

    refresh() {
        try {
            this.loadStatistics();
            this.loadRecent();
            this.checkSystemHealth();
        } catch (error) {
            console.error("Dashboard refresh error:", error);
        }
    }
};

/* =========================================
   KNOWLEDGE POPUP
   ========================================= */

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

/* =========================================
   STARTUP
   ========================================= */

document.addEventListener("DOMContentLoaded", () => {
    Dashboard.init();
});

document.addEventListener("keydown", event => {
    if (event.key === "Escape") {
        closeKnowledgePopup();
    }
});

document.addEventListener("visibilitychange", () => {
    if (!document.hidden && Dashboard.initialized) {
        Dashboard.refresh();
    }
});
