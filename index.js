// =====================================
// OPSPORTAL V2
// LOGIN SYSTEM
// =====================================



const Index = {



username:
"admin",



password:
"1234",






init(){



this.loadRemember();



this.bind();



},







bind(){



document

.getElementById("index-btn")

.onclick=()=>{


this.index();



};



},







index(){



const user =

document

.getElementById("username")

.value;





const pass =

document

.getElementById("password")

.value;







if(

user===this.username

&&

pass===this.password

){






sessionStorage.setItem(

"index",

"true"

);







sessionStorage.setItem(

"indexTime",

Date.now()

);







if(

document

.getElementById("remember")

.checked

){



localStorage.setItem(

"rememberUser",

user

);



}







window.location.href=

"dashboard.html";







}

else{



document

.getElementById("message")

.innerHTML=

"Username หรือ Password ไม่ถูกต้อง";



}



},







loadRemember(){



const user =

localStorage.getItem(

"rememberUser"

);





if(user){



document

.getElementById("username")

.value=user;



document

.getElementById("remember")

.checked=true;



}



}



};






document.addEventListener(

"DOMContentLoaded",

()=>{


Index.init();


});

function openAdmin() {
  
  document
    .getElementById("admin-popup")
    .style.display = "flex";
  
  
  createQR();
  
}



function closeAdmin() {
  
  document
    .getElementById("admin-popup")
    .style.display = "none";
  
}



function createQR() {
  
  const text =
    "https://instagram.com/ntc_ss._.p";
  
  
  const box =
    document.getElementById(
      "qrPopup"
    );
  
  
  box.innerHTML = "";
  
  
  new QRCode(
    box,
    {
      text: text,
      width: 250,
      height: 250,
      colorDark: "#000000",
      colorLight: "#ffffff",
      correctLevel: QRCode.CorrectLevel.H
    }
  );
  
}
