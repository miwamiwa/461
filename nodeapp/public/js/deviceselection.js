//audioStream constraints (mic configuration)
let constraints;
// selection from input devices list
let audiosourceselection = "";
let audiosourcelabel="";


function populateDevicesList(){
  // get available input devices
  navigator.mediaDevices.enumerateDevices()
  .then(function(devices) { // takes a sec so wait for it

    // populate input devices list so they can be selected
    let devicesArea = document.getElementById("devicesGoHere");
    devices.forEach(function(device) {
      // console.log(device.kind + ": " + device.label + " id = " + device.deviceId);
      // add inputs only
      if(device.kind === 'audioinput'){
        devicesArea.innerHTML += `<br>
        <span class='clickableThingy' onclick='setDevice("${device.deviceId}","${device.label}")'>
        ${device.label}
        </span>`;
      }
    }
  );
  // set default input selection
  audiosourceselection = devices[0].deviceId;
  audiosourcelabel= devices[0].label;
  // update 'constraints' object (used when setting up mic input)
  devicesReady();
})
// in case theres some problem getting devices list
.catch(function(err) {
  console.log(err.name + ": " + err.message);
});
}

// devicesReady()
//
// triggered when devices list is obtained

function devicesReady(){
  // update mic input setup object
  constraints = {
    audio: {deviceId: audiosourceselection ? {exact: audiosourceselection} : undefined},
    video: false,
  };

  let devicesArea = document.getElementById("devicesGoHere");
  devicesArea.style.display="none";

  let deviceButton = document.getElementById("deviceButton");
  deviceButton.style.display="block";

  let selected = document.getElementById("selectedDevice");
  selected.innerHTML=audiosourceselection+"<br>"+audiosourcelabel;
}

// triggered on interaction with the on screen button
function deviceSelection(){
  let devicesArea = document.getElementById("devicesGoHere");
  devicesArea.style.display="block";

  let deviceButton = document.getElementById("deviceButton");
  deviceButton.style.display="none";
}



// setDevice()
// called when an input device is selected from the devices list.
function setDevice(id,label){
  audiosourceselection = id;
  audiosourcelabel=label;
  devicesReady();
}
