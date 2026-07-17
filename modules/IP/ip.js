// =====================================
// OPSPORTAL V2
// IP MANAGEMENT SYSTEM V2
// =====================================


const IP = {


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


this.updateCounter();



},






// ================================
// LOAD
// ================================

load(){


this.data =

OPS.load(

OPS.STORAGE.IP

);



if(!Array.isArray(this.data))

this.data=[];



},






// ================================
// SAVE
// ================================

save(){


OPS.save(

OPS.STORAGE.IP,

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


this.search(

e.target.value

);


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

.getElementById("ip")

.value="";


document

.getElementById("name")

.value="";


document

.getElementById("type")

.value="QC";


document

.getElementById("purpose")

.value="";


this.editID=null;


},






// ================================
// SAVE ITEM
// ================================

saveItem(){



const ip =

document

.getElementById("ip")

.value

.trim();



const name =

document

.getElementById("name")

.value

.trim();



const type =

document

.getElementById("type")

.value;



const purpose =

document

.getElementById("purpose")

.value

.trim();





if(!ip)

return;






// EDIT

if(this.editID){



const item =

this.data.find(

x=>

Number(x.id)===Number(this.editID)

);



if(item){


item.ip=ip;

item.name=name;

item.type=type;

item.purpose=purpose;


}



}







// ADD

else{


this.data.unshift({


id:OPS.createID(),


ip,


name,


type,


purpose,


date:OPS.dateTime()



});



}






this.save();


this.render();


this.updateCounter();


this.closeModal();



},






// ================================
// RENDER
// ================================

render(list = this.data) {
  
  const box = document.getElementById("ip-list");
  
  box.innerHTML = "";
  
  
  list.forEach(item => {
    
    
    box.innerHTML += `


<div class="ops-card">


<div class="
flex
justify-between
items-start
gap-4
">


<div>

<h3 class="
font-bold
text-xl
text-white
">

${item.ip}

</h3>


<p class="
mt-2
text-slate-300
">

${item.name}

</p>


</div>



<span class="
text-xs
text-cyan-300
">

ID:${item.id}

</span>


</div>




<div class="
mt-4
flex
items-center
gap-3
">


<span class="
px-4
py-1
rounded-full
bg-cyan-400/20
text-cyan-200
border
border-cyan-300/30
">

${item.type}

</span>


</div>





<p class="
mt-4
text-slate-300
">

${item.purpose || "No description"}

</p>





<p class="
text-sm
text-slate-400
mt-4
">

${item.date}

</p>






<div class="
flex
gap-3
mt-6
">


<button

onclick="IP.edit(${item.id})"

class="
px-5
py-2
rounded-full
bg-yellow-400/20
text-yellow-300
border
border-yellow-300/30
hover:scale-105
transition
">

Edit

</button>




<button

onclick="IP.delete(${item.id})"

class="
px-5
py-2
rounded-full
bg-red-500/20
text-red-300
border
border-red-300/30
hover:scale-105
transition
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

.getElementById("ip")

.value=item.ip;



document

.getElementById("name")

.value=item.name;



document

.getElementById("type")

.value=item.type;



document

.getElementById("purpose")

.value=item.purpose;




this.openModal();



},






// ================================
// DELETE
// ================================

delete(id) {
  
  
  id = Number(id);
  
  
  console.log("DELETE IP:", id);
  
  console.log("BEFORE:", this.data);
  
  

  
  
  
  
  this.data =
    
    this.data.filter(
      
      x =>
      
      Number(x.id) !== id
      
    );
  
  
  
  console.log("AFTER:", this.data);
  
  
  
  this.save();
  
  
  this.render();
  
  
  this.updateCounter();
  
  
  
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


x.ip

.toLowerCase()

.includes(key)



||



x.name

.toLowerCase()

.includes(key)



||



x.purpose

.toLowerCase()

.includes(key)



);



this.render(result);



},






// ================================
// COUNTER
// ================================

updateCounter(){



document

.getElementById("total-ip")

.innerHTML=this.data.length;



document

.getElementById("total-qc")

.innerHTML=

this.data.filter(

x=>

x.type==="QC"

).length;



document

.getElementById("total-rtg")

.innerHTML=

this.data.filter(

x=>

x.type==="RTG"

).length;



}



};






document.addEventListener(

"DOMContentLoaded",

()=>{


IP.init();


});
