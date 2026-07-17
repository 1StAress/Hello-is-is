// =====================================
// OPS PORTAL UI FRAMEWORK V1
// =====================================

window.OPS = window.OPS || {};

OPS.ui = {};


// =====================================
// CARD
// =====================================

OPS.ui.card = function({
  
  title = "",
  
  subtitle = "",
  
  content = "",
  
  footer = "",
  
  icon = "",
  
  onclick = ""
  
} = {}) {
  
  return `

<div

class="ops-card ops-slide"

${onclick ? `onclick="${onclick}"` : ""}

>

${icon ? `

<div class="text-4xl mb-3">

${icon}

</div>

` : ""}

<h3

class="ops-title"

style="font-size:1.3rem;"

>

${title}

</h3>

${subtitle ?

`

<p class="ops-text-light mt-1">

${subtitle}

</p>

`

:

""}

${content ?

`

<div class="mt-3">

${content}

</div>

`

:

""}

${footer ?

`

<div class="ops-divider"></div>

${footer}

`

:

""}

</div>

`;
  
};


// =====================================
// EMPTY
// =====================================

OPS.ui.empty = function(
  
  message = "No Data"
  
) {
  
  return `

<div class="ops-empty">

<div class="ops-empty-icon">

📂

</div>

<h3>

${message}

</h3>

</div>

`;
  
};


// =====================================
// LOADING
// =====================================

OPS.ui.loading = function() {
  
  return `

<div class="ops-loading">

<div class="ops-spinner"></div>

</div>

`;
  
};



// =====================================
// BADGE
// =====================================

OPS.ui.badge = function(
  
  text = "",
  
  type = "primary"
  
) {
  
  return `

<span

class="ops-badge ops-badge-${type}"

>

${text}

</span>

`;
  
};


// =====================================
// STATUS
// =====================================

OPS.ui.status = function(
  
  text = "",
  
  type = "info"
  
) {
  
  return `

<div class="ops-status">

<span

class="ops-dot ops-dot-${type}"

></span>

<span>

${text}

</span>

</div>

`;
  
};


// =====================================
// BUTTON
// =====================================

OPS.ui.button = function({
  
  text = "Button",
  
  type = "primary",
  
  id = "",
  
  className = ""
  
} = {}) {
  
  return `

<button

${id ? `id="${id}"` : ""}

class="

ops-btn

ops-btn-${type}

${className}

"

>

${text}

</button>

`;
  
};


// =====================================
// ICON BUTTON
// =====================================

OPS.ui.iconButton = function({
  
  icon = "✏️",
  
  type = "outline",
  
  className = ""
  
} = {}) {
  
  return `

<button

class="

ops-icon-btn

ops-btn-${type}

${className}

"

>

${icon}

</button>

`;
  
};

// =====================================
// MODAL
// =====================================

OPS.ui.modal = function({

id = "modal",

title = "Modal",

content = "",

footer = ""

} = {}){


return `


<div

id="${id}"

class="ops-modal hidden"

>


<div

class="ops-modal-box ops-scale"

>


<div

class="ops-flex-between mb-3"

>


<h2

class="ops-title"

style="font-size:1.5rem"

>

${title}

</h2>


<button

class="ops-icon-btn modal-close"

>

✕

</button>


</div>



<div>

${content}

</div>



${footer ?

`

<div class="ops-divider"></div>

<div>

${footer}

</div>

`

:

""}



</div>


</div>


`;

};





// =====================================
// SEARCH BOX
// =====================================

OPS.ui.search = function({

id = "search",

placeholder = "Search..."

} = {}){


return `


<input


id="${id}"


class="ops-search"


placeholder="${placeholder}"


>


`;

};





// =====================================
// SECTION
// =====================================

OPS.ui.section = function({

title = "",

subtitle = "",

content = ""

} = {}){


return `


<section

class="ops-section"

>


<div class="mb-5">


<h2

class="ops-title"

style="font-size:1.8rem"

>

${title}

</h2>



${subtitle ?

`

<p class="ops-text-light">

${subtitle}

</p>

`

:

""}


</div>



${content}


</section>


`;

};





// =====================================
// STAT CARD
// =====================================

OPS.ui.statCard = function({

icon = "",

title = "",

value = 0,

description = ""

} = {}){


return `


<div

class="ops-card ops-slide"

>


<div

class="ops-flex-between"

>


<div>


<p

class="ops-text-light"

>

${title}

</p>



<h3

style="font-size:2.2rem"

class="font-bold mt-2"

>

${value}

</h3>


</div>



<div

style="font-size:2.5rem"

>

${icon}

</div>



</div>



${description ?

`

<p

class="ops-text-light mt-3"

>

${description}

</p>

`

:

""}



</div>


`;

};

// =====================================
// LIST / WORK CARD
// =====================================

