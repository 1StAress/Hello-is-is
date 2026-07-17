// =====================================
// OPS PORTAL V3 CORE
// PART 1 / 4
// =====================================

"use strict";

console.log("COMMON LOAD");

window.OPS = window.OPS || {};

const OPS = window.OPS;

// =====================================
// VERSION
// =====================================

OPS.VERSION = "3.2.0";

// =====================================
// STORAGE KEY
// =====================================

OPS.STORAGE = {

    IP: "OPS_IP_DATA",

    QC: "OPS_QC_DATA",

    PLC: "OPS_PLC_DATA",

    COMPUTER: "OPS_KNOWLEDGE_COMPUTER",

    CAMERA: "OPS_KNOWLEDGE_CAMERA",

    SPSS: "OPS_KNOWLEDGE_SPSS",

    CPS: "OPS_KNOWLEDGE_CPS"

};

// =====================================
// BASE PATH
// =====================================

OPS.path = function () {

    const path =
        window.location.pathname;

    if (
        !path.includes("/modules/")
    ) {

        return "./";

    }

    if (
        path.includes("/modules/Knowledge/")
    ) {

        return "../../../";

    }

    return "../../";

};

// =====================================
// ROUTER
// =====================================

OPS.ROUTES = {

   index:
        "index.html",

    dashboard:
        "dashboard.html",

    ip:
        "modules/IP/ip.html",

    qc:
        "modules/QC/qc.html",

    plc:
        "modules/PLC/plc.html",

    computer:
        "modules/Knowledge/Computer/computer.html",

    camera:
        "modules/Knowledge/Camera/camera.html",

    spss:
        "modules/Knowledge/SPSS/spss.html",

    cps:
        "modules/Knowledge/CPS/cps.html"

};

// =====================================
// NAVIGATE
// =====================================

OPS.go = function (page) {

    const target =
        OPS.ROUTES[page];

    if (!target) {

        console.warn(
            "Unknown Route:",
            page
        );

        return;

    }

    window.location.href =
        OPS.path() + target;

};

// =====================================
// STORAGE LOAD
// =====================================

OPS.load = function(key) {
    
    try {
        
        const data =
            localStorage.getItem(key);
        
        return data ?
            JSON.parse(data) :
            [];
        
    }
    
    catch (error) {
        
        console.error(
            "LOAD ERROR",
            error
        );
        
        return [];
        
    }
    
};

// =====================================
// STORAGE SAVE
// =====================================

OPS.save = function(key, data) {
    
    try {
        
        localStorage.setItem(
            key,
            JSON.stringify(data)
        );
        
        return true;
        
    }
    
    catch (error) {
        
        console.error(
            "SAVE ERROR",
            error
        );
        
        return false;
        
    }
    
};

// =====================================
// STORAGE REMOVE
// =====================================

OPS.remove = function(key) {
    
    try {
        
        localStorage.removeItem(
            key
        );
        
        return true;
        
    }
    
    catch (error) {
        
        console.error(
            "REMOVE ERROR",
            error
        );
        
        return false;
        
    }
    
};

// =====================================
// STORAGE CLEAR
// =====================================

OPS.clear = function() {
    
    try {
        
        localStorage.clear();
        
        return true;
        
    }
    
    catch (error) {
        
        console.error(
            "CLEAR ERROR",
            error
        );
        
        return false;
        
    }
    
};

// =====================================
// SESSION HELPERS
// =====================================

OPS.session = {
    
    get(key) {
        
        try {
            
            return JSON.parse(
                sessionStorage.getItem(key)
            );
            
        }
        
        catch {
            
            return sessionStorage.getItem(key);
            
        }
        
    },
    
    set(key, value) {
        
        if (
            typeof value === "object"
        ) {
            
            sessionStorage.setItem(
                key,
                JSON.stringify(value)
            );
            
        }
        
        else {
            
            sessionStorage.setItem(
                key,
                value
            );
            
        }
        
    },
    
    remove(key) {
        
        sessionStorage.removeItem(
            key
        );
        
    }
    
};



