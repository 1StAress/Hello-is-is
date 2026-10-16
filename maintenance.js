
"use strict";

/* =========================================
   OPS PORTAL V4 — MAINTENANCE MODULE
   Storage scope: OPS_MAINTENANCE_MISSIONS only
========================================= */

const Maintenance = {
    key: "OPS_MAINTENANCE_MISSIONS",
    editingId: null,
    storageReady: false,
    statuses: ["Open", "In Progress", "On Hold", "Completed"],

    init() {
        if (typeof OPS === "undefined" || !OPS.checkIndex()) return;

        this.bind();
        this.loadMissions();
        document.getElementById("maintenance-dashboard").addEventListener(
            "click",
            () => OPS.go("dashboard")
        );
    },

    bind() {
        document.getElementById("mission-form").addEventListener(
            "submit",
            event => {
                event.preventDefault();
                this.submit();
            }
        );

        document.getElementById("mission-reset").addEventListener(
            "click",
            () => this.resetForm()
        );

        document.getElementById("mission-cancel").addEventListener(
            "click",
            () => this.resetForm()
        );

        document.getElementById("mission-search").addEventListener(
            "input",
            () => this.render()
        );

        document.getElementById("mission-filter").addEventListener(
            "change",
            () => this.render()
        );
    },

    readMissions() {
        try {
            const raw = localStorage.getItem(this.key);

            if (raw === null || raw === "") {
                return { ok: true, data: [] };
            }

            const parsed = JSON.parse(raw);

            if (!Array.isArray(parsed)) {
                return { ok: false, data: [] };
            }

            return { ok: true, data: parsed };
        } catch (error) {
            console.error("Maintenance storage read error:", error);
            return { ok: false, data: [] };
        }
    },

    loadMissions() {
        const result = this.readMissions();
        this.storageReady = result.ok;

        if (!result.ok) {
            this.message(
                "อ่านข้อมูลงานซ่อมไม่ได้ ข้อมูลเดิมยังไม่ได้ถูกเขียนทับ",
                true
            );
            this.renderError();
            return;
        }

        this.render();
    },

    saveMissions(missions) {
        if (!Array.isArray(missions)) {
            this.message("รูปแบบข้อมูลไม่ถูกต้อง จึงไม่ได้บันทึก", true);
            return false;
        }

        try {
            localStorage.setItem(this.key, JSON.stringify(missions));
            this.storageReady = true;
            return true;
        } catch (error) {
            console.error("Maintenance storage save error:", error);
            this.message(
                "บันทึกไม่สำเร็จ พื้นที่จัดเก็บอาจเต็มหรือถูกจำกัด",
                true
            );
            return false;
        }
    },

    message(text, isError = false) {
        const el = document.getElementById("maintenance-message");
        if (!el) return;

        el.textContent = text;
        el.classList.toggle("text-rose-300", isError);
        el.classList.toggle("text-emerald-300", !isError);
    },

    submit() {
        const machine = document.getElementById("mission-machine");
        const assignee = document.getElementById("mission-assignee");
        const symptom = document.getElementById("mission-symptom");
        const status = document.getElementById("mission-status");
        const parts = document.getElementById("mission-parts");

        if (!machine || !assignee || !symptom || !status || !parts) return;

        const values = {
            machine: machine.value.trim(),
            assignee: assignee.value.trim(),
            symptom: symptom.value.trim(),
            status: status.value,
            parts: parts.value.trim()
        };

        if (!values.machine || !values.assignee || !values.symptom) {
            this.message("กรุณากรอก Machine, Assignee และ Symptom ให้ครบ", true);
            return;
        }

        if (!this.statuses.includes(values.status)) {
            this.message("สถานะที่เลือกไม่ถูกต้อง", true);
            return;
        }

        const result = this.readMissions();

        if (!result.ok) {
            this.storageReady = false;
            this.message(
                "ข้อมูลเดิมอ่านไม่ได้ จึงยกเลิกการบันทึกเพื่อป้องกันข้อมูลสูญหาย",
                true
            );
            return;
        }

        const missions = result.data;
        const now = new Date().toISOString();

        if (this.editingId !== null) {
            const index = missions.findIndex(
                item => String(item.id) === String(this.editingId)
            );

            if (index < 0) {
                this.message("ไม่พบรายการที่กำลังแก้ไข กรุณาโหลดหน้าใหม่", true);
                this.resetForm();
                return;
            }

            missions[index] = {
                ...missions[index],
                ...values,
                updatedAt: now
            };

            if (!this.saveMissions(missions)) return;

            this.resetForm();
            this.render();
            this.message("บันทึกการแก้ไขงานซ่อมแล้ว");
            return;
        }

        missions.unshift({
            id: this.createId(),
            ...values,
            createdAt: now,
            updatedAt: now
        });

        if (!this.saveMissions(missions)) return;

        this.resetForm();
        this.render();
        this.message("เพิ่มงานซ่อมเรียบร้อยแล้ว");
    },

    createId() {
        return "MIS-" + Date.now().toString(36) + "-" +
            Math.random().toString(36).slice(2, 7).toUpperCase();
    },

    resetForm() {
        const form = document.getElementById("mission-form");
        if (!form) return;

        form.reset();
        this.editingId = null;

        document.getElementById("mission-status").value = "Open";
        document.getElementById("mission-save").textContent = "+ เพิ่มงานซ่อม";
        document.getElementById("mission-cancel").classList.add("hidden");
    },

    edit(id) {
        const result = this.readMissions();

        if (!result.ok) {
            this.message("อ่านข้อมูลงานซ่อมไม่ได้", true);
            return;
        }

        const mission = result.data.find(
            item => String(item.id) === String(id)
        );

        if (!mission) {
            this.message("ไม่พบรายการงานซ่อมที่ต้องการแก้ไข", true);
            return;
        }

        this.editingId = String(mission.id);

        document.getElementById("mission-machine").value = mission.machine || "";
        document.getElementById("mission-assignee").value = mission.assignee || "";
        document.getElementById("mission-symptom").value = mission.symptom || "";
        document.getElementById("mission-status").value =
            this.statuses.includes(mission.status) ? mission.status : "Open";
        document.getElementById("mission-parts").value = mission.parts || "";

        document.getElementById("mission-save").textContent = "บันทึกการแก้ไข";
        document.getElementById("mission-cancel").classList.remove("hidden");

        document.getElementById("mission-form").scrollIntoView({
            behavior: "smooth",
            block: "start"
        });

        this.message("กำลังแก้ไขงาน: " + (mission.machine || ""));
    },

    updateStatus(id, status) {
        if (!this.statuses.includes(status)) return;

        const result = this.readMissions();

        if (!result.ok) {
            this.message("อ่านข้อมูลงานซ่อมไม่ได้", true);
            return;
        }

        const index = result.data.findIndex(
            item => String(item.id) === String(id)
        );

        if (index < 0) {
            this.message("ไม่พบรายการที่ต้องการเปลี่ยนสถานะ", true);
            return;
        }

        result.data[index] = {
            ...result.data[index],
            status,
            updatedAt: new Date().toISOString()
        };

        if (this.saveMissions(result.data)) {
            this.render();
            this.message("เปลี่ยนสถานะงานซ่อมแล้ว");
        }
    },

    remove(id) {
        const result = this.readMissions();

        if (!result.ok) {
            this.message("อ่านข้อมูลงานซ่อมไม่ได้", true);
            return;
        }

        const mission = result.data.find(
            item => String(item.id) === String(id)
        );

        if (!mission) {
            this.message("ไม่พบรายการงานซ่อม", true);
            return;
        }

        const confirmed = window.confirm(
            "ยืนยันลบงานของ " + (mission.machine || "ไม่ระบุเครื่อง") +
            " ใช่หรือไม่?\nการลบนี้จะกระทบเฉพาะรายการที่เลือก"
        );

        if (!confirmed) return;

        const remaining = result.data.filter(
            item => String(item.id) !== String(id)
        );

        if (this.saveMissions(remaining)) {
            if (String(this.editingId) === String(id)) this.resetForm();
            this.render();
            this.message("ลบเฉพาะรายการที่เลือกแล้ว");
        }
    },

    normalize(value) {
        return String(value || "").toLocaleLowerCase().trim();
    },

    statusColor(status) {
        const colors = {
            "Open": "bg-cyan-400/15 text-cyan-200",
            "In Progress": "bg-amber-400/15 text-amber-200",
            "On Hold": "bg-orange-400/15 text-orange-200",
            "Completed": "bg-emerald-400/15 text-emerald-200"
        };

        return colors[status] || "bg-slate-500/15 text-slate-200";
    },

    updateCounters(missions) {
        document.getElementById("count-total").textContent = missions.length;
        document.getElementById("count-open").textContent =
            missions.filter(item => item.status === "Open").length;
        document.getElementById("count-progress").textContent =
            missions.filter(item => item.status === "In Progress").length;
        document.getElementById("count-completed").textContent =
            missions.filter(item => item.status === "Completed").length;
    },

    renderError() {
        const list = document.getElementById("mission-list");
        if (!list) return;

        list.replaceChildren();

        const card = document.createElement("div");
        card.className = "mission-card text-rose-200";
        card.textContent =
            "ไม่สามารถอ่านข้อมูลงานซ่อมได้ ระบบหยุดการทำงานเพื่อป้องกันข้อมูลเดิม";
        list.appendChild(card);

        document.getElementById("mission-result-count").textContent =
            "ไม่สามารถอ่านข้อมูลได้";
    },

    render() {
        const result = this.readMissions();

        if (!result.ok) {
            this.storageReady = false;
            this.renderError();
            return;
        }

        this.storageReady = true;
        const missions = result.data;
        this.updateCounters(missions);

        const query = this.normalize(
            document.getElementById("mission-search").value
        );
        const filter = document.getElementById("mission-filter").value;

        const filtered = missions.filter(mission => {
            const haystack = this.normalize([
                mission.machine,
                mission.assignee,
                mission.symptom,
                mission.status,
                mission.parts
            ].join(" "));

            return haystack.includes(query) &&
                (filter === "All" || mission.status === filter);
        });

        document.getElementById("mission-result-count").textContent =
            `แสดง ${filtered.length} จาก ${missions.length} รายการ`;

        const list = document.getElementById("mission-list");
        list.replaceChildren();

        if (!filtered.length) {
            const empty = document.createElement("div");
            empty.className = "mission-card text-center text-slate-400";
            empty.textContent = missions.length
                ? "ไม่พบงานซ่อมที่ตรงกับคำค้นหาหรือตัวกรอง"
                : "ยังไม่มีงานซ่อม เพิ่มรายการแรกได้จากแบบฟอร์มด้านบน";
            list.appendChild(empty);
            return;
        }

        filtered.forEach(mission => {
            const card = document.createElement("article");
            card.className = "mission-card";

            const top = document.createElement("div");
            top.className =
                "flex flex-col sm:flex-row sm:justify-between sm:items-start gap-3";

            const titleBox = document.createElement("div");
            const title = document.createElement("h3");
            title.className = "text-lg font-bold";
            title.textContent = mission.machine || "ไม่ระบุเครื่อง";

            const id = document.createElement("p");
            id.className = "text-xs text-slate-400 mt-1";
            id.textContent = String(mission.id || "");

            titleBox.append(title, id);

            const badge = document.createElement("span");
            badge.className =
                "mission-status " + this.statusColor(mission.status);
            badge.textContent = mission.status || "Open";

            top.append(titleBox, badge);

            const details = document.createElement("div");
            details.className = "grid grid-cols-1 md:grid-cols-2 gap-3 mt-4";

            const addDetail = (label, value) => {
                const box = document.createElement("div");
                box.className = "rounded-xl bg-slate-900/60 p-3";

                const heading = document.createElement("p");
                heading.className = "text-xs text-slate-400 mb-1";
                heading.textContent = label;

                const content = document.createElement("p");
                content.className = "text-sm text-slate-200 mission-detail";
                content.textContent = value || "—";

                box.append(heading, content);
                details.appendChild(box);
            };

            addDetail("Symptom / อาการเสีย", mission.symptom);
            addDetail("Assignee / ผู้รับผิดชอบ", mission.assignee);
            addDetail("Parts / อะไหล่และหมายเหตุ", mission.parts);

            const controls = document.createElement("div");
            controls.className = "flex flex-col sm:flex-row gap-2 mt-4";

            const select = document.createElement("select");
            select.className = "sm:max-w-xs";
            select.setAttribute("aria-label", "เปลี่ยนสถานะงาน");

            this.statuses.forEach(status => {
                const option = document.createElement("option");
                option.value = status;
                option.textContent = status;
                select.appendChild(option);
            });

            select.value = this.statuses.includes(mission.status)
                ? mission.status
                : "Open";

            select.addEventListener("change", () => {
                this.updateStatus(mission.id, select.value);
            });

            const editButton = document.createElement("button");
            editButton.type = "button";
            editButton.className =
                "mission-button bg-cyan-500/20 text-cyan-200";
            editButton.textContent = "แก้ไข";
            editButton.addEventListener("click", () => this.edit(mission.id));

            const deleteButton = document.createElement("button");
            deleteButton.type = "button";
            deleteButton.className =
                "mission-button bg-rose-500/15 text-rose-200";
            deleteButton.textContent = "ลบรายการนี้";
            deleteButton.addEventListener("click", () => this.remove(mission.id));

            controls.append(select, editButton, deleteButton);
            card.append(top, details, controls);
            list.appendChild(card);
        });
    }
};

document.addEventListener("DOMContentLoaded", () => Maintenance.init());
