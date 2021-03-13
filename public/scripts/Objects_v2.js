/* 
 * To change this license header, choose License Headers in Project Properties.
 * To change this template file, choose Tools | Templates
 * and open the template in the editor.
 */
//for (var i = 0; i < arr.length; i++)
class Drawable{
    visible=false;
    constructor(layer){
        this.layer=layer;
        this.enableDrawing();
    }
    enableDrawing(){this.visible=true;this.layer.add(this);}
    disableDrawing(){this.visible=false;this.layer.remove(this);}
    
    onDraw(){}
    draw(ctx){
        ctx.save();
        this.onDraw(ctx);
        ctx.restore();
    }
}
class Layer{
    drawables=[];
    
    add(drawable){this.drawables.push(drawable)}
    addAt(drawable,i){this.drawables.splice(i,0,drawable)}
    remove(drawable){
        let i = this.indexOf(drawable);
        if(i>-1)this.drawables.splice(i,1);
    }
    replace(drawable,oldDrawable){
        let i = this.indexOf(oldDrawable);
        if(i>-1)this.drawables[i]=drawable;
    }
    indexOf(drawable){return this.drawables.indexOf(drawable);}
    clear(){this.drawables=[];}
    
    draw(ctx){for (var i = 0; i < this.drawables.length; i++)this.drawables[i].draw(ctx);}
}
class DrawableLayer extends Layer{
    visible=false;
    constructor(layer){
        super();
        this.layer=layer;
        this.enableDrawing();
        this.drawCopy=this.draw;
    }
    enableDrawing(){this.visible=true;this.layer.add(this);}
    disableDrawing(){this.visible=false;this.layer.remove(this);}
    hide(){this.visible=false;this.draw=()=>{};}
    show(){this.visible=true;this.draw=this.drawCopy;}
}
class ValueAnimator{
    constructor(start,end){
        this.start=start;
        this.diff=end-start;
        this.unit=Math.abs(1/this.diff);
        this.time=0;
    }
    increament(scale){this.time+=this.unit*scale;}
    decreament(scale){this.time-=this.unit*scale;}
    t(time){return time}
    getValue(){return this.start + this.t(this.time)*this.diff}
}

class Base extends Drawable{
    constructor(x,y,wid,hig,layer,onDraw){
        super(layer);
        this.update(x,y,wid,hig);
        if(typeof onDraw ==="function")this.onDraw=onDraw;
    }
    update(x,y,wid,hig){
        this.x=x;
        this.y=y;
        this.wid=wid;
        this.hig=hig;
        this.x2=x+wid;
        this.y2=y+hig;
        this.cx=x+wid/2;
        this.cy=y+hig/2;
    }
    onDraw(ctx){
        ctx.fillRect(this.x,this.y,this.wid,this.hig);
    }
    contains(px,py){
        return px<=this.x2
                &&px>=this.x
                &&py<=this.y2
                &&py>=this.y
    }
    getOrigin(){return {x:this.x,y:this.y}}
}
class CentredBase extends Base{
    update(cx,cy,wid,hig){
        this.x=cx-wid/2;
        this.y=cy-hig/2;
        this.wid=wid;
        this.hig=hig;
        this.x2=this.x+wid;
        this.y2=this.y+hig;
        this.cx=cx;
        this.cy=cy;
    }
    getOrigin(){return {x:this.cx,y:this.cy}}
};
class RoundedRect extends Base{
    constructor(base,r,color){
        super(base.x,base.y,base.wid,base.hig,base.layer);
        this.base=base;
        this.r=r;
        this.color=color;
        this.base.disableDrawing();
        this.setExtra(0,0);
        this.getOrigin = base.getOrigin;
        this.update=function(x,y,wid,hig){
            this.base.update(x,y,wid,hig);
            this.setValues();
        };
    }
    setValues(){
        this.x=this.base.x-this.ex;
        this.y=this.base.y-this.ey;
        this.wid=this.base.wid+2*this.ex;
        this.hig=this.base.hig+2*this.ey;
        this.x2=this.base.x2+this.ex;
        this.y2=this.base.y2+this.ey;
        this.cx=this.base.cx;
        this.cy=this.base.cy;
    }
    setExtra(wid,hig){
        this.ex=wid/2;
        this.ey=hig/2;
        this.setValues();
    }
    onDraw(ctx){
        ctx.fillStyle=this.color;
        ctx.beginPath();
        
        ctx.moveTo(this.x+this.r,this.y);

        ctx.lineTo(this.x2-this.r,this.y);
        ctx.quadraticCurveTo(this.x2,this.y, this.x2,this.y+this.r);

        ctx.lineTo(this.x2,this.y2-this.r);
        ctx.quadraticCurveTo(this.x2,this.y2, this.x2-this.r, this.y2);

        ctx.lineTo(this.x+this.r,this.y2);
        ctx.quadraticCurveTo(this.x,this.y2, this.x,this.y2-this.r);

        ctx.lineTo(this.x,this.y+this.r);
        ctx.quadraticCurveTo(this.x,this.y, this.x+this.r,this.y);

        ctx.closePath();
        ctx.fill();
        
        this.base.draw(ctx);
    }
}
class Clickable{
    enabled=false;
    constructor(canvas,base){
        this.base=base;
        this.canvas=canvas;
        this.enable();
    }
    
