let stream = new MediaStream();
let suuid = $('#suuid').val();

let config = {
  // iceServers: [{
  //   urls: ["turn:numb.viagenie.ca"],
  //   username:"aquie.kang@vtouch.io",
  //   credential: "vtouch0419",
  // }]
};

const pc = new RTCPeerConnection(config);
pc.onnegotiationneeded = handleNegotiationNeededEvent;

let log = msg => {
  document.getElementById('div').innerHTML += msg + '<br>'
}

pc.ontrack = function(event) {
  stream.addTrack(event.track);
  videoElem.srcObject = stream;
  log(event.streams.length + ' track is delivered') // 2nd  1 track
}

pc.oniceconnectionstatechange = e => {
  console.log("*** " + pc.iceConnectionState)
  console.log(config)
  log(pc.iceConnectionState) 
  // 1st // checking
  // 3rd // connected
}

async function handleNegotiationNeededEvent() {
  log("handle nego"); // 0th 
  let offer = await pc.createOffer();
  console.log("offer : ");
  console.log(offer);
  log("make offer");
  await pc.setLocalDescription(offer);
  getRemoteSdp();
}

$(document).ready(function() {
  $('#' + suuid).addClass('active');
  getCodecInfo();
});


function getCodecInfo() {
  $.get("../codec/" + suuid, function(data) {
    try {
      data = JSON.parse(data);
    } catch (e) {
      console.log(e);
    } finally {
      $.each(data,function(index,value){
        pc.addTransceiver(value.Type, {
          'direction': 'sendrecv'
        })
      })
    }
  });
}

let sendChannel = null;

function getRemoteSdp() {
  $.post("../receiver/"+ suuid, {
    suuid: suuid,
    data: btoa(pc.localDescription.sdp)
  }, function(data) {
    try {
      pc.setRemoteDescription(new RTCSessionDescription({
        type: 'answer',
        sdp: atob(data)
      }))
    } catch (e) {
      console.warn(e);
    }
  });
}
