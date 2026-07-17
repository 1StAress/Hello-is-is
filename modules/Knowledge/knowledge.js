// =====================================
// OPS PORTAL V4
// KNOWLEDGE HUB SYSTEM
// =====================================


const KnowledgeHub = {



    // =====================================
    // INIT
    // =====================================

    init(){


        console.log(
            "KNOWLEDGE HUB INIT"
        );



        if(!OPS.checkLogin())

            return;



        this.render();


    },







    // =====================================
    // DATA
    // =====================================


    categories:[


        {

            icon:"🖥",

            title:"Computer",

            detail:
            "Computer troubleshooting and solutions",

            link:
            "./Computer/computer.html"

        },


        {

            icon:"📷",

            title:"Camera",

            detail:
            "Camera system knowledge",

            link:
            "./Camera/camera.html"

        },


        {

            icon:"⚙",

            title:"CPS",

            detail:
            "Control system knowledge",

            link:
            "./CPS/cps.html"

        },


        {

            icon:"📊",

            title:"SPSS",

            detail:
            "SPSS software knowledge",

            link:
            "./SPSS/spss.html"

        }



    ],







    // =====================================
    // RENDER
    // =====================================


    render(){


        const box =

        document.getElementById(
            "knowledge-list"
        );



        if(!box)

            return;





        box.innerHTML =


        this.categories.map(item=>


            OPS.ui.card({

                icon:item.icon,

                title:item.title,

                subtitle:item.detail


            })


        ).join("");







        this.bindCard();



    },









    // =====================================
    // EVENT
    // =====================================


    bindCard(){


        const cards =

        document.querySelectorAll(
            "#knowledge-list .ops-card"
        );



        cards.forEach(

            (card,index)=>{


                card.onclick=()=>{


                    window.location.href =

                    this.categories[index].link;



                };


            }

        );



    }




};







// =====================================
// START
// =====================================


document.addEventListener(

"DOMContentLoaded",

()=>{


    KnowledgeHub.init();


}

);
