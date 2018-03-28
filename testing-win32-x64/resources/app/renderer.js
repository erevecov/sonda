// This file is required by the index.html file and will
// be executed in the renderer process for that window.
// All of the Node.js APIs are available in this process.
const os = require('os');
const $ = require('jquery');
const con = require('electron').remote.getGlobal('console');
const cmd = require('node-cmd');

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

    return {
        cpu: {
            loadpercentage: cpu_loadpercentage
        }
    };
};

async function firstInit() {
    let os_caption = await wmic('os get caption');
    let cpu_name = await wmic('cpu get name');
    let cpu_numberofcores = await wmic('cpu get numberofcores');
    let cpu_loadpercentage = await wmic('cpu get LoadPercentage');

    return {
        os: {
            caption: os_caption
        },
        cpu: {
            name: cpu_name,
            numberofcores: cpu_numberofcores,
            loadpercentage: cpu_loadpercentage
        }
    };
}

firstInit().then(res=>{
    $('#os_caption').html(res.os.caption);
    $('#cpu_name').html(res.cpu.name);
    $('#cpu_numberofcores').html(res.cpu.numberofcores);
    $('#cpu_loadpercentage').html(res.cpu.loadpercentage);
});

setInterval(() => {
    intervalData().then(res=>{
        $('#cpu_loadpercentage').html(res.cpu.loadpercentage);
    });

    //$('#hostname').html(os.hostname());
    //$('#ram').html(os.freemem());
    //con.log(os.release());
    //con.log(os.totalmem());
    
    //con.log(machine);
    //$('#cpu_loadpercentage').html(machine.cpu.loadpercentage);
}, 5000);

