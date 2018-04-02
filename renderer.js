// This file is required by the index.html file and will
// be executed in the renderer process for that window.
// All of the Node.js APIs are available in this process.
const os = require('os');
const $ = require('jquery');
const cmd = require('node-cmd');
const powershell = require("powershell");
const wmic = require('wmic-js');
const fs = require('fs');

let machine = {};
let totalmem = 0;
let token = '';
let server = '';

$(document).ready(function(){
    getConfig().then(data=>{
        console.log(data);
        server = data.server;
        token = data.token;

        $('#server').val(data.server);
        $('#token').val(data.token);
    });

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
        $('#os_lastbootuptime').html(res.os.lastbootuptime);
        $('#os_localdatetime').html(res.os.localdatetime);
    
        /*
        res.disk.forEach(element => {
            console.log(element)
        });
        */
    });
    
    
    setInterval(() => {
        intervalData().then(res=>{
            $('#cpu_loadpercentage').html(res.cpu.loadpercentage);
            $('#os_freephysicalmemory').html(res.memory.freephysicalmemory);
            $('#os_usedphysicalmemory').html(res.memory.usedphysicalmemory);
            $('#os_percentphysicalmemory').html(res.memory.percentphysicalmemory);
            $('#os_localdatetime').html(res.os.localdatetime);
        });
    }, 5000);
});

$('#config').on('submit', function(e) {
    e.preventDefault();
    console.log('test');
});

function getConfig() {
    return new Promise(resolve=>{
        fs.readFile('./config.json', 'utf8', function (err, data) {
            if (err) throw err;
            resolve(JSON.parse(data));
        });
    });
}

function wmicHandler(alias, arr) {
    return new Promise(resolve=>{
        wmic().alias(alias).get(arr).then(data=>{
            resolve(data);
        });
    });
}

function sendData(data) {
    ajax({
        url: server+'/api/monitoring',
        type: 'POST',
        data: {
            mon: JSON.stringify(data),
            token: token
        }
    }).then(res=>{
        console.log('yes');
    }).catch(res=>{
        console.log('no');
    });
}

function diskHandler(logicalDisk) {
    return new Promise(resolve=>{
        let diskInfo = logicalDisk.reduce(function(results, disk) {
            let newDisk = { 
                caption: disk.Caption,
                description: disk.Description,
                name: disk.Name,
                size: parseInt(disk.Size)/1024,
                freespace: parseInt(disk.FreeSpace)/1024
            };

            if(disk.DriveType == '2') {
                newDisk.type = 'removable';
            } else if(disk.DriveType == '3') {
                newDisk.type = 'local';
            } else if(disk.DriveType == '4') {
                newDisk.type = 'net';
            } else if(disk.DriveType == '5') {
                newDisk.type = 'cd';
                newDisk.volumename = disk.VolumeName;
            }

            if(newDisk.type == 'cd') {
                if(newDisk.size > 0) {
                    results.push(newDisk);
                }
            } else {
                results.push(newDisk);
            }
            
            return results;
        }, []);

        resolve(diskInfo);
    });
}

async function intervalData() {  
    let cpu = await wmicHandler('cpu', [
        'loadpercentage'
    ]);

    let os = await wmicHandler('os', [
        'freephysicalmemory',
        'localdatetime'
    ]);

    let logicaldisk = await wmicHandler('logicaldisk', [
        'size',
        'freespace',
        'caption',
        'drivetype',
        'description',
        'name',
        'volumename'
    ]);

    let localDate = os[0].LocalDateTime.split('.')[0]; 
    localDate = `${localDate.slice(6, 8)}/${localDate.slice(4, 6)}/${localDate.slice(0, 4)} ${localDate.slice(8, 10)}:${localDate.slice(10, 12)}:${localDate.slice(12, 14)}`;

    let disk = await diskHandler(logicaldisk);    

    machine.os.localdatetime = localDate;
    machine.cpu.loadpercentage = cpu[0].LoadPercentage;
    machine.memory.freephysicalmemory = (os[0].FreePhysicalMemory/1024).toFixed();
    machine.memory.usedphysicalmemory = (totalmem-(os[0].FreePhysicalMemory/1024)).toFixed();
    machine.memory.percentphysicalmemory = (((totalmem-(os[0].FreePhysicalMemory/1024)).toFixed() / totalmem) * 100).toFixed();
    machine.disk = disk;

    /*
    machine = {
        os: {
            localdatetime: localDate        
        },
        cpu: {
            loadpercentage: cpu[0].LoadPercentage
        },
        memory: {
            freephysicalmemory: (os[0].FreePhysicalMemory/1024).toFixed(),
            usedphysicalmemory: (totalmem-(os[0].FreePhysicalMemory/1024)).toFixed(),
            percentphysicalmemory: (((totalmem-(os[0].FreePhysicalMemory/1024)).toFixed() / totalmem) * 100).toFixed()
        },
        disk: disk
    }; 
    */
    
    sendData(machine);
    return machine;
}

