/* 
 * To change this license header, choose License Headers in Project Properties.
 * To change this template file, choose Tools | Templates
 * and open the template in the editor.
 */


/*
 * 0 rock
 * 1 paper
 * 2 scissor
 */

//static/global variables
const reasult=[
    [1,0,2],
    [2,1,0],
    [0,2,1]
];
const rColor=["red","grey","green"];
const rTitles=["You Loose","It's Tie","You Win"];
const rSentences=["opponent is luckier you loose","WOw you both are on same luck level","You Win Lucky ..."];
const colorPallet={
    green:["#d6ffdd","#00ab11","#689663"],
    red:["#ffdfd6","#ff0000","#966363"],
    grey:["#d9d9d9","#969696","#474747"]
};

//function to manipulate colors
function toHex(numb){
    var hx = numb.toString(16);
    if(hx.length>1)return hx;
    return "0"+hx;
}
function toNumb(hex){
    return parseInt(hex,16);
}
function toRGB(color){
    return {
        R:toNumb(color.substr(1,2)),
        B:toNumb(color.substr(3,2)),
        G:toNumb(color.substr(5,2))
    };
}
function toColor(r,g,b){
    return '#'+toHex(r)+toHex(g)+toHex(b);
}

class Player{
    ready=false;
    knight=true;
    canPlay=false;
    played=false;
    revealed=false;
    card=null;
    
    init(cards){
        this.ready=true;
        this.cards=cards||[0,1,2];
        this.knight=cards===undefined;
    }
    isTurnBased(p2){
        let tb=this.knight!==p2.knight;
        this.first=tb&&this.knight;
        p2.first=tb&&p2.knight;
        return tb;//reurnt is Turnbased
    }
    play(card){
        this.canPlay=false;
        this.played=true;
        this.revealed=card.ci<3;
        this.card=card;
        this.card.clickable=false;
        this.ci=card.ci;
    }
    reset(){
        this.played=false;
        this.revealed=false;
    }
}
class Match{
    //Handeling UI and exchange data between players
    
    //useful flags
    isTurnBased = false;
    
    p1=new Player();//current player
    p2=new Player();//other player
    
    roundNo=-1;
    cardSlots=[];
    
    //some animation stuff
    wid=70;     // initial wid hig
    wid2=100;   // wid at centr after playing
    wid3=40;    // minised wid to disolay in corner
    
    ecx=350;     // after ending round cards goin to
    ecy=100;     // start from here
    
    constructor(game){
        this.baseLayer=game.baseLayer;
        this.game=game;
        this.setMatchScreen();
    }
    
    createCard(cx,cy,ci,bg){
        let card = new SpriteBox(cx,cy,this.wid,this.wid,this.game.cardSprites[ci]);
        card.ci=ci;
        makeRoundedRect(card,10,bg);
        this.baseLayer.addChield(card);
        return card;
    }
    start(){
//        if(this.isPlayerReady&&this.isOtherPlayerReady) // checkimg is done befor calling this method
        this.roundNo=-1;
        this.p1.win=0;
        this.p2.win=0;
        this.isTurnBased=this.p2.isTurnBased(this.p1);
        
        //setup Tost Text Box
        if(this.p2.first){
            this.tostTB=new TextBox(250,300,15,"white","your sneaker wait for other player to play");
            makeRoundedRect(this.tostTB,5,"black",10,10);
        }
        
        this.setGameScreen();
        this.startNewRound();//starting new round
    }
    
    //player methods
    onPlayerReady(cards){
        this.p1.init(cards);
        if(this.p2.ready)this.start();
    }
    onPlayerPlay(card){
        if(this.p1.canPlay){
            //create New Card to Animate or use old one according to player mode
            this.p1.play(this.p1.knight ? this.createCard(...card.getOrigin(),card.ci,colorPallet.green[1]):card);
            this.baseLayer.moveToTop(this.p1.card);
            animate(this.p1.card,250,200,100,100,0.4,()=> this.onRoundEnd());
            if(this.p1.first) this.p2.canPlay=true;
            return true;
        }
        else if(this.tostTB) makeToast(this.tostTB,2.5,this.baseLayer); //toast to show why cant you play
    }
    
