function _(id){
    return document.getElementById(id);
}
function $(tag){
    return document.createElement(tag);
}
window.performance = window.performance || {};
performance.now = (function() {
    return performance.now       ||
        performance.mozNow    ||
        performance.msNow     ||
        performance.oNow      ||
        performance.webkitNow ||            
        Date.now  /*none found - fallback to browser default */
})();

//basic functions shortForm


function loadImages(...inputs){
    var loaded=[];
    var succes = ()=>{};
    var error = ()=>{};
    var len = inputs.length;

    if(typeof inputs[len-2] === "function"){
        error=inputs.pop();
        succes=inputs.pop();
    }
    else if(typeof inputs[len-1] === "function")succes=inputs.pop();

    function tmp(){
        if(inputs.length>0){
            let img =new Image();
            loaded.push(img);
            img.src="images/"+inputs.shift()+".png";
            img.onload=tmp;
        }
        else succes(loaded);
    }
    tmp();
    return loaded;
}