//dot2SMC-Mixer v 0.98 by ArtGateOne

var easymidi = require("easymidi");
var W3CWebSocket = require("websocket").w3cwebsocket;
var client = new W3CWebSocket("ws://localhost:80/"); //U can change localhost(127.0.0.1) to Your console IP address

//config
var midi_in = "SMC-Mixer"; //set correct midi in device name
var midi_out = "SMC-Mixer"; //set correct midi out device name
var change_pages = 0; //Change pages 0 = OFF, 1 = ON midi, 2 = ON midi + onpc MA2
var wing = 1; //Select wing mode: 0 = core (faders 1-6 + Master Sections), 1 = (faders 1 - 8), 2 = (faderes 9-15 + GM)
var encoder_mode = 0; // 0 = MA encoders 1 2 3 4, 1 = Speed masters, 2 = custom fader, 3 = custom command , 4 = custom attribute <-------- only 0 ! beta ...work in progress
var fader8_GM = 0; //Fader 8 Grand Master: 0 = OFF, 1 = ON (only core)


//custom commands for buttons 1-11
var button_1_on = "";
var button_1_off = "";
var button_2_on = "";
var button_2_off = "";
var button_3_on = "";
var button_3_off = "";
var button_4_on = "";
var button_4_off = "";
var button_5_on = "";
var button_5_off = "";
var button_6_on = "";
var button_6_off = "";
var button_7_on = "";
var button_7_off = "";
var button_8_on = "";
var button_8_off = "";
var button_9_on = "";
var button_9_off = "";
var button_10_on = "";
var button_10_off = "";
var button_11_on = "clear";
var button_11_off = "";

//----------------------------------------------------------------------------------------------------- beta work in progress

//ENCODER FADER COMMAND
var encoder_1 = "";
var encoder_2 = "";
var encoder_3 = "";
var encoder_4 = "";
var encoder_5 = "";
var encoder_6 = "";
var encoder_7 = "";
var encoder_8 = "";


//ENCODER ATTRIBUTE COMMAND
var attribute_1 = "";
var attribute_2 = "";
var attribute_3 = "";
var attribute_4 = "";
var attribute_5 = "";
var attribute_6 = "";
var attribute_7 = "";
var attribute_8 = "";



//Master Section (core)
var fader7 = "1.1"; //Core fader L SpecialMaster nr
var fader8 = "1.2"; //Core fader R SpecialMaster nr

//not change (fader 7 8 def feedback)
var fader7_val = 15872; //default fader position for core L master fader
var fader8_val = 128; //default fader position for core R master fader


//-------------------------------------------------------------------------------- END config

const prevFaderValues = new Array(8).fill(null);
const prevNoteStates = {};

if (fader8_GM == 1 || wing == 2) {
  fader8 = "2.1";
  fader8_val = 15872;
}

// Tablica wartości enkoderów (zakres 0–100)
let encoderValues = Array(9).fill(0);

// Zmienna globalna dla aktualnej wartości enkodera
let encoder = 0;

var speedmaster1 = 60;
var speedmaster2 = 60;
var speedmaster3 = 60;
var speedmaster4 = 60;
var blackout = 0;
var grandmaster = 100;
var gmvalue = 43;
var session = 0;
var pageIndex = 0;
const page = pageIndex + 1;

var request = 0;
var interval_on = 0;
var matrix = [];

var exec = JSON.parse(
  '{"index":[[0,1,2,3,4,5,6,7],[0,1,2,3,4,5,6,7],[8,9,10,11,12,13,14,15]]}'
);

let button_on = [];
let button_off = [];

let mapping = {
  94: 1,
  93: 2,
  95: 3,
  91: 4,
  92: 5,
  46: 6,
  47: 7,
  96: 8,
  97: 9,
  98: 10,
  99: 11,
};

for (let key in mapping) {
  let num = mapping[key];
  button_on[key] = eval("button_" + num + "_on");
  button_off[key] = eval("button_" + num + "_off");
}