    //methods called to handle opponent UI
    onOtherPlayerJoin(){this.game.setPlayModeSelector();}
    onOtherPlayerReady(isKnight){
        this.p2.knight=isKnight;
        this.p2.ready=true;
        if(this.p1.ready)this.start();//setup manually
    }
    onOtherPlayerPlay(ci){
        if(this.p2.canPlay){
            this.p2.ci=ci;
            this.p1.canPlay=(!this.p1.played)||this.p2.first;
            this.p2.play(this.createCard(250,-90,ci,colorPallet.red[1]));
            animate(this.p2.card,250,200-this.wid2-10,this.wid2,this.wid2,0.4,()=>{
                this.isOtherPlayerRevelead=ci<3;
                this.isOtherPlayerPlayed=true;
                this.onRoundEnd();
            });
            return true;
        }
    }
    onOtherPlayerReveal(ci){
        this.p2.ci=ci;
        let flip = ()=>{
            this.p2.revealed=true;
            this.p2.card.img=this.game.cardSprites[ci];
            animate(this.p2.card,250,200-this.wid2-10,this.wid2,this.wid2,0.3,()=>this.onRoundEnd());
        };
        this.p2.card.onEnd=function(){
            animate(this,...this.getOrigin(),1,this.hig,0.3,flip);
        }.bind(this.p2.card);
        if(!this.p2.card.animated)this.p2.card.onEnd();
    }
    
    //round end functions
    onRoundEnd(){
        if(this.p2.revealed&&this.p1.revealed){
            setTimeout(()=>{
                animate(this.p2.card,this.ecx+(this.roundNo*(this.wid3+10)),this.ecy,this.wid3,this.wid3,0.5);
                animate(this.p1.card,this.ecx+(this.roundNo*(this.wid3+10)),this.ecy+this.wid3+2,this.wid3,this.wid3,0.5,()=>{
                    let r=reasult[this.p1.ci][this.p2.ci];
                    if(r===0)this.p2.win++;
                    else if(r===2)this.p1.win++;
                    this.cardSlots[this.roundNo].roundRectColor=colorPallet[rColor[r]][2];
                    this.startNewRound();
                });
            },800);
                
            this.p1.reset();
            this.p2.reset();
        }
    }
    startNewRound(){
        this.roundNo++;//increament round no
        this.p1.canPlay= this.p1.first || (!this.isTurnBased);//first is set if only turnbased
        this.p2.canPlay= this.p2.first || (!this.isTurnBased);
        this.p1.played=false;
        this.p2.played=false;
        if(this.p2.win===2)this.setReasultScreen(0);         //loose
        else if(this.p1.win===2)this.setReasultScreen(2);    //won
        else if(this.roundNo===3)this.setReasultScreen(1);   //tie
    }//called enable playing of current playe  r
    
    //changeScreens
    setGameScreen(){
        this.baseLayer.clear();
        //setup bg at end of cards
        this.cardSlots=[];
        for(var i=0;i<3;i++){
            let rect=new Rect(
                    this.ecx+(i*(this.wid3+10))-this.wid3/2,
                    this.ecy-this.wid3/2,
                    this.wid3,
                    2*this.wid3+2);
            makeRoundedRect(rect,10,"black",5,5);
            this.baseLayer.addChield(rect);
            this.cardSlots.push(rect);// little improvements can done
        }
        
        //setup cards to play
        this.baseLayer.addChield(makeRoundedRect(new Rect(100,350,300,100),10,"black"));//playable Cards BG
        for (var i = 0; i < 3; i++){
            const card=this.createCard(160+(i*90),400,this.p1.cards[i],colorPallet.green[1]);
            makeClickable(card,()=>this.onPlayerPlay(card));
        }
        
    }
    setMatchScreen(){this.game.setWaitScreen();};
    setReasultScreen(reasult){
        this.p1.canPlay=false;
        this.p2.canPlay=false;//removeing canplay to stop any accssedntal play
        
        setTimeout(()=>{
            this.baseLayer.clear();
            this.baseLayer.addChield(new TextBox(250,200,20,colorPallet[rColor[reasult]][1],rTitles[reasult]));
            this.baseLayer.addChield(new TextBox(250,260,20,colorPallet[rColor[reasult]][1],rSentences[reasult]));
            this.game.AddTextButton(150,300,"Rematch",colorPallet.green[0],colorPallet.grey[2],()=>this.setMatchScreen());
            this.game.AddTextButton(350,300," Quite ",colorPallet.green[0],colorPallet.grey[2],()=>this.quiteMatch());
        },1000);
    }
    quiteMatch(){this.game.setStartScreen();}
}
class CommunicationHandler{
        
