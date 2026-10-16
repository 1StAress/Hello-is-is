
/* =========================================
   OPS PORTAL V4 — COMMAND CENTER
   Phase 2: Smart Search
   Phase 3: Maintenance Mission Board
   Safe storage: OPS_MAINTENANCE_MISSIONS only
========================================= */
"use strict";

const Dashboard = {
    clockTimer: null,
    initialized: false,
    maintenanceKey: "OPS_MAINTENANCE_MISSIONS",

    searchSources: [
        { label: "IP Management", key: "IP", route: "ip" },
        { label: "QC Operations", key: "QC", route: "qc" },
        { label: "PLC Work", key: "PLC", route: "plc" },
        { label: "Computer", key: "COMPUTER", route: "computer" },
        { label: "Camera", key: "CAMERA", route: "camera" },
        { label: "SPSS", key: "SPSS", route: "spss" },
        { label: "CPS", key: "CPS", route: "cps" }
    ],

    init() {
        if (this.initialized) return;
        if (typeof OPS === "undefined" || !OPS.checkIndex()) return;

        this.initialized = true;

        try {
            this.loadUser();
            this.loadClock();
            this.createSmartSearch();
            this.createMaintenanceBoard();
            this.refresh();
            this.bind();
        } catch (error) {
            console.error("Dashboard initialization error:", error);
        }
    },

    /* USER */
    loadUser() {
        const username = document.getElementById("username-display");
        const greeting = document.getElementById("greeting");

        if (username) {
            username.textContent =
                sessionStorage.getItem("OPS_LOGIN") || "User";
        }

        if (greeting) {
            const hour = new Date().getHours();
            greeting.textContent = hour < 12
                ? "Good Morning"
                : hour < 18
                    ? "Good Afternoon"
                    : "Good Evening";
        }
    },

    /* LIVE CLOCK */
    loadClock() {
        const clock = document.getElementById("clock");
        const today = document.getElementById("today");

        const update = () => {
            const now = new Date();

            if (clock) clock.textContent = now.toLocaleTimeString();

            if (today) {
                today.textContent = now.toLocaleDateString("en-US", {
                    weekday: "long",
                    year: "numeric",
                    month: "long",
                    day: "numeric"
                });
            }
        };

        if (this.clockTimer !== null) clearInterval(this.clockTimer);
        update();
        this.clockTimer = setInterval(update, 1000);
    },

    /* READ-ONLY ACCESS TO EXISTING MODULE DATA */
    readList(key) {
        if (!key) return { ok: false, data: [] };

        try {
            const value = OPS.load(key);
            return Array.isArray(value)
                ? { ok: true, data: value }
                : { ok: false, data: [] };
        } catch (error) {
            console.error("Data read error:", key, error);
            return { ok: false, data: [] };
        }
    },

    /* DASHBOARD STATISTICS */
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

        const count = knowledgeIds.reduce(
            (total, id) => total + results[id].data.length,
            0
        );

        this.setValue("stat-knowledge", count);
        return Object.values(results).every(item => item.ok);
    },

    setValue(id, value) {
        const element = document.getElementById(id);
        if (element) element.textContent = String(value);
    },

    checkSystemHealth() {
        const status = document.querySelector(".status-online");
        const storage = document.getElementById("storage-status");
        let available = false;

        try {
            available = Boolean(window.localStorage);
        } catch (error) {
            available = false;
        }

        const readable = this.loadStatistics();
        const healthy = available && readable;

        if (storage) {
            storage.textContent = available ? "Ready" : "Unavailable";
            storage.classList.toggle("status-error", !available);
        }

        if (status) {
            status.classList.toggle("status-online", healthy);
            status.classList.toggle("status-warning", !healthy);
            status.setAttribute(
                "aria-label",
                healthy ? "System data checks passed" : "System requires checking"
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

    /* SMART SEARCH UI */
    createSmartSearch() {
        const main = document.querySelector("main");
        if (!main || document.getElementById("ops-smart-search")) return;

        const section = document.createElement("section");
        section.id = "ops-smart-search";
        section.className = "ops-card";
        section.style.cssText = "padding:24px;border-radius:20px;margin-bottom:24px;";

        const title = document.createElement("h2");
        title.className = "text-2xl font-bold";
        title.textContent = "OPS Smart Search";

        const subtitle = document.createElement("p");
        subtitle.className = "text-slate-300 mt-2";
        subtitle.textContent =
            "Search saved records across IP, QC, PLC and Knowledge.";

        const row = document.createElement("div");
        row.className = "flex flex-col md:flex-row gap-3 mt-5";

        const input = document.createElement("input");
        input.id = "ops-search-input";
        input.type = "search";
        input.autocomplete = "off";
        input.placeholder = "Search IP address, machine, error, title...";
        input.setAttribute("aria-label", "Search OPS records");
        input.className =
            "w-full rounded-xl px-4 py-3 text-white bg-slate-900 border border-cyan-500/40 outline-none";

        const button = document.createElement("button");
        button.id = "ops-search-button";
        button.type = "button";
        button.textContent = "Search";
        button.className =
            "rounded-xl px-6 py-3 font-bold bg-cyan-500 text-slate-950 hover:bg-cyan-300 transition";

        row.append(input, button);

        const message = document.createElement("p");
        message.id = "ops-search-message";
        message.className = "text-sm text-slate-300 mt-4";
        message.textContent = "Enter a keyword to begin searching.";

        const results = document.createElement("div");
        results.id = "ops-search-results";
        results.className = "mt-4 space-y-3";

        section.append(title, subtitle, row, message, results);

        const hero = main.querySelector("section");
        if (hero && hero.nextSibling) {
            main.insertBefore(section, hero.nextSibling);
        } else {
            main.prepend(section);
        }

        button.addEventListener("click", () => this.runSearch(input.value));

        input.addEventListener("keydown", event => {
            if (event.key === "Enter") this.runSearch(input.value);
        });

        input.addEventListener("input", () => {
            if (!input.value.trim()) {
                message.textContent = "Enter a keyword to begin searching.";
                results.replaceChildren();
            }
        });
    },

    normalize(value) {
        return String(value ?? "").toLocaleLowerCase().trim();
    },

    searchableText(value, depth = 0) {
        if (depth > 6 || value === null || value === undefined) return "";

        if (["string", "number", "boolean"].includes(typeof value)) {
            return String(value);
        }

        if (Array.isArray(value)) {
            return value.map(item => this.searchableText(item, depth + 1)).join(" ");
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
        if (!record || typeof record !== "object") return "Saved Record";

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
        if (!record || typeof record !== "object") return String(record ?? "");

        return Object.entries(record)
            .filter(([key, value]) =>
                !["password", "token", "secret"].includes(key.toLowerCase()) &&
                value !== null &&
                value !== undefined &&
                typeof value !== "object"
            )
            .slice(0, 8)
            .map(([key, value]) => `${key}: ${String(value)}`)
            .join(" • ");
    },

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
                if (this.normalize(this.searchableText(record)).includes(query)) {
                    matches.push({ source, record });
                }
            });
        });

        if (!matches.length) {
            message.textContent = readableSources === 0
                ? "Unable to read configured data sources. Check the browser console."
                : "No matching records found. Try another keyword.";
            return;
        }

        message.textContent =
            `${matches.length} matching record(s) found` +
            (matches.length > 30 ? " — showing first 30." : ".");

        matches.slice(0, 30).forEach(({ source, record }) => {
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
            details.textContent = this.displayDetails(record) || "No additional details.";

            const openButton = document.createElement("button");
            openButton.type = "button";
            openButton.className =
                "mt-3 rounded-lg px-4 py-2 text-sm font-semibold bg-cyan-500/20 text-cyan-200 hover:bg-cyan-500/30";
            openButton.textContent = `Open ${source.label}`;
            openButton.addEventListener("click", () => OPS.go(source.route));

            card.append(top, details, openButton);
            resultsBox.appendChild(card);
        });
    },

    /* =====================================
       PHASE 3 — MAINTENANCE MISSION BOARD
       Only accesses OPS_MAINTENANCE_MISSIONS.
       Never clears or modifies other keys.
    ===================================== */

    loadMissions() {
        try {
            const raw = localStorage.getItem(this.maintenanceKey);

            // An absent key means no missions yet. Do not write during read.
            if (raw === null) return [];

            const parsed = JSON.parse(raw);
            if (!Array.isArray(parsed)) {
                console.error("Maintenance data format is invalid.");
                return [];
            }

            return parsed.filter(item =>
                item && typeof item === "object" && !Array.isArray(item)
            );
        } catch (error) {
            console.error("Unable to read maintenance missions:", error);
            return [];
        }
    },

    saveMissions(missions) {
        // Deliberately write to the dedicated maintenance key only.
        try {
            localStorage.setItem(this.maintenanceKey, JSON.stringify(missions));
            return true;
        } catch (error) {
            console.error("Unable to save maintenance missions:", error);
            this.showMissionMessage(
                "บันทึกไม่สำเร็จ: พื้นที่จัดเก็บอาจเต็มหรือถูกปิดใช้งาน",
                true
            );
            return false;
        }
    },

    createMaintenanceBoard() {
        const main = document.querySelector("main");
        if (!main || document.getElementById("ops-maintenance-board")) return;

        const section = document.createElement("section");
        section.id = "ops-maintenance-board";
        section.className = "ops-card";
        section.style.cssText =
            "padding:24px;border-radius:20px;overflow-wrap:anywhere;";

        const heading = document.createElement("div");
        heading.className =
            "flex flex-col md:flex-row md:items-center md:justify-between gap-3";

        const headingText = document.createElement("div");
        const title = document.createElement("h2");
        title.className = "text-2xl font-bold";
        title.textContent = "Maintenance Mission Board";

        const subtitle = document.createElement("p");
        subtitle.className = "text-slate-300 mt-2";
        subtitle.textContent =
            "บันทึก ติดตาม และจัดการงานซ่อม โดยแยกข้อมูลออกจากโมดูลเดิม";

        headingText.append(title, subtitle);

        const count = document.createElement("div");
        count.id = "mission-total";
        count.className =
            "rounded-xl px-4 py-3 text-cyan-200 bg-cyan-500/10 border border-cyan-500/30 font-bold";
        count.textContent = "0 missions";

        heading.append(headingText, count);

        const form = document.createElement("form");
        form.id = "mission-form";
        form.className = "mt-6 grid grid-cols-1 md:grid-cols-2 gap-4";
        form.noValidate = true;

        const machine = this.createMissionInput(
            "mission-machine", "Machine", "เช่น Machine A / Conveyor 01", true
        );
        const symptom = this.createMissionInput(
            "mission-symptom", "Symptom", "อาการเสียหรือ Error ที่พบ", true, "textarea"
        );
        const assignee = this.createMissionInput(
            "mission-assignee", "Assignee", "ชื่อผู้รับผิดชอบ", true
        );
        const status = this.createMissionSelect(
            "mission-status",
            "Status",
            [
                ["Open", "Open — รอดำเนินการ"],
                ["In Progress", "In Progress — กำลังซ่อม"],
                ["On Hold", "On Hold — รออะไหล่/รอข้อมูล"],
                ["Completed", "Completed — ซ่อมเสร็จ"]
            ]
        );
        const parts = this.createMissionInput(
            "mission-parts", "Parts", "อะไหล่ที่ใช้ หรืออะไหล่ที่ต้องเตรียม", false, "textarea"
        );

        [machine, symptom, assignee, status, parts].forEach(field => {
            form.appendChild(field);
        });

        const actions = document.createElement("div");
        actions.className = "md:col-span-2 flex flex-wrap gap-3 items-center";

        const saveButton = document.createElement("button");
        saveButton.id = "mission-save-button";
        saveButton.type = "submit";
        saveButton.className =
            "rounded-xl px-5 py-3 font-bold bg-cyan-500 text-slate-950 hover:bg-cyan-300 transition";
        saveButton.textContent = "＋ Add Mission";

        const cancelButton = document.createElement("button");
        cancelButton.id = "mission-cancel-button";
        cancelButton.type = "button";
        cancelButton.className =
            "hidden rounded-xl px-5 py-3 font-semibold bg-slate-700 text-white hover:bg-slate-600";
        cancelButton.textContent = "Cancel Edit";

        actions.append(saveButton, cancelButton);
        form.appendChild(actions);

        const message = document.createElement("p");
        message.id = "mission-message";
        message.className = "text-sm text-slate-300 mt-4";
        message.setAttribute("role", "status");
        message.setAttribute("aria-live", "polite");

        const toolbar = document.createElement("div");
        toolbar.className =
            "mt-8 flex flex-col md:flex-row gap-3 md:items-center";

        const search = document.createElement("input");
        search.id = "mission-filter";
        search.type = "search";
        search.placeholder = "ค้นหาชื่อเครื่อง อาการ ผู้รับผิดชอบ หรืออะไหล่...";
        search.className =
            "w-full rounded-xl px-4 py-3 text-white bg-slate-900 border border-cyan-500/40 outline-none";
        search.setAttribute("aria-label", "ค้นหางานซ่อม");

        const filter = this.createMissionSelect(
            "mission-status-filter",
            "กรองสถานะ",
            [
                ["All", "ทุกสถานะ"],
                ["Open", "Open"],
                ["In Progress", "In Progress"],
                ["On Hold", "On Hold"],
                ["Completed", "Completed"]
            ]
        );
        filter.classList.add("md:max-w-xs");

        toolbar.append(search, filter);

        const listTitle = document.createElement("h3");
        listTitle.className = "text-xl font-bold mt-8 mb-4";
        listTitle.textContent = "Mission Queue";

        const list = document.createElement("div");
        list.id = "mission-list";
        list.className = "space-y-4";

        section.append(heading, form, message, toolbar, listTitle, list);

        // Place after Smart Search when available; otherwise after the hero.
        const searchPanel = document.getElementById("ops-smart-search");
        const hero = main.querySelector("section");

        if (searchPanel && searchPanel.parentNode === main) {
            searchPanel.insertAdjacentElement("afterend", section);
        } else if (hero && hero.parentNode === main) {
            hero.insertAdjacentElement("afterend", section);
        } else {
            main.prepend(section);
        }

        form.addEventListener("submit", event => {
            event.preventDefault();
            this.submitMission();
        });

        cancelButton.addEventListener("click", () => this.resetMissionForm());
        search.addEventListener("input", () => this.renderMissions());
        filter.addEventListener("change", () => this.renderMissions());

        this.renderMissions();
    },

    createMissionInput(id, labelText, placeholder, required, type = "text") {
        const wrapper = document.createElement("label");
        wrapper.className = "block min-w-0";

        const label = document.createElement("span");
        label.className = "block text-sm font-semibold text-slate-200 mb-2";
        label.textContent = labelText + (required ? " *" : "");

        const input = document.createElement(type === "textarea" ? "textarea" : "input");
        input.id = id;
        input.name = id;
        input.placeholder = placeholder;
        input.required = required;
        input.className =
            "w-full rounded-xl px-4 py-3 text-white bg-slate-900 border border-cyan-500/30 outline-none focus:border-cyan-300";

        if (type === "textarea") {
            input.rows = 3;
            input.style.resize = "vertical";
        } else {
            input.type = "text";
            input.autocomplete = "off";
        }

        wrapper.append(label, input);
        return wrapper;
    },

    createMissionSelect(id, labelText, options) {
        const wrapper = document.createElement("label");
        wrapper.className = "block min-w-0";

        const label = document.createElement("span");
        label.className = "block text-sm font-semibold text-slate-200 mb-2";
        label.textContent = labelText;

        const select = document.createElement("select");
        select.id = id;
        select.name = id;
        select.className =
            "w-full rounded-xl px-4 py-3 text-white bg-slate-900 border border-cyan-500/30 outline-none focus:border-cyan-300";

        options.forEach(([value, text]) => {
            const option = document.createElement("option");
            option.value = value;
            option.textContent = text;
            select.appendChild(option);
        });

        wrapper.append(label, select);
        return wrapper;
    },

    showMissionMessage(message, isError = false) {
        const box = document.getElementById("mission-message");
        if (!box) return;

        box.textContent = message;
        box.classList.toggle("text-rose-300", isError);
        box.classList.toggle("text-emerald-300", !isError);
    },

    submitMission() {
        const machine = document.getElementById("mission-machine");
        const symptom = document.getElementById("mission-symptom");
        const assignee = document.getElementById("mission-assignee");
        const status = document.getElementById("mission-status");
        const parts = document.getElementById("mission-parts");

        if (!machine || !symptom || !assignee || !status || !parts) return;

        const values = {
            machine: machine.value.trim(),
            symptom: symptom.value.trim(),
            assignee: assignee.value.trim(),
            status: status.value,
            parts: parts.value.trim()
        };

        if (!values.machine || !values.symptom || !values.assignee) {
            this.showMissionMessage(
                "กรุณากรอก Machine, Symptom และ Assignee ให้ครบ",
                true
            );
            return;
        }

        const missions = this.loadMissions();
        const editId = form.dataset.editId;

        if (editId) {
            const index = missions.findIndex(item => String(item.id) === editId);

            if (index === -1) {
                this.showMissionMessage("ไม่พบงานซ่อมที่ต้องการแก้ไข กรุณารีเฟรชรายการ", true);
                this.resetMissionForm();
                return;
            }

            missions[index] = {
                ...missions[index],
                ...values,
                updatedAt: new Date().toISOString()
            };

            if (!this.saveMissions(missions)) return;
            this.resetMissionForm();
            this.renderMissions();
            this.showMissionMessage("อัปเดตงานซ่อมเรียบร้อยแล้ว");
            return;
        }

        missions.unshift({
            id: this.createMissionId(),
            ...values,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString()
        });

        if (!this.saveMissions(missions)) return;

        this.resetMissionForm();
        this.renderMissions();
        this.showMissionMessage("เพิ่มงานซ่อมเรียบร้อยแล้ว");
    },

    createMissionId() {
        return "MIS-" + Date.now().toString(36) + "-" +
            Math.random().toString(36).slice(2, 7).toUpperCase();
    },

    resetMissionForm() {
        const form = document.getElementById("mission-form");
        if (!form) return;

        form.reset();
        delete form.dataset.editId;

        const button = document.getElementById("mission-save-button");
        const cancel = document.getElementById("mission-cancel-button");

        if (button) button.textContent = "＋ Add Mission";
        if (cancel) cancel.classList.add("hidden");

        const status = document.getElementById("mission-status");
        if (status) status.value = "Open";
    },

    editMission(id) {
        const mission = this.loadMissions().find(item => String(item.id) === String(id));
        if (!mission) {
            this.showMissionMessage("ไม่พบงานซ่อมนี้", true);
            return;
        }

        const form = document.getElementById("mission-form");
        if (!form) return;

        form.dataset.editId = String(mission.id);
        document.getElementById("mission-machine").value = mission.machine || "";
        document.getElementById("mission-symptom").value = mission.symptom || "";
        document.getElementById("mission-assignee").value = mission.assignee || "";
        document.getElementById("mission-status").value = mission.status || "Open";
        document.getElementById("mission-parts").value = mission.parts || "";

        const button = document.getElementById("mission-save-button");
        const cancel = document.getElementById("mission-cancel-button");
        if (button) button.textContent = "Save Changes";
        if (cancel) cancel.classList.remove("hidden");

        form.scrollIntoView({ behavior: "smooth", block: "center" });
        document.getElementById("mission-machine").focus();
        this.showMissionMessage("กำลังแก้ไขงานซ่อม " + (mission.machine || ""));
    },

    updateMissionStatus(id, newStatus) {
        const allowed = ["Open", "In Progress", "On Hold", "Completed"];
        if (!allowed.includes(newStatus)) return;

        const missions = this.loadMissions();
        const index = missions.findIndex(item => String(item.id) === String(id));
        if (index === -1) return;

        missions[index] = {
            ...missions[index],
            status: newStatus,
            updatedAt: new Date().toISOString()
        };

        if (this.saveMissions(missions)) {
            this.renderMissions();
            this.showMissionMessage("อัปเดตสถานะงานซ่อมแล้ว");
        }
    },

    deleteMission(id) {
        const missions = this.loadMissions();
        const mission = missions.find(item => String(item.id) === String(id));
        if (!mission) return;

        const confirmed = window.confirm(
            `ต้องการลบงานซ่อมของ "${mission.machine || "ไม่ระบุเครื่อง"}" ใช่หรือไม่?\n` +
            "การลบนี้มีผลเฉพาะรายการงานซ่อมที่เลือก"
        );

        if (!confirmed) return;

        const remaining = missions.filter(item => String(item.id) !== String(id));
        if (this.saveMissions(remaining)) {
            const form = document.getElementById("mission-form");
            if (form && form.dataset.editId === String(id)) {
                this.resetMissionForm();
            }
            this.renderMissions();
            this.showMissionMessage("ลบรายการงานซ่อมที่เลือกแล้ว");
        }
    },

    statusClass(status) {
        switch (status) {
            case "Completed": return "text-emerald-300";
            case "In Progress": return "text-cyan-300";
            case "On Hold": return "text-amber-300";
            default: return "text-slate-300";
        }
    },

    renderMissions() {
        const list = document.getElementById("mission-list");
        if (!list) return;

        const missions = this.loadMissions();
        const search = this.normalize(
            document.getElementById("mission-filter")?.value || ""
        );
        const statusFilter =
            document.getElementById("mission-status-filter")?.value || "All";

        const filtered = missions.filter(mission => {
            const text = this.normalize([
                mission.machine,
                mission.symptom,
                mission.assignee,
                mission.status,
                mission.parts
            ].join(" "));

            return text.includes(search) &&
                (statusFilter === "All" || mission.status === statusFilter);
        });

        const total = document.getElementById("mission-total");
        if (total) {
            const active = missions.filter(item => item.status !== "Completed").length;
            total.textContent =
                `${missions.length} missions • ${active} active`;
        }

        list.replaceChildren();

        if (!filtered.length) {
            const empty = document.createElement("div");
            empty.className = "ops-card text-center text-slate-400";
            empty.style.cssText = "padding:24px;";
            empty.textContent = missions.length
                ? "ไม่พบงานซ่อมที่ตรงกับตัวกรอง"
                : "ยังไม่มีงานซ่อม — เพิ่มรายการแรกจากแบบฟอร์มด้านบน";
            list.appendChild(empty);
            return;
        }

        filtered.forEach(mission => {
            const card = document.createElement("article");
            card.className = "ops-card";
            card.style.cssText =
                "padding:18px;border-radius:16px;overflow-wrap:anywhere;";

            const top = document.createElement("div");
            top.className =
                "flex flex-col md:flex-row md:items-start md:justify-between gap-3";

            const titleBox = document.createElement("div");
            const title = document.createElement("h4");
            title.className = "text-lg font-bold";
            title.textContent = mission.machine || "Unnamed Machine";

            const idLine = document.createElement("p");
            idLine.className = "text-xs text-slate-400 mt-1";
            idLine.textContent = String(mission.id || "");

            const status = document.createElement("span");
            status.className =
                "text-sm font-semibold " + this.statusClass(mission.status);
            status.textContent = mission.status || "Open";

            titleBox.append(title, idLine);
            top.append(titleBox, status);

            const details = document.createElement("div");
            details.className = "grid grid-cols-1 md:grid-cols-2 gap-3 mt-4";

            const addDetail = (label, value) => {
                const item = document.createElement("div");
                item.className =
                    "rounded-lg bg-slate-900/60 border border-slate-700/60 p-3";

                const caption = document.createElement("p");
                caption.className = "text-xs text-slate-400 mb-1";
                caption.textContent = label;

                const content = document.createElement("p");
                content.className = "text-sm text-slate-200";
                content.style.whiteSpace = "pre-wrap";
                content.textContent = value || "—";

                item.append(caption, content);
                details.appendChild(item);
            };

            addDetail("Symptom", mission.symptom);
            addDetail("Assignee", mission.assignee);
            addDetail("Parts", mission.parts);

            const statusRow = document.createElement("div");
            statusRow.className =
                "flex flex-col md:flex-row gap-3 mt-4 md:items-center";

            const statusSelect = document.createElement("select");
            statusSelect.className =
                "rounded-lg px-3 py-2 text-white bg-slate-900 border border-cyan-500/30";
            statusSelect.setAttribute("aria-label", "เปลี่ยนสถานะงานซ่อม");

            [
                ["Open", "Open"],
                ["In Progress", "In Progress"],
                ["On Hold", "On Hold"],
                ["Completed", "Completed"]
            ].forEach(([value, label]) => {
                const option = document.createElement("option");
                option.value = value;
                option.textContent = label;
                statusSelect.appendChild(option);
            });

            statusSelect.value = mission.status || "Open";
            statusSelect.addEventListener("change", () => {
                this.updateMissionStatus(mission.id, statusSelect.value);
            });

            const edit = document.createElement("button");
            edit.type = "button";
            edit.className =
                "rounded-lg px-4 py-2 text-sm font-semibold bg-cyan-500/20 text-cyan-200 hover:bg-cyan-500/30";
            edit.textContent = "Edit";
            edit.addEventListener("click", () => this.editMission(mission.id));

            const remove = document.createElement("button");
            remove.type = "button";
            remove.className =
                "rounded-lg px-4 py-2 text-sm font-semibold bg-rose-500/15 text-rose-200 hover:bg-rose-500/25";
            remove.textContent = "Delete";
            remove.addEventListener("click", () => this.deleteMission(mission.id));

            statusRow.append(statusSelect, edit, remove);
            card.append(top, details, statusRow);
            list.appendChild(card);
        });
    },

    /* RECENT ACTIVITY — EXISTING QC/PLC DATA IS READ-ONLY */
    loadRecent() {
        const box = document.getElementById("recent-list");
        if (!box) return;

        const qc = this.readList(OPS.STORAGE.QC).data;
        const plc = this.readList(OPS.STORAGE.PLC).data;

        const recent = [...qc, ...plc]
            .sort((a, b) => (Number(b.id) || 0) - (Number(a.id) || 0))
            .slice(0, 5);

        box.replaceChildren();

        if (!recent.length) {
            const empty = document.createElement("div");
            empty.className = "ops-card text-center text-slate-400";
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

    /* EVENTS */
    bind() {
        const logout = document.getElementById("logout-btn");
        if (logout) {
            logout.onclick = () => OPS.logout();
        }
    },

    /* REFRESH */
    refresh() {
        try {
            this.loadStatistics();
            this.loadRecent();
            this.renderMissions();
            this.checkSystemHealth();
        } catch (error) {
            console.error("Dashboard refresh error:", error);
        }
    }
};

/* KNOWLEDGE POPUP */
function openKnowledgePopup() {
    const popup = document.getElementById("knowledge-popup");
    if (popup) popup.classList.remove("hidden");
}

function closeKnowledgePopup() {
    const popup = document.getElementById("knowledge-popup");
    if (popup) popup.classList.add("hidden");
}

/* STARTUP */
document.addEventListener("DOMContentLoaded", () => {
    Dashboard.init();
});

document.addEventListener("keydown", event => {
    if (event.key === "Escape") closeKnowledgePopup();
});

document.addEventListener("visibilitychange", () => {
    if (!document.hidden && Dashboard.initialized) Dashboard.refresh();
});
