
/*
 * TextBox(cx,cy,text,color,canvas,fontSZ)
 * LongTextBox (x,y,wid,hig,text,color,canvas,fontSZ,lnSpacing);
 */

const game = new RPSgame(document.body);
function KnightvsKnight(){
    game.match=new DebugMatch(game);
    join();
    makeKnight();
    game.match.onPlayerReady();
}

//setTimeout(()=>game.canvas.updateBounds(),4000);
//
//let canvas =new Canvas(500,500);
//document.body.appendChild(canvas.canvas);
//let rect = new TextBox(250,250,20,"white","welecome");
//makeRoundedRect(rect,5,"blue",40,40);
//canvas.addChield(rect);
//
//canvas.drawFrame();
//
//let delayedExecution=setInterval(()=>{
//    console.log("updated Bounds");
//    canvas.updateBounds();
//    clearInterval(delayedExecution);
//},4000);
//
//function logInverse(t){
//    console.log("inverse",1/t);
//}
//
//logInverse(10);