// =====================================
// OPSPORTAL V2
// PLC WORK MANAGEMENT
// =====================================


const PLC = {



data: [],







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
// LOAD DATA
// ================================


load(){



this.data =

OPS.load(

OPS.STORAGE.PLC

);





if(!Array.isArray(this.data)){


this.data=[];


}




},







// ================================
// SAVE
// ================================


save(){



OPS.save(

OPS.STORAGE.PLC,

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


this.createNew();


};






document

.getElementById("search-input")

.oninput=(e)=>{


this.search(

e.target.value

);



};



},







// ================================
// CREATE NEW
// ================================


createNew() {
  
  const id = Date.now();
  
  
  window.location.href =
    "plc_detail.html?new=true&id=" + id;
  
  
},







// ================================
// RENDER
// ================================


render(list=this.data){



const box =

document

.getElementById(

"plc-list"

);





box.innerHTML="";







list.forEach(item=>{



box.innerHTML += `



<div

class="
bg-white
p-5
rounded-xl
shadow
">


<div

class="
flex
justify-between
">




<h3

class="
font-bold
text-xl
">

${item.title}

</h3>



<span

class="
text-sm
text-gray-400
">

ID:${item.id}

</span>



</div>








<p

class="
text-gray-600
mt-3
">

${item.detail}

</p>







<p

class="
mt-3
">

Status:

${item.status}

</p>







<p

class="
text-sm
text-gray-400
mt-3
">

${item.date}

</p>








<div

class="
flex
gap-2
mt-4
">





<button

onclick="PLC.open(${item.id})"

class="
bg-blue-600
text-white
px-3
py-2
rounded-lg
">

Open

</button>







<button

onclick="PLC.delete(${item.id})"

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
// OPEN DETAIL
// ================================


open(id){



window.location.href =

"plc_detail.html?id="

+id;



},







// ================================
// DELETE
// ================================


// ================================
// DELETE
// ================================

delete(id) {
  
  
  id = Number(id);
  
  
  
  this.data = this.data.filter(
    
    x => Number(x.id) !== id
    
  );
  
  
  
  this.save();
  
  
  this.render();
  
  
  
},







// ================================
// SEARCH
// ================================


search(text){



const key =

text

.toLowerCase();







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



}



};








document.addEventListener(

"DOMContentLoaded",

()=>{


PLC.init();


});


function addPLC() {
  
  window.location.href =
    "PLC_detail.html?new=true" + id;
  
}
