
/* ==========================================
   OPS PORTAL V6
   QC OPERATIONS SYSTEM
   QC 21-37 + GROUP HISTORY
   SVG ICONS + DELETE ANIMATION
   ========================================== */

const QC = {
  data: [],
  editID: null,
  editEntryID: null,

  backupKey: "OPS_QC_BACKUP_PRE_GROUPING_V1",
  deleting: new Set(),
  saving: false,

  // ==========================================
  // INIT / HELPERS
  // ==========================================

  init() {
    if (!OPS.checkindex()) return;

    this.installStyles();
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
    const match = this.normalizeTitle(value).match(/^QC (\d+)$/);

    return !!match &&
      Number(match[1]) >= 21 &&
      Number(match[1]) <= 37;
  },

  getGroupKey(item) {
    return this.normalizeTitle(item?.title);
  },

  makeEntryID() {
    return `qc-entry-${OPS.createID()}-${Date.now()}-${Math.random()
      .toString(36).slice(2, 9)}`;
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

    group.solution = latest.solution ?? "";
    group.status = latest.status || "Open";
    group.date = latest.date ?? group.date ?? "";

    return group;
  },

  // ==========================================
  // ICONS
  // ==========================================

  icons: {
    edit: `
      <svg viewBox="0 0 24 24" aria-hidden="true">
        <path d="M12 20h9"
          fill="none" stroke="currentColor"
          stroke-width="2" stroke-linecap="round"/>
        <path d="M16.5 3.5a2.12 2.12 0 0 1 3 3L8 18l-4 1 1-4Z"
          fill="none" stroke="currentColor"
          stroke-width="2" stroke-linecap="round"
          stroke-linejoin="round"/>
      </svg>
    `,

    trash: `
      <svg viewBox="0 0 24 24" aria-hidden="true">
        <path d="M3 6h18"
          fill="none" stroke="currentColor"
          stroke-width="2" stroke-linecap="round"/>
        <path d="M8 6V4h8v2"
          fill="none" stroke="currentColor"
          stroke-width="2" stroke-linejoin="round"/>
        <path d="m19 6-1 14H6L5 6"
          fill="none" stroke="currentColor"
          stroke-width="2" stroke-linejoin="round"/>
        <path d="M10 11v5M14 11v5"
          fill="none" stroke="currentColor"
          stroke-width="2" stroke-linecap="round"/>
      </svg>
    `
  },

  installStyles() {
    if (this.el("qc-v6-styles")) return;

    const style = document.createElement("style");
    style.id = "qc-v6-styles";

    style.textContent = `
      #qc-list .qc-history-item,
      #qc-list .qc-group-card {
        transition:
          opacity .28s ease,
          transform .28s ease,
          filter .28s ease,
          max-height .28s ease;
      }

      #qc-list .qc-history-item.qc-is-deleting,
      #qc-list .qc-group-card.qc-is-deleting {
        opacity: 0;
        transform: scale(.92) translateY(10px);
        filter: blur(7px);
        pointer-events: none;
      }

      #qc-list .qc-icon-btn {
        display: inline-flex;
        align-items: center;
        justify-content: center;
        width: 42px;
        height: 42px;
        flex-shrink: 0;
        border-radius: 12px;
        border: 1px solid rgba(148,163,184,.18);
        transition:
          transform .18s ease,
          background-color .18s ease,
          opacity .18s ease;
        -webkit-tap-highlight-color: transparent;
      }

      #qc-list .qc-icon-btn svg {
        width: 20px;
        height: 20px;
      }

      #qc-list .qc-icon-btn:active {
        transform: scale(.86);
      }

      #qc-list .qc-edit-btn {
        color: #67e8f9;
        background: rgba(34,211,238,.12);
      }

      #qc-list .qc-edit-btn:hover {
        background: rgba(34,211,238,.24);
      }

      #qc-list .qc-delete-btn {
        color: #fca5a5;
        background: rgba(239,68,68,.12);
      }

      #qc-list .qc-delete-btn:hover {
        background: rgba(239,68,68,.25);
      }

      #qc-list .qc-history-content {
        overflow-wrap: anywhere;
        word-break: break-word;
      }

      #qc-list .qc-history-item {
        min-width: 0;
      }

      @media (prefers-reduced-motion: reduce) {
        #qc-list .qc-history-item,
        #qc-list .qc-group-card,
        #qc-list .qc-icon-btn {
          transition: none !important;
        }
      }
    `;

    document.head.appendChild(style);
  },

  // ==========================================
  // DATA MIGRATION / GROUPING
  // ==========================================

  groupRecords(records) {
    const groups = new Map();
    const ungrouped = [];
    const usedEntryIDs = new Set();

    records.forEach(record => {
      if (!record || typeof record !== "object") {
        ungrouped.push(record);
        return;
      }

      const key = this.getGroupKey(record);

      if (!this.validTitle(key)) {
        // เก็บข้อมูลเก่าที่ไม่ใช่ QC 21-37 ไว้
        ungrouped.push({ ...record });
        return;
      }

      const entries = this.getEntries(record).map(entry => {
        const copy = { ...entry };

        if (!copy.entryID || usedEntryIDs.has(String(copy.entryID))) {
          copy.entryID = this.makeEntryID();
        }

        usedEntryIDs.add(String(copy.entryID));
        return copy;
      });

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

        group.entries.push(...entries);
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
    const changed = JSON.stringify(grouped) !== JSON.stringify(loaded);

    if (!changed) {
      this.data = loaded;
      return;
    }

    try {
      // สำรองข้อมูลเดิมเพียงครั้งเดียวก่อน migration
      if (
        raw !== null &&
        localStorage.getItem(this.backupKey) === null
      ) {
        localStorage.setItem(this.backupKey, raw);
      }

      OPS.save(key, grouped);

      // ตรวจว่าข้อมูลที่บันทึกสามารถอ่านกลับได้
      const saved = OPS.load(key);

      if (!Array.isArray(saved)) {
        throw new Error("QC storage verification failed");
      }

      this.data = saved;
    } catch (error) {
      console.error("QC migration failed:", error);
      this.data = loaded;

      alert(
        "รวมประวัติ QC ไม่สำเร็จ ข้อมูลเดิมยังถูกเก็บไว้ " +
        "กรุณาตรวจสอบพื้นที่จัดเก็บ"
      );
    }
  },

  save() {
    OPS.save(OPS.STORAGE.QC, this.data);

    const verified = OPS.load(OPS.STORAGE.QC);

    if (!Array.isArray(verified)) {
      throw new Error("QC save verification failed");
    }

    this.data = verified;
  },

  // ==========================================
  // EVENTS
  // ==========================================

  bind() {
    this.el("add-btn").onclick = () => this.openAdd();

    this.el("save-btn").onclick = () => this.saveWork();

    this.el("cancel-btn").onclick = () => this.closeModal();

    this.el("search-input").oninput = event => {
      this.search(event.target.value);
    };

    this.el("qc-list").onclick = event => {
      const button = event.target.closest("[data-action]");

      if (!button || button.disabled) return;

      const groupID = button.dataset.group;
      const entryID = button.dataset.entry;
      const action = button.dataset.action;

      if (action === "edit") {
        this.edit(groupID, entryID);
      } else if (action === "delete-entry") {
        this.deleteEntry(groupID, entryID, button);
      } else if (action === "delete-group") {
        this.deleteGroup(groupID, button);
      }
    };
  },

  // ==========================================
  // MODAL
  // ==========================================

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

    const entry = this.getEntries(group).find(
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

  // ==========================================
  // SAVE / EDIT HISTORY
  // ==========================================

  saveWork() {
    if (this.saving) return;

    const title = this.normalizeTitle(this.el("title").value);

    if (!this.validTitle(title)) {
      alert("กรุณาเลือก QC ระหว่าง QC 21 ถึง QC 37");
      return;
    }

    const itemData = {
      title,
      solution: this.el("solution").value.trim(),
      status: this.el("status").value
    };

    const previous = JSON.stringify(this.data);

    this.saving = true;
    this.el("save-btn").disabled = true;

    try {
      if (this.editID !== null && this.editEntryID !== null) {
        const oldGroup = this.data.find(
          item => String(item.id) === String(this.editID)
        );

        if (!oldGroup) {
          throw new Error("QC group not found");
        }

        oldGroup.entries = this.getEntries(oldGroup);

        const index = oldGroup.entries.findIndex(
          entry => String(entry.entryID) === String(this.editEntryID)
        );

        if (index < 0) {
          throw new Error("QC history not found");
        }

        const oldEntry = oldGroup.entries[index];

        const updatedEntry = {
          ...oldEntry,
          ...itemData,
          entryID: oldEntry.entryID,
          date: oldEntry.date || OPS.dateTime()
        };

        if (title === this.getGroupKey(oldGroup)) {
          // แก้รายการเดิมโดยคงวันเวลาและ ID ประวัติไว้
          oldGroup.entries[index] = updatedEntry;
          this.syncSummary(oldGroup);
        } else {
          // ย้ายเฉพาะประวัติที่เลือกไปยัง QC กลุ่มใหม่
          oldGroup.entries.splice(index, 1);

          if (oldGroup.entries.length) {
            this.syncSummary(oldGroup);
          } else {
            this.data = this.data.filter(
              item => String(item.id) !== String(oldGroup.id)
            );
          }

          let target = this.data.find(
            item => this.getGroupKey(item) === title
          );

          if (!target) {
            target = {
              id: OPS.createID(),
              title,
              solution: "",
              status: "Open",
              date: updatedEntry.date,
              entries: []
            };

            this.data.unshift(target);
          }

          target.entries = this.getEntries(target);
          target.entries.push(updatedEntry);
          this.syncSummary(target);
        }
      } else {
        const entry = {
          entryID: this.makeEntryID(),
          ...itemData,
          date: OPS.dateTime()
        };

        let group = this.data.find(
          item => this.getGroupKey(item) === title
        );

        if (!group) {
          group = {
            id: OPS.createID(),
            title,
            solution: entry.solution,
            status: entry.status,
            date: entry.date,
            entries: []
          };

          this.data.unshift(group);
        }

        group.entries = this.getEntries(group);
        group.entries.push(entry);
        this.syncSummary(group);
      }

      this.data = this.groupRecords(this.data);
      this.save();
      this.closeModal();
      this.search(this.el("search-input").value);

    } catch (error) {
      console.error("QC save failed:", error);

      try {
        this.data = JSON.parse(previous);
      } catch {
        // หากกู้คืนสำเนาไม่ได้ ให้โหลดจาก storage ใหม่
        this.load();
      }

      this.render();

      alert("บันทึกไม่สำเร็จ กรุณาตรวจสอบข้อมูลและพื้นที่จัดเก็บ");
    } finally {
      this.saving = false;
      this.el("save-btn").disabled = false;
    }
  },

  // ==========================================
  // RENDER
  // ==========================================

  render(list = this.data) {
    const box = this.el("qc-list");
    if (!box) return;

    box.innerHTML = "";

    // แสดงเฉพาะกลุ่ม QC 21-37
    const visible = list.filter(
      group => group && this.validTitle(group.title)
    );

    if (!visible.length) {
      box.innerHTML = `
        <div class="ops-card col-span-full text-center">
          No QC Work Found
        </div>
      `;
      return;
    }

    visible.forEach(group => {
      const entries = this.getEntries(group);

      const historyHTML = entries.map((entry, index) => `
        <div
          class="qc-history-item border-t border-slate-700 pt-4 mt-4"
          data-history-row="${this.escapeHTML(entry.entryID)}"
        >
          <div class="flex justify-between items-center gap-3">

            <p class="text-xs text-slate-400">
              ครั้งที่ ${index + 1} ·
              ${this.escapeHTML(entry.date || "")}
            </p>

            <div class="flex items-center gap-2">

              <button
                type="button"
                data-action="edit"
                data-group="${this.escapeHTML(group.id)}"
                data-entry="${this.escapeHTML(entry.entryID)}"
                class="qc-icon-btn qc-edit-btn"
                aria-label="แก้ไขประวัติ ${index + 1}"
                title="แก้ไข"
              >
                ${this.icons.edit}
              </button>

              <button
                type="button"
                data-action="delete-entry"
                data-group="${this.escapeHTML(group.id)}"
                data-entry="${this.escapeHTML(entry.entryID)}"
                class="qc-icon-btn qc-delete-btn"
                aria-label="ลบประวัติ ${index + 1}"
                title="ลบประวัตินี้"
              >
                ${this.icons.trash}
              </button>

            </div>
          </div>

          <div class="qc-history-content mt-4">
            <p class="text-sm text-cyan-300 font-bold">Solution</p>

            <p class="mt-2 whitespace-pre-wrap break-words">
              ${this.escapeHTML(entry.solution || "-")}
            </p>

            <p class="mt-3 text-sm text-slate-400">
              Status: ${this.escapeHTML(entry.status || "Open")}
            </p>
          </div>
        </div>
      `).join("");

      const card = document.createElement("article");

      card.className = "ops-card qc-group-card";
      card.dataset.groupCard = String(group.id);

      card.innerHTML = `
        <div class="flex justify-between items-start gap-3">

          <h3 class="text-xl font-bold">
            ${this.escapeHTML(group.title)}
          </h3>

          <span class="text-xs text-slate-400 break-all">
            ID:${this.escapeHTML(group.id)}
          </span>

        </div>

        <div class="flex flex-wrap gap-2 mt-4">

          <span class="px-3 py-2 rounded-full
                       bg-cyan-400/20 text-cyan-300">
            ${entries.length} งาน
          </span>

          <span class="px-3 py-2 rounded-full
                       bg-slate-600/70 text-slate-200">
            ${this.escapeHTML(group.status || "Open")}
          </span>

        </div>

        <details class="mt-4">
          <summary class="cursor-pointer text-cyan-300">
            ดูประวัติงาน ${entries.length} ครั้ง
          </summary>

          <div class="qc-history-list">
            ${historyHTML}
          </div>
        </details>

        <div class="flex justify-end mt-5">
          <button
            type="button"
            data-action="delete-group"
            data-group="${this.escapeHTML(group.id)}"
            class="qc-icon-btn qc-delete-btn"
            aria-label="ลบกลุ่ม ${this.escapeHTML(group.title)} ทั้งหมด"
            title="ลบกลุ่มทั้งหมด"
          >
            ${this.icons.trash}
          </button>
        </div>
      `;

      box.appendChild(card);
    });
  },

  // ==========================================
  // ANIMATED DELETE
  // ==========================================

  animateRemoval(element) {
    return new Promise(resolve => {
      if (!element) {
        resolve();
        return;
      }

      // เริ่มแอนิเมชันทันที ไม่ต้องยืนยัน
      element.classList.add("qc-is-deleting");

      const reducedMotion = window.matchMedia(
        "(prefers-reduced-motion: reduce)"
      ).matches;

      window.setTimeout(() => {
        element.remove();
        resolve();
      }, reducedMotion ? 0 : 290);
    });
  },

  async deleteEntry(groupID, entryID, button) {
    const token = `entry:${groupID}:${entryID}`;

    if (this.deleting.has(token)) return;

    const group = this.data.find(
      item => String(item.id) === String(groupID)
    );

    if (!group) return;

    const entries = this.getEntries(group);
    const entry = entries.find(
      item => String(item.entryID) === String(entryID)
    );

    if (!entry) return;

    const row = button.closest("[data-history-row]");
    const card = button.closest("[data-group-card]");

    this.deleting.add(token);
    button.disabled = true;

    const previous = JSON.stringify(this.data);

    try {
      // ลบจากข้อมูลและบันทึกทันที โดยไม่เปิด confirm
      group.entries = entries.filter(
        item => String(item.entryID) !== String(entryID)
      );

      if (!group.entries.length) {
        this.data = this.data.filter(
          item => String(item.id) !== String(groupID)
        );
      } else {
        this.syncSummary(group);
      }

      this.save();

      if (!group.entries.length) {
        await this.animateRemoval(card);
      } else {
        await this.animateRemoval(row);
        this.search(this.el("search-input").value);
      }

    } catch (error) {
      console.error("QC history delete failed:", error);

      this.data = JSON.parse(previous);
      this.render();

      alert("ลบประวัติไม่สำเร็จ ข้อมูลถูกกู้คืนในหน้าจอแล้ว");
    } finally {
      this.deleting.delete(token);
    }
  },

  async deleteGroup(groupID, button) {
    const token = `group:${groupID}`;

    if (this.deleting.has(token)) return;

    const group = this.data.find(
      item => String(item.id) === String(groupID)
    );

    if (!group) return;

    const card = button.closest("[data-group-card]");
    const previous = JSON.stringify(this.data);

    this.deleting.add(token);
    button.disabled = true;

    try {
      // ลบกลุ่มทันที ไม่ถามยืนยัน
      this.data = this.data.filter(
        item => String(item.id) !== String(groupID)
      );

      this.save();

      await this.animateRemoval(card);

      // เคารพคำค้นหาที่ผู้ใช้กำลังพิมพ์
      this.search(this.el("search-input").value);

    } catch (error) {
      console.error("QC group delete failed:", error);

      this.data = JSON.parse(previous);
      this.render();

      alert("ลบกลุ่มไม่สำเร็จ ข้อมูลถูกกู้คืนในหน้าจอแล้ว");
    } finally {
      this.deleting.delete(token);
    }
  },

  // ==========================================
  // SEARCH
  // ==========================================

  search(text) {
    const key = String(text ?? "").toLowerCase().trim();

    if (!key) {
      this.render();
      return;
    }

    const result = this.data.filter(group => {
      if (!group || !this.validTitle(group.title)) {
        return false;
      }

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
