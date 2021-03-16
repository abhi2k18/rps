/* 
 * To change this license header, choose License Headers in Project Properties.
 * To change this template file, choose Tools | Templates
 * and open the template in the editor.
 */

// methods that can turn 
function makeDrawable(object,draw,saveContext){
    object.visible=true;
    if(saveContext){
        object.ondraw=draw.bind(object);
        object.draw=function(ctx){
            ctx.save();
            this.ondraw(ctx);
            ctx.restore();
        };
    }
    else object.draw=draw;
    
    const enable  =function (){this.visible=true;}.bind(object);
    const disable =function (){this.visible=false;}.bind(object);
    if(object.enable===undefined)object.enable=enable;
    else{
        let tmp =object.enable.bind(object);
        object.enable=function(){
            tmp();
            enable();
        };
    }
    if(object.disable===undefined)object.disable=disable;
    else{
        let tmp =object.disable.bind(object);
        object.disable=function(){
            tmp();
            disable();
        };
    }
    return object;
}
function makeClickable(rect,click){
    if(typeof rect.contains !=="function")throw "invalid argument passed";
    rect.click=click;
    rect.clickable=true;
    rect.onClick=function(px,py){
        if(this.contains(px,py))return(this.click(px,py));
    }
    
    const enable  =function (){this.clickable=true;}.bind(rect);
    const disable =function (){this.clickable=false;}.bind(rect);
    if(rect.enable===undefined)rect.enable=enable;
    else{
        let tmp =rect.enable.bind(rect);
        rect.enable=function(){
            tmp();
            enable();
        }
    }
    if(rect.disable===undefined)rect.disable=disable;
    else{
        let tmp =rect.disable.bind(rect);
        rect.disable=function(){
            tmp();
            disable();
        };
    }
    return rect;
}
function makePressable(rect,press,delay=100){//delay between consecutive calls
    if(typeof rect.contains !=="function")throw "invalid argument passed";
    rect.pressable=true;
    rect.pressed=false;
    rect.press=press;
    rect.onDown=function(px,py){
        if(this.contains(px,py)){
            this.setInterval();
            return true;
        }
    };
    rect.onUp=function(){
        this.clearInterval();
    };
    rect.onMove=function(px,py){
        if(this.contains(px,py))return true;
        this.clearInterval();
    };
    
    rect.clearInterval=function(){
        if(this.pressed){//if pressed cancal intervals
            this.pressed=false;
            clearInterval(this.pressedIntervals);
        }
    };
    rect.setInterval=function(){
        if(this.pressed)return; //if already pressed
        this.pressedIntervals=setInterval(this.press,delay);
        this.pressed=true;
    };
    
    //enable disable Support
    const enable  =function (){this.pressable=true;}.bind(rect);
    const disable =function (){
        this.pressable=false;
        this.clearInterval();
    }.bind(rect);
    if(rect.enable===undefined)rect.enable=enable;
    else{
        let tmp =rect.enable.bind(rect);
        rect.enable=function(){
            tmp();
            enable();
        }
    }
    if(rect.disable===undefined)rect.disable=disable;
    else{
        let tmp =rect.disable.bind(rect);
        rect.disable=function(){
            tmp();
            disable();
        };
    }
    return rect;
}

