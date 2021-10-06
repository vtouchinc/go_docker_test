let stream = new MediaStream();
let suuid = $("#suuid").val();

let config = {
  iceServers: [
    {
      urls: ["turn:192.168.0.50"],
      username: "vtouch",
      credential: "vtouch0419",
    },
    // {
    //   urls: ["stun:stun.l.google.com:19302"],
    // }
  ],
};

console.log();
console.log("===================================");
console.log(JSON.stringify(config, null, 2));
console.log("===================================");
console.log();

const pc = new RTCPeerConnection(config);
pc.onnegotiationneeded = handleNegotiationNeededEvent;

let log = (msg) => {
  document.getElementById("div").innerHTML += msg + "<br>";
};

pc.ontrack = function (event) {
  stream.addTrack(event.track);
  videoElem.srcObject = stream;
  log(event.streams.length + " track is delivered"); // 2nd  1 track
};

function parseSDP(sdp, gap) {
  let parse = sdp.split("\n");
  parse.forEach((e, idx) => {
    if (e.indexOf("candidate") > -1) {
      let word = e.split(" ");
      console.log(gap + idx + " " + word[7] + " " + word[2] + " " + word[4] + " " + word[5] + " " + word[9] + " " + word[11] + " ");
    }
  });
}

function showDesc() {
  if (pc.localDescription === null) {
    console.log("    local : x ");
  } else {
    console.log("    local : " + pc.localDescription.type);
    parseSDP(pc.localDescription.sdp, "      ");
  }

  if (pc.remoteDescription === null) {
    console.log("    remote : x ");
  } else {
    console.log("    remote : " + pc.remoteDescription.type);
    parseSDP(pc.remoteDescription.sdp, "      ");
  }
}

pc.onconnectionstatechange = (consta) => {
  console.log("con state: " + pc.connectionState);
};

pc.onsignalingstatechange = (sigst) => {
  console.log("  signal state: " + pc.signalingState);
  showDesc();
};

pc.onicegatheringstatechange = (icega) => {
  console.log("  ice gathering state : " + pc.iceGatheringState);
};

pc.onicecandidateerror = (err) => {
  console.log("  ICE ERRROR : ");
  console.log(err);
};

pc.oniceconnectionstatechange = (e) => {
  console.log("ICE CON CHANGE ============================================= " + pc.iceConnectionState);
  log(pc.iceConnectionState);
  // 1st // checking
  // 3rd // connected
};

pc.onicecandidate = (cand) => {
  if (cand.candidate === null) {
    console.log("!!!!!!!!!!!!!!!!!  candidate NULL ");
  } else {
    console.log("    ice cand =============================== ");
    // console.log(cand.candidate);
    console.log("      " + cand.candidate.type + " " + cand.candidate.protocol + " " + cand.candidate.address + " " + cand.candidate.port + " " + cand.candidate.relatedAddress + " " + cand.candidate.relatedPort);
    console.log(" >>>  ");
    showDesc();
  }
};

async function handleNegotiationNeededEvent() {
  log("handle nego"); // 0th
  let offer = await pc.createOffer();
  console.log("offer : ");
  // console.log(offer.sdp);
  log("make offer");
  await pc.setLocalDescription(offer);
  setTimeout(() => {
    getRemoteSdp();
  }, 5000);
}

$(document).ready(function () {
  $("#" + suuid).addClass("active");
  getCodecInfo();
});

function getCodecInfo() {
  // console.log( "getcodecinfo");
  $.get("../codec/" + suuid, function (data) {
    try {
      // console.log("suuid : " + suuid);
      // console.log("data : " + data );
      data = JSON.parse(data);
    } catch (e) {
      console.log(e);
    } finally {
      $.each(data, function (index, value) {
        // 'video'
        pc.addTransceiver(value.Type, {
          direction: "recvonly",
        });
      });
    }
  });
}

let sendChannel = null;

function getRemoteSdp() {
  console.log();
  console.log("POST ======================================");
  parseSDP(pc.localDescription.sdp);
  console.log();

  $.post(
    "../receiver/" + suuid,
    {
      suuid: suuid,
      data: btoa(pc.localDescription.sdp),
    },
    function (data) {
      try {
        pc.setRemoteDescription(
          new RTCSessionDescription({
            type: "answer",
            sdp: atob(data),
          })
        );
      } catch (e) {
        console.warn(e);
      }
    }
  );
}

// Create a client instance
//client = new Paho.MQTT.Client(location.hostname, Number(location.port), "clientId");
client = new Paho.MQTT.Client("192.168.0.20", 30040, "web");

// set callback handlers
client.onConnectionLost = onConnectionLost;
client.onMessageArrived = onMessageArrived;

// connect the client
client.connect({ onSuccess: onConnect });

// called when the client connects
function onConnect() {
  console.log("MQTT CLIENT ~~~~~~~~~~~~~~~~~~");
  // Once a connection has been made, make a subscription and send a message.
  console.log("onConnect");
  client.subscribe("cam_detect");
  // message = new Paho.MQTT.Message("Hello");
  // message.destinationName = "World";
  // client.send(message);
}

// called when the client loses its connection
function onConnectionLost(responseObject) {
  if (responseObject.errorCode !== 0) {
    console.log("onConnectionLost:" + responseObject.errorMessage);
  }
}

let canvas = undefined;

// called when a message arrives
function onMessageArrived(message) {
  console.log("onMessageArrived:" + message.payloadString);

  let divp = document.getElementById("remoteVideos");
  divp.style.display = "inline-block";
  let video = document.getElementById("videoElem");

  if (canvas === undefined && video.videoWidth > 0) {
    //Criando um canvas que vai guardar a imagem temporariamente
    canvas = document.createElement("canvas");
    canvas.style.position = "absolute";
    divp.appendChild(canvas);
    canvas.style.top = "0px";
    canvas.offsetLeft = 0;
    canvas.offsetTop = 0;
    canvas.style.left = "0px";
    canvas.width = divp.clientWidth;
    canvas.height = divp.clientHeight;
    console.log(" MADE CANVAS ~~~~~~~~~~~~");
  }

  if (canvas !== undefined) {
    let ctx = canvas.getContext("2d");
    let word = message.payloadString.split(",");
    let scalex = (1.0 / video.videoWidth) * canvas.width;
    let scaley = (1.0 / video.videoHeight) * canvas.height;

    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.strokeStyle = `rgba(255,0,0,1.0)`;
    ctx.lineWidth = 3;
    ctx.strokeRect(word[0] * scalex, word[1] * scaley, (Number(word[2]) - Number(word[0])) * scalex, (Number(word[3]) - Number(word[1])) * scaley);
  }
}

console.log("MQTT CLIENT load ~~~~~~~~~~~~~~~~~~");