OPS.ui.listCard = function({

id = "",

title = "",

detail = "",

status = "",

date = "",

actions = ""

} = {}){


return `


<div

${id ? `data-id="${id}"` : ""}

class="ops-card ops-slide"

>


<div

class="ops-flex-between"

>


<div>


<h3

class="font-bold text-xl"

>

${title}

</h3>



<p

class="ops-text-light mt-2"

>

${detail}

</p>


</div>



${status ?

`

<div>

${status}

</div>

`

:

""}


</div>




<div

class="ops-divider"

></div>




<div

class="ops-flex-between"

>


<p

class="ops-text-light"

>

${date}

</p>


<div>

${actions}

</div>


</div>



</div>


`;

};





// =====================================
// IMAGE CARD
// =====================================

OPS.ui.imageCard = function({

image = "",

title = "",

detail = ""

} = {}){


return `


<div

class="ops-card ops-slide"

>


${image ?

`

<img

src="${image}"

class="

w-full

h-48

object-cover

rounded-xl

mb-4

"

>

`

:

`

<div

class="ops-empty"

>

No Image

</div>

`

}



<h3

class="font-bold text-xl"

>

${title}

</h3>



<p

class="ops-text-light mt-2"

>

${detail}

</p>


</div>


`;

};





// =====================================
// ACTION MENU
// =====================================

OPS.ui.actions = function(id){


return `


<div

class="ops-flex"

style="gap:8px"

>


<button

class="ops-btn ops-btn-primary edit-btn"

data-id="${id}"

>

Edit

</button>



<button

class="ops-btn ops-btn-danger delete-btn"

data-id="${id}"

>

Delete

</button>


</div>


`;

};





// =====================================
// CONFIRM
// =====================================

OPS.ui.confirm = function(message="Are you sure?"){


return window.confirm(message);


};





// =====================================
// TOAST
// =====================================

OPS.ui.toast = function(

message,

type="success"

){



const toast = document.createElement("div");


toast.className =

`

fixed

bottom-6

right-6

px-5

py-3

rounded-xl

shadow-xl

text-white

ops-slide

`;



toast.style.background =

type==="success"

?

"#16a34a"

:

"#dc2626";



toast.innerHTML = message;



document.body.appendChild(toast);



setTimeout(()=>{


toast.remove();


},3000);



};

// =====================================
// PAGINATION
// =====================================

OPS.ui.pagination = function({

current = 1,

total = 1,

id = "pagination"

} = {}){


return `


<div

id="${id}"

class="ops-flex-center"

style="gap:10px"

>


<button

class="ops-btn ops-btn-outline page-prev"

>

◀

</button>



<span

class="ops-badge ops-badge-primary"

>

${current} / ${total}

</span>



<button

class="ops-btn ops-btn-outline page-next"

>

▶

</button>


</div>


`;

};





// =====================================
// FILTER
// =====================================

OPS.ui.filter = function({

options = []

} = {}){


return `


<select

class="ops-select"

id="filter-select"

>


<option value="">

All

</option>


${options.map(x=>`

<option value="${x}">

${x}

</option>

`).join("")}


</select>


`;

};





// =====================================
// DROPDOWN
// =====================================

OPS.ui.dropdown = function({

id="dropdown",

title="Menu",

items=[]

}={})


{


return `


<div

style="position:relative"

>


<button

class="ops-btn ops-btn-outline"

id="${id}-btn"

>

${title}

</button>



<div

id="${id}"

class="ops-card ops-hidden"

style="

position:absolute;

right:0;

top:50px;

z-index:50;

min-width:180px;

"

>


${items.map(item=>`

<div

class="p-2 hover:bg-gray-100 cursor-pointer"

data-value="${item.value}"

>

${item.text}

</div>

`).join("")}


</div>


</div>


`;

};





// =====================================
// TABS
//=====================================

OPS.ui.tabs = function({

tabs=[],

active=""

}={})


{


return `


<div

class="ops-flex"

style="gap:10px"

>


${tabs.map(tab=>`


<button

class="ops-btn

${tab===active

?

"ops-btn-primary"

:

"ops-btn-outline"

}

tab-btn"

data-tab="${tab}"

>


${tab}


</button>


`).join("")}


</div>


`;

};





// =====================================
// PROGRESS BAR
// =====================================

OPS.ui.progress = function(

value=0

){


return `


<div

style="

width:100%;

height:10px;

background:#e2e8f0;

border-radius:20px;

overflow:hidden;

"

>


<div

style="

width:${value}%;

height:100%;

background:#2563eb;

transition:.3s;

"

></div>


</div>


`;

};





// =====================================
// IMAGE PREVIEW
// =====================================

OPS.ui.imagePreview = function(

src=""

){


if(!src)

return "";


return `


<img

src="${src}"

class="

w-full

h-48

object-cover

rounded-xl

ops-scale

"

>


`;

};





// =====================================
// FILE INFO
// =====================================

OPS.ui.fileInfo = function(file){


if(!file)

return "";


return `


<div

class="ops-card"

>


<p class="font-bold">

${file.name}

</p>


<p class="ops-text-light">

${Math.round(file.size/1024)}

 KB

</p>


</div>


`;

};