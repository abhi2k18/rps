/* 
 * To change this license header, choose License Headers in Project Properties.
 * To change this template file, choose Tools | Templates
 * and open the template in the editor.
 */


//http server
const http = require('http');
const fs = require('fs');
const mime={
    "html":"text/html",
    "js":"text/javascript",
    "css":"text/css",
    "png":"image/png",
    "ico":"image/x-icon"
};
const server = http.createServer((req, res) => {
  var url="public"+req.url;
  
  if(url=="public/")url+="index.html";
  if(fs.existsSync(url)){
      res.writeHead(200, { 'content-type': mime[url.substring(url.lastIndexOf('.')+1,url.length)] });
      fs.createReadStream(url).pipe(res);
  }
  else res.writeHead(404);
});

//socket io code
const io = require('socket.io')(server);
var scount=0;
io.on("connection",function(socket){
    scount++;
    var name=socket.id;
    var card_no;
    socket.mate=null;
    
    const played=(no)=>{
        if(!(no>0&&no<4))return;
        socket.card_no=no;
        socket.mate.emit("played");
        
        if(socket.card_no&&socket.mate.card_no){
            socket.mate.emit("reveal",socket.card_no);
            socket.emit("reveal",socket.mate.card_no);
        }
    };
    const ready =()=>{
        socket.ready=true;
        if(!socket.mate.ready)return;
        socket.mate.emit("ready");
        socket.emit("ready");
        
        //reset everythings
        socket.ready=false;
        socket.mate.ready=false;
        socket.mate.card_no=null;
        socket.card_no=null;
    };
    
    sendGlobal("update",{count:scount});
    socket.on('disconnect', function() {
        scount--;
        sendGlobal("update",{closed:socket.id,count:scount});
    });
    
    //message sendind/receiving
    socket.on("gsend",(data)=>{
        if(!data)return;
        sendGlobal("gmsg",{id:socket.id,name:name,msg:data});
    });
    socket.on("rsend",(data)=>{
        if(!data)return;
        if(room)io.to(room)
                .emit("rmsg",{id:socket.id,name:name,msg:data});
    });
    socket.on("psend",(data)=>{
        if(!data)return;
        if(_(data.to))
            _(data.to).emit("pmsg",{id:socket.id,name:name,msg:data.msg});
    }); 
    
    //extra functions
    socket.on("rename",(data)=>{
        if((!data)||data===name)return;
        name=data;
        sendGlobal("rename",{id:socket.id,name:name});
    });
    socket.on("playReq",(data)=>{
        if(!data)return;
        if(_(data))
            _(data).emit("playReq",{id:socket.id,name:name});
    });
    socket.on("accept",(data)=>{
        if(!data)return;
        socket.mate=_(data);
        if(socket.mate){
            socket.mate.mate=socket;
            socket.mate.emit("accept",{id:socket.id,name:name});
        }
    });
    socket.on("play_with_ai",()=>{
        console.log("playin with ai");
        
        socket.removeListener("played",played);
        socket.removeListener("ready",ready);
        
        socket.on("played",(no)=>{
            if(!(no>0&&no<4))return;
            socket.card_no=no;
            socket.emit("played");
            socket.emit("reveal",1+Math.floor(3*Math.random()));
        });
        socket.on("ready",()=>{
            socket.emit("ready");
        });
    });
    //start game;
    socket.on("played",played);
    socket.on("ready",ready);
});

function _(id){
    return io.of('/').sockets.get(id);
}
function sendGlobal(event,data){
    io.sockets.emit(event,data);
}

//starting  server for http and socket io clients
server.listen(process.env.PORT || 8000);

//to get differnt ips avilable
//const { networkInterfaces } = require('os');
//
//const nets = networkInterfaces();
//const results = Object.create(null); // Or just '{}', an empty object
//
//for (const name of Object.keys(nets)) {
//    for (const net of nets[name]) {
//        // Skip over non-IPv4 and internal (i.e. 127.0.0.1) addresses
//        if (net.family === 'IPv4' && !net.internal) {
//            if (!results[name]) {
//                results[name] = [];
//            }
//            results[name].push(net.address);
//        }
//    }
//}
//
//console.log(results);