// =====================================
// OPS PORTAL V5
// QC OPERATIONS SYSTEM
// =====================================


const QC = {


data: [],

editID: null,




// ================================
// INIT
// ================================

init(){


if(!OPS.checkindex())

return;


this.load();

this.bind();

this.render();


},




// ================================
// LOAD
// ================================

load(){


this.data = OPS.load(

OPS.STORAGE.QC

);


if(!Array.isArray(this.data))

this.data=[];


},




// ================================
// SAVE
// ================================

save(){


OPS.save(

OPS.STORAGE.QC,

this.data

);


},




// ================================
// EVENT
// ================================

bind(){


document
.getElementById("add-btn")
.onclick=()=>{

this.openAdd();

};



document
.getElementById("save-btn")
.onclick=()=>{

this.saveWork();

};



document
.getElementById("cancel-btn")
.onclick=()=>{

this.closeModal();

};



document
.getElementById("search-input")
.oninput=(e)=>{

this.search(e.target.value);

};



},





// ================================
// MODAL
// ================================


openAdd(){


this.clear();


document
.getElementById("modal")
.classList
.remove("hidden");


document
.getElementById("modal")
.classList
.add("flex");


},




edit(id){


id=Number(id);



const item=this.data.find(

x=>Number(x.id)===id

);



if(!item)

return;



this.editID=id;



title.value=item.title || "";

detail.value=item.detail || "";

solution.value=item.solution || "";

status.value=item.status || "Open";



this.openAdd();


},





closeModal(){


const modal=document.getElementById("modal");


modal.classList.add("hidden");


modal.classList.remove("flex");


this.clear();


},




clear(){


title.value="";

detail.value="";

solution.value="";

status.value="Open";


this.editID=null;


},





// ================================
// SAVE
// ================================

saveWork(){


const itemData={


title:title.value.trim(),

detail:detail.value.trim(),

solution:solution.value.trim(),

status:status.value


};



if(!itemData.title)

return;





if(this.editID){


const item=this.data.find(

x=>Number(x.id)===Number(this.editID)

);



if(item){

Object.assign(

item,

itemData

);

}


}

else{


this.data.unshift({


id:OPS.createID(),

...itemData,

date:OPS.dateTime()


});


}




this.save();

this.render();

this.closeModal();


},





// ================================
// RENDER
// ================================

render(list=this.data){


const box=document.getElementById("qc-list");


if(!box)

return;



box.innerHTML="";



list.forEach(item=>{


box.innerHTML += `


<div class="ops-card">


<div class="
flex
justify-between
items-start
gap-4
">


<h3 class="
text-xl
font-bold
">

${item.title}

</h3>


<span class="
text-sm
text-slate-400
">

ID:${item.id}

</span>


</div>



<p class="
mt-4
text-slate-300
">

${item.detail || "No Detail"}

</p>



<div class="
mt-4
p-4
rounded-2xl
bg-cyan-400/10
">


<p class="text-cyan-300 font-bold">

Solution

</p>


<p class="mt-2">

${item.solution || "-"}

</p>


</div>




<div class="
mt-4
flex
items-center
justify-between
">


<span class="
px-4
py-2
rounded-full
bg-cyan-400/20
text-cyan-300
">

${item.status}

</span>


<span class="
text-sm
text-slate-400
">

${item.date || ""}

</span>


</div>





<div class="
flex
gap-3
mt-6
">


<button

onclick="QC.edit(${item.id})"

class="
dashboard-btn
bg-cyan-400/20
text-cyan-300
">

Edit

</button>



<button

onclick="QC.delete(${item.id})"

class="
dashboard-btn
bg-red-500/20
text-red-300
">

Delete

</button>



</div>


</div>


`;


});


},




// ================================
// DELETE
// ================================

delete(id){


this.data = this.data.filter(

x=>Number(x.id)!==Number(id)

);


this.save();

this.render();


},




// ================================
// SEARCH
// ================================

search(text){


const key=text.toLowerCase();



const result=this.data.filter(x=>


(x.title||"")
.toLowerCase()
.includes(key)



||



(x.detail||"")
.toLowerCase()
.includes(key)



);



this.render(result);


}



};





document.addEventListener(

"DOMContentLoaded",

()=>{


QC.init();


});
