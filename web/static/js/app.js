let stream = new MediaStream();
let suuid = $("#suuid").val();

let config = {
  iceServers: [
    {
      urls: ["turn:192.168.0.50"],
      username: "vtouch",
      credential: "vtouch0419",
    },
  ],
};

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
  console.log("POST ======================================");
  console.log(pc.localDescription.sdp);
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