    constructor(){
        try{
            let socket = io.connect('/');
            
            socket.on("t0",()=>{socket.emit("t1")});    //Self Responce for ping Testing
            
            socket.on("connect",()=>{this.onConnect();});
            socket.on("disconnect",()=>{this.onDisconnect();});
            socket.on("setPing",(ping)=>{this.onSetPing(ping)});
            
            //setting other player methethods 
            socket.on("onOtherPlayerJoin",()=>{this.onOtherPlayerJoin();});
            socket.on("onOtherPlayerReady",(mode)=>{this.onOtherPlayerReady(mode);});
            socket.on("onOtherPlayerPlay",(ci)=>{this.onOtherPlayerPlay(ci);});
            socket.on("onOtherPlayerReveal",(ci)=>{this.onOtherPlayerReveal(ci);});
            socket.on("onOtherPlayerQuite",()=>{this.onOtherPlayerQuite();});
            
            this.socket=socket;
            //player methods
            
//            socket.on("",()=>{});
        }
        catch(e){ console.log(e);}
    }
    
    //ovrridable events
    onConnect(){}
    onDisconnect(){}
    onSetPing(ping){}
    
    //other Player Methods
    onOtherPlayerJoin(){}
    onOtherPlayerReady(mode){}
    onOtherPlayerPlay(ci){}
    onOtherPlayerReveal(ci){}
    onOtherPlayerQuite(){}
    
    //send to server
    reqPing(){
        this.socket.emit("t0");
    }
    
    sendPlayerJoin(){
        this.socket.emit("playerJoin");
    }
    sendPlayerReady(cards){
        this.socket.emit("playerReady",cards);
    }
    sendPlayerPlayed(ci){
        this.socket.emit("playerPlayed",ci);
    }
    sendPlayerQuite(){
        this.socket.emit('playerQuite');
    }
}

class OfflineMatch extends Match{
    setMatchScreen(){
        super.setMatchScreen();
        this.onOtherPlayerJoin(Math.random()>0.5);
    }
    onPlayerReady(cards){
        super.onPlayerReady(cards);
        this.onOtherPlayerReady(true);//for testing always knight
        if(this.isTurnBased)console.log("Needed Stategry");
    }
    onPlayerPlay(card){
        super.onPlayerPlay(card);
        if(!this.p2.played)this.onOtherPlayerPlay(Math.floor(Math.random()*3));
    }
    startNewRound(){
        super.startNewRound();
        if(this.p2.first)this.onOtherPlayerPlay(Math.floor(Math.random()*3));
    }
}//offline Play with ai
class OnlineMatch extends Match{
    constructor(game){
        //setup listnersa in ch
        game.ch.onOtherPlayerJoin=()=>this.onOtherPlayerJoin();
        game.ch.onOtherPlayerReady=(knight)=>this.onOtherPlayerReady(knight);
        game.ch.onOtherPlayerPlay=(ci)=>this.onOtherPlayerPlay(ci);
        game.ch.onOtherPlayerReveal=(ci)=>this.onOtherPlayerReveal(ci);
        game.ch.onOtherPlayerQuite=()=>this.game.setStartScreen(); //no need of any steps as p2 quite rematch is not possible
        super(game);
    }
    setMatchScreen(){
        super.setMatchScreen();
        this.game.ch.sendPlayerJoin();
    }
    onPlayerReady(cards){
        super.onPlayerReady(cards);
        this.game.ch.sendPlayerReady(cards);
    }
    onPlayerPlay(card){
        if(super.onPlayerPlay(card))
            this.game.ch.sendPlayerPlayed(card.ci);
    }
    quiteMatch(){
        super.quiteMatch();
        this.game.ch.sendPlayerQuite();
    }
    
    
} //Pending to Write

