
"use strict";

/* =====================================
   OPS PORTAL — SIDEBAR NAVIGATION
   Maintenance route added
===================================== */

window.Sidebar = window.Sidebar || {};
const Sidebar = window.Sidebar;

/* BASE PATH */
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

/* LOAD SIDEBAR HTML */
Sidebar.load = async function () {
    const container = document.getElementById("sidebar-container");

    if (!container) {
        console.warn("OPS SIDEBAR: Container not found");
        return false;
    }

    const file = this.getBasePath() + "components/sidebar.html";

    try {
        const response = await fetch(file, { cache: "no-cache" });

        if (!response.ok) {
            throw new Error("HTTP " + response.status);
        }

        container.innerHTML = await response.text();
        console.log("OPS SIDEBAR: HTML loaded");
        return true;
    } catch (error) {
        console.error("OPS SIDEBAR: Load error", error);
        return false;
    }
};

/* ADD MAINTENANCE MENU WITHOUT REPLACING SIDEBAR HTML */
Sidebar.addMaintenanceLink = function () {
    const nav = document.querySelector("#sidebar-container .ops-sidebar-nav");
    if (!nav || nav.querySelector('[data-link="maintenance"]')) return;

    const link = document.createElement("a");
    link.dataset.link = "maintenance";
    link.className = "menu-link";
    link.innerHTML = `
        <svg viewBox="0 0 24 24" aria-hidden="true">
            <path d="M14.7 6.3a5 5 0 0 0-6.4 6.4L3 18l3 3 5.3-5.3a5 5 0 0 0 6.4-6.4L14 13l-3-3 3.7-3.7z"></path>
        </svg>
        <span>Maintenance</span>
    `;

    const knowledgeToggle = nav.querySelector("#knowledge-toggle");

    if (knowledgeToggle) {
        nav.insertBefore(link, knowledgeToggle);
    } else {
        nav.appendChild(link);
    }
};

/* ROUTES */
Sidebar.fixLinks = function () {
    const base = this.getBasePath();

    const routes = {
        dashboard: base + "dashboard.html",
        ip: base + "modules/IP/ip.html",
        qc: base + "modules/QC/qc.html",
        plc: base + "modules/PLC/plc.html",
        backup: base + "backup.html",
        maintenance: base + "maintenance.html",
        computer: base + "modules/Knowledge/Computer/computer.html",
        camera: base + "modules/Knowledge/Camera/camera.html",
        spss: base + "modules/Knowledge/SPSS/spss.html",
        cps: base + "modules/Knowledge/CPS/cps.html"
    };

    document
        .querySelectorAll("#sidebar-container [data-link]")
        .forEach(function (link) {
            const route = link.dataset.link;
            const destination = routes[route];

            if (!destination) {
                console.warn("OPS SIDEBAR: Unknown route", route);
                return;
            }

            link.setAttribute("href", destination);
            link.setAttribute("data-route-ready", "true");
        });
};

/* SIDEBAR OPEN / CLOSE AND SUBMENU */
Sidebar.bind = function () {
    const openButton = document.getElementById("menu-open");
    const sidebar = document.getElementById("sidebar");
    const overlay = document.getElementById("sidebar-overlay");

    function closeSidebar() {
        if (sidebar) sidebar.classList.add("-translate-x-full");
        if (overlay) overlay.classList.add("hidden");
    }

    if (openButton && sidebar) {
        openButton.onclick = function () {
            sidebar.classList.remove("-translate-x-full");
            if (overlay) overlay.classList.remove("hidden");
        };
    }

    if (overlay) overlay.onclick = closeSidebar;

    document
        .querySelectorAll("#sidebar-container a[data-link]")
        .forEach(function (link) {
            link.addEventListener("click", function (event) {
                const href = link.getAttribute("href");

                if (!href || href === "#") {
                    event.preventDefault();
                    console.error(
                        "OPS SIDEBAR: Missing destination",
                        link.dataset.link
                    );
                    return;
                }

                closeSidebar();
            });
        });

    const knowledgeToggle = document.getElementById("knowledge-toggle");
    const knowledgeMenu = document.getElementById("knowledge-menu");
    const knowledgeArrow = document.getElementById("knowledge-arrow");

    if (knowledgeToggle && knowledgeMenu) {
        knowledgeToggle.onclick = function () {
            knowledgeMenu.classList.toggle("hidden");

            knowledgeToggle.setAttribute(
                "aria-expanded",
                String(!knowledgeMenu.classList.contains("hidden"))
            );

            if (knowledgeArrow) {
                knowledgeArrow.style.transform =
                    knowledgeMenu.classList.contains("hidden")
                        ? "rotate(0deg)"
                        : "rotate(180deg)";
            }
        };
    }
};

/* ACTIVE MENU */
Sidebar.active = function () {
    const currentPath = window.location.pathname;

    document
        .querySelectorAll(
            "#sidebar-container .menu-link, " +
            "#sidebar-container .sub-link"
        )
        .forEach(function (link) {
            link.classList.remove("menu-active");

            const href = link.getAttribute("href");
            if (!href) return;

            try {
                const linkPath = new URL(
                    href,
                    window.location.href
                ).pathname;

                if (linkPath === currentPath) {
                    link.classList.add("menu-active");
                }
            } catch (error) {
                console.warn("OPS SIDEBAR: Invalid URL", href, error);
            }
        });
};

/* INITIALIZE */
Sidebar.init = async function () {
    console.log("OPS SIDEBAR: Initializing");

    const loaded = await this.load();
    if (!loaded) return;

    this.addMaintenanceLink();
    this.fixLinks();
    this.bind();
    this.active();

    console.log("OPS SIDEBAR: Ready");
};

/* START WHEN DOM IS READY */
function startOpsSidebar() {
    Sidebar.init();
}

if (document.readyState === "loading") {
    document.addEventListener(
        "DOMContentLoaded",
        startOpsSidebar,
        { once: true }
    );
} else {
    startOpsSidebar();
}
