function _(id){
    return document.getElementById(id);
}
function $(tag){
    return document.createElement(tag);
}
//basic functions shortForm

function load(name) {
    var promise = new Promise(function(load, error){
        var script = $("script");
        document.body.appendChild(script);
        script.type = "application/javascript";
        script.src = "scripts/"+name;
        script.onload=load;
        script.onerror=error;
    });
    return promise;
}