class DebugMatch extends Match{
    constructor(game){
        super(game);
        console.log("to join use join()");
        window.join=()=>this.onOtherPlayerJoin();
    }
    onOtherPlayerJoin(){
        super.onOtherPlayerJoin();
        window.makeKnight=function(){
            this.selectedCard=[0,1,2];
            this.onOtherPlayerReady(true);
        }.bind(this);
        window.makeSneaker=function(...cards){
            this.selectedCard=[];
            for(var i=0;i<3;i++)if(this.cardIndex[cards[i]]===undefined){
                console.log(`invalid card (${cards[i]}) selected`);
            }
                else this.selectedCards.push(this.cardIndex[cards[i]]);
            this.onOtherPlayerReady(false);
        }.bind(this);
        
        window.play=function(ci){
            if(this.selectedCard[ci]===undefined)
                console.log(`invalid card (${ci}) played yor avialable options are ${this.slesctedCard}`);
            else{
                this.playedCard=ci;
                this.onOtherPlayerPlay(this.reveal ?  ci:3);
            }
        }.bind(this);
        console.log("0=rock,1=paper,2=scissor");
        console.log("call makeKnight() or makeSneaker(c1,c2,c2) to move next");
    }
    onOtherPlayerReady(isKnight){
        super.onOtherPlayerReady(isKnight);
        console.log("waiting for other player to complete");
    }
    onPlayerPlay(... arg){
        console.log(this.p1.canPlay);
        super.onPlayerPlay(...arg);
        if(this.p2.played&&!this.p2.revealed)this.onOtherPlayerReveal(this.playedCard);
        this.reveal=true;
    }
    startNewRound(){
        super.startNewRound();
        this.reveal=this.p2.first;
        console.log("p1 wins",this.p1.win);
        console.log("p2 wins",this.p2.win);
    }
    start(){
        super.start();
        console.log("you can play using play(card_no)");
        console.log(`avialable options are ${this.slesctedCard}`);
    }
}

class HelpLayer extends Layer{
    textLayer=new Layer();
    constructor(baseLayer,helpImg,closeImg,up){
        super ();
        this.baseLayer=baseLayer;
        this.textLayer.disable();
        this.addChield(this.textLayer);
        
        //help Button Setup
        this.helpButton=new SpriteBox(450,50,60,60,helpImg,this);
        this.addChield(this.helpButton);
        this.showSprite=helpImg;
        this.hideSprite=closeImg;
        makeClickable(this.helpButton,()=>{
            if(this.textLayer.visible)this.hideHelp();
            else this.showHelp();
        });
        
        //help View transperent BG
        this.textLayer.addChield(makeDrawable({},function(ctx){
            ctx.globalAlpha=0.8;
            ctx.fillStyle="white";
            ctx.fillRect(0,0,500,500);
            ctx.globalAlpha=1;
        }));
        
        //scrollable Long Text View setup 
        this.longText=new LongTextBox(50,50,400,400,4,20,"blue","text");
        this.upButton=new SpriteBox (250,25,50,50,up);
        this.downButton = new Rect(225,450,50,50);
        makeDrawable(this.downButton,function(ctx){
            ctx.scale(1,-1);
            ctx.drawImage(up,this.x,-this.y,this.wid,-this.hig);
        },true);
        makePressable(this.upButton,()=>{
            this.longText.decreamentScroll(10);
            this.updateScrollButton(this.upButton,this.longText.scrollPosi>0);
            this.updateScrollButton(this.downButton,this.longText.scrollPosi<1&&this.longText.maxY>0);
        });
        makePressable(this.downButton,()=>{
            this.longText.increamentScroll(10);
            this.updateScrollButton(this.downButton,this.longText.scrollPosi<1&&this.longText.maxY>0);
            this.updateScrollButton(this.upButton,this.longText.scrollPosi>0);
        });
        
        this.textLayer.addChield(this.longText);
        this.textLayer.addChield(this.upButton);
        this.textLayer.addChield(this.downButton);
        
    }
    showHelp(){
        this.helpButton.switchImage(this.hideSprite);
        this.textLayer.enable();
        this.baseLayer.clickable = false;
        this.baseLayer.pressable = false;//desable baseLayer Events
    }
    hideHelp(){
        this.helpButton.switchImage(this.showSprite);
        this.textLayer.disable();
        this.baseLayer.clickable = true;
        this.baseLayer.pressable = true;//enable baseLayer Events
    }
    updateScrollButton(button,bool){
        if(bool)button.enable();
        else button.disable();
    }
    setText(text){
        this.longText.setText(text);

        this.updateScrollButton(this.upButton,this.longText.scrollPosi>0);
        this.updateScrollButton(this.downButton,this.longText.scrollPosi<1&&this.longText.maxY>0);
    }
//    onMove(px,py,id){
//        console.log(px,py,id);
//        super.onMove(px,py,id);
//    }
}
class RPSgame {
    cardSprites = [];
    