    event(px,py){
        if(this.base.contains(px,py))return this.onClick(px,py);
    }
    onClick(px,py){
        console.log("i am clicked");
    }
    disable(){this.enabled=false;this.canvas.removeClickListener(this);}
    enable(){this.enabled=true;this.canvas.addClickListener(this);}
}
class Pressable extends Clickable{
    enabled=false;
    constructor(canvas,base){
        super(canvas,base);
    }
    disable(){this.enabled=false;this.canvas.removePressedListener(this);}
    enable(){this.enabled=true;this.canvas.addPressedListener(this);}
}
class Animatable extends Drawable {
    multiplier=1;
    anmAtt=[];
    differance={};
    units={};
    t={};
    
    constructor(base){
        super(base.layer);
        this.base=base;
        this.base.disableDrawing();
    }
    draw(ctx){this.base.draw(ctx);}
    setVar(name,nv){
        this.differance[name]=nv-this.sRect[name];  //Diff toBe Completed i.e nv=cv+dff
        if(this.differance[name]==0)return;
        this.anmAtt.push(name);
        this.units[name]=Math.abs(1/this.differance[name]);   //Unit amoumt of t tobe added to move on px
        this.t[name]=0;                             //cv=ov+t*diff;
    }
    transformTo(nx,ny,nwid,nhig,multiplier,onEnd){
        this.animating=true;
        if(Number.isFinite(multiplier)) this.multiplier=multiplier;
        this.anmAtt=[];//reset previous animation
        this.sRect={
            ...this.base.getOrigin(),
            wid:this.base.wid,
            hig:this.base.hig
        };
        this.setVar("x",nx);
        this.setVar("y",ny);
        this.setVar("wid",nwid);
        this.setVar("hig",nhig);
        
        if(this.anmAtt.includes("x")&&this.anmAtt.includes("y")){
            let speed=Math.sqrt((this.differance.x*this.differance.x)+(this.differance.y*this.differance.y));
            this.units.x=1/speed;
            this.units.y=1/speed;
        }
        var maxU=0;
        Object.values(this.units).forEach(elm => maxU=Math.max(maxU=elm));
        this.setUnit(maxU);
        
        
//        console.log("base",this.base)
//        console.log("diff",this.differance)
//        console.log("units",this.units)
//        console.log("t",this.t)
        
        if(this.anmAtt.length>0)
        this.draw=function(ctx){
            let att={...this.sRect};
            for(var i=0;i<this.anmAtt.length;i++){
                this.t[this.anmAtt[i]]+=this.multiplier*this.units[this.anmAtt[i]];
                att[this.anmAtt[i]]+=this.t[this.anmAtt[i]]*this.t[this.anmAtt[i]]*this.t[this.anmAtt[i]]*this.differance[this.anmAtt[i]];
                if(this.t[this.anmAtt[i]]>=1){
                    this.t[this.anmAtt[i]]=1;//it doesent matter;
                    this.sRect[this.anmAtt[i]]+=this.differance[this.anmAtt[i]];
                    att[this.anmAtt[i]]=this.sRect[this.anmAtt[i]];//if else is used i doesemt needed
//                    if(typeof onEnd === "function")onEnd(true,this.anmAtt[i]);//Sending onEnd Event With Property
                    this.anmAtt.splice(i,1);
                    i--;
                }
            }
            //console.log(this.t,this.anmAtt)
            this.base.update(att.x,att.y,att.wid,att.hig);
            this.base.draw(ctx);
            if(this.anmAtt.length==0){
                this.draw= function(ctx){ this.base.draw(ctx);};
                if(typeof onEnd === "function")onEnd();
                this.animating=false;
            }
        };
    }
    contains(px,py){
        return this.base.contains(px,py);
    }
    setUnit(unit){
        Object.keys(this.units).forEach(elm => this.units[elm]=unit);
    }
}