async function firstInit() {
    let os = await wmicHandler('os', [
        'csname',
        'caption',
        'freephysicalmemory',
        'lastbootuptime',
        'localdatetime'
    ]);

    let cpu = await wmicHandler('cpu', [
        'addresswidth',
        'datawidth',
        'name',
        'numberofcores',
        'loadpercentage'        
    ]);

    let logicaldisk = await wmicHandler('logicaldisk', [
        'size',
        'freespace',
        'caption',
        'drivetype',
        'description',
        'name',
        'volumename'
    ]);

    let computersystem = await wmicHandler('computersystem', [
        'totalphysicalmemory'
    ]);

    let bootDate = os[0].LastBootUpTime.split('.')[0];
    let localDate = os[0].LocalDateTime.split('.')[0];
    bootDate = `${bootDate.slice(6, 8)}/${bootDate.slice(4, 6)}/${bootDate.slice(0, 4)} ${bootDate.slice(8, 10)}:${bootDate.slice(10, 12)}:${bootDate.slice(12, 14)}`;
    localDate = `${localDate.slice(6, 8)}/${localDate.slice(4, 6)}/${localDate.slice(0, 4)} ${localDate.slice(8, 10)}:${localDate.slice(10, 12)}:${localDate.slice(12, 14)}`;

    totalmem = (computersystem[0].TotalPhysicalMemory/1024)/1024;
    
    //console.log(logicaldisk)

    let disk = await diskHandler(logicaldisk);    

    machine = {
        os: {
            csname: os[0].CSName,
            caption: os[0].Caption,
            architecture: cpu[0].AddressWidth,
            lastbootuptime: bootDate,
            localdatetime: localDate
        },
        cpu: {
            name: cpu[0].Name,
            numberofcores: cpu[0].NumberOfCores,
            loadpercentage: cpu[0].LoadPercentage,
            architecture: cpu[0].DataWidth
        },
        memory:{
            totalphysicalmemory: totalmem.toFixed(),
            freephysicalmemory: (os[0].FreePhysicalMemory/1024).toFixed(),
            usedphysicalmemory: (totalmem-(os[0].FreePhysicalMemory/1024)).toFixed(),
            percentphysicalmemory: (((totalmem-(os[0].FreePhysicalMemory/1024)).toFixed() / totalmem) * 100).toFixed()
        },
        disk: disk
    };

    sendData(machine);
    return machine;
}

const ajax = ({type, url, data}) => {     
    return new Promise((resolve, reject)=>{
        let options = {
            url
        };
        if(!type){
            options.type = 'GET';
        } else {
            options.type = type;
        }

        if(data) options.data = data;

        $.ajax(options)
        .done((result) => {
            resolve(result);
        })
        .fail(() => {
            reject({error: 'ERROR IN --> '+url+' <--'});
        });
    });
};

/*
setInterval(()=>{
    new powershell(`
    $wmio = Get-WmiObject win32_operatingsystem -ComputerName '127.0.0.1'
    $LocalTime = [management.managementDateTimeConverter]::ToDateTime($wmio.localdatetime)
    $LastBootUptime = [management.managementDateTimeConverter]::ToDateTime($wmio.lastbootuptime)
    $timespan = $localTime - $lastBootUptime
    $timespan
    `)
    .on("output", data => {
        console.log(data);
    });
    
},5000)

*/