    AddTextButton(cx,cy,text,color,bgColor,onclick){
        let sText=new TextBox(cx,cy,30,color,text);
        makeRoundedRect(sText,20,bgColor,20,20);
        makeClickable(sText,onclick);
        this.baseLayer.addChield(sText);
        return sText;
    }
    constructor(body){
        this.canvas=new Canvas(500,500);
        body.appendChild(this.canvas.canvas);
        
//        this.canvas.setBG ("grey");
        this.canvas.addChield(makeDrawable({},ctx=>{ctx.fillStyle=colorPallet.grey[0];ctx.fillRect(0,0,500,500);}));
        
        this.baseLayer= new Layer();
        this.canvas.addChield(this.baseLayer);
        this.baseLayer.addChield(new TextBox(250,250,30,"Grey","Loading ...."));
        
        this.canvas.startDrawing();
        this.cardSprites=loadImages("rock","paper","scissor","card_bg","qmark","close","arrow_up",()=>{
            fetch("texts/Rules.txt").then(res =>res.text().then(text=>{
                this.initCommunication();
                this.help=new HelpLayer( this.baseLayer,this.cardSprites[4],this.cardSprites[5],this.cardSprites[6]);
                this.canvas.addChield(this.help);
                this.help.setText(text);
                this.canvas.drawFrame();
                this.setStartScreen();
//                this.setCardSelector();
//                this.setCololrPicker(2);
            }));
        });
    }
    
