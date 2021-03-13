/* 
 * To change this license header, choose License Headers in Project Properties.
 * To change this template file, choose Tools | Templates
 * and open the template in the editor.
 */

//Modules used in all Objects
http = require('http');
fs = require('fs');
sokio = require('socket.io');

class Server {
    mime={
        "html":"text/html",
        "js":"text/javascript",
        "css":"text/css",
        "png":"image/png",
        "ico":"image/x-icon",
        "txt":"text/plain"
    }
    constructor(){
        this.port=process.env.PORT || 8000;
        this.onHttpReq=(req, res) => {
            var url="public"+req.url;
            
            if(url=="public/")url+="index.html";
            if(fs.existsSync(url)){
                res.writeHead(200, { 'content-type': this.mime[url.substring(url.lastIndexOf('.')+1,url.length)] });
                fs.createReadStream(url).pipe(res);
            }
            else res.writeHead(404);
        };
        this.server = http.createServer(this.onHttpReq);
        this.io = sokio(this.server);
        this.on = this.io.on;
    }
    start(){
        console.log("server running at port "+this.port);
        this.server.listen(this.port);
    }
}
class Player {
    constructor(id,socket){
        this.id=id;
        this.onPlayCard=(card)=>{console.log("played ",card);};
        this.onDisconnect = ()=>{};
        this.onSetMode = (mode)=>{};
        this.send =(name,data)=>{this.socket.emit(name,data);};
        this.setSocket=(socket)=>{
            this.socket=socket;
            this.connected=true;
            socket.on("disconnect",()=>{
                this.connected=false;
                this.onDisconnect();
            });
            socket.on("playcard",this.onPlayCard);
            socket.on("setmode",this.onSetMode);
        };
        
        setSocket(socket);
    }
}
class Game{
    constructor(p1,p2,ActivePlayers){
        this.turn=false;
        this.players={
            false:p1,
            true:p2
        };
        
        function setPlayer(p,q){
            ActivePlayers[p.id]=p;
            p.onPlayCard=(card)=>{
                p.played=card;
                p.send("played");
                if(q.played){
                     q.send("playedCard",card);
                }
            };
            p.onDisconnect=()=>{
                if(!q.connected){
                    delete ActivePlayers[p.id];
                    delete ActivePlayers[q.id];
                };
            }
        }
        
        setPlayer(p1,p2);
        setPlayer(p2,p1);
    }
}

module.exports = {
   Server:Server,
   Player:Player,
   Game:Game
};