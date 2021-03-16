/* 
 * To change this license header, choose License Headers in Project Properties.
 * To change this template file, choose Tools | Templates
 * and open the template in the editor.
 */



const objects=require("./objects");
const server =new objects.Server();

const rooms={};
const freePlayers=[];

//basic match setup
function makePlayerSocket(socket,other,match){
    socket.match=match;//set match to accase some values
    //send event
    socket.emit("onOtherPlayerJoin"); //inform client that other player is found
    
    //event listners
//    socket.on("playerJoin",()=>match.getOther(socket).emit("onOtherPlayerJoin"));
    socket.on("playerReady",(cards)=>{
        socket.isKnight=cards===null;
        socket.ready = true;
        other.emit("onOtherPlayerReady",socket.isKnight);
        if(other.ready)match.setupVar();
    });
    socket.on("playerPlayed",(ci)=>{
        socket.playedCard=ci;
        socket.played=true;
        socket.revealed=socket.reveal||other.played;
        other.emit("onOtherPlayerPlay",socket.revealed ? ci:3);
        if(other.played){
            if(!other.revealed)socket.emit("onOtherPlayerReveal",other.playedCard);
            socket.played=false;
            other.played=false;
            socket.revealed=false;
            other.revealed=false; //reset everything
        }
    });
    socket.on("playerQuite",()=>match.quite());
    socket.on("playerRematch",()=>{other.emit("onRematch"); socket.ready=false;});
    
}
function resetSocket(socket){
    //delet all things that defined
    if(socket.match!==undefined)delete socket.match;
    if(socket.isKnight!==undefined)delete socket.isKnight;
    if(socket.ready!==undefined)delete socket.ready;
    if(socket.playedCard!==undefined)delete socket.playedCard;
    if(socket.played!==undefined)delete socket.played;
    if(socket.revealed!==undefined)delete socket.revealed;
    
    //stop listners
    socket.removeAllListeners("playerReady");
    socket.removeAllListeners("playerPlayed");
    socket.removeAllListeners("playerQuite");
    socket.removeAllListeners("playerRematch");
}
class match{
    socks={}
    constructor(sock1,sock2){
        this.socks[false]=sock1;
        this.socks[true]=sock2;
        
        makePlayerSocket(sock1,sock2,this);//setup first socket
        makePlayerSocket(sock2,sock1,this);//setup second socket
    }
    getOther(current){return this.socks[this.socks[true]!==current];}// simple but complex
    setupVar(){
        this.socks[true].reveal=false;
        this.socks[false].reveal=false;
        if(this.socks[true].isKnight!==this.socks[false].isKnight){
            if(this.socks[true].isKnight)this.socks[true].reveal=true;
            else this.socks[false].reveal=true;
        }
    }
    quite(){
        if(this.socks[false].connected)this.socks[false].emit("onOtherPlayerQuite");
        if(this.socks[true].connected)this.socks[true].emit("onOtherPlayerQuite");
        resetSocket(this.socks[false]);
        resetSocket(this.socks[true]);
    }
}

server.io.on("connection",function(sock){
    //new scocket is joined
    sock.on("playerJoin",()=>{
        if(freePlayers.includes(sock)||sock.match)return; //error preventation
            if(freePlayers.length>0){
                new match(freePlayers.shift(),sock);
            }else freePlayers.push(sock);
    });//quicj match setup
    sock.on("roomreq",(name,create)=>{
        if(create){
            if(rooms[name]===undefined){
                sock.match=true;
                sock.emit("roomreq",true);
                rooms[name]=sock;
                sock.room_name=name;
                return;
            }
        }else {
            if(rooms[name]!==undefined){
                delete rooms[name].room_name;
                new match(rooms[name],sock);
                sock.emit("roomreq",true);
                delete rooms[name];
                return;
            }
        }
        sock.emit("roomreq",false);
    });
    sock.on("disconnect",()=>{
        if(sock.room_name){
            delete rooms[sock.room_name];
            delete sock.room_name;
        }
        if(sock.match)sock.match.quite();
        let i = freePlayers.indexOf(sock);
        if(i>=0)freePlayers.splice(i,0);
    });
});
server.start();
