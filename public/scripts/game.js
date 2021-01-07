/* 
 * To change this license header, choose License Headers in Project Properties.
 * To change this template file, choose Tools | Templates
 * and open the template in the editor.
 */
//limiting scope
function createCanvas(size,container){
    const canvas=$("canvas");
    
    var rect = container.getBoundingClientRect();
    var v=screen.width-(2*rect.x),ah=screen.height-(2*(rect.top+8));
    if(v>ah)v=ah;
    
    canvas.width=size;
    canvas.height=size;
    canvas.style.width=v+"px";
    canvas.style.height=v+"px";
    container.appendChild(canvas);
    return canvas;
}
function game(socket,container,pn){
    const can = createCanvas(1000,container);
    const ctx = can.getContext("2d");
    ctx.webkitImageSmoothingEnabled = false;
    ctx.mozImageSmoothingEnabled = false;
    ctx.imageSmoothingEnabled = false;
    ctx.beginPath();
    ctx.rect(0, 0, 1000, 1000);
    ctx.fillStyle = "red";
    ctx.fill();
    
    can.onclick=function(event){
        var bound =can.getBoundingClientRect();
        var s=1000/bound.width;
        var x=(event.x-bound.x)*s;
        var y=(event.y-bound.y)*s;
        
        console.log(event);
        activeCards.forEach(c=>{
            if(c.click
                &&c.x<x
                &&c.y<y
                &&x<c.x+c.size
                &&y<c.y+c.size)c.click(c);
        });
    }
    
    var toLoad=4;   //amount of images to load

    const card_bg=loadImage("images/card_bg.png");
    const paper = loadImage("images/paper.png");
    const rock  = loadImage("images/rock.png");
    const scissor=loadImage("images/scissor.png");

    const card_tex=[card_bg,rock,paper,scissor]
    
    const cards=[];
    var activeCards;
    var played=false;
    var animate=false;
    var playNo;

    function loadImage(path){
        var img = new Image();
        img.src=path;
        img.onload=function(){
            toLoad--;
            if(toLoad==0)startGame();
        };
        return img;
    }
// #FCFFD5
// #FFD5D5
    function createCard(no,x,y,bg,size){
        var card={
            img:no,
            x:x,
            y:y,
            bg:bg,
            size:size,
            animated:false
        };
        card.resetDraw=()=>{
           card.draw=function(){
              drawCard(
                      card_tex[card.img],
                      card.x,
                      card.y,
                      card.bg,
                      card.size,
                      card.size);
           } ;
           card.animated=false;
           if(card.onEnd)card.onEnd(card);
           card.onEnd=null;
           card.draw();
        };
        card.flip=function(to){
            card.animated=true;
            var t=1,v=0.04;
            var x_=card.x;
            var sz_=card.size;
            var first=true;
            
            card.draw= function (){
                if(t<=0){
                    v*=-1;
                    first=!first;
                }
                if(t>1){
                    card.img=to;
                    card.resetDraw();
                    return;
                }
                sz_=t*t* card.size;
                x_=x+(card.size-sz_)/2.0;
                t-=v;
                if(first){
                    drawCard(card_tex[card.img],x_,card.y,card.bg,sz_,card.size);
                }else drawCard(card_tex[to],x_,card.y,card.bg,sz_,card.size);
            };
        };
        card.moveTo=function(nx,ny,nsize){
            nsize=nsize||card.size;
            const dx=nx-card.x;
            const dy=ny-card.y;
            const dsz=nsize-card.size;
            const v=6/(Math.sqrt((dx*dx)+(dy*dy)));
            
            var t2,nsz;
            
            if(v==Infinity)return;
            card.animated=true;
            var t=0;
            card.draw=function(){
                if(t>=1){
                    card.x=nx;
                    card.y=ny;
                    card.size=nsize;
                    card.resetDraw();
                    return;
                }
                t2=t*t;
                nsz=card.size+(t2*dsz);
                drawCard(
                        card_tex[card.img],
                        card.x+(t2*dx),
                        card.y+(t2*dy),
                        card.bg,
                        nsz,
                        nsz);
                t+=v;
            };
        };
        
        card.resetDraw();
        cards.push(card);
        return card;
    }
    function drawCard (card,x,y,bg,wid,hig){
        ctx.beginPath();
        ctx.rect(x,y,wid,hig);
        ctx.fillStyle = bg;
        ctx.fill();
        ctx.drawImage(card,x,y,wid,hig);
    }
    function startGame(){
        console.log('starting game');
        animate=true;
        function Click(card){
            //console.log(card,"clicked");
            playNo=card.img;
            socket.emit("played",card.img);
            activeCards.splice(activeCards.indexOf(card),1);
            activeCards.push(card);
            card.onEnd=function(){
                if(played)socket.emit("reveal");
            };
            card.moveTo(325,400,350);
            activeCards[2].flip(0);
            activeCards[1].flip(0);
            activeCards.forEach((c)=>{
                c.click=null;
            });
            if(cards.length>6)cards.splice(0,2);
        }
        activeCards=[
            createCard(0,325,-200,"#FFD5D5",180),
            
            createCard(1,210,810,"#FCFFD5",180),
            createCard(2,410,810,"#FCFFD5",180),
            createCard(3,610,810,"#FCFFD5",180)
         ];
        played = false;
        
        activeCards[1].click=Click;
        activeCards[2].click=Click;
        activeCards[3].click=Click;
        function anim(){
            ctx.clearRect(0,0, 1000, 1000);
            cards.forEach(c=>{c.draw();});
            if(animate)window.requestAnimationFrame(anim);
        }
        window.requestAnimationFrame(anim);
    }
    
    socket.on("played",()=>{
        played=true;
        activeCards[0].moveTo(325,25,350); 
    });
    socket.on("reveal",(no)=>{
        activeCards[0].onEnd=function(card){
            card.flip(no);
            card.onEnd=function(card){
                activeCards[3].moveTo(685,110,100);
                card.moveTo(685,5,100);
                
                cards.splice(cards.indexOf(activeCards[1]),1);
                cards.splice(cards.indexOf(activeCards[2]),1);
                
                activeCards[3].onEnd=function(){
                    console.log(playNo,no);
                    ctx.fillStyle="red";
                    var reasult="Loos";
                    if(playNo==no){
                        reasult="Draw";
                        ctx.fillStyle="grey";
                    }
                    else if((playNo==1&&no==3)||
                            (playNo==2&&no==1)||
                            (playNo==3&&no==2)){
                                    ctx.fillStyle="green";
                                    reasult="Win";
                                }
                    
                    animate=false;
                    ctx.font = "60px Arial";
                    ctx.fillText(reasult, 480, 480);
                    setTimeout(startGame,3000);
                };
                
            };
        };
        if(!activeCards[0].animated)!activeCards[0].onEnd(activeCards[0]);
        
    });
}
