// =====================================
// OPSPORTAL V2
// PLC DETAIL SYSTEM V3
// =====================================


const PLC_DETAIL = {


data: [],

currentID:null,





// ================================
// INIT
// ================================

init(){


if(!OPS.checkindex())
return;



this.currentID = this.getID();


this.load();



const params =
new URLSearchParams(window.location.search);



if(params.get("new")==="true"){

this.createDraft();

}



this.bind();

this.render();


},






// ================================
// GET ID
// ================================

getID(){


const params =
new URLSearchParams(
window.location.search
);


return Number(
params.get("id")
);


},







// ================================
// LOAD
// ================================

load(){


this.data =
OPS.load(
OPS.STORAGE.PLC
);



if(!Array.isArray(this.data))

this.data=[];


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
.getElementById("save-btn")
.onclick=()=>{

this.saveWork();

};





document
  .getElementById("back-btn")
  .onclick = () => {
    
    
    const item = this.getItem();
    
    
    
    if (item && item.title === "") {
      
      
      this.data =
        this.data.filter(
          x => x.id !== this.currentID
        );
      
      
    }
    
    
    
    window.location.href = "plc.html";
    
    
  };






document
.getElementById("image-input")
.onchange=(e)=>{

this.uploadImage(e);

};



},







// ================================
// GET ITEM
// ================================

getItem(){


return this.data.find(

x=>

Number(x.id)
===
Number(this.currentID)

);


},







// ================================
// RENDER
// ================================

render(){


const item =
this.getItem();



if(!item)
return;



document
.getElementById("work-id")
.innerHTML=item.id;



document
.getElementById("work-title")
.innerHTML=

item.title || "โปรดใส่ข้อมูล";



document
.getElementById("title")
.value=item.title || "";



document
.getElementById("detail")
.value=item.detail || "";



document
.getElementById("solution")
.value=item.solution || "";



document
.getElementById("status")
.value=item.status || "Open";



this.renderImages();



},







// ================================
// SAVE WORK
// ================================

saveWork(){



const item =
this.getItem();



if(!item)
return;



item.title =
document
.getElementById("title")
.value.trim();



item.detail =
document
.getElementById("detail")
.value.trim();



item.solution =
document
.getElementById("solution")
.value.trim();



item.status =
document
.getElementById("status")
.value;



item.date =
OPS.dateTime();



this.save();



window.location.href=
"plc.html";



},







// ================================
// IMAGE UPLOAD
// ================================

uploadImage(event){


const item =
this.getItem();



if(!item)
return;



if(!item.images)

item.images=[];



Array.from(event.target.files)

.forEach(file=>{


const reader =
new FileReader();



reader.onload=(e)=>{


item.images.push(
e.target.result
);


this.save();

this.renderImages();


};



reader.readAsDataURL(file);



});



},







// ================================
// RENDER IMAGE
// ================================

renderImages(){



const box =
document.getElementById("image-list");



if(!box)
return;



box.innerHTML="";



const item =
this.getItem();



if(
!item ||
!item.images
)

return;




item.images.forEach((img,index)=>{


box.innerHTML += `

<div class="relative">


<img

src="${img}"

class="
rounded-2xl
w-full
h-32
object-cover
">


<button

onclick="PLC_DETAIL.deleteImage(${index})"

class="
absolute
top-2
right-2
bg-red-500
text-white
rounded-full
w-8
h-8
">

×


</button>


</div>


`;



});



},







// ================================
// DELETE IMAGE
// ================================

deleteImage(index){


const item =
this.getItem();



if(!item.images)
return;



item.images.splice(
index,
1
);



this.save();


this.renderImages();



},







// ================================
// CREATE DRAFT
// ================================

createDraft() {
  
  
  if (this.getItem())
    return;
  
  
  
  this.data.push({
    
    id: this.currentID,
    
    title: "",
    
    detail: "",
    
    solution: "",
    
    status: "Open",
    
    images: [],
    
    date: ""
    
  });
  
  
}




};






document.addEventListener(

"DOMContentLoaded",

()=>{

PLC_DETAIL.init();

}

);