function interval() {
  if (session > 0) {
    if (wing == 2) {
      client.send(
        '{"requestType":"playbacks","startIndex":[0],"itemsCount":[15],"pageIndex":' +
          pageIndex +
          ',"itemsType":[2],"view":2,"execButtonViewMode":0,"buttonsViewMode":0,"session":' +
          session +
          ',"maxRequests":1}'
      );
    }
    if (wing == 1) {
      client.send(
        '{"requestType":"playbacks","startIndex":[0],"itemsCount":[15],"pageIndex":' +
          pageIndex +
          ',"itemsType":[2],"view":2,"execButtonViewMode":0,"buttonsViewMode":0,"session":' +
          session +
          ',"maxRequests":1}'
      );
    }
    if (wing === 0) {
      client.send(
        '{"requestType":"playbacks","startIndex":[0],"itemsCount":[15],"pageIndex":' +
          pageIndex +
          ',"itemsType":[2],"view":2,"execButtonViewMode":0,"buttonsViewMode":0,"session":' +
          session +
          ',"maxRequests":1}'
      );
    }
  }
}

//setInterval(interval, 100);

//display info
console.log("MA2 SMC-Mixer");
console.log(" ");

//display all midi devices
console.log("Midi IN");
console.log(easymidi.getInputs());
console.log("Midi OUT");
console.log(easymidi.getOutputs());

console.log(" ");

console.log("Connecting to " + midi_in);

//open midi device
var input = new easymidi.Input(midi_in);
var output = new easymidi.Output(midi_out);

for (var i = 0; i < 128; i++) {
  output.send("noteon", { note: i, velocity: 0, channel: 0 });
}

if (wing == 1) {
  matrix = [
    0, 1, 2, 3, 4, 5, 6, 7, 0, 1, 2, 3, 4, 5, 6, 7, 0, 1, 2, 3, 4, 5, 6, 7, 0,
    1, 2, 3, 4, 5, 6, 7,
  ];
} else if (wing == 2) {
  matrix = [
    8, 9, 10, 11, 12, 13, 14, 15, 8, 9, 10, 11, 12, 13, 14, 15, 8, 9, 10, 11,
    12, 13, 14, 15, 8, 9, 10, 11, 12, 13, 14, 15,
  ];
  output.send("noteon", { note: 31, velocity: 127, channel: 0 });
  output.send("pitch", { value: fader8_val, channel: 7 });
} else if (wing == 0) {
  matrix = [
    0, 1, 2, 3, 4, 5, 6, 7, 0, 1, 2, 3, 4, 5, 6, 7, 0, 1, 2, 3, 4, 5, 6, 7, 0,
    1, 2, 3, 4, 5, 6, 7,
  ];
  output.send("pitch", { value: fader7_val, channel: 6 });
  output.send("pitch", { value: fader8_val, channel: 7 });
  output.send("noteon", { note: 7, velocity: 127, channel: 0 });
  output.send("noteon", { note: 15, velocity: 127, channel: 0 });
  output.send("noteon", { note: 23, velocity: 127, channel: 0 });
  if (fader8_GM == 1) {
    output.send("pitch", { value: fader8_val, channel: 7 });
  }
}

if (change_pages > 0) {
  output.send("noteon", { note: 94, velocity: 127, channel: 0 });
}

