/* OPS Portal 4.0 - Backup & Restore
 * Offline-first. Only operates on the seven explicitly approved OPS Storage Keys.
 * Does not call localStorage.clear().
 */
(() => {
  "use strict";

  const FORMAT = "OPS_PORTAL_BACKUP";
  const FORMAT_VERSION = 1;
  const KEYS = [
    { key: "OPS_IP_DATA", label: "IP" },
    { key: "OPS_QC_DATA", label: "QC" },
    { key: "OPS_PLC_DATA", label: "PLC" },
    { key: "OPS_KNOWLEDGE_COMPUTER", label: "Computer" },
    { key: "OPS_KNOWLEDGE_CAMERA", label: "Camera" },
    { key: "OPS_KNOWLEDGE_SPSS", label: "SPSS" },
    { key: "OPS_KNOWLEDGE_CPS", label: "CPS" }
  ];

  const $ = id => document.getElementById(id);
  let validatedBackup = null;
  let validatedFileName = "";

  function report(id, message, kind = "") {
    const node = $(id);
    node.textContent = message;
    node.className = "br-status" + (kind ? " " + kind : "");
  }

  function safeStringify(value) {
    return JSON.stringify(value);
  }

  function readCurrentRaw() {
    const result = {};
    const issues = [];
    for (const item of KEYS) {
      let raw;
      try {
        raw = localStorage.getItem(item.key);
      } catch (error) {
        issues.push(`${item.label}: อ่าน localStorage ไม่สำเร็จ (${error.message})`);
        continue;
      }
      if (raw === null) {
        result[item.key] = { present: false, raw: null, value: null };
        continue;
      }
      try {
        const value = JSON.parse(raw);
        if (!Array.isArray(value)) {
          issues.push(`${item.label}: ข้อมูลที่เก็บอยู่ไม่ใช่อาร์เรย์ตามโครงสร้างโมดูลปัจจุบัน`);
        }
        result[item.key] = { present: true, raw, value };
      } catch (error) {
        issues.push(`${item.label}: JSON ใน localStorage เสียหาย จึงหยุดเพื่อป้องกันการเขียนทับ`);
        result[item.key] = { present: true, raw, value: undefined };
      }
    }
    return { result, issues };
  }

  function countValue(value) {
    return Array.isArray(value) ? value.length : "—";
  }

  function renderCurrent() {
    const { result, issues } = readCurrentRaw();
    const summary = $("current-summary");
    summary.replaceChildren();
    for (const item of KEYS) {
      const record = result[item.key];
      const card = document.createElement("div");
      card.className = "br-stat";
      const title = document.createElement("strong");
      title.textContent = item.label;
      const count = document.createElement("div");
      count.style.fontSize = "1.5rem";
      count.style.margin = "8px 0";
      count.textContent = record && record.present ? countValue(record.value) : "ไม่มีคีย์";
      const key = document.createElement("code");
      key.className = "br-muted";
      key.textContent = item.key;
      card.append(title, count, key);
      summary.append(card);
    }
    if (issues.length) {
      report("current-status", "พบปัญหา — ห้าม Restore จนกว่าจะตรวจสอบ:\n• " + issues.join("\n• "), "br-bad");
    } else {
      report("current-status", "ตรวจ Storage Keys ทั้ง 7 รายการแล้ว ไม่พบ JSON เสียหาย\nคีย์ที่ไม่มีอยู่จะถูกแสดงแยกจากอาร์เรย์ว่าง และจะไม่ถูกตีความว่าเป็นข้อมูลประเภทเดียวกัน", "br-good");
    }
    $("export-btn").disabled = issues.length > 0;
    return { result, issues };
  }

  function makeEnvelope(values, metadata = {}) {
    return {
      format: FORMAT,
      formatVersion: FORMAT_VERSION,
      app: "OPS Portal",
      appVersion: (window.OPS && typeof OPS.version === "function") ? OPS.version() : "unknown",
      createdAt: new Date().toISOString(),
      keys: KEYS.map(item => ({
        key: item.key,
        present: values[item.key].present,
        data: values[item.key].present ? values[item.key].value : null
      })),
      metadata
    };
  }

  function downloadText(text, filename) {
    const blob = new Blob([text], { type: "application/json;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = filename;
    document.body.append(a);
    a.click();
    a.remove();
    setTimeout(() => URL.revokeObjectURL(url), 1500);
  }

  function timestampForFile() {
    return new Date().toISOString().replace(/[:.]/g, "-");
  }

  function exportCurrent() {
    const current = renderCurrent();
    if (current.issues.length) {
      report("current-status", "ยกเลิก Export เพื่อป้องกันการสร้างไฟล์ที่แอบแฝงการสูญหายของข้อมูล:\n• " + current.issues.join("\n• "), "br-bad");
      return;
    }
    try {
      const envelope = makeEnvelope(current.result);
      const text = JSON.stringify(envelope, null, 2);
      // Verify generated content can be parsed and all seven keys remain represented.
      const check = JSON.parse(text);
      validateEnvelope(check);
      downloadText(text, `OPS-Portal-Backup-${timestampForFile()}.json`);
      report("current-status", "สร้างไฟล์ Backup JSON และตรวจสอบโครงสร้างไฟล์ที่สร้างแล้ว\nโปรดตรวจสอบว่าเบราว์เซอร์ดาวน์โหลดไฟล์สำเร็จและเก็บไฟล์ไว้ในที่ปลอดภัย", "br-good");
    } catch (error) {
      report("current-status", "สร้าง Backup ไม่สำเร็จ: " + error.message, "br-bad");
    }
  }

  function validateEnvelope(data) {
    if (!data || typeof data !== "object" || Array.isArray(data)) throw new Error("รูปแบบราก JSON ไม่ถูกต้อง");
    if (data.format !== FORMAT) throw new Error("ไม่ใช่ไฟล์ Backup ของ OPS Portal");
    if (data.formatVersion !== FORMAT_VERSION) throw new Error("ไม่รองรับ formatVersion นี้");
    if (!Array.isArray(data.keys)) throw new Error("ไม่พบรายการ keys");
    const byKey = new Map();
    for (const entry of data.keys) {
      if (!entry || typeof entry !== "object" || typeof entry.key !== "string") throw new Error("พบรายการ key ที่ไม่ถูกต้อง");
      if (byKey.has(entry.key)) throw new Error("พบ Storage Key ซ้ำ: " + entry.key);
      byKey.set(entry.key, entry);
    }
    if (byKey.size !== KEYS.length) throw new Error("ไฟล์ต้องมี Storage Keys ครบทั้ง 7 รายการ");
    const normalized = {};
    for (const item of KEYS) {
      const entry = byKey.get(item.key);
      if (!entry) throw new Error("ขาด Storage Key: " + item.key);
      if (typeof entry.present !== "boolean") throw new Error("ฟิลด์ present ไม่ถูกต้อง: " + item.key);
      if (entry.present) {
        if (!Array.isArray(entry.data)) throw new Error("ข้อมูล " + item.label + " ต้องเป็นอาร์เรย์");
        // Validate JSON-safe shape and reject exotic values. Preserve unknown fields unchanged.
        const serialized = JSON.stringify(entry.data);
        if (typeof serialized !== "string" || !Array.isArray(JSON.parse(serialized))) {
          throw new Error("โครงสร้างข้อมูลไม่ผ่านการตรวจสอบ: " + item.key);
        }
        normalized[item.key] = { present: true, value: entry.data };
      } else {
        if (entry.data !== null) throw new Error("คีย์ที่ไม่มีข้อมูลต้องใช้ data: null (" + item.key + ")");
        normalized[item.key] = { present: false, value: null };
      }
    }
    return normalized;
  }

  function renderPreview(data, normalized) {
    const table = document.createElement("table");
    const thead = document.createElement("thead");
    thead.innerHTML = "<tr><th>โมดูล</th><th>Storage Key</th><th>สถานะในไฟล์</th><th>จำนวนรายการ</th></tr>";
    table.append(thead);
    const tbody = document.createElement("tbody");
    for (const item of KEYS) {
      const rec = normalized[item.key];
      const tr = document.createElement("tr");
      const values = [
        item.label,
        item.key,
        rec.present ? "มีข้อมูล" : "ไม่มีคีย์",
        rec.present ? String(rec.value.length) : "—"
      ];
      for (const value of values) {
        const td = document.createElement("td");
        td.textContent = value;
        tr.append(td);
      }
      tbody.append(tr);
    }
    table.append(tbody);
    const meta = document.createElement("p");
    meta.className = "br-muted";
    meta.textContent = `ไฟล์: ${validatedFileName} · รุ่นรูปแบบ: ${data.formatVersion} · สร้างเมื่อ: ${data.createdAt || "ไม่ระบุ"}`;
    $("preview-summary").replaceChildren(meta, table);
    $("preview").hidden = false;
    $("confirm-restore").checked = false;
    $("restore-btn").disabled = true;
  }

  async function validateSelectedFile() {
    const file = $("backup-file").files[0];
    validatedBackup = null;
    validatedFileName = "";
    $("preview").hidden = true;
    $("restore-btn").disabled = true;
    if (!file) {
      report("restore-status", "กรุณาเลือกไฟล์ JSON ก่อน", "br-bad");
      return;
    }
    if (file.size > 100 * 1024 * 1024) {
      report("restore-status", "ไฟล์ใหญ่กว่า 100 MB ระบบหยุดเพื่อหลีกเลี่ยงการใช้หน่วยความจำมากเกินไป", "br-bad");
      return;
    }
    try {
      const text = await file.text();
      const parsed = JSON.parse(text);
      const normalized = validateEnvelope(parsed);
      validatedBackup = { parsed, normalized };
      validatedFileName = file.name;
      renderPreview(parsed, normalized);
      report("restore-status", "ตรวจสอบไฟล์ผ่านในขั้น Preview เท่านั้น ยังไม่มีการเปลี่ยนแปลง localStorage", "br-good");
    } catch (error) {
      report("restore-status", "ไฟล์ไม่ผ่านการตรวจสอบ: " + error.message + "\nไม่มีการเปลี่ยนแปลงข้อมูลปัจจุบัน", "br-bad");
    }
  }

  function sameRaw(expected, actual) {
    return expected === actual;
  }

  async function restore() {
    if (!validatedBackup || !$("confirm-restore").checked) {
      report("restore-status", "ต้องตรวจสอบไฟล์และติ๊กยืนยันก่อน", "br-bad");
      return;
    }
    // Re-read immediately before any write, and stop if current data has become malformed.
    const current = readCurrentRaw();
    if (current.issues.length) {
      report("restore-status", "ยกเลิกกู้คืน เพราะข้อมูลปัจจุบันมีปัญหา:\n• " + current.issues.join("\n• "), "br-bad");
      renderCurrent();
      return;
    }

    // Make an in-memory rollback snapshot of exact raw values and verify it can be reconstructed.
    const snapshot = {};
    try {
      for (const item of KEYS) {
        const r = current.result[item.key];
        snapshot[item.key] = { present: r.present, raw: r.raw };
        if (r.present) {
          const parsed = JSON.parse(r.raw);
          if (JSON.stringify(parsed) !== JSON.stringify(r.value)) throw new Error("ตรวจสอบ Snapshot ไม่ผ่าน: " + item.key);
        }
      }
      const snapshotEnvelope = {
        format: FORMAT, formatVersion: FORMAT_VERSION, app: "OPS Portal",
        appVersion: (window.OPS && typeof OPS.version === "function") ? OPS.version() : "unknown",
        createdAt: new Date().toISOString(),
        keys: KEYS.map(item => ({
          key: item.key,
          present: snapshot[item.key].present,
          data: snapshot[item.key].present ? JSON.parse(snapshot[item.key].raw) : null
        })),
        metadata: { purpose: "automatic-pre-restore-snapshot" }
      };
      const snapshotText = JSON.stringify(snapshotEnvelope, null, 2);
      validateEnvelope(JSON.parse(snapshotText));
      // Trigger download before any writes; user must confirm a second time after initiating it.
      downloadText(snapshotText, `OPS-Portal-PreRestore-${timestampForFile()}.json`);
    } catch (error) {
      report("restore-status", "ไม่สามารถสร้างและตรวจสอบ Snapshot ก่อนกู้คืนได้ จึงหยุดโดยไม่เขียนข้อมูล: " + error.message, "br-bad");
      return;
    }

    const proceed = window.confirm(
      "ระบบได้สร้างไฟล์สำรองข้อมูลปัจจุบันแล้ว (PreRestore JSON)\n\n" +
      "ยืนยันอีกครั้งเพื่อแทนที่ข้อมูลใน Storage Keys ทั้ง 7 รายการด้วยไฟล์:\n" +
      validatedFileName + "\n\n" +
      "ควรตรวจสอบว่าไฟล์สำรองถูกดาวน์โหลดและเก็บไว้แล้ว กด OK เพื่อเริ่มกู้คืน"
    );
    if (!proceed) {
      report("restore-status", "ยกเลิกตามคำขอ ไม่มีการเปลี่ยนแปลงข้อมูล", "");
      return;
    }

    const target = validatedBackup.normalized;
    const written = [];
    try {
      for (const item of KEYS) {
        const record = target[item.key];
        if (!record.present) {
          localStorage.removeItem(item.key);
        } else {
          const serialized = JSON.stringify(record.value);
          // Verify serialization before writing.
          if (!Array.isArray(JSON.parse(serialized))) throw new Error("ข้อมูลก่อนบันทึกไม่ผ่านการตรวจสอบ: " + item.key);
          localStorage.setItem(item.key, serialized);
        }
        written.push(item.key);
        const actual = localStorage.getItem(item.key);
        if (!record.present) {
          if (actual !== null) throw new Error("ลบคีย์เป้าหมายไม่สำเร็จ: " + item.key);
        } else {
          if (actual === null) throw new Error("ไม่พบข้อมูลหลังบันทึก: " + item.key);
          const actualParsed = JSON.parse(actual);
          if (JSON.stringify(actualParsed) !== JSON.stringify(record.value)) {
            throw new Error("ข้อมูลหลังบันทึกไม่ตรงกับไฟล์: " + item.key);
          }
        }
      }
      report("restore-status", "กู้คืนสำเร็จและตรวจสอบข้อมูลหลังบันทึกครบทั้ง 7 Storage Keys แล้ว\nแนะนำให้รีโหลดหน้าเว็บและตรวจสอบโมดูล IP, QC, PLC และ Knowledge ทั้ง 4 หมวด", "br-good");
      renderCurrent();
      $("preview").hidden = true;
      validatedBackup = null;
      $("backup-file").value = "";
    } catch (error) {
      const rollbackErrors = [];
      for (const item of KEYS) {
        try {
          const old = snapshot[item.key];
          if (!old.present) {
            localStorage.removeItem(item.key);
          } else {
            localStorage.setItem(item.key, old.raw);
          }
          const verify = localStorage.getItem(item.key);
          if (old.present ? verify !== old.raw : verify !== null) {
            throw new Error("ค่า raw หลัง Rollback ไม่ตรง");
          }
        } catch (rollbackError) {
          rollbackErrors.push(item.key + ": " + rollbackError.message);
        }
      }
      const suffix = rollbackErrors.length
        ? "\nROLLBACK มีปัญหา โปรดอย่าใช้งานต่อจนกว่าจะตรวจสอบ:\n• " + rollbackErrors.join("\n• ")
        : "\nระบบพยายามคืนค่า raw data เดิมของทุกคีย์และตรวจสอบแล้ว";
      report("restore-status", "กู้คืนไม่สำเร็จ: " + error.message + suffix, "br-bad");
      renderCurrent();
    }
  }

  document.addEventListener("DOMContentLoaded", () => {
    $("export-btn").addEventListener("click", exportCurrent);
    $("validate-btn").addEventListener("click", validateSelectedFile);
    $("confirm-restore").addEventListener("change", () => {
      $("restore-btn").disabled = !validatedBackup || !$("confirm-restore").checked;
    });
    $("restore-btn").addEventListener("click", restore);
    renderCurrent();
  });
})();
