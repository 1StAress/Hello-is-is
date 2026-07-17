// =====================================
// OPS PORTAL V4
// GLOBAL SIDEBAR SYSTEM
// =====================================


"use strict";


window.Sidebar =
window.Sidebar || {};



const Sidebar =
window.Sidebar;



// =====================================
// PATH
// =====================================

Sidebar.getBasePath = function(){


    const path =
    window.location.pathname;



    if(
        path.includes(
            "/modules/Knowledge/"
        )
    ){

        return "../../../";

    }



    if(
        path.includes(
            "/modules/"
        )
    ){

        return "../../";

    }



    return "./";


};





// =====================================
// INIT
// =====================================

Sidebar.init = async function(){


    console.log(
        "SIDEBAR INIT"
    );



    await this.load();


    this.fixLinks();


    this.bind();


    this.active();


};





// =====================================
// LOAD
// =====================================

Sidebar.load = async function(){


    const container =
    document.getElementById(
        "sidebar-container"
    );



    if(!container)
        return;



    const file =
    this.getBasePath()
    +
    "components/sidebar.html";



    const response =
    await fetch(file);



    if(!response.ok){

        console.error(
            "SIDEBAR HTML ERROR"
        );

        return;

    }



    container.innerHTML =
    await response.text();



    console.log(
        "SIDEBAR LOADED"
    );


};





// =====================================
// BIND
// =====================================

Sidebar.bind = function(){


    const open =
    document.getElementById(
        "menu-open"
    );



    const sidebar =
    document.getElementById(
        "sidebar"
    );



    const overlay =
    document.getElementById(
        "sidebar-overlay"
    );



    if(open && sidebar){


        open.onclick = ()=>{


            sidebar.classList.remove(
                "-translate-x-full"
            );


            if(overlay)
            overlay.classList.remove(
                "hidden"
            );


        };


    }





    if(overlay){


        overlay.onclick = ()=>{


            sidebar.classList.add(
                "-translate-x-full"
            );


            overlay.classList.add(
                "hidden"
            );


        };


    }





    // ============================
    // KNOWLEDGE TOGGLE
    // ============================


    const knowledge =
    document.getElementById(
        "knowledge-toggle"
    );


    const menu =
    document.getElementById(
        "knowledge-menu"
    );


    const arrow =
    document.getElementById(
        "knowledge-arrow"
    );



    if(
        knowledge &&
        menu
    ){


        knowledge.onclick = ()=>{


            menu.classList.toggle(
                "hidden"
            );



            if(arrow){


                arrow.style.transform =
                menu.classList.contains(
                    "hidden"
                )
                ?
                "rotate(0deg)"
                :
                "rotate(180deg)";


            }


        };


    }



};





// =====================================
// ROUTE
// =====================================

Sidebar.fixLinks = function(){


    const base =
    this.getBasePath();



    document
    .querySelectorAll(
        "[data-link]"
    )
    .forEach(link=>{


        const type =
        link.dataset.link;



        const routes = {



            dashboard:
            base+
            "dashboard.html",



            ip:
            base+
            "modules/IP/ip.html",



            qc:
            base+
            "modules/QC/qc.html",



            plc:
            base+
            "modules/PLC/plc.html",



            computer:
            base+
            "modules/Knowledge/Computer/computer.html",



            camera:
            base+
            "modules/Knowledge/Camera/camera.html",



            spss:
            base+
            "modules/Knowledge/SPSS/spss.html",



            cps:
            base+
            "modules/Knowledge/CPS/cps.html"


        };



        if(routes[type]){


            link.href =
            routes[type];


        }



    });



};





// =====================================
// ACTIVE
// =====================================

Sidebar.active=function(){


    const current =
    window.location.pathname;



    document
    .querySelectorAll(
        ".menu-link"
    )
    .forEach(link=>{


        if(
            link.href &&
            link.href.includes(
                current
            )
        ){


            link.classList.add(
                "menu-active"
            );


        }


    });



};





// =====================================
// START
// =====================================

document.addEventListener(
"DOMContentLoaded",
()=>{

    Sidebar.init();

}
);