input.on("cc", function (msg) {
  const encoder_step = msg.value > 60 ? -1 : 1;
  if (encoder_mode == 0) {
    //canbus

    if ([16, 17, 18, 19].includes(msg.controller)) {
      client.send(
        '{"command":LUA "gma.canbus.encoder(' +
          (msg.controller - 16) +
          "," +
          encoder_step +
          ',nil)","session":' +
          session +
          ',"requestType":"command","maxRequests":0}'
      );
    }
  } else if (encoder_mode == 1) {
    // MIXER Speed masters

    if (msg.controller == 16) {
      //SpeedMaster 1
      if (msg.value < 60) {
        speedmaster1 = speedmaster1 + msg.value;
      } else {
        speedmaster1 = speedmaster1 + (msg.value - 128);
      }
      if (speedmaster1 < 0) {
        speedmaster1 = 0;
      }
      client.send(
        '{"command":"SpecialMaster 3.1 At ' +
          speedmaster1 +
          '","session":' +
          session +
          ',"requestType":"command","maxRequests":0}'
      );
    }

    if (msg.controller == 17) {
      //SpeedMaster 2
      if (msg.value < 60) {
        speedmaster2 = speedmaster2 + msg.value;
      } else {
        speedmaster2 = speedmaster2 + (msg.value - 128);
      }
      if (speedmaster2 < 0) {
        speedmaster2 = 0;
      }
      client.send(
        '{"command":"SpecialMaster 3.2 At ' +
          speedmaster2 +
          '","session":' +
          session +
          ',"requestType":"command","maxRequests":0}'
      );
    }

    if (msg.controller == 18) {
      //SpeedMaster 3
      if (msg.value < 60) {
        speedmaster3 = speedmaster3 + msg.value;
      } else {
        speedmaster3 = speedmaster3 + (msg.value - 128);
      }
      if (speedmaster3 < 0) {
        speedmaster3 = 0;
      }
      client.send(
        '{"command":"SpecialMaster 3.3 At ' +
          speedmaster3 +
          '","session":' +
          session +
          ',"requestType":"command","maxRequests":0}'
      );
    }

    if (msg.controller == 19) {
      //SpeedMaster 4
      if (msg.value < 60) {
        speedmaster4 = speedmaster4 + msg.value;
      } else {
        speedmaster4 = speedmaster4 + (msg.value - 128);
      }
      if (speedmaster4 < 0) {
        speedmaster4 = 0;
      }
      client.send(
        '{"command":"SpecialMaster 3.4 At ' +
          speedmaster4 +
          '","session":' +
          session +
          ',"requestType":"command","maxRequests":0}'
      );
    }
  } else if (encoder_mode == 2) {
    if (msg.controller == 16) {
      //User1 Encoder 1
      if (msg.value < 60) {
        client.send(
          '{"requestType":"encoder","name":' +
            user1_encoder1 +
            ',"value":' +
            msg.value +
            ',"session":' +
            session +
            '","maxRequests":0}'
        );
      } else {
        client.send(
          '{"requestType":"encoder","name":' +
            user1_encoder1 +
            ',"value":' +
            (msg.value - 128) +
            ',"session":' +
            session +
            '","maxRequests":0}'
        );
      }
    } else if (msg.controller == 17) {
      //User1 Encoder 2
      if (msg.value < 60) {
        client.send(
          '{"requestType":"encoder","name":' +
            user1_encoder2 +
            ',"value":' +
            msg.value +
            ',"session":' +
            session +
            '","maxRequests":0}'
        );
      } else {
        client.send(
          '{"requestType":"encoder","name":' +
            user1_encoder2 +
            ',"value":' +
            (msg.value - 128) +
            ',"session":' +
            session +
            '","maxRequests":0}'
        );
      }
    } else if (msg.controller == 18) {
      //User1 Encoder 3
      if (msg.value < 60) {
        client.send(
          '{"requestType":"encoder","name":' +
            user1_encoder3 +
            ',"value":' +
            msg.value +
            ',"session":' +
            session +
            '","maxRequests":0}'
        );
      } else {
        client.send(
          '{"requestType":"encoder","name":' +
            user1_encoder3 +
            ',"value":' +
            (msg.value - 128) +
            ',"session":' +
            session +
            '","maxRequests":0}'
        );
      }
    } else if (msg.controller == 19) {
      //User1 Encoder 4
      if (msg.value < 60) {
        client.send(
          '{"requestType":"encoder","name":' +
            user1_encoder4 +
            ',"value":' +
            msg.value +
            ',"session":' +
            session +
            '","maxRequests":0}'
        );
      } else {
        client.send(
          '{"requestType":"encoder","name":' +
            user1_encoder4 +
            ',"value":' +
            (msg.value - 128) +
            ',"session":' +
            session +
            '","maxRequests":0}'
        );
      }
    }
  } else if (encoder_mode == 3) {
    const controllerIndex = msg.controller - 15;

  if (controllerIndex > 0 && controllerIndex <= 8) {
    const step = msg.value > 60 ? -1 : 1;

    // Aktualizacja wartości enkodera z ograniczeniem
    encoderValues[controllerIndex] = Math.min(
      100,
      Math.max(0, encoderValues[controllerIndex] + step)
    );

    // Ustawienie zmiennej encoder na aktualną wartość
    encoder = encoderValues[controllerIndex];

    // Wyświetlenie informacji
    console.log(`Encoder ${controllerIndex}: ${encoder} step: ${step} ; Page ${page}`);
  }
  } else {
    if (msg.controller == 16) {
      //DIM
      if (msg.value < 60) {
        client.send(
          '{"requestType":"encoder","name":"DIM","value":' +
            msg.value +
            ',"session":' +
            session +
            '","maxRequests":0}'
        );
      } else {
        client.send(
          '{"requestType":"encoder","name":"DIM","value":' +
            (msg.value - 64) * -1 +
            ',"session":' +
            session +
            '","maxRequests":0}'
        );
      }
    }

    if (msg.controller == 17) {
      //PAN
      if (msg.value < 60) {
        client.send(
          '{"requestType":"encoder","name":"PAN","value":' +
            msg.value +
            ',"session":' +
            session +
            '","maxRequests":0}'
        );
      } else {
        client.send(
          '{"requestType":"encoder","name":"PAN","value":' +
            (msg.value - 64) * -1 +
            ',"session":' +
            session +
            '","maxRequests":0}'
        );
      }
    }

    if (msg.controller == 18) {
      //TILT
      if (msg.value < 60) {
        client.send(
          '{"requestType":"encoder","name":"TILT","value":' +
            msg.value +
            ',"session":' +
            session +
            '","maxRequests":0}'
        );
      } else {
        client.send(
          '{"requestType":"encoder","name":"TILT","value":' +
            (msg.value - 64) * -1 +
            ',"session":' +
            session +
            '","maxRequests":0}'
        );
      }
    }

    if (msg.controller == 19) {
      //SpeedMaster 1
      if (msg.value < 60) {
        speedmaster1 = speedmaster1 + msg.value;
      } else {
        speedmaster1 = speedmaster1 - (msg.value - 64);
      }
      if (speedmaster1 < 0) {
        speedmaster1 = 0;
      }
      client.send(
        '{"command":"SpecialMaster 3.1 At ' +
          speedmaster1 +
          '","session":' +
          session +
          ',"requestType":"command","maxRequests":0}'
      );
    }

    if (msg.controller == 20) {
      //SpeedMaster 2
      if (msg.value < 60) {
        speedmaster2 = speedmaster2 + msg.value;
      } else {
        speedmaster2 = speedmaster2 - (msg.value - 64);
      }
      if (speedmaster2 < 0) {
        speedmaster2 = 0;
      }
      client.send(
        '{"command":"SpecialMaster 3.2 At ' +
          speedmaster2 +
          '","session":' +
          session +
          ',"requestType":"command","maxRequests":0}'
      );
    }

    if (msg.controller == 21) {
      //SpeedMaster 3
      if (msg.value < 60) {
        speedmaster3 = speedmaster3 + msg.value;
      } else {
        speedmaster3 = speedmaster3 - (msg.value - 64);
      }
      if (speedmaster3 < 0) {
        speedmaster3 = 0;
      }
      client.send(
        '{"command":"SpecialMaster 3.3 At ' +
          speedmaster3 +
          '","session":' +
          session +
          ',"requestType":"command","maxRequests":0}'
      );
    }

    if (msg.controller == 22) {
      //SpeedMaster 4
      if (msg.value < 60) {
        speedmaster4 = speedmaster4 + msg.value;
      } else {
        speedmaster4 = speedmaster4 - (msg.value - 64);
      }
      if (speedmaster4 < 0) {
        speedmaster4 = 0;
      }
      client.send(
        '{"command":"SpecialMaster 3.4 At ' +
          speedmaster4 +
          '","session":' +
          session +
          ',"requestType":"command","maxRequests":0}'
      );
    }

    if (msg.controller == 23) {
      if (msg.value < 60) {
        grandmaster = grandmaster + msg.value;
      } else {
        grandmaster = grandmaster - (msg.value - 64);
      }
      if (grandmaster > 100) {
        grandmaster = 100;
      } else if (grandmaster < 0) {
        grandmaster = 0;
      }

      gmvalue = grandmaster / 10 + 33;

      if (blackout == 0) {
        client.send(
          '{"command":"SpecialMaster 2.1 At ' +
            grandmaster +
            '","session":' +
            session +
            ',"requestType":"command","maxRequests":0}'
        );
      }

      if (blackout == 1) {
        gmvalue = gmvalue - 32;
      }
      output.send("cc", { controller: 55, value: gmvalue, channel: 0 });
    }
  }
});

