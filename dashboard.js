
// =====================================
// OPS PORTAL V4
// DASHBOARD COMMAND CENTER
// Safe refresh, live clock, statistics
// =====================================

const Dashboard = {
    clockTimer: null,
    initialized: false,

    init() {
        if (this.initialized) return;

        this.initialized = true;

        try {
            if (typeof OPS === "undefined" || !OPS.checkIndex()) {
                this.initialized = false;
                return;
            }

            this.loadUser();
            this.loadClock();
            this.refresh();
            this.checkSystemHealth();
            this.bind();

        } catch (error) {
            console.error("DASHBOARD INIT ERROR", error);
            this.initialized = false;
        }
    },

    // =====================================
    // USER
    // =====================================

    loadUser() {
        const box = document.getElementById("username-display");
        if (!box) return;

        let username = "User";

        try {
            username = sessionStorage.getItem("OPS_LOGIN") || "User";
        } catch (error) {
            console.warn("Unable to read session username.", error);
        }

        box.textContent = username;

        const greeting = document.getElementById("greeting");

        if (greeting) {
            const hour = new Date().getHours();

            if (hour < 12) {
                greeting.textContent = "Good Morning";
            } else if (hour < 18) {
                greeting.textContent = "Good Afternoon";
            } else {
                greeting.textContent = "Good Evening";
            }
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
            this.clockTimer = null;
        }

        update();
        this.clockTimer = setInterval(update, 1000);
    },

    // =====================================
    // SAFE DATA READER
    // Reads existing OPS data only.
    // Does not write, clear, or migrate data.
    // =====================================

    readList(key) {
        try {
            const result = OPS.load(key);

            if (!Array.isArray(result)) {
                return {
                    ok: false,
                    data: []
                };
            }

            return {
                ok: true,
                data: result
            };

        } catch (error) {
            console.error("DASHBOARD DATA READ ERROR", error);

            return {
                ok: false,
                data: []
            };
        }
    },

    // =====================================
    // STATISTICS
    // =====================================

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

        sources.forEach(([elementId, key]) => {
            results[elementId] = this.readList(key);
        });

        this.setValue(
            "stat-ip",
            results["stat-ip"].data.length
        );

        this.setValue(
            "stat-qc",
            results["stat-qc"].data.length
        );

        this.setValue(
            "stat-plc",
            results["stat-plc"].data.length
        );

        const knowledgeKeys = [
            "stat-knowledge-computer",
            "stat-knowledge-camera",
            "stat-knowledge-spss",
            "stat-knowledge-cps"
        ];

        const knowledgeCount = knowledgeKeys.reduce(
            (total, key) => total + results[key].data.length,
            0
        );

        this.setValue("stat-knowledge", knowledgeCount);

        return Object.values(results).every(result => result.ok);
    },

    setValue(id, value) {
        const element = document.getElementById(id);

        if (element) {
            element.textContent = String(value);
        }
    },

    // =====================================
    // SYSTEM HEALTH
    // Reports read-check results only.
    // It does not modify browser storage.
    // =====================================

    checkSystemHealth() {
        const statusElement = document.querySelector(".status-online");
        const storageElement = document.getElementById("storage-status");

        let storageAvailable = false;

        try {
            storageAvailable = typeof window.localStorage !== "undefined";
        } catch (error) {
            storageAvailable = false;
        }

        const dataReadable = this.loadStatistics();
        const healthy = storageAvailable && dataReadable;

        if (storageElement) {
            storageElement.textContent = storageAvailable
                ? "Ready"
                : "Unavailable";

            storageElement.classList.toggle(
                "status-error",
                !storageAvailable
            );
        }

        if (statusElement) {
            statusElement.classList.toggle("status-online", healthy);
            statusElement.classList.toggle("status-warning", !healthy);

            // Preserve the existing SVG icon.
            Array.from(statusElement.childNodes).forEach(node => {
                if (node.nodeType === Node.TEXT_NODE) {
                    node.textContent = healthy
                        ? " Operational"
                        : " Check Required";
                }
            });

            statusElement.setAttribute(
                "aria-label",
                healthy
                    ? "System data checks passed"
                    : "System requires checking"
            );
        }

        return healthy;
    },

    // =====================================
    // RECENT ACTIVITY
    // =====================================

    loadRecent() {
        const box = document.getElementById("recent-list");

        if (!box) return;

        const qcResult = this.readList(OPS.STORAGE.QC);
        const plcResult = this.readList(OPS.STORAGE.PLC);

        const data = [
            ...qcResult.data,
            ...plcResult.data
        ];

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

        box.innerHTML = recent.map(item => {
            return OPS.ui.listCard({
                id: item.id,
                title: item.title || "Untitled Activity",
                detail: item.detail || "",
                status: OPS.ui.badge(
                    item.status || "Open",
                    "success"
                ),
                date: item.date || item.createdAt || "-"
            });
        }).join("");
    },

    // =====================================
    // MODULE QUICK CARD
    // Retained for pages that use module-area
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

        box.innerHTML = modules.map(item => {
            return OPS.ui.card({
                icon: item.icon,
                title: item.title,
                subtitle: item.detail
            });
        }).join("");

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
            logout.onclick = () => {
                OPS.logout();
            };
        }
    },

    // =====================================
    // REFRESH
    // =====================================

    refresh() {
        try {
            this.loadStatistics();
            this.loadRecent();
            this.checkSystemHealth();
        } catch (error) {
            console.error("DASHBOARD REFRESH ERROR", error);
        }
    },

    // =====================================
    // ERROR SAFE
    // =====================================

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

// Close Knowledge popup using Escape key.
document.addEventListener("keydown", event => {
    if (event.key === "Escape") {
        closeKnowledgePopup();
    }
});

// Refresh dashboard data when returning to the page.
document.addEventListener("visibilitychange", () => {
    if (!document.hidden && Dashboard.initialized) {
        Dashboard.safeRun(() => Dashboard.refresh());
    }
});