    setStartScreen(){
        this.baseLayer.clear();
        this.baseLayer.addChield(new TextBox(250,100,40,"#99fff5","Rock Paper Scissor"));
        
        // Rotating Card Animation
        let card = new SpriteBox(250,250,100,100,this.cardSprites[3]);
        card.sprites=this.cardSprites;
        card.flipped=true;
        makeRoundedRect(card,10,colorPallet.green[0]);
        let setTransform=function(){
                if(this.wid===1){
                    //Change card
                    this.switchImage (this.sprites[this.flipped ? Math.floor(Math.random()*3):3]);
                    this.flipped=!this.flipped;
                    animate(card,250,250,100,100,0.3,setTransform);
                }else setTimeout(()=>animate(card,250,250,1,100,0.34,setTransform), 1000);
                
            }.bind(card);
        setTransform();
        
        this.baseLayer.addChield(card);
        
        //onlinematch setup
        this.AddTextButton(250,280+100,"QuickMatch","Green","#e0ffed",
                ()=>{
                    this.match=new OnlineMatch(this);
                    return true;
                });
        
        //offline match setup
        this.AddTextButton(250,320+100,"OfflinePlay","Green","#e0ffed",
                ()=>{
                    this.match=new OfflineMatch(this);
                    return true;
                });
        
    }
    setWaitScreen(){
        this.baseLayer.clear();
        
        this.baseLayer.addChield(new TextBox(250,250,20,"Black","Searching For Other Players ....")) ;
        this.AddTextButton(250,300,"Quit","#ffd4d1","#690c05",()=>this.setStartScreen());
    }  //wait screen shown till other player joins
    setPlayModeSelector(){
        this.baseLayer.clear();
        this.baseLayer.addChield(new TextBox(250,200,30,"#99fff5","Select playing mode"));
        this.AddTextButton(500/3,300,"Sneaker","Green","#e0ffed",()=>this.setCardSelector());
        this.AddTextButton(500/1.5,300,"Knight","Green","#e0ffed",()=>this.setReadyScreen());
    }
    setCardSelector(){
        this.baseLayer.clear();
        
        let Selected =0;
        let placedCards={
            0:false,
            1:false,
            2:false
        };
        
        this.baseLayer.addChield(makeRoundedRect(new Rect(100,250,300,100),15,"black"));
        let selHelp= new TextBox(250,300,15,"white","Select 3 cards from below");
        this.baseLayer.addChield(selHelp);
        
        let cp=[[180-15,450,60,60],[250,450,60,60],[320+15,450,60,60]];
        let nbtn = this.AddTextButton(450,450,"Next","Green","#e0ffed",()=>{
                        this.setReadyScreen(placedCards);
                        return true;
                    });
        nbtn.disable();
        
        let addCard =function (cx,cy,wid,hig,ci){
            if(Selected ==3)return;
            Selected++;
            if(selHelp.visible)selHelp.disable();
            let card=new SpriteBox(cx,cy,wid,hig,this.cardSprites[ci]);
            makeRoundedRect(card,10,colorPallet.green[1]);
            
            this.baseLayer.addChield(card);
            for(var i =0;i<3;i++)if(placedCards[i]===false){
                placedCards[i]=ci;
                animate(card,160+(i*90),300,70,70,0.5,()=>{
                    makeClickable(card,function(){
                            this.disable();
                            placedCards[i]=false;
                            Selected--;
                            if(nbtn.visible){
                                nbtn.disable();
                            }
                    });
                });
                break;
            }
            if(Selected ===3)nbtn.enable();
        }.bind(this);
         
         //most unreadable thing add bottom 3 cards
        this.baseLayer.addChield(makeClickable(makeRoundedRect(new SpriteBox(...cp[0],this.cardSprites[0]),10,colorPallet.green[0]),function(){addCard(...cp[0],0);}));
        this.baseLayer.addChield(makeClickable(makeRoundedRect(new SpriteBox(...cp[1],this.cardSprites[1]),10,colorPallet.green[0]),function(){addCard(...cp[1],1);}));
        this.baseLayer.addChield(makeClickable(makeRoundedRect(new SpriteBox(...cp[2],this.cardSprites[2]),10,colorPallet.green[0]),function(){addCard(...cp[2],2);}));
        
//        this.AddClickable(new RoundedRect(new SpriteBox(,this.baseLayer),))
//                .onClick=function(){addCard(...cp[0],0);return true;};
//        this.AddClickable(new RoundedRect(new SpriteBox(...cp[1],this.cardSprites[1],this.baseLayer),10,colorPallet.green[0]))
//                .onClick=function(){addCard(...cp[1],1);return true;};
//        this.AddClickable(new RoundedRect(new SpriteBox(...cp[2],this.cardSprites[2],this.baseLayer),10,colorPallet.green[0]))
//                .onClick=function(){addCard(...cp[2],2);return true};
    }
    setReadyScreen(cards){
        this.baseLayer.clear();
        this.baseLayer.addChield(new TextBox(250,250,20,"Black","Waiting For Other Player to Ready",this.canvas.ctx));
        
        //calling setPlayer in match;
        this.match.onPlayerReady(cards);
    }
    
    setReasultScreen(reasult){
        this.clearLayer();
        new TextBox(250,230,rSentences[reasult],this.clr,20,this.canvas.ctx,this.baseLayer);
        this.AddTextButton(150,330,"replay","white","green");
//                .onClick=()=>{
//            reasult++;
//            if(reasult===3)reasult=0;
//            this.setReasultScreen(reasult);
//        };
        this.AddTextButton(350,330," quit ","white","red");
//                .onClick=()=>{
//            this.canvas.setBG(bg.value);
//            this.clr=fgc.value;
//            this.setReasultScreen(reasult);
//        };
    }
    
