let token=localStorage.token||"", me=localStorage.me||"";
const $=id=>document.getElementById(id);
function showLogin(){ $("form").innerHTML=`<input id="email" placeholder="Email"><input id="password" type="password" placeholder="Password"><button onclick="login()">Login</button>`}
function showRegister(){ $("form").innerHTML=`<input id="name" placeholder="Name"><input id="email" placeholder="Email"><input id="password" type="password" placeholder="Password"><button onclick="register()">Create account</button>`}
async function api(url,opt={}){opt.headers={...(opt.headers||{}), "Content-Type":"application/json", ...(token?{Authorization:"Bearer "+token}:{})};let r=await fetch(url,opt);let d=await r.json();if(!r.ok)throw Error(d.error||"Error");return d}
async function register(){try{await api("/api/register",{method:"POST",body:JSON.stringify({name:$("name").value,email:$("email").value,password:$("password").value})});alert("Registered! Please login.");showLogin()}catch(e){alert(e.message)}}
async function login(){try{let d=await api("/api/login",{method:"POST",body:JSON.stringify({email:$("email").value,password:$("password").value})});token=d.token;let p=JSON.parse(atob(token.split(".")[1]));me=p.name;localStorage.token=token;localStorage.me=me;start()}catch(e){alert(e.message)}}
function logout(){localStorage.clear();location.reload()}
function start(){$("auth").style.display="none";$("app").style.display="block";$("user").innerHTML=`Hi, ${me} <button onclick="logout()">Logout</button>`;load()}
async function load(){let ps=await api("/api/posts");$("posts").innerHTML=ps.map(p=>`<article class="post"><h2>${esc(p.title)}</h2><div class="muted">By ${esc(p.author)}</div><p>${esc(p.content)}</p>${p.author===me?`<button class="danger" onclick="del(${p.id})">Delete</button>`:""}<h3>Comments</h3>${p.comments.map(c=>`<div class="comment"><b>${esc(c.user)}</b>: ${esc(c.text)}</div>`).join("")}<input id="c${p.id}" placeholder="Write a comment"><button onclick="comment(${p.id})">Comment</button></article>`).join("")||"<div class='card'>No posts yet. Create the first one!</div>"}
async function createPost(){try{await api("/api/posts",{method:"POST",body:JSON.stringify({title:$("title").value,content:$("content").value})});$("title").value="";$("content").value="";load()}catch(e){alert(e.message)}}
async function comment(id){try{let x=$("c"+id);await api("/api/posts/"+id+"/comments",{method:"POST",body:JSON.stringify({text:x.value})});x.value="";load()}catch(e){alert(e.message)}}
async function del(id){if(confirm("Delete this post?")){await api("/api/posts/"+id,{method:"DELETE"});load()}}
function esc(s){return String(s).replace(/[&<>"']/g,m=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#039;"}[m]))}
if(token)start();else showLogin();