// =====================================
// LOGIN CHECK
// =====================================

OPS.checkIndex = function() {
    
    const index =
        sessionStorage.getItem(
            "index"
        );
    
    if (index !== "true") {
        
        OPS.go("index");
        
        return false;
        
    }
    
    return true;
    
};

// =====================================
// LOGOUT BUTTON
// =====================================

// =====================================
// LOGOUT
// =====================================

OPS.logout = function() {
    
    sessionStorage.removeItem(
        "OPS_LOGIN"
    );
    
    sessionStorage.removeItem(
        "index"
    );
    
    OPS.go("index");
    
};

// =====================================
// CREATE ID
// =====================================

OPS.createID = function() {
    
    return Date.now();
    
};

// =====================================
// UUID
// =====================================

OPS.uuid = function() {
    
    return (
        
        Date.now().toString(36) +
        
        Math.random()
        .toString(36)
        .substring(2, 8)
        
    ).toUpperCase();
    
};

// =====================================
// DATE FORMAT
// =====================================

OPS.formatDate = function(date = new Date()) {
    
    return new Intl.DateTimeFormat(
        "th-TH",
        {
            
            year: "numeric",
            
            month: "2-digit",
            
            day: "2-digit"
            
        }
        
    ).format(date);
    
};

// =====================================
// TIME FORMAT
// =====================================

OPS.formatTime = function(date = new Date()) {
    
    return new Intl.DateTimeFormat(
        "th-TH",
        {
            
            hour: "2-digit",
            
            minute: "2-digit",
            
            second: "2-digit"
            
        }
        
    ).format(date);
    
};

// =====================================
// DATETIME
// =====================================

OPS.dateTime = function() {
    
    return (
        
        OPS.formatDate()
        
        +
        
        " "
        
        +
        
        OPS.formatTime()
        
    );
    
};

// =====================================
// VERSION
// =====================================

OPS.version = function() {
    
    console.log(
        
        "OPS PORTAL",
        
        OPS.VERSION
        
    );
    
};



// =====================================
// TOAST
// =====================================

OPS.toast = function(
    message = "Success",
    duration = 2500
) {
    
    const toast =
        document.createElement("div");
    
    toast.className =
        "fixed bottom-6 right-6 bg-black text-white px-5 py-3 rounded-xl shadow-xl z-[9999] opacity-0 transition-opacity duration-300";
    
    toast.textContent =
        message;
    
    document.body.appendChild(
        toast
    );
    
    requestAnimationFrame(() => {
        
        toast.classList.remove(
            "opacity-0"
        );
        
        toast.classList.add(
            "opacity-100"
        );
        
    });
    
    setTimeout(() => {
        
        toast.classList.remove(
            "opacity-100"
        );
        
        toast.classList.add(
            "opacity-0"
        );
        
        setTimeout(() => {
            
            toast.remove();
            
        }, 300);
        
    }, duration);
    
};

// =====================================
// CONFIRM
// =====================================

OPS.confirm = function(
    message = "Are you sure?"
) {
    
    return window.confirm(
        message
    );
    
};

// =====================================
// UTILS
// =====================================

OPS.utils = {
    
    clone(data) {
        
        return JSON.parse(
            JSON.stringify(data)
        );
        
    },
    
    isEmpty(value) {
        
        return (
            
            value === null ||
            
            value === undefined ||
            
            value === ""
            
        );
        
    },
    
    delay(ms = 300) {
        
        return new Promise(resolve => {
            
            setTimeout(
                resolve,
                ms
            );
            
        });
        
    }
    
};

// =====================================
// READY
// =====================================

console.log(
    "OPS CORE READY",
    OPS.VERSION
);

// รองรับไฟล์เก่า
OPS.checkindex = OPS.checkIndex;
