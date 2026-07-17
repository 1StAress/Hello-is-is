// =====================================
// OPSPORTAL V2
// SPSS KNOWLEDGE CENTER V2
// =====================================


const SPSS = {


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
OPS.STORAGE.SPSS
);


if(!Array.isArray(this.data))

this.data=[];


},



// ================================
// SAVE
// ================================

save(){


OPS.save(
OPS.STORAGE.SPSS,
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



clear(){


document
.getElementById("title")
.value="";


document
.getElementById("detail")
.value="";


this.editID=null;


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


const item = this.data.find(

x=>

Number(x.id)===Number(this.editID)

);



if(item){

item.title=title;

item.detail=detail;

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
.getElementById("spss-list");


box.innerHTML="";



list.forEach(item=>{


box.innerHTML +=`


<div class="ops-card">


<div class="
flex
justify-between
">


<h3 class="
font-bold
text-xl
">

${item.title}

</h3>


<span class="
text-gray-400
text-sm
">

ID:${item.id}

</span>


</div>



<p class="
mt-3
text-gray-600
">

${item.detail}

</p>



<p class="
text-sm
text-gray-400
mt-3
">

${item.date}

</p>



<div class="
flex
gap-2
mt-4
">


<button

onclick="SPSS.edit(${item.id})"

class="
bg-yellow-400
px-3
py-2
rounded-lg
">

Edit

</button>



<button

onclick="SPSS.delete(${item.id})"

class="
bg-red-500
text-white
px-3
py-2
rounded-lg
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


const item = this.data.find(

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


id=Number(id);



this.data = this.data.filter(

x=>

Number(x.id)!==id

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



const result = this.data.filter(x=>


x.title
.toLowerCase()
.includes(key)



||



x.detail
.toLowerCase()
.includes(key)



);



this.render(result);



}



};




document.addEventListener(

"DOMContentLoaded",

()=>{


SPSS.init();


});