input.on("pitch", function (msg) {
  //send fader pos do dot2
  if (wing == 0) {
    if (msg.channel < 6) {
      const clampedValue = Math.min(Math.max(msg.value, 756), 15872);
      const faderValue = mapRange(clampedValue, 756, 15872, 0, 1);
      client.send(
        '{"requestType":"playbacks_userInput","execIndex":' +
          exec.index[wing][msg.channel] +
          ',"pageIndex":' +
          pageIndex +
          ',"faderValue":' +
          faderValue +
          ',"type":1,"session":' +
          session +
          ',"maxRequests":0}'
      );
    } else if (msg.channel == 6) {
      const clampedValue = Math.min(Math.max(msg.value, 756), 15872);
      let faderValue = mapRange(clampedValue, 756, 15872, 0, 100);
      faderValue = Math.round(faderValue);
      fader7_val = msg.value;
      output.send("pitch", { value: msg.value, channel: 6 });
      client.send(
        '{"command":"SpecialMaster ' +
          fader7 +
          " At " +
          faderValue +
          '","session":' +
          session +
          ',"requestType":"command","maxRequests":0}'
      );
    } else if (msg.channel == 7) {
      const clampedValue = Math.min(Math.max(msg.value, 756), 15872);
      let faderValue = mapRange(clampedValue, 756, 15872, 0, 100);
      faderValue = Math.round(faderValue);
      fader8_val = msg.value;
      if (fader8 == "2.1") {
        grandmaster = faderValue;
        if (blackout == 1) {
          faderValue = 0;
        }
      }
      output.send("pitch", { value: msg.value, channel: 7 });
      client.send(
        '{"command":"SpecialMaster ' +
          fader8 +
          " At " +
          faderValue +
          '","session":' +
          session +
          ',"requestType":"command","maxRequests":0}'
      );
    }
  } else if (wing == 1 || wing == 2) {
    if (msg.channel == 7 && wing == 2) {
      const clampedValue = Math.min(Math.max(msg.value, 756), 15872);
      let faderValue = mapRange(clampedValue, 756, 15872, 0, 100);
      faderValue = Math.round(faderValue);
      fader8_val = msg.value;
      if (fader8 == "2.1") {
        grandmaster = faderValue;
        if (blackout == 1) {
          faderValue = 0;
        }
      }
      output.send("pitch", { value: msg.value, channel: 7 });
      client.send(
        '{"command":"SpecialMaster ' +
          fader8 +
          " At " +
          faderValue +
          '","session":' +
          session +
          ',"requestType":"command","maxRequests":0}'
      );
    } else {
      const clampedValue = Math.min(Math.max(msg.value, 756), 15872);
      const faderValue = mapRange(clampedValue, 756, 15872, 0, 1);
      client.send(
        '{"requestType":"playbacks_userInput","execIndex":' +
          exec.index[wing][msg.channel] +
          ',"pageIndex":' +
          pageIndex +
          ',"faderValue":' +
          faderValue +
          ',"type":1,"session":' +
          session +
          ',"maxRequests":0}'
      );
    }
  }
});

