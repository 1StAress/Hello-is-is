// =====================================
// OPS PORTAL V4
// DASHBOARD SYSTEM
// =====================================


const Dashboard = {


    init(){


        console.log(
            "DASHBOARD INIT"
        );


        if(!OPS.checkIndex())

            return;



        this.loadUser();


        this.loadClock();


        this.loadStatistics();


        this.loadRecent();


        this.bind();



    },





    // =====================================
    // USER
    // =====================================


    loadUser(){


        const user =

        sessionStorage.getItem(
            "OPS_LOGIN"
        )
        ||
        "User";




        const box =

        document.getElementById(
            "username-display"
        );



        if(box)

            box.innerText = user;



    },







    // =====================================
    // CLOCK
    // =====================================


    loadClock(){


        const clock =

        document.getElementById(
            "clock"
        );



        const today =

        document.getElementById(
            "today"
        );



        function update(){


            const now =

            new Date();



            if(clock)

            clock.innerText =

            now.toLocaleTimeString();



            if(today)

            today.innerText =

            now.toLocaleDateString(
                "en-US",
                {
                    weekday:"long",
                    year:"numeric",
                    month:"long",
                    day:"numeric"
                }
            );



        }



        update();



        setInterval(
            update,
            1000
        );



    },






    // =====================================
    // STATISTICS
    // =====================================


    loadStatistics(){


        const ip =

        OPS.load(
            OPS.STORAGE.IP
        );



        const qc =

        OPS.load(
            OPS.STORAGE.QC
        );



        const plc =

        OPS.load(
            OPS.STORAGE.PLC
        );



        const knowledge =

        [

            ...OPS.load(
                OPS.STORAGE.COMPUTER
            ),

            ...OPS.load(
                OPS.STORAGE.CAMERA
            ),

            ...OPS.load(
                OPS.STORAGE.SPSS
            ),

            ...OPS.load(
                OPS.STORAGE.CPS
            )

        ];




        this.setValue(
            "stat-ip",
            ip.length
        );


        this.setValue(
            "stat-qc",
            qc.length
        );


        this.setValue(
            "stat-plc",
            plc.length
        );


        this.setValue(
            "stat-knowledge",
            knowledge.length
        );



    },




    setValue(id,value){


        const el =

        document.getElementById(id);



        if(el)

            el.innerText=value;



    },
    
        // =====================================
    // RECENT ACTIVITY
    // =====================================


    loadRecent(){


        const box =

        document.getElementById(
            "recent-list"
        );



        if(!box)

            return;



        let data=[];



        const qc = OPS.load(
            OPS.STORAGE.QC
        );


        const plc = OPS.load(
            OPS.STORAGE.PLC
        );



        data = [

            ...qc,

            ...plc

        ];



        data.sort(

            (a,b)=>

            b.id-a.id

        );



        data = data.slice(
            0,
            5
        );





        if(data.length===0){


            box.innerHTML =

            OPS.ui.empty(
                "No Recent Activity"
            );


            return;


        }







        box.innerHTML =

        data.map(item=>


            OPS.ui.listCard({

                id:item.id,

                title:item.title,

                detail:item.detail || "",

                status:

                OPS.ui.badge(

                    item.status || "Open",

                    "success"

                ),

                date:

                item.date ||

                item.createdAt ||

                "-"


            })


        ).join("");



    },







    // =====================================
    // MODULE QUICK CARD
    // =====================================


    renderModules(){



        const box =

        document.getElementById(
            "module-area"
        );



        if(!box)

            return;





        const modules=[


            {

                icon:"🌐",

                title:"IP Management",

                detail:"QC / RTG Network",

                link:"modules/IP/ip.html"

            },


            {

                icon:"🛠",

                title:"QC Operations",

                detail:"Work Log System",

                link:"modules/QC/qc.html"

            },


            {

                icon:"⚙",

                title:"PLC Work",

                detail:"Machine Problem",

                link:"modules/PLC/plc.html"

            },


            {

                icon:"📚",

                title:"Knowledge Center",

                detail:"Computer / Camera / SPSS / CPS",

                link:"modules/Knowledge/knowledge.html"

            }


        ];





        box.innerHTML =


        modules.map(item=>


            OPS.ui.card({

                icon:item.icon,

                title:item.title,

                subtitle:item.detail


            })


        ).join("");





        box

        .querySelectorAll(".ops-card")

        .forEach(

            (card,index)=>{


                card.onclick=()=>{


                    location.href =

                    modules[index].link;


                };


            }

        );



    },







    // =====================================
    // EVENTS
    // =====================================


    bind() {
            
            const logout =
                document.getElementById(
                    "logout-btn"
                );
            
            
            if (logout) {
                
                logout.onclick = () => {
                    
                    OPS.logout();
                    
                };
                
            }
            
        },
        
        
        // =====================================
        // AUTO REFRESH
        // =====================================
        
        refresh() {
            
            this.loadStatistics();
            
            this.loadRecent();
            
        },
        
        
        // =====================================
        // ERROR SAFE
        // =====================================
        
        safeRun(fn) {
            
            try {
                
                fn();
                
            }
            
            catch (error) {
                
                console.error(
                    "DASHBOARD ERROR",
                    error
                );
                
            }
            
        }
    
    
    };





document.addEventListener(
    "DOMContentLoaded",
    () => {
        
        Dashboard.safeRun(
            () => Dashboard.init()
        );
        
    });
    
    
    function openKnowledgePopup() {
    
    document
        .getElementById("knowledge-popup")
        .classList
        .remove("hidden");
    
}



function closeKnowledgePopup() {
    
    document
        .getElementById("knowledge-popup")
        .classList
        .add("hidden");
    
}