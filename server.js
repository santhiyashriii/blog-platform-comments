const express = require("express");
const cors = require("cors");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const fs = require("fs");

const app = express();
const PORT = process.env.PORT || 3000;
const SECRET = process.env.JWT_SECRET || "blog-secret-2026";
const DB = "database.json";

app.use(cors());
app.use(express.json());
app.use(express.static("public"));

if (!fs.existsSync(DB)) fs.writeFileSync(DB, JSON.stringify({users:[],posts:[],comments:[]}, null, 2));
const readDB = () => JSON.parse(fs.readFileSync(DB));
const saveDB = d => fs.writeFileSync(DB, JSON.stringify(d, null, 2));

function auth(req,res,next){
  try {
    const token = (req.headers.authorization || "").replace("Bearer ","");
    req.user = jwt.verify(token, SECRET);
    next();
  } catch { res.status(401).json({error:"Authentication required"}); }
}

app.post("/api/register", async (req,res)=>{
  const {name,email,password} = req.body;
  if(!name || !email || !password) return res.status(400).json({error:"All fields required"});
  const db=readDB();
  if(db.users.some(u=>u.email===email)) return res.status(409).json({error:"Email already registered"});
  const user={id:Date.now(),name,email,password:await bcrypt.hash(password,10)};
  db.users.push(user); saveDB(db);
  res.json({message:"Registration successful"});
});

app.post("/api/login", async (req,res)=>{
  const {email,password}=req.body, db=readDB();
  const user=db.users.find(u=>u.email===email);
  if(!user || !(await bcrypt.compare(password,user.password))) return res.status(401).json({error:"Invalid login"});
  res.json({token:jwt.sign({id:user.id,name:user.name,email:user.email},SECRET,{expiresIn:"2h"})});
});

app.get("/api/posts",(req,res)=>res.json(readDB().posts.map(p=>({...p,comments:readDB().comments.filter(c=>c.postId===p.id)}))));

app.post("/api/posts",auth,(req,res)=>{
  const {title,content}=req.body;
  if(!title||!content) return res.status(400).json({error:"Title and content required"});
  const db=readDB(), post={id:Date.now(),title,content,authorId:req.user.id,author:req.user.name,createdAt:new Date().toISOString()};
  db.posts.unshift(post); saveDB(db); res.json(post);
});

app.put("/api/posts/:id",auth,(req,res)=>{
  const db=readDB(), p=db.posts.find(x=>x.id==req.params.id);
  if(!p) return res.status(404).json({error:"Post not found"});
  if(p.authorId!==req.user.id) return res.status(403).json({error:"Not your post"});
  p.title=req.body.title||p.title; p.content=req.body.content||p.content; saveDB(db); res.json(p);
});

app.delete("/api/posts/:id",auth,(req,res)=>{
  const db=readDB(), p=db.posts.find(x=>x.id==req.params.id);
  if(!p) return res.status(404).json({error:"Post not found"});
  if(p.authorId!==req.user.id) return res.status(403).json({error:"Not your post"});
  db.posts=db.posts.filter(x=>x.id!=req.params.id);
  db.comments=db.comments.filter(x=>x.postId!=req.params.id);
  saveDB(db); res.json({message:"Post deleted"});
});

app.post("/api/posts/:id/comments",auth,(req,res)=>{
  if(!req.body.text) return res.status(400).json({error:"Comment required"});
  const db=readDB();
  if(!db.posts.some(p=>p.id==req.params.id)) return res.status(404).json({error:"Post not found"});
  const c={id:Date.now(),postId:Number(req.params.id),userId:req.user.id,user:req.user.name,text:req.body.text,createdAt:new Date().toISOString()};
  db.comments.push(c); saveDB(db); res.json(c);
});

app.get("*",(req,res)=>res.sendFile(__dirname+"/public/index.html"));
app.listen(PORT,()=>console.log(`Blog app running on http://localhost:${PORT}`));