input.on("noteon", function (msg) {
  if (msg.note <= 31) {
    if (
      (msg.note == 6 && wing == 0) ||
      (msg.note == 7 && wing == 0) ||
      (msg.note == 14 && wing == 0) ||
      (msg.note == 15 && wing == 0) ||
      (msg.note == 22 && wing == 0) ||
      (msg.note == 23 && wing == 0) ||
      (msg.note == 30 && wing == 0) ||
      (msg.note == 31 && wing == 0) ||
      (msg.note == 7 && wing == 2) ||
      (msg.note == 15 && wing == 2) ||
      (msg.note == 23 && wing == 2) ||
      (msg.note == 31 && wing == 2)
    ) {
      if (msg.note == 7 && msg.velocity == 127) {
        //Go Forward core
        client.send(
          '{"command":"DefGoForward","session":' +
            session +
            ',"requestType":"command","maxRequests":0}'
        );
      } else if (msg.note == 15 && msg.velocity == 127) {
        //Go Back core
        client.send(
          '{"command":"DefGoBack","session":' +
            session +
            ',"requestType":"command","maxRequests":0}'
        );
      } else if (msg.note == 23 && msg.velocity == 127) {
        //Go Pause core
        client.send(
          '{"command":"DefGoPause","session":' +
            session +
            ',"requestType":"command","maxRequests":0}'
        );
      } else if (msg.note == 31) {
        //B.O.

        if (msg.velocity == 127) {
          if (wing == 2) {
            output.send("noteon", {
              note: msg.note,
              velocity: 0,
              channel: 0,
            });
            output.send("noteon", {
              note: 7,
              velocity: msg.velocity,
              channel: 0,
            });
          } else {
            output.send("noteon", {
              note: msg.note,
              velocity: msg.velocity,
              channel: 0,
            });
          }
          blackout = 1;
          //output.send("pitch", { value: msg.value, channel: 7 });
          client.send(
            '{"command":"SpecialMaster 2.1 At 0","session":' +
              session +
              ',"requestType":"command","maxRequests":0}'
          );
          if (fader8 == "2.1") {
            //output.send("pitch", { value: 756, channel: 7 });
          }
        } else if (msg.velocity == 0) {
          if (wing == 2) {
            output.send("noteon", {
              note: msg.note,
              velocity: 127,
              channel: 0,
            });
            output.send("noteon", {
              note: 7,
              velocity: msg.velocity,
              channel: 0,
            });
          } else {
            output.send("noteon", {
              note: msg.note,
              velocity: msg.velocity,
              channel: 0,
            });
          }
          blackout = 0;
          client.send(
            '{"command":"SpecialMaster 2.1 At ' +
              grandmaster +
              '","session":' +
              session +
              ',"requestType":"command","maxRequests":0}'
          );
          if (fader8 == "2.1") {
            output.send("pitch", { value: fader8_val, channel: 7 });
          }
        }
      }
    } else {
      const buttonOrder = [1, 2, 0];

      if (msg.note >= 8 && msg.note < 32) {
        const groupIndex = Math.floor((msg.note - 8) / 8);
        const buttonId = buttonOrder[groupIndex];
        const isPressed = msg.velocity === 127;

        const payload = {
          requestType: "playbacks_userInput",
          cmdline: "",
          execIndex: matrix[msg.note],
          pageIndex,
          buttonId,
          pressed: isPressed,
          released: !isPressed,
          type: 0,
          session,
          maxRequests: 0,
        };

        client.send(JSON.stringify(payload));
      }
    }
  } else if ([91, 92, 93, 94, 95].includes(msg.note)) {
    if (change_pages > 0) {
      if (msg.velocity == 127) {
        output.send("noteon", { note: 91, velocity: 0, channel: 0 });
        output.send("noteon", { note: 92, velocity: 0, channel: 0 });
        output.send("noteon", { note: 93, velocity: 0, channel: 0 });
        output.send("noteon", { note: 94, velocity: 0, channel: 0 });
        output.send("noteon", { note: 95, velocity: 0, channel: 0 });

        output.send("noteon", { note: msg.note, velocity: 127, channel: 0 });
        if (msg.note == 94) {
          pageIndex = 0;
        } else if (msg.note == 93) {
          pageIndex = 1;
        } else if (msg.note == 95) {
          pageIndex = 2;
        } else if (msg.note == 91) {
          pageIndex = 3;
        } else if (msg.note == 92) {
          pageIndex = 4;
        }

        if (change_pages > 1) {
          client.send(
            '{"command":"FaderPage ' +
              (pageIndex + 1) +
              '","session":' +
              session +
              ',"requestType":"command","maxRequests":0}'
          );
        }
      }
    } else {
      output.send("noteon", {
        note: msg.note,
        velocity: msg.velocity,
        channel: 0,
      });
      sendCommand(msg.note, msg.velocity);
    }
  } else if ([46, 47, 96, 97, 98, 99].includes(msg.note)) {
    output.send("noteon", {
      note: msg.note,
      velocity: msg.velocity,
      channel: 0,
    });
    sendCommand(msg.note, msg.velocity);
  }
});

