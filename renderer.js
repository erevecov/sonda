// This file is required by the index.html file and will
// be executed in the renderer process for that window.
// All of the Node.js APIs are available in this process.
const os = require('os');
const $ = require('jquery');
const con = require('electron').remote.getGlobal('console');
const cmd = require('node-cmd');
const powershell = require("powershell");

let machine = {};
let totalmem = 0;

function cleanData(data) {
    let cleanData = data.replace(/\n|\r/g,'');
    cleanData = cleanData.split('=');
    return cleanData[1];
}

function wmic(wmicString) {
    return new Promise(resolve=>{
        cmd.get(
            'wmic '+wmicString+' /value',
            function(err, data, stderr){
                resolve(cleanData(data));
            }
        );
    });
}

async function intervalData() {  
    let cpu_loadpercentage = await wmic('cpu get LoadPercentage');
    let os_freephysicalmemory = await wmic('os get freephysicalmemory');
    
    machine = {
        cpu: {
            loadpercentage: cpu_loadpercentage
        },
        memory: {
            freephysicalmemory: (os_freephysicalmemory/1024).toFixed(),
            usedphysicalmemory: (totalmem-(os_freephysicalmemory/1024)).toFixed(),
            percentphysicalmemory: (((totalmem-(os_freephysicalmemory/1024)).toFixed() / totalmem) * 100).toFixed()
        }
    }; 

    return machine;
};

async function firstInit() {
    let os_csname = await wmic('os get csname');
    let os_caption = await wmic('os get caption');
    let cpu_osarchitecture = await wmic('cpu get addresswidth');
    let cpu_cpuarchitecture = await wmic('cpu get datawidth');
    let cpu_name = await wmic('cpu get name');
    let cpu_numberofcores = await wmic('cpu get numberofcores');
    let cpu_loadpercentage = await wmic('cpu get loadpercentage');
    let computersystem_totalphysicalmemory = await wmic('computersystem get totalphysicalmemory');
    let os_freephysicalmemory = await wmic('os get freephysicalmemory');

    totalmem = (computersystem_totalphysicalmemory/1024)/1024;

    machine = {
        os: {
            csname: os_csname,
            caption: os_caption,
            architecture: cpu_osarchitecture
        },
        cpu: {
            name: cpu_name,
            numberofcores: cpu_numberofcores,
            loadpercentage: cpu_loadpercentage,
            architecture: cpu_cpuarchitecture
        },
        memory:{
            totalphysicalmemory: ((computersystem_totalphysicalmemory/1024)/1024).toFixed(),
            freephysicalmemory: (os_freephysicalmemory/1024).toFixed(),
            usedphysicalmemory: (((computersystem_totalphysicalmemory/1024)/1024)-(os_freephysicalmemory/1024)).toFixed(),
            percentphysicalmemory: (((totalmem-(os_freephysicalmemory/1024)).toFixed() / totalmem) * 100).toFixed()
        }
    };

    return machine;
}

firstInit().then(res=>{
    $('#os_csname').html(res.os.csname);
    $('#os_caption').html(res.os.caption);
    $('#cpu_name').html(res.cpu.name);
    $('#cpu_numberofcores').html(res.cpu.numberofcores);
    $('#cpu_loadpercentage').html(res.cpu.loadpercentage);
    $('#computersystem_totalphysicalmemory').html(res.memory.totalphysicalmemory);
    $('#os_usedphysicalmemory').html(res.memory.usedphysicalmemory); 
    $('#os_freephysicalmemory').html(res.memory.freephysicalmemory);
    $('#os_architecture').html(res.os.architecture);
    $('#cpu_architecture').html(res.cpu.architecture);
    $('#os_percentphysicalmemory').html(res.memory.percentphysicalmemory);
});

setInterval(() => {
    intervalData().then(res=>{
        $('#cpu_loadpercentage').html(res.cpu.loadpercentage);
        $('#os_freephysicalmemory').html(res.memory.freephysicalmemory);
        $('#os_usedphysicalmemory').html(res.memory.usedphysicalmemory);
        $('#os_percentphysicalmemory').html(res.memory.percentphysicalmemory);
    });

    //$('#hostname').html(os.hostname());
    //$('#ram').html(os.freemem());
    //con.log(os.release());
    //con.log(os.totalmem());
    
    //con.log(machine);
    //$('#cpu_loadpercentage').html(machine.cpu.loadpercentage);
}, 5000);

/*
setInterval(()=>{
    new powershell('get-process')
    .on("output", data => {
        con.log(data);
    });
    
},5000)
*/