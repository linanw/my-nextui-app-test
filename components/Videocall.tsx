"use client";

import { CSSProperties, useRef, useState } from "react";
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

const Videocall = (props: { slug: string; JWT: string }) => {
  const session = props.slug;
  const jwt = props.JWT;
  const [inSession, setInSession] = useState(false);
  const client = useRef<typeof VideoClient>(ZoomVideo.createClient());
  const [isVideoMuted, setIsVideoMuted] = useState(
    true //!client.current.getCurrentUserInfo()?.bVideoOn
  );
  const [isAudioMuted, setIsAudioMuted] = useState(
    client.current.getCurrentUserInfo()?.muted ?? true
  );
  const videoContainerRef = useRef<HTMLDivElement>(null);

  const joinSession = async () => {
    await client.current.init("en-US", "Global", { patchJsMedia: true });
    client.current.on(
      "peer-video-state-change",
      (payload) => {
        void renderVideo(payload);
      }
    );
    await client.current.join(session, jwt, userName, "0000").catch((e) => {
      console.log("***" + JSON.stringify(e) + "***");
    });
    // const timelapseElement = document.createElement("div");
    // const root = createRoot(timelapseElement);
    // root.render(<Timelapse camId={"a"} />);
    // videoContainerRef.current!.appendChild(timelapseElement);
    setInSession(true);
    const mediaStream = client.current.getMediaStream();
    // @@ts-expect-error https://stackoverflow.com/questions/7944460/detect-safari-browser/42189492#42189492
    // window.safari
    //   ? await WorkAroundForSafari(client.current)
    //   : await mediaStream.startAudio();
    setIsAudioMuted(true); //client.current.getCurrentUserInfo().muted ?? true);
    // await mediaStream.startVideo();
    setIsVideoMuted(true); //!client.current.getCurrentUserInfo().bVideoOn);
    // await renderVideo({
    //   action: "Start",
    //   userId: client.current.getCurrentUserInfo().userId,
    // });
  };

  const sendCommand = async (command: string) => {
    await client.current.getCommandClient().send(command);
  }

  const renderVideo = async (event: {
    action: "Start" | "Stop";
    userId: number;
  }) => {
    const mediaStream = client.current.getMediaStream();
    if (event.action === "Stop") {
      const element = await mediaStream.detachVideo(event.userId);
      Array.isArray(element)
        ? element.forEach((el) => el.remove())
        : element.remove();
    } else {
      const userVideo = await mediaStream.attachVideo(
        event.userId,
        VideoQuality.Video_360P
      );
      videoContainerRef.current!.appendChild(userVideo as VideoPlayer);
      // const timelapseElement = document.createElement("div");
      // const root = createRoot(timelapseElement);
      // root.render(<Timelapse camId={"a"} />);
      // videoContainerRef.current!.appendChild(timelapseElement);
    }
  };

  const leaveSession = async () => {
    client.current.off(
      "peer-video-state-change",
      (payload: { action: "Start" | "Stop"; userId: number }) =>
        void renderVideo(payload)
    );
    await client.current.leave().catch((e) => console.log("leave error", e));
    // hard refresh to clear the state
    window.location.href = "/";
  };

  if (!inSession) { joinSession(); }




  return (
    <div className="flex h-full w-full flex-1 flex-col">
      <COI className= "bottom-right"/>
      <h1 className="text-center text-3xl font-bold mb-4 mt-0 top-left">
        Session: {session}
      </h1>
      <div
        className="flex w-full flex-1"
        style={inSession ? {} : { display: "none" }}
      >
        {/* @ts-expect-error html component */}
        <video-player-container ref={videoContainerRef} style={videoPlayerStyle} />
      </div>
      {/* {!inSession ? (
        <div className="mx-auto flex w-64 flex-col self-center">
          <div className="w-4" />
          <Button className="flex flex-1" onClick={joinSession} title="join session">
            Join
          </Button>
        </div>
      ) : ( */}
        <div className="flex w-full flex-col justify-around self-center">
          <div className="mt-4 flex w-[30rem] flex-1 justify-around self-center rounded-md bg-white p-4">
            {/* <CameraButton
              client={client}
              isVideoMuted={isVideoMuted}
              setIsVideoMuted={setIsVideoMuted}
              renderVideo={renderVideo}
            />
            <MicButton
              isAudioMuted={isAudioMuted}
              client={client}
              setIsAudioMuted={setIsAudioMuted}
            /> */}
            <Button onClick={leaveSession} title="leave session">
              <PhoneOff />
            </Button>
            <Button onClick={() => sendCommand("#l")} title="send command">
              Send Command
            </Button>
          </div>
        </div>
      {/* )} */}
      <Timelapse camId="" />
    </div>
  );
};

export default Videocall;

const videoPlayerStyle = {
  height: "100vh",
  width: "100vw",
  marginTop: "0rem",
  marginLeft: "0rem",
  marginRight: "0rem",
  alignContent: "left",
  borderRadius: "0px",
  overflow: "scroll",
} as CSSProperties;

const userName = `User-${new Date().getTime().toString().slice(8)}`;