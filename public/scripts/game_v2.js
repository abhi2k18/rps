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
const rColor=[2,3,5];//result color bg
const rTitles=["You Loose","It's Tie","You Win"];
const rSentences=["other player got lucky ....","some time no one wins","Luck always favours the winner"];
const colorPallet={
    green:["#d6ffdd","#00ab11","#689663"],
    red:["#ffdfd6","#ff0000","#966363"],
    grey:["#d9d9d9","#969696","#474747"],
    
};
const pallet=[
    '#2C363F', //bg
    '#BE313F', //opponent a 
    '#DFAFB4', //opponent b
    'grey', //tie , secondary bg
    '#75D66B', //player a
    '#6C9B67'  //player b
];

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
    rematch=false;
    
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
            this.p1.play(this.p1.knight ? this.createCard(...card.getOrigin(),card.ci,pallet[4]):card);
            this.baseLayer.moveToTop(this.p1.card);
            animate(this.p1.card,250,200,100,100,0.4,()=> this.onRoundEnd());
            if(this.p1.first) this.p2.canPlay=true;
            return true;
        }
        else if(this.tostTB) makeToast(this.tostTB,2.5,this.baseLayer); //toast to show why cant you play
    }
    onPlayerRematch(){
        this.p1.rematch=true;
        if(this.p2.rematch)this.game.setPlayModeSelector();
        else this.setMatchScreen();
    }
    
    //methods called to handle opponent UI
    onOtherPlayerRematch(){
        this.p2.rematch=true;
        if(this.p1.rematch)this.game.setPlayModeSelector();
    }
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
            this.p2.play(this.createCard(250,-90,ci,pallet[1]));
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
                    this.cardSlots[this.roundNo].roundRectColor=pallet[rColor[r]];
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
            const card=this.createCard(160+(i*90),400,this.p1.cards[i],pallet[4]);
            makeClickable(card,()=>this.onPlayerPlay(card));
        }
        
    }
    setMatchScreen(){
        this.game.setWaitScreen();
    };
    setReasultScreen(reasult){
        this.p1.canPlay=false;
        this.p2.canPlay=false;//removeing canplay to stop any accssedntal play
        this.p1.rematch=false;
        this.p2.rematch=false;
        this.p1.ready=false;
        this.p2.ready=false;
        
        setTimeout(()=>{
            this.baseLayer.clear();
            this.baseLayer.addChield(new TextBox(250,140,80,pallet[rColor[reasult]],rTitles[reasult]));
            this.baseLayer.addChield(new TextBox(250,260,20,pallet[rColor[reasult]],rSentences[reasult]));
            this.game.AddTextButton(180,360,"Rematch",pallet[1],pallet[4],()=>this.onPlayerRematch());
            this.game.AddTextButton(320,360," Quite ",pallet[4],pallet[1],()=>this.quiteMatch());
        },1000);
    }
    quiteMatch(){this.game.setStartScreen();}
}
class CommunicationHandler{
        
    constructor(game){
        this.toastTB=new TextBox(250,250,180,"white"," only 12 characters allowed ");
        makeRoundedRect(this.toastTB,0,"black",16,8);
        this.game=game;
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
            socket.on("onRematch",()=>{this.onOtherPlayerRematch();});
            
            //room responces
            socket.on("roomreq",(status)=>{
                this.game.baseLayer.clickable=true;
                if(status){
                    this.game.match = new OnlineMatch(this.game);
                    this.game.match.onOtherPlayerJoin();
                }
                else{
                    this.toastTB.setText("Cannot create or join room");
                    makeToast(this.toastTB,2,this.game.baseLayer);
                }
            });
            
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
    onOtherPlayerRematch(){}
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
    sendPlayerRematch(){
        this.socket.emit('playerRematch');
    }
    sendPlayerQuite(){
        this.socket.emit('playerQuite');
    }
    
    //handle room code
    sendRoomReq(name,create){
        if(name.length===0){
            this.toastTB.setText("At least one char require");
            makeToast(this.toastTB,5,this.game.baseLayer);
            return;
        }
        this.game.baseLayer.clickable=false;
        this.toastTB.setText("Wait for server response");
        makeToast(this.toastTB,5,this.game.baseLayer);
        this.socket.emit("roomreq",name,create);
    }
    
    reset(){
        this.onOtherPlayerJoin=function(){};
        this.onOtherPlayerReady=function(mode){};
        this.onOtherPlayerPlay=function(ci){};
        this.onOtherPlayerReveal=function(ci){};
        this.onOtherPlayerQuite=function(){};
        this.onOtherPlayerRematch=function(){};
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
        game.ch.onOtherPlayerRematch=()=>this.onOtherPlayerRematch();
        super(game);
    }
    setMatchScreen(){
        super.setMatchScreen();
        this.game.ch.sendPlayerJoin();//rematch is called
    }
    onPlayerReady(cards){
        super.onPlayerReady(cards);
        this.game.ch.sendPlayerReady(cards);
    }
    onPlayerPlay(card){
        if(super.onPlayerPlay(card))
            this.game.ch.sendPlayerPlayed(card.ci);
    }
    onPlayerRematch(){
        super.onPlayerRematch();
        this.game.ch.sendPlayerRematch();
    }
    quiteMatch(){
        super.quiteMatch();
        this.game.ch.sendPlayerQuite();
        this.hame.ch.reset();
    }
    
    
} //Pending to Write

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
            this.longText.decreamentScroll(3);
            this.updateScrollButton(this.upButton,this.longText.scrollPosi>0);
            this.updateScrollButton(this.downButton,this.longText.scrollPosi<1&&this.longText.maxY>0);
        },10);
        makePressable(this.downButton,()=>{
            this.longText.increamentScroll(3);
            this.updateScrollButton(this.downButton,this.longText.scrollPosi<1&&this.longText.maxY>0);
            this.updateScrollButton(this.upButton,this.longText.scrollPosi>0);
        },10);
        
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
        const container = $("div");
        body.appendChild(container);
        body.style.margin="0";
        body.style.padding="0";
