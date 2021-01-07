/* 
 * To change this license header, choose License Headers in Project Properties.
 * To change this template file, choose Tools | Templates
 * and open the template in the editor.
 */

const header = _("header");
const status = _("status");
const users  = _("users");

const globlal_chat=_("globlal_chat");
const gchats = _("gchats");
const ginput = _("ginput");

const container = _("container");

const player_name =_("player_name");
const play_req = _("play_req");

const socket = io.connect('/');

function gsend(){
    var msg= String(ginput.value).trim();
    if(msg.length>0)socket.emit('gsend',msg);
    ginput.value="";
}

function rename(){
    var msg= String(player_name.value).trim();
    if(msg.length>0)socket.emit('rename',msg);
}

const preq = [];
function sendPlayReq(sid){
    if(!preq.includes(sid)) preq.push(sid);
    socket.emit("playReq",sid);
}

function startGame(player_no){
    console.log("start Game");
    globlal_chat.style.display="none";
    load("game.js").then(()=>{
        game(socket,_("container"),player_no);
    });;
}


socket.on("connect",()=>{
    status.innerHTML="connected";
    header.style.backgroundColor="green";
    player_name.value=socket.id;
});
socket.on("disconnect",()=>{
    status.innerHTML="status : connecting";
    header.style.backgroundColor="grey";
});

socket.on("update",(data)=>{
    users.innerHTML="user count : "+data.count;
    if(data.closed){
        //remove from pending req
        var i=preq.indexOf(data.closed);
        if(i!=-1)preq.splice(i,1);
    }
});

const bgColors={
    true:"rgb(243,255,196)",
    false:"rgb(255,236,196)"
};
var ci=false;

socket.on("gmsg",(data)=>{
    var mobj=$("line");
    mobj.style.paddingLeft="5%";
    mobj.sid=data.id;
    if(data.id==socket.id){
        mobj.style.paddingLeft="20%";
    }else {
        if((!gchats.lastChild)||(gchats.lastChild.sid!=mobj.sid)){
            ci=!ci;
            var name=$("h2");
            name.sid=data.id;
            name.style.padding="5px";
            name.style.paddingLeft="2%";
            name.style.backgroundColor=bgColors[ci];
            name.innerHTML=data.name;
            name.onclick=function(){
                if(confirm("do you want to send a friend req to "+name.innerHTML))
                    sendPlayReq(mobj.sid);
            };
            gchats.appendChild(name);
        }
        mobj.style.backgroundColor=bgColors[ci];
        mobj.style.paddingRight="10%";
    }
    mobj.innerHTML=data.msg;
    gchats.appendChild(mobj);
});

socket.on("rename",(data)=>{
    //TODO: global chat names update
    var names =gchats.getElementsByTagName("h2");
    for(i=0;i<names.length;i++)
        if(names[i].sid==data.id)names[i].innerHTML=data.name;
    
});
socket.on("playReq",(data)=>{
    const row =$("div");
    const id=$("line");
    const lable=$("lable");
    const accept=$("button");
    const remove=$("button");
    
    row.appendChild(id);
    row.appendChild(lable);
    row.appendChild(accept);
    row.appendChild(remove);
    
    id.innerHTML=data.id;
    lable.innerHTML=data.name;
    lable.width="50%";
    accept.innerHTML="accept";
    accept.onclick=function(){
        startGame(1);
        row.remove();
        socket.emit("accept",data.id);
    };
    remove.innerHTML="remove";
    remove.onclick=function(){
        row.remove();
    };
    play_req.appendChild(row);
});
socket.on("accept",(data)=>{
    var i=preq.indexOf(data.id);
    if(i!=-1){
        preq.splice(i,1);
        startGame(0);
    }
});