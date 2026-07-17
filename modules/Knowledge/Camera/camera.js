// =====================================
// OPSPORTAL V2
// CAMERA KNOWLEDGE CENTER V2
// =====================================


const Camera = {


data: [],

editID:null,



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

OPS.STORAGE.CAMERA

);


if(!Array.isArray(this.data))

this.data=[];


},






// ================================
// SAVE
// ================================

save(){


OPS.save(

OPS.STORAGE.CAMERA,

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


this.openModal();


};




document
.getElementById("save-btn")
.onclick=()=>{


this.saveItem();


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

openModal(){


document
.getElementById("modal")
.classList
.remove("hidden");


},




closeModal(){


document
.getElementById("modal")
.classList
.add("hidden");


this.clear();


},







// ================================
// SAVE ITEM
// ================================

saveItem(){


const title =

document
.getElementById("title")
.value
.trim();




const detail =

document
.getElementById("detail")
.value
.trim();




if(!title)

return;






if(this.editID){



const item =

this.data.find(

x=>

Number(x.id)===Number(this.editID)

);



if(item){


item.title = title;

item.detail = detail;


}



}

else{


this.data.unshift({


id:OPS.createID(),

title,

detail,

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



const box =

document
.getElementById("camera-list");



box.innerHTML="";






list.forEach(item=>{


box.innerHTML += `


<div class="ops-card">


<div class="
flex
justify-between
items-start
">


<h3 class="
font-bold
text-xl
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
text-slate-300
mt-4
">

${item.detail}

</p>






<p class="
text-sm
text-slate-400
mt-4
">

${item.date || "-"}

</p>






<div class="
flex
gap-3
mt-5
">



<button

onclick="Camera.edit(${item.id})"

class="
bg-cyan-500
text-white
px-4
py-2
rounded-xl
">

Edit

</button>





<button

onclick="Camera.delete(${item.id})"

class="
bg-red-500
text-white
px-4
py-2
rounded-xl
">

Delete

</button>



</div>





</div>


`;



});



},







// ================================
// EDIT
// ================================

edit(id){



const item =

this.data.find(

x=>

Number(x.id)===Number(id)

);



if(!item)

return;




this.editID=id;



document
.getElementById("title")
.value=item.title;



document
.getElementById("detail")
.value=item.detail;



this.openModal();



},







// ================================
// DELETE
// ================================

delete(id){



this.data =

this.data.filter(

x=>

Number(x.id)!==Number(id)

);



this.save();


this.render();



},







// ================================
// SEARCH
// ================================

search(text){



const key =

text.toLowerCase();




const result =

this.data.filter(x=>


x.title

.toLowerCase()

.includes(key)



||



x.detail

.toLowerCase()

.includes(key)



);



this.render(result);



},







// ================================
// CLEAR
// ================================

clear(){


document
.getElementById("title")
.value="";



document
.getElementById("detail")
.value="";


this.editID=null;


}



};







document.addEventListener(

"DOMContentLoaded",

()=>{


Camera.init();


});
