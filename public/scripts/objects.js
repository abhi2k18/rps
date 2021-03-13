/* 
 * To change this license header, choose License Headers in Project Properties.
 * To change this template file, choose Tools | Templates
 * and open the template in the editor.
 */

class Layer{
    drawbles=[];
    constructor(...drawbles){this.drawbles=drawbles;}
    draw(ctx){
        for(var i=0;i<this.drawbles.length;i++){this.drawbles[i].draw(ctx); }
    }
    
    addToDraw(draw){this.drawbles.push(draw);}
    addToDrawBefore(draw,oldCall){
        const index = this.drawbles.indexOf(oldCall);
        if (index !== -1)this.drawbles.splice(index, 0,draw);
    }
    addToDrawAfter(draw,oldCall){
        const index = this.drawbles.indexOf(oldCall);
        if (index !== -1)this.drawbles.splice(index+1, 0,draw);
    }
    
    removeFrowDraw(draw){
        const index = this.drawbles.indexOf(draw);
        if (index !== -1)this.drawbles.splice(index, 1);
    }
    replaceInDraw(draw,oldCall){
        const index = this.drawbles.indexOf(oldCall);
        if (index !== -1) this.drawbles[index]=draw;
    }
    
    clear(){this.drawbles=[]}
}
class Canvas extends Layer{
    drawbles=[];
    clickListeners=[];
    xOffset=0;
    yOffset=0;
    hScale=1;
    vScale=1;
    
    drawFrame(){
        this.ctx.clearRect(0,0,this.wid,this.hig);
        this.draw(this.ctx);
    }
    startDrawing(){
        let canvas=this;
        function drawCall(){
            canvas.drawFrame();``
            canvas.animationFrame=window.requestAnimationFrame(drawCall);
        }
        this.animationFrame=window.requestAnimationFrame(drawCall);
    }
    stopDrawing(){
        window.cancalAnimationFrame(this.animationFrame);
    }
    updateBounds(){
        let rect=this.canvas.getBoundingClientRect();
        this.xOffset=rect.x;
        this.yOffset=rect.y;
        this.hScale=this.wid/rect.width;
        this.vScale=this.hig/rect.height;
    }

    addClickListener(listener){this.clickListeners.push(listener);}
    removeClickListener(listener){
        const index = this.clickListeners.indexOf(listener);
        if (index !== -1)this.clickListeners.splice(index, 1);
    }
    
//    addToDraw(draw){
//        this.drawbles.push(draw);
//    }
//    removeFrowDraw(draw){
//        const index = this.drawbles.indexOf(draw);
//        if (index !== -1)this.drawbles.splice(index, 1);
//    }
//    addToDrawBefore(draw,oldCall){
//        const index = this.drawbles.indexOf(oldCall);
//        if (index !== -1) {
//          this.drawbles.splice(index, 0,draw);
//        }
//    }
//    addToDrawAfter(draw,oldCall){
//        const index = this.drawbles.indexOf(oldCall);
//        if (index !== -1) {
//          this.drawbles.splice(index+1, 0,draw);
//        }
//    }
//    replaceInDraw(draw,oldCall){
//        const index = this.drawbles.indexOf(oldCall);
//        if (index !== -1) this.drawbles[index]=draw;
//    }
    
    constructor (wid,hig){
        super();
        this.wid=wid||500;
        this.hig=hig||500;
        
        this.canvas=$("canvas");
        this.canvas.width=wid;
        this.canvas.height=hig;
        this.canvas.addEventListener("click",(event)=>{
            this.updateBounds();
            for(var i=0;i<this.clickListeners.length;i++)
                this.clickListeners[i].clickListener(
                    this.hScale*(event.x-this.xOffset),
                    this.vScale*(event.y-this.yOffset));
        });
        this.ctx=this.canvas.getContext("2d");
        this.ctx.webkitImageSmoothingEnabled = false;
        this.ctx.mozImageSmoothingEnabled = false;
        this.ctx.imageSmoothingEnabled = false;
    }
}
class HidableLayer extends Layer{
    visible=true;
    constructor(canvas,...bases){
        super(...bases);
        for(var i=0;i<bases.length;i++)bases[i].remove();
        canvas.addToDraw(this);
        this.drawCopy=this.draw;
        this.canvas=canvas;
    }
    
