
/* =====================================
   OPS PORTAL V5
   QC OPERATIONS SYSTEM
   Duplicate QC Grouping + History
   ===================================== */

const QC = {
  data: [],
  editID: null,

  // สำรองข้อมูลดิบก่อนเปลี่ยนโครงสร้าง
  backupKey: "OPS_QC_BACKUP_PRE_GROUPING_V1",

  // =====================================
  // INIT
  // =====================================

  init() {
    if (!OPS.checkindex()) return;

    this.load();
    this.bind();
    this.render();
  },

  // =====================================
  // HELPERS
  // =====================================

  el(id) {
    return document.getElementById(id);
  },

  escapeHTML(value) {
    return String(value ?? "").replace(
      /[&<>"']/g,
      char => ({
        "&": "&amp;",
        "<": "&lt;",
        ">": "&gt;",
        '"': "&quot;",
        "'": "&#39;"
      })[char]
    );
  },

  normalizeTitle(value) {
    let title = String(value ?? "")
      .trim()
      .replace(/[_-]+/g, " ")
      .replace(/\s+/g, " ")
      .toUpperCase();

    // QC21, QC 21 และ QC-21 ถือเป็นรหัสเดียวกัน
    title = title.replace(/^QC\s*(\d+[A-Z]?)$/, "QC $1");

    return title;
  },

  getGroupKey(item) {
    return this.normalizeTitle(item?.title);
  },

  createEntry(item) {
    // รายการเดิมหนึ่งรายการจะกลายเป็นประวัติหนึ่งครั้ง
    // คัดลอกทุกฟิลด์เดิมไว้ ไม่ทิ้งข้อมูลที่ยังไม่รู้จัก
    const { entries, ...original } = item;

    return { ...original };
  },

  syncSummary(group) {
    const entries = Array.isArray(group.entries)
      ? group.entries
      : [];

    if (!entries.length) return group;

    const latest = entries[entries.length - 1];

    group.detail = latest.detail ?? "";
    group.solution = latest.solution ?? "";
    group.status = latest.status ?? "Open";
    group.date = latest.date ?? "";

    return group;
  },

  // =====================================
  // GROUP / MIGRATION
  // =====================================

  groupRecords(records) {
    const groups = new Map();
    const ungrouped = [];

    for (const record of records) {
      if (!record || typeof record !== "object") {
        ungrouped.push(record);
        continue;
      }

      const key = this.getGroupKey(record);

      if (!key) {
        ungrouped.push({ ...record });
        continue;
      }

      const entries = Array.isArray(record.entries)
        ? record.entries.map(entry => ({ ...entry }))
        : [this.createEntry(record)];

      if (!groups.has(key)) {
        const group = {
          ...record,
          entries
        };

        this.syncSummary(group);
        groups.set(key, group);
        continue;
      }

      // รหัสซ้ำ: รวมประวัติเข้ากลุ่มแรก
      const group = groups.get(key);

      group.entries.push(...entries);
      this.syncSummary(group);
    }

    return [...groups.values(), ...ungrouped];
  },

  // =====================================
  // LOAD
  // =====================================

  load() {
    const raw = localStorage.getItem(OPS.STORAGE.QC);

    let loaded = OPS.load(OPS.STORAGE.QC);

    if (!Array.isArray(loaded)) loaded = [];

    const original = JSON.stringify(loaded);
    const grouped = this.groupRecords(loaded);
    const changed = JSON.stringify(grouped) !== original;

    if (changed) {
      try {
        // สำรองข้อมูลเดิมเพียงครั้งแรก
        if (
          raw !== null &&
          localStorage.getItem(this.backupKey) === null
        ) {
          localStorage.setItem(this.backupKey, raw);
        }

        // เขียนกลับผ่านระบบจัดเก็บเดิม
        OPS.save(OPS.STORAGE.QC, grouped);
        this.data = grouped;
      } catch (error) {
        // หากบันทึกไม่สำเร็จ ให้ใช้ข้อมูลเดิมในหน่วยความจำ
        console.error("QC migration failed:", error);
        this.data = loaded;
      }
    } else {
      this.data = loaded;
    }
  },

  // =====================================
  // SAVE STORAGE
  // =====================================

  save() {
    OPS.save(OPS.STORAGE.QC, this.data);
  },

  // =====================================
  // EVENT
  // =====================================

  bind() {
    this.el("add-btn").onclick = () => this.openAdd();

    this.el("save-btn").onclick = () => this.saveWork();

    this.el("cancel-btn").onclick = () => this.closeModal();

    this.el("search-input").oninput = event => {
      this.search(event.target.value);
    };

    // ใช้ Event Delegation สำหรับปุ่มในการ์ด
    this.el("qc-list").onclick = event => {
      const button = event.target.closest("[data-action]");
      if (!button) return;

      const id = button.dataset.id;
      const action = button.dataset.action;

      if (action === "edit") this.edit(id);
      if (action === "delete") this.delete(id);
    };
  },

  // =====================================
  // MODAL
  // =====================================

  openAdd() {
    this.clear();

    this.el("modal").classList.remove("hidden");
    this.el("modal").classList.add("flex");
  },

  edit(id) {
    const item = this.data.find(
      record => String(record.id) === String(id)
    );

    if (!item) return;

    const entries = Array.isArray(item.entries)
      ? item.entries
      : [item];

    // แก้ไขประวัติครั้งล่าสุดเท่านั้น
    const latest = entries[entries.length - 1];

    this.editID = item.id;

    this.el("title").value = item.title || "";
    this.el("detail").value = latest.detail || "";
    this.el("solution").value = latest.solution || "";
    this.el("status").value = latest.status || "Open";

    this.el("modal").classList.remove("hidden");
    this.el("modal").classList.add("flex");
  },

  closeModal() {
    this.el("modal").classList.add("hidden");
    this.el("modal").classList.remove("flex");

    this.clear();
  },

  clear() {
    this.el("title").value = "";
    this.el("detail").value = "";
    this.el("solution").value = "";
    this.el("status").value = "Open";

    this.editID = null;
  },

  // =====================================
  // SAVE WORK
  // =====================================

  saveWork() {
    const itemData = {
      title: this.el("title").value.trim(),
      detail: this.el("detail").value.trim(),
      solution: this.el("solution").value.trim(),
      status: this.el("status").value
    };

    if (!itemData.title) return;

    // สำรองสถานะในหน่วยความจำเพื่อ rollback
    const previous = JSON.stringify(this.data);

    try {
      if (this.editID !== null) {
        const group = this.data.find(
          item => String(item.id) === String(this.editID)
        );

        if (!group) return;

        if (!Array.isArray(group.entries)) {
          group.entries = [this.createEntry(group)];
        }

        const index = group.entries.length - 1;
        const oldEntry = group.entries[index];

        // แก้ไขเฉพาะประวัติครั้งล่าสุด
        group.entries[index] = {
          ...oldEntry,
          ...itemData,
          id: oldEntry.id ?? OPS.createID(),
          date: oldEntry.date ?? group.date ?? OPS.dateTime()
        };

        group.title = itemData.title;

      } else {
        const key = this.normalizeTitle(itemData.title);

        const existing = this.data.find(
          item => this.getGroupKey(item) === key
        );

        const entry = {
          id: OPS.createID(),
          ...itemData,
          date: OPS.dateTime()
        };

        if (existing) {
          // รหัสเดิม: เพิ่มประวัติ ไม่สร้างการ์ดใหม่
          if (!Array.isArray(existing.entries)) {
            existing.entries = [this.createEntry(existing)];
          }

          existing.entries.push(entry);
          this.syncSummary(existing);

        } else {
          // รหัสใหม่: สร้างกลุ่มใหม่
          const group = {
            id: OPS.createID(),
            ...itemData,
            date: entry.date,
            entries: [entry]
          };

          this.data.unshift(group);
        }
      }

      // รวมอีกครั้ง เผื่อมีการแก้ชื่อไปตรงกับกลุ่มอื่น
      this.data = this.groupRecords(this.data);

      this.save();
      this.render();
      this.closeModal();

    } catch (error) {
      console.error("QC save failed:", error);

      // คืนข้อมูลเดิมในหน่วยความจำหากเกิดข้อผิดพลาด
      this.data = JSON.parse(previous);

      alert("บันทึก QC ไม่สำเร็จ กรุณาตรวจสอบพื้นที่จัดเก็บข้อมูล");
    }
  },

  // =====================================
  // RENDER
  // =====================================

  render(list = this.data) {
    const box = this.el("qc-list");
    if (!box) return;

    box.innerHTML = "";

    if (!list.length) {
      box.innerHTML = `
        <div class="ops-card col-span-full text-center">
          No QC Work Found
        </div>
      `;
      return;
    }

    list.forEach(item => {
      const entries = Array.isArray(item.entries)
        ? item.entries
        : [item];

      const historyHTML = entries.map((entry, index) => `
        <div class="border-t border-slate-700 pt-3 mt-3">
          <p class="text-xs text-slate-400">
            ครั้งที่ ${index + 1} · ${this.escapeHTML(entry.date || "")}
          </p>

          <p class="mt-2 text-slate-300 whitespace-pre-wrap">
            ${this.escapeHTML(entry.detail || "No Detail")}
          </p>

          <p class="mt-2 text-cyan-300 font-bold">Solution</p>
          <p class="mt-1 whitespace-pre-wrap">
            ${this.escapeHTML(entry.solution || "-")}
          </p>

          <p class="mt-2 text-sm text-slate-400">
            Status: ${this.escapeHTML(entry.status || "Open")}
          </p>
        </div>
      `).join("");

      const card = document.createElement("div");
      card.className = "ops-card";

      card.innerHTML = `
        <div class="flex justify-between items-start gap-4">
          <h3 class="text-xl font-bold break-words">
            ${this.escapeHTML(item.title)}
          </h3>

          <span class="text-sm text-slate-400">
            ID:${this.escapeHTML(item.id)}
          </span>
        </div>

        <div class="mt-3 flex flex-wrap items-center gap-2">
          <span class="px-3 py-1 rounded-full bg-cyan-400/20 text-cyan-300">
            ${entries.length} งาน
          </span>

          <span class="px-3 py-1 rounded-full bg-slate-700 text-slate-200">
            ${this.escapeHTML(item.status || "Open")}
          </span>
        </div>

        <details class="mt-4">
          <summary class="cursor-pointer text-cyan-300">
            ดูประวัติงาน ${entries.length} ครั้ง
          </summary>
          ${historyHTML}
        </details>

        <div class="flex gap-3 mt-6">
          <button
            data-action="edit"
            data-id="${this.escapeHTML(item.id)}"
            class="dashboard-btn bg-cyan-400/20 text-cyan-300">
            Edit ล่าสุด
          </button>

          <button
            data-action="delete"
            data-id="${this.escapeHTML(item.id)}"
            class="dashboard-btn bg-red-500/20 text-red-300">
            Delete กลุ่ม
          </button>
        </div>
      `;

      box.appendChild(card);
    });
  },

  // =====================================
  // DELETE
  // =====================================

  delete(id) {
    const item = this.data.find(
      record => String(record.id) === String(id)
    );

    if (!item) return;

    const count = Array.isArray(item.entries)
      ? item.entries.length
      : 1;

    const confirmed = confirm(
      `ต้องการลบกลุ่ม ${item.title} ทั้งหมด ${count} งานหรือไม่?`
    );

    if (!confirmed) return;

    const previous = this.data;

    this.data = this.data.filter(
      record => String(record.id) !== String(id)
    );

    try {
      this.save();
      this.render();
    } catch (error) {
      console.error("QC delete failed:", error);
      this.data = previous;
      alert("ลบข้อมูลไม่สำเร็จ");
    }
  },

  // =====================================
  // SEARCH
  // =====================================

  search(text) {
    const key = String(text ?? "").toLowerCase().trim();

    if (!key) {
      this.render();
      return;
    }

    const result = this.data.filter(item => {
      const entries = Array.isArray(item.entries)
        ? item.entries
        : [item];

      const groupText = [
        item.title,
        item.detail,
        item.solution,
        item.status,
        item.date
      ].join(" ").toLowerCase();

      const historyText = entries.map(entry => [
        entry.detail,
        entry.solution,
        entry.status,
        entry.date
      ].join(" ")).join(" ").toLowerCase();

      return groupText.includes(key) || historyText.includes(key);
    });

    this.render(result);
  }
};

document.addEventListener("DOMContentLoaded", () => {
  QC.init();
});
