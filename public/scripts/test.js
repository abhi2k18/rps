/* 
 * To change this license header, choose License Headers in Project Properties.
 * To change this template file, choose Tools | Templates
 * and open the template in the editor.
 */
const data={
    id:"ghdgri-osf_aaifh",
    name:"Bobby"
};
const play_req=_("play_req");

const row =$("div");
const id=$("p");
const lable=$("p");
const accept=$("button");
const remove=$("button");

row.classList.add("freq");
row.appendChild(id);
row.appendChild(lable);
row.appendChild(accept);
row.appendChild(remove);

id.innerHTML    ="ID   : "+data.id;
lable.innerHTML ="Name : "+data.name;
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
