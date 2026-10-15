
/* =====================================
   OPS PORTAL V5
   QC OPERATIONS SYSTEM
   QC 21-37 + Group History
   ===================================== */

const QC = {
  data: [],
  editID: null,
  editEntryID: null,
  backupKey: "OPS_QC_BACKUP_PRE_GROUPING_V1",

  // =====================================
  // INIT / HELPERS
  // =====================================

  init() {
    if (!OPS.checkindex()) return;
    this.load();
    this.bind();
    this.render();
  },

  el(id) {
    return document.getElementById(id);
  },

  escapeHTML(value) {
    return String(value ?? "").replace(/[&<>"']/g, char => ({
      "&": "&amp;",
      "<": "&lt;",
      ">": "&gt;",
      '"': "&quot;",
      "'": "&#39;"
    })[char]);
  },

  normalizeTitle(value) {
    const title = String(value ?? "")
      .trim()
      .toUpperCase()
      .replace(/[_-]+/g, " ")
      .replace(/\s+/g, " ");

    const match = title.match(/^QC\s*(\d+)$/);
    return match ? `QC ${Number(match[1])}` : title;
  },

  validTitle(value) {
    const title = this.normalizeTitle(value);
    const match = title.match(/^QC (\d+)$/);

    return !!match &&
      Number(match[1]) >= 21 &&
      Number(match[1]) <= 37;
  },

  getGroupKey(item) {
    return this.normalizeTitle(item?.title);
  },

  makeEntryID() {
    return `qc-entry-${OPS.createID()}-${Date.now()}-${Math.random()
      .toString(36).slice(2, 8)}`;
  },

  createEntry(item) {
    const { entries, ...original } = item;

    return {
      ...original,
      entryID: item.entryID || this.makeEntryID()
    };
  },

  getEntries(group) {
    if (Array.isArray(group.entries)) {
      return group.entries;
    }

    return [this.createEntry(group)];
  },

  syncSummary(group) {
    const entries = this.getEntries(group);

    if (!entries.length) return group;

    const latest = entries[entries.length - 1];

    group.detail = latest.detail ?? group.detail ?? "";
    group.solution = latest.solution ?? "";
    group.status = latest.status || "Open";
    group.date = latest.date ?? group.date ?? "";

    return group;
  },

  // =====================================
  // GROUPING / MIGRATION
  // =====================================

  groupRecords(records) {
    const groups = new Map();
    const ungrouped = [];

    records.forEach(record => {
      if (!record || typeof record !== "object") {
        ungrouped.push(record);
        return;
      }

      const key = this.getGroupKey(record);

      if (!this.validTitle(key)) {
        // เก็บข้อมูลที่ไม่ใช่ QC 21-37 ไว้ ไม่ทิ้งข้อมูลเก่า
        ungrouped.push({ ...record });
        return;
      }

      const entries = this.getEntries(record).map(entry => ({
        ...entry,
        entryID: entry.entryID || this.makeEntryID()
      }));

      if (!groups.has(key)) {
        const group = {
          ...record,
          title: key,
          entries
        };

        this.syncSummary(group);
        groups.set(key, group);
      } else {
        const group = groups.get(key);
        const existingIDs = new Set(
          group.entries.map(entry => entry.entryID)
        );

        entries.forEach(entry => {
          // ถ้าไม่มี ID หรือ ID ซ้ำ ให้สร้าง ID ประวัติใหม่
          if (!entry.entryID || existingIDs.has(entry.entryID)) {
            entry.entryID = this.makeEntryID();
          }

          group.entries.push(entry);
          existingIDs.add(entry.entryID);
        });

        this.syncSummary(group);
      }
    });

    return [...groups.values(), ...ungrouped];
  },

  load() {
    const key = OPS.STORAGE.QC;
    const raw = localStorage.getItem(key);
    let loaded = OPS.load(key);

    if (!Array.isArray(loaded)) loaded = [];

    const grouped = this.groupRecords(loaded);
    const changed =
      JSON.stringify(grouped) !== JSON.stringify(loaded);

    if (changed) {
      try {
        if (raw !== null &&
            localStorage.getItem(this.backupKey) === null) {
          localStorage.setItem(this.backupKey, raw);
        }

        OPS.save(key, grouped);
        this.data = grouped;
      } catch (error) {
        console.error("QC migration failed:", error);
        this.data = loaded;
      }
    } else {
      this.data = loaded;
    }
  },

  save() {
    OPS.save(OPS.STORAGE.QC, this.data);
  },

  // =====================================
  // EVENTS
  // =====================================

  bind() {
    this.el("add-btn").onclick = () => this.openAdd();
    this.el("save-btn").onclick = () => this.saveWork();
    this.el("cancel-btn").onclick = () => this.closeModal();

    this.el("search-input").oninput = event => {
      this.search(event.target.value);
    };

    this.el("qc-list").onclick = event => {
      const button = event.target.closest("[data-action]");
      if (!button) return;

      const groupID = button.dataset.group;
      const entryID = button.dataset.entry;
      const action = button.dataset.action;

      if (action === "edit") {
        this.edit(groupID, entryID);
      }

      if (action === "delete-entry") {
        this.deleteEntry(groupID, entryID);
      }

      if (action === "delete-group") {
        this.delete(groupID);
      }
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

  edit(groupID, entryID) {
    const group = this.data.find(
      item => String(item.id) === String(groupID)
    );

    if (!group) return;

    const entries = this.getEntries(group);
    const entry = entries.find(
      item => String(item.entryID) === String(entryID)
    );

    if (!entry) return;

    this.editID = group.id;
    this.editEntryID = entry.entryID;

    this.el("title").value = group.title || "";
    this.el("solution").value = entry.solution || "";
    this.el("status").value = entry.status || "Open";

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
    this.el("solution").value = "";
    this.el("status").value = "Open";

    this.editID = null;
    this.editEntryID = null;
  },

  // =====================================
  // SAVE
  // =====================================

  saveWork() {
    const title = this.normalizeTitle(this.el("title").value);

    const itemData = {
      title,
      solution: this.el("solution").value.trim(),
      status: this.el("status").value
    };

    if (!this.validTitle(title)) {
      alert("กรุณาเลือก QC ระหว่าง QC 21 ถึง QC 37");
      return;
    }

    const previous = JSON.stringify(this.data);

    try {
      if (this.editID !== null && this.editEntryID !== null) {
        const oldGroup = this.data.find(
          item => String(item.id) === String(this.editID)
        );

        if (!oldGroup) return;

        oldGroup.entries = this.getEntries(oldGroup);

        const entryIndex = oldGroup.entries.findIndex(
          entry => String(entry.entryID) === String(this.editEntryID)
        );

        if (entryIndex < 0) return;

        const oldEntry = oldGroup.entries[entryIndex];

        const updatedEntry = {
          ...oldEntry,
          ...itemData,
          entryID: oldEntry.entryID,
          date: oldEntry.date || OPS.dateTime()
        };

        if (title === this.getGroupKey(oldGroup)) {
          // แก้ประวัติในกลุ่มเดิม
          oldGroup.entries[entryIndex] = updatedEntry;
          this.syncSummary(oldGroup);
        } else {
          // เปลี่ยนรหัส QC: ย้ายเฉพาะประวัติที่แก้ไข
          oldGroup.entries.splice(entryIndex, 1);

          if (oldGroup.entries.length) {
            this.syncSummary(oldGroup);
          } else {
            this.data = this.data.filter(
              item => String(item.id) !== String(oldGroup.id)
            );
          }

          const target = this.data.find(
            item => this.getGroupKey(item) === title
          );

          if (target) {
            target.entries = this.getEntries(target);
            target.entries.push(updatedEntry);
            this.syncSummary(target);
          } else {
            this.data.unshift({
              id: OPS.createID(),
              title,
              detail: "",
              solution: updatedEntry.solution,
              status: updatedEntry.status,
              date: updatedEntry.date,
              entries: [updatedEntry]
            });
          }
        }
      } else {
        const entry = {
          entryID: this.makeEntryID(),
          ...itemData,
          date: OPS.dateTime()
        };

        const existing = this.data.find(
          item => this.getGroupKey(item) === title
        );

        if (existing) {
          existing.entries = this.getEntries(existing);
          existing.entries.push(entry);
          this.syncSummary(existing);
        } else {
          this.data.unshift({
            id: OPS.createID(),
            title,
            detail: "",
            solution: entry.solution,
            status: entry.status,
            date: entry.date,
            entries: [entry]
          });
        }
      }

      this.data = this.groupRecords(this.data);
      this.save();
      this.render();
      this.closeModal();

    } catch (error) {
      console.error("QC save failed:", error);
      this.data = JSON.parse(previous);
      alert("บันทึกไม่สำเร็จ กรุณาตรวจสอบข้อมูลและพื้นที่จัดเก็บ");
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

    list.forEach(group => {
      const entries = this.getEntries(group);

      const historyHTML = entries.map((entry, index) => `
        <div class="border-t border-slate-700 pt-3 mt-3">
          <div class="flex justify-between items-center gap-2">
            <p class="text-xs text-slate-400">
              ครั้งที่ ${index + 1} ·
              ${this.escapeHTML(entry.date || "")}
            </p>

            <div class="flex gap-2">
              <button
                data-action="edit"
                data-group="${this.escapeHTML(group.id)}"
                data-entry="${this.escapeHTML(entry.entryID)}"
                class="dashboard-btn bg-cyan-400/20 text-cyan-300 px-3 py-1">
                Edit
              </button>

              <button
                data-action="delete-entry"
                data-group="${this.escapeHTML(group.id)}"
                data-entry="${this.escapeHTML(entry.entryID)}"
                class="dashboard-btn bg-red-500/20 text-red-300 px-3 py-1">
                ลบครั้งนี้
              </button>
            </div>
          </div>

          <p class="mt-3 text-cyan-300 font-bold">Solution</p>
          <p class="mt-1 whitespace-pre-wrap break-words">
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
        <div class="flex justify-between items-start gap-3">
          <h3 class="text-xl font-bold">
            ${this.escapeHTML(group.title)}
          </h3>

          <span class="text-sm text-slate-400">
            ID:${this.escapeHTML(group.id)}
          </span>
        </div>

        <div class="mt-3">
          <span class="px-3 py-2 rounded-full bg-cyan-400/20 text-cyan-300">
            ${entries.length} งาน
          </span>
        </div>

        <details class="mt-5">
          <summary class="cursor-pointer text-cyan-300">
            ประวัติงาน (${entries.length})
          </summary>
          ${historyHTML}
        </details>

        <button
          data-action="delete-group"
          data-group="${this.escapeHTML(group.id)}"
          class="dashboard-btn bg-red-500/20 text-red-300 mt-5">
          ลบกลุ่มทั้งหมด
        </button>
      `;

      box.appendChild(card);
    });
  },

  // =====================================
  // DELETE ONE ENTRY
  // =====================================

  deleteEntry(groupID, entryID) {
    const group = this.data.find(
      item => String(item.id) === String(groupID)
    );

    if (!group) return;

    const entries = this.getEntries(group);
    const entry = entries.find(
      item => String(item.entryID) === String(entryID)
    );

    if (!entry) return;

    if (!confirm(
      `ต้องการลบประวัติครั้งนี้ของ ${group.title} หรือไม่?`
    )) return;

    const previous = JSON.stringify(this.data);

    try {
      group.entries = entries.filter(
        item => String(item.entryID) !== String(entryID)
      );

      if (group.entries.length === 0) {
        // ไม่มีประวัติเหลือ จึงลบกลุ่ม
        this.data = this.data.filter(
          item => String(item.id) !== String(groupID)
        );
      } else {
        this.syncSummary(group);
      }

      this.save();
      this.search(this.el("search-input").value);

    } catch (error) {
      console.error("QC entry delete failed:", error);
      this.data = JSON.parse(previous);
      alert("ลบประวัติไม่สำเร็จ");
    }
  },

  // =====================================
  // DELETE WHOLE GROUP
  // =====================================

  delete(groupID) {
    const group = this.data.find(
      item => String(item.id) === String(groupID)
    );

    if (!group) return;

    const count = this.getEntries(group).length;

    if (!confirm(
      `ต้องการลบ ${group.title} ทั้งกลุ่ม (${count} งาน) หรือไม่?`
    )) return;

    const previous = this.data;

    this.data = this.data.filter(
      item => String(item.id) !== String(groupID)
    );

    try {
      this.save();
      this.search(this.el("search-input").value);
    } catch (error) {
      console.error("QC group delete failed:", error);
      this.data = previous;
      alert("ลบกลุ่มไม่สำเร็จ");
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

    const result = this.data.filter(group => {
      const entries = this.getEntries(group);

      const groupText = [
        group.title,
        group.status,
        group.date
      ].join(" ").toLowerCase();

      const historyText = entries.map(entry => [
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