    hide(){
        this.visible=false;
        this.draw=()=>{}
    }
    unHide(){
        this.visible=true;
        this.draw=this.drawCopy
    }
    
    addToDraw(draw){
        this.canvas.removeFrowDraw(draw);
        this.drawbles.push(draw);
    }
    addToDrawBefore(draw,oldCall){
        this.canvas.removeFrowDraw(draw);
        const index = this.drawbles.indexOf(oldCall);
        if (index !== -1)this.drawbles.splice(index, 0,draw);
    }
    addToDrawAfter(draw,oldCall){
        this.canvas.removeFrowDraw(draw);
        const index = this.drawbles.indexOf(oldCall);
        if (index !== -1)this.drawbles.splice(index+1, 0,draw);
    }
    
    
    remove(){
        this.canvas.removeFrowDraw(this);
    }
}
class Rect{
    constructor(x,y,wid,hig){
        if(wid<0){
            x+=wid;
            x=-x;
        }
        if(hig<0){
            y+=hig;
            hig=-hig;
        }
        this.x=x;
        this.y=y;
        this.wid=wid;
        this.hig=hig;
        this.x2=x+wid;
        this.y2=y+hig;
    }
    contains(px,py){
        return px<=this.x2
                &&px>=this.x
                &&py<=this.y2
                &&py>=this.y
    }
}
class Clickable{
    constructor(canvas,rect){
        this.rect=rect;
        this.canvas=canvas;
        this.enable();
    }
    
    clickListener(px,py){
        if(this.rect.contains(px,py))this.onClick();
    }
    onClick(){
        console.log("i am clicked");
    }
    disable(){this.canvas.removeClickListener(this);}
    enable(){this.canvas.addClickListener(this);}
}

class Base{
    updateValues(x,y,wid,hig){
        this.x=x;
        this.y=y;
        this.wid=wid;
        this.hig=hig;
        this.rect=new Rect(this.x,this.y,this.wid,this.hig);
    }
    onDraw(ctx){}
    draw(ctx){
        ctx.save();
        this.onDraw(ctx);
        ctx.restore();
    }
    constructor(x,y,wid,hig,canvas,ondraw){
        this.updateValues(x,y,wid,hig);
        this.canvas=canvas;
        canvas.addToDraw(this);
        if(typeof ondraw === 'function')this.onDraw=ondraw;
    }
    getOrigin(){return {x:this.x,y:this.y}}
    contains(px,py){
        return this.rect.contains(px,py);
    }
    remove(){
        this.canvas.removeFrowDraw(this);
    }
}
class CenteredBase extends Base{
    updateValues(cx,cy,wid,hig){
        this.x=cx-wid/2;
        this.y=cy-hig/2;
        this.wid=wid;
        this.hig=hig;
        this.cx=cx;
        this.cy=cy;
        this.rect=new Rect(this.x,this.y,this.wid,this.hig);
    }
    getOrigin(){return {x:this.cx,y:this.cy}}
}
class TextBox extends CenteredBase{
    constructor(cx,cy,text,color,canvas,fontSZ){
        canvas.ctx.save();
        canvas.ctx.font=fontSZ+"px monospace";
        const mat=canvas.ctx.measureText(text);
        const hig=(mat.actualBoundingBoxAscent-mat.actualBoundingBoxDescent);
        super(cx,cy,mat.width,hig,canvas)
        this.dy=this.y+this.hig;

        this.text=text;
        this.color=color;
        this.sz=fontSZ;
        
        canvas.ctx.restore();
    }
    
