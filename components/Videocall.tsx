"use client";

import { CSSProperties, use, useEffect, useRef, useState } from "react";
import ZoomVideo, {
  type VideoClient,
  VideoQuality,
  type VideoPlayer,
} from "@zoom/videosdk";
import { CameraButton, MicButton } from "./MuteButtons";
import { PhoneOff } from "lucide-react";
import { Button } from "@nextui-org/button";
import { WorkAroundForSafari } from "@/utils/safari";
import Timelapse from "./Timelapse";
import { createRoot } from "react-dom/client";
import { COI } from "./coi";
import { CamPanel, VideoPanelMode } from "./CamPanel";

// linanw, use "async" here will have error.
const Videocall = (props: { slug: string; JWT: string }) => {
  const [suggestedMode, setSuggestedMode] = useState(VideoPanelMode.Stream);
  const session = props.slug;
  const jwt = props.JWT;
  const [inSession, setInSession] = useState(false);
  const client = useRef<typeof VideoClient>(ZoomVideo.createClient());
  const videoStopHandler = async (payload: { action: "Start" | "Stop", userId: number; }) => {
    const action = payload.action;
    const userId = payload.userId;
    if (action === "Stop") {
      console.log("**************stop", userId);
      const mediaStream = client.current.getMediaStream();
      const element = await mediaStream.detachVideo(userId);
      Array.isArray(element)
        ? element.forEach((el) => el.remove())
        : element ? element.remove() : null;
    }
  }

  const joinSession = async () => {
    console.log("joinSession");
    await client.current.init("en-US", "Global", { patchJsMedia: true });
    client.current.on(
      "peer-video-state-change",
      videoStopHandler
    );
    await client.current.join(session, jwt, userName, "0000").catch((e) => {
      console.log("***" + JSON.stringify(e) + "***");
    });
  };

  const sendCommand = async (command: string) => {
    await client.current.getCommandClient().send(command);
  }

  const leaveSession = async () => {
    client.current.off(
      "peer-video-state-change",
      videoStopHandler
    );
    await client.current.leave().catch((e) => console.log("leave error", e));
    // hard refresh to clear the state
    // window.location.href = "/";
  };

  joinSession();


  return (
    <>
      <div className="flex h-full w-full flex-1 flex-col">
        <COI className="bottom-right" />
        <h1 className="text-center text-3xl font-bold mb-4 mt-0 top-left">
          Session: {session}
        </h1>

        {/* <CamPanel videoClient={client} mode={suggestedMode} camId="default_cam7" />
        <CamPanel videoClient={client} mode={suggestedMode} camId="default_cam0" /> */}
        <CamPanel videoClient={client} mode={suggestedMode} camId="linanw-cnc_cam7" />
        <CamPanel videoClient={client} mode={suggestedMode} camId="linanw-cnc_cam0" />


        <div className="flex w-full flex-col justify-around self-center">
          <div className="mt-4 flex w-[30rem] flex-1 justify-around self-center rounded-md bg-white p-4">
            <Button onClick={leaveSession} title="leave session">
              <PhoneOff />
            </Button>
            <Button onClick={() => sendCommand("#l")} title="send command">
              Send Command
            </Button>
          </div>
        </div>
      </div>
    </>
  );
};

export default Videocall;

const videoPlayerStyle = {
  backgroundColor: "black",
  // height: "100vh",
  // width: "100vw",
  marginTop: "0rem",
  marginLeft: "0rem",
  marginRight: "0rem",
  alignContent: "center",
  borderRadius: "0px",
  overflow: "hidden",
} as CSSProperties;

const userName = `User-${new Date().getTime().toString().slice(8)}`;