class Canvas extends Layer{
    clickListeners=[];
    pressedListeners=[];
    xOffset=0;
    yOffset=0;
    hScale=1;
    vScale=1;
    pressed={x:0,y:0}
    
    setBG(color){this.ctx.fillStyle=color;}
    drawFrame(){
        this.ctx.fillRect(0,0,this.wid,this.hig);
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
                if (this.clickListeners[i].event(
                    this.hScale*(event.x-this.xOffset),
                    this.vScale*(event.y-this.yOffset)))return true;
        });
        this.canvas.onmousedown = e=>{
            this.updateBounds();
            clearInterval(this.pressedIntervals);
            this.pressed.e=e;
            this.pressed.x = this.hScale*(e.x-this.xOffset);
            this.pressed.y = this.vScale*(e.y-this.yOffset);
            this.pressedIntervals=setInterval(this.onPressed.bind(this),100);
        };
        this.canvas.onmouseup = ()=>clearInterval(this.pressedIntervals);
//        this.canvas.preventDefault();
        this.ctx=this.canvas.getContext("2d");
        this.ctx.webkitImageSmoothingEnabled = false;
        this.ctx.mozImageSmoothingEnabled = false;
        this.ctx.imageSmoothingEnabled = false;
    }
    
    onPressed(){
        for(var i=0;i<this.pressedListeners.length;i++)
                this.pressedListeners[i].event(this.pressed.x,this.pressed.y);
    }
    addPressedListener(listener){this.pressedListeners.push(listener);}
    removePressedListener(listener){
        const index = this.pressedListeners.indexOf(listener);
        if (index !== -1)this.pressedListeners.splice(index, 1);
    }
}
class TextBox extends CentredBase{
    constructor(cx,cy,text,color,fontSZ,ctx,layer){
        super(cx,cy,0,0,layer);
        this.ctx=ctx;
        this.font=fontSZ+"px monospace";
        this.color=color;
        this.setText(text);
    }
    setText(text){
        this.ctx.save();
        this.ctx.font=this.font;
        const mat=this.ctx.measureText(text);
        const hig=(mat.actualBoundingBoxAscent-mat.actualBoundingBoxDescent);
        this.update(this.cx,this.cy,mat.width,hig);
        this.dy=this.y+this.hig;
        this.ctx.restore();
        this.text=text;
    }
    onDraw(ctx){
        ctx.save();
        ctx.font=this.font;
        ctx.fillStyle=this.color;
        ctx.fillText(this.text,this.x,this.dy);
        ctx.restore();
    }
}
class LongTextBox extends Base{
    lines=[]
    constructor(x,y,wid,hig,lnSpacing,text,color,fontSZ,ctx,layer){
        super(x,y,wid,hig,layer);
        
        this.ctx=ctx;
        this.font=fontSZ+"px monospace";
        this.color=color;
        this.lnSpacing=lnSpacing;
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
        ctx.font=this.font;
        ctx.fillStyle=this.color;
        for(var i=0;i<this.lines.length;i++)
            ctx.fillText(this.lines[i],this.x,this.dy+(this.lWid*i));
    }
    setText(text){
        this.lines=[];
        this.ctx.save();
        this.ctx.font=this.font;
        
        let tmpValues=text.split(" ");
        var tmpLN=tmpValues[0];
        this.lWid=this.lnSpacing+this.ctx.measureText(tmpLN).fontBoundingBoxAscent;
        
        for(var i=1;i<tmpValues.length;i++){
            if(this.ctx.measureText(tmpLN+" "+tmpValues[i]).width>this.wid){
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
        this.ctx.restore();
        this.lines.push(...tmpLN.split('\n'));
        
        this.maxY=((this.lines.length+1)*this.lWid)-this.hig;
        this.maxY=this.maxY<0?0:this.maxY;
        this.dy=this.x+this.lWid;
        this.scrollPosi=0;
        this.unitScroll=1/this.maxY;//increament sp so maxy*sp=1 maxy*(x)=1;
        this.text=text;
    }
};
class SpriteBox extends CentredBase{
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