function makeRoundedRect(rect,r,color,ew=0,eh=0,setBG=true){
    rect.r=r;
    rect.roundRectColor=color;
    rect.ew=ew/2;
    rect.eh=eh/2;
    const drawRect=function(ctx){
        ctx.beginPath();
        ctx.moveTo(this.x1+this.r,this.y1);
        ctx.lineTo(this.x2-this.r,this.y1);
        ctx.quadraticCurveTo(this.x2,this.y1, this.x2,this.y1+this.r);
        ctx.lineTo(this.x2,this.y2-this.r);
        ctx.quadraticCurveTo(this.x2,this.y2, this.x2-this.r, this.y2);
        ctx.lineTo(this.x1+this.r,this.y2);
        ctx.quadraticCurveTo(this.x1,this.y2, this.x1,this.y2-this.r);
        ctx.lineTo(this.x1,this.y1+this.r);
        ctx.quadraticCurveTo(this.x1,this.y1, this.x1+this.r,this.y1);
        ctx.closePath();//creating rounded rect

        ctx.fillStyle=this.roundRectColor;
        ctx.fill();
    }.bind(rect);
    if(typeof rect.draw==="function"){//already is a drawable then set it as bg
        let tmp= rect.draw.bind(rect);
        if(setBG)rect.draw=function(ctx){
            drawRect(ctx);
            tmp(ctx);
        };
        else rect.draw=function(ctx){
            tmp(ctx);
            drawRect(ctx);
        };
    }
    else makeDrawable(rect,drawRect);
    
    rect.updateBounds_copy=rect.updateBounds;
    rect.updateBounds=function(){
        this.updateBounds_copy();
        this.x1-=this.ew;
        this.x2+=this.ew;
        this.y1-=this.eh;
        this.y2+=this.eh;
    };
    rect.updateBounds();
    return rect;
}
function makeToast(drawable,time,layer){
    layer.addChield(drawable);
    setTimeout(()=>layer.removeChield(drawable),time*1000);
}
function animate(rect,nox,noy,nwid,nhig,time,onEnd,ft=function(t){return t;}){
    const sv=[...rect.getOrigin(),rect.wid,rect.hig];//copy values at start
    const diff=[nox,noy,nwid,nhig];//diff=ev-sv
    for(i=0;i<sv.length;i++)diff[i]-=sv[i];
    const drawCopy=rect.draw.bind(rect);
    const stime=performance.now();
    var ctime;
    time=0.001/time;//as all says division is expensive so 
    rect.animated=true;
    rect.onEnd=onEnd;//override on end
    rect.draw=function(ctx){
        ctime=ft(time*(performance.now()-stime));
        if(ctime>=1){
            ctime=1;
            rect.draw=drawCopy;
            this.update(diff[0]+sv[0],diff[1]+sv[1],diff[2]+sv[2],diff[3]+sv[3]);
            drawCopy(ctx);
            this.animated=false;
            if(typeof this.onEnd==="function")this.onEnd(this);
        }
        else{
            this.update(ctime*diff[0]+sv[0],ctime*diff[1]+sv[1],ctime*diff[2]+sv[2],ctime*diff[3]+sv[3]);
            drawCopy(ctx);
        }
    };
    return rect;
}

let ctx;//2d rendering context set by canvas for common uses

// Base Classes
class Rect{
    //relative origin of rect used in calculating starting x,y
    rox=0; // rx= ox-x
    roy=0; 
    constructor(x,y,wid,hig,ox,oy){
        this.x=x;
        this.y=y;
        this.wid=wid;
        this.hig=hig;
        if(ox !==undefined){
            this.rox=ox-x;
            this.roy=oy-y;
        }
        this.updateBounds();
    }
    
    updateBounds(){
       if(this.wid<0){
            this.x1=this.x+this.wid;
            this.x2=this.x;
        }
        else{
            this.x1=this.x;
            this.x2=this.x+this.wid;
        }
        
        if(this.hig<0){
            this.y1=this.y+this.hig;
            this.y2=this.y;
        }
        else{
            this.y1=this.y;
            this.y2=this.y+this.hig;
        }
    }//update bounds accrding to wid and hig
    moveTo(nox,noy){
        var xi=nox-(this.x+this.rox);
        var yi=noy-(this.y+this.roy);
        
        this.x+=xi;
        this.x1+=xi;
        this.x2+=xi;
        
        this.y+=yi;
        this.y1+=yi;
        this.y2+=yi;
        
        return [xi,yi];
    }
    scaleTo(nwid,nhig){//zero wid/hig will give error 
        //scale without changing origin but changin relative origin;
        //calcuolate Movement
        const ocp=this.getOrigin();
        this.x+=(this.rox/this.wid)*(this.wid-nwid);
        this.y+=(this.roy/this.hig)*(this.hig-nhig);
        this.setOrigin(...ocp);//settin relative org wrt origin;
        
        //setting wid/hig
        this.wid=nwid;
        this.hig=nhig;
        this.updateBounds();
        
    }
    update(ox,oy,wid,hig){
        this.moveTo(ox,oy);
        this.scaleTo(wid,hig);
    }
    setOrigin(ox,oy){
        this.rox=ox-this.x;
        this.roy=oy-this.y;
    }
    
    contains(px,py){
        return this.x1<=px&&this.x2>=px
                &&this.y1<=py&&this.y2>=py;
    }
    getOrigin(){return [this.x+this.rox,this.y+this.roy];}
}

class Layer {
    chields=[];
    pressed={};
    
    constructor(){this.enable();}
    addChield(obj){if(this.chields.indexOf(obj)===-1)this.chields.push(obj);}//add only if not exist
    getChieldIndex(obj){
        return this.chields.indexOf(obj);
    }
    removeChield(obj){
        let i = this.getChieldIndex(obj);
        if(i>-1)this.chields.splice(i,1);
    }
    moveToTop(obj){
        let i = this.getChieldIndex(obj);
        if(i>-1){
            this.chields.splice(i,1);//remove chield
            this.chields.push(obj);//add at end of array
        }
    }
    