//WEBSOCKET-------------------
console.log("Connecting to MA2");

client.onerror = function () {
  console.log("Connection Error");
};

client.onopen = function () {
  console.log("WebSocket Client Connected");
  setInterval(interval, 80);
  function sendNumber() {
    if (client.readyState === client.OPEN) {
      var number = Math.round(Math.random() * 0xffffff);
      client.send(number.toString());
      setTimeout(sendNumber, 1000);
    }
  }
  //sendNumber();
};

client.onclose = function () {
  console.log("Client Closed");
  setInterval(interval, 0);

  for (i = 0; i <= 127; i++) {
    output.send("noteon", { note: i, velocity: 0, channel: 0 });
    sleep(10, function () {});
  }
  /*
  for (i = 0; i <= 127; i++) {
    output.send("cc", { controller: i, value: 55, channel: 0 });
    sleep(10, function () {});
  }

  for (i = 0; i <= 7; i++) {
    output.send("pitch", { value: 0, channel: i });
    sleep(10, function () {});
  }
*/
  input.close();
  output.close();
  process.exit();
};

client.onmessage = function (e) {
  request = request + 1;

  if (request > 9) {
    client.send('{"session":' + session + "}");

    client.send(
      '{"requestType":"getdata","data":"set","session":' +
        session +
        ',"maxRequests":1}'
    );

    request = 1;
  }

  if (typeof e.data === "string") {
    //console.log("Received: '" + e.data + "'");
    //console.log("-----------------");
    //console.log(e.data);

    obj = JSON.parse(e.data);

    if (obj.status == "server ready") {
      client.send('{"session":0}');
    }
    if (obj.forceLogin === true) {
      session = obj.session;
      client.send(
        '{"requestType":"login","username":"smcmixer","password":"2c18e486683a3db1e645ad8523223b72","session":' +
          obj.session +
          ',"maxRequests":10}'
      );
    }

    if (obj.session) {
      session = obj.session;
    }

    if (obj.responseType == "login" && obj.result === true) {
      if (interval_on == 0) {
        interval_on = 1;
        setInterval(interval, 100); //80
      }
      console.log("...LOGGED");
      console.log("SESSION " + session);
      if (change_pages == 2) {
        client.send(
          '{"command":"Page ' +
            (pageIndex + 1) +
            '","session":' +
            session +
            ',"requestType":"command","maxRequests":0}'
        );
      }
    }

    if (obj.responseType == "getdata") {
    }

    if (obj.responseType == "playbacks") {
      if (wing == 0) {
        for (let i = 0; i < 5; i++) {
          let v = obj.itemGroups[0].items[0][i].executorBlocks[0].fader.v;
          let midiVal = mapRange(v, 0, 1, 384, 15872);
          sendPitchIfChanged(i, midiVal);
          let isBlack = obj.itemGroups[0].items[0][i].i.c === "#000000";
          let shouldFlash = !isBlack && !obj.itemGroups[0].items[0][i].isRun;
          sendNoteIfChanged(i, obj.itemGroups[0].items[0][i].isRun * 127);
          sendNoteIfChanged(i + 8, isBlack ? 0 : 127);
          sendNoteIfChanged(i + 16, isBlack ? 0 : 127);
          sendNoteIfChanged(i + 24, shouldFlash ? 127 : 0);
        }
        let v = obj.itemGroups[0].items[1][0].executorBlocks[0].fader.v;
        let midiVal = mapRange(v, 0, 1, 384, 15872);
        sendPitchIfChanged(5, midiVal);
        let isBlack = obj.itemGroups[0].items[1][0].i.c === "#000000";
        let shouldFlash = !isBlack && !obj.itemGroups[0].items[1][0].isRun;
        sendNoteIfChanged(5, obj.itemGroups[0].items[1][0].isRun * 127);
        sendNoteIfChanged(5 + 8, isBlack ? 0 : 127);
        sendNoteIfChanged(5 + 16, isBlack ? 0 : 127);
        sendNoteIfChanged(5 + 24, shouldFlash ? 127 : 0);
      } else if (wing == 1) {
        for (let i = 0; i < 5; i++) {
          let v = obj.itemGroups[0].items[0][i].executorBlocks[0].fader.v;
          let midiVal = mapRange(v, 0, 1, 384, 15872);
          sendPitchIfChanged(i, midiVal);
          let isBlack = obj.itemGroups[0].items[0][i].i.c === "#000000";
          let shouldFlash = !isBlack && !obj.itemGroups[0].items[0][i].isRun;
          sendNoteIfChanged(i, obj.itemGroups[0].items[0][i].isRun * 127);
          sendNoteIfChanged(i + 8, isBlack ? 0 : 127);
          sendNoteIfChanged(i + 16, isBlack ? 0 : 127);
          sendNoteIfChanged(i + 24, shouldFlash ? 127 : 0);
        }
        for (let i = 0; i < 3; i++) {
          let v = obj.itemGroups[0].items[1][i].executorBlocks[0].fader.v;
          let midiVal = mapRange(v, 0, 1, 384, 15872);
          sendPitchIfChanged(i + 5, midiVal);
          let isBlack = obj.itemGroups[0].items[1][i].i.c === "#000000";
          let shouldFlash = !isBlack && !obj.itemGroups[0].items[1][i].isRun;
          sendNoteIfChanged(i + 5, obj.itemGroups[0].items[1][i].isRun * 127);
          sendNoteIfChanged(i + 5 + 8, isBlack ? 0 : 127);
          sendNoteIfChanged(i + 5 + 16, isBlack ? 0 : 127);
          sendNoteIfChanged(i + 5 + 24, shouldFlash ? 127 : 0);
        }
      } else if (wing == 2) {
        for (let i = 3; i < 5; i++) {
          let v = obj.itemGroups[0].items[1][i].executorBlocks[0].fader.v;
          let midiVal = mapRange(v, 0, 1, 384, 15872);
          sendPitchIfChanged(i - 3, midiVal);
          let isBlack = obj.itemGroups[0].items[1][i].i.c === "#000000";
          let shouldFlash = !isBlack && !obj.itemGroups[0].items[1][i].isRun;
          sendNoteIfChanged(i - 3, obj.itemGroups[0].items[1][i].isRun * 127);
          sendNoteIfChanged(i - 3 + 8, isBlack ? 0 : 127);
          sendNoteIfChanged(i - 3 + 16, isBlack ? 0 : 127);
          sendNoteIfChanged(i - 3 + 24, shouldFlash ? 127 : 0);
        }
        for (let i = 0; i < 5; i++) {
          let v = obj.itemGroups[0].items[2][i].executorBlocks[0].fader.v;
          let midiVal = mapRange(v, 0, 1, 384, 15872);
          sendPitchIfChanged(i + 2, midiVal);
          let isBlack = obj.itemGroups[0].items[2][i].i.c === "#000000";
          let shouldFlash = !isBlack && !obj.itemGroups[0].items[2][i].isRun;
          sendNoteIfChanged(i + 2, obj.itemGroups[0].items[2][i].isRun * 127);
          sendNoteIfChanged(i + 2 + 8, isBlack ? 0 : 127);
          sendNoteIfChanged(i + 2 + 16, isBlack ? 0 : 127);
          sendNoteIfChanged(i + 2 + 24, shouldFlash ? 127 : 0);
        }
      }
    }
  }
};

function sendPitchIfChanged(channel, value) {
  if (prevFaderValues[channel] !== value) {
    output.send("pitch", { channel, value });
    prevFaderValues[channel] = value;
  }
}

function sendNoteIfChanged(note, velocity, channel = 0) {
  const key = `${note}|${channel}`;
  if (prevNoteStates[key] !== velocity) {
    output.send("noteon", { note, velocity, channel });
    prevNoteStates[key] = velocity;
  }
}

function mapRange(value, inMin, inMax, outMin, outMax) {
  return ((value - inMin) * (outMax - outMin)) / (inMax - inMin) + outMin;
}

function sendCommand(note, velocity) {
  if (velocity == 127) {
    client.send(
      '{"command":"' +
        button_on[note] +
        '","session":' +
        session +
        ',"requestType":"command","maxRequests":0}'
    );
  } else if (velocity == 0) {
    client.send(
      '{"command":"' +
        button_off[note] +
        '","session":' +
        session +
        ',"requestType":"command","maxRequests":0}'
    );
  }
}

//sleep function
function sleep(time, callback) {
  var stop = new Date().getTime();
  while (new Date().getTime() < stop + time) {}
  callback();
}
