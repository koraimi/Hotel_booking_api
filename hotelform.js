const images = document.getElementById("images")
    let inputs;
    const btn = document.getElementById("adds")
    let n=0;
    btn.addEventListener("click", ()=> {
      let img = document.createElement('img');
      let inp = document.createElement("input")
      inp.setAttribute("class", "inp")
      inp.setAttribute("name","photo"+n)
      inp.setAttribute("required","")
      let b = document.createElement("button")
      b.setAttribute("class", "button")
      img.setAttribute("class", "img")
      b.textContent = "save"
      inp.type = "file"
      images.appendChild(inp)
      images.appendChild(img)
      images.appendChild(b)
      let atr = inp.getAttribute("class")
      console.log("att is"+atr)
      n++

      // img.width="200px"
      // img.height="100"
      //img.backGrowndColor="black"
      //img.src="download(7).jpeg"

      //images.appendChild(img)
      console.log("pressed")

      // let src="download (7).jpeg"

      inputs = document.getElementsByClassName(inp.getAttribute("class"))

      if (document.getElementsByClassName("button") !== "undefined") {
        let svbtn = document.getElementsByClassName("button")

        for (let i = 0; i < svbtn.length; i++) {
          svbtn[i].addEventListener("click", ()=> {
            console.log("somehow works")
            inputs[i].setAttribute("name","photo"+i)
            let src = inputs[i].files[0];
            let url = URL.createObjectURL(src)
            document.getElementsByClassName("img")[i].setAttribute("src", url)
            console.log("savebtn")


          });
        }
      }

    });
   // let formdata=document.getElementById('hotelinfo')
    let data;
   const submit= document.getElementById("hotelinfo");
   submit.addEventListener('submit',async e=>{
     console.log(data)
     e.preventDefault()
     console.log("hshddhdhdh")
     data=Object.fromEntries(new FormData(submit).entries());
     console.log("hhh")
     console.log(data);
   })

let upload = document.getElementById("upload");

upload.addEventListener("click", async () => {
console.log("uploading....")
  const formData = new FormData();

  // Add hotel text fields
  Object.entries(data).forEach(([key, value]) => formData.append(key, value));

  // Add images
  let imgs = document.getElementsByClassName("inp");
  for (let i = 0; i < imgs.length; i++) {
    if (imgs[i].files[0]) {
      formData.append("images", imgs[i].files[0]); // multiple files
    }
  }
console.log("uploading....")
  // send everything at once
  let token=localStorage.getItem('token');
 // token=''
  const res = await fetch("http://127.0.0.1:3000/upload", {
    method: "POST",
    headers:{
      'Authorization':'Bearer '+token
    },
    
    body: formData  // important: NO content-type header!
  });
  console.log(formData)
  console.log(token)

  let msg = await res.text();
  alert(msg);
console.log("uploading.... done!")
const req=await fetch('http://127.0.0.1:3000/adminpanel')

let response=await req.json();
localStorage.setItem("adminname",response.username)
alert(response)
window.location.href=response.url;
});