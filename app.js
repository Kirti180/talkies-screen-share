const PRE = "WORK";
const SUF = "DESK";

var room_id;
// THESE ALL ARE MEDIA CALL HERE________
const getUserMedia =
  navigator.getUserMedia ||
  navigator.webkitGetUserMedia ||
  navigator.mozGetUserMedia;
var local_stream;
var screenStream;
const controls = document.getElementById("down-control");
controls.style.display = "none";

var peer = null;
var currentPeer = null;
var screenSharing = false;

// create room function...
async function createRoom() {

  console.log("Room has been created");
  const room = Math.floor(Math.random() * 900) + 100;

  // check room should not empty.
  if (room == " " || room == " ") {
    alert("Please submit room id");
    return;
  }
  const request = await fetch(`https://video-chat-rbe8.onrender.com/room/create`, {
    method: "POST",
    headers: {
      "content-type": "application/json"
    },
    body: JSON.stringify({ roomID: room, type: "screenshare" })
  });
  controls.style.display = "block";
  room_id = PRE + room + SUF;
  peer = new Peer(room_id);
  Swal.fire(`Your Room ID is ${room}`);
  peer.on("open", (id) => {
    console.log("Peer has joined ID no", id);
    hideModal();
    // media options...
    getUserMedia(
      { video: true, audio: true },
      (stream) => {
        local_stream = stream;
        setLocalStream(local_stream);
      },
      (err) => {
        console.log(err);
      }
    );
    notify("Waiting for the peer to join.");
  });
  peer.on("call", (call) => {
    call.answer(local_stream);
    call.on("stream", (stream) => {
      setRemoteStream(stream);
    });
    currentPeer = call;
  });
}

function setLocalStream(stream) {
  let video = document.getElementById("local-video");
  video.srcObject = stream;
  video.muted = true;
  video.play();
}

function setRemoteStream(stream) {
  let video = document.getElementById("remote-video");
  video.srcObject = stream;
  video.play();
}

function hideModal() {
  document.getElementById("entry-modal").hidden = true;
}

function notify(msg) {
  let notification = document.getElementById("notification");
  notification.innerHTML = msg;
  notification.hidden = false;

  setTimeout(() => {
    notification.hidden = true;
  }, 3000);
}

function alert() {
  Swal.fire({
    title: 'Enter Your Room Number',
    input: 'text',
    inputAttributes: {
      autocapitalize: 'off',
      placeholder: 'XXX',
      required: true,
      id: 'roomID2',
      typeof: 'number'
    },
    showCancelButton: true,
    confirmButtonText: 'Join',
    showLoaderOnConfirm: true,

    allowOutsideClick: () => !Swal.isLoading()
  })

  document.getElementsByClassName('swal2-confirm swal2-styled')[0].addEventListener("click", async()=>{
    const room = document.getElementById("roomID2").value;
    console.log(room);
    const request = await fetch(`https://video-chat-rbe8.onrender.com/room/join`, {
      method: "POST",
      headers: {
        "content-type": "application/json"
      },
      body: JSON.stringify({ roomID: room, type: "screenshare" })
    });
    const response = await request.json();
  
    if(response.ok){
      joinRoom(room);
    } else {
      Swal.fire({
        icon: 'error',
        title: 'Oops...',
        text: `${response.msg}`,
      })
    }

  })

}

async function joinRoom(room) {
  console.log("User is Joining Room");

  if (room == " " || room == "") {
    alert("Please enter room number");
    return;
  }
  room_id = PRE + room + SUF;
  controls.style.display = "block";
  hideModal();
  peer = new Peer();
  peer.on("open", (id) => {
    console.log("Connected with ID: " + id);
    getUserMedia(
      { video: true, audio: true },
      (stream) => {
        local_stream = stream;
        setLocalStream(local_stream);
        notify("Peer is Joining");
        let call = peer.call(room_id, stream);
        call.on("stream", (stream) => {
          setRemoteStream(stream);
        });
        currentPeer = call;
      },
      (err) => {
        console.log(err);
      }
    );
  });

}

// start sharing here
function startScreenShare() {
  if (screenSharing) {
    stopScreenSharing();
  }
  navigator.mediaDevices
    .getDisplayMedia({
      video: true,
    })
    .then((stream) => {
      screenStream = stream;
      let videoTrack = screenStream.getVideoTracks()[0];

      videoTrack.onended = () => {
        stopScreenSharing();
      };

      if (peer) {
        let sender = currentPeer.peerConnection.getSenders().find(function (s) {
          return s.track.kind == videoTrack.kind;
        });
        sender.replaceTrack(videoTrack);
        screenSharing = true;
      }
      console.log(screenStream);
    });
}

function stopScreenSharing() {
  // not sharing than return
  if (!screenSharing) return;

  let videoTrack = local_stream.getVideoTracks()[0];

  if (peer) {
    let sender = currentPeer.peerConnection.getSenders().find(function (s) {
      return s.track.kind == videoTrack.kind;
    });
    sender.replaceTrack(videoTrack);
  }
  screenStream.getTracks().forEach(function (track) {
    track.stop();
  });
  screenSharing = false;
}
