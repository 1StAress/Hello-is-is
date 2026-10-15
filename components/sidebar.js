
"use strict";

// =====================================
// OPS PORTAL V4
// GLOBAL SIDEBAR SYSTEM
// =====================================

window.Sidebar = window.Sidebar || {};

const Sidebar = window.Sidebar;

// =====================================
// PATH
// =====================================

Sidebar.getBasePath = function () {
    const path = window.location.pathname;

    if (path.includes("/modules/Knowledge/")) {
        return "../../../";
    }

    if (path.includes("/modules/")) {
        return "../../";
    }

    return "./";
};

// =====================================
// INITIALIZE
// =====================================

Sidebar.init = async function () {
    console.log("OPS SIDEBAR: INITIALIZING");

    await this.load();
    this.fixLinks();
    this.bind();
    this.active();

    console.log("OPS SIDEBAR: READY");
};

// =====================================
// LOAD SIDEBAR HTML
// =====================================

Sidebar.load = async function () {
    const container = document.getElementById("sidebar-container");

    if (!container) {
        console.warn("OPS SIDEBAR: Container not found");
        return;
    }

    const file = this.getBasePath() + "components/sidebar.html";

    try {
        const response = await fetch(file, {
            cache: "no-cache"
        });

        if (!response.ok) {
            throw new Error(
                `Sidebar request failed: ${response.status}`
            );
        }

        container.innerHTML = await response.text();

        console.log("OPS SIDEBAR: HTML LOADED");
    } catch (error) {
        console.error("OPS SIDEBAR: LOAD ERROR", error);
    }
};

// =====================================
// OPEN / CLOSE / KNOWLEDGE MENU
// =====================================

Sidebar.bind = function () {
    const openButton = document.getElementById("menu-open");
    const sidebar = document.getElementById("sidebar");
    const overlay = document.getElementById("sidebar-overlay");

    // OPEN SIDEBAR
    if (openButton && sidebar) {
        openButton.onclick = function () {
            sidebar.classList.remove("-translate-x-full");

            if (overlay) {
                overlay.classList.remove("hidden");
            }
        };
    }

    // CLOSE SIDEBAR
    if (overlay && sidebar) {
        overlay.onclick = function () {
            sidebar.classList.add("-translate-x-full");
            overlay.classList.add("hidden");
        };
    }

    // KNOWLEDGE CENTER TOGGLE
    const knowledgeToggle =
        document.getElementById("knowledge-toggle");

    const knowledgeMenu =
        document.getElementById("knowledge-menu");

    const knowledgeArrow =
        document.getElementById("knowledge-arrow");

    if (knowledgeToggle && knowledgeMenu) {
        knowledgeToggle.onclick = function () {
            knowledgeMenu.classList.toggle("hidden");

            if (knowledgeArrow) {
                knowledgeArrow.style.transform =
                    knowledgeMenu.classList.contains("hidden")
                        ? "rotate(0deg)"
                        : "rotate(180deg)";
            }
        };
    }
};

// =====================================
// ROUTE MANAGEMENT
// =====================================

Sidebar.fixLinks = function () {
    const base = this.getBasePath();

    const routes = {
        dashboard: base + "dashboard.html",

        ip: base + "modules/IP/ip.html",

        qc: base + "modules/QC/qc.html",

        plc: base + "modules/PLC/plc.html",

        // BACKUP & RESTORE
        backup: base + "backup.html",

        // KNOWLEDGE CENTER
        computer:
            base + "modules/Knowledge/Computer/computer.html",

        camera:
            base + "modules/Knowledge/Camera/camera.html",

        spss:
            base + "modules/Knowledge/SPSS/spss.html",

        cps:
            base + "modules/Knowledge/CPS/cps.html"
    };

    document.querySelectorAll("[data-link]").forEach(function (link) {
        const type = link.dataset.link;
        const destination = routes[type];

        if (destination) {
            link.href = destination;
        } else {
            console.warn(
                "OPS SIDEBAR: Unknown route",
                type
            );
        }
    });
};

// =====================================
// ACTIVE MENU
// =====================================

Sidebar.active = function () {
    const currentPath = window.location.pathname;

    document.querySelectorAll(".menu-link").forEach(function (link) {
        link.classList.remove("menu-active");

        if (!link.href) {
            return;
        }

        try {
            const linkPath = new URL(link.href).pathname;

            if (linkPath === currentPath) {
                link.classList.add("menu-active");
            }
        } catch (error) {
            console.warn(
                "OPS SIDEBAR: Invalid menu URL",
                link.href
            );
        }
    });
};

// =====================================
// START
// =====================================

document.addEventListener("DOMContentLoaded", function () {
    Sidebar.init();
});