//        body.style.height="100%";
        
        this.canvas=new Canvas(500,500);
        container.appendChild(this.canvas.canvas);
        container.style.width="100vw";
        container.style.height="100vh";
        container.style.position="absulute";
        container.style.display="flex";
        this.canvas.canvas.style.display="block";
        this.canvas.canvas.style.margin="auto";
        
        let resize=()=>{
            if(screen.width<screen.height)this.canvas.canvas.style.width="100vw";
            else this.canvas.canvas.style.width="100vh";
            this.canvas.updateBounds();
        };
        
        window.addEventListener("resize",resize);
        resize();
        
//        this.canvas.setBG ("grey");
        container.style.backgroundColor=pallet[0];
        this.canvas.addChield(makeDrawable({},ctx=>{ctx.fillStyle=pallet[0];ctx.fillRect(0,0,500,500);}));
        
        this.baseLayer= new Layer();
        this.canvas.addChield(this.baseLayer);
        this.baseLayer.addChield(new TextBox(250,250,30,"Grey","Loading ...."));
        
        this.canvas.startDrawing();
        this.cardSprites=loadImages("rock","paper","scissor","card_bg_db","qmark","close","arrow_up",()=>{
            fetch("texts/Rules.txt").then(res =>res.text().then(text=>{
                this.initCommunication();
                this.help=new HelpLayer( this.baseLayer,this.cardSprites[4],this.cardSprites[5],this.cardSprites[6]);
                this.canvas.addChield(this.help);
                this.help.setText(text);
                this.canvas.drawFrame();
                this.setStartScreen();
            }));
        });
    }
    
    setStartScreen(){
        this.baseLayer.clear();
        this.baseLayer.addChield(new TextBox(250,100,40,pallet[4],"Rock Paper Scissor"));
        
        // Rotating Card Animation
        let card = new SpriteBox(250,250,100,100,this.cardSprites[3]);
        card.sprites=this.cardSprites;
        card.flipped=true;
        makeRoundedRect(card,10,pallet[2]);
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
        this.AddTextButton(250,280+100,"QuickMatch",pallet[1],pallet[4],
                ()=>{
                    this.match=new OnlineMatch(this);
                    return true;
                });
        
        //offline match setup
        this.AddTextButton(250,320+100,"OfflinePlay",pallet[1],pallet[4],
                ()=>{
                    this.match=new OfflineMatch(this);
                    return true;
                });
        this.AddTextButton(250,360+100,"PlayWithFriend",pallet[1],pallet[4],
                ()=>{
                    this.setRoomScreen();
                    return true;
                });
        
    }
    setWaitScreen(){
        this.baseLayer.clear();
        
        this.baseLayer.addChield(new TextBox(250,250,20,pallet[3],"Searching For Other Players ....")) ;
        this.AddTextButton(250,300,"Quit",pallet[3],pallet[1],()=>this.setStartScreen());
    }  //wait screen shown till other player joins
    setPlayModeSelector(){
        this.baseLayer.clear();
        this.baseLayer.addChield(new TextBox(250,200,30,pallet[4],"Select playing mode"));
        this.AddTextButton(500/3,300,"Sneaker",pallet[1],pallet[4],()=>this.setCardSelector());
        this.AddTextButton(500/1.5,300,"Knight",pallet[1],pallet[4],()=>this.setReadyScreen());
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
        let selHelp= new TextBox(250,300,15,pallet[3],"Select 3 cards from below");
        this.baseLayer.addChield(selHelp);
        
        let cp=[[180-15,450,60,60],[250,450,60,60],[320+15,450,60,60]];
        let nbtn = this.AddTextButton(450,450,"Next",pallet[1],pallet[4],()=>{
                        this.setReadyScreen(placedCards);
                        return true;
                    });
        nbtn.disable();
        
        let addCard =function (cx,cy,wid,hig,ci){
            if(Selected ===3)return;
            Selected++;
            if(selHelp.visible)selHelp.disable();
            let card=new SpriteBox(cx,cy,wid,hig,this.cardSprites[ci]);
            makeRoundedRect(card,10,pallet[4]);
            
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
        this.baseLayer.addChield(makeClickable(makeRoundedRect(new SpriteBox(...cp[0],this.cardSprites[0]),10,pallet[5]),function(){addCard(...cp[0],0);}));
        this.baseLayer.addChield(makeClickable(makeRoundedRect(new SpriteBox(...cp[1],this.cardSprites[1]),10,pallet[5]),function(){addCard(...cp[1],1);}));
        this.baseLayer.addChield(makeClickable(makeRoundedRect(new SpriteBox(...cp[2],this.cardSprites[2]),10,pallet[5]),function(){addCard(...cp[2],2);}));
        
//        this.AddClickable(new RoundedRect(new SpriteBox(,this.baseLayer),))
//                .onClick=function(){addCard(...cp[0],0);return true;};
//        this.AddClickable(new RoundedRect(new SpriteBox(...cp[1],this.cardSprites[1],this.baseLayer),10,colorPallet.green[0]))
//                .onClick=function(){addCard(...cp[1],1);return true;};
//        this.AddClickable(new RoundedRect(new SpriteBox(...cp[2],this.cardSprites[2],this.baseLayer),10,colorPallet.green[0]))
//                .onClick=function(){addCard(...cp[2],2);return true};
    }
    setReadyScreen(cards){
        this.baseLayer.clear();
        this.baseLayer.addChield(new TextBox(250,250,20,pallet[3],"Waiting For Other Player to Ready",this.canvas.ctx));
        
        //calling setPlayer in match;
        this.match.onPlayerReady(cards);
    }
    setRoomScreen(){
        let baseLayer=this.baseLayer;
        baseLayer.clear();
        let RoomName=new TextBox(250,100,20,pallet[3],"enter your room no");
        let toast_text=new TextBox(250,120,15,"white"," only 12 characters allowed ");
        makeRoundedRect(toast_text,0,"black",10,4);
        let roomNo=[];
        baseLayer.addChield(RoomName);
        const str="+0#123456789";
//        this.AddTextButton(170,150,"clear",pallet[1],pallet[4],addText).setFont(15);
//        this.AddTextButton(330,150," <-- ",pallet[1],pallet[4],addText).setFont(15);
        
        let clear= new TextBox(220,140,15,pallet[1],"clear");
        baseLayer.addChield(clear);
        makeRoundedRect(clear,4,pallet[5],5,5);
        makeClickable(clear,()=>{
            roomNo=[];
            RoomName.setText("");
        });
        let backSpace= new TextBox(280,140,15,pallet[1]," <-- ");
        baseLayer.addChield(backSpace);
        makeRoundedRect(backSpace,4,pallet[5],5,5);
        makeClickable(backSpace,()=>{
            roomNo.pop();
            RoomName.setText(roomNo.join(""));
        });
        
        
        function addText(){
            if(roomNo.length>12){
                makeToast(toast_text,2.5,baseLayer);
                return;
            }
            roomNo.push(this.text);
            RoomName.setText(roomNo.join(""));
        }
        for(var i =0;i<12;i++)
            this.AddTextButton(250+((i%3)-1)*40,250-((Math.floor(i/3))-1)*40,str[i],pallet[1],pallet[5],addText);
        
        this.AddTextButton(170,350,"create",pallet[1],pallet[4],()=>this.ch.sendRoomReq(roomNo.join(""),true));
        this.AddTextButton(330,350," join ",pallet[1],pallet[4],()=>this.ch.sendRoomReq(roomNo.join(""),false));
        this.AddTextButton(250,400," quite ",pallet[4],pallet[1],()=>this.setStartScreen());        
    }
    
    setReasultScreen(reasult){
        this.clearLayer();
        new TextBox(250,230,rSentences[reasult],this.clr,20,this.canvas.ctx,this.baseLayer);
        this.AddTextButton(150,330,"replay",pallet[1],pallet[4]);
        this.AddTextButton(350,330," quit ",pallet[4],pallet[1]);
    }
    initCommunication(){
        this.ch=new CommunicationHandler(this);
    }
}