    onDraw(ctx){
        ctx.save();
        ctx.font=this.sz+"px monospace";
        ctx.fillStyle=this.color;
        ctx.fillText(this.text,this.x,this.dy);
        ctx.restore();
    }
}
class LongTextBox extends Base{
    lines=[]
    constructor(x,y,wid,hig,text,color,canvas,fontSZ,lnSpacing){
        super(x,y,wid,hig,canvas);
        
        this.sz=fontSZ;
        this.color=color;
        this.lnSpacing=lnSpacing||0;
        this.setText(text);
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
    onDraw(ctx){
        ctx.beginPath();
        ctx.rect(this.x, this.y, this.wid, this.hig);
        ctx.closePath();
        ctx.clip();
        ctx.font=this.sz+"px monospace";
        ctx.fillStyle=this.color;
        for(var i=0;i<this.lines.length;i++)
            ctx.fillText(this.lines[i],this.x,this.dy+(this.lWid*i));
    }
    setText(text){
        this.lines=[];
        this.canvas.ctx.save();
        this.canvas.ctx.font=this.sz+"px monospace";
        
        let tmpValues=text.split(" ");
        var tmpLN=tmpValues[0];
        this.lWid=this.lnSpacing+this.canvas.ctx.measureText(tmpLN).fontBoundingBoxAscent;
        
        for(var i=1;i<tmpValues.length;i++){
            if(this.canvas.ctx.measureText(tmpLN+" "+tmpValues[i]).width>this.wid){
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
        this.canvas.ctx.restore();
        this.lines.push(...tmpLN.split('\n'));
        
        this.maxY=((this.lines.length+1)*this.lWid)-this.hig;
        this.maxY=this.maxY<0?0:this.maxY;
        this.dy=this.x+this.lWid;
        this.scrollPosi=0;
        this.unitScroll=1/this.maxY;//increament sp so maxy*sp=10 maxy*(x)=10;
        this.text=text;
    }
};
class SpriteBox extends CenteredBase{
    constructor(cx,cy,wid,hig,img,canvas){
        super(cx,cy,wid,hig,canvas);
        this.img=img;
    }
    draw(ctx){
        ctx.drawImage(this.img,this.x,this.y,this.wid,this.hig)
    }
    switchImage(newImage){
        this.img=newImage;
    }
}
class Animatable {
    multiplier=1;
    anmAtt=[];
    differance={};
    units={};
    t={};
    
    constructor(base){
        this.base=base;
        this.base.canvas.replaceInDraw(this,base);
    }
    draw(ctx){
        this.base.draw(ctx)
    }
    setVar(name,nv){
        this.differance[name]=nv-this.sRect[name];  //Diff toBe Completed i.e nv=cv+dff
        this.units[name]=Math.abs(1/this.differance[name]);   //Unit amoumt of t tobe added to move on px
        this.t[name]=0;                             //cv=ov+t*diff;
        if(this.differance[name]!==0)this.anmAtt.push(name);
    }
    transformTo(nx,ny,nwid,nhig,multiplier,onEnd){
        if(Number.isFinite(multiplier)) this.multiplier=multiplier;
        this.anmAtt=[];//reset previous animation
        this.sRect={
            ...this.base.getOrigin(),
            wid:this.base.wid,
            hig:this.base.hig
        }
        this.setVar("x",nx);
        this.setVar("y",ny);
        this.setVar("wid",nwid);
        this.setVar("hig",nhig);
        
        if(this.anmAtt.includes("x")&&this.anmAtt.includes("y")){
            let speed=Math.sqrt((this.differance.x*this.differance.x)+(this.differance.y*this.differance.y));
            this.units.x=1/speed;
            this.units.y=1/speed;
        }
        
//        console.log("base",this.base)
//        console.log("diff",this.differance)
//        console.log("units",this.units)
//        console.log("t",this.t)
        
        if(this.anmAtt.length>0)
        this.draw=function(ctx){
            let att={...this.sRect};
            for(var i=0;i<this.anmAtt.length;i++){
                //console.log(this.multiplier);
                this.t[this.anmAtt[i]]+=this.multiplier*this.units[this.anmAtt[i]];
                att[this.anmAtt[i]]+=this.t[this.anmAtt[i]]*this.differance[this.anmAtt[i]];
                if(this.t[this.anmAtt[i]]>=1){
                    this.t[this.anmAtt[i]]=1;//it doesent matter;
                    this.sRect[this.anmAtt[i]]+=this.differance[this.anmAtt[i]];
                    att[this.anmAtt[i]]=this.sRect[this.anmAtt[i]];//if else is used i doesemt needed
                    this.anmAtt.splice(i,1);
                    i--;
                }
            }
            //console.log(this.t,this.anmAtt)
            this.base.updateValues(att.x,att.y,att.wid,att.hig);
            this.base.draw(ctx);
            if(this.anmAtt.length==0){
                this.draw= function(ctx){ this.base.draw(ctx);};
                if(typeof onEnd === "function")onEnd();
            }
        };
    }
}