    //all methodes below will add if oldObj exist
    replaceChield(obj,oldObj){
        let i = this.getChieldIndex(oldObj);
        if(i>-1)this.chields[i]=obj;
    }
    addChieldBefore(obj,oldObj){
        let i = this.getChieldIndex(oldObj);
        if(i>-1)this.chields.splice(i,0,obj);
    }
    addChieldAfter(obj,oldObj){
        let i = this.getChieldIndex(oldObj)+1;
        if(i>0)this.chields.splice(i,0,obj);
    }
    //simple event cslls calls to 
    draw(ctx){
        for(var i =0;i<this.chields.length;i++)
            if(this.chields[i].visible)this.chields[i].draw(ctx);
    }
    onClick(px,py){
        for(var i =0;i<this.chields.length;i++)
            if(this.chields[i].clickable)
                if(this.chields[i].onClick(px,py))return true;
    }
    
    //pressed listner
    onDown(px,py,id)
    {
        // start pressed event with set interval
        for(var i =0;i<this.chields.length;i++)
            if(this.chields[i].pressable)
                if(this.chields[i].onDown(px,py,id)){
                    this.pressed[id]=this.chields[i];
                    return true;
                }
    }//called when mouse down or touch  start
    onUp(px,py,id){
        //cancel started event
        if(!this.pressed[id])return;
        this.pressed[id].onUp(px,py,id);
        this.pressed[id]=false;
    }//called when mouse up or touch end
    onMove(px,py,id){
        // cancel event if pointer / touch move out side
        if(!this.pressed[id])return;
        if(this.pressed[id].onMove(px,py,id))return true;
        this.pressed[id]=false;
        
    }//called when mouse move or touch move
    
    //enable disable layer
    disable(){
        this.visible=false;
        this.clickable=false;
        this.pressable=false;
    }
    enable(){
        this.visible=true;
        this.clickable=true;
        this.pressable=true;
    }
    clearInterval(){
        const keys= Object.keys(this.pressed);
        while(keys.length>0)this.pressed[keys[keys.shift()]].clearInterval();//calling clear intervals on each chield
    }
    clear(){
        this.clearInterval();
        this.chields=[];
    }
}

//implementetion of base classes

class Canvas extends Layer{
    clickListeners=[];
    pressedListeners=[];
    xOffset=0;
    yOffset=0;
    hScale=1;
    vScale=1;
    
    maxClickDelay=300;//if down up happen in maxClickDelay ms then click event is fired
    es={}//contains start of each input event 
    
    drawFrame(){
        this.ctx.clearRect(0,0,this.wid,this.hig);
        this.draw(this.ctx);
    }
    startDrawing(){
        let canvas=this;
        function drawCall(){
            canvas.drawFrame();
            canvas.animationFrame=window.requestAnimationFrame(drawCall);
        }
        this.animationFrame=window.requestAnimationFrame(drawCall);
    }
    stopDrawing(){
        window.cancelAnimationFrame(this.animationFrame);
    }
    updateBounds(){
        let rect=this.canvas.getBoundingClientRect();
        this.xOffset=rect.x;
        this.yOffset=rect.y;
        this.hScale=this.wid/rect.width;
        this.vScale=this.hig/rect.height;
    }
    handleTouch(event,handler){
        event.preventDefault();
        for(var i=0;i<event.changedTouches.length;i++){
            handler(this.hScale*(event.changedTouches[i].clientX-this.xOffset),this.vScale*(event.changedTouches[i].clientY-this.yOffset),event.changedTouches[i].identifier)
        }
    }
    
    // if down and up happens in next 2ms then it's click
    onDown(px,py,id){
        this.es[id]=performance.now();
        super.onDown(px,py,id);
    }
    onUp(px,py,id){
        if(performance.now()-this.es[id]<this.maxClickDelay)this.onClick(px,py);
        super.onUp(px,py,id);
    }
    