    setCololrPicker(){
            this.baseLayer.clear();
        var sClr=toRGB(colorPallet.bg);
        var r,g,b;
        function updateColor(){};
        function selectColor(name,index){
            console.log(name,index);
            let clr;
            if(index===undefined){
                updateColor=function(){colorPallet.bg=toColor(sClr.R,sClr.G,sClr.B);};
                clr=toRGB(colorPallet.bg);
            }
            else {
                updateColor=function(){colorPallet[name][index]=toColor(sClr.R,sClr.G,sClr.B);};
                clr=toRGB(colorPallet[name][index]);
            }
            sClr=clr;
            r.setText(clr.R);
            g.setText(clr.G);
            b.setText(clr.B);
        }
        
        var addColorButton=(name,x)=>{
            console.log(this);
            let tb= new TextBox(x,300,name+": "+toHex(sClr[name]),"white",20);
            this.baseLayer.addChield(tb);
            this.AddTextButton(x,330,"+1","white","black").onClick=()=>{
                sClr[name]++;
                tb.setText(name+": "+toHex(sClr[name]));
            };
            this.AddTextButton(x,270,"-1","white","black").onClick=()=>{
                sClr[name]--;
                tb.setText(name+": "+toHex(sClr[name]));
            };
            return tb;
        };
        
        r=addColorButton("R",150);
        g=addColorButton("G",250);
        b=addColorButton("B",350);
        
        let bg= new CentredBase(250,200,60,60,this.baseLayer,function(ctx){
            ctx.fillStyle=colorPallet.bg;
            ctx.beginPath();
            ctx.rect(this.x,this.y,this.wid,this.hig);
            ctx.closePath();
            ctx.fill();
            ctx.stroke();
        });
        this.AddClickable(bg).onClick=()=>{
            selectColor("bg");
            return true;
        };
        
        let c1=new CentredBase(250,100,120,40,this.baseLayer,function(ctx){
            ctx.fillStyle=colorPallet.green[0];
            ctx.fillRect(this._x1,this.y,this._wid,this.hig);
            ctx.fillStyle=colorPallet.green[1];
            ctx.fillRect(this._x2,this.y,this._wid,this.hig);
            ctx.fillStyle=colorPallet.green[2];
            ctx.fillRect(this._x3,this.y,this._wid,this.hig);
        });
        c1._wid=c1.wid/3;
        c1._x1=c1.x;
        c1._x2=c1.x+c1._wid;
        c1._x3=c1.x+2*c1._wid;
        
        this.AddClickable(c1).onClick = function(px){
            selectColor("green",this.base._x2>px ? 0 :(this.base._x3>px ? 1:2));
            return true;
        };
        
        let c2=new CentredBase(120,100,120,40,this.baseLayer,function(ctx){
            ctx.fillStyle=colorPallet.red[0];
            ctx.fillRect(this._x1,this.y,this._wid,this.hig);
            ctx.fillStyle=colorPallet.red[1];
            ctx.fillRect(this._x2,this.y,this._wid,this.hig);
            ctx.fillStyle=colorPallet.red[2];
            ctx.fillRect(this._x3,this.y,this._wid,this.hig);
        });
        c2._wid=c2.wid/3;
        c2._x1=c2.x;
        c2._x2=c2.x+c2._wid;
        c2._x3=c2.x+2*c2._wid;
        
        this.AddClickable(c2).onClick = function(px){
            selectColor("red",this.base._x2>px ? 0 :(this.base._x3>px ? 1:2));
            return true;
        };
        
        let c3=new CentredBase(380,100,120,40,this.baseLayer,function(ctx){
            ctx.fillStyle=colorPallet.grey[0];
            ctx.fillRect(this._x1,this.y,this._wid,this.hig);
            ctx.fillStyle=colorPallet.grey[1];
            ctx.fillRect(this._x2,this.y,this._wid,this.hig);
            ctx.fillStyle=colorPallet.grey[2];
            ctx.fillRect(this._x3,this.y,this._wid,this.hig);
        });
        c3._wid=c3.wid/3;
        c3._x1=c3.x;
        c3._x2=c3.x+c3._wid;
        c3._x3=c3.x+2*c3._wid;
        
        this.AddClickable(c3).onClick = function(px){
            selectColor("grey",this.base._x2>px ? 0 :(this.base._x3>px ? 1:2));
            return true;
        };
        
    }
    startDebugGame(){
        this.match=new DebugMatch(this);
    }
    initCommunication(){
        this.ch=new CommunicationHandler();
        this.ch.onConnect=()=>console.log("conbected");
    }
}