    constructor (wid,hig){
        super();
        this.wid=wid||500;
        this.hig=hig||500;
        
        this.canvas=$("canvas");
        this.canvas.width=wid;
        this.canvas.height=hig;
        
        //setup mutation observer to detect changes in attributea
//        let mob=new MutationObserver((data)=>console.log(data));
//        mob.observe(this.canvas,{attributes: true});
        
        //setup Events
//        this.canvas.addEventListener("click",(event)=>{this.onClick(this.hScale*(event.x-this.xOffset),this.vScale*(event.y-this.yOffset))});
        this.canvas.addEventListener("mousedown",(event)=>{event.preventDefault();this.onDown(this.hScale*(event.x-this.xOffset),this.vScale*(event.y-this.yOffset),-1)});
        this.canvas.addEventListener("mouseup",(event)=>{event.preventDefault();this.onUp(this.hScale*(event.x-this.xOffset),this.vScale*(event.y-this.yOffset),-1)});
        this.canvas.addEventListener("mousemove",(event)=>{event.preventDefault();this.onMove(this.hScale*(event.x-this.xOffset),this.vScale*(event.y-this.yOffset),-1)});
        
        //touch event setup
        this.canvas.addEventListener("touchstart",(event)=>this.handleTouch(event,this.onDown.bind(this)));
        this.canvas.addEventListener("touchend",(event)=>this.handleTouch(event,this.onUp.bind(this)));
        this.canvas.addEventListener("touchmove",(event)=>this.handleTouch(event,this.onMove.bind(this)));
       
        this.ctx=this.canvas.getContext("2d");
        this.ctx.webkitImageSmoothingEnabled = false; //allow image scaling without blur effect
        this.ctx.mozImageSmoothingEnabled = false;
        this.ctx.imageSmoothingEnabled = false;
        
        ctx=this.ctx; //setting global var ctx
    }
}
class TextBox extends Rect{
    constructor(cx,cy,font,color,text){
        super(cx-5,cy-5,10,10,cx,cy);
        this.font=font;
        if(typeof font ==="number")this.font+="px monospace";//if just font size is given
        this.color=color;
        this.setText(text);
        makeDrawable(this,function(ctx){
            ctx.font=this.font;
            ctx.fillStyle=this.color;
            ctx.fillText(this.text,this.x,this.dy);
        });
    }
    setText(text){
        this.text=text;
        if(this.text.length===0)return;
        ctx.save();
        ctx.font=this.font;
        const mat=ctx.measureText(text);
        const hig=(mat.actualBoundingBoxAscent-mat.actualBoundingBoxDescent);
        this.update(...this.getOrigin(),mat.width,hig);
        this.dy=this.y+this.hig;
        ctx.restore();
    }
    setFont(font){
        this.font=font;
        if(typeof font ==="number")this.font+="px monospace";//if just font size is given
        this.setText(this.text);
    }
}
class LongTextBox extends Rect{
    lines=[]
    constructor(x,y,wid,hig,lnSpacing,font,color,text){
        super(x,y,wid,hig);
        
        this.font=font;
        if(typeof font ==="number")this.font+="px monospace";//if just font size id given
        this.color=color;
        this.lnSpacing=lnSpacing;
        this.setText(text);
        
        makeDrawable(this,function(ctx){
            ctx.beginPath();
            ctx.rect(this.x, this.y, this.wid, this.hig);
            ctx.closePath();
            ctx.clip();
            ctx.font=this.font;
            ctx.fillStyle=this.color;
            for(var i=0;i<this.lines.length;i++)
                ctx.fillText(this.lines[i],this.x,this.dy+(this.lWid*i));
        },true);
    }
    updateScroll(){
        if(this.scrollPosi<0)this.scrollPosi=0;
        if(this.scrollPosi>1)this.scrollPosi=1;
        this.dy=(this.x+this.lWid)-this.maxY*this.scrollPosi;
    }
    increamentScroll(scale){
        scale=scale||1;
        this.scrollPosi+=scale*this.unitScroll;
        this.updateScroll();
    }
    decreamentScroll(scale){
        scale=scale||1;
        this.scrollPosi-=scale*this.unitScroll;
        this.updateScroll();
    }
    setText(text){
        this.lines=[];
        ctx.save();
        ctx.font=this.font;
        
        let tmpValues=text.split(" ");
        var tmpLN=tmpValues[0];
        this.lWid=this.lnSpacing+ctx.measureText(tmpLN).fontBoundingBoxAscent;
        
        for(var i=1;i<tmpValues.length;i++){
            if(ctx.measureText(tmpLN+" "+tmpValues[i]).width>this.wid){
                if(tmpLN.includes("\n")){
                    let tmp=tmpLN.split('\n');
                    tmpLN=tmp.pop()+" "+tmpValues[i];
                    this.lines.push(...tmp);
                }
                else{
                    this.lines.push(tmpLN);
                    tmpLN=tmpValues[i];
                }
            }
            else tmpLN+=" "+tmpValues[i];
        }
        ctx.restore();
        this.lines.push(...tmpLN.split('\n'));
        
        this.maxY=((this.lines.length+1)*this.lWid)-this.hig;
        this.maxY=this.maxY<0?0:this.maxY;
        this.dy=this.x+this.lWid;
        this.scrollPosi=0;
        this.unitScroll=1/this.maxY;//increament sp so maxy*sp=1 maxy*(x)=1;
        this.text=text;
    }
};
class SpriteBox extends Rect{
    constructor(cx,cy,wid,hig,img,canvas){
        super(cx-wid/2,cy-hig/2,wid,hig,cx,cy);
        this.img=img;
        makeDrawable(this,function(ctx){ctx.drawImage(this.img,this.x,this.y,this.wid,this.hig);});
    }
    switchImage(newImage){
        this.img=newImage;
    }
}